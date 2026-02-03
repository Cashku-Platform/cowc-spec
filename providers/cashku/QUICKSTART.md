# MMA Integration Quick Start Guide

**For:** MMA Development Team
**Based on:** [Cashku Open Wealth Connect (COWC) Specification](./CASHKU_OPEN_WEALTH_CONNECT_SPEC.md)

---

## Overview

This guide helps you integrate Cashku investment features into the MMA app. For full API documentation, see the [COWC Specification](./CASHKU_OPEN_WEALTH_CONNECT_SPEC.md).

### What You're Building

```
MMA User Journey:
1. User taps "Invest" in MMA app
2. MMA opens Cashku WebView → User registers + KYC
3. User browses funds in MMA native UI (via API)
4. User invests → MMA opens payment WebView
5. Done! Portfolio syncs automatically
```

---

## 1. Get Credentials

Contact **tech@cashku.my** to receive:

```
Client ID:     ck_partner_mma_xxxxxxxx
Client Secret: cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API Key:       pk_staging_xxxxxxxxxxxxxxxx
```

---

## 2. Environments

| Environment | Base URL |
|-------------|----------|
| Staging | `https://staging.cashku.ai/cowc/v1` |
| Production | `https://platform.cashku.ai/cowc/v1` |

---

## 3. Authentication

Get an access token (server-side):

```http
POST /cowc/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id={your_client_id}&
client_secret={your_client_secret}&
scope=funds:read portfolio:read orders:write
```

Use the token in API calls:
```http
Authorization: Bearer {access_token}
X-COWC-Partner-Key: {api_key}
```

---

## 4. User Onboarding (WebView)

### Start Onboarding Flow

```http
POST /cowc/v1/flows/onboarding
Authorization: Bearer {access_token}

{
  "partner_user_id": "mma_user_12345",
  "email": "user@example.com",
  "callback_url": "mma://cashku/callback"
}
```

**Response:**
```json
{
  "flow_url": "https://staging.cashku.ai/cowc/flow/xxx",
  "expires_at": "2026-02-03T11:00:00Z"
}
```

### Open WebView

```dart
// Flutter example
WebView(
  initialUrl: flowUrl,
  navigationDelegate: (request) {
    if (request.url.startsWith('mma://')) {
      // Parse callback params
      final uri = Uri.parse(request.url);
      final bindingId = uri.queryParameters['binding_id'];
      // Store bindingId for this user
      return NavigationDecision.prevent;
    }
    return NavigationDecision.navigate;
  },
)
```

### Callback Parameters

```
mma://cashku/callback?
  status=success&
  binding_id=bind_xxx&      ← Store this!
  kyc_status=approved
```

---

## 5. Show Portfolio

```http
GET /cowc/v1/bindings/{binding_id}/portfolio
Authorization: Bearer {access_token}
```

```json
{
  "total_value": { "amount": 15234.56, "currency": "MYR" },
  "total_returns": { "amount": 1234.56, "percent": 8.82 },
  "holdings_count": 3
}
```

---

## 6. List Funds

```http
GET /cowc/v1/funds
Authorization: Bearer {access_token}
```

```json
{
  "funds": [
    {
      "fund_id": "fund_xxx",
      "fund_name": "Kenanga Growth Fund",
      "current_nav": 1.2345,
      "ytd_return_percent": 8.5,
      "min_initial_investment": 100.00
    }
  ]
}
```

---

## 7. Place Order

### Preview First
```http
POST /cowc/v1/orders/preview
{ "binding_id": "bind_xxx", "fund_id": "fund_xxx", "amount": 1000.00 }
```

### Create Order
```http
POST /cowc/v1/orders
{ "binding_id": "bind_xxx", "fund_id": "fund_xxx", "amount": 1000.00 }
```

**Response includes payment WebView URL:**
```json
{
  "order_id": "ord_xxx",
  "payment_flow": {
    "flow_url": "https://staging.cashku.ai/cowc/payment/ord_xxx"
  }
}
```

Open `flow_url` in WebView for FPX payment.

---

## 8. Webhooks

Set up webhook endpoint to receive events:

| Event | When |
|-------|------|
| `user.kyc.approved` | KYC completed |
| `order.settled` | Investment complete |

Verify signature:
```javascript
const expected = crypto.createHmac('sha256', webhookSecret)
  .update(`${timestamp}.${body}`)
  .digest('hex');
```

---

## 9. Testing

| Test Case | Email/Action |
|-----------|--------------|
| Successful onboarding | `success@test.cashku.ai` |
| KYC rejection | `kyc.fail@test.cashku.ai` |
| Payment success | FPX test bank (Maybank) |

---

## 10. Go Live Checklist

- [ ] Integration tested on staging
- [ ] Webhook endpoint receiving events
- [ ] Error handling implemented
- [ ] Production credentials received
- [ ] Switch base URL to production

---

## Support

**Technical Support:** tech@cashku.my

**Full Documentation:** [COWC Specification](./CASHKU_OPEN_WEALTH_CONNECT_SPEC.md)
