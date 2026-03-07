import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../core/api/api_provider.dart';
import '../../core/api/models/search.dart';
import '../../core/location/location_provider.dart';

part 'search_providers.g.dart';

/// The current search query text, shared between search bar and autocomplete.
@riverpod
class SearchQuery extends _$SearchQuery {
  @override
  String build() => '';

  /// Updates the query.
  void set(String q) => state = q;
}

/// Debounced autocomplete suggestions based on [searchQueryProvider].
///
/// Waits 300ms after query changes before fetching. Returns empty for
/// queries shorter than 2 characters.
@riverpod
Future<List<Suggestion>> autocompleteSuggestions(
  AutocompleteSuggestionsRef ref,
) async {
  final q = ref.watch(searchQueryProvider);
  if (q.length < 2) return [];

  await Future<void>.delayed(const Duration(milliseconds: 300));

  final api = ref.watch(obeliskApiProvider);
  final pos = await ref.watch(geolocationProvider.future);
  final resp = await api.autocomplete(
    q: q,
    lat: pos?.latitude,
    lon: pos?.longitude,
  );
  return resp.suggestions;
}

/// Holds search results from a full query submission.
@riverpod
class SearchResults extends _$SearchResults {
  @override
  AsyncValue<List<SearchResult>> build() => const AsyncData([]);

  /// Executes a full search for [query].
  Future<void> search(String query) async {
    state = const AsyncLoading();
    try {
      final api = ref.read(obeliskApiProvider);
      final pos = await ref.read(geolocationProvider.future);
      final resp = await api.search(
        query: query,
        latitude: pos?.latitude ?? 48.137154,
        longitude: pos?.longitude ?? 11.576124,
      );
      state = AsyncData(resp.results);
    } on Exception catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}
