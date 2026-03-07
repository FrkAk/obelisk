// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'remark.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$RemarkPoi {

 String get id; int? get osmId; String get name; String? get categoryId; double get latitude; double get longitude; String? get address; String? get locale; String? get wikipediaUrl; String? get mapillaryId; double? get mapillaryBearing; bool? get mapillaryIsPano; Map<String, String>? get osmTags; DateTime? get createdAt; Category? get category;
/// Create a copy of RemarkPoi
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RemarkPoiCopyWith<RemarkPoi> get copyWith => _$RemarkPoiCopyWithImpl<RemarkPoi>(this as RemarkPoi, _$identity);

  /// Serializes this RemarkPoi to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RemarkPoi&&(identical(other.id, id) || other.id == id)&&(identical(other.osmId, osmId) || other.osmId == osmId)&&(identical(other.name, name) || other.name == name)&&(identical(other.categoryId, categoryId) || other.categoryId == categoryId)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.address, address) || other.address == address)&&(identical(other.locale, locale) || other.locale == locale)&&(identical(other.wikipediaUrl, wikipediaUrl) || other.wikipediaUrl == wikipediaUrl)&&(identical(other.mapillaryId, mapillaryId) || other.mapillaryId == mapillaryId)&&(identical(other.mapillaryBearing, mapillaryBearing) || other.mapillaryBearing == mapillaryBearing)&&(identical(other.mapillaryIsPano, mapillaryIsPano) || other.mapillaryIsPano == mapillaryIsPano)&&const DeepCollectionEquality().equals(other.osmTags, osmTags)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.category, category) || other.category == category));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,osmId,name,categoryId,latitude,longitude,address,locale,wikipediaUrl,mapillaryId,mapillaryBearing,mapillaryIsPano,const DeepCollectionEquality().hash(osmTags),createdAt,category);

@override
String toString() {
  return 'RemarkPoi(id: $id, osmId: $osmId, name: $name, categoryId: $categoryId, latitude: $latitude, longitude: $longitude, address: $address, locale: $locale, wikipediaUrl: $wikipediaUrl, mapillaryId: $mapillaryId, mapillaryBearing: $mapillaryBearing, mapillaryIsPano: $mapillaryIsPano, osmTags: $osmTags, createdAt: $createdAt, category: $category)';
}


}

/// @nodoc
abstract mixin class $RemarkPoiCopyWith<$Res>  {
  factory $RemarkPoiCopyWith(RemarkPoi value, $Res Function(RemarkPoi) _then) = _$RemarkPoiCopyWithImpl;
@useResult
$Res call({
 String id, int? osmId, String name, String? categoryId, double latitude, double longitude, String? address, String? locale, String? wikipediaUrl, String? mapillaryId, double? mapillaryBearing, bool? mapillaryIsPano, Map<String, String>? osmTags, DateTime? createdAt, Category? category
});


$CategoryCopyWith<$Res>? get category;

}
/// @nodoc
class _$RemarkPoiCopyWithImpl<$Res>
    implements $RemarkPoiCopyWith<$Res> {
  _$RemarkPoiCopyWithImpl(this._self, this._then);

  final RemarkPoi _self;
  final $Res Function(RemarkPoi) _then;

/// Create a copy of RemarkPoi
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? osmId = freezed,Object? name = null,Object? categoryId = freezed,Object? latitude = null,Object? longitude = null,Object? address = freezed,Object? locale = freezed,Object? wikipediaUrl = freezed,Object? mapillaryId = freezed,Object? mapillaryBearing = freezed,Object? mapillaryIsPano = freezed,Object? osmTags = freezed,Object? createdAt = freezed,Object? category = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,osmId: freezed == osmId ? _self.osmId : osmId // ignore: cast_nullable_to_non_nullable
as int?,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,categoryId: freezed == categoryId ? _self.categoryId : categoryId // ignore: cast_nullable_to_non_nullable
as String?,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,locale: freezed == locale ? _self.locale : locale // ignore: cast_nullable_to_non_nullable
as String?,wikipediaUrl: freezed == wikipediaUrl ? _self.wikipediaUrl : wikipediaUrl // ignore: cast_nullable_to_non_nullable
as String?,mapillaryId: freezed == mapillaryId ? _self.mapillaryId : mapillaryId // ignore: cast_nullable_to_non_nullable
as String?,mapillaryBearing: freezed == mapillaryBearing ? _self.mapillaryBearing : mapillaryBearing // ignore: cast_nullable_to_non_nullable
as double?,mapillaryIsPano: freezed == mapillaryIsPano ? _self.mapillaryIsPano : mapillaryIsPano // ignore: cast_nullable_to_non_nullable
as bool?,osmTags: freezed == osmTags ? _self.osmTags : osmTags // ignore: cast_nullable_to_non_nullable
as Map<String, String>?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,category: freezed == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as Category?,
  ));
}
/// Create a copy of RemarkPoi
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CategoryCopyWith<$Res>? get category {
    if (_self.category == null) {
    return null;
  }

  return $CategoryCopyWith<$Res>(_self.category!, (value) {
    return _then(_self.copyWith(category: value));
  });
}
}


/// @nodoc
@JsonSerializable()

class _RemarkPoi implements RemarkPoi {
  const _RemarkPoi({required this.id, this.osmId, required this.name, this.categoryId, required this.latitude, required this.longitude, this.address, this.locale, this.wikipediaUrl, this.mapillaryId, this.mapillaryBearing, this.mapillaryIsPano, final  Map<String, String>? osmTags, this.createdAt, this.category}): _osmTags = osmTags;
  factory _RemarkPoi.fromJson(Map<String, dynamic> json) => _$RemarkPoiFromJson(json);

@override final  String id;
@override final  int? osmId;
@override final  String name;
@override final  String? categoryId;
@override final  double latitude;
@override final  double longitude;
@override final  String? address;
@override final  String? locale;
@override final  String? wikipediaUrl;
@override final  String? mapillaryId;
@override final  double? mapillaryBearing;
@override final  bool? mapillaryIsPano;
 final  Map<String, String>? _osmTags;
@override Map<String, String>? get osmTags {
  final value = _osmTags;
  if (value == null) return null;
  if (_osmTags is EqualUnmodifiableMapView) return _osmTags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

@override final  DateTime? createdAt;
@override final  Category? category;

/// Create a copy of RemarkPoi
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RemarkPoiCopyWith<_RemarkPoi> get copyWith => __$RemarkPoiCopyWithImpl<_RemarkPoi>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RemarkPoiToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _RemarkPoi&&(identical(other.id, id) || other.id == id)&&(identical(other.osmId, osmId) || other.osmId == osmId)&&(identical(other.name, name) || other.name == name)&&(identical(other.categoryId, categoryId) || other.categoryId == categoryId)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.address, address) || other.address == address)&&(identical(other.locale, locale) || other.locale == locale)&&(identical(other.wikipediaUrl, wikipediaUrl) || other.wikipediaUrl == wikipediaUrl)&&(identical(other.mapillaryId, mapillaryId) || other.mapillaryId == mapillaryId)&&(identical(other.mapillaryBearing, mapillaryBearing) || other.mapillaryBearing == mapillaryBearing)&&(identical(other.mapillaryIsPano, mapillaryIsPano) || other.mapillaryIsPano == mapillaryIsPano)&&const DeepCollectionEquality().equals(other._osmTags, _osmTags)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.category, category) || other.category == category));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,osmId,name,categoryId,latitude,longitude,address,locale,wikipediaUrl,mapillaryId,mapillaryBearing,mapillaryIsPano,const DeepCollectionEquality().hash(_osmTags),createdAt,category);

@override
String toString() {
  return 'RemarkPoi(id: $id, osmId: $osmId, name: $name, categoryId: $categoryId, latitude: $latitude, longitude: $longitude, address: $address, locale: $locale, wikipediaUrl: $wikipediaUrl, mapillaryId: $mapillaryId, mapillaryBearing: $mapillaryBearing, mapillaryIsPano: $mapillaryIsPano, osmTags: $osmTags, createdAt: $createdAt, category: $category)';
}


}

/// @nodoc
abstract mixin class _$RemarkPoiCopyWith<$Res> implements $RemarkPoiCopyWith<$Res> {
  factory _$RemarkPoiCopyWith(_RemarkPoi value, $Res Function(_RemarkPoi) _then) = __$RemarkPoiCopyWithImpl;
@override @useResult
$Res call({
 String id, int? osmId, String name, String? categoryId, double latitude, double longitude, String? address, String? locale, String? wikipediaUrl, String? mapillaryId, double? mapillaryBearing, bool? mapillaryIsPano, Map<String, String>? osmTags, DateTime? createdAt, Category? category
});


@override $CategoryCopyWith<$Res>? get category;

}
/// @nodoc
class __$RemarkPoiCopyWithImpl<$Res>
    implements _$RemarkPoiCopyWith<$Res> {
  __$RemarkPoiCopyWithImpl(this._self, this._then);

  final _RemarkPoi _self;
  final $Res Function(_RemarkPoi) _then;

/// Create a copy of RemarkPoi
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? osmId = freezed,Object? name = null,Object? categoryId = freezed,Object? latitude = null,Object? longitude = null,Object? address = freezed,Object? locale = freezed,Object? wikipediaUrl = freezed,Object? mapillaryId = freezed,Object? mapillaryBearing = freezed,Object? mapillaryIsPano = freezed,Object? osmTags = freezed,Object? createdAt = freezed,Object? category = freezed,}) {
  return _then(_RemarkPoi(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,osmId: freezed == osmId ? _self.osmId : osmId // ignore: cast_nullable_to_non_nullable
as int?,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,categoryId: freezed == categoryId ? _self.categoryId : categoryId // ignore: cast_nullable_to_non_nullable
as String?,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,locale: freezed == locale ? _self.locale : locale // ignore: cast_nullable_to_non_nullable
as String?,wikipediaUrl: freezed == wikipediaUrl ? _self.wikipediaUrl : wikipediaUrl // ignore: cast_nullable_to_non_nullable
as String?,mapillaryId: freezed == mapillaryId ? _self.mapillaryId : mapillaryId // ignore: cast_nullable_to_non_nullable
as String?,mapillaryBearing: freezed == mapillaryBearing ? _self.mapillaryBearing : mapillaryBearing // ignore: cast_nullable_to_non_nullable
as double?,mapillaryIsPano: freezed == mapillaryIsPano ? _self.mapillaryIsPano : mapillaryIsPano // ignore: cast_nullable_to_non_nullable
as bool?,osmTags: freezed == osmTags ? _self._osmTags : osmTags // ignore: cast_nullable_to_non_nullable
as Map<String, String>?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,category: freezed == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as Category?,
  ));
}

/// Create a copy of RemarkPoi
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CategoryCopyWith<$Res>? get category {
    if (_self.category == null) {
    return null;
  }

  return $CategoryCopyWith<$Res>(_self.category!, (value) {
    return _then(_self.copyWith(category: value));
  });
}
}


/// @nodoc
mixin _$RemarkWithPoi {

 String get id; String get poiId; String get title; String? get teaser; String get content; String? get localTip; int? get durationSeconds; DateTime? get createdAt; String? get locale; int get version; bool? get isCurrent; RemarkPoi get poi;
/// Create a copy of RemarkWithPoi
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RemarkWithPoiCopyWith<RemarkWithPoi> get copyWith => _$RemarkWithPoiCopyWithImpl<RemarkWithPoi>(this as RemarkWithPoi, _$identity);

  /// Serializes this RemarkWithPoi to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RemarkWithPoi&&(identical(other.id, id) || other.id == id)&&(identical(other.poiId, poiId) || other.poiId == poiId)&&(identical(other.title, title) || other.title == title)&&(identical(other.teaser, teaser) || other.teaser == teaser)&&(identical(other.content, content) || other.content == content)&&(identical(other.localTip, localTip) || other.localTip == localTip)&&(identical(other.durationSeconds, durationSeconds) || other.durationSeconds == durationSeconds)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.locale, locale) || other.locale == locale)&&(identical(other.version, version) || other.version == version)&&(identical(other.isCurrent, isCurrent) || other.isCurrent == isCurrent)&&(identical(other.poi, poi) || other.poi == poi));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,poiId,title,teaser,content,localTip,durationSeconds,createdAt,locale,version,isCurrent,poi);

@override
String toString() {
  return 'RemarkWithPoi(id: $id, poiId: $poiId, title: $title, teaser: $teaser, content: $content, localTip: $localTip, durationSeconds: $durationSeconds, createdAt: $createdAt, locale: $locale, version: $version, isCurrent: $isCurrent, poi: $poi)';
}


}

/// @nodoc
abstract mixin class $RemarkWithPoiCopyWith<$Res>  {
  factory $RemarkWithPoiCopyWith(RemarkWithPoi value, $Res Function(RemarkWithPoi) _then) = _$RemarkWithPoiCopyWithImpl;
@useResult
$Res call({
 String id, String poiId, String title, String? teaser, String content, String? localTip, int? durationSeconds, DateTime? createdAt, String? locale, int version, bool? isCurrent, RemarkPoi poi
});


$RemarkPoiCopyWith<$Res> get poi;

}
/// @nodoc
class _$RemarkWithPoiCopyWithImpl<$Res>
    implements $RemarkWithPoiCopyWith<$Res> {
  _$RemarkWithPoiCopyWithImpl(this._self, this._then);

  final RemarkWithPoi _self;
  final $Res Function(RemarkWithPoi) _then;

/// Create a copy of RemarkWithPoi
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? poiId = null,Object? title = null,Object? teaser = freezed,Object? content = null,Object? localTip = freezed,Object? durationSeconds = freezed,Object? createdAt = freezed,Object? locale = freezed,Object? version = null,Object? isCurrent = freezed,Object? poi = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,poiId: null == poiId ? _self.poiId : poiId // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,teaser: freezed == teaser ? _self.teaser : teaser // ignore: cast_nullable_to_non_nullable
as String?,content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,localTip: freezed == localTip ? _self.localTip : localTip // ignore: cast_nullable_to_non_nullable
as String?,durationSeconds: freezed == durationSeconds ? _self.durationSeconds : durationSeconds // ignore: cast_nullable_to_non_nullable
as int?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,locale: freezed == locale ? _self.locale : locale // ignore: cast_nullable_to_non_nullable
as String?,version: null == version ? _self.version : version // ignore: cast_nullable_to_non_nullable
as int,isCurrent: freezed == isCurrent ? _self.isCurrent : isCurrent // ignore: cast_nullable_to_non_nullable
as bool?,poi: null == poi ? _self.poi : poi // ignore: cast_nullable_to_non_nullable
as RemarkPoi,
  ));
}
/// Create a copy of RemarkWithPoi
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RemarkPoiCopyWith<$Res> get poi {
  
  return $RemarkPoiCopyWith<$Res>(_self.poi, (value) {
    return _then(_self.copyWith(poi: value));
  });
}
}


/// @nodoc
@JsonSerializable()

class _RemarkWithPoi implements RemarkWithPoi {
  const _RemarkWithPoi({required this.id, required this.poiId, required this.title, this.teaser, required this.content, this.localTip, this.durationSeconds, this.createdAt, this.locale, required this.version, this.isCurrent, required this.poi});
  factory _RemarkWithPoi.fromJson(Map<String, dynamic> json) => _$RemarkWithPoiFromJson(json);

@override final  String id;
@override final  String poiId;
@override final  String title;
@override final  String? teaser;
@override final  String content;
@override final  String? localTip;
@override final  int? durationSeconds;
@override final  DateTime? createdAt;
@override final  String? locale;
@override final  int version;
@override final  bool? isCurrent;
@override final  RemarkPoi poi;

/// Create a copy of RemarkWithPoi
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RemarkWithPoiCopyWith<_RemarkWithPoi> get copyWith => __$RemarkWithPoiCopyWithImpl<_RemarkWithPoi>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RemarkWithPoiToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _RemarkWithPoi&&(identical(other.id, id) || other.id == id)&&(identical(other.poiId, poiId) || other.poiId == poiId)&&(identical(other.title, title) || other.title == title)&&(identical(other.teaser, teaser) || other.teaser == teaser)&&(identical(other.content, content) || other.content == content)&&(identical(other.localTip, localTip) || other.localTip == localTip)&&(identical(other.durationSeconds, durationSeconds) || other.durationSeconds == durationSeconds)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.locale, locale) || other.locale == locale)&&(identical(other.version, version) || other.version == version)&&(identical(other.isCurrent, isCurrent) || other.isCurrent == isCurrent)&&(identical(other.poi, poi) || other.poi == poi));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,poiId,title,teaser,content,localTip,durationSeconds,createdAt,locale,version,isCurrent,poi);

@override
String toString() {
  return 'RemarkWithPoi(id: $id, poiId: $poiId, title: $title, teaser: $teaser, content: $content, localTip: $localTip, durationSeconds: $durationSeconds, createdAt: $createdAt, locale: $locale, version: $version, isCurrent: $isCurrent, poi: $poi)';
}


}

/// @nodoc
abstract mixin class _$RemarkWithPoiCopyWith<$Res> implements $RemarkWithPoiCopyWith<$Res> {
  factory _$RemarkWithPoiCopyWith(_RemarkWithPoi value, $Res Function(_RemarkWithPoi) _then) = __$RemarkWithPoiCopyWithImpl;
@override @useResult
$Res call({
 String id, String poiId, String title, String? teaser, String content, String? localTip, int? durationSeconds, DateTime? createdAt, String? locale, int version, bool? isCurrent, RemarkPoi poi
});


@override $RemarkPoiCopyWith<$Res> get poi;

}
/// @nodoc
class __$RemarkWithPoiCopyWithImpl<$Res>
    implements _$RemarkWithPoiCopyWith<$Res> {
  __$RemarkWithPoiCopyWithImpl(this._self, this._then);

  final _RemarkWithPoi _self;
  final $Res Function(_RemarkWithPoi) _then;

/// Create a copy of RemarkWithPoi
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? poiId = null,Object? title = null,Object? teaser = freezed,Object? content = null,Object? localTip = freezed,Object? durationSeconds = freezed,Object? createdAt = freezed,Object? locale = freezed,Object? version = null,Object? isCurrent = freezed,Object? poi = null,}) {
  return _then(_RemarkWithPoi(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,poiId: null == poiId ? _self.poiId : poiId // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,teaser: freezed == teaser ? _self.teaser : teaser // ignore: cast_nullable_to_non_nullable
as String?,content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,localTip: freezed == localTip ? _self.localTip : localTip // ignore: cast_nullable_to_non_nullable
as String?,durationSeconds: freezed == durationSeconds ? _self.durationSeconds : durationSeconds // ignore: cast_nullable_to_non_nullable
as int?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,locale: freezed == locale ? _self.locale : locale // ignore: cast_nullable_to_non_nullable
as String?,version: null == version ? _self.version : version // ignore: cast_nullable_to_non_nullable
as int,isCurrent: freezed == isCurrent ? _self.isCurrent : isCurrent // ignore: cast_nullable_to_non_nullable
as bool?,poi: null == poi ? _self.poi : poi // ignore: cast_nullable_to_non_nullable
as RemarkPoi,
  ));
}

/// Create a copy of RemarkWithPoi
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RemarkPoiCopyWith<$Res> get poi {
  
  return $RemarkPoiCopyWith<$Res>(_self.poi, (value) {
    return _then(_self.copyWith(poi: value));
  });
}
}


/// @nodoc
mixin _$RemarksResponse {

 List<RemarkWithPoi> get remarks; int get total;
/// Create a copy of RemarksResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RemarksResponseCopyWith<RemarksResponse> get copyWith => _$RemarksResponseCopyWithImpl<RemarksResponse>(this as RemarksResponse, _$identity);

  /// Serializes this RemarksResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RemarksResponse&&const DeepCollectionEquality().equals(other.remarks, remarks)&&(identical(other.total, total) || other.total == total));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(remarks),total);

@override
String toString() {
  return 'RemarksResponse(remarks: $remarks, total: $total)';
}


}

/// @nodoc
abstract mixin class $RemarksResponseCopyWith<$Res>  {
  factory $RemarksResponseCopyWith(RemarksResponse value, $Res Function(RemarksResponse) _then) = _$RemarksResponseCopyWithImpl;
@useResult
$Res call({
 List<RemarkWithPoi> remarks, int total
});




}
/// @nodoc
class _$RemarksResponseCopyWithImpl<$Res>
    implements $RemarksResponseCopyWith<$Res> {
  _$RemarksResponseCopyWithImpl(this._self, this._then);

  final RemarksResponse _self;
  final $Res Function(RemarksResponse) _then;

/// Create a copy of RemarksResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? remarks = null,Object? total = null,}) {
  return _then(_self.copyWith(
remarks: null == remarks ? _self.remarks : remarks // ignore: cast_nullable_to_non_nullable
as List<RemarkWithPoi>,total: null == total ? _self.total : total // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _RemarksResponse implements RemarksResponse {
  const _RemarksResponse({required final  List<RemarkWithPoi> remarks, required this.total}): _remarks = remarks;
  factory _RemarksResponse.fromJson(Map<String, dynamic> json) => _$RemarksResponseFromJson(json);

 final  List<RemarkWithPoi> _remarks;
@override List<RemarkWithPoi> get remarks {
  if (_remarks is EqualUnmodifiableListView) return _remarks;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_remarks);
}

@override final  int total;

/// Create a copy of RemarksResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RemarksResponseCopyWith<_RemarksResponse> get copyWith => __$RemarksResponseCopyWithImpl<_RemarksResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RemarksResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _RemarksResponse&&const DeepCollectionEquality().equals(other._remarks, _remarks)&&(identical(other.total, total) || other.total == total));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_remarks),total);

@override
String toString() {
  return 'RemarksResponse(remarks: $remarks, total: $total)';
}


}

/// @nodoc
abstract mixin class _$RemarksResponseCopyWith<$Res> implements $RemarksResponseCopyWith<$Res> {
  factory _$RemarksResponseCopyWith(_RemarksResponse value, $Res Function(_RemarksResponse) _then) = __$RemarksResponseCopyWithImpl;
@override @useResult
$Res call({
 List<RemarkWithPoi> remarks, int total
});




}
/// @nodoc
class __$RemarksResponseCopyWithImpl<$Res>
    implements _$RemarksResponseCopyWith<$Res> {
  __$RemarksResponseCopyWithImpl(this._self, this._then);

  final _RemarksResponse _self;
  final $Res Function(_RemarksResponse) _then;

/// Create a copy of RemarksResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? remarks = null,Object? total = null,}) {
  return _then(_RemarksResponse(
remarks: null == remarks ? _self._remarks : remarks // ignore: cast_nullable_to_non_nullable
as List<RemarkWithPoi>,total: null == total ? _self.total : total // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$GenerateRemarksResponse {

 int get generated; int get skipped; int get errors;
/// Create a copy of GenerateRemarksResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$GenerateRemarksResponseCopyWith<GenerateRemarksResponse> get copyWith => _$GenerateRemarksResponseCopyWithImpl<GenerateRemarksResponse>(this as GenerateRemarksResponse, _$identity);

  /// Serializes this GenerateRemarksResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is GenerateRemarksResponse&&(identical(other.generated, generated) || other.generated == generated)&&(identical(other.skipped, skipped) || other.skipped == skipped)&&(identical(other.errors, errors) || other.errors == errors));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,generated,skipped,errors);

@override
String toString() {
  return 'GenerateRemarksResponse(generated: $generated, skipped: $skipped, errors: $errors)';
}


}

/// @nodoc
abstract mixin class $GenerateRemarksResponseCopyWith<$Res>  {
  factory $GenerateRemarksResponseCopyWith(GenerateRemarksResponse value, $Res Function(GenerateRemarksResponse) _then) = _$GenerateRemarksResponseCopyWithImpl;
@useResult
$Res call({
 int generated, int skipped, int errors
});




}
/// @nodoc
class _$GenerateRemarksResponseCopyWithImpl<$Res>
    implements $GenerateRemarksResponseCopyWith<$Res> {
  _$GenerateRemarksResponseCopyWithImpl(this._self, this._then);

  final GenerateRemarksResponse _self;
  final $Res Function(GenerateRemarksResponse) _then;

/// Create a copy of GenerateRemarksResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? generated = null,Object? skipped = null,Object? errors = null,}) {
  return _then(_self.copyWith(
generated: null == generated ? _self.generated : generated // ignore: cast_nullable_to_non_nullable
as int,skipped: null == skipped ? _self.skipped : skipped // ignore: cast_nullable_to_non_nullable
as int,errors: null == errors ? _self.errors : errors // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _GenerateRemarksResponse implements GenerateRemarksResponse {
  const _GenerateRemarksResponse({required this.generated, required this.skipped, required this.errors});
  factory _GenerateRemarksResponse.fromJson(Map<String, dynamic> json) => _$GenerateRemarksResponseFromJson(json);

@override final  int generated;
@override final  int skipped;
@override final  int errors;

/// Create a copy of GenerateRemarksResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$GenerateRemarksResponseCopyWith<_GenerateRemarksResponse> get copyWith => __$GenerateRemarksResponseCopyWithImpl<_GenerateRemarksResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$GenerateRemarksResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _GenerateRemarksResponse&&(identical(other.generated, generated) || other.generated == generated)&&(identical(other.skipped, skipped) || other.skipped == skipped)&&(identical(other.errors, errors) || other.errors == errors));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,generated,skipped,errors);

@override
String toString() {
  return 'GenerateRemarksResponse(generated: $generated, skipped: $skipped, errors: $errors)';
}


}

/// @nodoc
abstract mixin class _$GenerateRemarksResponseCopyWith<$Res> implements $GenerateRemarksResponseCopyWith<$Res> {
  factory _$GenerateRemarksResponseCopyWith(_GenerateRemarksResponse value, $Res Function(_GenerateRemarksResponse) _then) = __$GenerateRemarksResponseCopyWithImpl;
@override @useResult
$Res call({
 int generated, int skipped, int errors
});




}
/// @nodoc
class __$GenerateRemarksResponseCopyWithImpl<$Res>
    implements _$GenerateRemarksResponseCopyWith<$Res> {
  __$GenerateRemarksResponseCopyWithImpl(this._self, this._then);

  final _GenerateRemarksResponse _self;
  final $Res Function(_GenerateRemarksResponse) _then;

/// Create a copy of GenerateRemarksResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? generated = null,Object? skipped = null,Object? errors = null,}) {
  return _then(_GenerateRemarksResponse(
generated: null == generated ? _self.generated : generated // ignore: cast_nullable_to_non_nullable
as int,skipped: null == skipped ? _self.skipped : skipped // ignore: cast_nullable_to_non_nullable
as int,errors: null == errors ? _self.errors : errors // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$GenerateForPoiResponse {

 RemarkWithPoi get remark; bool get cached;
/// Create a copy of GenerateForPoiResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$GenerateForPoiResponseCopyWith<GenerateForPoiResponse> get copyWith => _$GenerateForPoiResponseCopyWithImpl<GenerateForPoiResponse>(this as GenerateForPoiResponse, _$identity);

  /// Serializes this GenerateForPoiResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is GenerateForPoiResponse&&(identical(other.remark, remark) || other.remark == remark)&&(identical(other.cached, cached) || other.cached == cached));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,remark,cached);

@override
String toString() {
  return 'GenerateForPoiResponse(remark: $remark, cached: $cached)';
}


}

/// @nodoc
abstract mixin class $GenerateForPoiResponseCopyWith<$Res>  {
  factory $GenerateForPoiResponseCopyWith(GenerateForPoiResponse value, $Res Function(GenerateForPoiResponse) _then) = _$GenerateForPoiResponseCopyWithImpl;
@useResult
$Res call({
 RemarkWithPoi remark, bool cached
});


$RemarkWithPoiCopyWith<$Res> get remark;

}
/// @nodoc
class _$GenerateForPoiResponseCopyWithImpl<$Res>
    implements $GenerateForPoiResponseCopyWith<$Res> {
  _$GenerateForPoiResponseCopyWithImpl(this._self, this._then);

  final GenerateForPoiResponse _self;
  final $Res Function(GenerateForPoiResponse) _then;

/// Create a copy of GenerateForPoiResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? remark = null,Object? cached = null,}) {
  return _then(_self.copyWith(
remark: null == remark ? _self.remark : remark // ignore: cast_nullable_to_non_nullable
as RemarkWithPoi,cached: null == cached ? _self.cached : cached // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}
/// Create a copy of GenerateForPoiResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RemarkWithPoiCopyWith<$Res> get remark {
  
  return $RemarkWithPoiCopyWith<$Res>(_self.remark, (value) {
    return _then(_self.copyWith(remark: value));
  });
}
}


/// @nodoc
@JsonSerializable()

class _GenerateForPoiResponse implements GenerateForPoiResponse {
  const _GenerateForPoiResponse({required this.remark, required this.cached});
  factory _GenerateForPoiResponse.fromJson(Map<String, dynamic> json) => _$GenerateForPoiResponseFromJson(json);

@override final  RemarkWithPoi remark;
@override final  bool cached;

/// Create a copy of GenerateForPoiResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$GenerateForPoiResponseCopyWith<_GenerateForPoiResponse> get copyWith => __$GenerateForPoiResponseCopyWithImpl<_GenerateForPoiResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$GenerateForPoiResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _GenerateForPoiResponse&&(identical(other.remark, remark) || other.remark == remark)&&(identical(other.cached, cached) || other.cached == cached));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,remark,cached);

@override
String toString() {
  return 'GenerateForPoiResponse(remark: $remark, cached: $cached)';
}


}

/// @nodoc
abstract mixin class _$GenerateForPoiResponseCopyWith<$Res> implements $GenerateForPoiResponseCopyWith<$Res> {
  factory _$GenerateForPoiResponseCopyWith(_GenerateForPoiResponse value, $Res Function(_GenerateForPoiResponse) _then) = __$GenerateForPoiResponseCopyWithImpl;
@override @useResult
$Res call({
 RemarkWithPoi remark, bool cached
});


@override $RemarkWithPoiCopyWith<$Res> get remark;

}
/// @nodoc
class __$GenerateForPoiResponseCopyWithImpl<$Res>
    implements _$GenerateForPoiResponseCopyWith<$Res> {
  __$GenerateForPoiResponseCopyWithImpl(this._self, this._then);

  final _GenerateForPoiResponse _self;
  final $Res Function(_GenerateForPoiResponse) _then;

/// Create a copy of GenerateForPoiResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? remark = null,Object? cached = null,}) {
  return _then(_GenerateForPoiResponse(
remark: null == remark ? _self.remark : remark // ignore: cast_nullable_to_non_nullable
as RemarkWithPoi,cached: null == cached ? _self.cached : cached // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

/// Create a copy of GenerateForPoiResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RemarkWithPoiCopyWith<$Res> get remark {
  
  return $RemarkWithPoiCopyWith<$Res>(_self.remark, (value) {
    return _then(_self.copyWith(remark: value));
  });
}
}


/// @nodoc
mixin _$RegenerateRemarkResponse {

 RemarkWithPoi get remark;
/// Create a copy of RegenerateRemarkResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RegenerateRemarkResponseCopyWith<RegenerateRemarkResponse> get copyWith => _$RegenerateRemarkResponseCopyWithImpl<RegenerateRemarkResponse>(this as RegenerateRemarkResponse, _$identity);

  /// Serializes this RegenerateRemarkResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RegenerateRemarkResponse&&(identical(other.remark, remark) || other.remark == remark));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,remark);

@override
String toString() {
  return 'RegenerateRemarkResponse(remark: $remark)';
}


}

/// @nodoc
abstract mixin class $RegenerateRemarkResponseCopyWith<$Res>  {
  factory $RegenerateRemarkResponseCopyWith(RegenerateRemarkResponse value, $Res Function(RegenerateRemarkResponse) _then) = _$RegenerateRemarkResponseCopyWithImpl;
@useResult
$Res call({
 RemarkWithPoi remark
});


$RemarkWithPoiCopyWith<$Res> get remark;

}
/// @nodoc
class _$RegenerateRemarkResponseCopyWithImpl<$Res>
    implements $RegenerateRemarkResponseCopyWith<$Res> {
  _$RegenerateRemarkResponseCopyWithImpl(this._self, this._then);

  final RegenerateRemarkResponse _self;
  final $Res Function(RegenerateRemarkResponse) _then;

/// Create a copy of RegenerateRemarkResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? remark = null,}) {
  return _then(_self.copyWith(
remark: null == remark ? _self.remark : remark // ignore: cast_nullable_to_non_nullable
as RemarkWithPoi,
  ));
}
/// Create a copy of RegenerateRemarkResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RemarkWithPoiCopyWith<$Res> get remark {
  
  return $RemarkWithPoiCopyWith<$Res>(_self.remark, (value) {
    return _then(_self.copyWith(remark: value));
  });
}
}


/// @nodoc
@JsonSerializable()

class _RegenerateRemarkResponse implements RegenerateRemarkResponse {
  const _RegenerateRemarkResponse({required this.remark});
  factory _RegenerateRemarkResponse.fromJson(Map<String, dynamic> json) => _$RegenerateRemarkResponseFromJson(json);

@override final  RemarkWithPoi remark;

/// Create a copy of RegenerateRemarkResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RegenerateRemarkResponseCopyWith<_RegenerateRemarkResponse> get copyWith => __$RegenerateRemarkResponseCopyWithImpl<_RegenerateRemarkResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RegenerateRemarkResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _RegenerateRemarkResponse&&(identical(other.remark, remark) || other.remark == remark));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,remark);

@override
String toString() {
  return 'RegenerateRemarkResponse(remark: $remark)';
}


}

/// @nodoc
abstract mixin class _$RegenerateRemarkResponseCopyWith<$Res> implements $RegenerateRemarkResponseCopyWith<$Res> {
  factory _$RegenerateRemarkResponseCopyWith(_RegenerateRemarkResponse value, $Res Function(_RegenerateRemarkResponse) _then) = __$RegenerateRemarkResponseCopyWithImpl;
@override @useResult
$Res call({
 RemarkWithPoi remark
});


@override $RemarkWithPoiCopyWith<$Res> get remark;

}
/// @nodoc
class __$RegenerateRemarkResponseCopyWithImpl<$Res>
    implements _$RegenerateRemarkResponseCopyWith<$Res> {
  __$RegenerateRemarkResponseCopyWithImpl(this._self, this._then);

  final _RegenerateRemarkResponse _self;
  final $Res Function(_RegenerateRemarkResponse) _then;

/// Create a copy of RegenerateRemarkResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? remark = null,}) {
  return _then(_RegenerateRemarkResponse(
remark: null == remark ? _self.remark : remark // ignore: cast_nullable_to_non_nullable
as RemarkWithPoi,
  ));
}

/// Create a copy of RegenerateRemarkResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RemarkWithPoiCopyWith<$Res> get remark {
  
  return $RemarkWithPoiCopyWith<$Res>(_self.remark, (value) {
    return _then(_self.copyWith(remark: value));
  });
}
}

// dart format on
