interface ComplianceRule {
  id: string
  municipality: string
  name: string
  description: string
  bylaw_reference: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  check: (property: any) => boolean
  message: string
}

interface JurisdictionRuleSet {
  bylaw: string
  version: string
  url?: string
  requires_registration: boolean
  principal_residence_only: boolean
  max_entire_unit_nights?: number
  record_retention_years?: number
  mat_required: boolean
  fire_emergency: {
    guest_emergency_contact: boolean
    exit_diagram_posted: boolean
    guest_info_package: boolean
    evacuation_plan: boolean
  }
  rules: ComplianceRule[]
}

export const JURISDICTION_RULES: Record<string, JurisdictionRuleSet> = {
  toronto: {
    bylaw: 'Toronto Municipal Code Chapter 547',
    version: 'as of 2025-01-01',
    requires_registration: true,
    principal_residence_only: true,
    max_entire_unit_nights: 180,
    record_retention_years: 3,
    mat_required: true,
    fire_emergency: {
      guest_emergency_contact: true,
      exit_diagram_posted: true,
      guest_info_package: false,
      evacuation_plan: false
    },
    rules: [
      {
        id: 'toronto_registration_required',
        municipality: 'toronto',
        name: 'Operator Registration Required',
        description: 'All STR operators must have valid registration',
        bylaw_reference: 'Toronto Municipal Code Chapter 547, §547-1.2, §547-4.1',
        severity: 'critical',
        check: (property) => property.usage_type !== 'long_term' ? !!property.license_number : true,
        message: 'STR operator registration required under Chapter 547, §547-1.2, §547-4.1'
      },
      {
        id: 'toronto_principal_residence',
        municipality: 'toronto',
        name: 'Principal Residence Requirement',
        description: 'STR must be operator\'s principal residence',
        bylaw_reference: 'Toronto Municipal Code Chapter 547, §547-4.2',
        severity: 'critical',
        check: (property) => property.usage_type !== 'long_term' ? property.is_principal_residence === true : true,
        message: 'STR must be your principal residence per §547-4.2'
      },
      {
        id: 'toronto_emergency_contact',
        municipality: 'toronto',
        name: 'Emergency Contact Information',
        description: 'Must provide emergency contact available during entire stay',
        bylaw_reference: 'Toronto Municipal Code Chapter 547',
        severity: 'high',
        check: (property) => property.usage_type !== 'long_term' ? !!property.emergency_contact : true,
        message: 'Must provide guests emergency contact information for person available during entire stay'
      },
      {
        id: 'toronto_911_info',
        municipality: 'toronto',
        name: '9-1-1 Information',
        description: 'Must provide information on using 9-1-1',
        bylaw_reference: 'Toronto Municipal Code Chapter 547',
        severity: 'high',
        check: (property) => property.usage_type !== 'long_term' ? !!property.provides_911_info : true,
        message: 'Must provide guests information on using 9-1-1'
      },
      {
        id: 'toronto_exit_diagram',
        municipality: 'toronto',
        name: 'Exit Diagram Posted',
        description: 'Must post diagram of all exits in conspicuous place',
        bylaw_reference: 'Toronto Municipal Code Chapter 547',
        severity: 'high',
        check: (property) => property.usage_type !== 'long_term' ? !!property.exit_diagram_posted : true,
        message: 'Must post diagram of all exits from building in conspicuous place during guest stay'
      },
      {
        id: 'toronto_180_night_cap',
        municipality: 'toronto',
        name: '180-Night Annual Cap',
        description: 'Entire-unit STR capped at 180 nights per year',
        bylaw_reference: 'Toronto Municipal Code Chapter 547',
        severity: 'medium',
        check: (property) => property.usage_type !== 'long_term' ? (property.annual_nights || 0) <= 180 : true,
        message: 'Entire-unit STR capped at 180 nights per calendar year'
      },
      {
        id: 'toronto_record_keeping',
        municipality: 'toronto',
        name: 'Record Keeping (3 years)',
        description: 'Must keep detailed transaction records for 3 years',
        bylaw_reference: 'Toronto Municipal Code Chapter 547, §547-4.5',
        severity: 'medium',
        check: (property) => property.usage_type !== 'long_term' ? !!property.keeps_records : true,
        message: 'Must keep detailed transaction records (nights, prices, entire/partial) for 3 years per §547-4.5'
      }
    ]
  },
  
  mississauga: {
    bylaw: 'Short-Term Rental Accommodation Licensing By-law 0289-2020',
    version: 'with amendments',
    requires_registration: true,
    principal_residence_only: false,
    record_retention_years: 3,
    mat_required: false,
    fire_emergency: {
      guest_emergency_contact: true,
      exit_diagram_posted: false,
      guest_info_package: true,
      evacuation_plan: true
    },
    rules: [
      {
        id: 'mississauga_license_required',
        municipality: 'mississauga',
        name: 'STR Accommodation License Required',
        description: 'Valid license required to operate STR',
        bylaw_reference: 'Short Term Rental Accommodation Licensing By-Law 0289-2020',
        severity: 'critical',
        check: (property) => property.usage_type !== 'long_term' ? !!property.license_number : true,
        message: 'STR Accommodation License required under By-law 0289-2020'
      },
      {
        id: 'mississauga_local_contact',
        municipality: 'mississauga',
        name: 'Local Contact Required',
        description: 'Must provide local contact details',
        bylaw_reference: 'Short Term Rental Accommodation Licensing By-Law 0289-2020',
        severity: 'high',
        check: (property) => property.usage_type !== 'long_term' ? !!property.local_contact : true,
        message: 'Local contact details required per Schedule A'
      },
      {
        id: 'mississauga_evacuation_info',
        municipality: 'mississauga',
        name: 'Evacuation/Safety Info Package',
        description: 'Must provide evacuation plan and safety info to guests',
        bylaw_reference: 'Short Term Rental Accommodation Licensing By-Law 0289-2020',
        severity: 'high',
        check: (property) => property.usage_type !== 'long_term' ? !!property.evacuation_info : true,
        message: 'Guest info including evacuation plan/safety info required per Schedule'
      },
      {
        id: 'mississauga_record_keeping',
        municipality: 'mississauga',
        name: 'Record Keeping (3 years)',
        description: 'Maintain records including stays, fees, and MAT for 3 years',
        bylaw_reference: 'Short Term Rental Accommodation Licensing By-Law 0289-2020',
        severity: 'medium',
        check: (property) => property.usage_type !== 'long_term' ? !!property.keeps_records : true,
        message: 'Maintain records (stays, fees, MAT where applicable) for 3 years'
      }
    ]
  },
  
  brampton: {
    bylaw: 'Short-Term Rental By-law 165-2021',
    version: 'office consolidation',
    requires_registration: true,
    principal_residence_only: true,
    record_retention_years: 3,
    mat_required: false,
    fire_emergency: {
      guest_emergency_contact: true,
      exit_diagram_posted: false,
      guest_info_package: true,
      evacuation_plan: true
    },
    rules: [
      {
        id: 'brampton_host_license',
        municipality: 'brampton',
        name: 'STR Host License Required',
        description: 'License required for all STR hosts',
        bylaw_reference: 'Short-Term Rental By-law 165-2021, Part III',
        severity: 'critical',
        check: (property) => property.usage_type !== 'long_term' ? !!property.license_number : true,
        message: 'STR Host License required under By-law 165-2021, Part III'
      },
      {
        id: 'brampton_principal_residence',
        municipality: 'brampton',
        name: 'Principal Residence Only',
        description: 'STR must be principal residence',
        bylaw_reference: 'Short-Term Rental By-law 165-2021',
        severity: 'critical',
        check: (property) => property.usage_type !== 'long_term' ? property.is_principal_residence === true : true,
        message: 'STR must be principal residence under By-law 165-2021'
      },
      {
        id: 'brampton_guest_info_package',
        municipality: 'brampton',
        name: 'Guest Information Package Required',
        description: 'Comprehensive guest info package with emergency contacts and safety info',
        bylaw_reference: 'Short-Term Rental By-law 165-2021',
        severity: 'high',
        check: (property) => property.usage_type !== 'long_term' ? !!property.guest_info_package : true,
        message: 'Guest information package required with 24/7 emergency contact, floor plan with exits/safety equipment, police/health emergency contacts, and fire safety plan'
      }
    ]
  },
  
  vaughan: {
    bylaw: 'Short-Term Rental Licensing By-law 158-2019 (Consolidated)',
    version: 'with amendments to 2025',
    requires_registration: true,
    principal_residence_only: false,
    record_retention_years: 3,
    mat_required: true,
    fire_emergency: {
      guest_emergency_contact: false,
      exit_diagram_posted: false,
      guest_info_package: false,
      evacuation_plan: false
    },
    rules: [
      {
        id: 'vaughan_owner_license',
        municipality: 'vaughan',
        name: 'STR Owner License Required',
        description: 'STR owners must be licensed',
        bylaw_reference: 'Short-Term Rental By-law 158-2019 (Consolidated)',
        severity: 'critical',
        check: (property) => property.usage_type !== 'long_term' ? !!property.license_number : true,
        message: 'STR Owner License required under By-law 158-2019'
      },
      {
        id: 'vaughan_mat_registration',
        municipality: 'vaughan',
        name: 'MAT Registration Required',
        description: 'Must be registered for Municipal Accommodation Tax',
        bylaw_reference: 'Short-Term Rental By-law 158-2019 (Consolidated)',
        severity: 'critical',
        check: (property) => property.usage_type !== 'long_term' ? !!property.mat_registered : true,
        message: 'Must be registered for Municipal Accommodation Tax before licence issuance'
      }
    ]
  },
  
  newmarket: {
    bylaw: 'Municipal Accommodation Tax By-law 2024-68',
    version: 'effective Jan 1, 2025',
    requires_registration: false,
    principal_residence_only: false,
    record_retention_years: 3,
    mat_required: true,
    fire_emergency: {
      guest_emergency_contact: false,
      exit_diagram_posted: false,
      guest_info_package: false,
      evacuation_plan: false
    },
    rules: [
      {
        id: 'newmarket_mat_collection',
        municipality: 'newmarket',
        name: '4% MAT Collection Required',
        description: '4% MAT on STR stays under 28 days',
        bylaw_reference: 'Municipal Accommodation Tax By-law 2024-68',
        severity: 'critical',
        check: (property) => property.usage_type !== 'long_term' ? !!property.collects_mat : true,
        message: '4% MAT collection required on STR stays under 28 days, effective Jan 1, 2025'
      },
      {
        id: 'newmarket_mat_separate_line',
        municipality: 'newmarket',
        name: 'MAT as Separate Line Item',
        description: 'MAT must be shown as separate line item',
        bylaw_reference: 'Municipal Accommodation Tax By-law 2024-68',
        severity: 'high',
        check: (property) => property.usage_type !== 'long_term' ? !!property.mat_separate_line : true,
        message: 'MAT must be shown as separate line item to guests'
      },
      {
        id: 'newmarket_quarterly_remittance',
        municipality: 'newmarket',
        name: 'Quarterly MAT Remittance',
        description: 'STR providers must remit MAT quarterly',
        bylaw_reference: 'Municipal Accommodation Tax By-law 2024-68',
        severity: 'high',
        check: (property) => property.usage_type !== 'long_term' ? !!property.quarterly_remittance : true,
        message: 'STR providers must remit MAT quarterly (within 15 days of period end)'
      }
    ]
  },
  
  hamilton: {
    bylaw: 'Report PED17203(c) - Draft Framework',
    version: 'policy document only',
    requires_registration: false,
    principal_residence_only: false,
    record_retention_years: 0,
    mat_required: false,
    fire_emergency: {
      guest_emergency_contact: false,
      exit_diagram_posted: false,
      guest_info_package: false,
      evacuation_plan: false
    },
    rules: [
      {
        id: 'hamilton_draft_notice',
        municipality: 'hamilton',
        name: 'Draft Rules - Confirmation Required',
        description: 'Hamilton rules based on council framework only',
        bylaw_reference: 'Report PED17203(c) - Draft Framework',
        severity: 'medium',
        check: () => false,
        message: 'Based on draft framework from Report PED17203(c) - confirm against final enacted by-law before operating'
      }
    ]
  },
  
  richmond_hill: {
    bylaw: 'Short-Term And Shared Accommodations Study',
    version: 'first draft study',
    requires_registration: false,
    principal_residence_only: false,
    record_retention_years: 0,
    mat_required: false,
    fire_emergency: {
      guest_emergency_contact: false,
      exit_diagram_posted: false,
      guest_info_package: false,
      evacuation_plan: false
    },
    rules: [
      {
        id: 'richmond_hill_study_only',
        municipality: 'richmond_hill',
        name: 'Study Document Only - No Binding Rules',
        description: 'No binding STR by-law from loaded documents',
        bylaw_reference: 'Short-Term And Shared Accommodations Study',
        severity: 'low',
        check: () => false,
        message: 'Background study only - not enforceable by-law. No specific STR licensing requirements found. Confirm directly with municipality.'
      }
    ]
  }
}

// Legacy export for backward compatibility
export const MUNICIPALITY_RULES: Record<string, ComplianceRule[]> = Object.fromEntries(
  Object.entries(JURISDICTION_RULES).map(([key, jurisdiction]) => [key, jurisdiction.rules])
)

export function checkCompliance(property: any): {
  status: 'compliant' | 'at_risk' | 'non_compliant'
  failing_rules: ComplianceRule[]
  passing_rules: ComplianceRule[]
  explanation: string
  jurisdiction: JurisdictionRuleSet | null
} {
  const jurisdiction = JURISDICTION_RULES[property.municipality] || null
  const rules = jurisdiction?.rules || []
  const failing_rules: ComplianceRule[] = []
  const passing_rules: ComplianceRule[] = []
  
  for (const rule of rules) {
    if (rule.check(property)) {
      passing_rules.push(rule)
    } else {
      failing_rules.push(rule)
    }
  }
  
  // Determine status - binary compliance check
  const criticalFailures = failing_rules.filter(r => r.severity === 'critical').length
  const highFailures = failing_rules.filter(r => r.severity === 'high').length
  
  let status: 'compliant' | 'at_risk' | 'non_compliant'
  
  if (criticalFailures > 0) {
    status = 'non_compliant'  // Any critical failure = non-compliant
  } else if (highFailures > 0) {
    status = 'at_risk'        // High priority issues = at risk
  } else if (failing_rules.length > 0) {
    status = 'at_risk'        // Any failures = at risk
  } else {
    status = 'compliant'      // No failures = compliant
  }
  
  // Generate explanation
  let explanation = `Based on ${jurisdiction?.bylaw || 'available regulations'} (${jurisdiction?.version || 'unknown version'}):\n\n`
  
  if (status === 'compliant') {
    explanation += "✓ COMPLIANT: All requirements met\n\n"
  } else if (status === 'non_compliant') {
    explanation += "✗ NON-COMPLIANT: Critical requirements not met\n\n"
  } else {
    explanation += "⚠ AT RISK: Some requirements not met\n\n"
  }
  
  if (failing_rules.length > 0) {
    explanation += "Issues found:\n"
    failing_rules.forEach(rule => {
      const icon = rule.severity === 'critical' ? '✗' : '⚠'
      explanation += `${icon} ${rule.message} (${rule.bylaw_reference})\n`
    })
  }
  
  if (passing_rules.length > 0) {
    explanation += "\nRequirements met:\n"
    passing_rules.forEach(rule => {
      explanation += `✓ ${rule.name}\n`
    })
  }
  
  if (jurisdiction && (property.municipality === 'hamilton' || property.municipality === 'richmond_hill')) {
    explanation += "\n⚠️ Note: Rules based on policy documents only - confirm against final enacted by-law.\n"
  }
  
  explanation += "\n⚠️ This is not legal advice. Always confirm with the municipality or legal counsel."
  
  return {
    status,
    failing_rules,
    passing_rules,
    explanation,
    jurisdiction
  }
}

export function getJurisdictionInfo(municipality: string): JurisdictionRuleSet | null {
  return JURISDICTION_RULES[municipality] || null
}