import 'package:flutter/material.dart';

import 'obelisk_theme.dart';

/// Maps an API category slug (e.g. 'food', 'art') to its theme color.
///
/// Falls back to [ObeliskTheme.foregroundTertiary] for unknown slugs.
Color categoryColorForSlug(String slug, ObeliskTheme theme) {
  const slugToGroup = <String, String>{
    'history': 'heritage',
    'architecture': 'heritage',
    'culture': 'heritage',
    'education': 'heritage',
    'food': 'gastronomy',
    'nightlife': 'gastronomy',
    'shopping': 'gastronomy',
    'nature': 'nature',
    'views': 'nature',
    'sports': 'nature',
    'health': 'nature',
    'art': 'discovery',
    'hidden': 'discovery',
    'transport': 'utility',
    'services': 'utility',
  };
  final group = slugToGroup[slug] ?? 'utility';
  return theme.categoryColors[group] ?? theme.foregroundTertiary;
}
