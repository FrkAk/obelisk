package com.obelisk.app.ui.search

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.theme.CategoryPinAmber
import com.obelisk.app.ui.theme.CategoryPinBlue
import com.obelisk.app.ui.theme.CategoryPinGray
import com.obelisk.app.ui.theme.CategoryPinGreen
import com.obelisk.app.ui.theme.CategoryPinOrange
import com.obelisk.app.ui.theme.CategoryPinPink
import com.obelisk.app.ui.theme.CategoryPinPurple
import com.obelisk.app.ui.theme.ObeliskTheme

/**
 * A category with display label and pin color.
 *
 * @param slug Category identifier.
 * @param label Display label.
 * @param color Pin dot color.
 */
data class Category(val slug: String, val label: String, val color: Color)

private val CATEGORIES = listOf(
    Category("food", "Food", CategoryPinOrange),
    Category("culture", "Culture", CategoryPinPink),
    Category("nature", "Nature", CategoryPinGreen),
    Category("shopping", "Shopping", CategoryPinPurple),
    Category("transit", "Transit", CategoryPinBlue),
    Category("discovery", "Discovery", CategoryPinAmber),
    Category("services", "Services", CategoryPinGray),
)

/**
 * Horizontal scrollable row of category filter chips.
 *
 * @param onCategoryClick Called with the category slug when a chip is tapped.
 * @param modifier Modifier applied to the lazy row.
 */
@Composable
fun CategoryChips(
    onCategoryClick: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyRow(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = 16.dp),
    ) {
        items(CATEGORIES, key = { it.slug }) { category ->
            CategoryChip(
                category = category,
                onClick = { onCategoryClick(category.slug) },
            )
        }
    }
}

/**
 * Single category chip with a colored dot and label.
 *
 * @param category Category data.
 * @param onClick Called when the chip is tapped.
 */
@Composable
private fun CategoryChip(category: Category, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .clip(ObeliskTheme.shapes.sm)
            .background(ObeliskTheme.colors.surface)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(category.color),
        )
        Text(
            text = category.label,
            style = ObeliskTheme.typography.caption1,
            color = ObeliskTheme.colors.foreground,
        )
    }
}
