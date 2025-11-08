import { NextRequest, NextResponse } from 'next/server'
import { generateMATNotifications, generateLicenseExpiryNotifications } from '@/lib/notifications/scheduler'
import { sendNotificationEmail } from '@/lib/notifications/email'

// Mock notifications storage
let mockNotifications: any[] = []

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id') || 'dev-user-123'
  
  // Filter notifications for user
  const userNotifications = mockNotifications.filter(n => n.user_id === userId)
  
  // Sort by priority and date
  const sortedNotifications = userNotifications.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder]
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder]
    
    if (aPriority !== bPriority) return bPriority - aPriority
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  
  return NextResponse.json({ notifications: sortedNotifications })
}

export async function POST(request: NextRequest) {
  try {
    const { type, ...data } = await request.json()
    
    if (type === 'generate_mat_notifications') {
      const { properties } = data
      const notifications = generateMATNotifications(properties)
      mockNotifications.push(...notifications)
      
      // Send emails for high/critical priority notifications
      for (const notification of notifications) {
        if (notification.priority === 'high' || notification.priority === 'critical') {
          await sendNotificationEmail(notification, {
            id: notification.user_id,
            email: 'gavinmacken87@gmail.com'
          })
        }
      }
      
      return NextResponse.json({ generated: notifications.length })
    }
    
    if (type === 'generate_license_notifications') {
      const { properties } = data
      const notifications = generateLicenseExpiryNotifications(properties)
      mockNotifications.push(...notifications)
      
      // Send emails for high/critical priority notifications
      for (const notification of notifications) {
        if (notification.priority === 'high' || notification.priority === 'critical') {
          await sendNotificationEmail(notification, {
            id: notification.user_id,
            email: 'gavinmacken87@gmail.com'
          })
        }
      }
      
      return NextResponse.json({ generated: notifications.length })
    }
    
    if (type === 'bylaw_update') {
      const { municipality, title, description, affected_user_ids } = data
      const notifications = affected_user_ids.map((userId: string) => ({
        id: `bylaw_${municipality}_${Date.now()}_${userId}`,
        user_id: userId,
        type: 'bylaw_update',
        title: `${municipality} By-law Update: ${title}`,
        message: description,
        municipality,
        priority: 'high',
        read: false,
        created_at: new Date().toISOString()
      }))
      
      mockNotifications.push(...notifications)
      
      // Send emails for by-law updates (always high priority)
      for (const notification of notifications) {
        await sendNotificationEmail(notification, {
          id: notification.user_id,
          email: 'gavinmacken87@gmail.com'
        })
      }
      
      return NextResponse.json({ generated: notifications.length })
    }
    
    return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
  } catch (error) {
    console.error('Notification API Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { notification_id, read } = await request.json()
    
    const notification = mockNotifications.find(n => n.id === notification_id)
    if (notification) {
      notification.read = read
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}