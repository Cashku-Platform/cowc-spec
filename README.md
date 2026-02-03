# Cashku Open Wealth Connect (COWC)

An open standard for integrating investment and wealth management capabilities into third-party applications.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Spec Version](https://img.shields.io/badge/Spec-v1.0.0-green.svg)](spec/COWC_SPECIFICATION.md)

## Overview

COWC enables partner apps (super apps, lifestyle apps, banking apps) to offer investment features to their users through a standardized API. Partners integrate once, and can connect to any COWC-compliant wealth provider.

### Key Features

- **OAuth 2.0 Authentication** - Secure partner and user authentication
- **User Linking with Consent** - Privacy-first account binding
- **Fund Discovery API** - Browse available investment funds
- **Portfolio API** - View holdings and performance
- **Order API** - Place subscription and redemption orders
- **Embedded Flows** - WebView-based onboarding and payments
- **Webhooks** - Real-time event notifications

## Quick Links

| Resource | Description |
|----------|-------------|
| [COWC Specification](spec/COWC_SPECIFICATION.md) | Full technical specification |
| [Node.js Sample](samples/node/) | Server-side integration example |
| [Python Sample](samples/python/) | Python integration example |
| [Flutter Sample](samples/flutter/) | Mobile app integration |
| [Swift Sample](samples/swift/) | iOS native integration |
| [Kotlin Sample](samples/kotlin/) | Android native integration |
| [Postman Collection](postman/) | API testing collection |

## Providers

COWC is implemented by:

| Provider | Country | Status |
|----------|---------|--------|
| [Cashku](providers/cashku/) | Malaysia | Live |

*Want to become a COWC provider? [Open an issue](../../issues) or contact us.*

## Getting Started

### 1. Choose a Provider

Select a COWC provider from the list above. Each provider has their own:
- Base URL (staging/production)
- Partner registration process
- Supported features

### 2. Get Credentials

Contact your chosen provider to receive:
- Client ID
- Client Secret
- API Key

### 3. Integrate

```javascript
// Example: Get access token
const response = await fetch('https://provider.example/cowc/v1/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: 'your_client_id',
    client_secret: 'your_client_secret',
    scope: 'funds:read portfolio:read orders:write'
  })
});

const { access_token } = await response.json();
```

See [samples/](samples/) for complete integration examples.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Partner Application                       │
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
└─────────────────────────────────────────────────────────────┘
```

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cowc/v1/oauth/token` | POST | Get access token |
| `/cowc/v1/flows/onboarding` | POST | Start user onboarding |
| `/cowc/v1/flows/link` | POST | Link existing user |
| `/cowc/v1/bindings/{id}` | GET | Get binding status |
| `/cowc/v1/funds` | GET | List available funds |
| `/cowc/v1/funds/{id}` | GET | Get fund details |
| `/cowc/v1/bindings/{id}/portfolio` | GET | Get portfolio summary |
| `/cowc/v1/bindings/{id}/holdings` | GET | Get holdings |
| `/cowc/v1/orders/preview` | POST | Preview order |
| `/cowc/v1/orders` | POST | Create order |
| `/cowc/v1/orders/{id}` | GET | Get order status |

## Scopes

| Scope | Description |
|-------|-------------|
| `funds:read` | List and view fund details |
| `portfolio:read` | View user holdings and performance |
| `transactions:read` | View transaction history |
| `orders:write` | Submit orders |
| `orders:read` | View order status |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

- Report bugs or suggest features via [Issues](../../issues)
- Improve documentation
- Add sample code in new languages
- Become a COWC provider

## License

This specification is licensed under the [Apache License 2.0](LICENSE).

## Created By

**Cashku** - [cashku.ai](https://cashku.ai)

Building the future of accessible investing in Southeast Asia.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
