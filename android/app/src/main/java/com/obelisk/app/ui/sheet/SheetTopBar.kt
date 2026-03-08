package com.obelisk.app.ui.sheet

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.common.UserAvatar
import com.obelisk.app.ui.search.SearchPill
import com.obelisk.app.ui.theme.ObeliskTheme

private const val FADE_MS = 150

/**
 * Sealed hierarchy for left slot content. Carries its own data and callback
 * so the animation content lambda never reads external state.
 */
private sealed interface LeftContent {
    data object Empty : LeftContent
    data class Back(val onClick: () -> Unit) : LeftContent
    data class Share(val onClick: () -> Unit) : LeftContent
}

/**
 * Sealed hierarchy for center slot content.
 */
private sealed interface CenterContent {
    data object Search : CenterContent
    data class ResultsLabel(val query: String) : CenterContent
    data class PoiInfo(val name: String, val category: String?) : CenterContent
    data class TextLabel(val label: String) : CenterContent
}

/**
 * Sealed hierarchy for right slot content.
 */
private sealed interface RightContent {
    data object Empty : RightContent
    data class Avatar(val onClick: () -> Unit) : RightContent
    data class Close(val onClick: () -> Unit) : RightContent
}

/**
 * Resolves left slot content for the given mode with bound callbacks.
 *
 * @param mode Current sheet mode.
 * @param onSearchCleared Callback for search back.
 * @param onPoiShareClick Callback for POI share.
 * @param onPoiBackToResultsClick Callback for back-to-results.
 * @return Sealed left content with callback baked in.
 */
private fun resolveLeft(
    mode: SheetMode,
    onSearchCleared: () -> Unit,
    onPoiShareClick: () -> Unit,
    onPoiBackToResultsClick: () -> Unit,
): LeftContent = when (mode) {
    is SheetMode.Searching -> LeftContent.Back(onSearchCleared)
    is SheetMode.Poi -> if (mode.fromSearch) LeftContent.Back(onPoiBackToResultsClick)
    else LeftContent.Share(onPoiShareClick)
    is SheetMode.Idle, is SheetMode.Results, is SheetMode.Profile, is SheetMode.Remark ->
        LeftContent.Empty
}

/**
 * Resolves center slot content for the given mode.
 *
 * @param mode Current sheet mode.
 * @param query Current search query.
 * @return Sealed center content.
 */
private fun resolveCenter(mode: SheetMode, query: String): CenterContent = when (mode) {
    is SheetMode.Idle, is SheetMode.Searching -> CenterContent.Search
    is SheetMode.Results -> CenterContent.ResultsLabel(query)
    is SheetMode.Poi -> CenterContent.PoiInfo(mode.name, mode.category)
    is SheetMode.Profile -> CenterContent.TextLabel("Profile")
    is SheetMode.Remark -> CenterContent.TextLabel("Remark")
}

/**
 * Resolves right slot content for the given mode with bound callback.
 *
 * @param mode Current sheet mode.
 * @param onAvatarClick Callback for avatar tap.
 * @param onResultsCloseClick Callback for results close.
 * @param onPoiCloseClick Callback for POI close.
 * @param onProfileCloseClick Callback for profile close.
 * @return Sealed right content with callback baked in.
 */
private fun resolveRight(
    mode: SheetMode,
    onAvatarClick: () -> Unit,
    onResultsCloseClick: () -> Unit,
    onPoiCloseClick: () -> Unit,
    onProfileCloseClick: () -> Unit,
): RightContent = when (mode) {
    is SheetMode.Idle -> RightContent.Avatar(onAvatarClick)
    is SheetMode.Searching -> RightContent.Empty
    is SheetMode.Results -> RightContent.Close(onResultsCloseClick)
    is SheetMode.Poi -> RightContent.Close(onPoiCloseClick)
    is SheetMode.Profile -> RightContent.Close(onProfileCloseClick)
    is SheetMode.Remark -> RightContent.Close(onResultsCloseClick)
}

/**
 * Unified top bar with three fixed-size slots.
 * SearchPill is always mounted (never inside an animation wrapper).
 * Side slots use AnimatedContent with tween fade (no spring overshoot on alpha).
 * Callbacks are baked into sealed content objects so animation lambdas never
 * capture stale external state.
 *
 * @param mode Current sheet mode.
 * @param query Current search query text.
 * @param onQueryChange Called when search text changes.
 * @param onSearchFocused Called when the search pill gains focus from idle.
 * @param onSearchCleared Called when back is tapped in search — clears query + exits.
 * @param onResultsCloseClick Called when results close is tapped.
 * @param onPoiShareClick Called when share is tapped in POI mode.
 * @param onPoiCloseClick Called when close is tapped in POI mode.
 * @param onPoiBackToResultsClick Called when back-to-results is tapped in POI mode.
 * @param onAvatarClick Called when the user avatar is tapped.
 * @param onProfileCloseClick Called when profile close is tapped.
 * @param modifier Modifier applied to the row.
 */
@Composable
fun SheetTopBar(
    mode: SheetMode,
    query: String,
    onQueryChange: (String) -> Unit,
    onSearchFocused: () -> Unit,
    onSearchCleared: () -> Unit,
    onResultsCloseClick: () -> Unit,
    onPoiShareClick: () -> Unit,
    onPoiCloseClick: () -> Unit,
    onPoiBackToResultsClick: () -> Unit,
    onAvatarClick: () -> Unit,
    onProfileCloseClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val left = resolveLeft(mode, onSearchCleared, onPoiShareClick, onPoiBackToResultsClick)
    val center = resolveCenter(mode, query)
    val right = resolveRight(mode, onAvatarClick, onResultsCloseClick, onPoiCloseClick, onProfileCloseClick)

    val focusRequester = remember { FocusRequester() }
    val focusManager = LocalFocusManager.current

    LaunchedEffect(mode) {
        if (mode is SheetMode.Searching) {
            focusRequester.requestFocus()
        } else {
            focusManager.clearFocus()
        }
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Left slot — fixed 48dp
        Box(
            modifier = Modifier.size(48.dp),
            contentAlignment = Alignment.Center,
        ) {
            AnimatedContent(
                targetState = left,
                transitionSpec = {
                    fadeIn(tween(FADE_MS)) togetherWith fadeOut(tween(FADE_MS))
                },
                contentKey = { it::class },
                label = "leftSlot",
            ) { content ->
                when (content) {
                    is LeftContent.Empty -> Spacer(Modifier.size(48.dp))
                    is LeftContent.Back -> IconButton(onClick = content.onClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = ObeliskTheme.colors.foreground,
                            modifier = Modifier.size(24.dp),
                        )
                    }
                    is LeftContent.Share -> IconButton(onClick = content.onClick) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "Share",
                            tint = ObeliskTheme.colors.foreground,
                            modifier = Modifier.size(24.dp),
                        )
                    }
                }
            }
        }

        // Center slot — fills remaining space, SearchPill always mounted
        Box(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 4.dp),
            contentAlignment = Alignment.Center,
        ) {
            when (center) {
                is CenterContent.Search -> SearchPill(
                    query = query,
                    onQueryChange = onQueryChange,
                    onFocused = onSearchFocused,
                    onCleared = onSearchCleared,
                    focusRequester = focusRequester,
                )
                is CenterContent.ResultsLabel -> Text(
                    text = "Results for \"${center.query}\"",
                    style = ObeliskTheme.typography.subhead,
                    color = ObeliskTheme.colors.foreground,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                is CenterContent.PoiInfo -> Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        text = center.name,
                        style = ObeliskTheme.typography.subhead.copy(
                            fontWeight = FontWeight.SemiBold,
                        ),
                        color = ObeliskTheme.colors.foreground,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    if (center.category != null) {
                        Text(
                            text = center.category,
                            style = ObeliskTheme.typography.footnote,
                            color = ObeliskTheme.colors.secondary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
                is CenterContent.TextLabel -> Text(
                    text = center.label,
                    style = ObeliskTheme.typography.subhead,
                    color = ObeliskTheme.colors.foreground,
                )
            }
        }

        // Right slot — fixed 48dp
        Box(
            modifier = Modifier.size(48.dp),
            contentAlignment = Alignment.Center,
        ) {
            AnimatedContent(
                targetState = right,
                transitionSpec = {
                    fadeIn(tween(FADE_MS)) togetherWith fadeOut(tween(FADE_MS))
                },
                contentKey = { it::class },
                label = "rightSlot",
            ) { content ->
                when (content) {
                    is RightContent.Empty -> Spacer(Modifier.size(48.dp))
                    is RightContent.Avatar -> UserAvatar(onClick = content.onClick)
                    is RightContent.Close -> IconButton(onClick = content.onClick) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = ObeliskTheme.colors.foreground,
                            modifier = Modifier.size(24.dp),
                        )
                    }
                }
            }
        }
    }
}
