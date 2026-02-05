# Cashku x MMA Integration - Scope of Works

## Project Overview

Integration of Cashku investment features into the MMA mobile application, enabling MMA members to access unit trust investments directly within their existing app.

## Parties

| Party | Role | Entity |
|-------|------|--------|
| **Provider** | Investment platform provider | Cashku Sdn Bhd |
| **Partner** | Mobile application owner | Malaysian Medical Association (MMA) |

## Integration Approach

**Mini-App + API Hybrid**

| Option | Description | MMA Effort |
|--------|-------------|------------|
| Primary: Mini-App | Cashku Mini-App embedded via WebView at `partner.cashku.ai/mma/` | Low |
| Optional: Native API | API integration for custom native UI | Medium |

```
Option A: API Integration     │  Option B: Mini-App
┌─────────────┐ ┌──────────┐  │  ┌────────────────────┐
│ Native UI   │ │ WebView  │  │  │ Full WebView       │
│ - Portfolio │ │ Flows    │  │  │ (Cashku for MMA)   │
│ - Funds     │ │ - eKYC   │  │  │ partner.cashku.ai  │
│ - Scanner   │ │ - Payment│  │  │ /mma/              │
└─────────────┘ └──────────┘  │  └────────────────────┘
```

---

## Scope

### In Scope (Cashku Delivers)

| Item | Description | Phase |
|------|-------------|-------|
| Partner Gateway | OAuth 2.0 authentication, COWC API endpoints | Phase 1 |
| Mini-App Portal | `partner.cashku.ai/mma/` - Full Cashku investment experience | Phase 2 |
| Onboarding Flow | User registration, eKYC, risk assessment | Phase 2 |
| User Linking | Bind MMA users to Cashku accounts (IUTA model) | Phase 2 |
| Fund Discovery | Browse, search, and filter available funds | Phase 2 |
| Investment Flow | Fund subscription, redemption, switching | Phase 3 |
| Payment Integration | FPX payment processing via WebView | Phase 3 |
| Portfolio View | Holdings, performance, transaction history | Phase 3 |
| Webhooks | Real-time event notifications to MMA servers | Phase 3 |
| Portfolio Scanner | AI-powered portfolio analysis (free lead-gen feature) | Phase 4 |
| Content API | Educational articles and investment tips | Phase 4 |
| Notification Triggers | Push notification integration with MMA's system | Phase 4 |
| Staging Environment | Full testing environment with test data | Phase 1 |
| Technical Documentation | COWC specification, Quick Start guide, sample code | Phase 1 |

### In Scope (MMA Delivers)

| Item | Description |
|------|-------------|
| WebView Integration | Open Mini-App URLs in WebView component |
| Deep Link Handling | Intercept and process `mma://` callback URLs |
| Binding Storage | Store user ↔ binding_id mapping securely |
| Webhook Endpoint | HTTPS endpoint to receive and process webhook events |
| Push Notifications | Deliver notifications from Cashku triggers via MMA's push system |
| App Entry Points | Dashboard icon, menu item, promotional banners |
| User Authentication | MMA handles their own user auth (Cashku receives partner_user_id) |

### Out of Scope

| Item | Reason |
|------|--------|
| Native portfolio UI | Unless MMA opts for API integration approach |
| MMA user authentication | MMA handles their own authentication system |
| MMA app development | MMA responsible for their app development and deployment |
| MMA app store submission | MMA responsible for app store processes |
| Payment gateway setup | Cashku uses existing FPX integration |
| Regulatory licensing | Cashku already holds required SC Malaysia licenses |

---

## Deliverables

| # | Deliverable | Owner | Format | Phase |
|---|-------------|-------|--------|-------|
| 1 | Partner API credentials (staging) | Cashku | Secure handoff | 1 |
| 2 | Partner API credentials (production) | Cashku | Secure handoff | 5 |
| 3 | COWC Technical Specification | Cashku | Markdown/PDF | 1 |
| 4 | MMA Quick Start Guide | Cashku | Markdown | 1 |
| 5 | Postman Collection | Cashku | JSON | 1 |
| 6 | Mini-App Portal (staging) | Cashku | Web application | 2 |
| 7 | Mini-App Portal (production) | Cashku | Web application | 5 |
| 8 | Sample Code (Flutter) | Cashku | Source code | 1 |
| 9 | Sample Code (Swift/Kotlin) | Cashku | Source code | 1 |
| 10 | Webhook endpoint | MMA | HTTPS URL | 3 |
| 11 | Integration in MMA app | MMA | Mobile app | 3 |
| 12 | UAT sign-off | MMA | Document | 5 |

---

## Phases

| Phase | Name | Milestone |
|-------|------|-----------|
| Phase 1 | Foundation | OAuth + basic APIs ready, documentation delivered |
| Phase 2 | User Linking & Mini-App | Mini-App portal live, onboarding flow complete |
| Phase 3 | Transactions | Full investment flow, payments, webhooks |
| Phase 4 | Extended Features | Portfolio Scanner, Content API, Notifications |
| Phase 5 | Production Readiness | Security audit, production deployment, go-live |

### Phase Details

#### Phase 1: Foundation
- OAuth 2.0 authentication implementation
- Basic COWC API endpoints
- Staging environment setup
- Documentation and sample code delivery
- MMA receives staging credentials

#### Phase 2: User Linking & Mini-App
- User binding (IUTA model) implementation
- eKYC integration
- Risk assessment flow
- Mini-App portal development
- Fund discovery APIs

#### Phase 3: Transactions
- Order placement APIs
- FPX payment integration
- Portfolio APIs
- Webhook system
- MMA webhook endpoint integration

#### Phase 4: Extended Features
- Portfolio Scanner (AI analysis)
- Content API (articles, tips)
- Notification triggers
- Mini-App enhancements

#### Phase 5: Production Readiness
- Security audit and penetration testing
- Rate limiting and monitoring
- Production environment setup
- Go-live checklist completion
- Production deployment

---

## Acceptance Criteria

### Functional Requirements

| # | Requirement | Validation Method |
|---|-------------|-------------------|
| 1 | User can complete onboarding via Mini-App | End-to-end test |
| 2 | User can complete eKYC and receive approval | Test with staging credentials |
| 3 | User can browse funds and view fund details | API response validation |
| 4 | User can place subscription order | Order creation test |
| 5 | User can complete FPX payment | Payment flow test |
| 6 | User can view portfolio summary and holdings | Portfolio API test |
| 7 | MMA receives webhooks for key events | Webhook delivery test |
| 8 | Portfolio Scanner returns analysis results | Scanner API test |
| 9 | Content API returns articles and tips | Content API test |

### Non-Functional Requirements

| # | Requirement | Target |
|---|-------------|--------|
| 1 | API response time (p95) | < 2 seconds |
| 2 | API availability | 99.5% uptime |
| 3 | Webhook delivery | Within 30 seconds of event |
| 4 | Mini-App load time | < 3 seconds |
| 5 | Concurrent users supported | 1,000+ |

---

## Security & Compliance

### Data Protection

| Aspect | Implementation |
|--------|----------------|
| PII Handling | IUTA model - MMA never receives user PII |
| Data Encryption | TLS 1.3 for all API communications |
| Token Security | OAuth tokens expire after 1 hour |
| Webhook Security | HMAC-SHA256 signature verification |

### Regulatory Compliance

| Requirement | Status |
|-------------|--------|
| SC Malaysia CMSL License | Cashku holds required license |
| Malaysian PDPA | Compliant |
| AML/CFT Requirements | Cashku handles all compliance |
| Shariah Compliance | Shariah-compliant fund options available |

---

## Support

### During Integration

| Type | Contact | Hours |
|------|---------|-------|
| Technical Support | tech@cashku.my | Mon-Fri, 9am-6pm MYT |
| Integration Queries | Direct Slack channel | Business hours |
| Escalation | partnerships@cashku.my | As needed |

### Post Go-Live

| Type | Contact | SLA |
|------|---------|-----|
| Technical Support | tech@cashku.my | 4-hour response |
| Critical Issues | Emergency hotline | 1-hour response |
| Documentation | COWC Specification + Quick Start Guide | Self-service |

---

## Change Management

Any changes to scope or deliverables must be:

1. Documented in writing
2. Agreed by both parties
3. Assessed for impact on resources
4. Formally approved before implementation

---

## Appendices

### Appendix A: Related Documents

| Document | Location |
|----------|----------|
| COWC Specification | `cowc-spec/spec/COWC_SPECIFICATION.md` |
| MMA Get Started Guide | `cowc-spec/providers/cashku/MMA_GET_STARTED.md` |
| Postman Collection | `cowc-spec/postman/COWC.postman_collection.json` |
| Sample Code | `cowc-spec/samples/` |

### Appendix B: Glossary

| Term | Definition |
|------|------------|
| COWC | Cashku Open Wealth Connect - API specification |
| IUTA | Identity Under Third-party Administration |
| Mini-App | Embedded web application within partner app |
| Binding | Link between partner user and Cashku account |
| eKYC | Electronic Know Your Customer verification |
| FPX | Financial Process Exchange (Malaysian online banking) |
