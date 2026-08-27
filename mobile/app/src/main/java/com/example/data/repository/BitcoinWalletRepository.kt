package com.example.data.repository

import android.content.Context
import com.example.data.crypto.BitcoinCryptoUtils
import com.example.data.model.BitcoinWalletDetails
import com.example.data.model.SignedMessageReceipt
import com.example.data.model.WalletAddressItem
import com.example.data.security.SecureKeyStoreManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

/**
 * Repository responsible for Bitcoin wallet generation, Keystore encryption,
 * derivation of Native SegWit / Taproot / Legacy addresses, message signing, and recovery.
 */
class BitcoinWalletRepository(private val context: Context) {

    private val keyStoreManager = SecureKeyStoreManager(context)

    private val _walletState = MutableStateFlow<BitcoinWalletDetails?>(null)
    val walletState: StateFlow<BitcoinWalletDetails?> = _walletState.asStateFlow()

    private val KEY_MNEMONIC = "encrypted_btc_mnemonic_words"
    private val KEY_SEED_HEX = "encrypted_btc_master_seed_hex"
    private val KEY_BACKUP_CONFIRMED = "encrypted_btc_backup_status"
    private val KEY_SUB_ADDRESSES = "encrypted_btc_derived_subaddresses"
    private val KEY_ACTIVE_FORMAT = "active_btc_address_format"

    suspend fun initializeWallet(): BitcoinWalletDetails = withContext(Dispatchers.IO) {
        val existingWordsStr = keyStoreManager.secureGet(KEY_MNEMONIC)
        if (existingWordsStr != null) {
            val words = existingWordsStr.split(" ").filter { it.isNotBlank() }
            loadWalletFromMnemonic(words)
        } else {
            generateNewWallet(label = "Primary Rwanda Farmer Vault")
        }
    }

    suspend fun generateNewWallet(label: String = "Primary Rwanda Farmer Vault"): BitcoinWalletDetails = withContext(Dispatchers.IO) {
        val words = BitcoinCryptoUtils.generate12WordMnemonic()
        saveAndLoadWallet(words, isNew = true, defaultLabel = label)
    }

    suspend fun importWallet(mnemonicWords: List<String>): Result<BitcoinWalletDetails> = withContext(Dispatchers.IO) {
        val cleanWords = mnemonicWords.map { it.lowercase().trim() }.filter { it.isNotBlank() }
        if (!BitcoinCryptoUtils.isValidMnemonic(cleanWords)) {
            return@withContext Result.failure(IllegalArgumentException("Invalid 12-word mnemonic phrase. Please check word spelling."))
        }
        val wallet = saveAndLoadWallet(cleanWords, isNew = false, defaultLabel = "Restored Farmer Vault")
        Result.success(wallet)
    }

    private fun saveAndLoadWallet(
        words: List<String>,
        isNew: Boolean,
        defaultLabel: String
    ): BitcoinWalletDetails {
        val seedBytes = BitcoinCryptoUtils.mnemonicToSeed(words)
        val seedHex = BitcoinCryptoUtils.bytesToHex(seedBytes)

        // Store encrypted in Android Keystore
        keyStoreManager.secureSave(KEY_MNEMONIC, words.joinToString(" "))
        keyStoreManager.secureSave(KEY_SEED_HEX, seedHex)

        if (isNew) {
            keyStoreManager.secureSave(KEY_BACKUP_CONFIRMED, "false")
        }

        return loadWalletFromMnemonic(words)
    }

    private fun loadWalletFromMnemonic(words: List<String>): BitcoinWalletDetails {
        val seedBytes = BitcoinCryptoUtils.mnemonicToSeed(words)
        val privateKey0 = BitcoinCryptoUtils.derivePrivateKey(seedBytes, index = 0)
        val publicKey0 = BitcoinCryptoUtils.derivePublicKey(privateKey0)
        val pubKeyHex = BitcoinCryptoUtils.bytesToHex(publicKey0)

        val segwitAddr = BitcoinCryptoUtils.createSegWitAddress(publicKey0)
        val taprootAddr = BitcoinCryptoUtils.createTaprootAddress(publicKey0)
        val legacyAddr = BitcoinCryptoUtils.createLegacyAddress(publicKey0)

        val hasBackup = keyStoreManager.secureGet(KEY_BACKUP_CONFIRMED)?.toBoolean() ?: false
        val subAddresses = loadSubAddresses(seedBytes)

        val wallet = BitcoinWalletDetails(
            primaryAddress = segwitAddr,
            segwitAddress = segwitAddr,
            taprootAddress = taprootAddr,
            legacyAddress = legacyAddr,
            publicKeyHex = pubKeyHex,
            mnemonicWords = words,
            isKeystoreBacked = true,
            keystoreAlias = "btc_farmer_master_keystore_key_v1",
            securityLevelSummary = keyStoreManager.getHardwareSecuritySummary(),
            createdAt = System.currentTimeMillis(),
            hasBackupConfirmed = hasBackup,
            derivedAddresses = subAddresses
        )
        _walletState.value = wallet
        return wallet
    }

    private fun loadSubAddresses(seedBytes: ByteArray): List<WalletAddressItem> {
        val storedJson = keyStoreManager.secureGet(KEY_SUB_ADDRESSES)
        val items = mutableListOf<WalletAddressItem>()

        if (storedJson != null) {
            try {
                val jsonArray = JSONArray(storedJson)
                for (i in 0 until jsonArray.length()) {
                    val obj = jsonArray.getJSONObject(i)
                    items.add(
                        WalletAddressItem(
                            address = obj.getString("address"),
                            type = obj.getString("type"),
                            label = obj.getString("label"),
                            derivationIndex = obj.getInt("index"),
                            createdAt = obj.optLong("createdAt", System.currentTimeMillis())
                        )
                    )
                }
            } catch (_: Exception) {}
        }

        if (items.isEmpty()) {
            // Generate standard initial derived addresses for farmer workflow
            val pk1 = BitcoinCryptoUtils.derivePrivateKey(seedBytes, 1)
            val pk2 = BitcoinCryptoUtils.derivePrivateKey(seedBytes, 2)
            val pk3 = BitcoinCryptoUtils.derivePrivateKey(seedBytes, 3)

            val addr1 = BitcoinCryptoUtils.createSegWitAddress(BitcoinCryptoUtils.derivePublicKey(pk1))
            val addr2 = BitcoinCryptoUtils.createSegWitAddress(BitcoinCryptoUtils.derivePublicKey(pk2))
            val addr3 = BitcoinCryptoUtils.createSegWitAddress(BitcoinCryptoUtils.derivePublicKey(pk3))

            items.add(WalletAddressItem(addr1, "NATIVE_SEGWIT", "Coffee & Produce Payouts (COOPAC)", 1))
            items.add(WalletAddressItem(addr2, "NATIVE_SEGWIT", "Diaspora Remittances (EU/US/KE)", 2))
            items.add(WalletAddressItem(addr3, "NATIVE_SEGWIT", "Long-Term Inflation Vault (Hedge)", 3))

            saveSubAddresses(items)
        }

        return items
    }

    private fun saveSubAddresses(items: List<WalletAddressItem>) {
        val jsonArray = JSONArray()
        for (item in items) {
            val obj = JSONObject().apply {
                put("address", item.address)
                put("type", item.type)
                put("label", item.label)
                put("index", item.derivationIndex)
                put("createdAt", item.createdAt)
            }
            jsonArray.put(obj)
        }
        keyStoreManager.secureSave(KEY_SUB_ADDRESSES, jsonArray.toString())
    }

    suspend fun createDerivedAddress(label: String): WalletAddressItem = withContext(Dispatchers.IO) {
        val currentWallet = _walletState.value ?: initializeWallet()
        val seedBytes = BitcoinCryptoUtils.mnemonicToSeed(currentWallet.mnemonicWords)
        val nextIndex = (currentWallet.derivedAddresses.maxOfOrNull { it.derivationIndex } ?: 0) + 1

        val subPk = BitcoinCryptoUtils.derivePrivateKey(seedBytes, nextIndex)
        val subPub = BitcoinCryptoUtils.derivePublicKey(subPk)
        val newAddress = BitcoinCryptoUtils.createSegWitAddress(subPub)

        val newItem = WalletAddressItem(
            address = newAddress,
            type = "NATIVE_SEGWIT",
            label = label.ifBlank { "Address #$nextIndex" },
            derivationIndex = nextIndex,
            createdAt = System.currentTimeMillis()
        )

        val updatedList = currentWallet.derivedAddresses + newItem
        saveSubAddresses(updatedList)

        _walletState.value = currentWallet.copy(derivedAddresses = updatedList)
        newItem
    }

    suspend fun markBackupConfirmed() = withContext(Dispatchers.IO) {
        keyStoreManager.secureSave(KEY_BACKUP_CONFIRMED, "true")
        _walletState.value = _walletState.value?.copy(hasBackupConfirmed = true)
    }

    suspend fun signMessage(message: String): SignedMessageReceipt = withContext(Dispatchers.IO) {
        val currentWallet = _walletState.value ?: initializeWallet()
        val seedBytes = BitcoinCryptoUtils.mnemonicToSeed(currentWallet.mnemonicWords)
        val privateKey0 = BitcoinCryptoUtils.derivePrivateKey(seedBytes, 0)

        val sigHex = BitcoinCryptoUtils.signMessage(message, privateKey0)
        SignedMessageReceipt(
            message = message,
            signatureHex = sigHex,
            signerAddress = currentWallet.primaryAddress,
            timestamp = System.currentTimeMillis(),
            verified = true
        )
    }

    suspend fun verifyMessage(message: String, signatureHex: String): Boolean = withContext(Dispatchers.IO) {
        val currentWallet = _walletState.value ?: initializeWallet()
        val seedBytes = BitcoinCryptoUtils.mnemonicToSeed(currentWallet.mnemonicWords)
        val privateKey0 = BitcoinCryptoUtils.derivePrivateKey(seedBytes, 0)
        BitcoinCryptoUtils.verifyMessageSignature(message, signatureHex, privateKey0)
    }

    suspend fun purgeAndRegenerate(): BitcoinWalletDetails = withContext(Dispatchers.IO) {
        keyStoreManager.purgeAllKeys()
        generateNewWallet(label = "New Regenerated Rwanda Farmer Vault")
    }

    fun getHardwareSummary(): String {
        return keyStoreManager.getHardwareSecuritySummary()
    }
}
