import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use admin client for database operations
  const adminSupabase = createAdminClient()

  try {
    // Update user to paid plan
    const userData = {
      id: user.id,
      email: user.email!,
      plan: 'paid' as const,
      city_id: 1
    }
    await (adminSupabase.from('users').upsert as any)(userData)

    // Create active subscription
    const subscriptionData = {
      user_id: user.id,
      stripe_customer_id: 'manual_upgrade',
      stripe_subscription_id: `manual_${user.id}`,
      status: 'active' as const,
      plan_name: 'paid',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    await (adminSupabase.from('subscriptions').upsert as any)(subscriptionData)

    return NextResponse.json({ success: true, message: 'Subscription fixed' })
  } catch (error) {
    console.error('Error fixing subscription:', error)
    return NextResponse.json({ error: 'Failed to fix subscription' }, { status: 500 })
  }
}