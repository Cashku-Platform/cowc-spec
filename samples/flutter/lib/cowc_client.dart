/// COWC Flutter Client
///
/// A Dart client for integrating with COWC providers.

import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;

/// COWC API Client
class COWCClient {
  final String baseUrl;
  final String clientId;
  final String clientSecret;
  final String apiKey;

  String? _accessToken;
  DateTime? _tokenExpiry;

  COWCClient({
    required this.baseUrl,
    required this.clientId,
    required this.clientSecret,
    required this.apiKey,
  });

  /// Authenticate with the COWC provider
  Future<String> authenticate({
    List<String> scopes = const ['funds:read', 'portfolio:read', 'orders:write'],
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/oauth/token'),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: {
        'grant_type': 'client_credentials',
        'client_id': clientId,
        'client_secret': clientSecret,
        'scope': scopes.join(' '),
      },
    );

    if (response.statusCode != 200) {
      throw COWCException.fromResponse(response);
    }

    final data = jsonDecode(response.body);
    _accessToken = data['access_token'];
    _tokenExpiry = DateTime.now().add(Duration(seconds: data['expires_in']));

    return _accessToken!;
  }

  bool get _isTokenExpired {
    if (_tokenExpiry == null) return true;
    return DateTime.now().isAfter(_tokenExpiry!.subtract(Duration(minutes: 5)));
  }

  Future<void> _ensureAuthenticated() async {
    if (_isTokenExpired) {
      await authenticate();
    }
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String endpoint, {
    Map<String, String>? queryParams,
    Map<String, dynamic>? body,
  }) async {
    await _ensureAuthenticated();

    var uri = Uri.parse('$baseUrl$endpoint');
    if (queryParams != null) {
      uri = uri.replace(queryParameters: queryParams);
    }

    final request = http.Request(method, uri);
    request.headers.addAll({
      'Authorization': 'Bearer $_accessToken',
      'X-COWC-Partner-Key': apiKey,
      'X-COWC-Request-ID': _generateRequestId(),
      'Content-Type': 'application/json',
    });

    if (body != null) {
      request.body = jsonEncode(body);
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    final data = jsonDecode(response.body);

    if (response.statusCode >= 400) {
      throw COWCException.fromResponse(response);
    }

    return data;
  }

  String _generateRequestId() {
    final random = Random.secure();
    final values = List<int>.generate(16, (i) => random.nextInt(256));
    return values.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }

  // Fund Discovery API

  /// List available funds
  Future<Map<String, dynamic>> listFunds({
    String? category,
    String? riskLevel,
    bool? isShariah,
    String? currency,
    int? limit,
    int? offset,
  }) async {
    final params = <String, String>{};
    if (category != null) params['category'] = category;
    if (riskLevel != null) params['risk_level'] = riskLevel;
    if (isShariah != null) params['is_shariah'] = isShariah.toString();
    if (currency != null) params['currency'] = currency;
    if (limit != null) params['limit'] = limit.toString();
    if (offset != null) params['offset'] = offset.toString();

    return _request('GET', '/funds', queryParams: params.isNotEmpty ? params : null);
  }

  /// Get fund details
  Future<Map<String, dynamic>> getFund(String fundId) async {
    return _request('GET', '/funds/$fundId');
  }

  // Portfolio API

  /// Get portfolio summary
  Future<Map<String, dynamic>> getPortfolio(String bindingId) async {
    return _request('GET', '/bindings/$bindingId/portfolio');
  }

  /// Get holdings
  Future<Map<String, dynamic>> getHoldings(String bindingId) async {
    return _request('GET', '/bindings/$bindingId/holdings');
  }

  /// Get binding status
  Future<Map<String, dynamic>> getBindingStatus(String bindingId) async {
    return _request('GET', '/bindings/$bindingId');
  }

  // Flow API

  /// Initiate onboarding flow
  Future<Map<String, dynamic>> initiateOnboarding({
    required String partnerUserId,
    String? email,
    String? phone,
    required String callbackUrl,
    String locale = 'en',
  }) async {
    return _request('POST', '/flows/onboarding', body: {
      'partner_user_id': partnerUserId,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      'callback_url': callbackUrl,
      'locale': locale,
    });
  }

  /// Initiate link flow
  Future<Map<String, dynamic>> initiateLink({
    required String partnerUserId,
    required String callbackUrl,
  }) async {
    return _request('POST', '/flows/link', body: {
      'partner_user_id': partnerUserId,
      'callback_url': callbackUrl,
    });
  }

  // Order API

  /// Preview order
  Future<Map<String, dynamic>> previewOrder({
    required String bindingId,
    required String fundId,
    required double amount,
    String orderType = 'subscription',
    String currency = 'MYR',
  }) async {
    return _request('POST', '/orders/preview', body: {
      'binding_id': bindingId,
      'fund_id': fundId,
      'order_type': orderType,
      'amount': amount,
      'currency': currency,
    });
  }

  /// Create order
  Future<Map<String, dynamic>> createOrder({
    required String bindingId,
    required String fundId,
    required double amount,
    String orderType = 'subscription',
    String currency = 'MYR',
    String? partnerReferenceId,
  }) async {
    return _request('POST', '/orders', body: {
      'binding_id': bindingId,
      'fund_id': fundId,
      'order_type': orderType,
      'amount': amount,
      'currency': currency,
      if (partnerReferenceId != null) 'partner_reference_id': partnerReferenceId,
    });
  }

  /// Get order status
  Future<Map<String, dynamic>> getOrder(String orderId) async {
    return _request('GET', '/orders/$orderId');
  }
}

/// COWC API Exception
class COWCException implements Exception {
  final String message;
  final String? code;
  final Map<String, dynamic>? details;
  final int statusCode;

  COWCException({
    required this.message,
    this.code,
    this.details,
    required this.statusCode,
  });

  factory COWCException.fromResponse(http.Response response) {
    try {
      final data = jsonDecode(response.body);
      final error = data['error'] ?? {};
      return COWCException(
        message: error['message'] ?? 'Request failed',
        code: error['code'],
        details: error['details'],
        statusCode: response.statusCode,
      );
    } catch (_) {
      return COWCException(
        message: 'Request failed: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    }
  }

  @override
  String toString() => 'COWCException: $message (code: $code)';
}

/// Verify webhook signature
bool verifyWebhook({
  required String payload,
  required String signature,
  required String timestamp,
  required String secret,
  int maxAge = 300,
}) {
  // Check timestamp
  final ts = int.tryParse(timestamp);
  if (ts == null) return false;

  final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
  if ((now - ts).abs() > maxAge) return false;

  // Calculate expected signature
  final signedPayload = '$timestamp.$payload';
  final hmacSha256 = Hmac(sha256, utf8.encode(secret));
  final digest = hmacSha256.convert(utf8.encode(signedPayload));
  final expected = 'sha256=${digest.toString()}';

  return signature == expected;
}
