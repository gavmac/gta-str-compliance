import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    
    // Check if Stripe is properly configured
    if (!stripeKey || stripeKey.includes('your_test_secret_key_here')) {
      return NextResponse.json({
        error: 'Stripe not configured',
        message: 'Please add your Stripe test secret key to .env.local',
        testUrl: 'https://dashboard.stripe.com/test/apikeys'
      }, { status: 400 })
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      client_reference_id: 'dev-user-123', // In real app, get from auth
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: 'GTA Compliance Digest Pro',
              description: 'Property-specific monitoring and compliance alerts',
            },
            unit_amount: 2900, // $29.00 CAD
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/dashboard?upgraded=true`,
      cancel_url: `${request.nextUrl.origin}/upgrade?canceled=true`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}