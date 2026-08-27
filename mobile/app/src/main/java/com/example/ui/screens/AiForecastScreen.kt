package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.CropYieldForecastResult
import com.example.data.model.FarmProfile
import com.example.data.model.PriceForecastResult
import com.example.data.repository.PlatformRepository
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiForecastScreen(
    profile: FarmProfile?,
    priceForecast: PriceForecastResult?,
    yieldForecast: CropYieldForecastResult?,
    onRecalculateYield: (crop: String, district: String, landSizeAres: Double) -> Unit
) {
    val currentProfile = profile ?: FarmProfile()

    var selectedCrop by remember { mutableStateOf(currentProfile.cropType) }
    var selectedDistrict by remember { mutableStateOf(currentProfile.district) }
    var landSizeSlider by remember { mutableStateOf(currentProfile.landSizeAres.toFloat()) }

    var isCropDropdownExpanded by remember { mutableStateOf(false) }
    var isDistrictDropdownExpanded by remember { mutableStateOf(false) }

    val crops = listOf(
        "Specialty Arabica Coffee",
        "Highland Tea",
        "Hybrid Maize",
        "Irish Potato (Kinigi)",
        "Climbing Beans"
    )

    val districts = listOf(
        "Musanze (Northern Province)",
        "Huye (Southern Province)",
        "Nyagatare (Eastern Province)",
        "Rubavu (Western Province)",
        "Rwamagana (Eastern Province)"
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("ai_forecast_screen"),
        contentPadding = PaddingValues(bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Section Header
        item {
            Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
                Text(
                    text = "SECTION 6: AI PREDICTION APIS",
                    style = MaterialTheme.typography.labelSmall,
                    color = GeoOnSurfaceVariant,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "AI Price & Harvest Radar",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = GeoOnSurface
                )
                Text(
                    text = "Directional market signals & crop cash-flow planning models",
                    style = MaterialTheme.typography.bodyMedium,
                    color = GeoOnSurfaceVariant
                )
            }
        }

        // Section 6.1: BTC/RWF Price Forecasting Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                shape = RoundedCornerShape(32.dp),
                colors = CardDefaults.cardColors(containerColor = GeoPrimaryContainer),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
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
                                    .background(GeoPrimary),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Timeline,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Text(
                                text = "6.1 PRICE FORECAST (/predict/price-trend)",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = GeoOnPrimaryContainer
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = GeoPrimary.copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = "${priceForecast?.confidenceScore ?: 89}% Confidence",
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = GeoOnPrimaryContainer,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // Qualitative Stability Indicator (Complies with document risk mitigation to prevent speculation)
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = Color.White.copy(alpha = 0.9f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = AgricultureGreen,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = "Stable Conversion Window (7-14 Days)",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = GeoOnSurface
                                )
                            }
                            Text(
                                text = priceForecast?.forecastSummary ?: "Prices have been more stable this week (+1.8%). Favorable conversion window for routine farm expenses.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = GeoOnSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "🇷🇼 ${priceForecast?.forecastSummaryKinyarwanda ?: "Igiciro kiratekanye muri iki cyumweru."}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium,
                                color = GeoPrimary,
                                fontSize = 12.sp
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Reference Index: $98,500 USD • 135M RWF / BTC",
                            style = MaterialTheme.typography.labelSmall,
                            color = GeoOnPrimaryContainer.copy(alpha = 0.8f)
                        )
                        Text(
                            text = "Non-speculative indicator",
                            style = MaterialTheme.typography.labelSmall,
                            color = GeoOnPrimaryContainer.copy(alpha = 0.7f),
                            fontSize = 9.sp
                        )
                    }
                }
            }
        }

        // Section 6.2: Crop Yield & Farm-Income Forecasting Card
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
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(GeoSecondaryContainer),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Spa,
                                    contentDescription = null,
                                    tint = GeoOnSecondaryContainer,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Text(
                                text = "6.2 CROP YIELD & INCOME MODEL",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = GeoOnSurfaceVariant
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = GeoSecondaryContainer
                        ) {
                            Text(
                                text = "/predict/harvest-income",
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = GeoOnSecondaryContainer,
                                fontSize = 10.sp
                            )
                        }
                    }

                    // Crop Type Selector
                    ExposedDropdownMenuBox(
                        expanded = isCropDropdownExpanded,
                        onExpandedChange = { isCropDropdownExpanded = !isCropDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = selectedCrop,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Crop Type") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isCropDropdownExpanded) },
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth()
                                .testTag("select_crop_field"),
                            shape = RoundedCornerShape(16.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = isCropDropdownExpanded,
                            onDismissRequest = { isCropDropdownExpanded = false }
                        ) {
                            crops.forEach { crop ->
                                DropdownMenuItem(
                                    text = { Text(crop) },
                                    onClick = {
                                        selectedCrop = crop
                                        isCropDropdownExpanded = false
                                        onRecalculateYield(crop, selectedDistrict, landSizeSlider.toDouble())
                                    }
                                )
                            }
                        }
                    }

                    // District Selector
                    ExposedDropdownMenuBox(
                        expanded = isDistrictDropdownExpanded,
                        onExpandedChange = { isDistrictDropdownExpanded = !isDistrictDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = selectedDistrict,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("District & Agro-Ecological Zone") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isDistrictDropdownExpanded) },
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth()
                                .testTag("select_district_field"),
                            shape = RoundedCornerShape(16.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = isDistrictDropdownExpanded,
                            onDismissRequest = { isDistrictDropdownExpanded = false }
                        ) {
                            districts.forEach { dist ->
                                DropdownMenuItem(
                                    text = { Text(dist) },
                                    onClick = {
                                        selectedDistrict = dist
                                        isDistrictDropdownExpanded = false
                                        onRecalculateYield(selectedCrop, dist, landSizeSlider.toDouble())
                                    }
                                )
                            }
                        }
                    }

                    // Land Size Slider
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = "Cultivated Land Size:", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                            Text(text = "${landSizeSlider.toInt()} Ares (${String.format("%.2f", landSizeSlider / 100.0)} Ha)", fontWeight = FontWeight.Bold, color = GeoPrimary)
                        }
                        Slider(
                            value = landSizeSlider,
                            onValueChange = {
                                landSizeSlider = it
                                onRecalculateYield(selectedCrop, selectedDistrict, it.toDouble())
                            },
                            valueRange = 10f..100f,
                            steps = 17,
                            modifier = Modifier.testTag("land_size_slider"),
                            colors = SliderDefaults.colors(thumbColor = GeoPrimary, activeTrackColor = GeoPrimary)
                        )
                    }

                    // Forecast Result Card
                    val forecast = yieldForecast
                    if (forecast != null) {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = GeoTertiaryContainer.copy(alpha = 0.45f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(text = "Estimated Yield Range:", style = MaterialTheme.typography.bodyMedium, color = GeoOnTertiaryContainer)
                                    Text(
                                        text = "${forecast.estimatedYieldKgMin.toInt()} - ${forecast.estimatedYieldKgMax.toInt()} kg",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = GeoOnTertiaryContainer
                                    )
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(text = "Expected Harvest Window:", style = MaterialTheme.typography.bodyMedium, color = GeoOnTertiaryContainer)
                                    Text(text = forecast.harvestWindow, fontWeight = FontWeight.Bold, color = GeoOnTertiaryContainer)
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(text = "Regional Rainfall Model:", style = MaterialTheme.typography.bodyMedium, color = GeoOnTertiaryContainer)
                                    Text(text = forecast.rainfallStatus, style = MaterialTheme.typography.labelSmall, color = GeoOnTertiaryContainer, fontWeight = FontWeight.SemiBold)
                                }

                                HorizontalDivider(color = GeoTertiary.copy(alpha = 0.2f))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(text = "Projected Harvest Cash Flow", style = MaterialTheme.typography.labelSmall, color = GeoOnTertiaryContainer)
                                        Text(
                                            text = "${PlatformRepository.formatRwf(forecast.estimatedIncomeMinRwf)} - ${PlatformRepository.formatRwf(forecast.estimatedIncomeMaxRwf)}",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = GeoOnTertiaryContainer
                                        )
                                    }

                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = BitcoinOrangeContainer
                                    ) {
                                        Column(modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp), horizontalAlignment = Alignment.End) {
                                            Text(text = "AI Suggested BTC Vault", style = MaterialTheme.typography.labelSmall, fontSize = 9.sp, color = BitcoinOrangeDark)
                                            Text(text = "+${PlatformRepository.formatSats(forecast.recommendedSavingsSats)}", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = BitcoinOrangeDark)
                                        }
                                    }
                                }

                                Text(
                                    text = forecast.advisoryNote,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = GeoOnTertiaryContainer.copy(alpha = 0.85f),
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
