/**
 * Stripe Webhook Testing Utilities
 * 
 * This file contains utilities for testing Stripe webhooks locally
 * and in development environments.
 */

import { stripe } from './config'
import type Stripe from 'stripe'

export interface WebhookTestEvent {
  type: string
  data: any
  metadata?: Record<string, string>
}

/**
 * Create a test webhook event for local testing
 */
export function createTestWebhookEvent(
  type: string,
  data: any,
  metadata: Record<string, string> = {}
): Stripe.Event {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        ...data,
        metadata: {
          ...data.metadata,
          ...metadata
        }
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_test_${Date.now()}`,
      idempotency_key: null
    },
    type: type as any
  }
}

/**
 * Test webhook events for different scenarios
 */
export const testWebhookEvents = {
  checkoutSessionCompleted: (userId: string, customerId: string = 'cus_test') => 
    createTestWebhookEvent('checkout.session.completed', {
      id: 'cs_test_session',
      object: 'checkout.session',
      customer: customerId,
      subscription: 'sub_test_subscription',
      payment_status: 'paid',
      status: 'complete'
    }, { userId, plan: 'pro' }),

  subscriptionCreated: (userId: string, customerId: string = 'cus_test') =>
    createTestWebhookEvent('customer.subscription.created', {
      id: 'sub_test_subscription',
      object: 'subscription',
      customer: customerId,
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      items: {
        data: [{
          price: {
            id: 'price_pro_monthly',
            nickname: 'Pro Plan'
          }
        }]
      }
    }, { userId, plan: 'pro' }),

  subscriptionUpdated: (userId: string, status: string = 'past_due') =>
    createTestWebhookEvent('customer.subscription.updated', {
      id: 'sub_test_subscription',
      object: 'subscription',
      customer: 'cus_test',
      status: status,
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
    }, { userId, plan: 'pro' }),

  subscriptionDeleted: (userId: string) =>
    createTestWebhookEvent('customer.subscription.deleted', {
      id: 'sub_test_subscription',
      object: 'subscription',
      customer: 'cus_test',
      status: 'canceled',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      canceled_at: Math.floor(Date.now() / 1000)
    }, { userId, plan: 'pro' }),

  invoicePaymentSucceeded: (userId: string, subscriptionId: string = 'sub_test') =>
    createTestWebhookEvent('invoice.payment_succeeded', {
      id: 'in_test_invoice',
      object: 'invoice',
      customer: 'cus_test',
      subscription: subscriptionId,
      status: 'paid',
      amount_paid: 2900,
      currency: 'usd'
    }, { userId }),

  invoicePaymentFailed: (userId: string, subscriptionId: string = 'sub_test') =>
    createTestWebhookEvent('invoice.payment_failed', {
      id: 'in_test_invoice',
      object: 'invoice',
      customer: 'cus_test',
      subscription: subscriptionId,
      status: 'open',
      amount_due: 2900,
      currency: 'usd',
      next_payment_attempt: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, { userId })
}

/**
 * Send a test webhook to the local webhook endpoint
 */
export async function sendTestWebhook(
  event: Stripe.Event,
  webhookUrl: string = 'http://localhost:3000/api/stripe/webhook'
) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test_signature', // In real testing, you'd generate this properly
      },
      body: JSON.stringify(event)
    })

    const result = await response.json()
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    }
  } catch (error) {
    console.error('Error sending test webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Validate webhook signature (for testing)
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // In a real implementation, you'd use Stripe's signature validation
    // This is a simplified version for testing
    return signature.includes('test_signature') || signature.length > 0
  } catch (error) {
    return false
  }
}

/**
 * Mock Stripe webhook for testing
 */
export class MockStripeWebhook {
  private events: Stripe.Event[] = []

  addEvent(event: Stripe.Event) {
    this.events.push(event)
  }

  getEvents(): Stripe.Event[] {
    return [...this.events]
  }

  clearEvents() {
    this.events = []
  }

  async processEvents(handler: (event: Stripe.Event) => Promise<void>) {
    for (const event of this.events) {
      await handler(event)
    }
  }
}

/**
 * Test subscription lifecycle
 */
export async function testSubscriptionLifecycle(
  userId: string,
  webhookUrl?: string
) {
  const customerId = `cus_test_${Date.now()}`
  
  console.log('Testing subscription lifecycle for user:', userId)

  // 1. Checkout completed
  const checkoutEvent = testWebhookEvents.checkoutSessionCompleted(userId, customerId)
  console.log('1. Sending checkout.session.completed event')
  if (webhookUrl) {
    await sendTestWebhook(checkoutEvent, webhookUrl)
  }

  // 2. Subscription created
  const subscriptionCreatedEvent = testWebhookEvents.subscriptionCreated(userId, customerId)
  console.log('2. Sending customer.subscription.created event')
  if (webhookUrl) {
    await sendTestWebhook(subscriptionCreatedEvent, webhookUrl)
  }

  // 3. Payment succeeded
  const paymentSucceededEvent = testWebhookEvents.invoicePaymentSucceeded(userId)
  console.log('3. Sending invoice.payment_succeeded event')
  if (webhookUrl) {
    await sendTestWebhook(paymentSucceededEvent, webhookUrl)
  }

  // 4. Subscription updated (past due)
  const subscriptionUpdatedEvent = testWebhookEvents.subscriptionUpdated(userId, 'past_due')
  console.log('4. Sending customer.subscription.updated event (past_due)')
  if (webhookUrl) {
    await sendTestWebhook(subscriptionUpdatedEvent, webhookUrl)
  }

  // 5. Subscription canceled
  const subscriptionDeletedEvent = testWebhookEvents.subscriptionDeleted(userId)
  console.log('5. Sending customer.subscription.deleted event')
  if (webhookUrl) {
    await sendTestWebhook(subscriptionDeletedEvent, webhookUrl)
  }

  console.log('Subscription lifecycle test completed')
}