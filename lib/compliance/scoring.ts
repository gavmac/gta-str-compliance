interface PropertyDeadline {
  rule_key: string
  due_date: string
  status: 'ok' | 'due_soon' | 'overdue'
}

export function calculateComplianceScore(deadlines: PropertyDeadline[]): number {
  let score = 100

  // Critical compliance items (-20 points each)
  const criticalRules = ['str_license', 'insurance', 'fire_inspection']
  
  for (const rule of criticalRules) {
    const deadline = deadlines.find(d => d.rule_key === rule)
    if (!deadline || deadline.status === 'due_soon' || deadline.status === 'overdue') {
      score -= 20
    }
  }

  // Overdue items (-10 points each, max -40)
  const overdueCount = deadlines.filter(d => d.status === 'overdue').length
  score -= Math.min(overdueCount * 10, 40)

  return Math.max(score, 0)
}

export function calculateDeadlineStatus(dueDate: string): 'ok' | 'due_soon' | 'overdue' {
  const today = new Date()
  const deadline = new Date(dueDate)
  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays <= 30) return 'due_soon'
  return 'ok'
}

export function generateDeadlines(propertyType: 'STR' | 'LTR', cityRules: any[]): PropertyDeadline[] {
  const today = new Date()
  const deadlines: PropertyDeadline[] = []

  for (const rule of cityRules) {
    // Calculate next due date based on frequency
    const nextDue = new Date(today)
    if (rule.frequency_iso === 'P1Y') {
      nextDue.setFullYear(nextDue.getFullYear() + 1)
    } else if (rule.frequency_iso === 'P6M') {
      nextDue.setMonth(nextDue.getMonth() + 6)
    } else if (rule.frequency_iso === 'P3M') {
      nextDue.setMonth(nextDue.getMonth() + 3)
    }

    const dueDateStr = nextDue.toISOString().split('T')[0]
    deadlines.push({
      rule_key: rule.key,
      due_date: dueDateStr,
      status: calculateDeadlineStatus(dueDateStr)
    })
  }

  return deadlines
}