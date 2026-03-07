// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'map_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$mapControllerHash() => r'366ba4da7f688cd4bd7541cbf707de225ecbede6';

/// Holds the renderer-agnostic camera controller instance.
///
/// Copied from [MapController].
@ProviderFor(MapController)
final mapControllerProvider =
    NotifierProvider<MapController, MapCameraController?>.internal(
      MapController.new,
      name: r'mapControllerProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$mapControllerHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$MapController = Notifier<MapCameraController?>;
String _$is3DModeHash() => r'9167f96aa834e6bdcde7689b0e82cb057feabef0';

/// Tracks whether the map is in 3D (pitched) mode.
///
/// Copied from [Is3DMode].
@ProviderFor(Is3DMode)
final is3DModeProvider = NotifierProvider<Is3DMode, bool>.internal(
  Is3DMode.new,
  name: r'is3DModeProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$is3DModeHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$Is3DMode = Notifier<bool>;
String _$mapBearingHash() => r'56f8c382be723e9bc3416110d7df6b0f3f48d031';

/// Tracks the current map camera bearing in degrees.
///
/// Copied from [MapBearing].
@ProviderFor(MapBearing)
final mapBearingProvider = NotifierProvider<MapBearing, double>.internal(
  MapBearing.new,
  name: r'mapBearingProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$mapBearingHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$MapBearing = Notifier<double>;
String _$locateModeNotifierHash() =>
    r'1513956addaa351603c8d061b5631e0128cc017a';

/// Tracks the locate button state machine.
///
/// Copied from [LocateModeNotifier].
@ProviderFor(LocateModeNotifier)
final locateModeNotifierProvider =
    NotifierProvider<LocateModeNotifier, LocateMode>.internal(
      LocateModeNotifier.new,
      name: r'locateModeNotifierProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$locateModeNotifierHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$LocateModeNotifier = Notifier<LocateMode>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
