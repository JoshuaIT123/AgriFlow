package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.TransactionItem
import com.example.data.repository.PlatformRepository
import com.example.ui.theme.*

@Composable
fun AppHeader(
    farmerName: String,
    district: String,
    onAvatarClick: () -> Unit = {},
    onUssdClick: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp)
            .testTag("app_header"),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF10B981))
                )
                Text(
                    text = "VAF UBWENGE • BITCOIN FOR FARMERS",
                    style = MaterialTheme.typography.labelSmall,
                    color = GeoOnSurfaceVariant,
                    letterSpacing = 1.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "$farmerName's Hub",
                style = MaterialTheme.typography.headlineMedium,
                color = GeoOnSurface,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = district,
                style = MaterialTheme.typography.bodyMedium,
                color = GeoOnSurfaceVariant
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            // USSD Quick Button
            FilledTonalButton(
                onClick = onUssdClick,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.filledTonalButtonColors(
                    containerColor = GeoSecondaryContainer,
                    contentColor = GeoOnSecondaryContainer
                ),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                modifier = Modifier.testTag("open_ussd_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Phone,
                    contentDescription = "USSD Feature Phone",
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = "*789#", fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }

            // User initials avatar
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(GeoPrimaryContainer)
                    .border(2.dp, Color.White, CircleShape)
                    .clickable(onClick = onAvatarClick)
                    .testTag("profile_avatar"),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "MA",
                    color = GeoOnPrimaryContainer,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
        }
    }
}

@Composable
fun ComplianceBanner() {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 4.dp),
        shape = RoundedCornerShape(16.dp),
        color = GeoSurfaceVariant.copy(alpha = 0.6f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.VerifiedUser,
                contentDescription = "CMA Law 023/2026",
                tint = GeoPrimary,
                modifier = Modifier.size(18.dp)
            )
            Column {
                Text(
                    text = "CMA Law No. 023/2026 Virtual Asset Regulated",
                    style = MaterialTheme.typography.labelSmall,
                    color = GeoOnSurface,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "1 Sat = 1.35 RWF • Licensed VASP Instant MoMo Settlement",
                    style = MaterialTheme.typography.labelSmall,
                    color = GeoOnSurfaceVariant,
                    fontSize = 10.sp
                )
            }
        }
    }
}

@Composable
fun QuickAccessCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    containerColor: Color,
    contentColor: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        modifier = modifier
            .height(115.dp)
            .testTag("quick_card_$title")
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(contentColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = contentColor,
                    modifier = Modifier.size(20.dp)
                )
            }
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = contentColor,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = contentColor.copy(alpha = 0.8f),
                    fontSize = 11.sp
                )
            }
        }
    }
}

@Composable
fun TransactionRow(
    item: TransactionItem,
    onClick: () -> Unit = {}
) {
    val (iconBg, iconTint, icon) = when (item.type) {
        "REMITTANCE" -> Triple(GeoPrimaryContainer, GeoOnPrimaryContainer, Icons.Default.Bolt)
        "PRODUCE_PAYOUT" -> Triple(GeoTertiaryContainer, GeoOnTertiaryContainer, Icons.Default.Agriculture)
        "SAVINGS_DEPOSIT" -> Triple(BitcoinOrangeContainer, BitcoinOrangeDark, Icons.Default.Savings)
        "SAVINGS_WITHDRAW" -> Triple(GeoSecondaryContainer, GeoOnSecondaryContainer, Icons.Default.CurrencyExchange)
        else -> Triple(GeoSurfaceVariant, GeoOnSurfaceVariant, Icons.Default.Receipt)
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp)
            .testTag("tx_row_${item.id}"),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(46.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(iconBg),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = item.type,
                tint = iconTint,
                modifier = Modifier.size(24.dp)
            )
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.counterparty,
                style = MaterialTheme.typography.titleMedium,
                color = GeoOnSurface,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp
            )
            Text(
                text = item.note,
                style = MaterialTheme.typography.bodyMedium,
                color = GeoOnSurfaceVariant,
                fontSize = 11.sp,
                maxLines = 1
            )
            Text(
                text = PlatformRepository.formatDate(item.timestamp),
                style = MaterialTheme.typography.labelSmall,
                color = GeoOnSurfaceVariant.copy(alpha = 0.7f),
                fontSize = 10.sp
            )
        }

        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = "+ ${PlatformRepository.formatRwf(item.amountRwf)}",
                style = MaterialTheme.typography.titleMedium,
                color = GeoPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp
            )
            Text(
                text = "${PlatformRepository.formatSats(item.amountSats)}",
                style = MaterialTheme.typography.labelSmall,
                color = BitcoinOrangeDark,
                fontWeight = FontWeight.Medium,
                fontSize = 11.sp
            )
        }
    }
}
