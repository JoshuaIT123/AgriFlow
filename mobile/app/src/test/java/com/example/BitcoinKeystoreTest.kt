package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.crypto.BitcoinCryptoUtils
import com.example.data.repository.BitcoinWalletRepository
import com.example.data.security.SecureKeyStoreManager
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class BitcoinKeystoreTest {

    private lateinit var context: Context

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
    }

    @Test
    fun testMnemonicGeneration() {
        val words = BitcoinCryptoUtils.generate12WordMnemonic()
        assertEquals(12, words.size)
        // Ensure words are non-empty and valid BIP-39
        assertTrue(BitcoinCryptoUtils.isValidMnemonic(words))
    }

    @Test
    fun testSeedAndAddressDerivation() {
        val mnemonic = listOf(
            "abandon", "abandon", "abandon", "abandon",
            "abandon", "abandon", "abandon", "abandon",
            "abandon", "abandon", "abandon", "about"
        )
        val seed = BitcoinCryptoUtils.mnemonicToSeed(mnemonic, "")
        assertEquals(64, seed.size)

        val privKey = BitcoinCryptoUtils.derivePrivateKey(seed, 0)
        val pubKey = BitcoinCryptoUtils.derivePublicKey(privKey)
        assertEquals(33, pubKey.size)

        // Native SegWit address should start with bc1q
        val segwitAddr = BitcoinCryptoUtils.createSegWitAddress(pubKey)
        assertTrue(segwitAddr.startsWith("bc1q"))
        assertEquals(42, segwitAddr.length)

        // Taproot address should start with bc1p
        val taprootAddr = BitcoinCryptoUtils.createTaprootAddress(pubKey)
        assertTrue(taprootAddr.startsWith("bc1p"))
        assertEquals(62, taprootAddr.length)

        // Legacy address should start with 1
        val legacyAddr = BitcoinCryptoUtils.createLegacyAddress(pubKey)
        assertTrue(legacyAddr.startsWith("1"))
    }

    @Test
    fun testMessageSigningAndVerification() {
        val mnemonic = BitcoinCryptoUtils.generate12WordMnemonic()
        val seed = BitcoinCryptoUtils.mnemonicToSeed(mnemonic, "")
        val privKey = BitcoinCryptoUtils.derivePrivateKey(seed, 0)
        val message = "Proof of Rwandan Coffee Harvest #2026 - VAF Ubwenge"

        val signature = BitcoinCryptoUtils.signMessage(message, privKey)
        assertTrue(signature.isNotBlank())

        val isValid = BitcoinCryptoUtils.verifyMessageSignature(message, signature, privKey)
        assertTrue(isValid)

        // Corrupted message must fail
        val isInvalid = BitcoinCryptoUtils.verifyMessageSignature("Corrupted message", signature, privKey)
        assertFalse(isInvalid)
    }

    @Test
    fun testSecureKeyStoreEncryptionDecryption() {
        val keyStoreManager = SecureKeyStoreManager(context)
        val originalSecret = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"

        val encrypted = keyStoreManager.encrypt(originalSecret)
        assertNotNull(encrypted)
        assertNotEquals(originalSecret, encrypted)

        val decrypted = keyStoreManager.decrypt(encrypted)
        assertEquals(originalSecret, decrypted)
    }

    @Test
    fun testBitcoinWalletRepositoryLifecycle() = runTest {
        val repo = BitcoinWalletRepository(context)
        val wallet = repo.initializeWallet()

        assertNotNull(wallet)
        assertTrue(wallet.primaryAddress.startsWith("bc1q"))
        assertEquals(12, wallet.mnemonicWords.size)
        assertFalse(wallet.hasBackupConfirmed)

        // Confirm backup
        repo.markBackupConfirmed()
        assertTrue(repo.walletState.value?.hasBackupConfirmed == true)

        // Derive labeled address
        val derived = repo.createDerivedAddress("Musanze Potato Harvest")
        assertEquals("Musanze Potato Harvest", derived.label)
        assertTrue(derived.address.startsWith("bc1q"))
        assertEquals(4, repo.walletState.value?.derivedAddresses?.size)

        // Sign message
        val signedReceipt = repo.signMessage("Delivery to COOPAC")
        assertEquals("Delivery to COOPAC", signedReceipt.message)
        assertTrue(signedReceipt.signatureHex.isNotBlank())
    }
}
