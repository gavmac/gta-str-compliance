export interface Notification {
  id: string
  user_id: string
  type: 'bylaw_update' | 'mat_due' | 'license_expiry' | 'compliance_alert'
  title: string
  message: string
  municipality?: string
  property_id?: string
  due_date?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  read: boolean
  created_at: string
  scheduled_for?: string
}

export interface NotificationRule {
  id: string
  type: 'mat_reminder' | 'license_expiry' | 'bylaw_update'
  days_before: number
  enabled: boolean
  municipality?: string
}

export const DEFAULT_NOTIFICATION_RULES: NotificationRule[] = [
  {
    id: 'mat_30_days',
    type: 'mat_reminder',
    days_before: 30,
    enabled: true
  },
  {
    id: 'mat_7_days',
    type: 'mat_reminder', 
    days_before: 7,
    enabled: true
  },
  {
    id: 'license_60_days',
    type: 'license_expiry',
    days_before: 60,
    enabled: true
  },
  {
    id: 'license_30_days',
    type: 'license_expiry',
    days_before: 30,
    enabled: true
  },
  {
    id: 'bylaw_immediate',
    type: 'bylaw_update',
    days_before: 0,
    enabled: true
  }
]