import { IndicatorFrequency } from '@/lib/types'

export interface Period {
  periodKey: string
  startDate: string
  endDate: string
  dueDate: string
}

export function generatePeriods(
  frequency: IndicatorFrequency,
  dueDaysAfterPeriodEnd: number
): Period[] {
  const periods: Period[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  if (frequency === 'monthly') {
    for (let i = 0; i < 12; i++) {
      const month = (currentMonth + i) % 12
      const year = currentYear + Math.floor((currentMonth + i) / 12)
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)
      const dueDate = new Date(endDate)
      dueDate.setDate(dueDate.getDate() + dueDaysAfterPeriodEnd)
      
      periods.push({
        periodKey: `${year}-${String(month + 1).padStart(2, '0')}`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
      })
    }
  } else if (frequency === 'quarterly') {
    for (let i = 0; i < 4; i++) {
      const quarter = Math.floor(currentMonth / 3) + i
      const year = currentYear + Math.floor(quarter / 4)
      const quarterInYear = quarter % 4
      const startMonth = quarterInYear * 3
      const startDate = new Date(year, startMonth, 1)
      const endDate = new Date(year, startMonth + 3, 0)
      const dueDate = new Date(endDate)
      dueDate.setDate(dueDate.getDate() + dueDaysAfterPeriodEnd)
      
      periods.push({
        periodKey: `Q${quarterInYear + 1}-${year}`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
      })
    }
  } else if (frequency === 'termly') {
    // 3 terms per year: Term 1 (Jan–Apr), Term 2 (May–Aug), Term 3 (Sep–Dec)
    for (let i = 0; i < 6; i++) {
      const termInCycle = i % 3
      const year = currentYear + Math.floor(i / 3)
      const startMonth = termInCycle * 4
      const startDate = new Date(year, startMonth, 1)
      const endDate = new Date(year, startMonth + 4, 0)
      const dueDate = new Date(endDate)
      dueDate.setDate(dueDate.getDate() + dueDaysAfterPeriodEnd)
      periods.push({
        periodKey: `Term ${termInCycle + 1}-${year}`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
      })
    }
  } else if (frequency === 'annual') {
    for (let i = 0; i < 3; i++) {
      const year = currentYear + i
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31)
      const dueDate = new Date(endDate)
      dueDate.setDate(dueDate.getDate() + dueDaysAfterPeriodEnd)
      
      periods.push({
        periodKey: `${year}`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
      })
    }
  }

  return periods
}
