/**
 * COWC Authentication Module
 *
 * Handles OAuth 2.0 Client Credentials flow for partner authentication.
 */

/**
 * COWC API Client
 */
export class COWCClient {
  /**
   * @param {Object} config
   * @param {string} config.baseUrl - Provider base URL (e.g., https://staging.cashku.ai/cowc/v1)
   * @param {string} config.clientId - Partner client ID
   * @param {string} config.clientSecret - Partner client secret
   * @param {string} config.apiKey - Partner API key
   */
  constructor({ baseUrl, clientId, clientSecret, apiKey }) {
    this.baseUrl = baseUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.apiKey = apiKey;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with the COWC provider
   * @param {string[]} scopes - Requested scopes
   * @returns {Promise<string>} Access token
   */
  async authenticate(scopes = ['funds:read', 'portfolio:read', 'orders:write']) {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: scopes.join(' ')
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Authentication failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return this.accessToken;
  }

  /**
   * Check if token is expired (with 5 min buffer)
   * @returns {boolean}
   */
  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    return Date.now() > (this.tokenExpiry - 5 * 60 * 1000);
  }

  /**
   * Ensure we have a valid token
   */
  async ensureAuthenticated() {
    if (this.isTokenExpired()) {
      await this.authenticate();
    }
  }

  /**
   * Make an authenticated API request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}) {
    await this.ensureAuthenticated();

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'X-COWC-Partner-Key': this.apiKey,
      'X-COWC-Request-ID': crypto.randomUUID(),
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error?.message || 'Request failed');
      error.code = data.error?.code;
      error.details = data.error?.details;
      error.status = response.status;
      throw error;
    }

    return data;
  }
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const client = new COWCClient({
    baseUrl: process.env.COWC_BASE_URL || 'https://staging.cashku.ai/cowc/v1',
    clientId: process.env.COWC_CLIENT_ID,
    clientSecret: process.env.COWC_CLIENT_SECRET,
    apiKey: process.env.COWC_API_KEY
  });

  try {
    const token = await client.authenticate();
    console.log('Authentication successful!');
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
  } catch (error) {
    console.error('Authentication failed:', error.message);
  }
}
