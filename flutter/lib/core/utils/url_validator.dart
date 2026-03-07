/// Returns true if [url] has an http or https scheme and a non-empty host.
bool isValidHttpUrl(String url) {
  final uri = Uri.tryParse(url);
  if (uri == null) return false;
  return (uri.scheme == 'http' || uri.scheme == 'https') && uri.host.isNotEmpty;
}
