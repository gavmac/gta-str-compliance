import { NextRequest, NextResponse } from 'next/server'
import { checkCompliance } from '@/lib/compliance/rules'
import { getMATReportingRules, calculateNextMATDueDate } from '@/lib/compliance/mat-reporting'

// Mock properties data
let mockProperties: any[] = []

export async function GET() {
  return NextResponse.json({ properties: mockProperties })
}

export async function POST(request: NextRequest) {
  try {
    const { 
      address_line1, 
      municipality, 
      usage_type, 
      is_principal_residence, 
      license_number, 
      license_expiry, 
      mat_number 
    } = await request.json()
    
    const property = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: 'dev-user-123',
      address_line1,
      municipality,
      usage_type,
      is_principal_residence,
      license_number,
      license_expiry,
      mat_number,
      created_at: new Date().toISOString()
    }
    
    // Check compliance using rule engine
    const compliance = checkCompliance(property)
    
    // Get MAT reporting info if applicable
    const matReporting = getMATReportingRules(municipality, 'str')
    const nextMATDue = calculateNextMATDueDate(municipality, 'str')
    
    const propertyWithCompliance = {
      ...property,
      compliance_status: compliance.status,
      failing_rules: compliance.failing_rules,
      passing_rules: compliance.passing_rules,
      compliance_explanation: compliance.explanation,
      mat_reporting: matReporting,
      next_mat_due: nextMATDue
    }

    mockProperties.push(propertyWithCompliance)
    return NextResponse.json({ property: propertyWithCompliance })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}