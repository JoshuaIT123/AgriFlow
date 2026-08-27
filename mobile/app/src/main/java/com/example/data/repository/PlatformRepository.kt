package com.example.data.repository

import com.example.data.db.AppDatabase
import com.example.data.model.CropYieldForecastResult
import com.example.data.model.FarmProfile
import com.example.data.model.PriceForecastResult
import com.example.data.model.TransactionItem
import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class PlatformRepository(private val database: AppDatabase) {

    // Exchange Rate Constants (Rwanda 2026 context)
    // 1 BTC ~= 135,000,000 RWF => 1 Satoshi = 1.35 RWF
    val rwfPerBtc: Double = 135_000_000.0
    val rwfPerSat: Double = 1.35
    val usdPerBtc: Double = 98_500.0

    val transactions: Flow<List<TransactionItem>> = database.transactionDao().getAllTransactions()
    val farmProfile: Flow<FarmProfile?> = database.farmProfileDao().getProfile()

    suspend fun initializeDefaultDataIfEmpty() {
        val count = database.transactionDao().countTransactions()
        if (count == 0) {
            val initialProfile = FarmProfile(
                id = 1,
                farmerName = "Mugisha Alain",
                phoneNumber = "+250 788 452 918",
                district = "Musanze (Kinigi)",
                cooperative = "COOPAC Coffee Cooperative",
                cropType = "Specialty Arabica Coffee",
                landSizeAres = 45.0,
                plantingMonth = "March",
                expectedHarvestMonth = "October",
                isSavingsOptedIn = true,
                savingsPercentage = 10,
                momoBalanceRwf = 168500.0,
                btcSavingsSats = 385000,
                kycVerified = true
            )
            database.farmProfileDao().insertProfile(initialProfile)

            // Seed initial transactions representing the roadmap phases
            val now = System.currentTimeMillis()
            val dayMs = 86400000L

            database.transactionDao().insertTransaction(
                TransactionItem(
                    type = "REMITTANCE",
                    amountRwf = 85000.0,
                    amountSats = 62963,
                    counterparty = "Keza Diane (Brussels, Belgium)",
                    phoneOrInvoice = "lnbc629u1pn...",
                    status = "COMPLETED",
                    timestamp = now - (dayMs * 1),
                    note = "Lightning remittance -> MTN MoMo + 10% BTC Auto-Save",
                    rail = "LIGHTNING"
                )
            )

            database.transactionDao().insertTransaction(
                TransactionItem(
                    type = "PRODUCE_PAYOUT",
                    amountRwf = 145000.0,
                    amountSats = 107407,
                    counterparty = "COOPAC Musanze Washing Station",
                    phoneOrInvoice = "INV-COOP-8891",
                    status = "COMPLETED",
                    timestamp = now - (dayMs * 3),
                    note = "120 kg Grade A Coffee Cherries Settlement",
                    rail = "MTN_MOMO"
                )
            )

            database.transactionDao().insertTransaction(
                TransactionItem(
                    type = "SAVINGS_DEPOSIT",
                    amountRwf = 20000.0,
                    amountSats = 14815,
                    counterparty = "BTC Savings Vault",
                    phoneOrInvoice = "VAULT-SAV-2026",
                    status = "COMPLETED",
                    timestamp = now - (dayMs * 6),
                    note = "Manual inflation hedge top-up from MoMo balance",
                    rail = "LIGHTNING"
                )
            )

            database.transactionDao().insertTransaction(
                TransactionItem(
                    type = "REMITTANCE",
                    amountRwf = 55000.0,
                    amountSats = 40740,
                    counterparty = "Gisa Patrick (Nairobi, Kenya)",
                    phoneOrInvoice = "lnbc407u1pn...",
                    status = "COMPLETED",
                    timestamp = now - (dayMs * 10),
                    note = "Cross-border family remittance",
                    rail = "LIGHTNING"
                )
            )
        }
    }

    suspend fun updateFarmProfile(profile: FarmProfile) {
        database.farmProfileDao().updateProfile(profile)
    }

    suspend fun updateSavingsSettings(optedIn: Boolean, percentage: Int) {
        val current = database.farmProfileDao().getProfileSync() ?: FarmProfile()
        database.farmProfileDao().updateProfile(
            current.copy(
                isSavingsOptedIn = optedIn,
                savingsPercentage = percentage
            )
        )
    }

    suspend fun processIncomingRemittance(
        senderName: String,
        amountSats: Long,
        senderLocation: String,
        targetPhone: String,
        rail: String
    ): TransactionResult {
        val currentProfile = database.farmProfileDao().getProfileSync() ?: FarmProfile()
        val totalRwf = amountSats * rwfPerSat

        val savingsPercentage = if (currentProfile.isSavingsOptedIn) currentProfile.savingsPercentage else 0
        val savingsSats = (amountSats * (savingsPercentage / 100.0)).toLong()
        val savingsRwf = savingsSats * rwfPerSat

        val netMoMoRwf = totalRwf - savingsRwf
        val newMoMoBal = currentProfile.momoBalanceRwf + netMoMoRwf
        val newSatsBal = currentProfile.btcSavingsSats + savingsSats

        // Update profile balances
        database.farmProfileDao().updateProfile(
            currentProfile.copy(
                momoBalanceRwf = newMoMoBal,
                btcSavingsSats = newSatsBal
            )
        )

        // Insert transaction record
        val tx = TransactionItem(
            type = "REMITTANCE",
            amountRwf = totalRwf,
            amountSats = amountSats,
            counterparty = "$senderName ($senderLocation)",
            phoneOrInvoice = "lnbc${(amountSats / 100)}u1${System.currentTimeMillis() % 100000}",
            status = "COMPLETED",
            timestamp = System.currentTimeMillis(),
            note = if (savingsPercentage > 0) {
                "Remittance -> ${formatRwf(netMoMoRwf)} MoMo + $savingsPercentage% (${formatSats(savingsSats)} sats) Saved"
            } else {
                "Full remittance landed in MoMo account"
            },
            rail = rail
        )
        database.transactionDao().insertTransaction(tx)

        return TransactionResult(
            success = true,
            totalRwf = totalRwf,
            netMoMoRwf = netMoMoRwf,
            savedSats = savingsSats,
            savedRwf = savingsRwf,
            newMoMoBalance = newMoMoBal,
            newSatsBalance = newSatsBal,
            transactionId = "TXN-${System.currentTimeMillis() % 1000000}"
        )
    }

    suspend fun processProducePayment(
        cooperativeName: String,
        cropType: String,
        quantityKg: Double,
        ratePerKgRwf: Double,
        buyerPhone: String
    ): TransactionResult {
        val currentProfile = database.farmProfileDao().getProfileSync() ?: FarmProfile()
        val totalRwf = quantityKg * ratePerKgRwf
        val totalSats = (totalRwf / rwfPerSat).toLong()

        val savingsPercentage = if (currentProfile.isSavingsOptedIn) currentProfile.savingsPercentage else 0
        val savingsSats = (totalSats * (savingsPercentage / 100.0)).toLong()
        val savingsRwf = savingsSats * rwfPerSat

        val netMoMoRwf = totalRwf - savingsRwf
        val newMoMoBal = currentProfile.momoBalanceRwf + netMoMoRwf
        val newSatsBal = currentProfile.btcSavingsSats + savingsSats

        database.farmProfileDao().updateProfile(
            currentProfile.copy(
                momoBalanceRwf = newMoMoBal,
                btcSavingsSats = newSatsBal
            )
        )

        val tx = TransactionItem(
            type = "PRODUCE_PAYOUT",
            amountRwf = totalRwf,
            amountSats = totalSats,
            counterparty = cooperativeName,
            phoneOrInvoice = "PRODUCE-${System.currentTimeMillis() % 100000}",
            status = "COMPLETED",
            timestamp = System.currentTimeMillis(),
            note = "$quantityKg kg $cropType settlement via Lightning Rail",
            rail = "LIGHTNING"
        )
        database.transactionDao().insertTransaction(tx)

        return TransactionResult(
            success = true,
            totalRwf = totalRwf,
            netMoMoRwf = netMoMoRwf,
            savedSats = savingsSats,
            savedRwf = savingsRwf,
            newMoMoBalance = newMoMoBal,
            newSatsBalance = newSatsBal,
            transactionId = "PROD-${System.currentTimeMillis() % 1000000}"
        )
    }

    suspend fun convertSavingsToMomo(satsToConvert: Long): Boolean {
        val currentProfile = database.farmProfileDao().getProfileSync() ?: return false
        if (satsToConvert <= 0 || satsToConvert > currentProfile.btcSavingsSats) return false

        val rwfEquivalent = satsToConvert * rwfPerSat
        val newSats = currentProfile.btcSavingsSats - satsToConvert
        val newMomo = currentProfile.momoBalanceRwf + rwfEquivalent

        database.farmProfileDao().updateProfile(
            currentProfile.copy(
                momoBalanceRwf = newMomo,
                btcSavingsSats = newSats
            )
        )

        database.transactionDao().insertTransaction(
            TransactionItem(
                type = "SAVINGS_WITHDRAW",
                amountRwf = rwfEquivalent,
                amountSats = satsToConvert,
                counterparty = "MTN MoMo Cashout",
                phoneOrInvoice = currentProfile.phoneNumber,
                status = "COMPLETED",
                timestamp = System.currentTimeMillis(),
                note = "Converted ${formatSats(satsToConvert)} sats to ${formatRwf(rwfEquivalent)}",
                rail = "MTN_MOMO"
            )
        )
        return true
    }

    suspend fun convertMomoToSavings(rwfToConvert: Double): Boolean {
        val currentProfile = database.farmProfileDao().getProfileSync() ?: return false
        if (rwfToConvert <= 0 || rwfToConvert > currentProfile.momoBalanceRwf) return false

        val satsEquivalent = (rwfToConvert / rwfPerSat).toLong()
        val newMomo = currentProfile.momoBalanceRwf - rwfToConvert
        val newSats = currentProfile.btcSavingsSats + satsEquivalent

        database.farmProfileDao().updateProfile(
            currentProfile.copy(
                momoBalanceRwf = newMomo,
                btcSavingsSats = newSats
            )
        )

        database.transactionDao().insertTransaction(
            TransactionItem(
                type = "SAVINGS_DEPOSIT",
                amountRwf = rwfToConvert,
                amountSats = satsEquivalent,
                counterparty = "BTC Savings Vault",
                phoneOrInvoice = "VAULT-ADD",
                status = "COMPLETED",
                timestamp = System.currentTimeMillis(),
                note = "Saved ${formatRwf(rwfToConvert)} into ${formatSats(satsEquivalent)} sats inflation vault",
                rail = "LIGHTNING"
            )
        )
        return true
    }

    // AI Prediction Service (Section 6.1 & 6.2 of Concept Document)
    fun getPriceTrendForecast(): PriceForecastResult {
        return PriceForecastResult(
            btcUsd = usdPerBtc,
            btcRwf = rwfPerBtc,
            trendDirection = "STABLE",
            volatilityRating = "LOW_STABLE",
            sevenDayChangePercent = +1.8,
            forecastSummary = "Prices have been more stable this week (+1.8%). Favorable conversion window for routine farm expenses without volatility stress.",
            forecastSummaryKinyarwanda = "Igiciro kiratekanye muri iki cyumweru. Ni umwanya mwiza wo guhindura amafaranga ukoresha mu buhinzi.",
            confidenceScore = 89,
            recommendation = "Hold BTC savings for long-term purchasing power hedge; convert only needed harvest inputs into Mobile Money."
        )
    }

    fun getCropYieldForecast(
        cropType: String,
        district: String,
        landSizeAres: Double,
        plantingMonth: String
    ): CropYieldForecastResult {
        val (kgPerAre, unitPrice, harvestMonth, rainStatus) = when (cropType) {
            "Specialty Arabica Coffee" -> Quad(18.0, 1250.0, "October - November", "Optimal Mountain Rainfall (1,450mm)")
            "Highland Tea" -> Quad(25.0, 950.0, "Year-round / Bi-weekly", "High Humidity & Mild Temp")
            "Hybrid Maize" -> Quad(42.0, 480.0, "July - August", "Adequate Season B Rains")
            "Irish Potato (Kinigi)" -> Quad(85.0, 380.0, "June - July", "Volcanic Soil Moisture Favorable")
            "Climbing Beans" -> Quad(28.0, 650.0, "June", "Favorable Moderate Rainfall")
            else -> Quad(20.0, 700.0, "October", "Normal Seasonal Climate")
        }

        val baseYield = landSizeAres * kgPerAre
        val yieldMin = baseYield * 0.90
        val yieldMax = baseYield * 1.15

        val incomeMin = yieldMin * unitPrice
        val incomeMax = yieldMax * unitPrice

        val recommendedSavingsSats = ((incomeMin * 0.15) / rwfPerSat).toLong()

        return CropYieldForecastResult(
            cropType = cropType,
            district = district,
            rainfallStatus = rainStatus,
            estimatedYieldKgMin = yieldMin,
            estimatedYieldKgMax = yieldMax,
            unitPriceRwf = unitPrice,
            estimatedIncomeMinRwf = incomeMin,
            estimatedIncomeMaxRwf = incomeMax,
            harvestWindow = harvestMonth,
            recommendedSavingsSats = recommendedSavingsSats,
            confidencePercent = 91,
            advisoryNote = "Forecast calibrated for $district district. Suggested 10-15% auto-savings into BTC protects against post-harvest RWF input price inflation."
        )
    }

    private data class Quad(val first: Double, val second: Double, val third: String, val fourth: String)

    companion object {
        fun formatRwf(amount: Double): String {
            return String.format(Locale.US, "%,.0f RWF", amount)
        }

        fun formatSats(sats: Long): String {
            return String.format(Locale.US, "%,d sats", sats)
        }

        fun formatBtc(sats: Long): String {
            val btc = sats / 100_000_000.0
            return String.format(Locale.US, "%.6f BTC", btc)
        }

        fun formatDate(timestamp: Long): String {
            val sdf = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault())
            return sdf.format(Date(timestamp))
        }
    }
}

data class TransactionResult(
    val success: Boolean,
    val totalRwf: Double,
    val netMoMoRwf: Double,
    val savedSats: Long,
    val savedRwf: Double,
    val newMoMoBalance: Double,
    val newSatsBalance: Long,
    val transactionId: String
)
