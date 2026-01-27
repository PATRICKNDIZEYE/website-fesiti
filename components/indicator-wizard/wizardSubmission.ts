import { orgApi, indicatorSchedulesApi, indicatorPeriodsApi } from '@/lib/api-helpers'
import { IndicatorPeriodStatus } from '@/lib/types'
import type { Period } from './periodGenerator'

interface IndicatorData {
  name: string
  definition: string
  unitId: string
  direction: 'increase' | 'decrease'
  aggregationRule: 'sum' | 'avg' | 'latest' | 'formula'
  formulaExpr: string
  baselineValue: string
  baselineDate: string
  requiresReview: boolean
  isActive: boolean
}

interface ScheduleData {
  frequency: string
  calendarType: string
  dueDaysAfterPeriodEnd: number
  graceDays: number
  isOpenOnCreate: boolean
}

export async function submitIndicatorWizard(
  orgId: string,
  projectId: string,
  indicatorData: IndicatorData,
  scheduleData: ScheduleData,
  periods: Period[]
): Promise<string> {
  // Step 1: Create indicator with required unit
  const indicatorResponse = await orgApi.post(orgId, 'indicators', {
    name: indicatorData.name,
    definition: indicatorData.definition || undefined,
    unitId: indicatorData.unitId, // Required - a value without units is meaningless
    direction: indicatorData.direction,
    aggregationRule: indicatorData.aggregationRule,
    formulaExpr: indicatorData.formulaExpr || undefined,
    baselineValue: indicatorData.baselineValue ? parseFloat(indicatorData.baselineValue) : undefined,
    baselineDate: indicatorData.baselineDate || undefined,
    requiresReview: indicatorData.requiresReview,
    isActive: indicatorData.isActive,
    projectId,
  })

  const indicatorId = indicatorResponse.data.id

  // Step 2: Create schedule
  await indicatorSchedulesApi.create(orgId, {
    indicatorId,
    frequency: scheduleData.frequency as any,
    calendarType: scheduleData.calendarType as any,
    dueDaysAfterPeriodEnd: scheduleData.dueDaysAfterPeriodEnd,
    graceDays: scheduleData.graceDays,
    isOpenOnCreate: scheduleData.isOpenOnCreate,
  })

  // Step 3: Create periods
  for (const period of periods) {
    await indicatorPeriodsApi.create(orgId, {
      indicatorId,
      periodKey: period.periodKey,
      startDate: period.startDate,
      endDate: period.endDate,
      dueDate: period.dueDate,
      status: scheduleData.isOpenOnCreate ? ('open' as IndicatorPeriodStatus) : ('closed' as IndicatorPeriodStatus),
    })
  }

  return indicatorId
}
