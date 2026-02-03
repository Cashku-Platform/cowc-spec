# COWC Python Sample

A Python implementation example for integrating with COWC providers.

## Requirements

- Python 3.9+
- pip

## Installation

```bash
pip install -r requirements.txt
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

```python
from cowc_client import COWCClient

client = COWCClient(
    base_url="https://staging.cashku.ai/cowc/v1",
    client_id="your_client_id",
    client_secret="your_client_secret",
    api_key="your_api_key"
)

# Authenticate
client.authenticate()

# List funds
funds = client.list_funds(category="equity")

# Get portfolio
portfolio = client.get_portfolio("bind_xxx")

# Create order
order = client.create_order(
    binding_id="bind_xxx",
    fund_id="fund_xxx",
    amount=1000
)
```

## Running

```bash
python cowc_client.py
```

## License

Apache 2.0
