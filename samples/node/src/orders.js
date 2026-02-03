/**
 * COWC Orders Module
 *
 * Functions for previewing and creating orders.
 */

/**
 * Preview an order (calculate fees and indicative units)
 * @param {COWCClient} client - Authenticated COWC client
 * @param {Object} order - Order details
 * @param {string} order.bindingId - User binding ID
 * @param {string} order.fundId - Fund ID
 * @param {string} order.orderType - Order type (subscription, redemption)
 * @param {number} order.amount - Order amount
 * @param {string} order.currency - Currency (default: MYR)
 * @returns {Promise<Object>} Order preview
 */
export async function previewOrder(client, { bindingId, fundId, orderType = 'subscription', amount, currency = 'MYR' }) {
  return client.request('/orders/preview', {
    method: 'POST',
    body: JSON.stringify({
      binding_id: bindingId,
      fund_id: fundId,
      order_type: orderType,
      amount,
      currency
    })
  });
}

/**
 * Create an order
 * @param {COWCClient} client - Authenticated COWC client
 * @param {Object} order - Order details
 * @param {string} order.bindingId - User binding ID
 * @param {string} order.fundId - Fund ID
 * @param {string} order.orderType - Order type (subscription, redemption)
 * @param {number} order.amount - Order amount
 * @param {string} order.currency - Currency (default: MYR)
 * @param {string} order.partnerReferenceId - Your reference ID
 * @returns {Promise<Object>} Created order with payment flow URL
 */
export async function createOrder(client, { bindingId, fundId, orderType = 'subscription', amount, currency = 'MYR', partnerReferenceId }) {
  return client.request('/orders', {
    method: 'POST',
    body: JSON.stringify({
      binding_id: bindingId,
      fund_id: fundId,
      order_type: orderType,
      amount,
      currency,
      partner_reference_id: partnerReferenceId
    })
  });
}

/**
 * Get order status
 * @param {COWCClient} client - Authenticated COWC client
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Order details
 */
export async function getOrder(client, orderId) {
  return client.request(`/orders/${orderId}`);
}

/**
 * Order statuses
 */
export const OrderStatus = {
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_RECEIVED: 'payment_received',
  PROCESSING: 'processing',
  SUBMITTED: 'submitted',
  CONFIRMED: 'confirmed',
  SETTLED: 'settled',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

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
  const fundId = process.env.TEST_FUND_ID || 'fund_xxx';

  try {
    // Preview order
    const preview = await previewOrder(client, {
      bindingId,
      fundId,
      amount: 1000
    });

    console.log('Order Preview:');
    console.log('- Gross Amount:', preview.gross_amount);
    console.log('- Sales Charge:', preview.sales_charge);
    console.log('- Net Amount:', preview.net_amount);
    console.log('- Indicative Units:', preview.indicative_units);

    // Create order (uncomment to actually create)
    // const order = await createOrder(client, {
    //   bindingId,
    //   fundId,
    //   amount: 1000,
    //   partnerReferenceId: `order_${Date.now()}`
    // });
    // console.log('\nOrder created:', order.order_id);
    // console.log('Payment URL:', order.payment_flow?.flow_url);

  } catch (error) {
    console.error('Error:', error.message);
  }
}
