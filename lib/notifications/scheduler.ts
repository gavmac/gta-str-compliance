import { Notification } from './types'
import { getMATReportingRules, calculateNextMATDueDate } from '../compliance/mat-reporting'

interface Property {
  id: string
  user_id: string
  municipality: string
  usage_type: string
  license_expiry?: string
}

export function generateMATNotifications(properties: Property[]): Notification[] {
  const notifications: Notification[] = []
  const now = new Date()

  for (const property of properties) {
    if (property.usage_type === 'long_term') continue

    const matInfo = calculateNextMATDueDate(property.municipality, 'str', now)
    if (!matInfo?.dueDate) continue

    const daysUntilDue = Math.ceil((matInfo.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // 30-day warning
    if (daysUntilDue === 30) {
      notifications.push({
        id: `mat_30_${property.id}_${matInfo.dueDate.getTime()}`,
        user_id: property.user_id,
        type: 'mat_due',
        title: 'MAT Report Due in 30 Days',
        message: `Your ${property.municipality} MAT report is due ${matInfo.description.toLowerCase()}. Due date: ${matInfo.dueDate.toLocaleDateString()}`,
        municipality: property.municipality,
        property_id: property.id,
        due_date: matInfo.dueDate.toISOString(),
        priority: 'medium',
        read: false,
        created_at: now.toISOString(),
        scheduled_for: now.toISOString()
      })
    }

    // 7-day warning
    if (daysUntilDue === 7) {
      notifications.push({
        id: `mat_7_${property.id}_${matInfo.dueDate.getTime()}`,
        user_id: property.user_id,
        type: 'mat_due',
        title: 'MAT Report Due in 7 Days',
        message: `Urgent: Your ${property.municipality} MAT report is due ${matInfo.description.toLowerCase()}. Due date: ${matInfo.dueDate.toLocaleDateString()}`,
        municipality: property.municipality,
        property_id: property.id,
        due_date: matInfo.dueDate.toISOString(),
        priority: 'high',
        read: false,
        created_at: now.toISOString(),
        scheduled_for: now.toISOString()
      })
    }

    // Overdue
    if (daysUntilDue < 0) {
      notifications.push({
        id: `mat_overdue_${property.id}_${matInfo.dueDate.getTime()}`,
        user_id: property.user_id,
        type: 'mat_due',
        title: 'MAT Report Overdue',
        message: `Critical: Your ${property.municipality} MAT report was due ${Math.abs(daysUntilDue)} days ago. File immediately to avoid penalties.`,
        municipality: property.municipality,
        property_id: property.id,
        due_date: matInfo.dueDate.toISOString(),
        priority: 'critical',
        read: false,
        created_at: now.toISOString(),
        scheduled_for: now.toISOString()
      })
    }
  }

  return notifications
}

export function generateLicenseExpiryNotifications(properties: Property[]): Notification[] {
  const notifications: Notification[] = []
  const now = new Date()

  for (const property of properties) {
    if (!property.license_expiry || property.usage_type === 'long_term') continue

    const expiryDate = new Date(property.license_expiry)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // 60-day warning
    if (daysUntilExpiry === 60) {
      notifications.push({
        id: `license_60_${property.id}_${expiryDate.getTime()}`,
        user_id: property.user_id,
        type: 'license_expiry',
        title: 'License Expires in 60 Days',
        message: `Your ${property.municipality} STR license expires on ${expiryDate.toLocaleDateString()}. Start renewal process now.`,
        municipality: property.municipality,
        property_id: property.id,
        due_date: expiryDate.toISOString(),
        priority: 'medium',
        read: false,
        created_at: now.toISOString(),
        scheduled_for: now.toISOString()
      })
    }

    // 30-day warning
    if (daysUntilExpiry === 30) {
      notifications.push({
        id: `license_30_${property.id}_${expiryDate.getTime()}`,
        user_id: property.user_id,
        type: 'license_expiry',
        title: 'License Expires in 30 Days',
        message: `Urgent: Your ${property.municipality} STR license expires on ${expiryDate.toLocaleDateString()}. Renew immediately.`,
        municipality: property.municipality,
        property_id: property.id,
        due_date: expiryDate.toISOString(),
        priority: 'high',
        read: false,
        created_at: now.toISOString(),
        scheduled_for: now.toISOString()
      })
    }

    // Expired
    if (daysUntilExpiry < 0) {
      notifications.push({
        id: `license_expired_${property.id}_${expiryDate.getTime()}`,
        user_id: property.user_id,
        type: 'license_expiry',
        title: 'License Expired',
        message: `Critical: Your ${property.municipality} STR license expired ${Math.abs(daysUntilExpiry)} days ago. Operating without valid license may result in penalties.`,
        municipality: property.municipality,
        property_id: property.id,
        due_date: expiryDate.toISOString(),
        priority: 'critical',
        read: false,
        created_at: now.toISOString(),
        scheduled_for: now.toISOString()
      })
    }
  }

  return notifications
}

export function createBylawUpdateNotification(
  municipality: string, 
  title: string, 
  description: string, 
  affectedUserIds: string[]
): Notification[] {
  const now = new Date()
  
  return affectedUserIds.map(userId => ({
    id: `bylaw_${municipality}_${now.getTime()}_${userId}`,
    user_id: userId,
    type: 'bylaw_update' as const,
    title: `${municipality} By-law Update: ${title}`,
    message: description,
    municipality,
    priority: 'high' as const,
    read: false,
    created_at: now.toISOString(),
    scheduled_for: now.toISOString()
  }))
}