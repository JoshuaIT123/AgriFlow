package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.TransactionItem
import com.example.data.repository.PlatformRepository
import com.example.ui.theme.*

@Composable
fun TransactionDetailDialog(
    transaction: TransactionItem,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(GeoPrimaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ReceiptLong,
                        contentDescription = null,
                        tint = GeoOnPrimaryContainer,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Column {
                    Text(
                        text = "Transaction Receipt",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Status: ${transaction.status}",
                        style = MaterialTheme.typography.labelSmall,
                        color = AgricultureGreen,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = GeoSurfaceVariant.copy(alpha = 0.5f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(text = "AMOUNT SETTLED", style = MaterialTheme.typography.labelSmall, color = GeoOnSurfaceVariant)
                        Text(
                            text = PlatformRepository.formatRwf(transaction.amountRwf),
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = GeoPrimary
                        )
                        Text(
                            text = "${PlatformRepository.formatSats(transaction.amountSats)} (${PlatformRepository.formatBtc(transaction.amountSats)})",
                            style = MaterialTheme.typography.labelSmall,
                            color = BitcoinOrangeDark,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                DetailItem(label = "Type", value = transaction.type)
                DetailItem(label = "Counterparty", value = transaction.counterparty)
                DetailItem(label = "Settlement Rail", value = transaction.rail)
                DetailItem(label = "Ref / Invoice", value = transaction.phoneOrInvoice)
                DetailItem(label = "Date & Time", value = PlatformRepository.formatDate(transaction.timestamp))
                DetailItem(label = "Description", value = transaction.note)

                // Simulated SMS confirmation card for rural farmer
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFFFEF3C7),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(imageVector = Icons.Default.Sms, contentDescription = null, tint = Color(0xFF92400E), modifier = Modifier.size(14.dp))
                            Text(text = "Simulated MTN MoMo SMS Notification", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF92400E))
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Y/MoMo: Mwakiriye ${PlatformRepository.formatRwf(transaction.amountRwf)} binyuze muri Bitcoin Lightning. Reference: ${transaction.phoneOrInvoice.take(12)}.",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            color = Color(0xFF78350F)
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close", fontWeight = FontWeight.Bold)
            }
        },
        shape = RoundedCornerShape(24.dp)
    )
}

@Composable
private fun DetailItem(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodyMedium, color = GeoOnSurfaceVariant)
        Text(text = value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = GeoOnSurface)
    }
}
