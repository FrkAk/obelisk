package com.obelisk.app.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.theme.ObeliskTheme

/**
 * Circular user avatar placeholder.
 * Displays a person icon on a surface-colored circle.
 *
 * @param onClick Called when the avatar is tapped.
 * @param modifier Modifier applied to the outer container.
 */
@Composable
fun UserAvatar(onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(36.dp)
            .clip(CircleShape)
            .background(ObeliskTheme.colors.surface)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = Icons.Default.Person,
            contentDescription = "User avatar",
            tint = ObeliskTheme.colors.secondary,
            modifier = Modifier.size(20.dp),
        )
    }
}
