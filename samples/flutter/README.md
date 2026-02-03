# COWC Flutter Sample

A Flutter/Dart implementation example for integrating with COWC providers.

## Requirements

- Flutter 3.10+
- Dart 3.0+

## Installation

Add to your `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.1.0
  webview_flutter: ^4.4.0
```

## Usage

```dart
import 'package:cowc_client/cowc_client.dart';

final client = COWCClient(
  baseUrl: 'https://staging.cashku.ai/cowc/v1',
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  apiKey: 'your_api_key',
);

// Authenticate
await client.authenticate();

// List funds
final funds = await client.listFunds(category: 'equity');

// Get portfolio
final portfolio = await client.getPortfolio('bind_xxx');

// Open onboarding WebView
final flowUrl = await client.initiateOnboarding(
  partnerUserId: 'user_123',
  email: 'user@example.com',
  callbackUrl: 'myapp://cowc/callback',
);
// Open flowUrl in WebView...
```

## WebView Integration

```dart
WebView(
  initialUrl: flowUrl,
  javascriptMode: JavascriptMode.unrestricted,
  navigationDelegate: (request) {
    if (request.url.startsWith('myapp://cowc/callback')) {
      final uri = Uri.parse(request.url);
      final bindingId = uri.queryParameters['binding_id'];
      // Store bindingId
      Navigator.pop(context, bindingId);
      return NavigationDecision.prevent;
    }
    return NavigationDecision.navigate;
  },
)
```

## License

Apache 2.0
