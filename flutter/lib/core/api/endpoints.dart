import 'package:dio/dio.dart';

import 'models/poi.dart';
import 'models/remark.dart';
import 'models/search.dart';

/// Typed wrapper around the Obelisk REST API.
class ObeliskApi {
  /// Creates an [ObeliskApi] backed by the given [Dio] client.
  ObeliskApi(this._dio);

  final Dio _dio;

  /// Fetches nearby POIs within [radius] meters of [lat], [lon].
  ///
  /// Returns POIs with joined category and contact data.
  Future<NearbyPoisResponse> getNearbyPois({
    required double lat,
    required double lon,
    int radius = 1000,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/pois',
      queryParameters: {'lat': lat, 'lon': lon, 'radius': radius},
    );
    return NearbyPoisResponse.fromJson(response.data!);
  }

  /// Looks up a single POI by [name] near [latitude], [longitude].
  ///
  /// An optional [category] hint narrows the match. Returns the POI
  /// with its remark if one exists.
  Future<PoiLookupResponse> lookupPoi({
    required String name,
    required double latitude,
    required double longitude,
    String? category,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/poi/lookup',
      data: {
        'name': name,
        'latitude': latitude,
        'longitude': longitude,
        if (category != null) 'category': category,
      },
    );
    return PoiLookupResponse.fromJson(response.data!);
  }

  /// Lazily enriches the POI identified by [poiId] with media data.
  Future<EnrichMediaResponse> enrichMedia({required String poiId}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/poi/enrich-media',
      data: {'poiId': poiId},
    );
    return EnrichMediaResponse.fromJson(response.data!);
  }

  /// Fetches remarks within [radius] meters of [lat], [lon] for geofence notifications.
  Future<RemarksResponse> getNearbyRemarks({
    required double lat,
    required double lon,
    int radius = 1000,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/remarks',
      queryParameters: {'lat': lat, 'lon': lon, 'radius': radius},
    );
    return RemarksResponse.fromJson(response.data!);
  }

  /// Bulk-generates up to [limit] remarks for POIs within [radius] meters of [lat], [lon].
  ///
  /// Returns counts of generated, skipped, and errored remarks.
  Future<GenerateRemarksResponse> generateRemarks({
    required double lat,
    required double lon,
    int radius = 2000,
    int limit = 5,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/remarks/generate',
      data: {'lat': lat, 'lon': lon, 'radius': radius, 'limit': limit},
    );
    return GenerateRemarksResponse.fromJson(response.data!);
  }

  /// Generates a remark for the given [poi].
  ///
  /// Returns the remark and whether it was served from cache.
  Future<GenerateForPoiResponse> generateRemarkForPoi({
    required ExternalPOI poi,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/remarks/generate-for-poi',
      data: {'poi': poi.toJson()},
    );
    return GenerateForPoiResponse.fromJson(response.data!);
  }

  /// Re-rolls the remark identified by [remarkId] (20s backend cooldown).
  Future<RegenerateRemarkResponse> regenerateRemark({
    required String remarkId,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/remarks/regenerate',
      data: {'remarkId': remarkId},
    );
    return RegenerateRemarkResponse.fromJson(response.data!);
  }

  /// Runs hybrid full-text + semantic search for [query] near [latitude], [longitude].
  ///
  /// Searches within [radius] meters and returns up to [limit] ranked results.
  Future<SearchResponse> search({
    required String query,
    required double latitude,
    required double longitude,
    int radius = 5000,
    int limit = 20,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/search',
      data: {
        'query': query,
        'location': {'latitude': latitude, 'longitude': longitude},
        'radius': radius,
        'limit': limit,
      },
    );
    return SearchResponse.fromJson(response.data!);
  }

  /// Prefix-based autocomplete for [q] (min 2 chars).
  ///
  /// Optional [lat] and [lon] enable geo-biased ranking.
  Future<AutocompleteResponse> autocomplete({
    required String q,
    double? lat,
    double? lon,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/search/autocomplete',
      queryParameters: {
        'q': q,
        if (lat != null) 'lat': lat,
        if (lon != null) 'lon': lon,
      },
    );
    return AutocompleteResponse.fromJson(response.data!);
  }
}
