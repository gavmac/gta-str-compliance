import { Database } from './database'

// Database table types
export type User = Database['public']['Tables']['users']['Row']
export type City = Database['public']['Tables']['cities']['Row']
export type Rule = Database['public']['Tables']['rules']['Row']
export type RuleUpdate = Database['public']['Tables']['rule_updates']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Property = Database['public']['Tables']['properties']['Row']
export type PropertyDeadline = Database['public']['Tables']['property_deadlines']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type EmailSent = Database['public']['Tables']['emails_sent']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type PropertyInsert = Database['public']['Tables']['properties']['Insert']
export type PropertyDeadlineInsert = Database['public']['Tables']['property_deadlines']['Insert']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type EmailSentInsert = Database['public']['Tables']['emails_sent']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type PropertyUpdate = Database['public']['Tables']['properties']['Update']
export type PropertyDeadlineUpdate = Database['public']['Tables']['property_deadlines']['Update']

// Extended types with relationships
export type PropertyWithCity = Property & {
  city: City
}

export type PropertyWithDeadlines = Property & {
  city: City
  property_deadlines: PropertyDeadline[]
  documents: Document[]
}

export type PropertyDeadlineWithRule = PropertyDeadline & {
  rule: Rule
}

export type RuleUpdateWithCity = RuleUpdate & {
  city: City
}

// Compliance scoring types
export type ComplianceScore = {
  score: number
  breakdown: {
    base: number
    criticalDeductions: number
    overdueDeductions: number
  }
  status: 'excellent' | 'good' | 'fair' | 'poor'
}

// Email template types
export type EmailTemplate = {
  subject: string
  html: string
  text: string
}

export type EmailContext = {
  user: User
  city?: City
  properties?: PropertyWithDeadlines[]
  ruleUpdates?: RuleUpdateWithCity[]
  unsubscribeUrl: string
}

// API response types
export type ApiResponse<T = any> = {
  data?: T
  error?: string
  message?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export type PropertyFormData = {
  address_line1: string
  address_line2?: string
  city_id: number
  postal_code?: string
  type: 'STR' | 'LTR'
}

export type DocumentUploadData = {
  property_id: string
  kind: 'license' | 'insurance' | 'inspection' | 'other'
  file: File
  expires_on?: string
}

// Stripe types
export type StripeCheckoutSession = {
  sessionId: string
  url: string
}

export type StripeWebhookEvent = {
  id: string
  type: string
  data: {
    object: any
  }
}

// Compliance calculation types
export type DeadlineStatus = 'ok' | 'due_soon' | 'overdue'

export type ComplianceRule = {
  key: string
  name: string
  weight: number // Points deducted if non-compliant
  criticalDays: number // Days before due date to mark as critical
}

// Dashboard types
export type DashboardStats = {
  totalProperties: number
  averageComplianceScore: number
  upcomingDeadlines: number
  overdueItems: number
}

export type PropertySummary = {
  id: string
  address: string
  city: string
  type: 'STR' | 'LTR'
  complianceScore: number
  nextDeadline?: {
    rule: string
    dueDate: string
    daysUntilDue: number
  }
  status: DeadlineStatus
}