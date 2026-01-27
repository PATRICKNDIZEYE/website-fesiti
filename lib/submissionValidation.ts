import { Indicator } from './types'

export function validateSubmissionForm(
  projectId: string,
  indicatorId: string,
  periodId: string,
  valueNumber: string,
  valueText: string,
  indicator: Indicator | null
): string | null {
  if (!projectId) return 'Please select a project'
  if (!indicatorId) return 'Please select an indicator'
  if (!periodId) return 'Please select a reporting period'
  if (!valueNumber && !valueText) return 'Please enter a value'
  
  // Handle unit as object or string
  const unitValue = typeof indicator?.unit === 'object' && indicator?.unit
    ? indicator.unit.name?.toLowerCase()
    : indicator?.unit
  
  if (indicator && indicator.type !== 'qualitative' && unitValue !== 'text') {
    const numValue = parseFloat(valueNumber)
    if (isNaN(numValue) || numValue < 0) {
      return 'Please enter a valid numeric value'
    }
  }
  
  return null
}
