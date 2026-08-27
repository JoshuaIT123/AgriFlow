package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme =
  darkColorScheme(
    primary = GeoPrimaryContainer,
    onPrimary = GeoOnPrimaryContainer,
    primaryContainer = GeoPrimary,
    onPrimaryContainer = GeoOnPrimary,
    secondary = GeoSecondaryContainer,
    onSecondary = GeoOnSecondaryContainer,
    secondaryContainer = GeoSecondary,
    onSecondaryContainer = GeoOnSecondary,
    tertiary = GeoTertiaryContainer,
    onTertiary = GeoOnTertiaryContainer,
    background = Color(0xFF131316),
    surface = Color(0xFF1B1B1F),
    onBackground = Color(0xFFE3E2E6),
    onSurface = Color(0xFFE3E2E6),
    surfaceVariant = Color(0xFF44474F),
    onSurfaceVariant = Color(0xFFC7C6CF),
    outline = Color(0xFF8E9099)
  )

private val LightColorScheme =
  lightColorScheme(
    primary = GeoPrimary,
    onPrimary = GeoOnPrimary,
    primaryContainer = GeoPrimaryContainer,
    onPrimaryContainer = GeoOnPrimaryContainer,
    secondary = GeoSecondary,
    onSecondary = GeoOnSecondary,
    secondaryContainer = GeoSecondaryContainer,
    onSecondaryContainer = GeoOnSecondaryContainer,
    tertiary = GeoTertiary,
    onTertiary = GeoOnTertiary,
    tertiaryContainer = GeoTertiaryContainer,
    onTertiaryContainer = GeoOnTertiaryContainer,
    background = GeoBackground,
    surface = GeoSurface,
    onBackground = GeoOnSurface,
    onSurface = GeoOnSurface,
    surfaceVariant = GeoSurfaceVariant,
    onSurfaceVariant = GeoOnSurfaceVariant,
    outline = GeoOutline,
  )

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit,
) {
  val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

  MaterialTheme(
    colorScheme = colorScheme,
    typography = Typography,
    content = content
  )
}

