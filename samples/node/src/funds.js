/**
 * COWC Fund Discovery Module
 *
 * Functions for listing and viewing fund details.
 */

/**
 * List available funds
 * @param {COWCClient} client - Authenticated COWC client
 * @param {Object} filters - Optional filters
 * @param {string} filters.category - Fund category (equity, bond, money_market, balanced)
 * @param {string} filters.riskLevel - Risk level (conservative, moderate, aggressive)
 * @param {boolean} filters.isShariah - Filter for Shariah-compliant funds
 * @param {string} filters.currency - Currency code (e.g., MYR)
 * @param {number} filters.limit - Results per page (default: 20)
 * @param {number} filters.offset - Pagination offset
 * @returns {Promise<Object>} Funds list with pagination
 */
export async function listFunds(client, filters = {}) {
  const params = new URLSearchParams();

  if (filters.category) params.append('category', filters.category);
  if (filters.riskLevel) params.append('risk_level', filters.riskLevel);
  if (filters.isShariah !== undefined) params.append('is_shariah', filters.isShariah);
  if (filters.currency) params.append('currency', filters.currency);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const query = params.toString();
  const endpoint = `/funds${query ? '?' + query : ''}`;

  return client.request(endpoint);
}

/**
 * Get fund details
 * @param {COWCClient} client - Authenticated COWC client
 * @param {string} fundId - Fund ID
 * @returns {Promise<Object>} Fund details
 */
export async function getFund(client, fundId) {
  return client.request(`/funds/${fundId}`);
}

/**
 * Get fund NAV history
 * @param {COWCClient} client - Authenticated COWC client
 * @param {string} fundId - Fund ID
 * @param {string} from - Start date (YYYY-MM-DD)
 * @param {string} to - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} NAV history
 */
export async function getFundNAV(client, fundId, from, to) {
  const params = new URLSearchParams({ from, to });
  return client.request(`/funds/${fundId}/nav?${params}`);
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  import { COWCClient } from './auth.js';

  const client = new COWCClient({
    baseUrl: process.env.COWC_BASE_URL || 'https://staging.cashku.ai/cowc/v1',
    clientId: process.env.COWC_CLIENT_ID,
    clientSecret: process.env.COWC_CLIENT_SECRET,
    apiKey: process.env.COWC_API_KEY
  });

  try {
    // List equity funds
    const funds = await listFunds(client, { category: 'equity', limit: 10 });
    console.log('Funds found:', funds.pagination?.total);

    if (funds.funds?.length > 0) {
      // Get details of first fund
      const fundDetails = await getFund(client, funds.funds[0].fund_id);
      console.log('Fund details:', fundDetails.fund_name);
      console.log('Current NAV:', fundDetails.current_nav);
      console.log('YTD Return:', fundDetails.performance?.ytd_percent + '%');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}
