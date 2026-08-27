package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.db.AppDatabase
import com.example.data.model.AppTab
import com.example.data.model.BitcoinWalletDetails
import com.example.data.model.CropYieldForecastResult
import com.example.data.model.FarmProfile
import com.example.data.model.PriceForecastResult
import com.example.data.model.SignedMessageReceipt
import com.example.data.model.TransactionItem
import com.example.data.model.WalletAddressItem
import com.example.data.repository.BitcoinWalletRepository
import com.example.data.repository.PlatformRepository
import com.example.data.repository.TransactionResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class UssdScreenState(
    val isOpen: Boolean = false,
    val dialedCode: String = "*789#",
    val currentMenuStep: String = "MAIN", // MAIN, BALANCE, REMIT, SAVINGS, HARVEST, LANGUAGE
    val screenTitle: String = "BITCOIN FOR FARMERS (VAF UBWENGE)",
    val menuOptions: List<String> = listOf(
        "1. Reba Konti (Balance)",
        "2. Yakira Amafaranga (Remittance)",
        "3. Kuzigama muri BTC (Savings)",
        "4. Iteganyagihe ry'Umusaruro (AI Yield)",
        "5. Icyemezo cya CMA (Law 023/2026)",
        "6. Aderesi ya BTC (Keystore Wallet)",
        "0. Gusohoka (Exit)"
    ),
    val messageResponse: String? = null,
    val inputBuffer: String = ""
)

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: PlatformRepository
    private val walletRepository: BitcoinWalletRepository

    val transactions: StateFlow<List<TransactionItem>>
    val farmProfile: StateFlow<FarmProfile?>
    val walletDetails: StateFlow<BitcoinWalletDetails?>

    private val _selectedTab = MutableStateFlow(AppTab.DASHBOARD)
    val selectedTab: StateFlow<AppTab> = _selectedTab.asStateFlow()

    private val _priceForecast = MutableStateFlow<PriceForecastResult?>(null)
    val priceForecast: StateFlow<PriceForecastResult?> = _priceForecast.asStateFlow()

    private val _yieldForecast = MutableStateFlow<CropYieldForecastResult?>(null)
    val yieldForecast: StateFlow<CropYieldForecastResult?> = _yieldForecast.asStateFlow()

    private val _lastTransactionResult = MutableStateFlow<TransactionResult?>(null)
    val lastTransactionResult: StateFlow<TransactionResult?> = _lastTransactionResult.asStateFlow()

    private val _lastSignedReceipt = MutableStateFlow<SignedMessageReceipt?>(null)
    val lastSignedReceipt: StateFlow<SignedMessageReceipt?> = _lastSignedReceipt.asStateFlow()

    private val _ussdState = MutableStateFlow(UssdScreenState())
    val ussdState: StateFlow<UssdScreenState> = _ussdState.asStateFlow()

    // Notification toast / alert message
    private val _bannerMessage = MutableStateFlow<String?>(null)
    val bannerMessage: StateFlow<String?> = _bannerMessage.asStateFlow()

    init {
        val database = AppDatabase.getDatabase(application)
        repository = PlatformRepository(database)
        walletRepository = BitcoinWalletRepository(application)

        transactions = repository.transactions.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            emptyList()
        )

        farmProfile = repository.farmProfile.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            null
        )

        walletDetails = walletRepository.walletState

        viewModelScope.launch {
            repository.initializeDefaultDataIfEmpty()
            walletRepository.initializeWallet()
            refreshForecasts()
        }
    }

    fun selectTab(tab: AppTab) {
        _selectedTab.value = tab
    }

    fun clearBannerMessage() {
        _bannerMessage.value = null
    }

    fun clearLastTransactionResult() {
        _lastTransactionResult.value = null
    }

    fun clearLastSignedReceipt() {
        _lastSignedReceipt.value = null
    }

    // Bitcoin Keystore Wallet Actions
    fun createDerivedAddress(label: String) {
        viewModelScope.launch {
            val item = walletRepository.createDerivedAddress(label)
            _bannerMessage.value = "New Bitcoin address created: ${item.label} (${item.address.take(10)}...)"
        }
    }

    fun confirmMnemonicBackup() {
        viewModelScope.launch {
            walletRepository.markBackupConfirmed()
            _bannerMessage.value = "🔒 12-Word Recovery Phrase confirmed and safely backed up!"
        }
    }

    fun signCustomMessage(message: String) {
        viewModelScope.launch {
            if (message.isBlank()) {
                _bannerMessage.value = "Please enter a valid message to sign."
                return@launch
            }
            val receipt = walletRepository.signMessage(message)
            _lastSignedReceipt.value = receipt
            _bannerMessage.value = "✍️ Message cryptographically signed with Keystore key!"
        }
    }

    fun restoreWalletFromMnemonic(words: List<String>, onDone: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            val result = walletRepository.importWallet(words)
            if (result.isSuccess) {
                _bannerMessage.value = "✅ Bitcoin Wallet successfully restored into Android Keystore!"
                onDone(true, null)
            } else {
                val errorMsg = result.exceptionOrNull()?.message ?: "Failed to restore wallet"
                _bannerMessage.value = "❌ $errorMsg"
                onDone(false, errorMsg)
            }
        }
    }

    fun regenerateWallet() {
        viewModelScope.launch {
            val newWallet = walletRepository.purgeAndRegenerate()
            _bannerMessage.value = "🔄 Generated fresh Bitcoin Wallet in Android Keystore (${newWallet.primaryAddress.take(12)}...)"
        }
    }

    fun refreshForecasts() {
        val price = repository.getPriceTrendForecast()
        _priceForecast.value = price

        val profile = farmProfile.value ?: FarmProfile()
        val yield = repository.getCropYieldForecast(
            cropType = profile.cropType,
            district = profile.district,
            landSizeAres = profile.landSizeAres,
            plantingMonth = profile.plantingMonth
        )
        _yieldForecast.value = yield
    }

    fun updateYieldCalculation(cropType: String, district: String, landSizeAres: Double) {
        val yield = repository.getCropYieldForecast(
            cropType = cropType,
            district = district,
            landSizeAres = landSizeAres,
            plantingMonth = "March"
        )
        _yieldForecast.value = yield
    }

    fun toggleSavingsOptIn(optIn: Boolean, percentage: Int) {
        viewModelScope.launch {
            repository.updateSavingsSettings(optIn, percentage)
            _bannerMessage.value = if (optIn) {
                "BTC Savings Vault active: $percentage% of incoming payments will be saved as Satoshi hedge."
            } else {
                "BTC Savings disabled: 100% of income routes directly to Mobile Money RWF."
            }
        }
    }

    fun sendRemittance(
        senderName: String,
        amountSats: Long,
        senderLocation: String,
        targetPhone: String
    ) {
        viewModelScope.launch {
            val result = repository.processIncomingRemittance(
                senderName = senderName,
                amountSats = amountSats,
                senderLocation = senderLocation,
                targetPhone = targetPhone,
                rail = "LIGHTNING"
            )
            _lastTransactionResult.value = result
            _bannerMessage.value = "⚡ Lightning Remittance Received! Landed in MTN MoMo: ${PlatformRepository.formatRwf(result.netMoMoRwf)}"
        }
    }

    fun processProduceSettlement(
        cooperative: String,
        cropType: String,
        quantityKg: Double,
        ratePerKgRwf: Double,
        buyerPhone: String
    ) {
        viewModelScope.launch {
            val result = repository.processProducePayment(
                cooperativeName = cooperative,
                cropType = cropType,
                quantityKg = quantityKg,
                ratePerKgRwf = ratePerKgRwf,
                buyerPhone = buyerPhone
            )
            _lastTransactionResult.value = result
            _bannerMessage.value = "🌾 Produce Settlement complete! ${PlatformRepository.formatRwf(result.netMoMoRwf)} deposited."
        }
    }

    fun convertSatsToMomo(sats: Long) {
        viewModelScope.launch {
            val success = repository.convertSavingsToMomo(sats)
            if (success) {
                val rwf = sats * repository.rwfPerSat
                _bannerMessage.value = "Converted ${PlatformRepository.formatSats(sats)} -> ${PlatformRepository.formatRwf(rwf)} in Mobile Money."
            } else {
                _bannerMessage.value = "Conversion failed. Insufficient Satoshi savings balance."
            }
        }
    }

    fun convertMomoToSats(rwf: Double) {
        viewModelScope.launch {
            val success = repository.convertMomoToSavings(rwf)
            if (success) {
                val sats = (rwf / repository.rwfPerSat).toLong()
                _bannerMessage.value = "Saved ${PlatformRepository.formatRwf(rwf)} -> ${PlatformRepository.formatSats(sats)} into BTC Vault."
            } else {
                _bannerMessage.value = "Conversion failed. Insufficient Mobile Money balance."
            }
        }
    }

    // USSD SIMULATOR ENGINE (*182# or *789# for feature phone)
    fun openUssd(code: String = "*789#") {
        val profile = farmProfile.value ?: FarmProfile()
        _ussdState.value = UssdScreenState(
            isOpen = true,
            dialedCode = code,
            currentMenuStep = "MAIN",
            screenTitle = "BITCOIN FOR FARMERS (VAF UBWENGE)",
            menuOptions = listOf(
                "1. Reba Konti (Balance)",
                "2. Yakira Amafaranga (Remittance)",
                "3. Kuzigama muri BTC (${profile.savingsPercentage}%)",
                "4. Iteganyagihe ry'Umusaruro (AI Yield)",
                "5. Icyemezo cya CMA (Law 023/2026)",
                "0. Gusohoka (Exit)"
            ),
            messageResponse = null,
            inputBuffer = ""
        )
    }

    fun closeUssd() {
        _ussdState.value = _ussdState.value.copy(isOpen = false)
    }

    fun sendUssdInput(input: String) {
        val cleanInput = input.trim()
        val currentStep = _ussdState.value.currentMenuStep
        val profile = farmProfile.value ?: FarmProfile()

        when (currentStep) {
            "MAIN" -> {
                when (cleanInput) {
                    "1" -> {
                        val momo = PlatformRepository.formatRwf(profile.momoBalanceRwf)
                        val sats = PlatformRepository.formatSats(profile.btcSavingsSats)
                        val btcVal = PlatformRepository.formatRwf(profile.btcSavingsSats * repository.rwfPerSat)
                        _ussdState.value = _ussdState.value.copy(
                            currentMenuStep = "RESULT",
                            screenTitle = "KONTI YAWE",
                            menuOptions = listOf("0. Gusubira inyuma"),
                            messageResponse = "MTN MoMo: $momo\nBTC Savings: $sats (~$btcVal)\nStatus: CMA Law 023/2026 Compliant"
                        )
                    }
                    "2" -> {
                        _ussdState.value = _ussdState.value.copy(
                            currentMenuStep = "REMIT_PROMPT",
                            screenTitle = "YAKIRA AMAFARANGA",
                            menuOptions = listOf("Injiza Umubare wa Sats cyangwa RWF:"),
                            messageResponse = "Lightning Network Gateway ifunguye.\nAmafaranga ahita agera muri MoMo ako kanya."
                        )
                    }
                    "3" -> {
                        _ussdState.value = _ussdState.value.copy(
                            currentMenuStep = "SAVINGS_MENU",
                            screenTitle = "KUZIGAMA MURI BITCOIN",
                            menuOptions = listOf(
                                "1. Kuzigama 10% kuri buri musaruro",
                                "2. Kuzigama 20% kuri buri musaruro",
                                "3. Guhagarika kuzigama (0%)",
                                "4. Ibisobanuro ku bwinjiriro (Disclaimer)",
                                "0. Subira Inyuma"
                            ),
                            messageResponse = "Ubu urazigama: ${profile.savingsPercentage}%\nBitcoin igufasha kurinda agaciro k'amafaranga."
                        )
                    }
                    "4" -> {
                        val yield = _yieldForecast.value ?: repository.getCropYieldForecast(profile.cropType, profile.district, profile.landSizeAres, profile.plantingMonth)
                        _ussdState.value = _ussdState.value.copy(
                            currentMenuStep = "RESULT",
                            screenTitle = "AI YIELD & PRICE FORECAST",
                            menuOptions = listOf("0. Gusubira inyuma"),
                            messageResponse = "${profile.cropType} (${profile.district})\nUmusaruro witezwe: ${yield.estimatedYieldKgMin.toInt()}-${yield.estimatedYieldKgMax.toInt()} Kg\nAmafaranga: ${PlatformRepository.formatRwf(yield.estimatedIncomeMinRwf)} - ${PlatformRepository.formatRwf(yield.estimatedIncomeMaxRwf)}\nIgiciro cya BTC kiratekanye iki cyumweru."
                        )
                    }
                    "5" -> {
                        _ussdState.value = _ussdState.value.copy(
                            currentMenuStep = "RESULT",
                            screenTitle = "CMA REGULATORY COMPLIANCE",
                            menuOptions = listOf("0. Gusubira inyuma"),
                            messageResponse = "Rwanda Law No. 023/2026 on Virtual Asset Business.\nPlatform runs via CMA-Licensed VASP Partner.\nFarmer funds secured directly in RWF Mobile Money."
                        )
                    }
                    "6" -> {
                        val wallet = walletDetails.value
                        val addr = wallet?.primaryAddress ?: "Generating..."
                        val security = wallet?.securityLevelSummary ?: "Android Keystore"
                        _ussdState.value = _ussdState.value.copy(
                            currentMenuStep = "RESULT",
                            screenTitle = "BITCOIN KEYSTORE ADERESI",
                            menuOptions = listOf("0. Gusubira inyuma"),
                            messageResponse = "Aderesi yawe ya BTC (SegWit):\n$addr\nUmutekano: $security\nBirasobanutse muri CMA Law 023/2026"
                        )
                    }
                    "0" -> {
                        closeUssd()
                    }
                    else -> {
                        _ussdState.value = _ussdState.value.copy(
                            messageResponse = "Guhitamo sibyo. Ongera ugerageze."
                        )
                    }
                }
            }
            "SAVINGS_MENU" -> {
                when (cleanInput) {
                    "1" -> {
                        toggleSavingsOptIn(true, 10)
                        _ussdState.value = _ussdState.value.copy(
                            currentMenuStep = "RESULT",
                            screenTitle = "BYAKOZWE",
                            menuOptions = listOf("0. Menu Nkuru"),
                            messageResponse = "Wahisemo kuzigama 10% muri BTC kuri buri kintu cyose cyinjiye."
                        )
                    }
                    "2" -> {
                        toggleSavingsOptIn(true, 20)
                        _ussdState.value = _ussdState.value.copy(
                            currentMenuStep = "RESULT",
                            screenTitle = "BYAKOZWE",
                            menuOptions = listOf("0. Menu Nkuru"),
                            messageResponse = "Wahisemo kuzigama 20% muri BTC kuri buri kintu cyose cyinjiye."
                        )
                    }
                    "3" -> {
                        toggleSavingsOptIn(false, 0)
                        _ussdState.value = _ussdState.value.copy(
                            currentMenuStep = "RESULT",
                            screenTitle = "BYAKOZWE",
                            menuOptions = listOf("0. Menu Nkuru"),
                            messageResponse = "Wahagaritse kuzigama muri BTC. 100% y'amafaranga azajya muri MoMo."
                        )
                    }
                    "4" -> {
                        _ussdState.value = _ussdState.value.copy(
                            currentMenuStep = "RESULT",
                            screenTitle = "DISCLAIMER",
                            menuOptions = listOf("0. Subira Inyuma"),
                            messageResponse = "Icyitonderwa: Igiciro cya Bitcoin kirahindagurika. Kuzigama ni amahitamo yawe ku bushake (Opt-in). Nta tegeko ryo kuzigama."
                        )
                    }
                    "0" -> openUssd()
                }
            }
            "RESULT" -> {
                openUssd()
            }
            else -> {
                openUssd()
            }
        }
    }
}
