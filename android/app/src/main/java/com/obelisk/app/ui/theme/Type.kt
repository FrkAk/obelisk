package com.obelisk.app.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.obelisk.app.R

/** Display — POI names, titles. */
val InstrumentSerifFamily = FontFamily(
    Font(R.font.instrument_serif_regular, FontWeight.Normal),
)

/** UI — buttons, labels, metadata, search. */
val SoraFamily = FontFamily(
    Font(R.font.sora_variable, FontWeight.Normal),
    Font(R.font.sora_variable, FontWeight.Medium),
    Font(R.font.sora_variable, FontWeight.SemiBold),
)

/** Reading — remark body, local tips. */
val SourceSerif4Family = FontFamily(
    Font(R.font.source_serif_4_variable, FontWeight.Normal),
)

/**
 * Full Obelisk type scale across three font families.
 *
 * @param largeTitle 34sp Instrument Serif — hero headings.
 * @param title1 28sp Instrument Serif — section headings.
 * @param title2 22sp Instrument Serif — POI card title.
 * @param title3 20sp Instrument Serif — subsection headings.
 * @param body 17sp Sora — primary UI text.
 * @param subhead 15sp Sora — secondary UI text.
 * @param footnote 13sp Sora — tertiary metadata.
 * @param caption1 12sp Sora — small labels.
 * @param caption2 11sp Sora — smallest labels, pin text.
 * @param readingBody 17sp Source Serif 4 — remark body text (1.7 line height).
 * @param readingSubhead 15sp Source Serif 4 — remark subtext.
 */
@Immutable
data class ObeliskTypography(
    val largeTitle: TextStyle = TextStyle(
        fontFamily = InstrumentSerifFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 34.sp,
    ),
    val title1: TextStyle = TextStyle(
        fontFamily = InstrumentSerifFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 28.sp,
    ),
    val title2: TextStyle = TextStyle(
        fontFamily = InstrumentSerifFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 22.sp,
    ),
    val title3: TextStyle = TextStyle(
        fontFamily = InstrumentSerifFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 20.sp,
    ),
    val body: TextStyle = TextStyle(
        fontFamily = SoraFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 17.sp,
    ),
    val subhead: TextStyle = TextStyle(
        fontFamily = SoraFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
    ),
    val footnote: TextStyle = TextStyle(
        fontFamily = SoraFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
    ),
    val caption1: TextStyle = TextStyle(
        fontFamily = SoraFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
    ),
    val caption2: TextStyle = TextStyle(
        fontFamily = SoraFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
    ),
    val readingBody: TextStyle = TextStyle(
        fontFamily = SourceSerif4Family,
        fontWeight = FontWeight.Normal,
        fontSize = 17.sp,
        lineHeight = 28.9.sp,
    ),
    val readingSubhead: TextStyle = TextStyle(
        fontFamily = SourceSerif4Family,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
    ),
)
