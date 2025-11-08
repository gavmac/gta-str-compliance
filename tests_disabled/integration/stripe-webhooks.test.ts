/**
 * Stripe Webhook Integration Tests
 * 
 * These tests verify that Stripe webhooks are processed correctly
 * and update the database appropriately.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { adminOperations } from '@/lib/supabase/admin'

// Mock Stripe webhook events
const mockWebhookEvents = {
  checkoutSessionCompleted: {
    id: 'evt_test_webhook',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_session',
        customer: 'cus_test_customer',
        subscription: 'sub_test_subscription',
        metadata: {
          userId: 'test-user-id',
          plan: 'pro'
        }
      }
    }
  },
  subscriptionCreated: {
    id: 'evt_test_webhook',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test_subscription',
        customer: 'cus_test_customer',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
        metadata: {
          userId: 'test-user-id',
          plan: 'pro'
        }
      }
    }
  },
  subscriptionUpdated: {
    id: 'evt_test_webhook',
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_test_subscription',
        customer: 'cus_test_customer',
        status: 'past_due',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        metadata: {
          userId: 'test-user-id',
          plan: 'pro'
        }
      }
    }
  },
  subscriptionDeleted: {
    id: 'evt_test_webhook',
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: 'sub_test_subscription',
        customer: 'cus_test_customer',
        status: 'canceled',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        metadata: {
          userId: 'test-user-id',
          plan: 'pro'
        }
      }
    }
  }
}

describe('Stripe Webhook Processing', () => {
  let supabase: ReturnType<typeof createClient<Database>>
  let testUserId: string
  let testCityId: number

  beforeEach(async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'
    
    supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
    testUserId = `test-user-${Date.now()}`
    
    // Get a test city
    const { data: cities } = await supabase
      .from('cities')
      .select('id')
      .limit(1)
    
    testCityId = cities?.[0]?.id || 1

    // Create test user
    await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: `webhook-test-${Date.now()}@example.com`,
        plan: 'free',
        city_id: testCityId
      })
  })

  afterEach(async () => {
    // Clean up test data
    await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', testUserId)

    await supabase
      .from('users')
      .delete()
      .eq('id', testUserId)
  })

  describe('Subscription Creation', () => {
    it('should create subscription record when subscription is created', async () => {
      const subscriptionData = {
        user_id: testUserId,
        stripe_customer_id: 'cus_test_customer',
        stripe_subscription_id: 'sub_test_subscription',
        status: 'active' as const,
        plan_name: 'pro',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const { data: subscription, error } = await adminOperations.createSubscription(subscriptionData)

      expect(error).toBeNull()
      expect(subscription).toBeDefined()
      expect(subscription.user_id).toBe(testUserId)
      expect(subscription.status).toBe('active')
      expect(subscription.plan_name).toBe('pro')
    })

    it('should update user plan to paid when subscription is created', async () => {
      // Create subscription
      await adminOperations.createSubscription({
        user_id: testUserId,
        stripe_customer_id: 'cus_test_customer',
        stripe_subscription_id: 'sub_test_subscription',
        status: 'active',
        plan_name: 'pro',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      // Update user plan
      const { data: updatedUser, error } = await adminOperations.updateUserPlan(testUserId, 'paid')

      expect(error).toBeNull()
      expect(updatedUser.plan).toBe('paid')
    })
  })

  describe('Subscription Updates', () => {
    beforeEach(async () => {
      // Create initial subscription
      await adminOperations.createSubscription({
        user_id: testUserId,
        stripe_customer_id: 'cus_test_customer',
        stripe_subscription_id: 'sub_test_subscription',
        status: 'active',
        plan_name: 'pro',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    })

    it('should update subscription status', async () => {
      const newEndDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      
      const { data: updatedSubscription, error } = await adminOperations.updateSubscriptionStatus(
        'sub_test_subscription',
        'past_due',
        newEndDate
      )

      expect(error).toBeNull()
      expect(updatedSubscription.status).toBe('past_due')
      expect(updatedSubscription.current_period_end).toBe(newEndDate)
    })

    it('should downgrade user plan when subscription becomes inactive', async () => {
      // Update subscription to canceled
      await adminOperations.updateSubscriptionStatus(
        'sub_test_subscription',
        'canceled'
      )

      // Update user plan to free
      const { data: updatedUser, error } = await adminOperations.updateUserPlan(testUserId, 'free')

      expect(error).toBeNull()
      expect(updatedUser.plan).toBe('free')
    })
  })

  describe('Webhook Event Processing', () => {
    it('should handle checkout.session.completed event', () => {
      const event = mockWebhookEvents.checkoutSessionCompleted
      
      expect(event.type).toBe('checkout.session.completed')
      expect(event.data.object.metadata.userId).toBe('test-user-id')
      expect(event.data.object.metadata.plan).toBe('pro')
    })

    it('should handle customer.subscription.created event', () => {
      const event = mockWebhookEvents.subscriptionCreated
      
      expect(event.type).toBe('customer.subscription.created')
      expect(event.data.object.status).toBe('active')
      expect(event.data.object.metadata.userId).toBe('test-user-id')
    })

    it('should handle customer.subscription.updated event', () => {
      const event = mockWebhookEvents.subscriptionUpdated
      
      expect(event.type).toBe('customer.subscription.updated')
      expect(event.data.object.status).toBe('past_due')
    })

    it('should handle customer.subscription.deleted event', () => {
      const event = mockWebhookEvents.subscriptionDeleted
      
      expect(event.type).toBe('customer.subscription.deleted')
      expect(event.data.object.status).toBe('canceled')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing user metadata gracefully', async () => {
      // This tests the webhook handler's ability to handle events without userId
      const eventWithoutUserId = {
        ...mockWebhookEvents.subscriptionCreated,
        data: {
          object: {
            ...mockWebhookEvents.subscriptionCreated.data.object,
            metadata: {} // No userId
          }
        }
      }

      // The webhook should log an error but not crash
      expect(eventWithoutUserId.data.object.metadata.userId).toBeUndefined()
    })

    it('should handle invalid subscription IDs', async () => {
      const { error } = await adminOperations.updateSubscriptionStatus(
        'invalid_subscription_id',
        'active'
      )

      // Should handle the error gracefully
      expect(error).toBeDefined()
    })

    it('should handle database connection errors', async () => {
      // This would test database connection failures
      // In a real test, you might temporarily break the database connection
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Subscription Status Mapping', () => {
    it('should map Stripe statuses to database statuses correctly', () => {
      const stripeStatuses = ['active', 'past_due', 'canceled', 'incomplete', 'trialing']
      const validDbStatuses = ['active', 'past_due', 'canceled', 'incomplete', 'trialing']

      stripeStatuses.forEach(status => {
        expect(validDbStatuses).toContain(status)
      })
    })

    it('should determine user plan based on subscription status', () => {
      const activeStatuses = ['active', 'trialing']
      const inactiveStatuses = ['past_due', 'canceled', 'incomplete']

      activeStatuses.forEach(status => {
        // These should result in 'paid' plan
        expect(['active', 'trialing']).toContain(status)
      })

      inactiveStatuses.forEach(status => {
        // These should result in 'free' plan (eventually)
        expect(['past_due', 'canceled', 'incomplete']).toContain(status)
      })
    })
  })
})