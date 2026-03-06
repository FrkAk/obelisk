import 'package:flutter/material.dart';

import 'colors.dart';
import 'typography.dart';

/// Theme extension carrying all Obelisk design tokens.
///
/// Access via `Theme.of(context).extension<ObeliskTheme>()!`.
/// Provides [light] and [dark] factory constructors matching design.md.
class ObeliskTheme extends ThemeExtension<ObeliskTheme> {
  /// Creates an [ObeliskTheme] with explicit values for all tokens.
  const ObeliskTheme({
    required this.foreground,
    required this.foregroundSecondary,
    required this.foregroundTertiary,
    required this.background,
    required this.surface,
    required this.elevated,
    required this.accent,
    required this.accentSubtle,
    required this.ctaBlue,
    required this.ctaBlueSubtle,
    required this.locationColor,
    required this.errorColor,
    required this.glassBg,
    required this.glassBgThin,
    required this.glassBgThick,
    required this.glassBgSheet,
    required this.glassBgFloating,
    required this.glassBorder,
    required this.glassBorderStrong,
    required this.categoryColors,
    required this.shadowSm,
    required this.shadowMd,
    required this.shadowLg,
    required this.shadowXl,
    required this.shadowFloat,
    required this.shadowSheet,
    required this.shadowPin,
    required this.displayLargeTitle,
    required this.displayTitle1,
    required this.displayTitle2,
    required this.displayTitle3,
    required this.uiBody,
    required this.uiSubhead,
    required this.uiFootnote,
    required this.uiCaption1,
    required this.uiCaption2,
    required this.readingBody,
    required this.readingSubhead,
  });

  // -- Colors --

  /// Primary text, titles.
  final Color foreground;

  /// Subtitles, metadata.
  final Color foregroundSecondary;

  /// Disabled, de-emphasized.
  final Color foregroundTertiary;

  /// App background.
  final Color background;

  /// Card backgrounds.
  final Color surface;

  /// Elevated containers.
  final Color elevated;

  /// Brand accent (amber).
  final Color accent;

  /// Accent backgrounds, highlight fills.
  final Color accentSubtle;

  /// Primary CTA blue.
  final Color ctaBlue;

  /// Secondary blue fills.
  final Color ctaBlueSubtle;

  /// User location dot, heading arrow.
  final Color locationColor;

  /// Error states, report indicators.
  final Color errorColor;

  // -- Glass --

  /// Standard glass background.
  final Color glassBg;

  /// Thin glass (subtle overlays).
  final Color glassBgThin;

  /// Thick glass (dense panels).
  final Color glassBgThick;

  /// Bottom sheet glass.
  final Color glassBgSheet;

  /// FABs, floating elements.
  final Color glassBgFloating;

  /// Glass border (6% opacity).
  final Color glassBorder;

  /// Strong glass border (12% opacity).
  final Color glassBorderStrong;

  // -- Category --

  /// Category group name to color.
  final Map<String, Color> categoryColors;

  // -- Shadows --

  /// Subtle cards.
  final List<BoxShadow> shadowSm;

  /// Standard elevation.
  final List<BoxShadow> shadowMd;

  /// Elevated panels.
  final List<BoxShadow> shadowLg;

  /// High emphasis.
  final List<BoxShadow> shadowXl;

  /// FABs, floating elements.
  final List<BoxShadow> shadowFloat;

  /// Bottom sheet.
  final List<BoxShadow> shadowSheet;

  /// Map pins.
  final List<BoxShadow> shadowPin;

  // -- Typography --

  /// 34px display font for hero moments.
  final TextStyle displayLargeTitle;

  /// 28px display font for POI name (expanded).
  final TextStyle displayTitle1;

  /// 22px display font for POI name (peek).
  final TextStyle displayTitle2;

  /// 20px display font for section headings.
  final TextStyle displayTitle3;

  /// 17px UI font for body text, search input.
  final TextStyle uiBody;

  /// 15px UI font for subtitles, secondary names.
  final TextStyle uiSubhead;

  /// 13px UI font for metadata, button labels.
  final TextStyle uiFootnote;

  /// 12px UI font for section sublabels, pill text.
  final TextStyle uiCaption1;

  /// 11px UI font for attribution, watermarks.
  final TextStyle uiCaption2;

  /// 17px reading font for remark body.
  final TextStyle readingBody;

  /// 15px reading font for local tip.
  final TextStyle readingSubhead;

  // -- Spacing (constant, not theme-dependent) --

  /// 4px — tight gaps, icon padding.
  static const double spaceXs = 4;

  /// 8px — compact spacing, between pills.
  static const double spaceSm = 8;

  /// 12px — standard gap between elements.
  static const double spaceMd = 12;

  /// 16px — section padding, card padding.
  static const double spaceLg = 16;

  /// 20px — between major sections.
  static const double spaceXl = 20;

  /// 24px — sheet horizontal padding.
  static const double space2xl = 24;

  /// 32px — large separations.
  static const double space3xl = 32;

  // -- Radii (constant) --

  /// 8px — small pills, input fields.
  static const double radiusSm = 8;

  /// 12px — action buttons, cards.
  static const double radiusMd = 12;

  /// 16px — large cards.
  static const double radiusLg = 16;

  /// 20px — sheet at mid snap.
  static const double radiusXl = 20;

  /// 24px — prominent containers, search bar.
  static const double radius2xl = 24;

  /// 32px — sheet at floating snap (peek).
  static const double radius3xl = 32;

  /// 9999px — circular buttons, pill badges.
  static const double radiusFull = 9999;

  /// Light mode theme.
  factory ObeliskTheme.light() {
    final t = ObeliskTextStyles.build(
      foreground: ObeliskColorsLight.foreground,
      secondary: ObeliskColorsLight.foregroundSecondary,
      tertiary: ObeliskColorsLight.foregroundTertiary,
    );
    return ObeliskTheme(
      foreground: ObeliskColorsLight.foreground,
      foregroundSecondary: ObeliskColorsLight.foregroundSecondary,
      foregroundTertiary: ObeliskColorsLight.foregroundTertiary,
      background: ObeliskColorsLight.background,
      surface: ObeliskColorsLight.surface,
      elevated: ObeliskColorsLight.elevated,
      accent: ObeliskColorsLight.accent,
      accentSubtle: ObeliskColorsLight.accentSubtle,
      ctaBlue: ObeliskColorsLight.ctaBlue,
      ctaBlueSubtle: ObeliskColorsLight.ctaBlueSubtle,
      locationColor: ObeliskColorsLight.location,
      errorColor: ObeliskColorsLight.error,
      glassBg: ObeliskColorsLight.glassBg,
      glassBgThin: ObeliskColorsLight.glassBgThin,
      glassBgThick: ObeliskColorsLight.glassBgThick,
      glassBgSheet: ObeliskColorsLight.glassBgSheet,
      glassBgFloating: ObeliskColorsLight.glassBgFloating,
      glassBorder: ObeliskColorsLight.glassBorder,
      glassBorderStrong: ObeliskColorsLight.glassBorderStrong,
      categoryColors: ObeliskCategoryColors.map,
      shadowSm: const [
        BoxShadow(
          offset: Offset(0, 1),
          blurRadius: 3,
          color: Color(0x0A000000),
        ),
      ],
      shadowMd: const [
        BoxShadow(
          offset: Offset(0, 4),
          blurRadius: 12,
          color: Color(0x0F000000),
        ),
      ],
      shadowLg: const [
        BoxShadow(
          offset: Offset(0, 8),
          blurRadius: 24,
          color: Color(0x14000000),
        ),
      ],
      shadowXl: const [
        BoxShadow(
          offset: Offset(0, 12),
          blurRadius: 32,
          color: Color(0x1F000000),
        ),
      ],
      shadowFloat: const [
        BoxShadow(
          offset: Offset(0, 8),
          blurRadius: 32,
          color: Color(0x1A000000),
        ),
        BoxShadow(
          offset: Offset(0, 2),
          blurRadius: 8,
          color: Color(0x0A000000),
        ),
      ],
      shadowSheet: const [
        BoxShadow(
          offset: Offset(0, -8),
          blurRadius: 32,
          color: Color(0x14000000),
        ),
        BoxShadow(
          offset: Offset(0, -2),
          blurRadius: 8,
          color: Color(0x0A000000),
        ),
      ],
      shadowPin: const [
        BoxShadow(
          offset: Offset(0, 2),
          blurRadius: 8,
          color: Color(0x1F000000),
        ),
      ],
      displayLargeTitle: t.displayLargeTitle,
      displayTitle1: t.displayTitle1,
      displayTitle2: t.displayTitle2,
      displayTitle3: t.displayTitle3,
      uiBody: t.uiBody,
      uiSubhead: t.uiSubhead,
      uiFootnote: t.uiFootnote,
      uiCaption1: t.uiCaption1,
      uiCaption2: t.uiCaption2,
      readingBody: t.readingBody,
      readingSubhead: t.readingSubhead,
    );
  }

  /// Dark mode theme.
  factory ObeliskTheme.dark() {
    final t = ObeliskTextStyles.build(
      foreground: ObeliskColorsDark.foreground,
      secondary: ObeliskColorsDark.foregroundSecondary,
      tertiary: ObeliskColorsDark.foregroundTertiary,
    );
    return ObeliskTheme(
      foreground: ObeliskColorsDark.foreground,
      foregroundSecondary: ObeliskColorsDark.foregroundSecondary,
      foregroundTertiary: ObeliskColorsDark.foregroundTertiary,
      background: ObeliskColorsDark.background,
      surface: ObeliskColorsDark.surface,
      elevated: ObeliskColorsDark.elevated,
      accent: ObeliskColorsDark.accent,
      accentSubtle: ObeliskColorsDark.accentSubtle,
      ctaBlue: ObeliskColorsDark.ctaBlue,
      ctaBlueSubtle: ObeliskColorsDark.ctaBlueSubtle,
      locationColor: ObeliskColorsDark.location,
      errorColor: ObeliskColorsDark.error,
      glassBg: ObeliskColorsDark.glassBg,
      glassBgThin: ObeliskColorsDark.glassBgThin,
      glassBgThick: ObeliskColorsDark.glassBgThick,
      glassBgSheet: ObeliskColorsDark.glassBgSheet,
      glassBgFloating: ObeliskColorsDark.glassBgFloating,
      glassBorder: ObeliskColorsDark.glassBorder,
      glassBorderStrong: ObeliskColorsDark.glassBorderStrong,
      categoryColors: ObeliskCategoryColors.map,
      shadowSm: const [
        BoxShadow(
          offset: Offset(0, 1),
          blurRadius: 3,
          color: Color(0x0A000000),
        ),
      ],
      shadowMd: const [
        BoxShadow(
          offset: Offset(0, 4),
          blurRadius: 12,
          color: Color(0x0F000000),
        ),
      ],
      shadowLg: const [
        BoxShadow(
          offset: Offset(0, 8),
          blurRadius: 24,
          color: Color(0x14000000),
        ),
      ],
      shadowXl: const [
        BoxShadow(
          offset: Offset(0, 12),
          blurRadius: 32,
          color: Color(0x1F000000),
        ),
      ],
      shadowFloat: const [
        BoxShadow(
          offset: Offset(0, 8),
          blurRadius: 32,
          color: Color(0x66000000),
        ),
        BoxShadow(
          offset: Offset(0, 2),
          blurRadius: 8,
          color: Color(0x33000000),
        ),
      ],
      shadowSheet: const [
        BoxShadow(
          offset: Offset(0, -8),
          blurRadius: 32,
          color: Color(0x66000000),
        ),
        BoxShadow(
          offset: Offset(0, -2),
          blurRadius: 8,
          color: Color(0x33000000),
        ),
      ],
      shadowPin: const [
        BoxShadow(
          offset: Offset(0, 2),
          blurRadius: 8,
          color: Color(0x1F000000),
        ),
      ],
      displayLargeTitle: t.displayLargeTitle,
      displayTitle1: t.displayTitle1,
      displayTitle2: t.displayTitle2,
      displayTitle3: t.displayTitle3,
      uiBody: t.uiBody,
      uiSubhead: t.uiSubhead,
      uiFootnote: t.uiFootnote,
      uiCaption1: t.uiCaption1,
      uiCaption2: t.uiCaption2,
      readingBody: t.readingBody,
      readingSubhead: t.readingSubhead,
    );
  }

  @override
  ObeliskTheme copyWith({
    Color? foreground,
    Color? foregroundSecondary,
    Color? foregroundTertiary,
    Color? background,
    Color? surface,
    Color? elevated,
    Color? accent,
    Color? accentSubtle,
    Color? ctaBlue,
    Color? ctaBlueSubtle,
    Color? locationColor,
    Color? errorColor,
    Color? glassBg,
    Color? glassBgThin,
    Color? glassBgThick,
    Color? glassBgSheet,
    Color? glassBgFloating,
    Color? glassBorder,
    Color? glassBorderStrong,
    Map<String, Color>? categoryColors,
    List<BoxShadow>? shadowSm,
    List<BoxShadow>? shadowMd,
    List<BoxShadow>? shadowLg,
    List<BoxShadow>? shadowXl,
    List<BoxShadow>? shadowFloat,
    List<BoxShadow>? shadowSheet,
    List<BoxShadow>? shadowPin,
    TextStyle? displayLargeTitle,
    TextStyle? displayTitle1,
    TextStyle? displayTitle2,
    TextStyle? displayTitle3,
    TextStyle? uiBody,
    TextStyle? uiSubhead,
    TextStyle? uiFootnote,
    TextStyle? uiCaption1,
    TextStyle? uiCaption2,
    TextStyle? readingBody,
    TextStyle? readingSubhead,
  }) {
    return ObeliskTheme(
      foreground: foreground ?? this.foreground,
      foregroundSecondary: foregroundSecondary ?? this.foregroundSecondary,
      foregroundTertiary: foregroundTertiary ?? this.foregroundTertiary,
      background: background ?? this.background,
      surface: surface ?? this.surface,
      elevated: elevated ?? this.elevated,
      accent: accent ?? this.accent,
      accentSubtle: accentSubtle ?? this.accentSubtle,
      ctaBlue: ctaBlue ?? this.ctaBlue,
      ctaBlueSubtle: ctaBlueSubtle ?? this.ctaBlueSubtle,
      locationColor: locationColor ?? this.locationColor,
      errorColor: errorColor ?? this.errorColor,
      glassBg: glassBg ?? this.glassBg,
      glassBgThin: glassBgThin ?? this.glassBgThin,
      glassBgThick: glassBgThick ?? this.glassBgThick,
      glassBgSheet: glassBgSheet ?? this.glassBgSheet,
      glassBgFloating: glassBgFloating ?? this.glassBgFloating,
      glassBorder: glassBorder ?? this.glassBorder,
      glassBorderStrong: glassBorderStrong ?? this.glassBorderStrong,
      categoryColors: categoryColors ?? this.categoryColors,
      shadowSm: shadowSm ?? this.shadowSm,
      shadowMd: shadowMd ?? this.shadowMd,
      shadowLg: shadowLg ?? this.shadowLg,
      shadowXl: shadowXl ?? this.shadowXl,
      shadowFloat: shadowFloat ?? this.shadowFloat,
      shadowSheet: shadowSheet ?? this.shadowSheet,
      shadowPin: shadowPin ?? this.shadowPin,
      displayLargeTitle: displayLargeTitle ?? this.displayLargeTitle,
      displayTitle1: displayTitle1 ?? this.displayTitle1,
      displayTitle2: displayTitle2 ?? this.displayTitle2,
      displayTitle3: displayTitle3 ?? this.displayTitle3,
      uiBody: uiBody ?? this.uiBody,
      uiSubhead: uiSubhead ?? this.uiSubhead,
      uiFootnote: uiFootnote ?? this.uiFootnote,
      uiCaption1: uiCaption1 ?? this.uiCaption1,
      uiCaption2: uiCaption2 ?? this.uiCaption2,
      readingBody: readingBody ?? this.readingBody,
      readingSubhead: readingSubhead ?? this.readingSubhead,
    );
  }

  @override
  ObeliskTheme lerp(ObeliskTheme? other, double t) {
    if (other is! ObeliskTheme) return this;
    return ObeliskTheme(
      foreground: Color.lerp(foreground, other.foreground, t)!,
      foregroundSecondary: Color.lerp(
        foregroundSecondary,
        other.foregroundSecondary,
        t,
      )!,
      foregroundTertiary: Color.lerp(
        foregroundTertiary,
        other.foregroundTertiary,
        t,
      )!,
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      elevated: Color.lerp(elevated, other.elevated, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      accentSubtle: Color.lerp(accentSubtle, other.accentSubtle, t)!,
      ctaBlue: Color.lerp(ctaBlue, other.ctaBlue, t)!,
      ctaBlueSubtle: Color.lerp(ctaBlueSubtle, other.ctaBlueSubtle, t)!,
      locationColor: Color.lerp(locationColor, other.locationColor, t)!,
      errorColor: Color.lerp(errorColor, other.errorColor, t)!,
      glassBg: Color.lerp(glassBg, other.glassBg, t)!,
      glassBgThin: Color.lerp(glassBgThin, other.glassBgThin, t)!,
      glassBgThick: Color.lerp(glassBgThick, other.glassBgThick, t)!,
      glassBgSheet: Color.lerp(glassBgSheet, other.glassBgSheet, t)!,
      glassBgFloating: Color.lerp(glassBgFloating, other.glassBgFloating, t)!,
      glassBorder: Color.lerp(glassBorder, other.glassBorder, t)!,
      glassBorderStrong: Color.lerp(
        glassBorderStrong,
        other.glassBorderStrong,
        t,
      )!,
      categoryColors: t < 0.5 ? categoryColors : other.categoryColors,
      shadowSm: t < 0.5 ? shadowSm : other.shadowSm,
      shadowMd: t < 0.5 ? shadowMd : other.shadowMd,
      shadowLg: t < 0.5 ? shadowLg : other.shadowLg,
      shadowXl: t < 0.5 ? shadowXl : other.shadowXl,
      shadowFloat: t < 0.5 ? shadowFloat : other.shadowFloat,
      shadowSheet: t < 0.5 ? shadowSheet : other.shadowSheet,
      shadowPin: t < 0.5 ? shadowPin : other.shadowPin,
      displayLargeTitle: TextStyle.lerp(
        displayLargeTitle,
        other.displayLargeTitle,
        t,
      )!,
      displayTitle1: TextStyle.lerp(displayTitle1, other.displayTitle1, t)!,
      displayTitle2: TextStyle.lerp(displayTitle2, other.displayTitle2, t)!,
      displayTitle3: TextStyle.lerp(displayTitle3, other.displayTitle3, t)!,
      uiBody: TextStyle.lerp(uiBody, other.uiBody, t)!,
      uiSubhead: TextStyle.lerp(uiSubhead, other.uiSubhead, t)!,
      uiFootnote: TextStyle.lerp(uiFootnote, other.uiFootnote, t)!,
      uiCaption1: TextStyle.lerp(uiCaption1, other.uiCaption1, t)!,
      uiCaption2: TextStyle.lerp(uiCaption2, other.uiCaption2, t)!,
      readingBody: TextStyle.lerp(readingBody, other.readingBody, t)!,
      readingSubhead: TextStyle.lerp(readingSubhead, other.readingSubhead, t)!,
    );
  }
}
