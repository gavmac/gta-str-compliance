import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Admin client with service role key for bypassing RLS when needed
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Helper functions for admin operations
export const adminOperations = {
  // User management
  async createUser(userData: Database['public']['Tables']['users']['Insert']) {
    const supabase = createAdminClient()
    return await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()
  },

  async updateUserPlan(userId: string, plan: 'free' | 'paid') {
    const supabase = createAdminClient()
    return await supabase
      .from('users')
      .update({ plan })
      .eq('id', userId)
      .select()
      .single()
  },

  // Subscription management
  async createSubscription(subscriptionData: Database['public']['Tables']['subscriptions']['Insert']) {
    const supabase = createAdminClient()
    return await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()
  },

  async updateSubscriptionStatus(
    stripeSubscriptionId: string, 
    status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing',
    currentPeriodEnd?: string
  ) {
    const supabase = createAdminClient()
    return await supabase
      .from('subscriptions')
      .update({ 
        status,
        ...(currentPeriodEnd && { current_period_end: currentPeriodEnd })
      })
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .select()
      .single()
  },

  // Property deadline management
  async generatePropertyDeadlines(propertyId: string, cityId: number) {
    const supabase = createAdminClient()
    
    // Get rules for the city
    const { data: rules } = await supabase
      .from('rules')
      .select('*')
      .eq('city_id', cityId)
      .eq('is_active', true)

    if (!rules) return { data: null, error: 'No rules found for city' }

    // Generate deadlines based on rules
    const deadlines = rules.map(rule => {
      // Calculate due date based on frequency_iso
      const dueDate = calculateDueDateFromFrequency(rule.frequency_iso)
      
      return {
        property_id: propertyId,
        rule_key: rule.key,
        due_date: dueDate.toISOString().split('T')[0], // YYYY-MM-DD format
        status: getDueDateStatus(dueDate) as 'ok' | 'due_soon' | 'overdue'
      }
    })

    return await supabase
      .from('property_deadlines')
      .upsert(deadlines, { 
        onConflict: 'property_id,rule_key',
        ignoreDuplicates: false 
      })
      .select()
  },

  // Email tracking
  async logEmailSent(emailData: Database['public']['Tables']['emails_sent']['Insert']) {
    const supabase = createAdminClient()
    return await supabase
      .from('emails_sent')
      .insert(emailData)
      .select()
      .single()
  },

  // Content management
  async publishRuleUpdate(ruleUpdateId: number) {
    const supabase = createAdminClient()
    return await supabase
      .from('rule_updates')
      .update({ 
        is_published: true,
        published_at: new Date().toISOString()
      })
      .eq('id', ruleUpdateId)
      .select()
      .single()
  },

  // Analytics and reporting
  async getUserStats() {
    const supabase = createAdminClient()
    
    const [
      { count: totalUsers },
      { count: freeUsers },
      { count: paidUsers },
      { count: activeSubscriptions }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('plan', 'free'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('plan', 'paid'),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active')
    ])

    return {
      totalUsers: totalUsers || 0,
      freeUsers: freeUsers || 0,
      paidUsers: paidUsers || 0,
      activeSubscriptions: activeSubscriptions || 0
    }
  }
}

// Helper functions
function calculateDueDateFromFrequency(frequencyIso: string | null): Date {
  const now = new Date()
  
  if (!frequencyIso) {
    // Default to 1 year if no frequency specified
    return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  }

  // Parse ISO 8601 duration (P1Y, P6M, P3M, etc.)
  const match = frequencyIso.match(/P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?/)
  if (!match) {
    return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  }

  const [, years, months, days] = match
  const dueDate = new Date(now)
  
  if (years) dueDate.setFullYear(dueDate.getFullYear() + parseInt(years))
  if (months) dueDate.setMonth(dueDate.getMonth() + parseInt(months))
  if (days) dueDate.setDate(dueDate.getDate() + parseInt(days))
  
  return dueDate
}

function getDueDateStatus(dueDate: Date): string {
  const now = new Date()
  const diffTime = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 30) return 'due_soon'
  return 'ok'
}