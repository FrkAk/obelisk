// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'api_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$dioHash() => r'3152fa27b01ec9b3d11787b25db43d1a1aefd152';

/// Singleton [Dio] instance with timeouts and error mapping.
///
/// Copied from [dio].
@ProviderFor(dio)
final dioProvider = Provider<Dio>.internal(
  dio,
  name: r'dioProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$dioHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef DioRef = ProviderRef<Dio>;
String _$obeliskApiHash() => r'ae5c09cb1c2e79059bcf74e9ecc34a4d69f90c26';

/// Singleton [ObeliskApi] wrapping the shared [Dio] client.
///
/// Copied from [obeliskApi].
@ProviderFor(obeliskApi)
final obeliskApiProvider = Provider<ObeliskApi>.internal(
  obeliskApi,
  name: r'obeliskApiProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$obeliskApiHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef ObeliskApiRef = ProviderRef<ObeliskApi>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
