package com.example.data.model

data class WalletAddressItem(
    val address: String,
    val type: String, // NATIVE_SEGWIT, TAPROOT, LEGACY
    val label: String,
    val derivationIndex: Int,
    val createdAt: Long = System.currentTimeMillis()
)

data class BitcoinWalletDetails(
    val primaryAddress: String,
    val segwitAddress: String,
    val taprootAddress: String,
    val legacyAddress: String,
    val publicKeyHex: String,
    val mnemonicWords: List<String>,
    val isKeystoreBacked: Boolean = true,
    val keystoreAlias: String = "btc_farmer_master_keystore_key_v1",
    val securityLevelSummary: String = "Hardware-Backed Android Keystore (AES-256-GCM)",
    val createdAt: Long = System.currentTimeMillis(),
    val hasBackupConfirmed: Boolean = false,
    val derivedAddresses: List<WalletAddressItem> = emptyList()
)

data class SignedMessageReceipt(
    val message: String,
    val signatureHex: String,
    val signerAddress: String,
    val timestamp: Long = System.currentTimeMillis(),
    val verified: Boolean = true
)
