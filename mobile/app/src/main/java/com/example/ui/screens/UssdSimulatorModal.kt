package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.ui.viewmodel.UssdScreenState

@Composable
fun UssdSimulatorScreen(
    ussdState: UssdScreenState,
    onSendInput: (String) -> Unit,
    onClose: () -> Unit,
    onReset: () -> Unit
) {
    var dialInput by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(GeoBackground)
            .padding(16.dp)
            .testTag("ussd_simulator_screen"),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Top Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "FEATURE PHONE USSD GATEWAY",
                    style = MaterialTheme.typography.labelSmall,
                    color = GeoOnSurfaceVariant,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "Rural Farmer Sim (*789#)",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = GeoOnSurface
                )
            }

            IconButton(onClick = onReset) {
                Icon(imageVector = Icons.Default.Refresh, contentDescription = "Reset USSD", tint = GeoPrimary)
            }
        }

        // Retro Feature Phone Screen Bezel
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f, fill = false),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                // Phone Status Bar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "MTN-RW / AIRTEL",
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("4G", color = Color(0xFF94A3B8), fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        Icon(imageVector = Icons.Default.SignalCellularAlt, contentDescription = null, tint = Color(0xFF94A3B8), modifier = Modifier.size(14.dp))
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Greenish Monospace LCD Screen
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFF0F172A),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = androidx.compose.ui.graphics.SolidColor(Color(0xFF334155))
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = ussdState.screenTitle,
                            color = Color(0xFF38BDF8),
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            fontFamily = FontFamily.Monospace
                        )
                        HorizontalDivider(color = Color(0xFF334155))

                        if (ussdState.messageResponse != null) {
                            Text(
                                text = ussdState.messageResponse,
                                color = Color(0xFFF1F5F9),
                                fontSize = 13.sp,
                                lineHeight = 18.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        ussdState.menuOptions.forEach { opt ->
                            Text(
                                text = opt,
                                color = Color(0xFFE2E8F0),
                                fontSize = 12.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        // Current entered number prompt
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFF1E293B), RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "> ", color = Color(0xFF38BDF8), fontFamily = FontFamily.Monospace)
                            Text(
                                text = dialInput.ifEmpty { "..." },
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }

        // Numeric USSD Keypad Grid
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val keys = listOf(
                listOf("1", "2", "3"),
                listOf("4", "5", "6"),
                listOf("7", "8", "9"),
                listOf("*", "0", "#")
            )

            keys.forEach { row ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    row.forEach { key ->
                        Surface(
                            onClick = {
                                dialInput += key
                            },
                            shape = RoundedCornerShape(16.dp),
                            color = GeoSurface,
                            border = CardDefaults.outlinedCardBorder().copy(
                                brush = androidx.compose.ui.graphics.SolidColor(GeoOutline.copy(alpha = 0.5f))
                            ),
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
                                .testTag("keypad_$key")
                        ) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text(
                                    text = key,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = GeoOnSurface
                                )
                            }
                        }
                    }
                }
            }

            // Send & Clear Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = { dialInput = "" },
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = GeoSurfaceVariant),
                    modifier = Modifier.weight(1f).height(48.dp)
                ) {
                    Text("Clear", color = GeoOnSurfaceVariant, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = {
                        if (dialInput.isNotEmpty()) {
                            onSendInput(dialInput)
                            dialInput = ""
                        }
                    },
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = GeoPrimary),
                    modifier = Modifier.weight(2f).height(48.dp).testTag("ussd_send_button")
                ) {
                    Text("Send Input (Ohereza)", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
