package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.example.data.model.TransactionItem
import com.example.data.repository.PlatformRepository
import com.example.ui.components.TransactionRow
import com.example.ui.theme.*

@Composable
fun RemittanceScreen(
    profile: FarmProfile?,
    transactions: List<TransactionItem>,
    onSendRemittance: (senderName: String, amountSats: Long, location: String, targetPhone: String) -> Unit,
    onProduceSettlement: (coopName: String, crop: String, qtyKg: Double, pricePerKg: Double, buyerPhone: String) -> Unit,
    onSelectTransaction: (TransactionItem) -> Unit
) {
    var subTab by remember { mutableStateOf(0) } // 0: Diaspora Remit, 1: Produce Payout, 2: All History

    // Remittance Form State
    var senderName by remember { mutableStateOf("Keza Diane") }
    var senderLocation by remember { mutableStateOf("Brussels, Belgium") }
    var satsAmountText by remember { mutableStateOf("75000") }
    var targetPhone by remember { mutableStateOf(profile?.phoneNumber ?: "+250 788 452 918") }

    // Produce Form State
    var coopName by remember { mutableStateOf("COOPAC Coffee Musanze") }
    var cropType by remember { mutableStateOf(profile?.cropType ?: "Specialty Arabica Coffee") }
    var qtyKgText by remember { mutableStateOf("150") }
    var pricePerKgText by remember { mutableStateOf("1250") }
    var buyerPhone by remember { mutableStateOf("+250 788 990 112") }

    val currentSats = satsAmountText.toLongOrNull() ?: 0L
    val calculatedRwf = currentSats * 1.35
    val currentSavingsPct = profile?.savingsPercentage ?: 10
    val savedSatsEst = (currentSats * (currentSavingsPct / 100.0)).toLong()
    val netMoMoRwfEst = calculatedRwf - (savedSatsEst * 1.35)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("remittance_screen"),
        contentPadding = PaddingValues(bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Segmented Control Header
        item {
            Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
                Text(
                    text = "REMITTANCES & PRODUCE PAYMENTS",
                    style = MaterialTheme.typography.labelSmall,
                    color = GeoOnSurfaceVariant,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))

                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = GeoSurfaceVariant,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        TabPill(
                            title = "Lightning Remit",
                            selected = subTab == 0,
                            modifier = Modifier.weight(1f),
                            onClick = { subTab = 0 }
                        )
                        TabPill(
                            title = "Produce Rails",
                            selected = subTab == 1,
                            modifier = Modifier.weight(1f),
                            onClick = { subTab = 1 }
                        )
                        TabPill(
                            title = "History",
                            selected = subTab == 2,
                            modifier = Modifier.weight(1f),
                            onClick = { subTab = 2 }
                        )
                    }
                }
            }
        }

        when (subTab) {
            0 -> {
                // DIASPORA REMITTANCE FORM
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
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(GeoPrimaryContainer),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Bolt,
                                        contentDescription = null,
                                        tint = GeoOnPrimaryContainer,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Column {
                                    Text(
                                        text = "Diaspora Remittance Rail",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = GeoOnSurface,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Lightning settlement -> Instant MTN/Airtel MoMo",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = GeoOnSurfaceVariant
                                    )
                                }
                            }

                            OutlinedTextField(
                                value = senderName,
                                onValueChange = { senderName = it },
                                label = { Text("Sender Name (Diaspora)") },
                                singleLine = true,
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth().testTag("input_sender_name")
                            )

                            OutlinedTextField(
                                value = senderLocation,
                                onValueChange = { senderLocation = it },
                                label = { Text("Sender City & Country") },
                                singleLine = true,
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth().testTag("input_sender_location")
                            )

                            OutlinedTextField(
                                value = satsAmountText,
                                onValueChange = { satsAmountText = it },
                                label = { Text("Amount in Satoshis (Sats)") },
                                trailingIcon = { Text("sats", fontWeight = FontWeight.Bold, color = BitcoinOrangeDark, modifier = Modifier.padding(end = 12.dp)) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth().testTag("input_remit_sats")
                            )

                            OutlinedTextField(
                                value = targetPhone,
                                onValueChange = { targetPhone = it },
                                label = { Text("Farmer Rwanda Phone (+250...)") },
                                singleLine = true,
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth().testTag("input_target_phone")
                            )

                            // Live Conversion Preview Card
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = GeoPrimaryContainer.copy(alpha = 0.5f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(text = "Total Value:", style = MaterialTheme.typography.bodyMedium, color = GeoOnPrimaryContainer)
                                        Text(text = PlatformRepository.formatRwf(calculatedRwf), fontWeight = FontWeight.Bold, color = GeoOnPrimaryContainer)
                                    }
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(text = "Auto-Save to BTC ($currentSavingsPct%):", style = MaterialTheme.typography.bodyMedium, color = BitcoinOrangeDark)
                                        Text(text = "+${PlatformRepository.formatSats(savedSatsEst)} (~${PlatformRepository.formatRwf(savedSatsEst * 1.35)})", fontWeight = FontWeight.Bold, color = BitcoinOrangeDark)
                                    }
                                    HorizontalDivider(color = GeoPrimary.copy(alpha = 0.2f))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(text = "Direct MoMo Deposit (RWF):", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = GeoPrimary)
                                        Text(text = PlatformRepository.formatRwf(netMoMoRwfEst), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold, color = GeoPrimary)
                                    }
                                }
                            }

                            Button(
                                onClick = {
                                    if (currentSats > 0 && senderName.isNotBlank()) {
                                        onSendRemittance(senderName, currentSats, senderLocation, targetPhone)
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp)
                                    .testTag("submit_remittance_button"),
                                shape = RoundedCornerShape(16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = GeoPrimary)
                            ) {
                                Icon(imageVector = Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = "Simulate Lightning Remittance", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            }
                        }
                    }
                }
            }

            1 -> {
                // PRODUCE & BUYER PAYMENT FORM (PHASE 3)
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
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(GeoSecondaryContainer),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Agriculture,
                                        contentDescription = null,
                                        tint = GeoOnSecondaryContainer,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Column {
                                    Text(
                                        text = "Cooperative & Buyer Payout",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = GeoOnSurface,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Phase 3: Fast cross-border settlement for produce",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = GeoOnSurfaceVariant
                                    )
                                }
                            }

                            OutlinedTextField(
                                value = coopName,
                                onValueChange = { coopName = it },
                                label = { Text("Cooperative / Buyer Entity") },
                                singleLine = true,
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth().testTag("input_coop_name")
                            )

                            OutlinedTextField(
                                value = cropType,
                                onValueChange = { cropType = it },
                                label = { Text("Crop Commodity") },
                                singleLine = true,
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth().testTag("input_crop_type")
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                OutlinedTextField(
                                    value = qtyKgText,
                                    onValueChange = { qtyKgText = it },
                                    label = { Text("Quantity (Kg)") },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier.weight(1f).testTag("input_produce_qty")
                                )

                                OutlinedTextField(
                                    value = pricePerKgText,
                                    onValueChange = { pricePerKgText = it },
                                    label = { Text("Price/Kg (RWF)") },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier.weight(1f).testTag("input_produce_price")
                                )
                            }

                            val qty = qtyKgText.toDoubleOrNull() ?: 0.0
                            val price = pricePerKgText.toDoubleOrNull() ?: 0.0
                            val produceTotalRwf = qty * price

                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = GeoSecondaryContainer.copy(alpha = 0.5f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(text = "Total Settlement:", style = MaterialTheme.typography.bodyMedium, color = GeoOnSecondaryContainer)
                                        Text(text = PlatformRepository.formatRwf(produceTotalRwf), fontWeight = FontWeight.Bold, color = GeoOnSecondaryContainer)
                                    }
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(text = "Lightning Sats Equivalent:", style = MaterialTheme.typography.bodyMedium, color = GeoOnSecondaryContainer)
                                        Text(text = PlatformRepository.formatSats((produceTotalRwf / 1.35).toLong()), fontWeight = FontWeight.Bold, color = GeoOnSecondaryContainer)
                                    }
                                }
                            }

                            Button(
                                onClick = {
                                    if (qty > 0 && price > 0) {
                                        onProduceSettlement(coopName, cropType, qty, price, buyerPhone)
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp)
                                    .testTag("submit_produce_button"),
                                shape = RoundedCornerShape(16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = GeoSecondary)
                            ) {
                                Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = "Execute Produce Payout", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            }
                        }
                    }
                }
            }

            2 -> {
                // FULL TRANSACTION HISTORY
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
                                .padding(12.dp)
                        ) {
                            Text(
                                text = "All Transactions Ledger (${transactions.size})",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = GeoOnSurface,
                                modifier = Modifier.padding(8.dp)
                            )
                            HorizontalDivider(color = GeoSurfaceVariant)

                            if (transactions.isEmpty()) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(32.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("No records found.", color = GeoOnSurfaceVariant)
                                }
                            } else {
                                transactions.forEachIndexed { index, item ->
                                    TransactionRow(
                                        item = item,
                                        onClick = { onSelectTransaction(item) }
                                    )
                                    if (index < transactions.size - 1) {
                                        HorizontalDivider(
                                            color = GeoSurfaceVariant.copy(alpha = 0.6f),
                                            modifier = Modifier.padding(horizontal = 12.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TabPill(
    title: String,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        color = if (selected) GeoPrimary else Color.Transparent,
        modifier = modifier.height(38.dp)
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                color = if (selected) GeoOnPrimary else GeoOnSurfaceVariant
            )
        }
    }
}
