import 'package:flutter/material.dart';

/// Font family constants.
abstract final class ObeliskFonts {
  /// Display font for POI names, section headings.
  static const display = 'InstrumentSerif';

  /// UI font for buttons, labels, metadata, nav.
  static const ui = 'Sora';

  /// Reading font for remark body, long-form content.
  static const reading = 'SourceSerif4';
}

/// Pre-configured TextStyles for light and dark modes.
///
/// All sizes from design.md section 3.2. Font families from section 3.1.
abstract final class ObeliskTextStyles {
  /// Builds all typography styles for [foreground] and [secondary]/[tertiary] colors.
  static ({
    TextStyle displayLargeTitle,
    TextStyle displayTitle1,
    TextStyle displayTitle2,
    TextStyle displayTitle3,
    TextStyle uiBody,
    TextStyle uiSubhead,
    TextStyle uiFootnote,
    TextStyle uiCaption1,
    TextStyle uiCaption2,
    TextStyle readingBody,
    TextStyle readingSubhead,
  })
  build({
    required Color foreground,
    required Color secondary,
    required Color tertiary,
  }) {
    return (
      displayLargeTitle: TextStyle(
        fontFamily: ObeliskFonts.display,
        fontSize: 34,
        color: foreground,
      ),
      displayTitle1: TextStyle(
        fontFamily: ObeliskFonts.display,
        fontSize: 28,
        color: foreground,
      ),
      displayTitle2: TextStyle(
        fontFamily: ObeliskFonts.display,
        fontSize: 22,
        color: foreground,
      ),
      displayTitle3: TextStyle(
        fontFamily: ObeliskFonts.display,
        fontSize: 20,
        color: foreground,
      ),
      uiBody: TextStyle(
        fontFamily: ObeliskFonts.ui,
        fontSize: 17,
        fontWeight: FontWeight.w400,
        color: foreground,
      ),
      uiSubhead: TextStyle(
        fontFamily: ObeliskFonts.ui,
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: secondary,
      ),
      uiFootnote: TextStyle(
        fontFamily: ObeliskFonts.ui,
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: secondary,
      ),
      uiCaption1: TextStyle(
        fontFamily: ObeliskFonts.ui,
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: tertiary,
      ),
      uiCaption2: TextStyle(
        fontFamily: ObeliskFonts.ui,
        fontSize: 11,
        fontWeight: FontWeight.w400,
        color: tertiary,
      ),
      readingBody: TextStyle(
        fontFamily: ObeliskFonts.reading,
        fontSize: 17,
        fontWeight: FontWeight.w400,
        height: 1.7,
        color: foreground,
      ),
      readingSubhead: TextStyle(
        fontFamily: ObeliskFonts.reading,
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: secondary,
      ),
    );
  }
}
