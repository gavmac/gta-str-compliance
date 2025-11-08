import { NextRequest, NextResponse } from 'next/server'
import { sendNotificationEmail } from '@/lib/notifications/email'

export async function POST(request: NextRequest) {
  try {
    const { notification, user_email, user_name } = await request.json()
    
    const success = await sendNotificationEmail(notification, {
      id: notification.user_id,
      email: user_email,
      name: user_name
    })
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' })
    } else {
      return NextResponse.json({ success: false, message: 'Failed to send email' }, { status: 500 })
    }
  } catch (error) {
    console.error('Email API Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}