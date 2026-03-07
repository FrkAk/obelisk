import 'package:freezed_annotation/freezed_annotation.dart';

import 'category.dart';
import 'remark.dart';

part 'poi.freezed.dart';
part 'poi.g.dart';

/// A POI image from any source (Mapillary, Wikipedia, etc.).
@freezed
abstract class PoiImage with _$PoiImage {
  /// Creates a [PoiImage].
  const factory PoiImage({
    required String id,
    required String url,
    required String source,
  }) = _PoiImage;

  factory PoiImage.fromJson(Map<String, dynamic> json) =>
      _$PoiImageFromJson(json);
}

/// Contact information for a POI.
@freezed
abstract class ContactInfo with _$ContactInfo {
  /// Creates a [ContactInfo].
  const factory ContactInfo({
    List<String>? phone,
    List<String>? email,
    List<String>? website,
    String? bookingUrl,
    String? instagram,
    String? facebook,
    String? openingHoursRaw,
  }) = _ContactInfo;

  factory ContactInfo.fromJson(Map<String, dynamic> json) =>
      _$ContactInfoFromJson(json);
}

/// A nearby POI from GET /api/pois (database shape with joins).
@freezed
abstract class NearbyPoi with _$NearbyPoi {
  /// Creates a [NearbyPoi].
  const factory NearbyPoi({
    required String id,
    int? osmId,
    required String name,
    String? categoryId,
    required double latitude,
    required double longitude,
    String? address,
    String? wikipediaUrl,
    String? mapillaryId,
    double? mapillaryBearing,
    bool? mapillaryIsPano,
    Map<String, String>? osmTags,
    DateTime? createdAt,
    Category? category,
    ContactInfo? contact,
  }) = _NearbyPoi;

  factory NearbyPoi.fromJson(Map<String, dynamic> json) =>
      _$NearbyPoiFromJson(json);
}

/// An external POI from Nominatim/Overpass (used in lookup, search, generate).
@freezed
abstract class ExternalPOI with _$ExternalPOI {
  /// Creates an [ExternalPOI].
  const factory ExternalPOI({
    required String id,
    required int osmId,
    required String osmType,
    required String name,
    required String category,
    required double latitude,
    required double longitude,
    double? distance,
    String? address,
    String? openingHours,
    String? phone,
    String? website,
    String? cuisine,
    bool? hasWifi,
    bool? hasOutdoorSeating,
    List<PoiImage>? images,
    String? mapillaryId,
    double? mapillaryBearing,
    bool? mapillaryIsPano,
    String? wikipediaUrl,
    Map<String, String>? extraTags,
    required String source,
  }) = _ExternalPOI;

  factory ExternalPOI.fromJson(Map<String, dynamic> json) =>
      _$ExternalPOIFromJson(json);
}

/// Response wrapper for GET /api/pois.
@freezed
abstract class NearbyPoisResponse with _$NearbyPoisResponse {
  /// Creates a [NearbyPoisResponse].
  const factory NearbyPoisResponse({
    required List<NearbyPoi> pois,
    required int total,
  }) = _NearbyPoisResponse;

  factory NearbyPoisResponse.fromJson(Map<String, dynamic> json) =>
      _$NearbyPoisResponseFromJson(json);
}

/// Response wrapper for POST /api/poi/lookup.
@freezed
abstract class PoiLookupResponse with _$PoiLookupResponse {
  /// Creates a [PoiLookupResponse].
  const factory PoiLookupResponse({
    required ExternalPOI poi,
    RemarkWithPoi? remark,
    required String source,
  }) = _PoiLookupResponse;

  factory PoiLookupResponse.fromJson(Map<String, dynamic> json) =>
      _$PoiLookupResponseFromJson(json);
}

/// Response wrapper for POST /api/poi/enrich-media.
@freezed
abstract class EnrichMediaResponse with _$EnrichMediaResponse {
  /// Creates an [EnrichMediaResponse].
  const factory EnrichMediaResponse({
    String? mapillaryId,
    double? mapillaryBearing,
    bool? mapillaryIsPano,
    required List<PoiImage> images,
  }) = _EnrichMediaResponse;

  factory EnrichMediaResponse.fromJson(Map<String, dynamic> json) =>
      _$EnrichMediaResponseFromJson(json);
}
