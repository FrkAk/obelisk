// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'category.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Category _$CategoryFromJson(Map<String, dynamic> json) => _Category(
  id: json['id'] as String,
  name: json['name'] as String,
  slug: $enumDecode(_$CategorySlugEnumMap, json['slug']),
  icon: json['icon'] as String,
  color: json['color'] as String,
);

Map<String, dynamic> _$CategoryToJson(_Category instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'slug': _$CategorySlugEnumMap[instance.slug]!,
  'icon': instance.icon,
  'color': instance.color,
};

const _$CategorySlugEnumMap = {
  CategorySlug.history: 'history',
  CategorySlug.food: 'food',
  CategorySlug.art: 'art',
  CategorySlug.nature: 'nature',
  CategorySlug.architecture: 'architecture',
  CategorySlug.hidden: 'hidden',
  CategorySlug.views: 'views',
  CategorySlug.culture: 'culture',
  CategorySlug.shopping: 'shopping',
  CategorySlug.nightlife: 'nightlife',
  CategorySlug.sports: 'sports',
  CategorySlug.health: 'health',
  CategorySlug.transport: 'transport',
  CategorySlug.education: 'education',
  CategorySlug.services: 'services',
};
