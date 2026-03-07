import 'package:freezed_annotation/freezed_annotation.dart';

import 'remark.dart';

part 'search.freezed.dart';
part 'search.g.dart';

/// A single search result from POST /api/search.
@freezed
abstract class SearchResult with _$SearchResult {
  /// Creates a [SearchResult].
  const factory SearchResult({
    required String id,
    int? osmId,
    required String name,
    required String category,
    required double latitude,
    required double longitude,
    double? distance,
    required double score,
    String? address,
    String? description,
    String? cuisine,
    String? amenityType,
    required bool hasRemark,
    bool? hasOutdoorSeating,
    bool? hasWifi,
    String? placeType,
    RemarkWithPoi? remark,
    required String source,
  }) = _SearchResult;

  factory SearchResult.fromJson(Map<String, dynamic> json) =>
      _$SearchResultFromJson(json);
}

/// An autocomplete suggestion from GET /api/search/autocomplete.
@freezed
abstract class Suggestion with _$Suggestion {
  /// Creates a [Suggestion].
  const factory Suggestion({
    required String id,
    required String name,
    required String category,
    required double latitude,
    required double longitude,
  }) = _Suggestion;

  factory Suggestion.fromJson(Map<String, dynamic> json) =>
      _$SuggestionFromJson(json);
}

/// Response wrapper for POST /api/search.
@freezed
abstract class SearchResponse with _$SearchResponse {
  /// Creates a [SearchResponse].
  const factory SearchResponse({required List<SearchResult> results}) =
      _SearchResponse;

  factory SearchResponse.fromJson(Map<String, dynamic> json) =>
      _$SearchResponseFromJson(json);
}

/// Response wrapper for GET /api/search/autocomplete.
@freezed
abstract class AutocompleteResponse with _$AutocompleteResponse {
  /// Creates an [AutocompleteResponse].
  const factory AutocompleteResponse({required List<Suggestion> suggestions}) =
      _AutocompleteResponse;

  factory AutocompleteResponse.fromJson(Map<String, dynamic> json) =>
      _$AutocompleteResponseFromJson(json);
}
