# Cashku Open Wealth Connect (COWC) Specification

**Version:** 1.0.0 (Draft)
**Status:** Draft
**Last Updated:** February 2026
**License:** Apache 2.0
**Created by:** Cashku

---

## About This Specification

Cashku Open Wealth Connect (COWC) is an open standard for integrating investment and wealth management capabilities into third-party applications. It enables partner apps (super apps, lifestyle apps, banking apps) to offer investment features to their users through a standardized API.

COWC was created by Cashku to establish an industry-standard approach for wealth platform integration in Southeast Asia and beyond.

### Goals

- **Interoperability**: Partners integrate once, connect to multiple wealth providers
- **Security**: Strong authentication, consent management, and data privacy
- **User Experience**: Seamless embedded flows for sensitive operations
- **Simplicity**: RESTful APIs with clear conventions

### Conformance

A conformant COWC Provider MUST implement all REQUIRED endpoints and MAY implement OPTIONAL endpoints. Providers MUST follow the security requirements in Section 9.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Terminology](#2-terminology)
3. [Authentication](#3-authentication)
4. [User Linking & Consent](#4-user-linking--consent)
5. [Fund Discovery API](#5-fund-discovery-api)
6. [Portfolio API](#6-portfolio-api)
7. [Order API](#7-order-api)
8. [Embedded Flows](#8-embedded-flows)
9. [Webhooks](#9-webhooks)
10. [Error Handling](#10-error-handling)
11. [Security Requirements](#11-security-requirements)
12. [Extensibility](#12-extensibility)
13. [Portfolio Scanner API](#13-portfolio-scanner-api) [OPTIONAL]
14. [Content API](#14-content-api) [OPTIONAL]
15. [Notification Triggers API](#15-notification-triggers-api) [OPTIONAL]
16. [Appendix A: Cashku Implementation](#appendix-a-cashku-implementation)

---

## 1. Overview

### 1.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Partner Application                       │
│  (Super App, Banking App, Lifestyle App)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Native UI   │  │ COWC Client │  │ Embedded Flows      │ │
│  │ - Portfolio │  │ (API calls) │  │ - Onboarding        │ │
│  │ - Funds     │  │             │  │ - Payment           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              COWC Provider (Wealth Platform)                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Partner API  │  │ Embedded     │  │ Webhook          │  │
│  │ Gateway      │  │ Flow Host    │  │ Delivery         │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Core Wealth Platform                     │  │
│  │  (KYC, Orders, Holdings, Payments, Custody)          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Integration Model

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| User Registration | Provider | Embedded Flow (WebView) |
| KYC Verification | Provider | Embedded Flow (WebView) |
| Fund Discovery | Partner | API (native UI) |
| Portfolio Display | Partner | API (native UI) |
| Order Placement | Provider | API + Embedded Flow |
| Payment Processing | Provider | Embedded Flow (WebView) |
| Custody & Settlement | Provider | Backend |

### 1.3 User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     Typical User Journey                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User in Partner app initiates investment feature            │
│                     │                                           │
│                     ▼                                           │
│  2. Partner opens Provider's Onboarding Embedded Flow           │
│     - User registers with Provider                              │
│     - User completes KYC (identity verification)                │
│     - User completes suitability assessment                     │
│                     │                                           │
│                     ▼                                           │
│  3. Flow completes, Partner receives binding_id                 │
│                     │                                           │
│                     ▼                                           │
│  4. Partner displays portfolio via Portfolio API                │
│                     │                                           │
│                     ▼                                           │
│  5. User browses funds via Fund Discovery API                   │
│                     │                                           │
│                     ▼                                           │
│  6. User invests, Partner opens Payment Embedded Flow           │
│                     │                                           │
│                     ▼                                           │
│  7. Provider sends webhook: order.settled                       │
│     Partner updates UI                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Terminology

| Term | Definition |
|------|------------|
| **Provider** | The wealth/investment platform implementing COWC (e.g., Cashku) |
| **Partner** | The application integrating with the Provider (e.g., super app) |
| **End User** | The person using the Partner application to invest |
| **Binding** | The link between a Partner's user and Provider's investor account |
| **Embedded Flow** | A Provider-hosted web flow opened in Partner's WebView |
| **Scope** | A permission that defines what data/actions Partner can access |

---

## 3. Authentication

### 3.1 Partner Authentication

Partners MUST authenticate using OAuth 2.0 Client Credentials Grant (RFC 6749 Section 4.4).

**Token Request:**
```http
POST /cowc/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id={client_id}&
client_secret={client_secret}&
scope={requested_scopes}
```

**Token Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "funds:read portfolio:read orders:write"
}
```

### 3.2 API Authentication

All API requests MUST include the access token:

```http
GET /cowc/v1/funds
Authorization: Bearer {access_token}
X-COWC-Partner-Key: {partner_api_key}
X-COWC-Request-ID: {unique_request_id}
```

### 3.3 Token Lifecycle

- Access tokens SHOULD expire within 1-4 hours
- Partners MUST handle token expiration gracefully
- Providers MAY support refresh tokens (OPTIONAL)

### 3.4 Scopes

Providers MUST support these standard scopes:

| Scope | Description | Required |
|-------|-------------|----------|
| `funds:read` | List and view fund details | REQUIRED |
| `portfolio:read` | View user holdings and performance | REQUIRED |
| `transactions:read` | View transaction history | REQUIRED |
| `orders:write` | Submit orders | REQUIRED |
| `orders:read` | View order status | REQUIRED |
| `profile.basic:read` | View masked user profile | OPTIONAL |

Providers MAY define additional scopes prefixed with `x-`.

---

## 4. User Linking & Consent

### 4.1 Overview

Before accessing user data, Partners MUST establish a Binding with explicit user consent.

### 4.2 Initiate Onboarding Flow (New Users)

For users without a Provider account:

```http
POST /cowc/v1/flows/onboarding
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "partner_user_id": "partner_user_12345",
  "email": "user@example.com",
  "phone": "+60123456789",
  "callback_url": "partner://cowc/callback",
  "locale": "en",
  "requested_scopes": ["portfolio:read", "orders:write"]
}
```

**Response:**
```json
{
  "flow_id": "flow_abc123xyz",
  "flow_url": "https://provider.example/cowc/flow/flow_abc123xyz",
  "expires_at": "2026-02-03T11:00:00Z"
}
```

### 4.3 Initiate Link Flow (Existing Users)

For users with existing Provider accounts:

```http
POST /cowc/v1/flows/link
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "partner_user_id": "partner_user_12345",
  "callback_url": "partner://cowc/callback",
  "requested_scopes": ["portfolio:read", "orders:write"]
}
```

### 4.4 Flow Callback

Upon completion, Provider redirects to `callback_url`:

```
partner://cowc/callback?
  status=success&
  binding_id=bind_xxxxxxxxxxxxx&
  scopes_granted=portfolio:read,orders:write&
  user_status=active&
  kyc_status=approved
```

**Callback Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | `success`, `cancelled`, `error` |
| `binding_id` | string | Opaque binding identifier |
| `scopes_granted` | string | Comma-separated granted scopes |
| `user_status` | string | `pending`, `active`, `suspended` |
| `kyc_status` | string | `pending`, `approved`, `rejected` |
| `error_code` | string | Error code (if status=error) |
| `error_message` | string | Human-readable error |

### 4.5 Get Binding Status

```http
GET /cowc/v1/bindings/{binding_id}
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "binding_id": "bind_xxxxxxxxxxxxx",
  "status": "active",
  "user_status": "active",
  "kyc_status": "approved",
  "risk_profile": "moderate",
  "scopes_granted": ["portfolio:read", "orders:write"],
  "linked_at": "2026-01-15T10:30:00Z"
}
```

### 4.6 Revoke Binding

Users MUST be able to revoke bindings. Partners receive `binding.revoked` webhook.

```http
DELETE /cowc/v1/bindings/{binding_id}
Authorization: Bearer {access_token}
```

---

## 5. Fund Discovery API

### 5.1 List Funds [REQUIRED]

```http
GET /cowc/v1/funds
Authorization: Bearer {access_token}
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `risk_level` | string | Filter by risk level |
| `is_shariah` | boolean | Filter Shariah-compliant |
| `currency` | string | Filter by currency (ISO 4217) |
| `limit` | integer | Results per page (max: 100) |
| `offset` | integer | Pagination offset |

**Response:**
```json
{
  "funds": [
    {
      "fund_id": "fund_xxx",
      "fund_code": "ABC001",
      "fund_name": "Growth Fund",
      "fund_house": "Asset Management Co",
      "category": "equity",
      "risk_level": "aggressive",
      "is_shariah": false,
      "currency": "MYR",
      "current_nav": 1.2345,
      "nav_date": "2026-02-02",
      "ytd_return_percent": 8.5,
      "min_initial_investment": 100.00,
      "min_subsequent_investment": 50.00,
      "sales_charge_percent": 0,
      "management_fee_percent": 1.5
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### 5.2 Get Fund Details [REQUIRED]

```http
GET /cowc/v1/funds/{fund_id}
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "fund_id": "fund_xxx",
  "fund_code": "ABC001",
  "fund_name": "Growth Fund",
  "fund_house": "Asset Management Co",
  "description": "A growth-oriented equity fund...",
  "category": "equity",
  "risk_level": "aggressive",
  "is_shariah": false,
  "currency": "MYR",
  "current_nav": 1.2345,
  "nav_date": "2026-02-02",
  "performance": {
    "1_month_percent": 2.1,
    "3_month_percent": 5.8,
    "6_month_percent": 7.2,
    "ytd_percent": 8.5,
    "1_year_percent": 12.3,
    "3_year_annualized_percent": 9.8,
    "5_year_annualized_percent": 8.2,
    "since_inception_percent": 156.7
  },
  "fees": {
    "sales_charge_percent": 0,
    "management_fee_percent": 1.5,
    "trustee_fee_percent": 0.05
  },
  "minimums": {
    "initial_investment": 100.00,
    "subsequent_investment": 50.00,
    "redemption": 50.00
  },
  "documents": {
    "prospectus_url": "https://...",
    "factsheet_url": "https://..."
  }
}
```

### 5.3 Get NAV History [OPTIONAL]

```http
GET /cowc/v1/funds/{fund_id}/nav?from=2026-01-01&to=2026-02-01
Authorization: Bearer {access_token}
```

---

## 6. Portfolio API

### 6.1 Get Portfolio Summary [REQUIRED]

```http
GET /cowc/v1/bindings/{binding_id}/portfolio
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "total_value": {
    "amount": 15234.56,
    "currency": "MYR"
  },
  "total_invested": {
    "amount": 14000.00,
    "currency": "MYR"
  },
  "total_returns": {
    "amount": 1234.56,
    "percent": 8.82
  },
  "holdings_count": 3,
  "last_updated": "2026-02-03T08:00:00Z"
}
```

### 6.2 Get Holdings [REQUIRED]

```http
GET /cowc/v1/bindings/{binding_id}/holdings
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "holdings": [
    {
      "fund_id": "fund_xxx",
      "fund_code": "ABC001",
      "fund_name": "Growth Fund",
      "units": 5432.10,
      "average_cost": 1.1000,
      "current_nav": 1.2345,
      "market_value": 6705.30,
      "total_invested": 5975.31,
      "unrealized_gain": 729.99,
      "unrealized_gain_percent": 12.22,
      "allocation_percent": 44.0,
      "currency": "MYR"
    }
  ]
}
```

### 6.3 Get Transactions [REQUIRED]

```http
GET /cowc/v1/bindings/{binding_id}/transactions?from=2026-01-01&limit=50
Authorization: Bearer {access_token}
```

---

## 7. Order API

### 7.1 Preview Order [REQUIRED]

Calculate fees and indicative units before order submission.

```http
POST /cowc/v1/orders/preview
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "binding_id": "bind_xxxxxxxxxxxxx",
  "fund_id": "fund_xxx",
  "order_type": "subscription",
  "amount": 1000.00,
  "currency": "MYR"
}
```

**Response:**
```json
{
  "order_type": "subscription",
  "fund_id": "fund_xxx",
  "gross_amount": 1000.00,
  "sales_charge": 0.00,
  "net_amount": 1000.00,
  "indicative_nav": 1.2345,
  "indicative_units": 810.21,
  "nav_date": "2026-02-02",
  "currency": "MYR",
  "disclaimer": "Final units based on NAV at settlement date"
}
```

### 7.2 Create Order [REQUIRED]

```http
POST /cowc/v1/orders
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "binding_id": "bind_xxxxxxxxxxxxx",
  "fund_id": "fund_xxx",
  "order_type": "subscription",
  "amount": 1000.00,
  "currency": "MYR",
  "partner_reference_id": "partner_order_12345"
}
```

**Response:**
```json
{
  "order_id": "ord_xxxxxxxxxxxxx",
  "status": "pending_payment",
  "payment_flow": {
    "flow_url": "https://provider.example/cowc/payment/ord_xxx",
    "expires_at": "2026-02-03T11:30:00Z"
  }
}
```

### 7.3 Get Order Status [REQUIRED]

```http
GET /cowc/v1/orders/{order_id}
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "order_id": "ord_xxxxxxxxxxxxx",
  "binding_id": "bind_xxxxxxxxxxxxx",
  "fund_id": "fund_xxx",
  "order_type": "subscription",
  "status": "settled",
  "amount": 1000.00,
  "currency": "MYR",
  "units_allocated": 805.15,
  "nav_price": 1.2420,
  "settlement_date": "2026-02-05",
  "partner_reference_id": "partner_order_12345",
  "created_at": "2026-02-03T10:00:00Z",
  "updated_at": "2026-02-05T14:30:00Z"
}
```

### 7.4 Order Statuses

| Status | Description |
|--------|-------------|
| `pending_payment` | Awaiting payment |
| `payment_received` | Payment confirmed |
| `processing` | Being processed |
| `submitted` | Submitted to fund house |
| `confirmed` | Confirmed by fund house |
| `settled` | Units allocated |
| `failed` | Order failed |
| `cancelled` | Order cancelled |

### 7.5 Order Types

| Type | Description |
|------|-------------|
| `subscription` | Purchase fund units |
| `redemption` | Sell fund units |
| `switch` | Switch between funds (OPTIONAL) |

---

## 8. Embedded Flows

### 8.1 Overview

Sensitive operations (registration, KYC, payment) MUST use Provider-hosted Embedded Flows opened in Partner's WebView.

### 8.2 Flow Types

| Flow | Endpoint | Purpose |
|------|----------|---------|
| Onboarding | `POST /cowc/v1/flows/onboarding` | New user registration + KYC |
| Link | `POST /cowc/v1/flows/link` | Link existing account |
| Payment | Returned in order response | Complete payment |
| KYC Update | `POST /cowc/v1/flows/kyc` | Update KYC (OPTIONAL) |

### 8.3 WebView Implementation

Partners MUST:
1. Open `flow_url` in a secure WebView
2. Enable JavaScript
3. Intercept callback URL redirects
4. Handle all callback parameters

**Example (pseudocode):**
```
webview.load(flow_url)
webview.onNavigate(url) {
  if (url.startsWith(callback_url)) {
    params = parseQueryParams(url)
    handleCallback(params)
    webview.close()
  }
}
```

### 8.4 Theming [OPTIONAL]

Providers MAY support Partner branding via flow parameters:

```json
{
  "theme": {
    "primary_color": "#1a73e8",
    "logo_url": "https://partner.example/logo.png"
  }
}
```

---

## 9. Webhooks

### 9.1 Overview

Providers MUST deliver webhooks for asynchronous events.

### 9.2 Webhook Format

```http
POST {partner_webhook_url}
Content-Type: application/json
X-COWC-Signature: sha256={signature}
X-COWC-Timestamp: {unix_timestamp}
X-COWC-Event-Type: {event_type}

{
  "event_id": "evt_xxxxxxxxxxxxx",
  "event_type": "order.settled",
  "provider": "cashku",
  "created_at": "2026-02-05T14:30:00Z",
  "data": {
    "order_id": "ord_xxxxxxxxxxxxx",
    "binding_id": "bind_xxxxxxxxxxxxx",
    "status": "settled"
  }
}
```

### 9.3 Signature Verification

Partners MUST verify webhook signatures:

```
signed_payload = timestamp + "." + json_body
expected_signature = HMAC-SHA256(signed_payload, webhook_secret)
```

### 9.4 Standard Events [REQUIRED]

| Event | Description |
|-------|-------------|
| `user.created` | New user registered |
| `user.kyc.approved` | KYC approved |
| `user.kyc.rejected` | KYC rejected |
| `binding.created` | Account linked |
| `binding.revoked` | Account unlinked |
| `order.created` | Order submitted |
| `order.payment_received` | Payment confirmed |
| `order.settled` | Units allocated |
| `order.failed` | Order failed |

### 9.5 Retry Policy

Providers MUST retry failed deliveries:
- Attempt 1: Immediate
- Attempt 2: 5 minutes
- Attempt 3: 30 minutes
- Attempt 4: 2 hours
- Attempt 5: 24 hours

Partners MUST return HTTP 2xx to acknowledge receipt.

---

## 10. Error Handling

### 10.1 Error Response Format

```json
{
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Investment amount must be at least 100.00 MYR",
    "details": {
      "minimum_amount": 100,
      "provided_amount": 50,
      "currency": "MYR"
    }
  },
  "request_id": "req_xxxxxxxxxxxxx"
}
```

### 10.2 Standard Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient scope |
| `NOT_FOUND` | 404 | Resource not found |
| `BINDING_NOT_FOUND` | 404 | Binding does not exist |
| `FUND_NOT_FOUND` | 404 | Fund does not exist |
| `INVALID_REQUEST` | 400 | Malformed request |
| `INVALID_AMOUNT` | 400 | Amount validation failed |
| `KYC_REQUIRED` | 400 | User must complete KYC |
| `INSUFFICIENT_BALANCE` | 400 | Not enough units |
| `RATE_LIMITED` | 429 | Too many requests |
| `PROVIDER_ERROR` | 500 | Internal provider error |

### 10.3 Rate Limiting

Providers MUST include rate limit headers:

```http
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1706961060
```

---

## 11. Security Requirements

### 11.1 Transport Security [REQUIRED]

- All endpoints MUST use HTTPS
- TLS 1.2 or higher REQUIRED
- Certificate validation MUST NOT be disabled

### 11.2 Credential Security [REQUIRED]

- Client secrets MUST be stored securely (not in code)
- Client secrets MUST NOT be exposed in client-side code
- Credentials SHOULD be rotated periodically

### 11.3 Token Security [REQUIRED]

- Access tokens MUST NOT be logged
- Tokens MUST be transmitted only in Authorization header
- Partners MUST handle token expiration gracefully

### 11.4 Webhook Security [REQUIRED]

- Webhooks MUST be delivered over HTTPS
- Partners MUST verify webhook signatures
- Partners MUST validate timestamps (reject if >5 minutes old)

### 11.5 Data Privacy [REQUIRED]

- Partners MUST NOT store unnecessary PII
- Binding IDs are opaque; Partners MUST NOT attempt to decode
- Providers MUST mask PII in API responses where appropriate

### 11.6 Request Signing [OPTIONAL]

Providers MAY require RSA-SHA256 request signing for sensitive operations.

---

## 12. Extensibility

### 12.1 Provider Extensions

Providers MAY extend the specification with:
- Additional scopes (prefixed with `x-`)
- Additional endpoints (under `/cowc/v1/x-{provider}/`)
- Additional webhook events (prefixed with `x.`)
- Additional error codes (prefixed with `X_`)

### 12.2 Versioning

- API version is indicated in path: `/cowc/v1/`
- Breaking changes require new major version
- Providers SHOULD support previous version for 12 months

---

## 13. Portfolio Scanner API [OPTIONAL]

The Portfolio Scanner API enables AI-powered portfolio analysis as a lead generation and engagement feature.

### 13.1 Overview

The scanner allows users to upload their existing investment portfolio (from any provider) and receive AI-generated insights, recommendations, and comparisons.

### 13.2 Scopes

| Scope | Description |
|-------|-------------|
| `scanner:write` | Submit portfolios for analysis |
| `scanner:read` | Retrieve scan reports |

### 13.3 Submit Portfolio for Analysis

```http
POST /cowc/v1/scanner/analyze
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "binding_id": "bind_xxxxxxxxxxxxx",
  "portfolio_data": {
    "holdings": [
      {
        "fund_name": "ABC Growth Fund",
        "fund_code": "ABC001",
        "units": 1000,
        "cost_per_unit": 1.50,
        "current_value": 1800.00
      }
    ],
    "total_value": 50000.00,
    "currency": "MYR"
  },
  "user_profile": {
    "age_range": "30-40",
    "risk_tolerance": "moderate",
    "investment_horizon": "5-10 years"
  }
}
```

**Response:**
```json
{
  "scan_id": "scan_xxxxxxxxxxxxx",
  "status": "processing",
  "estimated_completion": "2026-02-03T10:05:00Z"
}
```

### 13.4 Get Scanner Report

```http
GET /cowc/v1/scanner/report/{scan_id}
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "scan_id": "scan_xxxxxxxxxxxxx",
  "status": "completed",
  "created_at": "2026-02-03T10:00:00Z",
  "completed_at": "2026-02-03T10:03:00Z",
  "analysis": {
    "health_score": 72,
    "diversification_score": 65,
    "risk_alignment_score": 80,
    "fee_efficiency_score": 70
  },
  "insights": [
    {
      "type": "warning",
      "title": "High concentration in single sector",
      "description": "60% of your portfolio is in technology funds...",
      "recommendation": "Consider diversifying into other sectors"
    },
    {
      "type": "opportunity",
      "title": "Lower-fee alternatives available",
      "description": "You could save RM 450/year with similar funds...",
      "recommendation": "Review suggested alternatives below"
    }
  ],
  "recommendations": [
    {
      "action": "switch",
      "from_fund": "High Fee Growth Fund",
      "to_fund_id": "fund_xxx",
      "to_fund_name": "Cashku Growth Fund",
      "potential_savings": 450.00,
      "rationale": "Similar returns, lower management fee"
    }
  ],
  "comparison": {
    "current_projected_value_10y": 85000.00,
    "optimized_projected_value_10y": 95000.00,
    "potential_improvement": 10000.00
  }
}
```

### 13.5 Scanner Webhook Events

| Event | Description |
|-------|-------------|
| `scanner.completed` | Analysis complete, report ready |
| `scanner.failed` | Analysis failed |

---

## 14. Content API [OPTIONAL]

The Content API provides educational articles, tips, and learning materials for partner apps.

### 14.1 Scopes

| Scope | Description |
|-------|-------------|
| `content:read` | Access educational content |

### 14.2 List Articles

```http
GET /cowc/v1/content/articles?category=investing&limit=10
Authorization: Bearer {access_token}
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category (investing, savings, retirement, etc.) |
| `tags` | string | Comma-separated tags |
| `limit` | integer | Results per page (max: 50) |
| `offset` | integer | Pagination offset |

**Response:**
```json
{
  "articles": [
    {
      "article_id": "art_xxx",
      "title": "Understanding Unit Trust Fees",
      "summary": "Learn about the different types of fees...",
      "category": "investing",
      "tags": ["fees", "beginner", "unit-trust"],
      "thumbnail_url": "https://...",
      "read_time_minutes": 5,
      "published_at": "2026-01-15T08:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

### 14.3 Get Article

```http
GET /cowc/v1/content/articles/{article_id}
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "article_id": "art_xxx",
  "title": "Understanding Unit Trust Fees",
  "summary": "Learn about the different types of fees...",
  "content_html": "<p>When investing in unit trusts...</p>",
  "content_markdown": "When investing in unit trusts...",
  "category": "investing",
  "tags": ["fees", "beginner", "unit-trust"],
  "author": "Cashku Research Team",
  "thumbnail_url": "https://...",
  "read_time_minutes": 5,
  "published_at": "2026-01-15T08:00:00Z",
  "related_articles": ["art_yyy", "art_zzz"],
  "related_funds": ["fund_xxx"]
}
```

### 14.4 Get Tips

Get contextual investment tips for display in partner app.

```http
GET /cowc/v1/content/tips?context=dashboard&limit=3
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "tips": [
    {
      "tip_id": "tip_xxx",
      "text": "Regular investing (dollar-cost averaging) can help reduce market timing risk.",
      "category": "strategy",
      "action_url": "https://partner.cashku.ai/mma/learn/dca",
      "action_text": "Learn more"
    }
  ]
}
```

---

## 15. Notification Triggers API [OPTIONAL]

The Notification Triggers API allows partners to register for push notification events.

### 15.1 Overview

Partners can register triggers that, when conditions are met, cause the Provider to send a webhook. The partner then delivers the push notification to the user via their own notification system.

### 15.2 Scopes

| Scope | Description |
|-------|-------------|
| `notifications:write` | Manage notification triggers |
| `notifications:read` | View registered triggers |

### 15.3 Register Trigger

```http
POST /cowc/v1/notifications/triggers
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "binding_id": "bind_xxxxxxxxxxxxx",
  "trigger_type": "portfolio_milestone",
  "conditions": {
    "milestone_type": "returns_percent",
    "threshold": 10
  },
  "notification_template": {
    "title": "Congratulations! Your portfolio is up 10%!",
    "body": "Your investments have grown. Tap to see details.",
    "data": {
      "deeplink": "mma://cashku/portfolio"
    }
  }
}
```

**Trigger Types:**

| Type | Description |
|------|-------------|
| `portfolio_milestone` | Portfolio reaches threshold (value, returns %) |
| `fund_nav_change` | Fund NAV changes by threshold |
| `order_status_change` | Order status updates |
| `kyc_status_change` | KYC status updates |
| `new_content` | New article matching tags |
| `inactivity` | User hasn't opened app in N days |

**Response:**
```json
{
  "trigger_id": "trig_xxxxxxxxxxxxx",
  "status": "active",
  "created_at": "2026-02-03T10:00:00Z"
}
```

### 15.4 List Triggers

```http
GET /cowc/v1/notifications/triggers?binding_id={binding_id}
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "triggers": [
    {
      "trigger_id": "trig_xxx",
      "trigger_type": "portfolio_milestone",
      "status": "active",
      "conditions": {
        "milestone_type": "returns_percent",
        "threshold": 10
      },
      "created_at": "2026-02-03T10:00:00Z",
      "last_fired_at": null
    }
  ]
}
```

### 15.5 Delete Trigger

```http
DELETE /cowc/v1/notifications/triggers/{trigger_id}
Authorization: Bearer {access_token}
```

### 15.6 Notification Webhook

When a trigger fires, Provider sends a webhook:

```http
POST {partner_webhook_url}
X-COWC-Event-Type: notification.triggered

{
  "event_id": "evt_xxx",
  "event_type": "notification.triggered",
  "data": {
    "trigger_id": "trig_xxx",
    "binding_id": "bind_xxx",
    "notification": {
      "title": "Congratulations! Your portfolio is up 10%!",
      "body": "Your investments have grown. Tap to see details.",
      "data": {
        "deeplink": "mma://cashku/portfolio"
      }
    },
    "context": {
      "current_returns_percent": 10.5,
      "portfolio_value": 16800.00
    }
  }
}
```

Partner receives this webhook and delivers the push notification via their own system (FCM, APNs, etc.).

---

## Appendix A: Cashku Implementation

This appendix describes Cashku's implementation of the COWC specification.

### A.1 Provider Information

| Field | Value |
|-------|-------|
| Provider Name | Cashku |
| Provider ID | `cashku` |
| Country | Malaysia |
| Regulator | Securities Commission Malaysia |
| Supported Currencies | MYR |

### A.2 Environments

| Environment | Base URL |
|-------------|----------|
| Staging | `https://staging.cashku.ai/cowc/v1` |
| Production | `https://platform.cashku.ai/cowc/v1` |

### A.3 Getting Started

1. Contact tech@cashku.my for partner agreement
2. Receive credentials (client_id, client_secret, api_key)
3. Integrate using staging environment
4. Complete certification testing
5. Go live on production

### A.4 Credentials Format

```
Client ID:     ck_partner_{partner_code}_{random}
Client Secret: cs_{random_64_chars}
API Key:       pk_{environment}_{random}
```

### A.5 Additional Scopes

| Scope | Description |
|-------|-------------|
| `x-cashku:goals:read` | View investment goals |
| `x-cashku:goals:write` | Create/modify goals |
| `x-cashku:prs:read` | View PRS account |
| `scanner:read` | Access portfolio scanner reports |
| `scanner:write` | Submit portfolios for scanning |
| `content:read` | Access educational content |
| `notifications:read` | View notification triggers |
| `notifications:write` | Manage notification triggers |

### A.6 Mini-App (Partner Portal)

Cashku offers a hosted Mini-App for partners who want a full Cashku experience embedded in their app:

| URL | Description |
|-----|-------------|
| `partner.cashku.ai/{partner}/` | Full Cashku experience |
| `partner.cashku.ai/{partner}/scanner` | Portfolio Scanner entry |
| `partner.cashku.ai/{partner}/learn` | Educational content entry |

Partners can customize branding (logo, colors) via the partner dashboard.

**Mini-App Benefits:**
- Fastest integration path (WebView only)
- All features included automatically
- Cashku handles all updates and maintenance
- Full regulatory compliance built-in

### A.7 Payment Methods

Cashku supports:
- FPX (Malaysian online banking)

### A.8 Fund Categories

- `equity` - Equity funds
- `bond` - Fixed income funds
- `money_market` - Money market funds
- `balanced` - Balanced/mixed funds
- `prs` - Private Retirement Scheme

### A.9 Risk Levels

- `conservative`
- `moderately_conservative`
- `moderate`
- `moderately_aggressive`
- `aggressive`

### A.10 Test Scenarios

| Scenario | Test Data |
|----------|-----------|
| Successful onboarding | Email: `success@test.cashku.ai` |
| KYC rejection | Email: `kyc.fail@test.cashku.ai` |
| Payment success | Use FPX test bank (Maybank - success) |
| Payment failure | Use FPX test bank (CIMB - failure) |

### A.11 Rate Limits

| Environment | Requests/Minute | Requests/Hour |
|-------------|-----------------|---------------|
| Staging | 60 | 1,000 |
| Production | 120 | 5,000 |

### A.12 Support

**Technical Support:** tech@cashku.my

### A.13 Compliance

- Malaysian PDPA compliant
- SC Malaysia licensed
- AMLA/AML compliant

---

## Appendix B: Reference Implementations

*(Future: Links to SDK repositories and sample code)*

---

## Appendix C: Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02 | Initial draft |
| 1.1.0 | 2026-02 | Added Portfolio Scanner API (Section 13), Content API (Section 14), Notification Triggers API (Section 15), Mini-App documentation |

---

## License

This specification is licensed under the Apache License, Version 2.0.

Copyright 2026 Cashku

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
