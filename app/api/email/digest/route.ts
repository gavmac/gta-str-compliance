import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = createAdminClient()

  try {
    // Get paid users with properties
    const { data: users } = await (supabase
      .from('users')
      .select(`
        id,
        email,
        properties(
          id,
          address_line1,
          type,
          cities(name),
          property_deadlines(
            rule_key,
            due_date,
            status
          )
        )
      `)
      .eq as any)('plan', 'paid')

    if (!users) {
      return NextResponse.json({ message: 'No paid users found' })
    }

    const emailsSent = []

    for (const user of users) {
      if (user.properties && user.properties.length > 0) {
        // Generate personalized digest
        const digest = generatePersonalizedDigest(user)
        
        // In a real app, send via SendGrid
        console.log(`Sending digest to ${user.email}:`, digest)
        
        // Log email sent
        const emailData = {
          user_id: user.id,
          kind: 'personalized_digest' as const,
          subject: 'Your Monthly Compliance Digest',
          recipient_email: user.email,
          status: 'sent' as const
        }
        await (supabase.from('emails_sent').insert as any)(emailData)

        emailsSent.push(user.email)
      }
    }

    return NextResponse.json({ 
      message: `Sent ${emailsSent.length} personalized digests`,
      recipients: emailsSent
    })
  } catch (error) {
    console.error('Digest error:', error)
    return NextResponse.json({ error: 'Failed to send digests' }, { status: 500 })
  }
}

function generatePersonalizedDigest(user: any) {
  const properties = user.properties || []
  const upcomingDeadlines = []
  
  for (const property of properties) {
    const deadlines = property.property_deadlines || []
    const dueSoon = deadlines.filter((d: any) => d.status === 'due_soon' || d.status === 'overdue')
    
    if (dueSoon.length > 0) {
      upcomingDeadlines.push({
        address: property.address_line1,
        city: property.cities?.name,
        deadlines: dueSoon
      })
    }
  }

  return {
    subject: 'Your Monthly Compliance Digest',
    properties: properties.length,
    upcomingDeadlines,
    summary: `You have ${upcomingDeadlines.length} properties with upcoming deadlines`
  }
}