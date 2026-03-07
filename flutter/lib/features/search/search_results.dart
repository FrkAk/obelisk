import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/models/search.dart';
import '../../core/theme/category_colors.dart';
import '../../core/theme/glass.dart';
import '../../core/theme/obelisk_theme.dart';
import 'search_providers.dart';

/// Displays full search results with loading skeletons, empty state, and staggered entry.
class SearchResultsList extends ConsumerWidget {
  /// Creates a [SearchResultsList].
  const SearchResultsList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final results = ref.watch(searchResultsProvider);
    final theme = Theme.of(context).extension<ObeliskTheme>()!;

    return results.when(
      loading: () => _ShimmerList(theme: theme),
      error: (e, _) => _EmptyState(theme: theme, message: e.toString()),
      data: (items) {
        if (items.isEmpty) return _EmptyState(theme: theme);
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _SearchBadge(theme: theme),
            const SizedBox(height: ObeliskTheme.spaceSm),
            for (var i = 0; i < items.length; i++)
              _ResultRow(
                result: items[i],
                delay: Duration(milliseconds: 40 * i),
                theme: theme,
              ),
          ],
        );
      },
    );
  }
}

class _SearchBadge extends StatelessWidget {
  const _SearchBadge({required this.theme});
  final ObeliskTheme theme;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: GlassMaterial(
        variant: GlassVariant.thin,
        borderRadius: BorderRadius.circular(ObeliskTheme.radiusFull),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: ObeliskTheme.spaceMd,
            vertical: ObeliskTheme.spaceXs,
          ),
          child: Text('Searching this area', style: theme.uiCaption1),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.theme, this.message});
  final ObeliskTheme theme;
  final String? message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: ObeliskTheme.space3xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.search_off_rounded,
            size: 48,
            color: theme.foregroundTertiary,
          ),
          const SizedBox(height: ObeliskTheme.spaceMd),
          Text(
            'No results found',
            style: theme.uiSubhead.copyWith(color: theme.foreground),
          ),
          const SizedBox(height: ObeliskTheme.spaceXs),
          Text('Try a different search...', style: theme.uiFootnote),
        ],
      ),
    );
  }
}

class _ShimmerList extends StatelessWidget {
  const _ShimmerList({required this.theme});
  final ObeliskTheme theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) => _ShimmerRow(theme: theme)),
    );
  }
}

class _ShimmerRow extends StatefulWidget {
  const _ShimmerRow({required this.theme});
  final ObeliskTheme theme;

  @override
  State<_ShimmerRow> createState() => _ShimmerRowState();
}

class _ShimmerRowState extends State<_ShimmerRow>
    with SingleTickerProviderStateMixin {
  late final AnimationController _anim;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = widget.theme;
    return AnimatedBuilder(
      animation: _anim,
      builder: (context, _) {
        final shimmerColor = Color.lerp(
          theme.surface,
          theme.glassBorder,
          (0.5 + 0.5 * (_anim.value * 2 - 1).abs()),
        )!;
        return Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: ObeliskTheme.spaceLg,
            vertical: ObeliskTheme.spaceSm,
          ),
          child: Row(
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: shimmerColor,
                ),
              ),
              const SizedBox(width: ObeliskTheme.spaceMd),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 14,
                      width: 140,
                      decoration: BoxDecoration(
                        color: shimmerColor,
                        borderRadius: BorderRadius.circular(
                          ObeliskTheme.radiusSm,
                        ),
                      ),
                    ),
                    const SizedBox(height: ObeliskTheme.spaceXs),
                    Container(
                      height: 10,
                      width: 80,
                      decoration: BoxDecoration(
                        color: shimmerColor,
                        borderRadius: BorderRadius.circular(
                          ObeliskTheme.radiusSm,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ResultRow extends StatefulWidget {
  const _ResultRow({
    required this.result,
    required this.delay,
    required this.theme,
  });

  final SearchResult result;
  final Duration delay;
  final ObeliskTheme theme;

  @override
  State<_ResultRow> createState() => _ResultRowState();
}

class _ResultRowState extends State<_ResultRow>
    with SingleTickerProviderStateMixin {
  late final AnimationController _anim;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    Future<void>.delayed(widget.delay, () {
      if (mounted) _anim.forward();
    });
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = widget.theme;
    final result = widget.result;
    final color = categoryColorForSlug(result.category, theme);
    final distanceStr = result.distance != null
        ? '${(result.distance! / 1000).toStringAsFixed(1)} km'
        : null;
    final meta = [
      result.category,
      if (distanceStr != null) distanceStr,
    ].join(' \u00B7 ');

    return FadeTransition(
      opacity: _anim,
      child: SlideTransition(
        position: _anim.drive(
          Tween(
            begin: const Offset(0, 0.1),
            end: Offset.zero,
          ).chain(CurveTween(curve: Curves.easeOut)),
        ),
        child: InkWell(
          onTap: () {
            // POI selection placeholder (V0.6)
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: ObeliskTheme.spaceLg,
              vertical: ObeliskTheme.spaceMd,
            ),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color,
                  ),
                ),
                const SizedBox(width: ObeliskTheme.spaceMd),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        result.name,
                        style: theme.uiSubhead.copyWith(
                          color: theme.foreground,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(meta, style: theme.uiFootnote, maxLines: 1),
                      if (result.description != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          result.description!,
                          style: theme.uiFootnote.copyWith(
                            color: theme.foregroundTertiary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
