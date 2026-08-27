package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AppTab
import com.example.data.model.FarmProfile
import com.example.data.model.TransactionItem
import com.example.data.repository.PlatformRepository
import com.example.ui.components.ComplianceBanner
import com.example.ui.components.QuickAccessCard
import com.example.ui.components.TransactionRow
import com.example.ui.theme.*

@Composable
fun DashboardScreen(
    profile: FarmProfile?,
    transactions: List<TransactionItem>,
    onNavigateTab: (AppTab) -> Unit,
    onOpenSendRemittance: () -> Unit,
    onOpenProducePayout: () -> Unit,
    onOpenSavingsConvert: () -> Unit,
    onSelectTransaction: (TransactionItem) -> Unit
) {
    val currentProfile = profile ?: FarmProfile()
    val btcValuationRwf = currentProfile.btcSavingsSats * 1.35
    val totalWealthRwf = currentProfile.momoBalanceRwf + btcValuationRwf

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("dashboard_screen"),
        contentPadding = PaddingValues(bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            ComplianceBanner()
        }

        // Dual Balance Hero Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .testTag("balance_hero_card"),
                shape = RoundedCornerShape(32.dp),
                colors = CardDefaults.cardColors(
                    containerColor = GeoPrimaryContainer
                ),
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
                        Text(
                            text = "TOTAL FARM WEALTH",
                            style = MaterialTheme.typography.labelSmall,
                            color = GeoOnPrimaryContainer.copy(alpha = 0.75f),
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = GeoPrimary.copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = "Lightning + MoMo",
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = GeoOnPrimaryContainer,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = PlatformRepository.formatRwf(totalWealthRwf),
                        style = MaterialTheme.typography.headlineLarge,
                        color = GeoOnPrimaryContainer,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 30.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Split Balance Breakdown Cards
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // MTN MoMo Balance
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(20.dp),
                            color = Color.White.copy(alpha = 0.85f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(10.dp)
                                            .clip(RoundedCornerShape(3.dp))
                                            .background(MomoYellow)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "MTN / Airtel MoMo",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = GeoOnSurfaceVariant,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 10.sp
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = PlatformRepository.formatRwf(currentProfile.momoBalanceRwf),
                                    style = MaterialTheme.typography.titleMedium,
                                    color = GeoOnSurface,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Ready for daily spend",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = GeoOnSurfaceVariant,
                                    fontSize = 10.sp
                                )
                            }
                        }

                        // BTC Savings Balance
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(20.dp),
                            color = Color.White.copy(alpha = 0.85f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(10.dp)
                                            .clip(RoundedCornerShape(3.dp))
                                            .background(BitcoinOrange)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "BTC Inflation Vault",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = GeoOnSurfaceVariant,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 10.sp
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = PlatformRepository.formatSats(currentProfile.btcSavingsSats),
                                    style = MaterialTheme.typography.titleMedium,
                                    color = BitcoinOrangeDark,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "≈ ${PlatformRepository.formatRwf(btcValuationRwf)}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = GeoOnSurfaceVariant,
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Savings Auto-Split Indicator
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = if (currentProfile.isSavingsOptedIn) GeoSecondaryContainer else GeoSurfaceVariant,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = if (currentProfile.isSavingsOptedIn) Icons.Default.CheckCircle else Icons.Default.Info,
                                    contentDescription = null,
                                    tint = if (currentProfile.isSavingsOptedIn) GeoOnSecondaryContainer else GeoOnSurfaceVariant,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = if (currentProfile.isSavingsOptedIn) {
                                        "Auto-Save ${currentProfile.savingsPercentage}% of Remittances into BTC"
                                    } else {
                                        "Auto-Save Inactive (0% to BTC)"
                                    },
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (currentProfile.isSavingsOptedIn) GeoOnSecondaryContainer else GeoOnSurfaceVariant,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                            TextButton(
                                onClick = { onNavigateTab(AppTab.SAVINGS) },
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Text(
                                    text = "Adjust",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = GeoPrimary,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }

        // Quick Access 2x2 Grid (Geometric Balance Design Layout)
        item {
            Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                Text(
                    text = "QUICK ACTIONS",
                    style = MaterialTheme.typography.labelSmall,
                    color = GeoOnSurfaceVariant,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 10.dp, start = 4.dp)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickAccessCard(
                        title = "Lightning Remit",
                        subtitle = "Instant from Diaspora",
                        icon = Icons.Default.Bolt,
                        containerColor = GeoPrimaryContainer,
                        contentColor = GeoOnPrimaryContainer,
                        modifier = Modifier.weight(1f),
                        onClick = onOpenSendRemittance
                    )

                    QuickAccessCard(
                        title = "Produce Payout",
                        subtitle = "Cooperative Settlement",
                        icon = Icons.Default.Agriculture,
                        containerColor = GeoSecondaryContainer,
                        contentColor = GeoOnSecondaryContainer,
                        modifier = Modifier.weight(1f),
                        onClick = onOpenProducePayout
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickAccessCard(
                        title = "Keystore Wallet",
                        subtitle = "Hardware BTC Keys",
                        icon = Icons.Default.VpnKey,
                        containerColor = GeoPrimaryContainer,
                        contentColor = GeoPrimary,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateTab(AppTab.WALLET) }
                    )

                    QuickAccessCard(
                        title = "AI Radar",
                        subtitle = "Yield & Price Forecast",
                        icon = Icons.Default.AutoGraph,
                        containerColor = BitcoinOrangeContainer,
                        contentColor = BitcoinOrangeDark,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateTab(AppTab.AI_PREDICTOR) }
                    )
                }
            }
        }

        // Recent Activity Card Section
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
                        text = "RECENT TRANSACTIONS",
                        style = MaterialTheme.typography.labelSmall,
                        color = GeoOnSurfaceVariant,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    TextButton(
                        onClick = { onNavigateTab(AppTab.REMITTANCE) },
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Text(
                            text = "View all",
                            style = MaterialTheme.typography.labelSmall,
                            color = GeoPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(32.dp),
                    colors = CardDefaults.cardColors(containerColor = GeoSurface),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = Brush.verticalGradient(listOf(GeoOutline, GeoOutline.copy(alpha = 0.5f)))
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp)
                    ) {
                        if (transactions.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No transactions recorded yet.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = GeoOnSurfaceVariant
                                )
                            }
                        } else {
                            transactions.take(5).forEachIndexed { index, tx ->
                                TransactionRow(
                                    item = tx,
                                    onClick = { onSelectTransaction(tx) }
                                )
                                if (index < transactions.take(5).size - 1) {
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
