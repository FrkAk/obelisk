import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/obelisk_theme.dart';
import '../sheet/sheet_providers.dart';
import 'rotating_placeholder.dart';
import 'search_providers.dart';

/// Apple Maps-style search bar with a darker pill input and avatar.
///
/// Layout: [Expanded(pill with search icon + text + clear)] [avatar 36px].
/// Focus expands the sheet to half; clear returns it to mini.
class ObeliskSearchBar extends ConsumerStatefulWidget {
  /// Creates an [ObeliskSearchBar].
  const ObeliskSearchBar({super.key, this.onExpandSheet});

  /// Called when the search bar wants to expand the sheet (e.g. on focus).
  final VoidCallback? onExpandSheet;

  @override
  ConsumerState<ObeliskSearchBar> createState() => _ObeliskSearchBarState();
}

class _ObeliskSearchBarState extends ConsumerState<ObeliskSearchBar>
    with SingleTickerProviderStateMixin {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();

  late final AnimationController _clearAnim;
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _clearAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _focusNode.addListener(_onFocusChange);
    _controller.addListener(_onTextChange);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _controller.removeListener(_onTextChange);
    _focusNode.dispose();
    _controller.dispose();
    _clearAnim.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    if (_focusNode.hasFocus) {
      ref.read(sheetModeNotifierProvider.notifier).set(SheetMode.search);
      widget.onExpandSheet?.call();
    }
  }

  void _onTextChange() {
    final hasText = _controller.text.isNotEmpty;
    if (hasText != _hasText) {
      _hasText = hasText;
      hasText ? _clearAnim.forward() : _clearAnim.reverse();
    }
    ref.read(searchQueryProvider.notifier).set(_controller.text);
  }

  void _onClear() {
    _controller.clear();
    _focusNode.unfocus();
    ref.read(searchQueryProvider.notifier).set('');
    ref.read(searchResultsProvider.notifier).build();
    ref.read(sheetModeNotifierProvider.notifier).set(SheetMode.search);
  }

  void _onSubmit(String query) {
    if (query.trim().isEmpty) return;
    _focusNode.unfocus();
    ref.read(searchResultsProvider.notifier).search(query.trim());
    ref.read(sheetModeNotifierProvider.notifier).set(SheetMode.results);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).extension<ObeliskTheme>()!;
    final isIdle = !_focusNode.hasFocus && !_hasText;

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: ObeliskTheme.spaceLg,
        vertical: ObeliskTheme.spaceMd,
      ),
      child: SizedBox(
        height: 50,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(child: _buildPill(theme, isIdle)),
            const SizedBox(width: ObeliskTheme.spaceMd),
            _buildAvatar(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildPill(ObeliskTheme theme, bool isIdle) {
    return Container(
      height: 50,
      decoration: BoxDecoration(
        color: theme.surface,
        borderRadius: BorderRadius.circular(ObeliskTheme.radius2xl),
        border: Border.all(color: theme.glassBorder),
      ),
      padding: const EdgeInsets.symmetric(horizontal: ObeliskTheme.spaceLg),
      child: Row(
        children: [
          Icon(Icons.search, size: 18, color: theme.foregroundTertiary),
          const SizedBox(width: ObeliskTheme.spaceMd),
          Expanded(
            child: Stack(
              alignment: Alignment.centerLeft,
              children: [
                if (isIdle) RotatingPlaceholder(active: isIdle),
                TextField(
                  controller: _controller,
                  focusNode: _focusNode,
                  style: theme.uiBody,
                  textInputAction: TextInputAction.search,
                  onSubmitted: _onSubmit,
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                    hintText: isIdle ? '' : 'Search Munich...',
                    hintStyle: theme.uiBody.copyWith(
                      color: theme.foregroundTertiary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: ObeliskTheme.spaceSm),
          ScaleTransition(
            scale: _clearAnim,
            child: GestureDetector(
              onTap: _onClear,
              child: Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.foregroundTertiary.withValues(alpha: 0.15),
                ),
                child: Icon(
                  Icons.close,
                  size: 16,
                  color: theme.foregroundSecondary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(ObeliskTheme theme) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: theme.surface,
        border: Border.all(color: theme.glassBorder),
      ),
      child: Icon(Icons.person, size: 20, color: theme.foregroundTertiary),
    );
  }
}
