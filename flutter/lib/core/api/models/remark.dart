import 'package:freezed_annotation/freezed_annotation.dart';

import 'category.dart';

part 'remark.freezed.dart';
part 'remark.g.dart';

/// The nested POI object returned inside remark responses.
@freezed
abstract class RemarkPoi with _$RemarkPoi {
  /// Creates a [RemarkPoi].
  const factory RemarkPoi({
    required String id,
    int? osmId,
    required String name,
    String? categoryId,
    required double latitude,
    required double longitude,
    String? address,
    String? locale,
    String? wikipediaUrl,
    String? mapillaryId,
    double? mapillaryBearing,
    bool? mapillaryIsPano,
    Map<String, String>? osmTags,
    DateTime? createdAt,
    Category? category,
  }) = _RemarkPoi;

  factory RemarkPoi.fromJson(Map<String, dynamic> json) =>
      _$RemarkPoiFromJson(json);
}

/// A remark with its associated POI data.
@freezed
abstract class RemarkWithPoi with _$RemarkWithPoi {
  /// Creates a [RemarkWithPoi].
  const factory RemarkWithPoi({
    required String id,
    required String poiId,
    required String title,
    String? teaser,
    required String content,
    String? localTip,
    int? durationSeconds,
    DateTime? createdAt,
    String? locale,
    required int version,
    bool? isCurrent,
    required RemarkPoi poi,
  }) = _RemarkWithPoi;

  factory RemarkWithPoi.fromJson(Map<String, dynamic> json) =>
      _$RemarkWithPoiFromJson(json);
}

/// Response wrapper for GET /api/remarks.
@freezed
abstract class RemarksResponse with _$RemarksResponse {
  /// Creates a [RemarksResponse].
  const factory RemarksResponse({
    required List<RemarkWithPoi> remarks,
    required int total,
  }) = _RemarksResponse;

  factory RemarksResponse.fromJson(Map<String, dynamic> json) =>
      _$RemarksResponseFromJson(json);
}

/// Response wrapper for POST /api/remarks/generate.
@freezed
abstract class GenerateRemarksResponse with _$GenerateRemarksResponse {
  /// Creates a [GenerateRemarksResponse].
  const factory GenerateRemarksResponse({
    required int generated,
    required int skipped,
    required int errors,
  }) = _GenerateRemarksResponse;

  factory GenerateRemarksResponse.fromJson(Map<String, dynamic> json) =>
      _$GenerateRemarksResponseFromJson(json);
}

/// Response wrapper for POST /api/remarks/generate-for-poi.
@freezed
abstract class GenerateForPoiResponse with _$GenerateForPoiResponse {
  /// Creates a [GenerateForPoiResponse].
  const factory GenerateForPoiResponse({
    required RemarkWithPoi remark,
    required bool cached,
  }) = _GenerateForPoiResponse;

  factory GenerateForPoiResponse.fromJson(Map<String, dynamic> json) =>
      _$GenerateForPoiResponseFromJson(json);
}

/// Response wrapper for POST /api/remarks/regenerate.
@freezed
abstract class RegenerateRemarkResponse with _$RegenerateRemarkResponse {
  /// Creates a [RegenerateRemarkResponse].
  const factory RegenerateRemarkResponse({required RemarkWithPoi remark}) =
      _RegenerateRemarkResponse;

  factory RegenerateRemarkResponse.fromJson(Map<String, dynamic> json) =>
      _$RegenerateRemarkResponseFromJson(json);
}
