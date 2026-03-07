// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'poi.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PoiImage {

 String get id; String get url; String get source;
/// Create a copy of PoiImage
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PoiImageCopyWith<PoiImage> get copyWith => _$PoiImageCopyWithImpl<PoiImage>(this as PoiImage, _$identity);

  /// Serializes this PoiImage to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PoiImage&&(identical(other.id, id) || other.id == id)&&(identical(other.url, url) || other.url == url)&&(identical(other.source, source) || other.source == source));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,url,source);

@override
String toString() {
  return 'PoiImage(id: $id, url: $url, source: $source)';
}


}

/// @nodoc
abstract mixin class $PoiImageCopyWith<$Res>  {
  factory $PoiImageCopyWith(PoiImage value, $Res Function(PoiImage) _then) = _$PoiImageCopyWithImpl;
@useResult
$Res call({
 String id, String url, String source
});




}
/// @nodoc
class _$PoiImageCopyWithImpl<$Res>
    implements $PoiImageCopyWith<$Res> {
  _$PoiImageCopyWithImpl(this._self, this._then);

  final PoiImage _self;
  final $Res Function(PoiImage) _then;

/// Create a copy of PoiImage
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? url = null,Object? source = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,url: null == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _PoiImage implements PoiImage {
  const _PoiImage({required this.id, required this.url, required this.source});
  factory _PoiImage.fromJson(Map<String, dynamic> json) => _$PoiImageFromJson(json);

@override final  String id;
@override final  String url;
@override final  String source;

/// Create a copy of PoiImage
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PoiImageCopyWith<_PoiImage> get copyWith => __$PoiImageCopyWithImpl<_PoiImage>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PoiImageToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PoiImage&&(identical(other.id, id) || other.id == id)&&(identical(other.url, url) || other.url == url)&&(identical(other.source, source) || other.source == source));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,url,source);

@override
String toString() {
  return 'PoiImage(id: $id, url: $url, source: $source)';
}


}

/// @nodoc
abstract mixin class _$PoiImageCopyWith<$Res> implements $PoiImageCopyWith<$Res> {
  factory _$PoiImageCopyWith(_PoiImage value, $Res Function(_PoiImage) _then) = __$PoiImageCopyWithImpl;
@override @useResult
$Res call({
 String id, String url, String source
});




}
/// @nodoc
class __$PoiImageCopyWithImpl<$Res>
    implements _$PoiImageCopyWith<$Res> {
  __$PoiImageCopyWithImpl(this._self, this._then);

  final _PoiImage _self;
  final $Res Function(_PoiImage) _then;

/// Create a copy of PoiImage
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? url = null,Object? source = null,}) {
  return _then(_PoiImage(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,url: null == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$ContactInfo {

 List<String>? get phone; List<String>? get email; List<String>? get website; String? get bookingUrl; String? get instagram; String? get facebook; String? get openingHoursRaw;
/// Create a copy of ContactInfo
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ContactInfoCopyWith<ContactInfo> get copyWith => _$ContactInfoCopyWithImpl<ContactInfo>(this as ContactInfo, _$identity);

  /// Serializes this ContactInfo to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ContactInfo&&const DeepCollectionEquality().equals(other.phone, phone)&&const DeepCollectionEquality().equals(other.email, email)&&const DeepCollectionEquality().equals(other.website, website)&&(identical(other.bookingUrl, bookingUrl) || other.bookingUrl == bookingUrl)&&(identical(other.instagram, instagram) || other.instagram == instagram)&&(identical(other.facebook, facebook) || other.facebook == facebook)&&(identical(other.openingHoursRaw, openingHoursRaw) || other.openingHoursRaw == openingHoursRaw));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(phone),const DeepCollectionEquality().hash(email),const DeepCollectionEquality().hash(website),bookingUrl,instagram,facebook,openingHoursRaw);

@override
String toString() {
  return 'ContactInfo(phone: $phone, email: $email, website: $website, bookingUrl: $bookingUrl, instagram: $instagram, facebook: $facebook, openingHoursRaw: $openingHoursRaw)';
}


}

/// @nodoc
abstract mixin class $ContactInfoCopyWith<$Res>  {
  factory $ContactInfoCopyWith(ContactInfo value, $Res Function(ContactInfo) _then) = _$ContactInfoCopyWithImpl;
@useResult
$Res call({
 List<String>? phone, List<String>? email, List<String>? website, String? bookingUrl, String? instagram, String? facebook, String? openingHoursRaw
});




}
/// @nodoc
class _$ContactInfoCopyWithImpl<$Res>
    implements $ContactInfoCopyWith<$Res> {
  _$ContactInfoCopyWithImpl(this._self, this._then);

  final ContactInfo _self;
  final $Res Function(ContactInfo) _then;

/// Create a copy of ContactInfo
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? phone = freezed,Object? email = freezed,Object? website = freezed,Object? bookingUrl = freezed,Object? instagram = freezed,Object? facebook = freezed,Object? openingHoursRaw = freezed,}) {
  return _then(_self.copyWith(
phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as List<String>?,email: freezed == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as List<String>?,website: freezed == website ? _self.website : website // ignore: cast_nullable_to_non_nullable
as List<String>?,bookingUrl: freezed == bookingUrl ? _self.bookingUrl : bookingUrl // ignore: cast_nullable_to_non_nullable
as String?,instagram: freezed == instagram ? _self.instagram : instagram // ignore: cast_nullable_to_non_nullable
as String?,facebook: freezed == facebook ? _self.facebook : facebook // ignore: cast_nullable_to_non_nullable
as String?,openingHoursRaw: freezed == openingHoursRaw ? _self.openingHoursRaw : openingHoursRaw // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _ContactInfo implements ContactInfo {
  const _ContactInfo({final  List<String>? phone, final  List<String>? email, final  List<String>? website, this.bookingUrl, this.instagram, this.facebook, this.openingHoursRaw}): _phone = phone,_email = email,_website = website;
  factory _ContactInfo.fromJson(Map<String, dynamic> json) => _$ContactInfoFromJson(json);

 final  List<String>? _phone;
@override List<String>? get phone {
  final value = _phone;
  if (value == null) return null;
  if (_phone is EqualUnmodifiableListView) return _phone;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

 final  List<String>? _email;
@override List<String>? get email {
  final value = _email;
  if (value == null) return null;
  if (_email is EqualUnmodifiableListView) return _email;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

 final  List<String>? _website;
@override List<String>? get website {
  final value = _website;
  if (value == null) return null;
  if (_website is EqualUnmodifiableListView) return _website;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override final  String? bookingUrl;
@override final  String? instagram;
@override final  String? facebook;
@override final  String? openingHoursRaw;

/// Create a copy of ContactInfo
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ContactInfoCopyWith<_ContactInfo> get copyWith => __$ContactInfoCopyWithImpl<_ContactInfo>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ContactInfoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ContactInfo&&const DeepCollectionEquality().equals(other._phone, _phone)&&const DeepCollectionEquality().equals(other._email, _email)&&const DeepCollectionEquality().equals(other._website, _website)&&(identical(other.bookingUrl, bookingUrl) || other.bookingUrl == bookingUrl)&&(identical(other.instagram, instagram) || other.instagram == instagram)&&(identical(other.facebook, facebook) || other.facebook == facebook)&&(identical(other.openingHoursRaw, openingHoursRaw) || other.openingHoursRaw == openingHoursRaw));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_phone),const DeepCollectionEquality().hash(_email),const DeepCollectionEquality().hash(_website),bookingUrl,instagram,facebook,openingHoursRaw);

@override
String toString() {
  return 'ContactInfo(phone: $phone, email: $email, website: $website, bookingUrl: $bookingUrl, instagram: $instagram, facebook: $facebook, openingHoursRaw: $openingHoursRaw)';
}


}

/// @nodoc
abstract mixin class _$ContactInfoCopyWith<$Res> implements $ContactInfoCopyWith<$Res> {
  factory _$ContactInfoCopyWith(_ContactInfo value, $Res Function(_ContactInfo) _then) = __$ContactInfoCopyWithImpl;
@override @useResult
$Res call({
 List<String>? phone, List<String>? email, List<String>? website, String? bookingUrl, String? instagram, String? facebook, String? openingHoursRaw
});




}
/// @nodoc
class __$ContactInfoCopyWithImpl<$Res>
    implements _$ContactInfoCopyWith<$Res> {
  __$ContactInfoCopyWithImpl(this._self, this._then);

  final _ContactInfo _self;
  final $Res Function(_ContactInfo) _then;

/// Create a copy of ContactInfo
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? phone = freezed,Object? email = freezed,Object? website = freezed,Object? bookingUrl = freezed,Object? instagram = freezed,Object? facebook = freezed,Object? openingHoursRaw = freezed,}) {
  return _then(_ContactInfo(
phone: freezed == phone ? _self._phone : phone // ignore: cast_nullable_to_non_nullable
as List<String>?,email: freezed == email ? _self._email : email // ignore: cast_nullable_to_non_nullable
as List<String>?,website: freezed == website ? _self._website : website // ignore: cast_nullable_to_non_nullable
as List<String>?,bookingUrl: freezed == bookingUrl ? _self.bookingUrl : bookingUrl // ignore: cast_nullable_to_non_nullable
as String?,instagram: freezed == instagram ? _self.instagram : instagram // ignore: cast_nullable_to_non_nullable
as String?,facebook: freezed == facebook ? _self.facebook : facebook // ignore: cast_nullable_to_non_nullable
as String?,openingHoursRaw: freezed == openingHoursRaw ? _self.openingHoursRaw : openingHoursRaw // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$NearbyPoi {

 String get id; int? get osmId; String get name; String? get categoryId; double get latitude; double get longitude; String? get address; String? get wikipediaUrl; String? get mapillaryId; double? get mapillaryBearing; bool? get mapillaryIsPano; Map<String, String>? get osmTags; DateTime? get createdAt; Category? get category; ContactInfo? get contact;
/// Create a copy of NearbyPoi
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$NearbyPoiCopyWith<NearbyPoi> get copyWith => _$NearbyPoiCopyWithImpl<NearbyPoi>(this as NearbyPoi, _$identity);

  /// Serializes this NearbyPoi to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is NearbyPoi&&(identical(other.id, id) || other.id == id)&&(identical(other.osmId, osmId) || other.osmId == osmId)&&(identical(other.name, name) || other.name == name)&&(identical(other.categoryId, categoryId) || other.categoryId == categoryId)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.address, address) || other.address == address)&&(identical(other.wikipediaUrl, wikipediaUrl) || other.wikipediaUrl == wikipediaUrl)&&(identical(other.mapillaryId, mapillaryId) || other.mapillaryId == mapillaryId)&&(identical(other.mapillaryBearing, mapillaryBearing) || other.mapillaryBearing == mapillaryBearing)&&(identical(other.mapillaryIsPano, mapillaryIsPano) || other.mapillaryIsPano == mapillaryIsPano)&&const DeepCollectionEquality().equals(other.osmTags, osmTags)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.category, category) || other.category == category)&&(identical(other.contact, contact) || other.contact == contact));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,osmId,name,categoryId,latitude,longitude,address,wikipediaUrl,mapillaryId,mapillaryBearing,mapillaryIsPano,const DeepCollectionEquality().hash(osmTags),createdAt,category,contact);

@override
String toString() {
  return 'NearbyPoi(id: $id, osmId: $osmId, name: $name, categoryId: $categoryId, latitude: $latitude, longitude: $longitude, address: $address, wikipediaUrl: $wikipediaUrl, mapillaryId: $mapillaryId, mapillaryBearing: $mapillaryBearing, mapillaryIsPano: $mapillaryIsPano, osmTags: $osmTags, createdAt: $createdAt, category: $category, contact: $contact)';
}


}

/// @nodoc
abstract mixin class $NearbyPoiCopyWith<$Res>  {
  factory $NearbyPoiCopyWith(NearbyPoi value, $Res Function(NearbyPoi) _then) = _$NearbyPoiCopyWithImpl;
@useResult
$Res call({
 String id, int? osmId, String name, String? categoryId, double latitude, double longitude, String? address, String? wikipediaUrl, String? mapillaryId, double? mapillaryBearing, bool? mapillaryIsPano, Map<String, String>? osmTags, DateTime? createdAt, Category? category, ContactInfo? contact
});


$CategoryCopyWith<$Res>? get category;$ContactInfoCopyWith<$Res>? get contact;

}
/// @nodoc
class _$NearbyPoiCopyWithImpl<$Res>
    implements $NearbyPoiCopyWith<$Res> {
  _$NearbyPoiCopyWithImpl(this._self, this._then);

  final NearbyPoi _self;
  final $Res Function(NearbyPoi) _then;

/// Create a copy of NearbyPoi
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? osmId = freezed,Object? name = null,Object? categoryId = freezed,Object? latitude = null,Object? longitude = null,Object? address = freezed,Object? wikipediaUrl = freezed,Object? mapillaryId = freezed,Object? mapillaryBearing = freezed,Object? mapillaryIsPano = freezed,Object? osmTags = freezed,Object? createdAt = freezed,Object? category = freezed,Object? contact = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,osmId: freezed == osmId ? _self.osmId : osmId // ignore: cast_nullable_to_non_nullable
as int?,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,categoryId: freezed == categoryId ? _self.categoryId : categoryId // ignore: cast_nullable_to_non_nullable
as String?,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,wikipediaUrl: freezed == wikipediaUrl ? _self.wikipediaUrl : wikipediaUrl // ignore: cast_nullable_to_non_nullable
as String?,mapillaryId: freezed == mapillaryId ? _self.mapillaryId : mapillaryId // ignore: cast_nullable_to_non_nullable
as String?,mapillaryBearing: freezed == mapillaryBearing ? _self.mapillaryBearing : mapillaryBearing // ignore: cast_nullable_to_non_nullable
as double?,mapillaryIsPano: freezed == mapillaryIsPano ? _self.mapillaryIsPano : mapillaryIsPano // ignore: cast_nullable_to_non_nullable
as bool?,osmTags: freezed == osmTags ? _self.osmTags : osmTags // ignore: cast_nullable_to_non_nullable
as Map<String, String>?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,category: freezed == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as Category?,contact: freezed == contact ? _self.contact : contact // ignore: cast_nullable_to_non_nullable
as ContactInfo?,
  ));
}
/// Create a copy of NearbyPoi
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
}/// Create a copy of NearbyPoi
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContactInfoCopyWith<$Res>? get contact {
    if (_self.contact == null) {
    return null;
  }

  return $ContactInfoCopyWith<$Res>(_self.contact!, (value) {
    return _then(_self.copyWith(contact: value));
  });
}
}


/// @nodoc
@JsonSerializable()

class _NearbyPoi implements NearbyPoi {
  const _NearbyPoi({required this.id, this.osmId, required this.name, this.categoryId, required this.latitude, required this.longitude, this.address, this.wikipediaUrl, this.mapillaryId, this.mapillaryBearing, this.mapillaryIsPano, final  Map<String, String>? osmTags, this.createdAt, this.category, this.contact}): _osmTags = osmTags;
  factory _NearbyPoi.fromJson(Map<String, dynamic> json) => _$NearbyPoiFromJson(json);

@override final  String id;
@override final  int? osmId;
@override final  String name;
@override final  String? categoryId;
@override final  double latitude;
@override final  double longitude;
@override final  String? address;
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
@override final  ContactInfo? contact;

/// Create a copy of NearbyPoi
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$NearbyPoiCopyWith<_NearbyPoi> get copyWith => __$NearbyPoiCopyWithImpl<_NearbyPoi>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$NearbyPoiToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _NearbyPoi&&(identical(other.id, id) || other.id == id)&&(identical(other.osmId, osmId) || other.osmId == osmId)&&(identical(other.name, name) || other.name == name)&&(identical(other.categoryId, categoryId) || other.categoryId == categoryId)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.address, address) || other.address == address)&&(identical(other.wikipediaUrl, wikipediaUrl) || other.wikipediaUrl == wikipediaUrl)&&(identical(other.mapillaryId, mapillaryId) || other.mapillaryId == mapillaryId)&&(identical(other.mapillaryBearing, mapillaryBearing) || other.mapillaryBearing == mapillaryBearing)&&(identical(other.mapillaryIsPano, mapillaryIsPano) || other.mapillaryIsPano == mapillaryIsPano)&&const DeepCollectionEquality().equals(other._osmTags, _osmTags)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.category, category) || other.category == category)&&(identical(other.contact, contact) || other.contact == contact));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,osmId,name,categoryId,latitude,longitude,address,wikipediaUrl,mapillaryId,mapillaryBearing,mapillaryIsPano,const DeepCollectionEquality().hash(_osmTags),createdAt,category,contact);

@override
String toString() {
  return 'NearbyPoi(id: $id, osmId: $osmId, name: $name, categoryId: $categoryId, latitude: $latitude, longitude: $longitude, address: $address, wikipediaUrl: $wikipediaUrl, mapillaryId: $mapillaryId, mapillaryBearing: $mapillaryBearing, mapillaryIsPano: $mapillaryIsPano, osmTags: $osmTags, createdAt: $createdAt, category: $category, contact: $contact)';
}


}

/// @nodoc
abstract mixin class _$NearbyPoiCopyWith<$Res> implements $NearbyPoiCopyWith<$Res> {
  factory _$NearbyPoiCopyWith(_NearbyPoi value, $Res Function(_NearbyPoi) _then) = __$NearbyPoiCopyWithImpl;
@override @useResult
$Res call({
 String id, int? osmId, String name, String? categoryId, double latitude, double longitude, String? address, String? wikipediaUrl, String? mapillaryId, double? mapillaryBearing, bool? mapillaryIsPano, Map<String, String>? osmTags, DateTime? createdAt, Category? category, ContactInfo? contact
});


@override $CategoryCopyWith<$Res>? get category;@override $ContactInfoCopyWith<$Res>? get contact;

}
/// @nodoc
class __$NearbyPoiCopyWithImpl<$Res>
    implements _$NearbyPoiCopyWith<$Res> {
  __$NearbyPoiCopyWithImpl(this._self, this._then);

  final _NearbyPoi _self;
  final $Res Function(_NearbyPoi) _then;

/// Create a copy of NearbyPoi
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? osmId = freezed,Object? name = null,Object? categoryId = freezed,Object? latitude = null,Object? longitude = null,Object? address = freezed,Object? wikipediaUrl = freezed,Object? mapillaryId = freezed,Object? mapillaryBearing = freezed,Object? mapillaryIsPano = freezed,Object? osmTags = freezed,Object? createdAt = freezed,Object? category = freezed,Object? contact = freezed,}) {
  return _then(_NearbyPoi(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,osmId: freezed == osmId ? _self.osmId : osmId // ignore: cast_nullable_to_non_nullable
as int?,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,categoryId: freezed == categoryId ? _self.categoryId : categoryId // ignore: cast_nullable_to_non_nullable
as String?,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,wikipediaUrl: freezed == wikipediaUrl ? _self.wikipediaUrl : wikipediaUrl // ignore: cast_nullable_to_non_nullable
as String?,mapillaryId: freezed == mapillaryId ? _self.mapillaryId : mapillaryId // ignore: cast_nullable_to_non_nullable
as String?,mapillaryBearing: freezed == mapillaryBearing ? _self.mapillaryBearing : mapillaryBearing // ignore: cast_nullable_to_non_nullable
as double?,mapillaryIsPano: freezed == mapillaryIsPano ? _self.mapillaryIsPano : mapillaryIsPano // ignore: cast_nullable_to_non_nullable
as bool?,osmTags: freezed == osmTags ? _self._osmTags : osmTags // ignore: cast_nullable_to_non_nullable
as Map<String, String>?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,category: freezed == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as Category?,contact: freezed == contact ? _self.contact : contact // ignore: cast_nullable_to_non_nullable
as ContactInfo?,
  ));
}

/// Create a copy of NearbyPoi
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
}/// Create a copy of NearbyPoi
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContactInfoCopyWith<$Res>? get contact {
    if (_self.contact == null) {
    return null;
  }

  return $ContactInfoCopyWith<$Res>(_self.contact!, (value) {
    return _then(_self.copyWith(contact: value));
  });
}
}


/// @nodoc
mixin _$ExternalPOI {

 String get id; int get osmId; String get osmType; String get name; String get category; double get latitude; double get longitude; double? get distance; String? get address; String? get openingHours; String? get phone; String? get website; String? get cuisine; bool? get hasWifi; bool? get hasOutdoorSeating; List<PoiImage>? get images; String? get mapillaryId; double? get mapillaryBearing; bool? get mapillaryIsPano; String? get wikipediaUrl; Map<String, String>? get extraTags; String get source;
/// Create a copy of ExternalPOI
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ExternalPOICopyWith<ExternalPOI> get copyWith => _$ExternalPOICopyWithImpl<ExternalPOI>(this as ExternalPOI, _$identity);

  /// Serializes this ExternalPOI to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ExternalPOI&&(identical(other.id, id) || other.id == id)&&(identical(other.osmId, osmId) || other.osmId == osmId)&&(identical(other.osmType, osmType) || other.osmType == osmType)&&(identical(other.name, name) || other.name == name)&&(identical(other.category, category) || other.category == category)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.distance, distance) || other.distance == distance)&&(identical(other.address, address) || other.address == address)&&(identical(other.openingHours, openingHours) || other.openingHours == openingHours)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.website, website) || other.website == website)&&(identical(other.cuisine, cuisine) || other.cuisine == cuisine)&&(identical(other.hasWifi, hasWifi) || other.hasWifi == hasWifi)&&(identical(other.hasOutdoorSeating, hasOutdoorSeating) || other.hasOutdoorSeating == hasOutdoorSeating)&&const DeepCollectionEquality().equals(other.images, images)&&(identical(other.mapillaryId, mapillaryId) || other.mapillaryId == mapillaryId)&&(identical(other.mapillaryBearing, mapillaryBearing) || other.mapillaryBearing == mapillaryBearing)&&(identical(other.mapillaryIsPano, mapillaryIsPano) || other.mapillaryIsPano == mapillaryIsPano)&&(identical(other.wikipediaUrl, wikipediaUrl) || other.wikipediaUrl == wikipediaUrl)&&const DeepCollectionEquality().equals(other.extraTags, extraTags)&&(identical(other.source, source) || other.source == source));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,osmId,osmType,name,category,latitude,longitude,distance,address,openingHours,phone,website,cuisine,hasWifi,hasOutdoorSeating,const DeepCollectionEquality().hash(images),mapillaryId,mapillaryBearing,mapillaryIsPano,wikipediaUrl,const DeepCollectionEquality().hash(extraTags),source]);

@override
String toString() {
  return 'ExternalPOI(id: $id, osmId: $osmId, osmType: $osmType, name: $name, category: $category, latitude: $latitude, longitude: $longitude, distance: $distance, address: $address, openingHours: $openingHours, phone: $phone, website: $website, cuisine: $cuisine, hasWifi: $hasWifi, hasOutdoorSeating: $hasOutdoorSeating, images: $images, mapillaryId: $mapillaryId, mapillaryBearing: $mapillaryBearing, mapillaryIsPano: $mapillaryIsPano, wikipediaUrl: $wikipediaUrl, extraTags: $extraTags, source: $source)';
}


}

/// @nodoc
abstract mixin class $ExternalPOICopyWith<$Res>  {
  factory $ExternalPOICopyWith(ExternalPOI value, $Res Function(ExternalPOI) _then) = _$ExternalPOICopyWithImpl;
@useResult
$Res call({
 String id, int osmId, String osmType, String name, String category, double latitude, double longitude, double? distance, String? address, String? openingHours, String? phone, String? website, String? cuisine, bool? hasWifi, bool? hasOutdoorSeating, List<PoiImage>? images, String? mapillaryId, double? mapillaryBearing, bool? mapillaryIsPano, String? wikipediaUrl, Map<String, String>? extraTags, String source
});




}
/// @nodoc
class _$ExternalPOICopyWithImpl<$Res>
    implements $ExternalPOICopyWith<$Res> {
  _$ExternalPOICopyWithImpl(this._self, this._then);

  final ExternalPOI _self;
  final $Res Function(ExternalPOI) _then;

/// Create a copy of ExternalPOI
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? osmId = null,Object? osmType = null,Object? name = null,Object? category = null,Object? latitude = null,Object? longitude = null,Object? distance = freezed,Object? address = freezed,Object? openingHours = freezed,Object? phone = freezed,Object? website = freezed,Object? cuisine = freezed,Object? hasWifi = freezed,Object? hasOutdoorSeating = freezed,Object? images = freezed,Object? mapillaryId = freezed,Object? mapillaryBearing = freezed,Object? mapillaryIsPano = freezed,Object? wikipediaUrl = freezed,Object? extraTags = freezed,Object? source = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,osmId: null == osmId ? _self.osmId : osmId // ignore: cast_nullable_to_non_nullable
as int,osmType: null == osmType ? _self.osmType : osmType // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double,distance: freezed == distance ? _self.distance : distance // ignore: cast_nullable_to_non_nullable
as double?,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,openingHours: freezed == openingHours ? _self.openingHours : openingHours // ignore: cast_nullable_to_non_nullable
as String?,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,website: freezed == website ? _self.website : website // ignore: cast_nullable_to_non_nullable
as String?,cuisine: freezed == cuisine ? _self.cuisine : cuisine // ignore: cast_nullable_to_non_nullable
as String?,hasWifi: freezed == hasWifi ? _self.hasWifi : hasWifi // ignore: cast_nullable_to_non_nullable
as bool?,hasOutdoorSeating: freezed == hasOutdoorSeating ? _self.hasOutdoorSeating : hasOutdoorSeating // ignore: cast_nullable_to_non_nullable
as bool?,images: freezed == images ? _self.images : images // ignore: cast_nullable_to_non_nullable
as List<PoiImage>?,mapillaryId: freezed == mapillaryId ? _self.mapillaryId : mapillaryId // ignore: cast_nullable_to_non_nullable
as String?,mapillaryBearing: freezed == mapillaryBearing ? _self.mapillaryBearing : mapillaryBearing // ignore: cast_nullable_to_non_nullable
as double?,mapillaryIsPano: freezed == mapillaryIsPano ? _self.mapillaryIsPano : mapillaryIsPano // ignore: cast_nullable_to_non_nullable
as bool?,wikipediaUrl: freezed == wikipediaUrl ? _self.wikipediaUrl : wikipediaUrl // ignore: cast_nullable_to_non_nullable
as String?,extraTags: freezed == extraTags ? _self.extraTags : extraTags // ignore: cast_nullable_to_non_nullable
as Map<String, String>?,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _ExternalPOI implements ExternalPOI {
  const _ExternalPOI({required this.id, required this.osmId, required this.osmType, required this.name, required this.category, required this.latitude, required this.longitude, this.distance, this.address, this.openingHours, this.phone, this.website, this.cuisine, this.hasWifi, this.hasOutdoorSeating, final  List<PoiImage>? images, this.mapillaryId, this.mapillaryBearing, this.mapillaryIsPano, this.wikipediaUrl, final  Map<String, String>? extraTags, required this.source}): _images = images,_extraTags = extraTags;
  factory _ExternalPOI.fromJson(Map<String, dynamic> json) => _$ExternalPOIFromJson(json);

@override final  String id;
@override final  int osmId;
@override final  String osmType;
@override final  String name;
@override final  String category;
@override final  double latitude;
@override final  double longitude;
@override final  double? distance;
@override final  String? address;
@override final  String? openingHours;
@override final  String? phone;
@override final  String? website;
@override final  String? cuisine;
@override final  bool? hasWifi;
@override final  bool? hasOutdoorSeating;
 final  List<PoiImage>? _images;
@override List<PoiImage>? get images {
  final value = _images;
  if (value == null) return null;
  if (_images is EqualUnmodifiableListView) return _images;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override final  String? mapillaryId;
@override final  double? mapillaryBearing;
@override final  bool? mapillaryIsPano;
@override final  String? wikipediaUrl;
 final  Map<String, String>? _extraTags;
@override Map<String, String>? get extraTags {
  final value = _extraTags;
  if (value == null) return null;
  if (_extraTags is EqualUnmodifiableMapView) return _extraTags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

@override final  String source;

/// Create a copy of ExternalPOI
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ExternalPOICopyWith<_ExternalPOI> get copyWith => __$ExternalPOICopyWithImpl<_ExternalPOI>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ExternalPOIToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ExternalPOI&&(identical(other.id, id) || other.id == id)&&(identical(other.osmId, osmId) || other.osmId == osmId)&&(identical(other.osmType, osmType) || other.osmType == osmType)&&(identical(other.name, name) || other.name == name)&&(identical(other.category, category) || other.category == category)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.distance, distance) || other.distance == distance)&&(identical(other.address, address) || other.address == address)&&(identical(other.openingHours, openingHours) || other.openingHours == openingHours)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.website, website) || other.website == website)&&(identical(other.cuisine, cuisine) || other.cuisine == cuisine)&&(identical(other.hasWifi, hasWifi) || other.hasWifi == hasWifi)&&(identical(other.hasOutdoorSeating, hasOutdoorSeating) || other.hasOutdoorSeating == hasOutdoorSeating)&&const DeepCollectionEquality().equals(other._images, _images)&&(identical(other.mapillaryId, mapillaryId) || other.mapillaryId == mapillaryId)&&(identical(other.mapillaryBearing, mapillaryBearing) || other.mapillaryBearing == mapillaryBearing)&&(identical(other.mapillaryIsPano, mapillaryIsPano) || other.mapillaryIsPano == mapillaryIsPano)&&(identical(other.wikipediaUrl, wikipediaUrl) || other.wikipediaUrl == wikipediaUrl)&&const DeepCollectionEquality().equals(other._extraTags, _extraTags)&&(identical(other.source, source) || other.source == source));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,osmId,osmType,name,category,latitude,longitude,distance,address,openingHours,phone,website,cuisine,hasWifi,hasOutdoorSeating,const DeepCollectionEquality().hash(_images),mapillaryId,mapillaryBearing,mapillaryIsPano,wikipediaUrl,const DeepCollectionEquality().hash(_extraTags),source]);

@override
String toString() {
  return 'ExternalPOI(id: $id, osmId: $osmId, osmType: $osmType, name: $name, category: $category, latitude: $latitude, longitude: $longitude, distance: $distance, address: $address, openingHours: $openingHours, phone: $phone, website: $website, cuisine: $cuisine, hasWifi: $hasWifi, hasOutdoorSeating: $hasOutdoorSeating, images: $images, mapillaryId: $mapillaryId, mapillaryBearing: $mapillaryBearing, mapillaryIsPano: $mapillaryIsPano, wikipediaUrl: $wikipediaUrl, extraTags: $extraTags, source: $source)';
}


}

/// @nodoc
abstract mixin class _$ExternalPOICopyWith<$Res> implements $ExternalPOICopyWith<$Res> {
  factory _$ExternalPOICopyWith(_ExternalPOI value, $Res Function(_ExternalPOI) _then) = __$ExternalPOICopyWithImpl;
@override @useResult
$Res call({
 String id, int osmId, String osmType, String name, String category, double latitude, double longitude, double? distance, String? address, String? openingHours, String? phone, String? website, String? cuisine, bool? hasWifi, bool? hasOutdoorSeating, List<PoiImage>? images, String? mapillaryId, double? mapillaryBearing, bool? mapillaryIsPano, String? wikipediaUrl, Map<String, String>? extraTags, String source
});




}
/// @nodoc
class __$ExternalPOICopyWithImpl<$Res>
    implements _$ExternalPOICopyWith<$Res> {
  __$ExternalPOICopyWithImpl(this._self, this._then);

  final _ExternalPOI _self;
  final $Res Function(_ExternalPOI) _then;

/// Create a copy of ExternalPOI
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? osmId = null,Object? osmType = null,Object? name = null,Object? category = null,Object? latitude = null,Object? longitude = null,Object? distance = freezed,Object? address = freezed,Object? openingHours = freezed,Object? phone = freezed,Object? website = freezed,Object? cuisine = freezed,Object? hasWifi = freezed,Object? hasOutdoorSeating = freezed,Object? images = freezed,Object? mapillaryId = freezed,Object? mapillaryBearing = freezed,Object? mapillaryIsPano = freezed,Object? wikipediaUrl = freezed,Object? extraTags = freezed,Object? source = null,}) {
  return _then(_ExternalPOI(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,osmId: null == osmId ? _self.osmId : osmId // ignore: cast_nullable_to_non_nullable
as int,osmType: null == osmType ? _self.osmType : osmType // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double,distance: freezed == distance ? _self.distance : distance // ignore: cast_nullable_to_non_nullable
as double?,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,openingHours: freezed == openingHours ? _self.openingHours : openingHours // ignore: cast_nullable_to_non_nullable
as String?,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,website: freezed == website ? _self.website : website // ignore: cast_nullable_to_non_nullable
as String?,cuisine: freezed == cuisine ? _self.cuisine : cuisine // ignore: cast_nullable_to_non_nullable
as String?,hasWifi: freezed == hasWifi ? _self.hasWifi : hasWifi // ignore: cast_nullable_to_non_nullable
as bool?,hasOutdoorSeating: freezed == hasOutdoorSeating ? _self.hasOutdoorSeating : hasOutdoorSeating // ignore: cast_nullable_to_non_nullable
as bool?,images: freezed == images ? _self._images : images // ignore: cast_nullable_to_non_nullable
as List<PoiImage>?,mapillaryId: freezed == mapillaryId ? _self.mapillaryId : mapillaryId // ignore: cast_nullable_to_non_nullable
as String?,mapillaryBearing: freezed == mapillaryBearing ? _self.mapillaryBearing : mapillaryBearing // ignore: cast_nullable_to_non_nullable
as double?,mapillaryIsPano: freezed == mapillaryIsPano ? _self.mapillaryIsPano : mapillaryIsPano // ignore: cast_nullable_to_non_nullable
as bool?,wikipediaUrl: freezed == wikipediaUrl ? _self.wikipediaUrl : wikipediaUrl // ignore: cast_nullable_to_non_nullable
as String?,extraTags: freezed == extraTags ? _self._extraTags : extraTags // ignore: cast_nullable_to_non_nullable
as Map<String, String>?,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$NearbyPoisResponse {

 List<NearbyPoi> get pois; int get total;
/// Create a copy of NearbyPoisResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$NearbyPoisResponseCopyWith<NearbyPoisResponse> get copyWith => _$NearbyPoisResponseCopyWithImpl<NearbyPoisResponse>(this as NearbyPoisResponse, _$identity);

  /// Serializes this NearbyPoisResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is NearbyPoisResponse&&const DeepCollectionEquality().equals(other.pois, pois)&&(identical(other.total, total) || other.total == total));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(pois),total);

@override
String toString() {
  return 'NearbyPoisResponse(pois: $pois, total: $total)';
}


}

/// @nodoc
abstract mixin class $NearbyPoisResponseCopyWith<$Res>  {
  factory $NearbyPoisResponseCopyWith(NearbyPoisResponse value, $Res Function(NearbyPoisResponse) _then) = _$NearbyPoisResponseCopyWithImpl;
@useResult
$Res call({
 List<NearbyPoi> pois, int total
});




}
/// @nodoc
class _$NearbyPoisResponseCopyWithImpl<$Res>
    implements $NearbyPoisResponseCopyWith<$Res> {
  _$NearbyPoisResponseCopyWithImpl(this._self, this._then);

  final NearbyPoisResponse _self;
  final $Res Function(NearbyPoisResponse) _then;

/// Create a copy of NearbyPoisResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? pois = null,Object? total = null,}) {
  return _then(_self.copyWith(
pois: null == pois ? _self.pois : pois // ignore: cast_nullable_to_non_nullable
as List<NearbyPoi>,total: null == total ? _self.total : total // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _NearbyPoisResponse implements NearbyPoisResponse {
  const _NearbyPoisResponse({required final  List<NearbyPoi> pois, required this.total}): _pois = pois;
  factory _NearbyPoisResponse.fromJson(Map<String, dynamic> json) => _$NearbyPoisResponseFromJson(json);

 final  List<NearbyPoi> _pois;
@override List<NearbyPoi> get pois {
  if (_pois is EqualUnmodifiableListView) return _pois;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_pois);
}

@override final  int total;

/// Create a copy of NearbyPoisResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$NearbyPoisResponseCopyWith<_NearbyPoisResponse> get copyWith => __$NearbyPoisResponseCopyWithImpl<_NearbyPoisResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$NearbyPoisResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _NearbyPoisResponse&&const DeepCollectionEquality().equals(other._pois, _pois)&&(identical(other.total, total) || other.total == total));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_pois),total);

@override
String toString() {
  return 'NearbyPoisResponse(pois: $pois, total: $total)';
}


}

/// @nodoc
abstract mixin class _$NearbyPoisResponseCopyWith<$Res> implements $NearbyPoisResponseCopyWith<$Res> {
  factory _$NearbyPoisResponseCopyWith(_NearbyPoisResponse value, $Res Function(_NearbyPoisResponse) _then) = __$NearbyPoisResponseCopyWithImpl;
@override @useResult
$Res call({
 List<NearbyPoi> pois, int total
});




}
/// @nodoc
class __$NearbyPoisResponseCopyWithImpl<$Res>
    implements _$NearbyPoisResponseCopyWith<$Res> {
  __$NearbyPoisResponseCopyWithImpl(this._self, this._then);

  final _NearbyPoisResponse _self;
  final $Res Function(_NearbyPoisResponse) _then;

/// Create a copy of NearbyPoisResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? pois = null,Object? total = null,}) {
  return _then(_NearbyPoisResponse(
pois: null == pois ? _self._pois : pois // ignore: cast_nullable_to_non_nullable
as List<NearbyPoi>,total: null == total ? _self.total : total // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$PoiLookupResponse {

 ExternalPOI get poi; RemarkWithPoi? get remark; String get source;
/// Create a copy of PoiLookupResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PoiLookupResponseCopyWith<PoiLookupResponse> get copyWith => _$PoiLookupResponseCopyWithImpl<PoiLookupResponse>(this as PoiLookupResponse, _$identity);

  /// Serializes this PoiLookupResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PoiLookupResponse&&(identical(other.poi, poi) || other.poi == poi)&&(identical(other.remark, remark) || other.remark == remark)&&(identical(other.source, source) || other.source == source));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,poi,remark,source);

@override
String toString() {
  return 'PoiLookupResponse(poi: $poi, remark: $remark, source: $source)';
}


}

/// @nodoc
abstract mixin class $PoiLookupResponseCopyWith<$Res>  {
  factory $PoiLookupResponseCopyWith(PoiLookupResponse value, $Res Function(PoiLookupResponse) _then) = _$PoiLookupResponseCopyWithImpl;
@useResult
$Res call({
 ExternalPOI poi, RemarkWithPoi? remark, String source
});


$ExternalPOICopyWith<$Res> get poi;$RemarkWithPoiCopyWith<$Res>? get remark;

}
/// @nodoc
class _$PoiLookupResponseCopyWithImpl<$Res>
    implements $PoiLookupResponseCopyWith<$Res> {
  _$PoiLookupResponseCopyWithImpl(this._self, this._then);

  final PoiLookupResponse _self;
  final $Res Function(PoiLookupResponse) _then;

/// Create a copy of PoiLookupResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? poi = null,Object? remark = freezed,Object? source = null,}) {
  return _then(_self.copyWith(
poi: null == poi ? _self.poi : poi // ignore: cast_nullable_to_non_nullable
as ExternalPOI,remark: freezed == remark ? _self.remark : remark // ignore: cast_nullable_to_non_nullable
as RemarkWithPoi?,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,
  ));
}
/// Create a copy of PoiLookupResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ExternalPOICopyWith<$Res> get poi {
  
  return $ExternalPOICopyWith<$Res>(_self.poi, (value) {
    return _then(_self.copyWith(poi: value));
  });
}/// Create a copy of PoiLookupResponse
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

class _PoiLookupResponse implements PoiLookupResponse {
  const _PoiLookupResponse({required this.poi, this.remark, required this.source});
  factory _PoiLookupResponse.fromJson(Map<String, dynamic> json) => _$PoiLookupResponseFromJson(json);

@override final  ExternalPOI poi;
@override final  RemarkWithPoi? remark;
@override final  String source;

/// Create a copy of PoiLookupResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PoiLookupResponseCopyWith<_PoiLookupResponse> get copyWith => __$PoiLookupResponseCopyWithImpl<_PoiLookupResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PoiLookupResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PoiLookupResponse&&(identical(other.poi, poi) || other.poi == poi)&&(identical(other.remark, remark) || other.remark == remark)&&(identical(other.source, source) || other.source == source));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,poi,remark,source);

@override
String toString() {
  return 'PoiLookupResponse(poi: $poi, remark: $remark, source: $source)';
}


}

/// @nodoc
abstract mixin class _$PoiLookupResponseCopyWith<$Res> implements $PoiLookupResponseCopyWith<$Res> {
  factory _$PoiLookupResponseCopyWith(_PoiLookupResponse value, $Res Function(_PoiLookupResponse) _then) = __$PoiLookupResponseCopyWithImpl;
@override @useResult
$Res call({
 ExternalPOI poi, RemarkWithPoi? remark, String source
});


@override $ExternalPOICopyWith<$Res> get poi;@override $RemarkWithPoiCopyWith<$Res>? get remark;

}
/// @nodoc
class __$PoiLookupResponseCopyWithImpl<$Res>
    implements _$PoiLookupResponseCopyWith<$Res> {
  __$PoiLookupResponseCopyWithImpl(this._self, this._then);

  final _PoiLookupResponse _self;
  final $Res Function(_PoiLookupResponse) _then;

/// Create a copy of PoiLookupResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? poi = null,Object? remark = freezed,Object? source = null,}) {
  return _then(_PoiLookupResponse(
poi: null == poi ? _self.poi : poi // ignore: cast_nullable_to_non_nullable
as ExternalPOI,remark: freezed == remark ? _self.remark : remark // ignore: cast_nullable_to_non_nullable
as RemarkWithPoi?,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

/// Create a copy of PoiLookupResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ExternalPOICopyWith<$Res> get poi {
  
  return $ExternalPOICopyWith<$Res>(_self.poi, (value) {
    return _then(_self.copyWith(poi: value));
  });
}/// Create a copy of PoiLookupResponse
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
mixin _$EnrichMediaResponse {

 String? get mapillaryId; double? get mapillaryBearing; bool? get mapillaryIsPano; List<PoiImage> get images;
/// Create a copy of EnrichMediaResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EnrichMediaResponseCopyWith<EnrichMediaResponse> get copyWith => _$EnrichMediaResponseCopyWithImpl<EnrichMediaResponse>(this as EnrichMediaResponse, _$identity);

  /// Serializes this EnrichMediaResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EnrichMediaResponse&&(identical(other.mapillaryId, mapillaryId) || other.mapillaryId == mapillaryId)&&(identical(other.mapillaryBearing, mapillaryBearing) || other.mapillaryBearing == mapillaryBearing)&&(identical(other.mapillaryIsPano, mapillaryIsPano) || other.mapillaryIsPano == mapillaryIsPano)&&const DeepCollectionEquality().equals(other.images, images));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,mapillaryId,mapillaryBearing,mapillaryIsPano,const DeepCollectionEquality().hash(images));

@override
String toString() {
  return 'EnrichMediaResponse(mapillaryId: $mapillaryId, mapillaryBearing: $mapillaryBearing, mapillaryIsPano: $mapillaryIsPano, images: $images)';
}


}

/// @nodoc
abstract mixin class $EnrichMediaResponseCopyWith<$Res>  {
  factory $EnrichMediaResponseCopyWith(EnrichMediaResponse value, $Res Function(EnrichMediaResponse) _then) = _$EnrichMediaResponseCopyWithImpl;
@useResult
$Res call({
 String? mapillaryId, double? mapillaryBearing, bool? mapillaryIsPano, List<PoiImage> images
});




}
/// @nodoc
class _$EnrichMediaResponseCopyWithImpl<$Res>
    implements $EnrichMediaResponseCopyWith<$Res> {
  _$EnrichMediaResponseCopyWithImpl(this._self, this._then);

  final EnrichMediaResponse _self;
  final $Res Function(EnrichMediaResponse) _then;

/// Create a copy of EnrichMediaResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? mapillaryId = freezed,Object? mapillaryBearing = freezed,Object? mapillaryIsPano = freezed,Object? images = null,}) {
  return _then(_self.copyWith(
mapillaryId: freezed == mapillaryId ? _self.mapillaryId : mapillaryId // ignore: cast_nullable_to_non_nullable
as String?,mapillaryBearing: freezed == mapillaryBearing ? _self.mapillaryBearing : mapillaryBearing // ignore: cast_nullable_to_non_nullable
as double?,mapillaryIsPano: freezed == mapillaryIsPano ? _self.mapillaryIsPano : mapillaryIsPano // ignore: cast_nullable_to_non_nullable
as bool?,images: null == images ? _self.images : images // ignore: cast_nullable_to_non_nullable
as List<PoiImage>,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _EnrichMediaResponse implements EnrichMediaResponse {
  const _EnrichMediaResponse({this.mapillaryId, this.mapillaryBearing, this.mapillaryIsPano, required final  List<PoiImage> images}): _images = images;
  factory _EnrichMediaResponse.fromJson(Map<String, dynamic> json) => _$EnrichMediaResponseFromJson(json);

@override final  String? mapillaryId;
@override final  double? mapillaryBearing;
@override final  bool? mapillaryIsPano;
 final  List<PoiImage> _images;
@override List<PoiImage> get images {
  if (_images is EqualUnmodifiableListView) return _images;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_images);
}


/// Create a copy of EnrichMediaResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EnrichMediaResponseCopyWith<_EnrichMediaResponse> get copyWith => __$EnrichMediaResponseCopyWithImpl<_EnrichMediaResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EnrichMediaResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EnrichMediaResponse&&(identical(other.mapillaryId, mapillaryId) || other.mapillaryId == mapillaryId)&&(identical(other.mapillaryBearing, mapillaryBearing) || other.mapillaryBearing == mapillaryBearing)&&(identical(other.mapillaryIsPano, mapillaryIsPano) || other.mapillaryIsPano == mapillaryIsPano)&&const DeepCollectionEquality().equals(other._images, _images));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,mapillaryId,mapillaryBearing,mapillaryIsPano,const DeepCollectionEquality().hash(_images));

@override
String toString() {
  return 'EnrichMediaResponse(mapillaryId: $mapillaryId, mapillaryBearing: $mapillaryBearing, mapillaryIsPano: $mapillaryIsPano, images: $images)';
}


}

/// @nodoc
abstract mixin class _$EnrichMediaResponseCopyWith<$Res> implements $EnrichMediaResponseCopyWith<$Res> {
  factory _$EnrichMediaResponseCopyWith(_EnrichMediaResponse value, $Res Function(_EnrichMediaResponse) _then) = __$EnrichMediaResponseCopyWithImpl;
@override @useResult
$Res call({
 String? mapillaryId, double? mapillaryBearing, bool? mapillaryIsPano, List<PoiImage> images
});




}
/// @nodoc
class __$EnrichMediaResponseCopyWithImpl<$Res>
    implements _$EnrichMediaResponseCopyWith<$Res> {
  __$EnrichMediaResponseCopyWithImpl(this._self, this._then);

  final _EnrichMediaResponse _self;
  final $Res Function(_EnrichMediaResponse) _then;

/// Create a copy of EnrichMediaResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? mapillaryId = freezed,Object? mapillaryBearing = freezed,Object? mapillaryIsPano = freezed,Object? images = null,}) {
  return _then(_EnrichMediaResponse(
mapillaryId: freezed == mapillaryId ? _self.mapillaryId : mapillaryId // ignore: cast_nullable_to_non_nullable
as String?,mapillaryBearing: freezed == mapillaryBearing ? _self.mapillaryBearing : mapillaryBearing // ignore: cast_nullable_to_non_nullable
as double?,mapillaryIsPano: freezed == mapillaryIsPano ? _self.mapillaryIsPano : mapillaryIsPano // ignore: cast_nullable_to_non_nullable
as bool?,images: null == images ? _self._images : images // ignore: cast_nullable_to_non_nullable
as List<PoiImage>,
  ));
}


}

// dart format on
