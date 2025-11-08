import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  // Skip signature verification in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: skipping webhook signature verification')
  } else if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: any

  try {
    if (process.env.NODE_ENV === 'development') {
      event = JSON.parse(body)
    } else {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
      event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!)
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
  }

  console.log(`Webhook: ${event.type}`)

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id || 'dev-user-123'
      
      // Create user and upgrade to paid
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: session.customer_details?.email || 'dev@example.com',
          plan: 'paid'
        })

      if (userError) {
        console.error('Error upgrading user:', userError)
      } else {
        console.log('User upgraded to paid plan')
      }

      // Create subscription record
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription || `checkout_${session.id}`,
          status: 'active',
          plan_name: 'paid',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })

      if (subError) {
        console.error('Error creating subscription:', subError)
      } else {
        console.log('Subscription created')
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}

