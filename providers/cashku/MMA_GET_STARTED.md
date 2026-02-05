# MMA Integration - Get Started Guide

## Overview

This guide helps MMA developers integrate Cashku investment features into the MMA app using the Mini-App approach. This is the fastest path to integration with minimal development effort.

### What You're Building

```
MMA User Journey:
┌─────────────────────────────────────────────────────────────────┐
│  1. User taps "Invest" in MMA app                               │
│  2. MMA opens Cashku Mini-App (WebView)                         │
│     └── New user: Registration + eKYC + Risk Assessment         │
│     └── Returning user: Direct to portfolio/funds               │
│  3. User browses funds, places orders, completes payment        │
│  4. Callback returns to MMA app with status                     │
│  5. MMA receives webhook for key events                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- MMA app (Flutter/iOS/Android)
- WebView capability
- Deep link handling (`mma://` scheme)
- Server for webhook endpoint (HTTPS)

---

## Step 1: Get Credentials

Contact **tech@cashku.my** to receive:

| Credential | Example | Usage |
|------------|---------|-------|
| Client ID | `ck_partner_mma_xxx` | OAuth authentication |
| Client Secret | `cs_xxx...` | OAuth authentication (keep secret!) |
| API Key | `pk_staging_xxx` | API request header |
| Webhook Secret | `wh_xxx...` | Verify webhook signatures |

> **Important:** Never expose Client Secret or Webhook Secret in client-side code. These should only be used server-side.

---

## Step 2: Environment Setup

| Environment | Base URL | Mini-App URL |
|-------------|----------|--------------|
| Staging | `https://staging.cashku.ai/cowc/v1` | `https://partner.cashku.ai/mma-staging/` |
| Production | `https://platform.cashku.ai/cowc/v1` | `https://partner.cashku.ai/mma/` |

---

## Step 3: Server-Side Authentication

Your server gets an access token using OAuth 2.0 client credentials:

### Node.js Example

```javascript
// server/cashku.js
const CASHKU_BASE_URL = process.env.CASHKU_BASE_URL || 'https://staging.cashku.ai/cowc/v1';

async function getAccessToken() {
  const response = await fetch(`${CASHKU_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.CASHKU_CLIENT_ID,
      client_secret: process.env.CASHKU_CLIENT_SECRET,
      scope: 'funds:read portfolio:read orders:write'
    })
  });

  if (!response.ok) {
    throw new Error(`OAuth failed: ${response.status}`);
  }

  const { access_token, expires_in } = await response.json();

  // Cache token, refresh before expires_in (typically 3600 seconds)
  return access_token;
}
```

### Python Example

```python
# server/cashku.py
import os
import requests

CASHKU_BASE_URL = os.getenv('CASHKU_BASE_URL', 'https://staging.cashku.ai/cowc/v1')

def get_access_token():
    response = requests.post(
        f'{CASHKU_BASE_URL}/oauth/token',
        data={
            'grant_type': 'client_credentials',
            'client_id': os.getenv('CASHKU_CLIENT_ID'),
            'client_secret': os.getenv('CASHKU_CLIENT_SECRET'),
            'scope': 'funds:read portfolio:read orders:write'
        }
    )
    response.raise_for_status()
    return response.json()['access_token']
```

---

## Step 4: Initiate Onboarding (New Users)

When a user taps "Invest" for the first time, initiate the onboarding flow:

### Server-Side: Create Onboarding Flow

```javascript
// server/routes/cashku.js
app.post('/api/cashku/onboarding', async (req, res) => {
  const { userId, email, phone } = req.user; // Your authenticated user

  const accessToken = await getAccessToken();

  const response = await fetch(`${CASHKU_BASE_URL}/flows/onboarding`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-COWC-Partner-Key': process.env.CASHKU_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      partner_user_id: userId,           // Your user's ID
      email: email,                       // Optional: pre-fill email
      phone: phone,                       // Optional: pre-fill phone
      callback_url: 'mma://cashku/callback'  // Your app's deep link
    })
  });

  const { flow_url, expires_at } = await response.json();

  // Return flow_url to mobile app
  res.json({ flow_url, expires_at });
});
```

---

## Step 5: Open Mini-App (Mobile)

### Flutter Implementation

```dart
// lib/screens/cashku_webview.dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class CashkuWebView extends StatefulWidget {
  final String flowUrl;
  final Function(String bindingId) onSuccess;
  final Function(String error) onError;

  const CashkuWebView({
    required this.flowUrl,
    required this.onSuccess,
    required this.onError,
    Key? key,
  }) : super(key: key);

  @override
  State<CashkuWebView> createState() => _CashkuWebViewState();
}

class _CashkuWebViewState extends State<CashkuWebView> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) {
            // Intercept callback URL
            if (request.url.startsWith('mma://cashku/callback')) {
              _handleCallback(request.url);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.flowUrl));
  }

  void _handleCallback(String url) {
    final uri = Uri.parse(url);
    final status = uri.queryParameters['status'];
    final bindingId = uri.queryParameters['binding_id'];
    final error = uri.queryParameters['error'];

    if (status == 'success' && bindingId != null) {
      widget.onSuccess(bindingId);
    } else {
      widget.onError(error ?? 'Unknown error');
    }

    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cashku'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: WebViewWidget(controller: _controller),
    );
  }
}
```

### Swift (iOS) Implementation

```swift
// CashkuWebViewController.swift
import UIKit
import WebKit

class CashkuWebViewController: UIViewController, WKNavigationDelegate {
    var flowUrl: URL!
    var onSuccess: ((String) -> Void)?
    var onError: ((String) -> Void)?

    private var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        webView = WKWebView(frame: view.bounds)
        webView.navigationDelegate = self
        view.addSubview(webView)

        webView.load(URLRequest(url: flowUrl))
    }

    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {

        guard let url = navigationAction.request.url,
              url.scheme == "mma" else {
            decisionHandler(.allow)
            return
        }

        // Handle callback
        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let params = components?.queryItems?.reduce(into: [String: String]()) {
            $0[$1.name] = $1.value
        } ?? [:]

        if params["status"] == "success", let bindingId = params["binding_id"] {
            onSuccess?(bindingId)
        } else {
            onError?(params["error"] ?? "Unknown error")
        }

        dismiss(animated: true)
        decisionHandler(.cancel)
    }
}
```

### Kotlin (Android) Implementation

```kotlin
// CashkuWebViewActivity.kt
class CashkuWebViewActivity : AppCompatActivity() {
    companion object {
        const val EXTRA_FLOW_URL = "flow_url"
        const val RESULT_BINDING_ID = "binding_id"
        const val RESULT_ERROR = "error"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_cashku_webview)

        val webView = findViewById<WebView>(R.id.webView)
        val flowUrl = intent.getStringExtra(EXTRA_FLOW_URL)!!

        webView.settings.javaScriptEnabled = true
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url ?: return false

                if (url.scheme == "mma" && url.host == "cashku") {
                    handleCallback(url)
                    return true
                }
                return false
            }
        }

        webView.loadUrl(flowUrl)
    }

    private fun handleCallback(url: Uri) {
        val status = url.getQueryParameter("status")
        val bindingId = url.getQueryParameter("binding_id")
        val error = url.getQueryParameter("error")

        val resultIntent = Intent()
        if (status == "success" && bindingId != null) {
            resultIntent.putExtra(RESULT_BINDING_ID, bindingId)
            setResult(RESULT_OK, resultIntent)
        } else {
            resultIntent.putExtra(RESULT_ERROR, error ?: "Unknown error")
            setResult(RESULT_CANCELED, resultIntent)
        }
        finish()
    }
}
```

---

## Step 6: Store Binding

After successful onboarding, store the binding_id securely:

### Flutter

```dart
// lib/services/cashku_service.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class CashkuService {
  final _storage = const FlutterSecureStorage();

  Future<void> saveBinding(String bindingId) async {
    await _storage.write(key: 'cashku_binding_id', value: bindingId);

    // Also sync to your server for webhook matching
    await _api.post('/users/me/cashku-binding', {
      'binding_id': bindingId,
    });
  }

  Future<String?> getBinding() async {
    return await _storage.read(key: 'cashku_binding_id');
  }

  Future<void> clearBinding() async {
    await _storage.delete(key: 'cashku_binding_id');
  }
}
```

---

## Step 7: Returning Users

For users who already have a binding, open the Mini-App directly:

```dart
// lib/screens/invest_screen.dart
class InvestScreen extends StatelessWidget {
  final CashkuService _cashkuService = CashkuService();

  void openCashku(BuildContext context) async {
    final bindingId = await _cashkuService.getBinding();

    if (bindingId != null) {
      // User already linked - open Mini-App with binding
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => CashkuWebView(
            flowUrl: 'https://partner.cashku.ai/mma/?binding=$bindingId',
            onSuccess: (_) {}, // Already bound
            onError: (error) => _showError(context, error),
          ),
        ),
      );
    } else {
      // New user - start onboarding
      final flowUrl = await _mmaApi.initiateCashkuOnboarding();
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => CashkuWebView(
            flowUrl: flowUrl,
            onSuccess: (bindingId) => _cashkuService.saveBinding(bindingId),
            onError: (error) => _showError(context, error),
          ),
        ),
      );
    }
  }
}
```

---

## Step 8: Set Up Webhooks

Create an endpoint to receive events from Cashku:

### Node.js/Express Example

```javascript
// server/routes/webhooks.js
const crypto = require('crypto');
const express = require('express');
const router = express.Router();

// Use raw body for signature verification
router.post('/cashku',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // 1. Verify signature
    const signature = req.headers['x-cowc-signature'];
    const timestamp = req.headers['x-cowc-timestamp'];
    const payload = req.body.toString();

    const expected = 'sha256=' + crypto
      .createHmac('sha256', process.env.CASHKU_WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    if (signature !== expected) {
      console.error('Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }

    // 2. Check timestamp (prevent replay attacks)
    const timestampAge = Date.now() - parseInt(timestamp);
    if (timestampAge > 300000) { // 5 minutes
      return res.status(401).send('Timestamp too old');
    }

    // 3. Process event
    const event = JSON.parse(payload);
    const { event_type, data, binding_id } = event;

    console.log(`Received webhook: ${event_type} for binding ${binding_id}`);

    switch (event_type) {
      case 'user.kyc.approved':
        // User completed KYC - they can now invest
        await notifyUser(binding_id, 'Your account is ready for investing!');
        break;

      case 'user.kyc.rejected':
        // KYC failed
        await notifyUser(binding_id, 'Please update your documents.');
        break;

      case 'order.created':
        // Order placed, awaiting payment
        break;

      case 'order.settled':
        // Investment completed!
        await notifyUser(binding_id,
          `Your investment of RM${data.amount} in ${data.fund_name} is complete!`);
        break;

      case 'order.failed':
        // Payment or order failed
        await notifyUser(binding_id, 'Your investment could not be processed.');
        break;

      default:
        console.log(`Unhandled event type: ${event_type}`);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).send('OK');
  }
);

async function notifyUser(bindingId, message) {
  // Look up user by binding_id and send push notification
  const user = await db.users.findOne({ cashku_binding_id: bindingId });
  if (user) {
    await pushNotifications.send(user.id, { message });
  }
}

module.exports = router;
```

### Webhook Events Reference

| Event | Description | Data Fields |
|-------|-------------|-------------|
| `user.kyc.approved` | User completed KYC | `kyc_level` |
| `user.kyc.rejected` | KYC rejected | `reason` |
| `order.created` | Order placed | `order_id`, `fund_name`, `amount` |
| `order.settled` | Investment complete | `order_id`, `fund_name`, `amount`, `units` |
| `order.failed` | Order failed | `order_id`, `reason` |

---

## Step 9: Add Entry Points

Add Cashku access points in the MMA app:

| Location | Implementation |
|----------|----------------|
| Dashboard | Investment card/widget showing portfolio summary |
| Side Menu | "Invest" menu item with icon |
| KOOP Section | "Grow Your Savings" banner/button |
| Profile | "My Investments" link |

### Example: Dashboard Widget

```dart
// lib/widgets/cashku_dashboard_widget.dart
class CashkuDashboardWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String?>(
      future: CashkuService().getBinding(),
      builder: (context, snapshot) {
        final hasBinding = snapshot.data != null;

        return Card(
          child: InkWell(
            onTap: () => openCashku(context),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.trending_up, color: Colors.green),
                      SizedBox(width: 8),
                      Text('Investments',
                        style: Theme.of(context).textTheme.titleMedium),
                    ],
                  ),
                  SizedBox(height: 12),
                  Text(
                    hasBinding
                      ? 'View your portfolio'
                      : 'Start investing today',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
```

---

## Step 10: Testing

### Test Credentials

Use these test accounts in staging:

| Scenario | Email | Expected Result |
|----------|-------|-----------------|
| Successful onboarding | `success@test.cashku.ai` | Completes eKYC, returns binding_id |
| KYC rejection | `kyc.fail@test.cashku.ai` | KYC rejected, error callback |
| Pending KYC | `kyc.pending@test.cashku.ai` | KYC in review |

### Test Payments

In staging, FPX test banks simulate different outcomes:

| Bank | Result |
|------|--------|
| Maybank | Payment success |
| CIMB | Payment failure |
| RHB | Payment timeout |

### Webhook Testing

Use staging to test webhook delivery:

```bash
# Check your webhook endpoint is reachable
curl -X POST https://your-server.com/webhooks/cashku \
  -H "Content-Type: application/json" \
  -d '{"event_type": "test", "data": {}}'
```

---

## Go-Live Checklist

### Before Production

- [ ] All test scenarios pass on staging
- [ ] Webhook endpoint deployed and tested
- [ ] Deep link handling works on iOS and Android
- [ ] Binding storage implemented securely
- [ ] Error handling for all failure scenarios
- [ ] Analytics/logging in place

### Production Deployment

- [ ] Production credentials received from Cashku
- [ ] Environment variables updated for production URLs
- [ ] Webhook endpoint URL provided to Cashku
- [ ] App store submission completed
- [ ] Monitoring/alerting configured

### Post-Launch

- [ ] Monitor webhook delivery
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Plan for extended features (Scanner, Content, etc.)

---

## Extended Features

### Portfolio Scanner (Free Lead Generation)

Offer free portfolio analysis to attract users:

```javascript
// Server-side
const response = await fetch(`${CASHKU_BASE_URL}/scanner/analyze`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-COWC-Partner-Key': process.env.CASHKU_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    binding_id: bindingId,  // Optional - for linked users
    portfolio_data: {
      holdings: [
        { name: 'Fund A', value: 10000 },
        { name: 'Fund B', value: 5000 }
      ]
    }
  })
});

const { report_id } = await response.json();
// Fetch report when ready
```

### Content API (Educational Content)

Display investment education:

```javascript
// Get articles
const articles = await fetch(`${CASHKU_BASE_URL}/content/articles?category=basics`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-COWC-Partner-Key': process.env.CASHKU_API_KEY
  }
});

// Get contextual tips
const tips = await fetch(`${CASHKU_BASE_URL}/content/tips?context=first_investment`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-COWC-Partner-Key': process.env.CASHKU_API_KEY
  }
});
```

### Notification Triggers

Register triggers for proactive notifications:

```javascript
await fetch(`${CASHKU_BASE_URL}/notifications/triggers`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-COWC-Partner-Key': process.env.CASHKU_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    binding_id: bindingId,
    trigger_type: 'portfolio_milestone',
    config: {
      threshold_percent: 10  // Notify when returns hit 10%
    }
  })
});
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| OAuth token invalid | Check credentials, ensure server-side only |
| Callback not intercepted | Verify deep link scheme is registered in app |
| Webhook signature fails | Check secret, verify timestamp header |
| WebView blank/error | Check URL, ensure HTTPS, verify network |
| Binding not found | User may have unbinded - prompt re-onboarding |

---

## Support

| Type | Contact |
|------|---------|
| Technical Support | tech@cashku.my |
| Integration Questions | Direct Slack channel (provided during onboarding) |
| Full Documentation | [COWC Specification](../../spec/COWC_SPECIFICATION.md) |
| Sample Code | [samples/flutter](../../samples/flutter) |
