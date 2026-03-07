package com.obelisk.app.ui.map

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.common.GlassSurface
import com.obelisk.app.ui.theme.ObeliskTheme

/**
 * Glass-floating binoculars button, bottom-left of the map.
 * Placeholder — no action in V0.1.
 *
 * @param modifier Modifier to apply.
 */
@Composable
fun LookAroundButton(modifier: Modifier = Modifier) {
    GlassSurface(modifier = modifier.size(44.dp)) {
        IconButton(onClick = { }, modifier = Modifier.size(48.dp)) {
            Icon(
                imageVector = Icons.Default.Visibility,
                contentDescription = "Look Around",
                tint = ObeliskTheme.colors.foreground,
                modifier = Modifier.size(20.dp),
            )
        }
    }
}
