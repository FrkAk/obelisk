import 'package:freezed_annotation/freezed_annotation.dart';

part 'category.freezed.dart';
part 'category.g.dart';

/// All POI category slugs supported by the backend.
@JsonEnum(valueField: 'value')
enum CategorySlug {
  history('history'),
  food('food'),
  art('art'),
  nature('nature'),
  architecture('architecture'),
  hidden('hidden'),
  views('views'),
  culture('culture'),
  shopping('shopping'),
  nightlife('nightlife'),
  sports('sports'),
  health('health'),
  transport('transport'),
  education('education'),
  services('services');

  const CategorySlug(this.value);

  /// The JSON string value for this slug.
  final String value;
}

/// A POI category with display metadata.
@freezed
abstract class Category with _$Category {
  /// Creates a [Category].
  const factory Category({
    required String id,
    required String name,
    required CategorySlug slug,
    required String icon,
    required String color,
  }) = _Category;

  factory Category.fromJson(Map<String, dynamic> json) =>
      _$CategoryFromJson(json);
}
