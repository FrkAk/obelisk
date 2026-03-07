package com.obelisk.app.ui.map

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.NightsStay
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.common.GlassSurface
import com.obelisk.app.ui.theme.ObeliskTheme

/**
 * Hardcoded weather pill showing a moon/sun icon and temperature.
 * Top-left overlay on the map.
 *
 * @param modifier Modifier to apply.
 */
@Composable
fun WeatherPill(modifier: Modifier = Modifier) {
    val isDark = isSystemInDarkTheme()
    val icon = if (isDark) Icons.Default.NightsStay else Icons.Default.WbSunny

    GlassSurface(modifier = modifier) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = "Weather",
                tint = ObeliskTheme.colors.foreground,
                modifier = Modifier.size(16.dp),
            )
            Text(
                text = "9\u00B0",
                style = ObeliskTheme.typography.caption1,
                color = ObeliskTheme.colors.foreground,
            )
        }
    }
}
