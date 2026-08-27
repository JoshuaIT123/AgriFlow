package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "transactions")
data class TransactionItem(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val type: String, // REMITTANCE, SAVINGS_DEPOSIT, SAVINGS_WITHDRAW, PRODUCE_PAYOUT
    val amountRwf: Double,
    val amountSats: Long,
    val counterparty: String,
    val phoneOrInvoice: String,
    val status: String, // COMPLETED, SETTLING, PENDING
    val timestamp: Long = System.currentTimeMillis(),
    val note: String,
    val rail: String // LIGHTNING, MTN_MOMO, AIRTEL_MONEY
)

@Entity(tableName = "farm_profile")
data class FarmProfile(
    @PrimaryKey
    val id: Int = 1,
    val farmerName: String = "Mugisha Alain",
    val phoneNumber: String = "+250 788 123 456",
    val district: String = "Musanze (Northern Province)",
    val cooperative: String = "COOPAC Coffee Cooperative",
    val cropType: String = "Specialty Arabica Coffee",
    val landSizeAres: Double = 35.0,
    val plantingMonth: String = "March",
    val expectedHarvestMonth: String = "October",
    val isSavingsOptedIn: Boolean = true,
    val savingsPercentage: Int = 10,
    val momoBalanceRwf: Double = 185400.0,
    val btcSavingsSats: Long = 425000,
    val kycVerified: Boolean = true
)

enum class AppTab(val label: String, val iconName: String) {
    DASHBOARD("Dashboard", "home"),
    WALLET("BTC Wallet", "account_balance_wallet"),
    REMITTANCE("Remit & Pay", "send"),
    SAVINGS("BTC Savings", "savings"),
    AI_PREDICTOR("AI Forecast", "insights"),
    USSD_SIM("USSD Feature", "dialpad")
}

data class PriceForecastResult(
    val btcUsd: Double,
    val btcRwf: Double,
    val trendDirection: String, // STABLE, VOLATILE_UP, VOLATILE_DOWN
    val volatilityRating: String, // LOW_STABLE, MODERATE, HIGH
    val sevenDayChangePercent: Double,
    val forecastSummary: String,
    val forecastSummaryKinyarwanda: String,
    val confidenceScore: Int,
    val recommendation: String
)

data class CropYieldForecastResult(
    val cropType: String,
    val district: String,
    val rainfallStatus: String,
    val estimatedYieldKgMin: Double,
    val estimatedYieldKgMax: Double,
    val unitPriceRwf: Double,
    val estimatedIncomeMinRwf: Double,
    val estimatedIncomeMaxRwf: Double,
    val harvestWindow: String,
    val recommendedSavingsSats: Long,
    val confidencePercent: Int,
    val advisoryNote: String
)
