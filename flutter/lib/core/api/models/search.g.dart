// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_SearchResult _$SearchResultFromJson(Map<String, dynamic> json) =>
    _SearchResult(
      id: json['id'] as String,
      osmId: (json['osmId'] as num?)?.toInt(),
      name: json['name'] as String,
      category: json['category'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      distance: (json['distance'] as num?)?.toDouble(),
      score: (json['score'] as num).toDouble(),
      address: json['address'] as String?,
      description: json['description'] as String?,
      cuisine: json['cuisine'] as String?,
      amenityType: json['amenityType'] as String?,
      hasRemark: json['hasRemark'] as bool,
      hasOutdoorSeating: json['hasOutdoorSeating'] as bool?,
      hasWifi: json['hasWifi'] as bool?,
      placeType: json['placeType'] as String?,
      remark: json['remark'] == null
          ? null
          : RemarkWithPoi.fromJson(json['remark'] as Map<String, dynamic>),
      source: json['source'] as String,
    );

Map<String, dynamic> _$SearchResultToJson(_SearchResult instance) =>
    <String, dynamic>{
      'id': instance.id,
      'osmId': instance.osmId,
      'name': instance.name,
      'category': instance.category,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'distance': instance.distance,
      'score': instance.score,
      'address': instance.address,
      'description': instance.description,
      'cuisine': instance.cuisine,
      'amenityType': instance.amenityType,
      'hasRemark': instance.hasRemark,
      'hasOutdoorSeating': instance.hasOutdoorSeating,
      'hasWifi': instance.hasWifi,
      'placeType': instance.placeType,
      'remark': instance.remark?.toJson(),
      'source': instance.source,
    };

_Suggestion _$SuggestionFromJson(Map<String, dynamic> json) => _Suggestion(
  id: json['id'] as String,
  name: json['name'] as String,
  category: json['category'] as String,
  latitude: (json['latitude'] as num).toDouble(),
  longitude: (json['longitude'] as num).toDouble(),
);

Map<String, dynamic> _$SuggestionToJson(_Suggestion instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'category': instance.category,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
    };

_SearchResponse _$SearchResponseFromJson(Map<String, dynamic> json) =>
    _SearchResponse(
      results: (json['results'] as List<dynamic>)
          .map((e) => SearchResult.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$SearchResponseToJson(_SearchResponse instance) =>
    <String, dynamic>{
      'results': instance.results.map((e) => e.toJson()).toList(),
    };

_AutocompleteResponse _$AutocompleteResponseFromJson(
  Map<String, dynamic> json,
) => _AutocompleteResponse(
  suggestions: (json['suggestions'] as List<dynamic>)
      .map((e) => Suggestion.fromJson(e as Map<String, dynamic>))
      .toList(),
);

Map<String, dynamic> _$AutocompleteResponseToJson(
  _AutocompleteResponse instance,
) => <String, dynamic>{
  'suggestions': instance.suggestions.map((e) => e.toJson()).toList(),
};
