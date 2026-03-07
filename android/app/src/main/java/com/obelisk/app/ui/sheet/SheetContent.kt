package com.obelisk.app.ui.sheet

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.theme.ObeliskTheme

/**
 * Renders placeholder content based on the current sheet mode.
 *
 * @param mode Current sheet mode determining what content to display.
 * @param modifier Modifier applied to the content root.
 */
@Composable
fun SheetContent(mode: SheetMode, modifier: Modifier = Modifier) {
    val text = when (mode) {
        is SheetMode.Idle -> "Explore Munich"
        is SheetMode.Search -> "Search results"
        is SheetMode.Poi -> "POI details"
        is SheetMode.Remark -> "Remark"
    }

    Text(
        text = text,
        style = ObeliskTheme.typography.body,
        color = ObeliskTheme.colors.foreground,
        modifier = modifier.padding(horizontal = 16.dp),
    )
}
