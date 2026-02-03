/**
 * COWC Portfolio Module
 *
 * Functions for viewing portfolio and holdings.
 */

/**
 * Get portfolio summary
 * @param {COWCClient} client - Authenticated COWC client
 * @param {string} bindingId - User binding ID
 * @returns {Promise<Object>} Portfolio summary
 */
export async function getPortfolio(client, bindingId) {
  return client.request(`/bindings/${bindingId}/portfolio`);
}

/**
 * Get holdings
 * @param {COWCClient} client - Authenticated COWC client
 * @param {string} bindingId - User binding ID
 * @returns {Promise<Object>} Holdings list
 */
export async function getHoldings(client, bindingId) {
  return client.request(`/bindings/${bindingId}/holdings`);
}

/**
 * Get transaction history
 * @param {COWCClient} client - Authenticated COWC client
 * @param {string} bindingId - User binding ID
 * @param {Object} options - Query options
 * @param {string} options.from - Start date (YYYY-MM-DD)
 * @param {string} options.to - End date (YYYY-MM-DD)
 * @param {number} options.limit - Results per page
 * @param {number} options.offset - Pagination offset
 * @returns {Promise<Object>} Transaction history
 */
export async function getTransactions(client, bindingId, options = {}) {
  const params = new URLSearchParams();

  if (options.from) params.append('from', options.from);
  if (options.to) params.append('to', options.to);
  if (options.limit) params.append('limit', options.limit);
  if (options.offset) params.append('offset', options.offset);

  const query = params.toString();
  const endpoint = `/bindings/${bindingId}/transactions${query ? '?' + query : ''}`;

  return client.request(endpoint);
}

/**
 * Get binding status
 * @param {COWCClient} client - Authenticated COWC client
 * @param {string} bindingId - User binding ID
 * @returns {Promise<Object>} Binding status
 */
export async function getBindingStatus(client, bindingId) {
  return client.request(`/bindings/${bindingId}`);
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

  const bindingId = process.env.TEST_BINDING_ID || 'bind_xxx';

  try {
    // Get portfolio summary
    const portfolio = await getPortfolio(client, bindingId);
    console.log('Total Value:', portfolio.total_value?.amount, portfolio.total_value?.currency);
    console.log('Total Returns:', portfolio.total_returns?.percent + '%');

    // Get holdings
    const holdings = await getHoldings(client, bindingId);
    console.log('\nHoldings:');
    holdings.holdings?.forEach(h => {
      console.log(`- ${h.fund_name}: ${h.units} units @ ${h.current_nav}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}
