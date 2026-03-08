package com.obelisk.app.ui.search

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.theme.ObeliskTheme

/**
 * Search pill for the mini sheet idle state.
 * Shows a rotating placeholder when empty and unfocused,
 * grows vertically as text wraps, and switches between mic/clear icons.
 *
 * @param query Current search text.
 * @param onQueryChange Called when text changes.
 * @param onFocused Called when the text field gains focus.
 * @param onCleared Called when the clear button is tapped.
 * @param autoFocus When true, requests focus on first composition (opens keyboard).
 * @param modifier Modifier applied to the pill container.
 */
@Composable
fun SearchPill(
    query: String,
    onQueryChange: (String) -> Unit,
    onFocused: () -> Unit,
    onCleared: () -> Unit,
    autoFocus: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val colors = ObeliskTheme.colors
    val focusRequester = remember { FocusRequester() }
    val focusManager = LocalFocusManager.current

    if (autoFocus) {
        LaunchedEffect(Unit) {
            focusRequester.requestFocus()
        }
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 50.dp)
            .clip(ObeliskTheme.shapes.xl2)
            .background(colors.elevated)
            .padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = Icons.Default.Search,
            contentDescription = "Search",
            tint = colors.tertiary,
            modifier = Modifier.size(20.dp),
        )

        Box(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 8.dp),
            contentAlignment = Alignment.CenterStart,
        ) {
            if (query.isEmpty()) {
                RotatingPlaceholder()
            }
            BasicTextField(
                value = query,
                onValueChange = onQueryChange,
                textStyle = ObeliskTheme.typography.body.copy(color = colors.foreground),
                cursorBrush = SolidColor(colors.accent),
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { focusManager.clearFocus() }),
                modifier = Modifier
                    .fillMaxWidth()
                    .focusRequester(focusRequester)
                    .onFocusChanged { state ->
                        if (state.isFocused) onFocused()
                    },
            )
        }

        if (query.isNotEmpty()) {
            IconButton(onClick = {
                onQueryChange("")
                focusRequester.freeFocus()
                onCleared()
            }) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Clear search",
                    tint = colors.tertiary,
                    modifier = Modifier.size(20.dp),
                )
            }
        } else {
            IconButton(onClick = { }) {
                Icon(
                    imageVector = Icons.Default.Mic,
                    contentDescription = "Voice search",
                    tint = colors.tertiary,
                    modifier = Modifier.size(20.dp),
                )
            }
        }
    }
}
