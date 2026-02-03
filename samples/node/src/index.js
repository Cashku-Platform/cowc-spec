/**
 * COWC Node.js Sample - Main Entry Point
 *
 * Demonstrates the complete integration flow.
 */

import 'dotenv/config';
import { COWCClient } from './auth.js';
import { listFunds, getFund } from './funds.js';
import { getPortfolio, getHoldings } from './portfolio.js';
import { previewOrder } from './orders.js';

async function main() {
  console.log('=== COWC Node.js Sample ===\n');

  // Initialize client
  const client = new COWCClient({
    baseUrl: process.env.COWC_BASE_URL || 'https://staging.cashku.ai/cowc/v1',
    clientId: process.env.COWC_CLIENT_ID,
    clientSecret: process.env.COWC_CLIENT_SECRET,
    apiKey: process.env.COWC_API_KEY
  });

  try {
    // 1. Authenticate
    console.log('1. Authenticating...');
    await client.authenticate();
    console.log('   ✓ Authentication successful\n');

    // 2. List funds
    console.log('2. Listing funds...');
    const fundsResult = await listFunds(client, { limit: 5 });
    console.log(`   ✓ Found ${fundsResult.pagination?.total || 0} funds\n`);

    if (fundsResult.funds?.length > 0) {
      console.log('   Top funds:');
      fundsResult.funds.slice(0, 3).forEach(f => {
        console.log(`   - ${f.fund_name} (NAV: ${f.current_nav})`);
      });
      console.log();

      // 3. Get fund details
      const fundId = fundsResult.funds[0].fund_id;
      console.log(`3. Getting fund details for ${fundId}...`);
      const fund = await getFund(client, fundId);
      console.log(`   ✓ ${fund.fund_name}`);
      console.log(`     Category: ${fund.category}`);
      console.log(`     Risk: ${fund.risk_level}`);
      console.log(`     Min Investment: ${fund.minimums?.initial_investment} ${fund.currency}\n`);
    }

    // 4. Portfolio (requires binding)
    const bindingId = process.env.TEST_BINDING_ID;
    if (bindingId) {
      console.log('4. Getting portfolio...');
      const portfolio = await getPortfolio(client, bindingId);
      console.log(`   ✓ Total Value: ${portfolio.total_value?.amount} ${portfolio.total_value?.currency}`);
      console.log(`     Returns: ${portfolio.total_returns?.percent}%\n`);

      console.log('5. Getting holdings...');
      const holdings = await getHoldings(client, bindingId);
      console.log(`   ✓ ${holdings.holdings?.length || 0} holdings\n`);
    } else {
      console.log('4-5. Skipping portfolio (no TEST_BINDING_ID set)\n');
    }

    // 6. Preview order
    if (bindingId && fundsResult.funds?.length > 0) {
      console.log('6. Previewing order...');
      const preview = await previewOrder(client, {
        bindingId,
        fundId: fundsResult.funds[0].fund_id,
        amount: 100
      });
      console.log(`   ✓ Preview for ${preview.gross_amount} ${preview.currency || 'MYR'}:`);
      console.log(`     Net Amount: ${preview.net_amount}`);
      console.log(`     Indicative Units: ${preview.indicative_units}\n`);
    } else {
      console.log('6. Skipping order preview (no binding or funds)\n');
    }

    console.log('=== Sample Complete ===');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.details) console.error('Details:', error.details);
    process.exit(1);
  }
}

main();
