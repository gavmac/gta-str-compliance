import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST() {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Update user to paid plan
    await (supabase
      .from('users')
      .upsert as any)({
        id: user.id,
        email: user.email!,
        plan: 'paid',
        city_id: 1
      })

    // Create active subscription
    await (supabase
      .from('subscriptions')
      .upsert as any)({
        user_id: user.id,
        stripe_customer_id: 'manual_upgrade',
        stripe_subscription_id: `manual_${user.id}`,
        status: 'active',
        plan_name: 'paid',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })

    return NextResponse.json({ success: true, message: 'Subscription fixed' })
  } catch (error) {
    console.error('Error fixing subscription:', error)
    return NextResponse.json({ error: 'Failed to fix subscription' }, { status: 500 })
  }
}