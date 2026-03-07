// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$autocompleteSuggestionsHash() =>
    r'6109cb8803463327bf973f7b7a9cd55f4613d5b1';

/// Debounced autocomplete suggestions based on [searchQueryProvider].
///
/// Waits 300ms after query changes before fetching. Returns empty for
/// queries shorter than 2 characters.
///
/// Copied from [autocompleteSuggestions].
@ProviderFor(autocompleteSuggestions)
final autocompleteSuggestionsProvider =
    AutoDisposeFutureProvider<List<Suggestion>>.internal(
      autocompleteSuggestions,
      name: r'autocompleteSuggestionsProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$autocompleteSuggestionsHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef AutocompleteSuggestionsRef =
    AutoDisposeFutureProviderRef<List<Suggestion>>;
String _$searchQueryHash() => r'75b81792dd41a5682b782c6d689b882be21e5f73';

/// The current search query text, shared between search bar and autocomplete.
///
/// Copied from [SearchQuery].
@ProviderFor(SearchQuery)
final searchQueryProvider =
    AutoDisposeNotifierProvider<SearchQuery, String>.internal(
      SearchQuery.new,
      name: r'searchQueryProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$searchQueryHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$SearchQuery = AutoDisposeNotifier<String>;
String _$searchResultsHash() => r'922a261d50e4051cae3e816475af642d4caf4dad';

/// Holds search results from a full query submission.
///
/// Copied from [SearchResults].
@ProviderFor(SearchResults)
final searchResultsProvider =
    AutoDisposeNotifierProvider<
      SearchResults,
      AsyncValue<List<SearchResult>>
    >.internal(
      SearchResults.new,
      name: r'searchResultsProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$searchResultsHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$SearchResults = AutoDisposeNotifier<AsyncValue<List<SearchResult>>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
