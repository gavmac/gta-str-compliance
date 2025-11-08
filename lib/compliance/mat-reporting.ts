interface MATReportingConfig {
  applies_to: 'hotel' | 'str' | 'both'
  reporting_frequency: 'monthly' | 'quarterly'
  due_offset_days?: number
  due_description: string
  requires_zero_return: boolean
  bylaw_reference: string
}

export const MAT_REPORTING_RULES: Record<string, MATReportingConfig[]> = {
  toronto: [
    {
      applies_to: 'hotel',
      reporting_frequency: 'monthly',
      due_offset_days: 15,
      due_description: 'Within 15 days after month-end',
      requires_zero_return: true,
      bylaw_reference: 'Toronto Municipal Code Chapter 758'
    },
    {
      applies_to: 'str',
      reporting_frequency: 'quarterly',
      due_offset_days: 30,
      due_description: 'Within 30 days after quarter-end',
      requires_zero_return: true,
      bylaw_reference: 'Toronto Municipal Code Chapter 758'
    }
  ],
  
  mississauga: [
    {
      applies_to: 'both',
      reporting_frequency: 'monthly',
      due_description: 'On or before last day of following month',
      requires_zero_return: true,
      bylaw_reference: 'Municipal Accommodation Tax Policy 04-02-06 (By-law 0023-2018)'
    }
  ],
  
  brampton: [
    {
      applies_to: 'both',
      reporting_frequency: 'quarterly',
      due_description: 'As per official MAT schedule (configurable)',
      requires_zero_return: true,
      bylaw_reference: 'MAT By-law 106-2023'
    }
  ],
  
  vaughan: [
    {
      applies_to: 'hotel',
      reporting_frequency: 'monthly',
      due_description: 'As per MAT by-law schedule',
      requires_zero_return: true,
      bylaw_reference: 'Vaughan MAT By-law 183-2019'
    },
    {
      applies_to: 'str',
      reporting_frequency: 'quarterly',
      due_description: 'As per MAT by-law schedule',
      requires_zero_return: true,
      bylaw_reference: 'Vaughan MAT By-law 183-2019'
    }
  ],
  
  newmarket: [
    {
      applies_to: 'hotel',
      reporting_frequency: 'monthly',
      due_offset_days: 15,
      due_description: 'Within 15 days after month-end',
      requires_zero_return: true,
      bylaw_reference: 'Municipal Accommodation Tax By-law 2024-68'
    },
    {
      applies_to: 'str',
      reporting_frequency: 'quarterly',
      due_offset_days: 15,
      due_description: 'Within 15 days after quarter-end',
      requires_zero_return: true,
      bylaw_reference: 'Municipal Accommodation Tax By-law 2024-68'
    }
  ],
  
  hamilton: [
    {
      applies_to: 'both',
      reporting_frequency: 'monthly',
      due_description: 'As per by-law-defined due date (configurable)',
      requires_zero_return: true,
      bylaw_reference: 'Hamilton MAT By-law No. 22-209'
    }
  ]
}

export function getMATReportingRules(municipality: string, propertyType: 'hotel' | 'str'): MATReportingConfig | null {
  const rules = MAT_REPORTING_RULES[municipality] || []
  
  // Find specific rule for property type, or fall back to 'both'
  return rules.find(rule => rule.applies_to === propertyType) || 
         rules.find(rule => rule.applies_to === 'both') || 
         null
}

export function calculateNextMATDueDate(municipality: string, propertyType: 'hotel' | 'str', currentDate: Date = new Date()): {
  dueDate: Date | null
  description: string
  requiresZeroReturn: boolean
} | null {
  const rule = getMATReportingRules(municipality, propertyType)
  if (!rule) return null
  
  let dueDate: Date | null = null
  
  if (rule.due_offset_days) {
    if (rule.reporting_frequency === 'monthly') {
      dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, rule.due_offset_days)
    } else if (rule.reporting_frequency === 'quarterly') {
      const currentQuarter = Math.floor(currentDate.getMonth() / 3)
      const nextQuarterStart = new Date(currentDate.getFullYear(), (currentQuarter + 1) * 3, 1)
      dueDate = new Date(nextQuarterStart.getTime() + (rule.due_offset_days * 24 * 60 * 60 * 1000))
    }
  }
  
  return {
    dueDate,
    description: rule.due_description,
    requiresZeroReturn: rule.requires_zero_return
  }
}