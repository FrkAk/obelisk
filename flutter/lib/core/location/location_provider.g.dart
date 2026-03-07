// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'location_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$geolocationHash() => r'537665953d008d9d67821b747d16dc6094183b4e';

/// Provides the user's current GPS position.
///
/// Checks location services and permissions, requesting when-in-use access
/// if not yet granted. Returns `null` if location is unavailable or denied.
///
/// Copied from [geolocation].
@ProviderFor(geolocation)
final geolocationProvider = FutureProvider<Position?>.internal(
  geolocation,
  name: r'geolocationProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$geolocationHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef GeolocationRef = FutureProviderRef<Position?>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
