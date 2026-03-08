package com.obelisk.app.ui.sheet

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.theme.ObeliskTheme

/**
 * Body content below the top bar, visible at medium+ detents.
 * The top bar handles all mini-detent content.
 *
 * @param mode Current sheet mode.
 * @param query Current search query (used for results display).
 * @param modifier Modifier applied to the content root.
 */
@Composable
fun SheetBody(
    mode: SheetMode,
    query: String,
    modifier: Modifier = Modifier,
) {
    when (mode) {
        is SheetMode.Idle,
        is SheetMode.Searching -> { }

        is SheetMode.Results -> Text(
            text = "Search results placeholder",
            style = ObeliskTheme.typography.footnote,
            color = ObeliskTheme.colors.secondary,
            modifier = modifier.padding(horizontal = 16.dp),
        )

        is SheetMode.Poi -> Text(
            text = "POI card placeholder",
            style = ObeliskTheme.typography.footnote,
            color = ObeliskTheme.colors.secondary,
            modifier = modifier.padding(horizontal = 16.dp),
        )

        is SheetMode.Profile -> Column(modifier = modifier.padding(horizontal = 16.dp)) {
            Text(
                text = "User profile placeholder",
                style = ObeliskTheme.typography.footnote,
                color = ObeliskTheme.colors.secondary,
            )
            Text(
                text = "Settings placeholder",
                style = ObeliskTheme.typography.footnote,
                color = ObeliskTheme.colors.secondary,
                modifier = Modifier.padding(top = 8.dp),
            )
        }

        is SheetMode.Remark -> Text(
            text = "Remark placeholder",
            style = ObeliskTheme.typography.footnote,
            color = ObeliskTheme.colors.secondary,
            modifier = modifier.padding(horizontal = 16.dp),
        )
    }
}
