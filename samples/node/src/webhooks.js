/**
 * COWC Webhooks Module
 *
 * Functions for verifying and handling webhooks.
 */

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify webhook signature
 * @param {string|Buffer} payload - Raw request body
 * @param {string} signature - X-COWC-Signature header value
 * @param {string} timestamp - X-COWC-Timestamp header value
 * @param {string} secret - Webhook secret
 * @param {number} maxAge - Maximum age in seconds (default: 300 = 5 minutes)
 * @returns {boolean} True if signature is valid
 */
export function verifyWebhook(payload, signature, timestamp, secret, maxAge = 300) {
  // Check timestamp is recent
  const timestampNum = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);

  if (isNaN(timestampNum) || Math.abs(now - timestampNum) > maxAge) {
    return false;
  }

  // Calculate expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = 'sha256=' + createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Constant-time comparison
  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Parse webhook payload
 * @param {string} body - Raw request body
 * @returns {Object} Parsed webhook event
 */
export function parseWebhook(body) {
  return JSON.parse(body);
}

/**
 * Webhook event types
 */
export const WebhookEvents = {
  // User events
  USER_CREATED: 'user.created',
  USER_KYC_APPROVED: 'user.kyc.approved',
  USER_KYC_REJECTED: 'user.kyc.rejected',

  // Binding events
  BINDING_CREATED: 'binding.created',
  BINDING_REVOKED: 'binding.revoked',

  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_PAYMENT_RECEIVED: 'order.payment_received',
  ORDER_SETTLED: 'order.settled',
  ORDER_FAILED: 'order.failed'
};

/**
 * Example Express webhook handler
 */
export function createWebhookHandler(secret, handlers = {}) {
  return async (req, res) => {
    const signature = req.headers['x-cowc-signature'];
    const timestamp = req.headers['x-cowc-timestamp'];
    const eventType = req.headers['x-cowc-event-type'];

    // Get raw body
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // Verify signature
    if (!verifyWebhook(rawBody, signature, timestamp, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse event
    const event = parseWebhook(rawBody);

    // Call handler
    const handler = handlers[eventType];
    if (handler) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error handling ${eventType}:`, error);
        return res.status(500).json({ error: 'Handler error' });
      }
    }

    // Acknowledge receipt
    res.status(200).json({ received: true });
  };
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  // Example webhook payload
  const examplePayload = JSON.stringify({
    event_id: 'evt_123',
    event_type: 'order.settled',
    provider: 'cashku',
    created_at: new Date().toISOString(),
    data: {
      order_id: 'ord_xxx',
      binding_id: 'bind_xxx',
      status: 'settled'
    }
  });

  const secret = 'test_webhook_secret';
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Generate signature
  const signedPayload = `${timestamp}.${examplePayload}`;
  const signature = 'sha256=' + createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Verify
  const isValid = verifyWebhook(examplePayload, signature, timestamp, secret);
  console.log('Signature valid:', isValid);

  // Parse
  const event = parseWebhook(examplePayload);
  console.log('Event type:', event.event_type);
  console.log('Order ID:', event.data.order_id);
}
