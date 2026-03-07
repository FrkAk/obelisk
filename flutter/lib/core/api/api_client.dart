import 'package:dio/dio.dart';

import 'api_errors.dart';

/// Base URL for the Obelisk API, configurable at compile time.
const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:3000',
);

/// Creates a configured [Dio] instance with timeouts and error mapping.
///
/// Uses [baseUrl] if provided, otherwise falls back to [apiBaseUrl].
Dio createDio({String? baseUrl}) {
  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl ?? apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      contentType: 'application/json',
    ),
  );

  dio.interceptors.add(_ErrorInterceptor());

  return dio;
}

class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final response = err.response;

    if (response == null) {
      handler.reject(
        DioException(
          requestOptions: err.requestOptions,
          error: ApiNetworkError(err.message ?? 'Network error'),
          type: err.type,
        ),
      );
      return;
    }

    final data = response.data;
    final message = data is Map<String, dynamic>
        ? (data['error'] as String?) ?? response.statusMessage ?? 'Error'
        : response.statusMessage ?? 'Error';

    final ApiError apiError = switch (response.statusCode) {
      400 || 422 => ApiValidationError(
        message,
        statusCode: response.statusCode,
        fieldErrors: _parseFieldErrors(data),
      ),
      404 => ApiNotFoundError(message, statusCode: 404),
      429 => ApiRateLimitError(
        message,
        statusCode: 429,
        retryAfterSeconds: _parseRetryAfter(response),
      ),
      503 => ApiServiceUnavailableError(message, statusCode: 503),
      _ => ApiServerError(message, statusCode: response.statusCode),
    };

    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: response,
        error: apiError,
        type: err.type,
      ),
    );
  }

  Map<String, List<String>> _parseFieldErrors(dynamic data) {
    if (data is! Map<String, dynamic>) return {};
    final details = data['details'];
    if (details is! Map<String, dynamic>) return {};
    final fieldErrors = details['fieldErrors'];
    if (fieldErrors is! Map<String, dynamic>) return {};

    return fieldErrors.map(
      (key, value) =>
          MapEntry(key, value is List ? value.cast<String>() : <String>[]),
    );
  }

  int? _parseRetryAfter(Response<dynamic> response) {
    final header = response.headers.value('Retry-After');
    if (header == null) return null;
    return int.tryParse(header);
  }
}
