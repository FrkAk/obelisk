import 'package:flutter/material.dart';

/// Light mode color palette matching design.md section 2.
abstract final class ObeliskColorsLight {
  /// Primary text, titles.
  static const foreground = Color(0xFF1D1D1F);

  /// Subtitles, metadata.
  static const foregroundSecondary = Color(0xFF6E6E73);

  /// Disabled, de-emphasized.
  static const foregroundTertiary = Color(0xFF86868B);

  /// App background.
  static const background = Color(0xFFFFFFFF);

  /// Card backgrounds.
  static const surface = Color(0xFFF5F5F7);

  /// Elevated containers.
  static const elevated = Color(0xFFFFFFFF);

  /// Brand accent (amber).
  static const accent = Color(0xFFC49A6C);

  /// Accent backgrounds, highlight fills.
  static const accentSubtle = Color(0x1FC49A6C);

  /// Primary CTA blue.
  static const ctaBlue = Color(0xFF007AFF);

  /// Secondary blue fills.
  static const ctaBlueSubtle = Color(0x1F007AFF);

  /// User location dot, heading arrow.
  static const location = Color(0xFF3478F6);

  /// Error states, report indicators.
  static const error = Color(0xFFE5484D);

  /// Standard glass background (white 70%).
  static const glassBg = Color(0xB3FFFFFF);

  /// Thin glass background (white 50%).
  static const glassBgThin = Color(0x80FFFFFF);

  /// Thick glass background (white 82%).
  static const glassBgThick = Color(0xD1FFFFFF);

  /// Bottom sheet glass (white 75%).
  static const glassBgSheet = Color(0xBFFFFFFF);

  /// FABs, floating elements (white 80%).
  static const glassBgFloating = Color(0xCCFFFFFF);

  /// Glass border (black 6%).
  static const glassBorder = Color(0x0F000000);

  /// Strong glass border (black 12%).
  static const glassBorderStrong = Color(0x1F000000);
}

/// Dark mode color palette matching design.md section 2.
abstract final class ObeliskColorsDark {
  /// Primary text, titles.
  static const foreground = Color(0xFFF5F5F7);

  /// Subtitles, metadata.
  static const foregroundSecondary = Color(0xFFA1A1A6);

  /// Disabled, de-emphasized.
  static const foregroundTertiary = Color(0xFF6E6E73);

  /// App background.
  static const background = Color(0xFF0A0A0A);

  /// Card backgrounds.
  static const surface = Color(0xFF141414);

  /// Elevated containers.
  static const elevated = Color(0xFF1C1C1E);

  /// Brand accent (amber).
  static const accent = Color(0xFFD4AA7C);

  /// Accent backgrounds, highlight fills.
  static const accentSubtle = Color(0x1FD4AA7C);

  /// Primary CTA blue.
  static const ctaBlue = Color(0xFF0A84FF);

  /// Secondary blue fills.
  static const ctaBlueSubtle = Color(0x260A84FF);

  /// User location dot, heading arrow.
  static const location = Color(0xFF5E9EFF);

  /// Error states, report indicators.
  static const error = Color(0xFFE54D4D);

  /// Standard glass background (#141414 72%).
  static const glassBg = Color(0xB8141414);

  /// Thin glass background (#141414 50%).
  static const glassBgThin = Color(0x80141414);

  /// Thick glass background (#141414 82%).
  static const glassBgThick = Color(0xD1141414);

  /// Bottom sheet glass (#141414 78%).
  static const glassBgSheet = Color(0xC7141414);

  /// FABs, floating elements (#1C1C1E 82%).
  static const glassBgFloating = Color(0xD11C1C1E);

  /// Glass border (white 6%).
  static const glassBorder = Color(0x0FFFFFFF);

  /// Strong glass border (white 12%).
  static const glassBorderStrong = Color(0x1FFFFFFF);
}

/// Category colors for POI classification (same in light and dark).
abstract final class ObeliskCategoryColors {
  /// History, architecture, culture, education.
  static const heritage = Color(0xFF8B8680);

  /// Food, nightlife, shopping.
  static const gastronomy = Color(0xFFA89080);

  /// Nature, views, sports, health.
  static const nature = Color(0xFF7A8B7A);

  /// Art, hidden.
  static const discovery = Color(0xFFC49A6C);

  /// Transport, services.
  static const utility = Color(0xFF8890A0);

  /// Map from category group name to color.
  static const map = <String, Color>{
    'heritage': heritage,
    'gastronomy': gastronomy,
    'nature': nature,
    'discovery': discovery,
    'utility': utility,
  };
}
