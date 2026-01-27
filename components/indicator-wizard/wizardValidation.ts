interface IndicatorData {
  name: string
  unitId: string
  aggregationRule: string
  formulaExpr: string
}

interface Period {
  periodKey: string
  startDate: string
  endDate: string
  dueDate: string
}

export function validateWizardStep(
  step: number,
  indicatorData: IndicatorData,
  periods: Period[]
): string | null {
  switch (step) {
    case 1:
      if (!indicatorData.name.trim()) {
        return 'Indicator name is required'
      }
      if (!indicatorData.unitId) {
        return 'Unit of measurement is required - a value without units is meaningless'
      }
      if (indicatorData.aggregationRule === 'formula' && !indicatorData.formulaExpr.trim()) {
        return 'Formula expression is required when using formula aggregation'
      }
      return null
    case 2:
      return null // Schedule is always valid
    case 3:
      if (periods.length === 0) {
        return 'At least one reporting period is required'
      }
      return null
    default:
      return null
  }
}
