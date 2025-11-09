import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single() as any

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single() as any

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      plan: userRecord?.plan || 'free'
    },
    subscription: subscription || null,
    canCreateProperties: userRecord?.plan === 'paid' && subscription?.status === 'active'
  })
}