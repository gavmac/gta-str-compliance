#!/usr/bin/env node

/**
 * Simple webhook test script
 * 
 * Run with: node scripts/test-webhooks.js
 */

const { runAllWebhookTests } = require('../lib/stripe/webhook-test-runner')

console.log('🧪 Starting Stripe webhook tests...\n')

runAllWebhookTests()
  .then(() => {
    console.log('\n✅ All tests completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Tests failed:', error)
    process.exit(1)
  })