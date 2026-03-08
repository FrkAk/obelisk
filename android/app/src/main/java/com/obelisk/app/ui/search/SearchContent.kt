package com.obelisk.app.ui.search

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.theme.ObeliskTheme

/**
 * Search mode content: back arrow + focused search pill.
 * Sits in the mini sheet floating above the keyboard.
 *
 * @param query Current search text.
 * @param onQueryChange Called when text changes.
 * @param onBackClick Called when back arrow is tapped — returns to idle.
 * @param modifier Modifier applied to the row.
 */
@Composable
fun SearchContent(
    query: String,
    onQueryChange: (String) -> Unit,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.padding(start = 4.dp, end = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onBackClick) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint = ObeliskTheme.colors.foreground,
            )
        }
        SearchPill(
            query = query,
            onQueryChange = onQueryChange,
            onFocused = { },
            onCleared = onBackClick,
            autoFocus = true,
            modifier = Modifier.weight(1f),
        )
    }
}
