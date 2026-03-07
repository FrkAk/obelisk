import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'api_client.dart';
import 'endpoints.dart';

part 'api_provider.g.dart';

/// Singleton [Dio] instance with timeouts and error mapping.
@Riverpod(keepAlive: true)
Dio dio(DioRef ref) => createDio();

/// Singleton [ObeliskApi] wrapping the shared [Dio] client.
@Riverpod(keepAlive: true)
ObeliskApi obeliskApi(ObeliskApiRef ref) => ObeliskApi(ref.watch(dioProvider));
