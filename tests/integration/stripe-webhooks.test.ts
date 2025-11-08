/**
 * Integration tests for Stripe webhook handlers
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { StripeWebhookHandlers } from '@/lib/stripe/webhook-handlers'
import { testWebhookEvents } from '@/lib/stripe/webhook-test'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Test configuration
const TEST_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const TEST_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

describe('Stripe Webhook Handlers', () => {
  let supabase: ReturnType<typeof createClient<Database>>
  let handlers: StripeWebhookHandlers
  let testUserId: string
  let testCustomerId: string

  beforeEach(async () => {
    // Create test Supabase client
    supabase = createClient<Database>(TEST_SUPABASE_URL, TEST_SUPABASE_KEY)
    handlers = new StripeWebhookHandlers(supabase)

    // Generate unique test IDs
    testUserId = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    testCustomerId = `cus_test_${Date.now()}`

    // Create test user
    await supabase.from('users').insert({
      id: testUserId,
      email: `test-${Date.now()}@example.com`,
      plan: 'free'
    })
  })

  afterEach(async () => {
    // Cleanup test data
    await supabase.from('subscriptions').delete().eq('user_id', testUserId)
    await supabase.from('users').delete().eq('id', testUserId)
  })

  describe('handleCheckoutSessionCompleted', () => {
    it('should upgrade user to paid plan and create subscription', async () => {
      const event = testWebhookEvents.checkoutSessionCompleted(testUserId, testCustomerId)
      
      const result = await handlers.handleCheckoutSessionCompleted(event.data.object as any)
      
      expect(result.success).toBe(true)
      expect(result.data?.userId).toBe(testUserId)

      // Verify user was upgraded
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', testUserId)
        .single()

      expect(userData?.plan).toBe('paid')

      // Verify subscription was created
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', testUserId)
        .single() as { data: any; error: any }

      expect(subscriptionData?.stripe_customer_id).toBe(testCustomerId)
      expect(subscriptionData?.status).toBe('active')
    })

    it('should handle missing userId in metadata', async () => {
      const event = testWebhookEvents.checkoutSessionCompleted('', testCustomerId)
      
      const result = await handlers.handleCheckoutSessionCompleted(event.data.object as any)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('No userId in checkout session metadata')
    })
  })

  describe('handleSubscriptionCreated', () => {
    it('should update subscription with full details', async () => {
      // First create a subscription record via checkout
      const checkoutEvent = testWebhookEvents.checkoutSessionCompleted(testUserId, testCustomerId)
      await handlers.handleCheckoutSessionCompleted(checkoutEvent.data.object as any)

      // Then simulate subscription created
      const subscriptionEvent = testWebhookEvents.subscriptionCreated(testUserId, testCustomerId)
      
      const result = await handlers.handleSubscriptionCreated(subscriptionEvent.data.object as any)
      
      expect(result.success).toBe(true)

      // Verify subscription details were updated
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', testUserId)
        .single()

      expect(subscriptionData?.stripe_subscription_id).toBe('sub_test_subscription')
      expect(subscriptionData?.current_period_start).toBeDefined()
      expect(subscriptionData?.current_period_end).toBeDefined()
    })

    it('should handle missing customer', async () => {
      const subscriptionEvent = testWebhookEvents.subscriptionCreated(testUserId, 'nonexistent_customer')
      
      const result = await handlers.handleSubscriptionCreated(subscriptionEvent.data.object as any)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Could not find user for customer')
    })
  })

  describe('handleSubscriptionUpdated', () => {
    beforeEach(async () => {
      // Set up subscription for testing
      const checkoutEvent = testWebhookEvents.checkoutSessionCompleted(testUserId, testCustomerId)
      await handlers.handleCheckoutSessionCompleted(checkoutEvent.data.object as any)
      
      const subscriptionEvent = testWebhookEvents.subscriptionCreated(testUserId, testCustomerId)
      await handlers.handleSubscriptionCreated(subscriptionEvent.data.object as any)
    })

    it('should update subscription status', async () => {
      const updateEvent = testWebhookEvents.subscriptionUpdated(testUserId, 'active')
      
      const result = await handlers.handleSubscriptionUpdated(updateEvent.data.object as any)
      
      expect(result.success).toBe(true)

      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', testUserId)
        .single()

      expect(subscriptionData?.status).toBe('active')
    })

    it('should downgrade user when subscription is canceled', async () => {
      const updateEvent = testWebhookEvents.subscriptionUpdated(testUserId, 'canceled')
      
      const result = await handlers.handleSubscriptionUpdated(updateEvent.data.object as any)
      
      expect(result.success).toBe(true)

      // Verify user was downgraded
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', testUserId)
        .single()

      expect(userData?.plan).toBe('free')
    })

    it('should keep user on paid plan when past_due', async () => {
      const updateEvent = testWebhookEvents.subscriptionUpdated(testUserId, 'past_due')
      
      const result = await handlers.handleSubscriptionUpdated(updateEvent.data.object as any)
      
      expect(result.success).toBe(true)

      // Verify user stays on paid plan
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', testUserId)
        .single()

      expect(userData?.plan).toBe('paid')
    })
  })

  describe('handleSubscriptionDeleted', () => {
    beforeEach(async () => {
      // Set up subscription for testing
      const checkoutEvent = testWebhookEvents.checkoutSessionCompleted(testUserId, testCustomerId)
      await handlers.handleCheckoutSessionCompleted(checkoutEvent.data.object as any)
      
      const subscriptionEvent = testWebhookEvents.subscriptionCreated(testUserId, testCustomerId)
      await handlers.handleSubscriptionCreated(subscriptionEvent.data.object as any)
    })

    it('should cancel subscription and downgrade user', async () => {
      const deleteEvent = testWebhookEvents.subscriptionDeleted(testUserId)
      
      const result = await handlers.handleSubscriptionDeleted(deleteEvent.data.object as any)
      
      expect(result.success).toBe(true)

      // Verify subscription was canceled
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', testUserId)
        .single()

      expect(subscriptionData?.status).toBe('canceled')

      // Verify user was downgraded
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', testUserId)
        .single()

      expect(userData?.plan).toBe('free')
    })
  })

  describe('handleInvoicePaymentSucceeded', () => {
    beforeEach(async () => {
      // Set up subscription for testing
      const checkoutEvent = testWebhookEvents.checkoutSessionCompleted(testUserId, testCustomerId)
      await handlers.handleCheckoutSessionCompleted(checkoutEvent.data.object as any)
      
      const subscriptionEvent = testWebhookEvents.subscriptionCreated(testUserId, testCustomerId)
      await handlers.handleSubscriptionCreated(subscriptionEvent.data.object as any)
    })

    it('should ensure subscription is active and user is on paid plan', async () => {
      const paymentEvent = testWebhookEvents.invoicePaymentSucceeded(testUserId, 'sub_test_subscription')
      
      const result = await handlers.handleInvoicePaymentSucceeded(paymentEvent.data.object as any)
      
      expect(result.success).toBe(true)

      // Verify subscription is active
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('stripe_subscription_id', 'sub_test_subscription')
        .single()

      expect(subscriptionData?.status).toBe('active')

      // Verify user is on paid plan
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', testUserId)
        .single()

      expect(userData?.plan).toBe('paid')
    })

    it('should skip invoices not associated with subscriptions', async () => {
      const paymentEvent = testWebhookEvents.invoicePaymentSucceeded(testUserId, '')
      paymentEvent.data.object.subscription = null
      
      const result = await handlers.handleInvoicePaymentSucceeded(paymentEvent.data.object as any)
      
      expect(result.success).toBe(true)
      expect(result.data?.skipped).toBe(true)
    })
  })

  describe('handleInvoicePaymentFailed', () => {
    beforeEach(async () => {
      // Set up subscription for testing
      const checkoutEvent = testWebhookEvents.checkoutSessionCompleted(testUserId, testCustomerId)
      await handlers.handleCheckoutSessionCompleted(checkoutEvent.data.object as any)
      
      const subscriptionEvent = testWebhookEvents.subscriptionCreated(testUserId, testCustomerId)
      await handlers.handleSubscriptionCreated(subscriptionEvent.data.object as any)
    })

    it('should mark subscription as past_due', async () => {
      const paymentFailedEvent = testWebhookEvents.invoicePaymentFailed(testUserId, 'sub_test_subscription')
      
      const result = await handlers.handleInvoicePaymentFailed(paymentFailedEvent.data.object as any)
      
      expect(result.success).toBe(true)

      // Verify subscription is past_due
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('stripe_subscription_id', 'sub_test_subscription')
        .single()

      expect(subscriptionData?.status).toBe('past_due')
    })

    it('should skip invoices not associated with subscriptions', async () => {
      const paymentFailedEvent = testWebhookEvents.invoicePaymentFailed(testUserId, '')
      paymentFailedEvent.data.object.subscription = null
      
      const result = await handlers.handleInvoicePaymentFailed(paymentFailedEvent.data.object as any)
      
      expect(result.success).toBe(true)
      expect(result.data?.skipped).toBe(true)
    })
  })
})