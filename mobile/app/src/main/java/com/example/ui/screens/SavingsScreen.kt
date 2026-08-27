package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.FarmProfile
import com.example.data.repository.PlatformRepository
import com.example.ui.theme.*

@Composable
fun SavingsScreen(
    profile: FarmProfile?,
    onUpdateSavings: (optIn: Boolean, percentage: Int) -> Unit,
    onConvertSatsToMomo: (Long) -> Unit,
    onConvertMomoToSats: (Double) -> Unit
) {
    val currentProfile = profile ?: FarmProfile()
    var isOptedIn by remember(currentProfile.isSavingsOptedIn) { mutableStateOf(currentProfile.isSavingsOptedIn) }
    var selectedPercentage by remember(currentProfile.savingsPercentage) { mutableStateOf(currentProfile.savingsPercentage) }

    var showDisclaimerDialog by remember { mutableStateOf(false) }

    // Conversion Tab: 0 = Sats to MoMo, 1 = MoMo to Sats
    var convertMode by remember { mutableStateOf(0) }
    var convertAmountInput by remember { mutableStateOf("50000") }

    val btcValuationRwf = currentProfile.btcSavingsSats * 1.35

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("savings_screen"),
        contentPadding = PaddingValues(bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Top Header
        item {
            Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
                Text(
                    text = "PHASE 2: OPT-IN SAVINGS LAYER",
                    style = MaterialTheme.typography.labelSmall,
                    color = GeoOnSurfaceVariant,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Bitcoin Inflation Vault",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = GeoOnSurface
                )
                Text(
                    text = "Protect smallholder farm savings against currency erosion",
                    style = MaterialTheme.typography.bodyMedium,
                    color = GeoOnSurfaceVariant
                )
            }
        }

        // Vault Balance Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                shape = RoundedCornerShape(32.dp),
                colors = CardDefaults.cardColors(containerColor = BitcoinOrangeContainer),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(BitcoinOrange),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("₿", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                            Text(
                                text = "STORED SAVINGS",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = BitcoinOrangeDark
                            )
                        }
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = BitcoinOrange.copy(alpha = 0.2f)
                        ) {
                            Text(
                                text = "Custodial Bridge",
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = BitcoinOrangeDark,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = PlatformRepository.formatSats(currentProfile.btcSavingsSats),
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = BitcoinOrangeDark,
                        fontSize = 32.sp
                    )
                    Text(
                        text = "≈ ${PlatformRepository.formatRwf(btcValuationRwf)} (${PlatformRepository.formatBtc(currentProfile.btcSavingsSats)})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = BitcoinOrangeDark.copy(alpha = 0.85f)
                    )
                }
            }
        }

        // Auto-Save Configuration Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                shape = RoundedCornerShape(32.dp),
                colors = CardDefaults.cardColors(containerColor = GeoSurface),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(GeoOutline)
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Auto-Save Percentage",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = GeoOnSurface
                            )
                            Text(
                                text = "Diverts a fraction of payouts into Satoshi vault",
                                style = MaterialTheme.typography.labelSmall,
                                color = GeoOnSurfaceVariant
                            )
                        }
                        Switch(
                            checked = isOptedIn,
                            onCheckedChange = {
                                isOptedIn = it
                                onUpdateSavings(it, selectedPercentage)
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = GeoOnPrimary,
                                checkedTrackColor = GeoPrimary
                            ),
                            modifier = Modifier.testTag("savings_optin_switch")
                        )
                    }

                    if (isOptedIn) {
                        Text(
                            text = "Choose percentage to hedge ($selectedPercentage%):",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = GeoOnSurface
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf(5, 10, 15, 20, 25).forEach { pct ->
                                val selected = selectedPercentage == pct
                                Surface(
                                    onClick = {
                                        selectedPercentage = pct
                                        onUpdateSavings(true, pct)
                                    },
                                    shape = RoundedCornerShape(14.dp),
                                    color = if (selected) GeoPrimary else GeoSurfaceVariant,
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(44.dp)
                                        .testTag("pct_button_$pct")
                                ) {
                                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                        Text(
                                            text = "$pct%",
                                            fontWeight = FontWeight.Bold,
                                            color = if (selected) GeoOnPrimary else GeoOnSurfaceVariant,
                                            fontSize = 13.sp
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Kinyarwanda / Plain-language regulatory disclosure button
                    Surface(
                        onClick = { showDisclaimerDialog = true },
                        shape = RoundedCornerShape(16.dp),
                        color = GeoSurfaceVariant.copy(alpha = 0.6f),
                        modifier = Modifier.fillMaxWidth().testTag("open_disclaimer_button")
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Gavel,
                                contentDescription = null,
                                tint = GeoPrimary,
                                modifier = Modifier.size(20.dp)
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Amategeko & Ibisobanuro (Plain Disclosure)",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = GeoOnSurface
                                )
                                Text(
                                    text = "Read Plain Kinyarwanda & English Volatility Policy",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontSize = 10.sp,
                                    color = GeoOnSurfaceVariant
                                )
                            }
                            Icon(imageVector = Icons.Default.ChevronRight, contentDescription = null, tint = GeoOnSurfaceVariant)
                        }
                    }
                }
            }
        }

        // Instant Conversion Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                shape = RoundedCornerShape(32.dp),
                colors = CardDefaults.cardColors(containerColor = GeoSurface),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(GeoOutline)
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Instant Vault Conversion",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = GeoOnSurface
                    )

                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = GeoSurfaceVariant,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(modifier = Modifier.padding(4.dp)) {
                            Surface(
                                onClick = { convertMode = 0 },
                                shape = RoundedCornerShape(12.dp),
                                color = if (convertMode == 0) GeoPrimary else Color.Transparent,
                                modifier = Modifier.weight(1f).height(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = "Withdraw Sats → MoMo",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (convertMode == 0) GeoOnPrimary else GeoOnSurfaceVariant
                                    )
                                }
                            }
                            Surface(
                                onClick = { convertMode = 1 },
                                shape = RoundedCornerShape(12.dp),
                                color = if (convertMode == 1) GeoPrimary else Color.Transparent,
                                modifier = Modifier.weight(1f).height(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = "Deposit MoMo → Sats",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (convertMode == 1) GeoOnPrimary else GeoOnSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    if (convertMode == 0) {
                        // Withdraw Sats to MoMo
                        val satsInput = convertAmountInput.toLongOrNull() ?: 0L
                        val estimatedRwf = satsInput * 1.35

                        OutlinedTextField(
                            value = convertAmountInput,
                            onValueChange = { convertAmountInput = it },
                            label = { Text("Satoshis to Cash Out") },
                            trailingIcon = { Text("sats", fontWeight = FontWeight.Bold, color = BitcoinOrangeDark, modifier = Modifier.padding(end = 12.dp)) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth().testTag("input_convert_sats")
                        )

                        Text(
                            text = "Will deposit ≈ ${PlatformRepository.formatRwf(estimatedRwf)} directly into your Mobile Money (${currentProfile.phoneNumber})",
                            style = MaterialTheme.typography.labelSmall,
                            color = GeoOnSurfaceVariant
                        )

                        Button(
                            onClick = {
                                if (satsInput > 0) {
                                    onConvertSatsToMomo(satsInput)
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(48.dp).testTag("button_convert_sats"),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = GeoPrimary)
                        ) {
                            Text("Confirm Cashout to MoMo", fontWeight = FontWeight.Bold)
                        }
                    } else {
                        // Deposit MoMo to Sats
                        val rwfInput = convertAmountInput.toDoubleOrNull() ?: 0.0
                        val estimatedSats = (rwfInput / 1.35).toLong()

                        OutlinedTextField(
                            value = convertAmountInput,
                            onValueChange = { convertAmountInput = it },
                            label = { Text("RWF to Save in Vault") },
                            trailingIcon = { Text("RWF", fontWeight = FontWeight.Bold, color = GeoPrimary, modifier = Modifier.padding(end = 12.dp)) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth().testTag("input_convert_momo")
                        )

                        Text(
                            text = "Will deduct from Mobile Money and add ≈ ${PlatformRepository.formatSats(estimatedSats)} into your BTC Vault",
                            style = MaterialTheme.typography.labelSmall,
                            color = GeoOnSurfaceVariant
                        )

                        Button(
                            onClick = {
                                if (rwfInput > 0) {
                                    onConvertMomoToSats(rwfInput)
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(48.dp).testTag("button_convert_momo"),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BitcoinOrangeDark)
                        ) {
                            Text("Top Up Bitcoin Savings", fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                }
            }
        }
    }

    if (showDisclaimerDialog) {
        AlertDialog(
            onDismissRequest = { showDisclaimerDialog = false },
            title = {
                Text(
                    text = "Amategeko & Ibisobanuro ku Bucuruzi bwa Bitcoin (Law No. 023/2026)",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "🇷🇼 Mu Kinyarwanda:",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = GeoPrimary
                    )
                    Text(
                        text = "1. Kuzigama muri Bitcoin ni amahitamo yawe 100% ku bushake (Opt-in). Nta gahato ko kubikora.\n2. Igiciro cya Bitcoin gishobora kuzamuka cyangwa kumanuka ku isoko ry'isi.\n3. Amafaranga yawe y'ibanze yakirwa mu RWF kuri MTN Mobile Money / Airtel Money ako kanya binyuze muri Partner wemewe na CMA.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = GeoOnSurfaceVariant
                    )
                    HorizontalDivider()
                    Text(
                        text = "🇬🇧 In English:",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = GeoPrimary
                    )
                    Text(
                        text = "Under Rwanda Law No. 023/2026 on Virtual Asset Business, Bitcoin conversion services are provided in partnership with a CMA-licensed VASP. No funds are forced into crypto exposure without explicit farmer opt-in.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = GeoOnSurfaceVariant
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showDisclaimerDialog = false }) {
                    Text("Nabyumvise (Understood)", fontWeight = FontWeight.Bold)
                }
            },
            shape = RoundedCornerShape(24.dp)
        )
    }
}
