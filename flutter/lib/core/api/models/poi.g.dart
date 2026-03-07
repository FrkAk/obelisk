// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'poi.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PoiImage _$PoiImageFromJson(Map<String, dynamic> json) => _PoiImage(
  id: json['id'] as String,
  url: json['url'] as String,
  source: json['source'] as String,
);

Map<String, dynamic> _$PoiImageToJson(_PoiImage instance) => <String, dynamic>{
  'id': instance.id,
  'url': instance.url,
  'source': instance.source,
};

_ContactInfo _$ContactInfoFromJson(Map<String, dynamic> json) => _ContactInfo(
  phone: (json['phone'] as List<dynamic>?)?.map((e) => e as String).toList(),
  email: (json['email'] as List<dynamic>?)?.map((e) => e as String).toList(),
  website: (json['website'] as List<dynamic>?)
      ?.map((e) => e as String)
      .toList(),
  bookingUrl: json['bookingUrl'] as String?,
  instagram: json['instagram'] as String?,
  facebook: json['facebook'] as String?,
  openingHoursRaw: json['openingHoursRaw'] as String?,
);

Map<String, dynamic> _$ContactInfoToJson(_ContactInfo instance) =>
    <String, dynamic>{
      'phone': instance.phone,
      'email': instance.email,
      'website': instance.website,
      'bookingUrl': instance.bookingUrl,
      'instagram': instance.instagram,
      'facebook': instance.facebook,
      'openingHoursRaw': instance.openingHoursRaw,
    };

_NearbyPoi _$NearbyPoiFromJson(Map<String, dynamic> json) => _NearbyPoi(
  id: json['id'] as String,
  osmId: (json['osmId'] as num?)?.toInt(),
  name: json['name'] as String,
  categoryId: json['categoryId'] as String?,
  latitude: (json['latitude'] as num).toDouble(),
  longitude: (json['longitude'] as num).toDouble(),
  address: json['address'] as String?,
  wikipediaUrl: json['wikipediaUrl'] as String?,
  mapillaryId: json['mapillaryId'] as String?,
  mapillaryBearing: (json['mapillaryBearing'] as num?)?.toDouble(),
  mapillaryIsPano: json['mapillaryIsPano'] as bool?,
  osmTags: (json['osmTags'] as Map<String, dynamic>?)?.map(
    (k, e) => MapEntry(k, e as String),
  ),
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  category: json['category'] == null
      ? null
      : Category.fromJson(json['category'] as Map<String, dynamic>),
  contact: json['contact'] == null
      ? null
      : ContactInfo.fromJson(json['contact'] as Map<String, dynamic>),
);

Map<String, dynamic> _$NearbyPoiToJson(_NearbyPoi instance) =>
    <String, dynamic>{
      'id': instance.id,
      'osmId': instance.osmId,
      'name': instance.name,
      'categoryId': instance.categoryId,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'address': instance.address,
      'wikipediaUrl': instance.wikipediaUrl,
      'mapillaryId': instance.mapillaryId,
      'mapillaryBearing': instance.mapillaryBearing,
      'mapillaryIsPano': instance.mapillaryIsPano,
      'osmTags': instance.osmTags,
      'createdAt': instance.createdAt?.toIso8601String(),
      'category': instance.category?.toJson(),
      'contact': instance.contact?.toJson(),
    };

_ExternalPOI _$ExternalPOIFromJson(Map<String, dynamic> json) => _ExternalPOI(
  id: json['id'] as String,
  osmId: (json['osmId'] as num).toInt(),
  osmType: json['osmType'] as String,
  name: json['name'] as String,
  category: json['category'] as String,
  latitude: (json['latitude'] as num).toDouble(),
  longitude: (json['longitude'] as num).toDouble(),
  distance: (json['distance'] as num?)?.toDouble(),
  address: json['address'] as String?,
  openingHours: json['openingHours'] as String?,
  phone: json['phone'] as String?,
  website: json['website'] as String?,
  cuisine: json['cuisine'] as String?,
  hasWifi: json['hasWifi'] as bool?,
  hasOutdoorSeating: json['hasOutdoorSeating'] as bool?,
  images: (json['images'] as List<dynamic>?)
      ?.map((e) => PoiImage.fromJson(e as Map<String, dynamic>))
      .toList(),
  mapillaryId: json['mapillaryId'] as String?,
  mapillaryBearing: (json['mapillaryBearing'] as num?)?.toDouble(),
  mapillaryIsPano: json['mapillaryIsPano'] as bool?,
  wikipediaUrl: json['wikipediaUrl'] as String?,
  extraTags: (json['extraTags'] as Map<String, dynamic>?)?.map(
    (k, e) => MapEntry(k, e as String),
  ),
  source: json['source'] as String,
);

Map<String, dynamic> _$ExternalPOIToJson(_ExternalPOI instance) =>
    <String, dynamic>{
      'id': instance.id,
      'osmId': instance.osmId,
      'osmType': instance.osmType,
      'name': instance.name,
      'category': instance.category,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'distance': instance.distance,
      'address': instance.address,
      'openingHours': instance.openingHours,
      'phone': instance.phone,
      'website': instance.website,
      'cuisine': instance.cuisine,
      'hasWifi': instance.hasWifi,
      'hasOutdoorSeating': instance.hasOutdoorSeating,
      'images': instance.images?.map((e) => e.toJson()).toList(),
      'mapillaryId': instance.mapillaryId,
      'mapillaryBearing': instance.mapillaryBearing,
      'mapillaryIsPano': instance.mapillaryIsPano,
      'wikipediaUrl': instance.wikipediaUrl,
      'extraTags': instance.extraTags,
      'source': instance.source,
    };

_NearbyPoisResponse _$NearbyPoisResponseFromJson(Map<String, dynamic> json) =>
    _NearbyPoisResponse(
      pois: (json['pois'] as List<dynamic>)
          .map((e) => NearbyPoi.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num).toInt(),
    );

Map<String, dynamic> _$NearbyPoisResponseToJson(_NearbyPoisResponse instance) =>
    <String, dynamic>{
      'pois': instance.pois.map((e) => e.toJson()).toList(),
      'total': instance.total,
    };

_PoiLookupResponse _$PoiLookupResponseFromJson(Map<String, dynamic> json) =>
    _PoiLookupResponse(
      poi: ExternalPOI.fromJson(json['poi'] as Map<String, dynamic>),
      remark: json['remark'] == null
          ? null
          : RemarkWithPoi.fromJson(json['remark'] as Map<String, dynamic>),
      source: json['source'] as String,
    );

Map<String, dynamic> _$PoiLookupResponseToJson(_PoiLookupResponse instance) =>
    <String, dynamic>{
      'poi': instance.poi.toJson(),
      'remark': instance.remark?.toJson(),
      'source': instance.source,
    };

_EnrichMediaResponse _$EnrichMediaResponseFromJson(Map<String, dynamic> json) =>
    _EnrichMediaResponse(
      mapillaryId: json['mapillaryId'] as String?,
      mapillaryBearing: (json['mapillaryBearing'] as num?)?.toDouble(),
      mapillaryIsPano: json['mapillaryIsPano'] as bool?,
      images: (json['images'] as List<dynamic>)
          .map((e) => PoiImage.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$EnrichMediaResponseToJson(
  _EnrichMediaResponse instance,
) => <String, dynamic>{
  'mapillaryId': instance.mapillaryId,
  'mapillaryBearing': instance.mapillaryBearing,
  'mapillaryIsPano': instance.mapillaryIsPano,
  'images': instance.images.map((e) => e.toJson()).toList(),
};
