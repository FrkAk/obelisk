import 'package:flutter_test/flutter_test.dart';
import 'package:obelisk_app/core/api/models/category.dart';
import 'package:obelisk_app/core/api/models/poi.dart';
import 'package:obelisk_app/core/api/models/remark.dart';
import 'package:obelisk_app/core/api/models/search.dart';
import 'package:obelisk_app/core/utils/distance.dart';
import 'package:obelisk_app/core/utils/url_validator.dart';

void main() {
  group('Category', () {
    test('round-trip serialization', () {
      final json = {
        'id': 'cat-1',
        'name': 'History',
        'slug': 'history',
        'icon': 'castle',
        'color': '#8B8680',
      };

      final category = Category.fromJson(json);
      expect(category.id, 'cat-1');
      expect(category.name, 'History');
      expect(category.slug, CategorySlug.history);
      expect(category.icon, 'castle');
      expect(category.color, '#8B8680');
      expect(category.toJson(), json);
    });

    test('CategorySlug enum serialization', () {
      for (final slug in CategorySlug.values) {
        final json = {
          'id': 'x',
          'name': 'X',
          'slug': slug.value,
          'icon': 'x',
          'color': '#000',
        };
        final category = Category.fromJson(json);
        expect(category.slug, slug);
        expect(category.toJson()['slug'], slug.value);
      }
    });
  });

  group('ExternalPOI', () {
    test('round-trip serialization', () {
      final json = {
        'id': 'poi-1',
        'osmId': 12345,
        'osmType': 'node',
        'name': 'Hofbräuhaus',
        'category': 'food',
        'latitude': 48.1376,
        'longitude': 11.5799,
        'address': 'Platzl 9',
        'cuisine': 'bavarian',
        'hasWifi': true,
        'source': 'nominatim',
      };

      final poi = ExternalPOI.fromJson(json);
      expect(poi.id, 'poi-1');
      expect(poi.osmId, 12345);
      expect(poi.name, 'Hofbräuhaus');
      expect(poi.category, 'food');
      expect(poi.latitude, 48.1376);
      expect(poi.cuisine, 'bavarian');
      expect(poi.hasWifi, true);
      expect(poi.distance, isNull);

      final roundTrip = ExternalPOI.fromJson(poi.toJson());
      expect(roundTrip, poi);
    });

    test('handles nullable fields', () {
      final json = {
        'id': 'poi-2',
        'osmId': 999,
        'osmType': 'way',
        'name': 'Test',
        'category': 'art',
        'latitude': 48.0,
        'longitude': 11.0,
        'source': 'overpass',
      };

      final poi = ExternalPOI.fromJson(json);
      expect(poi.address, isNull);
      expect(poi.images, isNull);
      expect(poi.extraTags, isNull);
    });
  });

  group('RemarkWithPoi', () {
    final remarkJson = {
      'id': 'rem-1',
      'poiId': 'poi-1',
      'title': 'A Munich Classic',
      'teaser': 'The world-famous beer hall',
      'content': 'Full remark content here.',
      'localTip': 'Sit upstairs for fewer tourists.',
      'durationSeconds': 45,
      'createdAt': '2025-06-01T12:00:00.000Z',
      'locale': 'en',
      'version': 1,
      'isCurrent': true,
      'poi': {
        'id': 'poi-1',
        'name': 'Hofbräuhaus',
        'categoryId': 'cat-food',
        'latitude': 48.1376,
        'longitude': 11.5799,
        'address': 'Platzl 9',
        'locale': 'en',
        'category': {
          'id': 'cat-food',
          'name': 'Food & Drink',
          'slug': 'food',
          'icon': 'utensils',
          'color': '#A89080',
        },
      },
    };

    test('round-trip serialization', () {
      final remark = RemarkWithPoi.fromJson(remarkJson);
      expect(remark.id, 'rem-1');
      expect(remark.title, 'A Munich Classic');
      expect(remark.teaser, 'The world-famous beer hall');
      expect(remark.durationSeconds, 45);
      expect(remark.version, 1);
      expect(remark.poi.name, 'Hofbräuhaus');
      expect(remark.poi.category?.slug, CategorySlug.food);
      expect(remark.poi.category?.color, '#A89080');

      final roundTrip = RemarkWithPoi.fromJson(remark.toJson());
      expect(roundTrip, remark);
    });
  });

  group('SearchResult', () {
    test('round-trip serialization', () {
      final json = {
        'id': 'sr-1',
        'osmId': 555,
        'name': 'English Garden',
        'category': 'nature',
        'latitude': 48.1642,
        'longitude': 11.6054,
        'distance': 1234.5,
        'score': 0.95,
        'hasRemark': true,
        'source': 'typesense',
      };

      final result = SearchResult.fromJson(json);
      expect(result.id, 'sr-1');
      expect(result.name, 'English Garden');
      expect(result.score, 0.95);
      expect(result.hasRemark, true);
      expect(result.remark, isNull);

      final roundTrip = SearchResult.fromJson(result.toJson());
      expect(roundTrip, result);
    });
  });

  group('Suggestion', () {
    test('round-trip serialization', () {
      final json = {
        'id': 'sug-1',
        'name': 'Marienplatz',
        'category': 'history',
        'latitude': 48.1374,
        'longitude': 11.5755,
      };

      final suggestion = Suggestion.fromJson(json);
      expect(suggestion.id, 'sug-1');
      expect(suggestion.name, 'Marienplatz');
      expect(suggestion.latitude, 48.1374);

      final roundTrip = Suggestion.fromJson(suggestion.toJson());
      expect(roundTrip, suggestion);
    });
  });

  group('formatDistance', () {
    test('returns "< 50 m" for distances under 50', () {
      expect(formatDistance(0), '< 50 m');
      expect(formatDistance(49), '< 50 m');
      expect(formatDistance(49.9), '< 50 m');
    });

    test('returns rounded meters for 50-999', () {
      expect(formatDistance(50), '50 m');
      expect(formatDistance(999), '999 m');
    });

    test('returns km with one decimal for >= 1000', () {
      expect(formatDistance(1000), '1.0 km');
      expect(formatDistance(1050), '1.1 km');
      expect(formatDistance(10500), '10.5 km');
    });
  });

  group('isValidHttpUrl', () {
    test('accepts valid http/https URLs', () {
      expect(isValidHttpUrl('http://example.com'), true);
      expect(isValidHttpUrl('https://example.com/path?q=1'), true);
      expect(isValidHttpUrl('https://sub.domain.co.uk'), true);
    });

    test('rejects invalid URLs', () {
      expect(isValidHttpUrl(''), false);
      expect(isValidHttpUrl('not-a-url'), false);
      expect(isValidHttpUrl('ftp://files.example.com'), false);
      expect(isValidHttpUrl('mailto:user@example.com'), false);
      expect(isValidHttpUrl('http://'), false);
    });
  });

  group('haversineDistance', () {
    test('returns 0 for same point', () {
      expect(haversineDistance(48.137, 11.576, 48.137, 11.576), 0.0);
    });

    test('calculates known distance approximately', () {
      // Marienplatz to Englischer Garten (~2.8 km)
      final d = haversineDistance(48.1374, 11.5755, 48.1642, 11.6054);
      expect(d, greaterThan(2500));
      expect(d, lessThan(4000));
    });
  });
}
