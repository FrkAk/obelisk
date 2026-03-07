/// Base class for all API errors.
sealed class ApiError implements Exception {
  /// Creates an [ApiError] with a [message] and optional [statusCode].
  const ApiError(this.message, {this.statusCode});

  /// Human-readable error description.
  final String message;

  /// HTTP status code from the response, if available.
  final int? statusCode;

  @override
  String toString() => 'ApiError($statusCode): $message';
}

/// 400/422 — validation failure with optional per-field errors.
final class ApiValidationError extends ApiError {
  /// Creates an [ApiValidationError] with optional per-field [fieldErrors] from Zod.
  const ApiValidationError(
    super.message, {
    this.fieldErrors = const {},
    super.statusCode,
  });

  /// Per-field validation error messages.
  final Map<String, List<String>> fieldErrors;
}

/// 429 — rate limit exceeded.
final class ApiRateLimitError extends ApiError {
  /// Creates an [ApiRateLimitError] with optional [retryAfterSeconds] delay.
  const ApiRateLimitError(
    super.message, {
    this.retryAfterSeconds,
    super.statusCode,
  });

  /// Seconds until the client may retry.
  final int? retryAfterSeconds;
}

/// 404 — resource not found.
final class ApiNotFoundError extends ApiError {
  /// Creates an [ApiNotFoundError].
  const ApiNotFoundError(super.message, {super.statusCode});
}

/// 500 — internal server error.
final class ApiServerError extends ApiError {
  /// Creates an [ApiServerError].
  const ApiServerError(super.message, {super.statusCode});
}

/// 503 — service unavailable (e.g. Ollama down).
final class ApiServiceUnavailableError extends ApiError {
  /// Creates an [ApiServiceUnavailableError].
  const ApiServiceUnavailableError(super.message, {super.statusCode});
}

/// Network-level failure (no response received).
final class ApiNetworkError extends ApiError {
  /// Creates an [ApiNetworkError].
  const ApiNetworkError(super.message);
}
