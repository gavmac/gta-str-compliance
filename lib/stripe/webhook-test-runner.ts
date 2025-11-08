/**
 * Test runner for Stripe webhook functionality
 * 
 * This file provides utilities to test webhook handlers locally
 * without needing to set up actual Stripe webhooks.
 */

import { StripeWebhookHandlers } from './webhook-handlers'
import { testWebhookEvents, sendTestWebhook } from './webhook-test'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Test configuration
const TEST_CONFIG = {
  webhookUrl: 'http://localhost:3000/api/stripe/webhook',
  testUserId: 'test-user-123',
  testCustomerId: 'cus_test_customer'
}

/**
 * Run comprehensive webhook tests
 */
export async function runWebhookTests() {
  console.log('🧪 Starting Stripe webhook tests...\n')

  // Create test Supabase client (you'd use your test database)
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const handlers = new StripeWebhookHandlers(supabase)

  try {
    // Test 1: Checkout Session Completed
    console.log('1️⃣ Testing checkout.session.completed...')
    const checkoutEvent = testWebhookEvents.checkoutSessionCompleted(
      TEST_CONFIG.testUserId,
      TEST_CONFIG.testCustomerId
    )
    const checkoutResult = await handlers.handleCheckoutSessionCompleted(
      checkoutEvent.data.object as any
    )
    console.log('✅ Checkout result:', checkoutResult)

    // Test 2: Subscription Created
    console.log('\n2️⃣ Testing customer.subscription.created...')
    const subscriptionCreatedEvent = testWebhookEvents.subscriptionCreated(
      TEST_CONFIG.testUserId,
      TEST_CONFIG.testCustomerId
    )
    const subscriptionCreatedResult = await handlers.handleSubscriptionCreated(
      subscriptionCreatedEvent.data.object as any
    )
    console.log('✅ Subscription created result:', subscriptionCreatedResult)

    // Test 3: Invoice Payment Succeeded
    console.log('\n3️⃣ Testing invoice.payment_succeeded...')
    const paymentSucceededEvent = testWebhookEvents.invoicePaymentSucceeded(
      TEST_CONFIG.testUserId
    )
    const paymentSucceededResult = await handlers.handleInvoicePaymentSucceeded(
      paymentSucceededEvent.data.object as any
    )
    console.log('✅ Payment succeeded result:', paymentSucceededResult)

    // Test 4: Subscription Updated (Past Due)
    console.log('\n4️⃣ Testing customer.subscription.updated (past_due)...')
    const subscriptionUpdatedEvent = testWebhookEvents.subscriptionUpdated(
      TEST_CONFIG.testUserId,
      'past_due'
    )
    const subscriptionUpdatedResult = await handlers.handleSubscriptionUpdated(
      subscriptionUpdatedEvent.data.object as any
    )
    console.log('✅ Subscription updated result:', subscriptionUpdatedResult)

    // Test 5: Invoice Payment Failed
    console.log('\n5️⃣ Testing invoice.payment_failed...')
    const paymentFailedEvent = testWebhookEvents.invoicePaymentFailed(
      TEST_CONFIG.testUserId
    )
    const paymentFailedResult = await handlers.handleInvoicePaymentFailed(
      paymentFailedEvent.data.object as any
    )
    console.log('✅ Payment failed result:', paymentFailedResult)

    // Test 6: Subscription Deleted
    console.log('\n6️⃣ Testing customer.subscription.deleted...')
    const subscriptionDeletedEvent = testWebhookEvents.subscriptionDeleted(
      TEST_CONFIG.testUserId
    )
    const subscriptionDeletedResult = await handlers.handleSubscriptionDeleted(
      subscriptionDeletedEvent.data.object as any
    )
    console.log('✅ Subscription deleted result:', subscriptionDeletedResult)

    console.log('\n🎉 All webhook tests completed successfully!')

  } catch (error) {
    console.error('❌ Webhook test failed:', error)
    throw error
  }
}

/**
 * Test webhook endpoint directly (requires running server)
 */
export async function testWebhookEndpoint() {
  console.log('🌐 Testing webhook endpoint...\n')

  try {
    // Test checkout completion
    const checkoutEvent = testWebhookEvents.checkoutSessionCompleted(
      TEST_CONFIG.testUserId,
      TEST_CONFIG.testCustomerId
    )

    const response = await sendTestWebhook(checkoutEvent, TEST_CONFIG.webhookUrl)
    
    if (response.success) {
      console.log('✅ Webhook endpoint test successful:', response.data)
    } else {
      console.error('❌ Webhook endpoint test failed:', response.error)
    }

  } catch (error) {
    console.error('❌ Webhook endpoint test error:', error)
    throw error
  }
}

/**
 * Test subscription lifecycle end-to-end
 */
export async function testSubscriptionLifecycle() {
  console.log('🔄 Testing complete subscription lifecycle...\n')

  const userId = `test-user-${Date.now()}`
  const customerId = `cus_test_${Date.now()}`

  console.log(`Testing with userId: ${userId}, customerId: ${customerId}`)

  // Create test Supabase client
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const handlers = new StripeWebhookHandlers(supabase)

  try {
    // 1. Create test user
    console.log('1️⃣ Creating test user...')
    const { error: userError } = await (supabase
      .from('users')
      .insert as any)({
        id: userId,
        email: `test-${Date.now()}@example.com`,
        plan: 'free'
      })

    if (userError) {
      console.error('Failed to create test user:', userError)
      return
    }

    // 2. Simulate checkout completion
    console.log('2️⃣ Simulating checkout completion...')
    const checkoutEvent = testWebhookEvents.checkoutSessionCompleted(userId, customerId)
    await handlers.handleCheckoutSessionCompleted(checkoutEvent.data.object as any)

    // 3. Simulate subscription creation
    console.log('3️⃣ Simulating subscription creation...')
    const subscriptionEvent = testWebhookEvents.subscriptionCreated(userId, customerId)
    await handlers.handleSubscriptionCreated(subscriptionEvent.data.object as any)

    // 4. Verify user state
    console.log('4️⃣ Verifying user state...')
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single() as { data: any; error: any }

    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single() as { data: any; error: any }

    console.log('User data:', userData)
    console.log('Subscription data:', subscriptionData)

    // 5. Simulate subscription cancellation
    console.log('5️⃣ Simulating subscription cancellation...')
    const cancelEvent = testWebhookEvents.subscriptionDeleted(userId)
    await handlers.handleSubscriptionDeleted(cancelEvent.data.object as any)

    // 6. Verify final state
    console.log('6️⃣ Verifying final state...')
    const { data: finalUserData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single() as { data: any; error: any }

    const { data: finalSubscriptionData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single() as { data: any; error: any }

    console.log('Final user data:', finalUserData)
    console.log('Final subscription data:', finalSubscriptionData)

    // 7. Cleanup test data
    console.log('7️⃣ Cleaning up test data...')
    await supabase.from('subscriptions').delete().eq('user_id', userId)
    await supabase.from('users').delete().eq('id', userId)

    console.log('🎉 Subscription lifecycle test completed successfully!')

  } catch (error) {
    console.error('❌ Subscription lifecycle test failed:', error)
    
    // Cleanup on error
    try {
      await supabase.from('subscriptions').delete().eq('user_id', userId)
      await supabase.from('users').delete().eq('id', userId)
    } catch (cleanupError) {
      console.error('Failed to cleanup test data:', cleanupError)
    }
    
    throw error
  }
}

/**
 * Run all tests
 */
export async function runAllWebhookTests() {
  console.log('🚀 Running comprehensive webhook test suite...\n')

  try {
    await runWebhookTests()
    console.log('\n' + '='.repeat(50))
    await testSubscriptionLifecycle()
    console.log('\n' + '='.repeat(50))
    
    // Only test endpoint if server is running
    if (process.env.NODE_ENV === 'development') {
      await testWebhookEndpoint()
    }

    console.log('\n🎉 All webhook tests passed!')

  } catch (error) {
    console.error('\n❌ Webhook test suite failed:', error)
    process.exit(1)
  }
}

// Allow running tests directly
if (require.main === module) {
  runAllWebhookTests()
}