package com.obelisk.app.ui.sheet

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.theme.ObeliskTheme

/**
 * Compact POI info bar for the mini sheet when a POI is selected.
 * Shows share button, POI name + category, and close button.
 *
 * @param poiName Name of the selected POI.
 * @param poiCategory Optional category label.
 * @param onShareClick Called when the share button is tapped.
 * @param onCloseClick Called when the close button is tapped.
 * @param modifier Modifier applied to the row container.
 */
@Composable
fun MiniPoiBar(
    poiName: String,
    poiCategory: String?,
    onShareClick: () -> Unit,
    onCloseClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onShareClick) {
            Icon(
                imageVector = Icons.Default.Share,
                contentDescription = "Share",
                tint = ObeliskTheme.colors.foreground,
                modifier = Modifier.size(24.dp),
            )
        }

        Column(
            modifier = Modifier.weight(1f),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = poiName,
                style = ObeliskTheme.typography.subhead.copy(fontWeight = FontWeight.SemiBold),
                color = ObeliskTheme.colors.foreground,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            if (poiCategory != null) {
                Text(
                    text = poiCategory,
                    style = ObeliskTheme.typography.footnote,
                    color = ObeliskTheme.colors.secondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }

        IconButton(onClick = onCloseClick) {
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "Close",
                tint = ObeliskTheme.colors.foreground,
                modifier = Modifier.size(24.dp),
            )
        }
    }
}
