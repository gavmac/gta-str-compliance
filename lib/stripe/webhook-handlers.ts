import type Stripe from 'stripe'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

type SupabaseClientType = SupabaseClient<Database>

export interface WebhookHandlerResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Webhook event handlers with comprehensive error handling and logging
 */
export class StripeWebhookHandlers {
  constructor(private supabase: SupabaseClientType) {}

  async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ): Promise<WebhookHandlerResult> {
    try {
      console.log('Processing checkout.session.completed:', session.id)

      // Validate required data
      const userId = session.metadata?.userId
      if (!userId) {
        throw new Error('No userId in checkout session metadata')
      }

      // Update user plan to paid
      const { error: userError } = await this.supabase
        .from('users')
        .update({ 
          plan: 'paid',
          updated_at: new Date().toISOString()
        } satisfies Database['public']['Tables']['users']['Update'])
        .eq('id', userId)

      if (userError) {
        throw new Error(`Failed to update user plan: ${userError.message}`)
      }

      // Create or update subscription record if we have subscription data
      if (session.subscription && session.customer) {
        const { error: subscriptionError } = await this.supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            plan_name: session.metadata?.plan || 'pro',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } satisfies Database['public']['Tables']['subscriptions']['Insert'])

        if (subscriptionError) {
          throw new Error(`Failed to create subscription: ${subscriptionError.message}`)
        }
      }

      console.log(`Successfully processed checkout completion for user ${userId}`)
      return { success: true, data: { userId, sessionId: session.id } }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error in handleCheckoutSessionCompleted:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async handleSubscriptionCreated(
    subscription: Stripe.Subscription
  ): Promise<WebhookHandlerResult> {
    try {
      console.log('Processing customer.subscription.created:', subscription.id)

      // Find user by customer ID
      const { data: subscriptionData, error: findError } = await this.supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', subscription.customer as string)
        .single()

      if (findError || !subscriptionData) {
        throw new Error(`Could not find user for customer: ${subscription.customer}`)
      }

      // Update subscription with full details
      const { error: updateError } = await this.supabase
        .from('subscriptions')
        .update({
          stripe_subscription_id: subscription.id,
          status: subscription.status as 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        } satisfies Database['public']['Tables']['subscriptions']['Update'])
        .eq('stripe_customer_id', subscription.customer as string)

      if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`)
      }

      console.log(`Successfully processed subscription creation for ${subscription.id}`)
      return { success: true, data: { subscriptionId: subscription.id, userId: subscriptionData.user_id } }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error in handleSubscriptionCreated:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<WebhookHandlerResult> {
    try {
      console.log('Processing customer.subscription.updated:', subscription.id)

      // Update subscription status
      const { error: updateError } = await this.supabase
        .from('subscriptions')
        .update({
          status: subscription.status as 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        } satisfies Database['public']['Tables']['subscriptions']['Update'])
        .eq('stripe_subscription_id', subscription.id)

      if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`)
      }

      // If subscription is canceled or past_due, update user plan
      if (subscription.status === 'canceled' || subscription.status === 'past_due') {
        const { data: subscriptionData } = await this.supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (subscriptionData) {
          const newPlan = subscription.status === 'canceled' ? 'free' : 'paid'
          
          const { error: userError } = await this.supabase
            .from('users')
            .update({ 
              plan: newPlan,
              updated_at: new Date().toISOString()
            } satisfies Database['public']['Tables']['users']['Update'])
            .eq('id', subscriptionData.user_id)

          if (userError) {
            throw new Error(`Failed to update user plan: ${userError.message}`)
          }
        }
      }

      console.log(`Successfully processed subscription update for ${subscription.id}`)
      return { success: true, data: { subscriptionId: subscription.id, status: subscription.status } }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error in handleSubscriptionUpdated:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<WebhookHandlerResult> {
    try {
      console.log('Processing customer.subscription.deleted:', subscription.id)

      // Update subscription status to canceled
      const { error: updateError } = await this.supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        } satisfies Database['public']['Tables']['subscriptions']['Update'])
        .eq('stripe_subscription_id', subscription.id)

      if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`)
      }

      // Downgrade user to free plan
      const { data: subscriptionData } = await this.supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (subscriptionData) {
        const { error: userError } = await this.supabase
          .from('users')
          .update({ 
            plan: 'free',
            updated_at: new Date().toISOString()
          } satisfies Database['public']['Tables']['users']['Update'])
          .eq('id', subscriptionData.user_id)

        if (userError) {
          throw new Error(`Failed to downgrade user plan: ${userError.message}`)
        }
      }

      console.log(`Successfully processed subscription deletion for ${subscription.id}`)
      return { success: true, data: { subscriptionId: subscription.id } }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error in handleSubscriptionDeleted:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice
  ): Promise<WebhookHandlerResult> {
    try {
      console.log('Processing invoice.payment_succeeded:', invoice.id)

      if (!invoice.subscription) {
        console.log('Invoice not associated with subscription, skipping')
        return { success: true, data: { skipped: true, reason: 'No subscription' } }
      }

      // Ensure subscription is active
      const { error: updateError } = await this.supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        } satisfies Database['public']['Tables']['subscriptions']['Update'])
        .eq('stripe_subscription_id', invoice.subscription as string)

      if (updateError) {
        throw new Error(`Failed to update subscription after payment: ${updateError.message}`)
      }

      // Ensure user is on paid plan
      const { data: subscriptionData } = await this.supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', invoice.subscription as string)
        .single()

      if (subscriptionData) {
        const { error: userError } = await this.supabase
          .from('users')
          .update({ 
            plan: 'paid',
            updated_at: new Date().toISOString()
          } satisfies Database['public']['Tables']['users']['Update'])
          .eq('id', subscriptionData.user_id)

        if (userError) {
          throw new Error(`Failed to update user plan after payment: ${userError.message}`)
        }
      }

      console.log(`Successfully processed payment success for invoice ${invoice.id}`)
      return { success: true, data: { invoiceId: invoice.id, subscriptionId: invoice.subscription } }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error in handleInvoicePaymentSucceeded:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice
  ): Promise<WebhookHandlerResult> {
    try {
      console.log('Processing invoice.payment_failed:', invoice.id)

      if (!invoice.subscription) {
        console.log('Invoice not associated with subscription, skipping')
        return { success: true, data: { skipped: true, reason: 'No subscription' } }
      }

      // Update subscription status to past_due
      const { error: updateError } = await this.supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        } satisfies Database['public']['Tables']['subscriptions']['Update'])
        .eq('stripe_subscription_id', invoice.subscription as string)

      if (updateError) {
        throw new Error(`Failed to update subscription after payment failure: ${updateError.message}`)
      }

      // Note: We keep user on paid plan for past_due status
      // They'll be downgraded only if subscription is canceled

      console.log(`Successfully processed payment failure for invoice ${invoice.id}`)
      return { success: true, data: { invoiceId: invoice.id, subscriptionId: invoice.subscription } }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error in handleInvoicePaymentFailed:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }
}

/**
 * Log webhook events for monitoring and debugging
 */
export async function logWebhookEvent(
  supabase: SupabaseClientType,
  event: Stripe.Event,
  result: WebhookHandlerResult
) {
  try {
    // You could create a webhook_logs table for this
    console.log('Webhook Event Log:', {
      eventId: event.id,
      eventType: event.type,
      success: result.success,
      error: result.error,
      timestamp: new Date().toISOString()
    })

    // For now, we'll just log to console
    // In production, you might want to store this in a database table
    
  } catch (error) {
    console.error('Failed to log webhook event:', error)
  }
}

/**
 * Retry logic for failed webhook operations
 */
export async function retryWebhookOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries) {
        throw lastError
      }

      console.log(`Webhook operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }

  throw lastError!
}