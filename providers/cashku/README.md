# Cashku - COWC Provider

Cashku is the reference implementation of the Cashku Open Wealth Connect (COWC) specification.

## Provider Information

| Field | Value |
|-------|-------|
| Provider Name | Cashku |
| Provider ID | `cashku` |
| Country | Malaysia |
| Regulator | Securities Commission Malaysia |
| Currencies | MYR |
| Website | [cashku.ai](https://cashku.ai) |

## Environments

| Environment | Base URL | Purpose |
|-------------|----------|---------|
| Staging | `https://staging.cashku.ai/cowc/v1` | Development & testing |
| Production | `https://platform.cashku.ai/cowc/v1` | Live environment |

## Getting Started

### 1. Partner Registration

Contact **tech@cashku.my** to become a COWC partner.

You will need to provide:
- Company information
- Use case description
- Technical contact details
- Webhook endpoint URL

### 2. Receive Credentials

After approval, you will receive:

```
Client ID:     ck_partner_{your_code}_{random}
Client Secret: cs_{64_random_characters}
API Key:       pk_{environment}_{random}
Webhook Secret: wh_{random}
```

### 3. Integrate

Use the staging environment for development. See the [Quick Start Guide](./QUICKSTART.md) for step-by-step instructions.

### 4. Go Live

After testing:
1. Complete certification checklist
2. Receive production credentials
3. Switch to production base URL

## Supported Features

### Core COWC Features

| Feature | Status |
|---------|--------|
| OAuth 2.0 Authentication | ✅ Supported |
| User Linking (Onboarding) | ✅ Supported |
| User Linking (Existing) | ✅ Supported |
| Fund Discovery | ✅ Supported |
| Portfolio API | ✅ Supported |
| Order API | ✅ Supported |
| Webhooks | ✅ Supported |

### Cashku Extensions

| Feature | Scope | Description |
|---------|-------|-------------|
| Investment Goals | `x-cashku:goals:read/write` | Goal-based investing |
| PRS Account | `x-cashku:prs:read` | Private Retirement Scheme |
| Direct Debit | `x-cashku:directdebit:read/write` | Recurring investments |
| Portfolio Scanner | `scanner:read/write` | AI-powered portfolio analysis |
| Content/Learn | `content:read` | Educational articles and tips |
| Notifications | `notifications:read/write` | Push notification triggers |

### Mini-App (Partner Portal)

Cashku offers a hosted Mini-App for partners:

| URL | Description |
|-----|-------------|
| `partner.cashku.ai/{partner}/` | Full Cashku experience |
| `partner.cashku.ai/{partner}/scanner` | Portfolio Scanner entry |
| `partner.cashku.ai/{partner}/learn` | Educational content entry |

## Fund Categories

| Category | Description |
|----------|-------------|
| `equity` | Equity funds |
| `bond` | Fixed income funds |
| `money_market` | Money market funds |
| `balanced` | Balanced/mixed funds |
| `prs` | Private Retirement Scheme |

## Risk Levels

| Level | Description |
|-------|-------------|
| `conservative` | Low risk tolerance |
| `moderately_conservative` | Below average risk |
| `moderate` | Average risk tolerance |
| `moderately_aggressive` | Above average risk |
| `aggressive` | High risk tolerance |

## Payment Methods

| Method | Description |
|--------|-------------|
| FPX | Malaysian online banking (real-time) |

## Rate Limits

| Environment | Requests/Minute | Requests/Hour |
|-------------|-----------------|---------------|
| Staging | 60 | 1,000 |
| Production | 120 | 5,000 |

Higher limits available for enterprise partners.

## Testing

### Test Credentials

Contact tech@cashku.my for staging credentials.

### Test Scenarios

| Scenario | How to Test |
|----------|-------------|
| Successful onboarding | Email: `success@test.cashku.ai` |
| KYC rejection | Email: `kyc.fail@test.cashku.ai` |
| Payment success | FPX test bank: Maybank (success) |
| Payment failure | FPX test bank: CIMB (failure) |
| Payment timeout | FPX test bank: RHB (timeout) |

### Sandbox Limitations

- No real payments processed
- Test funds with simulated NAV
- Webhooks may have slight delays

## Compliance

- Malaysian PDPA compliant
- SC Malaysia licensed (CMSL)
- AMLA/AML compliant
- Shariah-compliant fund options available

## Support

| Type | Contact |
|------|---------|
| Technical Support | tech@cashku.my |
| Partnership Inquiries | partnerships@cashku.my |

## Documentation

- [COWC Specification](../../spec/COWC_SPECIFICATION.md) - Full API specification
- [Quick Start Guide](./QUICKSTART.md) - Get started in 5 minutes
- [Sample Code](../../samples/) - Integration examples
