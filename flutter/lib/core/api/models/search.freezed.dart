// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'search.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SearchResult {

 String get id; int? get osmId; String get name; String get category; double get latitude; double get longitude; double? get distance; double get score; String? get address; String? get description; String? get cuisine; String? get amenityType; bool get hasRemark; bool? get hasOutdoorSeating; bool? get hasWifi; String? get placeType; RemarkWithPoi? get remark; String get source;
/// Create a copy of SearchResult
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SearchResultCopyWith<SearchResult> get copyWith => _$SearchResultCopyWithImpl<SearchResult>(this as SearchResult, _$identity);

  /// Serializes this SearchResult to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SearchResult&&(identical(other.id, id) || other.id == id)&&(identical(other.osmId, osmId) || other.osmId == osmId)&&(identical(other.name, name) || other.name == name)&&(identical(other.category, category) || other.category == category)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.distance, distance) || other.distance == distance)&&(identical(other.score, score) || other.score == score)&&(identical(other.address, address) || other.address == address)&&(identical(other.description, description) || other.description == description)&&(identical(other.cuisine, cuisine) || other.cuisine == cuisine)&&(identical(other.amenityType, amenityType) || other.amenityType == amenityType)&&(identical(other.hasRemark, hasRemark) || other.hasRemark == hasRemark)&&(identical(other.hasOutdoorSeating, hasOutdoorSeating) || other.hasOutdoorSeating == hasOutdoorSeating)&&(identical(other.hasWifi, hasWifi) || other.hasWifi == hasWifi)&&(identical(other.placeType, placeType) || other.placeType == placeType)&&(identical(other.remark, remark) || other.remark == remark)&&(identical(other.source, source) || other.source == source));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,osmId,name,category,latitude,longitude,distance,score,address,description,cuisine,amenityType,hasRemark,hasOutdoorSeating,hasWifi,placeType,remark,source);

@override
String toString() {
  return 'SearchResult(id: $id, osmId: $osmId, name: $name, category: $category, latitude: $latitude, longitude: $longitude, distance: $distance, score: $score, address: $address, description: $description, cuisine: $cuisine, amenityType: $amenityType, hasRemark: $hasRemark, hasOutdoorSeating: $hasOutdoorSeating, hasWifi: $hasWifi, placeType: $placeType, remark: $remark, source: $source)';
}


}

/// @nodoc
abstract mixin class $SearchResultCopyWith<$Res>  {
  factory $SearchResultCopyWith(SearchResult value, $Res Function(SearchResult) _then) = _$SearchResultCopyWithImpl;
@useResult
$Res call({
 String id, int? osmId, String name, String category, double latitude, double longitude, double? distance, double score, String? address, String? description, String? cuisine, String? amenityType, bool hasRemark, bool? hasOutdoorSeating, bool? hasWifi, String? placeType, RemarkWithPoi? remark, String source
});


$RemarkWithPoiCopyWith<$Res>? get remark;

}
/// @nodoc
class _$SearchResultCopyWithImpl<$Res>
    implements $SearchResultCopyWith<$Res> {
  _$SearchResultCopyWithImpl(this._self, this._then);

  final SearchResult _self;
  final $Res Function(SearchResult) _then;

/// Create a copy of SearchResult
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? osmId = freezed,Object? name = null,Object? category = null,Object? latitude = null,Object? longitude = null,Object? distance = freezed,Object? score = null,Object? address = freezed,Object? description = freezed,Object? cuisine = freezed,Object? amenityType = freezed,Object? hasRemark = null,Object? hasOutdoorSeating = freezed,Object? hasWifi = freezed,Object? placeType = freezed,Object? remark = freezed,Object? source = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,osmId: freezed == osmId ? _self.osmId : osmId // ignore: cast_nullable_to_non_nullable
as int?,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double,distance: freezed == distance ? _self.distance : distance // ignore: cast_nullable_to_non_nullable
as double?,score: null == score ? _self.score : score // ignore: cast_nullable_to_non_nullable
as double,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,cuisine: freezed == cuisine ? _self.cuisine : cuisine // ignore: cast_nullable_to_non_nullable
as String?,amenityType: freezed == amenityType ? _self.amenityType : amenityType // ignore: cast_nullable_to_non_nullable
as String?,hasRemark: null == hasRemark ? _self.hasRemark : hasRemark // ignore: cast_nullable_to_non_nullable
as bool,hasOutdoorSeating: freezed == hasOutdoorSeating ? _self.hasOutdoorSeating : hasOutdoorSeating // ignore: cast_nullable_to_non_nullable
as bool?,hasWifi: freezed == hasWifi ? _self.hasWifi : hasWifi // ignore: cast_nullable_to_non_nullable
as bool?,placeType: freezed == placeType ? _self.placeType : placeType // ignore: cast_nullable_to_non_nullable
as String?,remark: freezed == remark ? _self.remark : remark // ignore: cast_nullable_to_non_nullable
as RemarkWithPoi?,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,
  ));
}
/// Create a copy of SearchResult
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RemarkWithPoiCopyWith<$Res>? get remark {
    if (_self.remark == null) {
    return null;
  }

  return $RemarkWithPoiCopyWith<$Res>(_self.remark!, (value) {
    return _then(_self.copyWith(remark: value));
  });
}
}


/// @nodoc
@JsonSerializable()

class _SearchResult implements SearchResult {
  const _SearchResult({required this.id, this.osmId, required this.name, required this.category, required this.latitude, required this.longitude, this.distance, required this.score, this.address, this.description, this.cuisine, this.amenityType, required this.hasRemark, this.hasOutdoorSeating, this.hasWifi, this.placeType, this.remark, required this.source});
  factory _SearchResult.fromJson(Map<String, dynamic> json) => _$SearchResultFromJson(json);

@override final  String id;
@override final  int? osmId;
@override final  String name;
@override final  String category;
@override final  double latitude;
@override final  double longitude;
@override final  double? distance;
@override final  double score;
@override final  String? address;
@override final  String? description;
@override final  String? cuisine;
@override final  String? amenityType;
@override final  bool hasRemark;
@override final  bool? hasOutdoorSeating;
@override final  bool? hasWifi;
@override final  String? placeType;
@override final  RemarkWithPoi? remark;
@override final  String source;

/// Create a copy of SearchResult
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SearchResultCopyWith<_SearchResult> get copyWith => __$SearchResultCopyWithImpl<_SearchResult>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SearchResultToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SearchResult&&(identical(other.id, id) || other.id == id)&&(identical(other.osmId, osmId) || other.osmId == osmId)&&(identical(other.name, name) || other.name == name)&&(identical(other.category, category) || other.category == category)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.distance, distance) || other.distance == distance)&&(identical(other.score, score) || other.score == score)&&(identical(other.address, address) || other.address == address)&&(identical(other.description, description) || other.description == description)&&(identical(other.cuisine, cuisine) || other.cuisine == cuisine)&&(identical(other.amenityType, amenityType) || other.amenityType == amenityType)&&(identical(other.hasRemark, hasRemark) || other.hasRemark == hasRemark)&&(identical(other.hasOutdoorSeating, hasOutdoorSeating) || other.hasOutdoorSeating == hasOutdoorSeating)&&(identical(other.hasWifi, hasWifi) || other.hasWifi == hasWifi)&&(identical(other.placeType, placeType) || other.placeType == placeType)&&(identical(other.remark, remark) || other.remark == remark)&&(identical(other.source, source) || other.source == source));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,osmId,name,category,latitude,longitude,distance,score,address,description,cuisine,amenityType,hasRemark,hasOutdoorSeating,hasWifi,placeType,remark,source);

@override
String toString() {
  return 'SearchResult(id: $id, osmId: $osmId, name: $name, category: $category, latitude: $latitude, longitude: $longitude, distance: $distance, score: $score, address: $address, description: $description, cuisine: $cuisine, amenityType: $amenityType, hasRemark: $hasRemark, hasOutdoorSeating: $hasOutdoorSeating, hasWifi: $hasWifi, placeType: $placeType, remark: $remark, source: $source)';
}


}

/// @nodoc
abstract mixin class _$SearchResultCopyWith<$Res> implements $SearchResultCopyWith<$Res> {
  factory _$SearchResultCopyWith(_SearchResult value, $Res Function(_SearchResult) _then) = __$SearchResultCopyWithImpl;
@override @useResult
$Res call({
 String id, int? osmId, String name, String category, double latitude, double longitude, double? distance, double score, String? address, String? description, String? cuisine, String? amenityType, bool hasRemark, bool? hasOutdoorSeating, bool? hasWifi, String? placeType, RemarkWithPoi? remark, String source
});


@override $RemarkWithPoiCopyWith<$Res>? get remark;

}
/// @nodoc
class __$SearchResultCopyWithImpl<$Res>
    implements _$SearchResultCopyWith<$Res> {
  __$SearchResultCopyWithImpl(this._self, this._then);

  final _SearchResult _self;
  final $Res Function(_SearchResult) _then;

/// Create a copy of SearchResult
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? osmId = freezed,Object? name = null,Object? category = null,Object? latitude = null,Object? longitude = null,Object? distance = freezed,Object? score = null,Object? address = freezed,Object? description = freezed,Object? cuisine = freezed,Object? amenityType = freezed,Object? hasRemark = null,Object? hasOutdoorSeating = freezed,Object? hasWifi = freezed,Object? placeType = freezed,Object? remark = freezed,Object? source = null,}) {
  return _then(_SearchResult(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,osmId: freezed == osmId ? _self.osmId : osmId // ignore: cast_nullable_to_non_nullable
as int?,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double,distance: freezed == distance ? _self.distance : distance // ignore: cast_nullable_to_non_nullable
as double?,score: null == score ? _self.score : score // ignore: cast_nullable_to_non_nullable
as double,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,cuisine: freezed == cuisine ? _self.cuisine : cuisine // ignore: cast_nullable_to_non_nullable
as String?,amenityType: freezed == amenityType ? _self.amenityType : amenityType // ignore: cast_nullable_to_non_nullable
as String?,hasRemark: null == hasRemark ? _self.hasRemark : hasRemark // ignore: cast_nullable_to_non_nullable
as bool,hasOutdoorSeating: freezed == hasOutdoorSeating ? _self.hasOutdoorSeating : hasOutdoorSeating // ignore: cast_nullable_to_non_nullable
as bool?,hasWifi: freezed == hasWifi ? _self.hasWifi : hasWifi // ignore: cast_nullable_to_non_nullable
as bool?,placeType: freezed == placeType ? _self.placeType : placeType // ignore: cast_nullable_to_non_nullable
as String?,remark: freezed == remark ? _self.remark : remark // ignore: cast_nullable_to_non_nullable
as RemarkWithPoi?,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

/// Create a copy of SearchResult
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RemarkWithPoiCopyWith<$Res>? get remark {
    if (_self.remark == null) {
    return null;
  }

  return $RemarkWithPoiCopyWith<$Res>(_self.remark!, (value) {
    return _then(_self.copyWith(remark: value));
  });
}
}


/// @nodoc
mixin _$Suggestion {

 String get id; String get name; String get category; double get latitude; double get longitude;
/// Create a copy of Suggestion
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SuggestionCopyWith<Suggestion> get copyWith => _$SuggestionCopyWithImpl<Suggestion>(this as Suggestion, _$identity);

  /// Serializes this Suggestion to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Suggestion&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.category, category) || other.category == category)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,category,latitude,longitude);

@override
String toString() {
  return 'Suggestion(id: $id, name: $name, category: $category, latitude: $latitude, longitude: $longitude)';
}


}

/// @nodoc
abstract mixin class $SuggestionCopyWith<$Res>  {
  factory $SuggestionCopyWith(Suggestion value, $Res Function(Suggestion) _then) = _$SuggestionCopyWithImpl;
@useResult
$Res call({
 String id, String name, String category, double latitude, double longitude
});




}
/// @nodoc
class _$SuggestionCopyWithImpl<$Res>
    implements $SuggestionCopyWith<$Res> {
  _$SuggestionCopyWithImpl(this._self, this._then);

  final Suggestion _self;
  final $Res Function(Suggestion) _then;

/// Create a copy of Suggestion
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? category = null,Object? latitude = null,Object? longitude = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _Suggestion implements Suggestion {
  const _Suggestion({required this.id, required this.name, required this.category, required this.latitude, required this.longitude});
  factory _Suggestion.fromJson(Map<String, dynamic> json) => _$SuggestionFromJson(json);

@override final  String id;
@override final  String name;
@override final  String category;
@override final  double latitude;
@override final  double longitude;

/// Create a copy of Suggestion
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SuggestionCopyWith<_Suggestion> get copyWith => __$SuggestionCopyWithImpl<_Suggestion>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SuggestionToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Suggestion&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.category, category) || other.category == category)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,category,latitude,longitude);

@override
String toString() {
  return 'Suggestion(id: $id, name: $name, category: $category, latitude: $latitude, longitude: $longitude)';
}


}

/// @nodoc
abstract mixin class _$SuggestionCopyWith<$Res> implements $SuggestionCopyWith<$Res> {
  factory _$SuggestionCopyWith(_Suggestion value, $Res Function(_Suggestion) _then) = __$SuggestionCopyWithImpl;
@override @useResult
$Res call({
 String id, String name, String category, double latitude, double longitude
});




}
/// @nodoc
class __$SuggestionCopyWithImpl<$Res>
    implements _$SuggestionCopyWith<$Res> {
  __$SuggestionCopyWithImpl(this._self, this._then);

  final _Suggestion _self;
  final $Res Function(_Suggestion) _then;

/// Create a copy of Suggestion
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? category = null,Object? latitude = null,Object? longitude = null,}) {
  return _then(_Suggestion(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}


/// @nodoc
mixin _$SearchResponse {

 List<SearchResult> get results;
/// Create a copy of SearchResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SearchResponseCopyWith<SearchResponse> get copyWith => _$SearchResponseCopyWithImpl<SearchResponse>(this as SearchResponse, _$identity);

  /// Serializes this SearchResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SearchResponse&&const DeepCollectionEquality().equals(other.results, results));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(results));

@override
String toString() {
  return 'SearchResponse(results: $results)';
}


}

/// @nodoc
abstract mixin class $SearchResponseCopyWith<$Res>  {
  factory $SearchResponseCopyWith(SearchResponse value, $Res Function(SearchResponse) _then) = _$SearchResponseCopyWithImpl;
@useResult
$Res call({
 List<SearchResult> results
});




}
/// @nodoc
class _$SearchResponseCopyWithImpl<$Res>
    implements $SearchResponseCopyWith<$Res> {
  _$SearchResponseCopyWithImpl(this._self, this._then);

  final SearchResponse _self;
  final $Res Function(SearchResponse) _then;

/// Create a copy of SearchResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? results = null,}) {
  return _then(_self.copyWith(
results: null == results ? _self.results : results // ignore: cast_nullable_to_non_nullable
as List<SearchResult>,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _SearchResponse implements SearchResponse {
  const _SearchResponse({required final  List<SearchResult> results}): _results = results;
  factory _SearchResponse.fromJson(Map<String, dynamic> json) => _$SearchResponseFromJson(json);

 final  List<SearchResult> _results;
@override List<SearchResult> get results {
  if (_results is EqualUnmodifiableListView) return _results;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_results);
}


/// Create a copy of SearchResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SearchResponseCopyWith<_SearchResponse> get copyWith => __$SearchResponseCopyWithImpl<_SearchResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SearchResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SearchResponse&&const DeepCollectionEquality().equals(other._results, _results));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_results));

@override
String toString() {
  return 'SearchResponse(results: $results)';
}


}

/// @nodoc
abstract mixin class _$SearchResponseCopyWith<$Res> implements $SearchResponseCopyWith<$Res> {
  factory _$SearchResponseCopyWith(_SearchResponse value, $Res Function(_SearchResponse) _then) = __$SearchResponseCopyWithImpl;
@override @useResult
$Res call({
 List<SearchResult> results
});




}
/// @nodoc
class __$SearchResponseCopyWithImpl<$Res>
    implements _$SearchResponseCopyWith<$Res> {
  __$SearchResponseCopyWithImpl(this._self, this._then);

  final _SearchResponse _self;
  final $Res Function(_SearchResponse) _then;

/// Create a copy of SearchResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? results = null,}) {
  return _then(_SearchResponse(
results: null == results ? _self._results : results // ignore: cast_nullable_to_non_nullable
as List<SearchResult>,
  ));
}


}


/// @nodoc
mixin _$AutocompleteResponse {

 List<Suggestion> get suggestions;
/// Create a copy of AutocompleteResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AutocompleteResponseCopyWith<AutocompleteResponse> get copyWith => _$AutocompleteResponseCopyWithImpl<AutocompleteResponse>(this as AutocompleteResponse, _$identity);

  /// Serializes this AutocompleteResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AutocompleteResponse&&const DeepCollectionEquality().equals(other.suggestions, suggestions));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(suggestions));

@override
String toString() {
  return 'AutocompleteResponse(suggestions: $suggestions)';
}


}

/// @nodoc
abstract mixin class $AutocompleteResponseCopyWith<$Res>  {
  factory $AutocompleteResponseCopyWith(AutocompleteResponse value, $Res Function(AutocompleteResponse) _then) = _$AutocompleteResponseCopyWithImpl;
@useResult
$Res call({
 List<Suggestion> suggestions
});




}
/// @nodoc
class _$AutocompleteResponseCopyWithImpl<$Res>
    implements $AutocompleteResponseCopyWith<$Res> {
  _$AutocompleteResponseCopyWithImpl(this._self, this._then);

  final AutocompleteResponse _self;
  final $Res Function(AutocompleteResponse) _then;

/// Create a copy of AutocompleteResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? suggestions = null,}) {
  return _then(_self.copyWith(
suggestions: null == suggestions ? _self.suggestions : suggestions // ignore: cast_nullable_to_non_nullable
as List<Suggestion>,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _AutocompleteResponse implements AutocompleteResponse {
  const _AutocompleteResponse({required final  List<Suggestion> suggestions}): _suggestions = suggestions;
  factory _AutocompleteResponse.fromJson(Map<String, dynamic> json) => _$AutocompleteResponseFromJson(json);

 final  List<Suggestion> _suggestions;
@override List<Suggestion> get suggestions {
  if (_suggestions is EqualUnmodifiableListView) return _suggestions;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_suggestions);
}


/// Create a copy of AutocompleteResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AutocompleteResponseCopyWith<_AutocompleteResponse> get copyWith => __$AutocompleteResponseCopyWithImpl<_AutocompleteResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AutocompleteResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AutocompleteResponse&&const DeepCollectionEquality().equals(other._suggestions, _suggestions));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_suggestions));

@override
String toString() {
  return 'AutocompleteResponse(suggestions: $suggestions)';
}


}

/// @nodoc
abstract mixin class _$AutocompleteResponseCopyWith<$Res> implements $AutocompleteResponseCopyWith<$Res> {
  factory _$AutocompleteResponseCopyWith(_AutocompleteResponse value, $Res Function(_AutocompleteResponse) _then) = __$AutocompleteResponseCopyWithImpl;
@override @useResult
$Res call({
 List<Suggestion> suggestions
});




}
/// @nodoc
class __$AutocompleteResponseCopyWithImpl<$Res>
    implements _$AutocompleteResponseCopyWith<$Res> {
  __$AutocompleteResponseCopyWithImpl(this._self, this._then);

  final _AutocompleteResponse _self;
  final $Res Function(_AutocompleteResponse) _then;

/// Create a copy of AutocompleteResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? suggestions = null,}) {
  return _then(_AutocompleteResponse(
suggestions: null == suggestions ? _self._suggestions : suggestions // ignore: cast_nullable_to_non_nullable
as List<Suggestion>,
  ));
}


}

// dart format on
