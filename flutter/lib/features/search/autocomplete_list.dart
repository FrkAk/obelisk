import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/category_colors.dart';
import '../../core/theme/obelisk_theme.dart';
import 'search_providers.dart';

/// Displays autocomplete suggestions below the search bar.
///
/// Max 5 rows with staggered entry animation. Tapping a suggestion
/// fills the search bar and triggers a full search.
class AutocompleteList extends ConsumerWidget {
  /// Creates an [AutocompleteList].
  const AutocompleteList({super.key, required this.onSelect});

  /// Called when a suggestion is tapped with its name.
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final suggestions = ref.watch(autocompleteSuggestionsProvider);
    final theme = Theme.of(context).extension<ObeliskTheme>()!;

    return suggestions.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        final capped = items.take(5).toList();
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < capped.length; i++) ...[
              if (i > 0)
                Divider(
                  height: 1,
                  indent: ObeliskTheme.spaceLg,
                  color: theme.glassBorder,
                ),
              _SuggestionRow(
                suggestion: capped[i],
                delay: Duration(milliseconds: 40 * i),
                onTap: () => onSelect(capped[i].name),
                theme: theme,
              ),
            ],
          ],
        );
      },
    );
  }
}

class _SuggestionRow extends StatefulWidget {
  const _SuggestionRow({
    required this.suggestion,
    required this.delay,
    required this.onTap,
    required this.theme,
  });

  final dynamic suggestion;
  final Duration delay;
  final VoidCallback onTap;
  final ObeliskTheme theme;

  @override
  State<_SuggestionRow> createState() => _SuggestionRowState();
}

class _SuggestionRowState extends State<_SuggestionRow>
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
    final suggestion = widget.suggestion;
    final color = categoryColorForSlug(suggestion.category as String, theme);

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
          onTap: widget.onTap,
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
                  child: Text(
                    suggestion.name as String,
                    style: theme.uiSubhead.copyWith(color: theme.foreground),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: ObeliskTheme.spaceSm),
                Text(suggestion.category as String, style: theme.uiFootnote),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
