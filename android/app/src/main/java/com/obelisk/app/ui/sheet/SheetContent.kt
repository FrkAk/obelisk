package com.obelisk.app.ui.sheet

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.common.UserAvatar
import com.obelisk.app.ui.search.SearchContent
import com.obelisk.app.ui.search.SearchPill
import com.obelisk.app.ui.theme.ObeliskTheme

/**
 * Renders content based on the current sheet mode.
 *
 * @param mode Current sheet mode determining what content to display.
 * @param query Current search query text.
 * @param onQueryChange Called when search text changes.
 * @param onSearchFocused Called when the search pill gains focus.
 * @param onSearchCleared Called when search is cleared or back is tapped.
 * @param onPoiShareClick Called when share is tapped in POI mode.
 * @param onPoiCloseClick Called when close is tapped in POI mode.
 * @param onAvatarClick Called when the user avatar is tapped.
 * @param onProfileCloseClick Called when the profile close button is tapped.
 * @param modifier Modifier applied to the content root.
 */
@Composable
fun SheetContent(
    mode: SheetMode,
    query: String,
    onQueryChange: (String) -> Unit,
    onSearchFocused: () -> Unit,
    onSearchCleared: () -> Unit,
    onPoiShareClick: () -> Unit,
    onPoiCloseClick: () -> Unit,
    onAvatarClick: () -> Unit,
    onProfileCloseClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    when (mode) {
        is SheetMode.Idle -> IdleContent(
            query = query,
            onQueryChange = onQueryChange,
            onSearchFocused = onSearchFocused,
            onSearchCleared = onSearchCleared,
            onAvatarClick = onAvatarClick,
            modifier = modifier,
        )
        is SheetMode.Poi -> MiniPoiBar(
            poiName = mode.name,
            poiCategory = mode.category,
            onShareClick = onPoiShareClick,
            onCloseClick = onPoiCloseClick,
            modifier = modifier.padding(horizontal = 8.dp),
        )
        is SheetMode.Search -> SearchContent(
            query = query,
            onQueryChange = onQueryChange,
            onBackClick = onSearchCleared,
            modifier = modifier,
        )
        is SheetMode.Profile -> ProfileContent(
            onCloseClick = onProfileCloseClick,
            modifier = modifier,
        )
        is SheetMode.Remark -> Text(
            text = "Remark",
            style = ObeliskTheme.typography.body,
            color = ObeliskTheme.colors.foreground,
            modifier = modifier.padding(horizontal = 16.dp),
        )
    }
}

/**
 * Idle mode content: search pill with user avatar on the right.
 *
 * @param query Current search query text.
 * @param onQueryChange Called when search text changes.
 * @param onSearchFocused Called when the search pill gains focus.
 * @param onSearchCleared Called when search is cleared.
 * @param onAvatarClick Called when the user avatar is tapped.
 * @param modifier Modifier applied to the row.
 */
@Composable
private fun IdleContent(
    query: String,
    onQueryChange: (String) -> Unit,
    onSearchFocused: () -> Unit,
    onSearchCleared: () -> Unit,
    onAvatarClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        SearchPill(
            query = query,
            onQueryChange = onQueryChange,
            onFocused = onSearchFocused,
            onCleared = onSearchCleared,
            modifier = Modifier.weight(1f),
        )
        Spacer(modifier = Modifier.padding(start = 8.dp))
        UserAvatar(onClick = onAvatarClick)
    }
}

/**
 * Placeholder profile content with close button.
 *
 * @param onCloseClick Called when the close button is tapped.
 * @param modifier Modifier applied to the column.
 */
@Composable
private fun ProfileContent(
    onCloseClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.padding(horizontal = 16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "Profile",
                style = ObeliskTheme.typography.subhead,
                color = ObeliskTheme.colors.foreground,
                modifier = Modifier.weight(1f),
            )
            IconButton(onClick = onCloseClick) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Close",
                    tint = ObeliskTheme.colors.foreground,
                )
            }
        }
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
}
