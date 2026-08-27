package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.BitcoinWalletDetails
import com.example.data.model.SignedMessageReceipt
import com.example.data.model.WalletAddressItem
import com.example.ui.components.QrCodeCanvas
import com.example.ui.theme.*

enum class AddressFormatTab {
    SEGWIT,
    TAPROOT,
    LEGACY
}

@Composable
fun WalletScreen(
    wallet: BitcoinWalletDetails?,
    lastSignedReceipt: SignedMessageReceipt?,
    onCreateDerivedAddress: (String) -> Unit,
    onConfirmBackup: () -> Unit,
    onSignMessage: (String) -> Unit,
    onRestoreWallet: (List<String>, (Boolean, String?) -> Unit) -> Unit,
    onRegenerateWallet: () -> Unit,
    onClearSignedReceipt: () -> Unit
) {
    val context = LocalContext.current
    var selectedFormat by remember { mutableStateOf(AddressFormatTab.SEGWIT) }
    var showMnemonicDialog by remember { mutableStateOf(false) }
    var showSignDialog by remember { mutableStateOf(false) }
    var showImportDialog by remember { mutableStateOf(false) }
    var showNewAddressDialog by remember { mutableStateOf(false) }
    var showRegenerateConfirmDialog by remember { mutableStateOf(false) }
    var copyToastText by remember { mutableStateOf<String?>(null) }

    fun copyToClipboard(label: String, text: String) {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText(label, text)
        clipboard.setPrimaryClip(clip)
        copyToastText = "Copied $label to clipboard"
    }

    val activeAddress = when (selectedFormat) {
        AddressFormatTab.SEGWIT -> wallet?.segwitAddress ?: "Generating..."
        AddressFormatTab.TAPROOT -> wallet?.taprootAddress ?: "Generating..."
        AddressFormatTab.LEGACY -> wallet?.legacyAddress ?: "Generating..."
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("wallet_screen"),
        contentPadding = PaddingValues(bottom = 100.dp, top = 8.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Hardware Keystore Security Header Banner
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .testTag("keystore_security_card"),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(
                    containerColor = GeoPrimaryContainer
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = GeoPrimary,
                        modifier = Modifier.size(44.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.VpnKey,
                                contentDescription = "Android Keystore Key",
                                tint = Color.White,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "ANDROID KEYSTORE SECURED",
                                style = MaterialTheme.typography.labelSmall,
                                color = GeoPrimary,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 0.8.sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.Default.VerifiedUser,
                                contentDescription = null,
                                tint = GeoPrimary,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = wallet?.securityLevelSummary ?: "Hardware AES-256 GCM in TEE / StrongBox",
                            style = MaterialTheme.typography.bodySmall,
                            color = GeoOnPrimaryContainer,
                            fontWeight = FontWeight.Medium,
                            fontSize = 12.sp
                        )
                        Text(
                            text = "Self-custodial keys never leave this device • Rwanda CMA Law 023/2026",
                            style = MaterialTheme.typography.labelSmall,
                            color = GeoOnPrimaryContainer.copy(alpha = 0.75f),
                            fontSize = 10.sp
                        )
                    }
                }
            }
        }

        // Active Bitcoin Receiving Address Hero Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .testTag("btc_address_hero_card"),
                shape = RoundedCornerShape(32.dp),
                colors = CardDefaults.cardColors(containerColor = GeoSurface),
                border = CardDefaults.outlinedCardBorder(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "YOUR BITCOIN RECEIVING ADDRESS",
                        style = MaterialTheme.typography.labelSmall,
                        color = GeoOnSurfaceVariant,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Address Type Segmented Pill Selector
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(GeoSurfaceVariant.copy(alpha = 0.5f))
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        FormatPill(
                            label = "Native SegWit",
                            sub = "bc1q (Lowest Fee)",
                            isSelected = selectedFormat == AddressFormatTab.SEGWIT,
                            modifier = Modifier.weight(1f),
                            onClick = { selectedFormat = AddressFormatTab.SEGWIT }
                        )
                        FormatPill(
                            label = "Taproot",
                            sub = "bc1p (Privacy)",
                            isSelected = selectedFormat == AddressFormatTab.TAPROOT,
                            modifier = Modifier.weight(1f),
                            onClick = { selectedFormat = AddressFormatTab.TAPROOT }
                        )
                        FormatPill(
                            label = "Legacy",
                            sub = "1... (Standard)",
                            isSelected = selectedFormat == AddressFormatTab.LEGACY,
                            modifier = Modifier.weight(1f),
                            onClick = { selectedFormat = AddressFormatTab.LEGACY }
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Crisp Procedural Vector QR Code
                    Surface(
                        shape = RoundedCornerShape(24.dp),
                        color = Color.White,
                        shadowElevation = 2.dp,
                        modifier = Modifier.padding(bottom = 16.dp)
                    ) {
                        QrCodeCanvas(
                            data = "bitcoin:$activeAddress",
                            size = 180.dp,
                            dotColor = Color(0xFF1B1B1F)
                        )
                    }

                    // Formatted Full Address Container
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = GeoSurfaceVariant.copy(alpha = 0.4f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { copyToClipboard("Bitcoin Address", activeAddress) }
                            .testTag("address_copy_container")
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = activeAddress,
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold
                                ),
                                color = GeoOnSurface,
                                fontSize = 13.sp,
                                modifier = Modifier.weight(1f)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            FilledTonalIconButton(
                                onClick = { copyToClipboard("Bitcoin Address", activeAddress) },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ContentCopy,
                                    contentDescription = "Copy Address",
                                    tint = GeoPrimary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Action Buttons Row (Share / Copy)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = { copyToClipboard("Bitcoin Address", activeAddress) },
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .testTag("copy_address_btn"),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = GeoPrimary)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ContentCopy,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Copy Address", fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = { showSignDialog = true },
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .testTag("sign_message_btn"),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Draw,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                                tint = GeoPrimary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Sign Proof", fontWeight = FontWeight.Bold, color = GeoPrimary)
                        }
                    }
                }
            }
        }

        // Keystore Management Actions (Backup / Recovery Phrase & Derived Addresses)
        item {
            Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                Text(
                    text = "SECURITY & KEY MANAGEMENT",
                    style = MaterialTheme.typography.labelSmall,
                    color = GeoOnSurfaceVariant,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 10.dp, start = 4.dp)
                )

                // Backup Mnemonic Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showMnemonicDialog = true }
                        .testTag("backup_mnemonic_card"),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (wallet?.hasBackupConfirmed == true) GeoSecondaryContainer else BitcoinOrangeContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = if (wallet?.hasBackupConfirmed == true) GeoSecondary else BitcoinOrange,
                                modifier = Modifier.size(40.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = if (wallet?.hasBackupConfirmed == true) Icons.Default.Shield else Icons.Default.WarningAmber,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(22.dp)
                                    )
                                }
                            }

                            Column {
                                Text(
                                    text = if (wallet?.hasBackupConfirmed == true) "12-Word Recovery Vault (Backed Up)" else "Backup 12-Word Phrase (Urgent)",
                                    style = MaterialTheme.typography.titleSmall,
                                    color = if (wallet?.hasBackupConfirmed == true) GeoOnSecondaryContainer else BitcoinOrangeDark,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Encrypted in Android Keystore with AES-GCM",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = GeoOnSurfaceVariant,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = "Open",
                            tint = GeoOnSurfaceVariant
                        )
                    }
                }
            }
        }

        // Labeled Sub-Addresses Section (e.g. Coffee Payouts, Diaspora, Vault)
        item {
            Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp, start = 4.dp, end = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "PURPOSE-SPECIFIC ADDRESSES",
                        style = MaterialTheme.typography.labelSmall,
                        color = GeoOnSurfaceVariant,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )

                    TextButton(
                        onClick = { showNewAddressDialog = true },
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AddCircleOutline,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = GeoPrimary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "New Label",
                            style = MaterialTheme.typography.labelSmall,
                            color = GeoPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                val subAddrs = wallet?.derivedAddresses ?: emptyList()
                if (subAddrs.isEmpty()) {
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = GeoSurfaceVariant.copy(alpha = 0.3f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "No custom addresses derived yet.",
                            modifier = Modifier.padding(16.dp),
                            style = MaterialTheme.typography.bodySmall,
                            color = GeoOnSurfaceVariant
                        )
                    }
                } else {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = GeoSurface),
                        border = CardDefaults.outlinedCardBorder()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            subAddrs.forEachIndexed { index, item ->
                                SubAddressRow(
                                    item = item,
                                    onCopy = { copyToClipboard(item.label, item.address) }
                                )
                                if (index < subAddrs.size - 1) {
                                    HorizontalDivider(
                                        color = GeoSurfaceVariant.copy(alpha = 0.5f),
                                        modifier = Modifier.padding(vertical = 8.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Advanced Wallet Management Tools (Restore / Reset)
        item {
            Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                Text(
                    text = "WALLET RECOVERY & TOOLS",
                    style = MaterialTheme.typography.labelSmall,
                    color = GeoOnSurfaceVariant,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 10.dp, start = 4.dp)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { showImportDialog = true },
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                            .testTag("import_wallet_btn"),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Download,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = GeoPrimary
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Import Mnemonic", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = { showRegenerateConfirmDialog = true },
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                            .testTag("regenerate_wallet_btn"),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Reset Keys", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Last Signed Receipt banner if available
        if (lastSignedReceipt != null) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = GeoTertiaryContainer)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "LATEST CRYPTOGRAPHIC SIGNATURE",
                                style = MaterialTheme.typography.labelSmall,
                                color = GeoOnTertiaryContainer,
                                fontWeight = FontWeight.Bold
                            )
                            IconButton(
                                onClick = onClearSignedReceipt,
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Close",
                                    tint = GeoOnTertiaryContainer
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Message: \"${lastSignedReceipt.message}\"",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.SemiBold,
                            color = GeoOnTertiaryContainer
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Signature: ${lastSignedReceipt.signatureHex.take(24)}...",
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = GeoOnTertiaryContainer.copy(alpha = 0.8f)
                        )
                    }
                }
            }
        }
    }

    // Modal Dialog: Reveal 12-Word Recovery Phrase
    if (showMnemonicDialog) {
        val words = wallet?.mnemonicWords ?: emptyList()
        AlertDialog(
            onDismissRequest = { showMnemonicDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        tint = BitcoinOrange,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("12-Word Recovery Phrase", fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column {
                    Text(
                        text = "Write down these 12 words in exact order on paper. Keep them offline in a secure place. These words allow full recovery of your Bitcoin wallet.",
                        style = MaterialTheme.typography.bodySmall,
                        color = GeoOnSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(14.dp))

                    // 12 Words Grid (3 cols x 4 rows)
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(GeoSurfaceVariant.copy(alpha = 0.4f))
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        for (rowIndex in 0 until 4) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                for (colIndex in 0 until 3) {
                                    val wordIndex = rowIndex * 3 + colIndex
                                    if (wordIndex < words.size) {
                                        Surface(
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(8.dp),
                                            color = Color.White
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 6.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = "${wordIndex + 1}.",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = GeoOnSurfaceVariant,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 10.sp
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(
                                                    text = words[wordIndex],
                                                    style = MaterialTheme.typography.bodySmall,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    color = GeoOnSurface,
                                                    fontSize = 11.sp
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(
                            onClick = {
                                copyToClipboard("Recovery Phrase", words.joinToString(" "))
                            }
                        ) {
                            Icon(imageVector = Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Copy Words", fontSize = 12.sp)
                        }

                        Text(
                            text = "AES-256 Keystore",
                            style = MaterialTheme.typography.labelSmall,
                            color = GeoPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onConfirmBackup()
                        showMnemonicDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = GeoPrimary)
                ) {
                    Text("I Have Saved My Words", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showMnemonicDialog = false }) {
                    Text("Close")
                }
            }
        )
    }

    // Modal Dialog: Sign Message Proof (for Rwandan Cooperatives & CMA)
    if (showSignDialog) {
        var messageInput by remember {
            mutableStateOf("Proof of Ownership: COOPAC Coffee Delivery #4928 - Farmer Alain Mugisha")
        }

        AlertDialog(
            onDismissRequest = { showSignDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Draw, contentDescription = null, tint = GeoPrimary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Sign Proof of Ownership", fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column {
                    Text(
                        text = "Sign a custom message with your Keystore private key to prove ownership of this wallet address to agricultural cooperatives or CMA auditors.",
                        style = MaterialTheme.typography.bodySmall,
                        color = GeoOnSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = messageInput,
                        onValueChange = { messageInput = it },
                        label = { Text("Message to Sign") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onSignMessage(messageInput)
                        showSignDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = GeoPrimary)
                ) {
                    Text("Generate Signature", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showSignDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Modal Dialog: Create Labeled Receiving Address
    if (showNewAddressDialog) {
        var labelInput by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showNewAddressDialog = false },
            title = { Text("Generate Labeled Address", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(
                        text = "Derive a fresh Native SegWit (bc1q...) Bitcoin address for tracking specific buyers, crops, or diaspora family members.",
                        style = MaterialTheme.typography.bodySmall,
                        color = GeoOnSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = labelInput,
                        onValueChange = { labelInput = it },
                        label = { Text("Address Label (e.g. Maize Harvest)") },
                        placeholder = { Text("COOPAC Grade A Coffee Payout") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onCreateDerivedAddress(labelInput)
                        showNewAddressDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = GeoPrimary)
                ) {
                    Text("Derive Address", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showNewAddressDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Modal Dialog: Import Wallet via 12-Word Mnemonic Phrase
    if (showImportDialog) {
        var phraseInput by remember { mutableStateOf("") }
        var importError by remember { mutableStateOf<String?>(null) }

        AlertDialog(
            onDismissRequest = { showImportDialog = false },
            title = { Text("Import Bitcoin Wallet", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(
                        text = "Enter your 12-word recovery mnemonic phrase separated by spaces. Keys will be re-encrypted inside Android Keystore.",
                        style = MaterialTheme.typography.bodySmall,
                        color = GeoOnSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = phraseInput,
                        onValueChange = {
                            phraseInput = it
                            importError = null
                        },
                        label = { Text("12-Word Recovery Phrase") },
                        placeholder = { Text("word1 word2 word3 ... word12") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        minLines = 3,
                        isError = importError != null
                    )
                    if (importError != null) {
                        Text(
                            text = importError ?: "",
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val words = phraseInput.trim().split("\\s+".toRegex())
                        onRestoreWallet(words) { success, err ->
                            if (success) {
                                showImportDialog = false
                            } else {
                                importError = err
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = GeoPrimary)
                ) {
                    Text("Import & Encrypt", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showImportDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Reset Confirmation Dialog
    if (showRegenerateConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showRegenerateConfirmDialog = false },
            title = { Text("Regenerate Wallet Keys?", fontWeight = FontWeight.Bold) },
            text = {
                Text("This will purge all existing keys from Android Keystore and create a completely fresh Bitcoin wallet. Make sure you have backed up your 12 words first!")
            },
            confirmButton = {
                Button(
                    onClick = {
                        onRegenerateWallet()
                        showRegenerateConfirmDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Purge & Generate New", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showRegenerateConfirmDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun FormatPill(
    label: String,
    sub: String,
    isSelected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() },
        color = if (isSelected) GeoPrimary else Color.Transparent,
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = if (isSelected) Color.White else GeoOnSurfaceVariant,
                fontSize = 11.sp
            )
            Text(
                text = sub,
                style = MaterialTheme.typography.labelSmall,
                color = if (isSelected) Color.White.copy(alpha = 0.85f) else GeoOnSurfaceVariant.copy(alpha = 0.7f),
                fontSize = 9.sp
            )
        }
    }
}

@Composable
private fun SubAddressRow(
    item: WalletAddressItem,
    onCopy: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCopy() }
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.label,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = GeoOnSurface
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "${item.address.take(14)}...${item.address.takeLast(8)}",
                style = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                color = GeoOnSurfaceVariant,
                fontSize = 12.sp
            )
        }

        IconButton(onClick = onCopy, modifier = Modifier.size(36.dp)) {
            Icon(
                imageVector = Icons.Default.ContentCopy,
                contentDescription = "Copy",
                tint = GeoPrimary,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}
