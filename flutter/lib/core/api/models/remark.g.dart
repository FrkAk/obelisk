// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'remark.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_RemarkPoi _$RemarkPoiFromJson(Map<String, dynamic> json) => _RemarkPoi(
  id: json['id'] as String,
  osmId: (json['osmId'] as num?)?.toInt(),
  name: json['name'] as String,
  categoryId: json['categoryId'] as String?,
  latitude: (json['latitude'] as num).toDouble(),
  longitude: (json['longitude'] as num).toDouble(),
  address: json['address'] as String?,
  locale: json['locale'] as String?,
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
);

Map<String, dynamic> _$RemarkPoiToJson(_RemarkPoi instance) =>
    <String, dynamic>{
      'id': instance.id,
      'osmId': instance.osmId,
      'name': instance.name,
      'categoryId': instance.categoryId,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'address': instance.address,
      'locale': instance.locale,
      'wikipediaUrl': instance.wikipediaUrl,
      'mapillaryId': instance.mapillaryId,
      'mapillaryBearing': instance.mapillaryBearing,
      'mapillaryIsPano': instance.mapillaryIsPano,
      'osmTags': instance.osmTags,
      'createdAt': instance.createdAt?.toIso8601String(),
      'category': instance.category?.toJson(),
    };

_RemarkWithPoi _$RemarkWithPoiFromJson(Map<String, dynamic> json) =>
    _RemarkWithPoi(
      id: json['id'] as String,
      poiId: json['poiId'] as String,
      title: json['title'] as String,
      teaser: json['teaser'] as String?,
      content: json['content'] as String,
      localTip: json['localTip'] as String?,
      durationSeconds: (json['durationSeconds'] as num?)?.toInt(),
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      locale: json['locale'] as String?,
      version: (json['version'] as num).toInt(),
      isCurrent: json['isCurrent'] as bool?,
      poi: RemarkPoi.fromJson(json['poi'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$RemarkWithPoiToJson(_RemarkWithPoi instance) =>
    <String, dynamic>{
      'id': instance.id,
      'poiId': instance.poiId,
      'title': instance.title,
      'teaser': instance.teaser,
      'content': instance.content,
      'localTip': instance.localTip,
      'durationSeconds': instance.durationSeconds,
      'createdAt': instance.createdAt?.toIso8601String(),
      'locale': instance.locale,
      'version': instance.version,
      'isCurrent': instance.isCurrent,
      'poi': instance.poi.toJson(),
    };

_RemarksResponse _$RemarksResponseFromJson(Map<String, dynamic> json) =>
    _RemarksResponse(
      remarks: (json['remarks'] as List<dynamic>)
          .map((e) => RemarkWithPoi.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num).toInt(),
    );

Map<String, dynamic> _$RemarksResponseToJson(_RemarksResponse instance) =>
    <String, dynamic>{
      'remarks': instance.remarks.map((e) => e.toJson()).toList(),
      'total': instance.total,
    };

_GenerateRemarksResponse _$GenerateRemarksResponseFromJson(
  Map<String, dynamic> json,
) => _GenerateRemarksResponse(
  generated: (json['generated'] as num).toInt(),
  skipped: (json['skipped'] as num).toInt(),
  errors: (json['errors'] as num).toInt(),
);

Map<String, dynamic> _$GenerateRemarksResponseToJson(
  _GenerateRemarksResponse instance,
) => <String, dynamic>{
  'generated': instance.generated,
  'skipped': instance.skipped,
  'errors': instance.errors,
};

_GenerateForPoiResponse _$GenerateForPoiResponseFromJson(
  Map<String, dynamic> json,
) => _GenerateForPoiResponse(
  remark: RemarkWithPoi.fromJson(json['remark'] as Map<String, dynamic>),
  cached: json['cached'] as bool,
);

Map<String, dynamic> _$GenerateForPoiResponseToJson(
  _GenerateForPoiResponse instance,
) => <String, dynamic>{
  'remark': instance.remark.toJson(),
  'cached': instance.cached,
};

_RegenerateRemarkResponse _$RegenerateRemarkResponseFromJson(
  Map<String, dynamic> json,
) => _RegenerateRemarkResponse(
  remark: RemarkWithPoi.fromJson(json['remark'] as Map<String, dynamic>),
);

Map<String, dynamic> _$RegenerateRemarkResponseToJson(
  _RegenerateRemarkResponse instance,
) => <String, dynamic>{'remark': instance.remark.toJson()};
