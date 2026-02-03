# COWC Node.js Sample

A Node.js implementation example for integrating with COWC providers.

## Requirements

- Node.js 18+
- npm or yarn

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
COWC_BASE_URL=https://staging.cashku.ai/cowc/v1
COWC_CLIENT_ID=your_client_id
COWC_CLIENT_SECRET=your_client_secret
COWC_API_KEY=your_api_key
COWC_WEBHOOK_SECRET=your_webhook_secret
```

## Usage

### Authentication

```javascript
import { COWCClient } from './src/auth.js';

const client = new COWCClient({
  baseUrl: process.env.COWC_BASE_URL,
  clientId: process.env.COWC_CLIENT_ID,
  clientSecret: process.env.COWC_CLIENT_SECRET,
  apiKey: process.env.COWC_API_KEY
});

await client.authenticate();
```

### List Funds

```javascript
import { listFunds, getFund } from './src/funds.js';

const funds = await listFunds(client, { category: 'equity' });
const fundDetails = await getFund(client, 'fund_xxx');
```

### Get Portfolio

```javascript
import { getPortfolio, getHoldings } from './src/portfolio.js';

const portfolio = await getPortfolio(client, 'bind_xxx');
const holdings = await getHoldings(client, 'bind_xxx');
```

### Create Order

```javascript
import { previewOrder, createOrder } from './src/orders.js';

const preview = await previewOrder(client, {
  bindingId: 'bind_xxx',
  fundId: 'fund_xxx',
  amount: 1000
});

const order = await createOrder(client, {
  bindingId: 'bind_xxx',
  fundId: 'fund_xxx',
  amount: 1000
});
```

### Verify Webhook

```javascript
import { verifyWebhook } from './src/webhooks.js';

const isValid = verifyWebhook(
  payload,
  signature,
  timestamp,
  process.env.COWC_WEBHOOK_SECRET
);
```

## Running Examples

```bash
# Run all examples
npm start

# Run specific example
node src/auth.js
```

## License

Apache 2.0
