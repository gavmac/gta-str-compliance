import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
    }
    
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  }
  
  return _stripe
}

// For backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    return getStripe()[prop as keyof Stripe]
  }
})

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  plans: {
    pro: {
      priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
      name: 'Pro Plan',
      price: 2900, // $29.00 in cents
      interval: 'month' as const,
      features: [
        'Property-specific monitoring',
        'Compliance scoring (0-100)',
        'Deadline reminders & alerts',
        'Document management',
        'Personalized digests'
      ]
    }
  }
} as const

export type StripePlan = keyof typeof STRIPE_CONFIG.plans