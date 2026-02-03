"""
COWC Python Client

A Python client for integrating with COWC providers.
"""

import os
import time
import uuid
import hmac
import hashlib
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode

import requests
from dotenv import load_dotenv

load_dotenv()


class COWCClient:
    """COWC API Client"""

    def __init__(
        self,
        base_url: str,
        client_id: str,
        client_secret: str,
        api_key: str
    ):
        self.base_url = base_url.rstrip('/')
        self.client_id = client_id
        self.client_secret = client_secret
        self.api_key = api_key
        self.access_token: Optional[str] = None
        self.token_expiry: Optional[float] = None

    def authenticate(self, scopes: List[str] = None) -> str:
        """
        Authenticate with the COWC provider using OAuth 2.0 Client Credentials.

        Args:
            scopes: List of requested scopes

        Returns:
            Access token
        """
        if scopes is None:
            scopes = ['funds:read', 'portfolio:read', 'orders:write']

        response = requests.post(
            f"{self.base_url}/oauth/token",
            data={
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'scope': ' '.join(scopes)
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        response.raise_for_status()

        data = response.json()
        self.access_token = data['access_token']
        self.token_expiry = time.time() + data['expires_in']

        return self.access_token

    def _is_token_expired(self) -> bool:
        """Check if token is expired (with 5 min buffer)"""
        if not self.token_expiry:
            return True
        return time.time() > (self.token_expiry - 300)

    def _ensure_authenticated(self):
        """Ensure we have a valid token"""
        if self._is_token_expired():
            self.authenticate()

    def _request(
        self,
        method: str,
        endpoint: str,
        params: Dict = None,
        json: Dict = None
    ) -> Dict[str, Any]:
        """Make an authenticated API request"""
        self._ensure_authenticated()

        url = f"{self.base_url}{endpoint}"
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'X-COWC-Partner-Key': self.api_key,
            'X-COWC-Request-ID': str(uuid.uuid4()),
            'Content-Type': 'application/json'
        }

        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            params=params,
            json=json
        )

        data = response.json()

        if not response.ok:
            error = data.get('error', {})
            raise COWCError(
                message=error.get('message', 'Request failed'),
                code=error.get('code'),
                details=error.get('details'),
                status=response.status_code
            )

        return data

    # Fund Discovery API

    def list_funds(
        self,
        category: str = None,
        risk_level: str = None,
        is_shariah: bool = None,
        currency: str = None,
        limit: int = None,
        offset: int = None
    ) -> Dict[str, Any]:
        """List available funds"""
        params = {}
        if category:
            params['category'] = category
        if risk_level:
            params['risk_level'] = risk_level
        if is_shariah is not None:
            params['is_shariah'] = str(is_shariah).lower()
        if currency:
            params['currency'] = currency
        if limit:
            params['limit'] = limit
        if offset:
            params['offset'] = offset

        return self._request('GET', '/funds', params=params)

    def get_fund(self, fund_id: str) -> Dict[str, Any]:
        """Get fund details"""
        return self._request('GET', f'/funds/{fund_id}')

    def get_fund_nav(self, fund_id: str, from_date: str, to_date: str) -> Dict[str, Any]:
        """Get fund NAV history"""
        return self._request('GET', f'/funds/{fund_id}/nav', params={
            'from': from_date,
            'to': to_date
        })

    # Portfolio API

    def get_portfolio(self, binding_id: str) -> Dict[str, Any]:
        """Get portfolio summary"""
        return self._request('GET', f'/bindings/{binding_id}/portfolio')

    def get_holdings(self, binding_id: str) -> Dict[str, Any]:
        """Get holdings"""
        return self._request('GET', f'/bindings/{binding_id}/holdings')

    def get_transactions(
        self,
        binding_id: str,
        from_date: str = None,
        to_date: str = None,
        limit: int = None
    ) -> Dict[str, Any]:
        """Get transaction history"""
        params = {}
        if from_date:
            params['from'] = from_date
        if to_date:
            params['to'] = to_date
        if limit:
            params['limit'] = limit

        return self._request('GET', f'/bindings/{binding_id}/transactions', params=params)

    def get_binding_status(self, binding_id: str) -> Dict[str, Any]:
        """Get binding status"""
        return self._request('GET', f'/bindings/{binding_id}')

    # Order API

    def preview_order(
        self,
        binding_id: str,
        fund_id: str,
        amount: float,
        order_type: str = 'subscription',
        currency: str = 'MYR'
    ) -> Dict[str, Any]:
        """Preview an order"""
        return self._request('POST', '/orders/preview', json={
            'binding_id': binding_id,
            'fund_id': fund_id,
            'order_type': order_type,
            'amount': amount,
            'currency': currency
        })

    def create_order(
        self,
        binding_id: str,
        fund_id: str,
        amount: float,
        order_type: str = 'subscription',
        currency: str = 'MYR',
        partner_reference_id: str = None
    ) -> Dict[str, Any]:
        """Create an order"""
        return self._request('POST', '/orders', json={
            'binding_id': binding_id,
            'fund_id': fund_id,
            'order_type': order_type,
            'amount': amount,
            'currency': currency,
            'partner_reference_id': partner_reference_id
        })

    def get_order(self, order_id: str) -> Dict[str, Any]:
        """Get order status"""
        return self._request('GET', f'/orders/{order_id}')


class COWCError(Exception):
    """COWC API Error"""

    def __init__(self, message: str, code: str = None, details: Dict = None, status: int = None):
        super().__init__(message)
        self.code = code
        self.details = details
        self.status = status


def verify_webhook(
    payload: str,
    signature: str,
    timestamp: str,
    secret: str,
    max_age: int = 300
) -> bool:
    """
    Verify webhook signature.

    Args:
        payload: Raw request body
        signature: X-COWC-Signature header value
        timestamp: X-COWC-Timestamp header value
        secret: Webhook secret
        max_age: Maximum age in seconds (default: 300)

    Returns:
        True if signature is valid
    """
    # Check timestamp
    try:
        ts = int(timestamp)
        if abs(time.time() - ts) > max_age:
            return False
    except ValueError:
        return False

    # Calculate expected signature
    signed_payload = f"{timestamp}.{payload}"
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()

    # Constant-time comparison
    return hmac.compare_digest(signature, expected)


# Example usage
if __name__ == '__main__':
    client = COWCClient(
        base_url=os.getenv('COWC_BASE_URL', 'https://staging.cashku.ai/cowc/v1'),
        client_id=os.getenv('COWC_CLIENT_ID', ''),
        client_secret=os.getenv('COWC_CLIENT_SECRET', ''),
        api_key=os.getenv('COWC_API_KEY', '')
    )

    try:
        # Authenticate
        print("Authenticating...")
        client.authenticate()
        print("✓ Authentication successful\n")

        # List funds
        print("Listing funds...")
        funds = client.list_funds(limit=5)
        print(f"✓ Found {funds.get('pagination', {}).get('total', 0)} funds\n")

        for fund in funds.get('funds', [])[:3]:
            print(f"  - {fund['fund_name']} (NAV: {fund['current_nav']})")

    except COWCError as e:
        print(f"Error: {e}")
        if e.code:
            print(f"Code: {e.code}")
    except Exception as e:
        print(f"Error: {e}")
