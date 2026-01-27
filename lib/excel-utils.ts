import XLSX from 'xlsx-js-style'
import { DisaggregationDef, DisaggregationValue, Indicator, IndicatorPeriod, Unit } from './types'

interface ExportData {
  indicator: Indicator
  period: IndicatorPeriod
  disaggregations: DisaggregationDef[]
  combinations: DisaggregationValue[][]
  values: Record<string, { value: string; isEstimated: boolean; notes: string }>
}

// Generate all combinations of disaggregation values
export function generateDisaggCombinations(disaggregations: DisaggregationDef[]): DisaggregationValue[][] {
  if (disaggregations.length === 0) return [[]]
  
  const sortedDisaggs = disaggregations.map(d => ({
    ...d,
    values: (d.values || []).sort((a, b) => a.sortOrder - b.sortOrder)
  }))
  
  const result: DisaggregationValue[][] = []
  
  function recurse(index: number, current: DisaggregationValue[]) {
    if (index === sortedDisaggs.length) {
      result.push([...current])
      return
    }
    
    const values = sortedDisaggs[index].values || []
    for (const value of values) {
      current.push(value)
      recurse(index + 1, current)
      current.pop()
    }
  }
  
  recurse(0, [])
  return result
}

// Get combination key
export function getCombinationKey(combination: DisaggregationValue[]): string {
  return combination.map(v => v.id).join('|')
}

// Get unit display
function getUnitDisplay(indicator: Indicator): string {
  const unit = indicator.unit as string | Unit | null
  if (unit && typeof unit === 'object') {
    return unit.symbol || unit.name || ''
  }
  return unit || ''
}

// Convert column index to Excel column letter (0 = A, 1 = B, etc.)
function getColumnLetter(col: number): string {
  let letter = ''
  while (col >= 0) {
    letter = String.fromCharCode((col % 26) + 65) + letter
    col = Math.floor(col / 26) - 1
  }
  return letter
}

// Header style - blue background, white bold text
const headerStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: '4472C4' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: '2F5496' } },
    bottom: { style: 'thin', color: { rgb: '2F5496' } },
    left: { style: 'thin', color: { rgb: '2F5496' } },
    right: { style: 'thin', color: { rgb: '2F5496' } },
  }
}

// Data cell style - light border
const dataCellStyle = {
  border: {
    top: { style: 'thin', color: { rgb: 'D9D9D9' } },
    bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
    left: { style: 'thin', color: { rgb: 'D9D9D9' } },
    right: { style: 'thin', color: { rgb: 'D9D9D9' } },
  },
  alignment: { vertical: 'center' }
}

// Alternating row style (light gray)
const altRowStyle = {
  ...dataCellStyle,
  fill: { fgColor: { rgb: 'F2F2F2' } }
}

/**
 * Export data collection template to Excel - DevResults style
 * Clean data table with bold headers, borders, and dropdown validation
 */
export function exportDataTemplate(data: ExportData): void {
  const { indicator, period, disaggregations, combinations, values } = data
  const workbook = XLSX.utils.book_new()
  const unit = getUnitDisplay(indicator)
  
  // Build headers with style
  const headers: { v: string; t: string; s: any }[] = []
  
  if (disaggregations.length === 0) {
    headers.push(
      { v: 'Value' + (unit ? ` (${unit})` : ''), t: 's', s: headerStyle },
      { v: 'Estimated', t: 's', s: headerStyle },
      { v: 'Notes', t: 's', s: headerStyle }
    )
  } else {
    for (const disagg of disaggregations) {
      headers.push({ v: disagg.name, t: 's', s: headerStyle })
    }
    headers.push(
      { v: 'Value' + (unit ? ` (${unit})` : ''), t: 's', s: headerStyle },
      { v: 'Estimated', t: 's', s: headerStyle },
      { v: 'Notes', t: 's', s: headerStyle }
    )
  }
  
  // Build data rows with styles
  const dataRows: { v: any; t: string; s: any }[][] = []
  
  if (disaggregations.length === 0) {
    const cellValue = values['total'] || { value: '', isEstimated: false, notes: '' }
    dataRows.push([
      { v: cellValue.value || '', t: 's', s: dataCellStyle },
      { v: cellValue.isEstimated ? 'Yes' : '', t: 's', s: dataCellStyle },
      { v: cellValue.notes || '', t: 's', s: dataCellStyle }
    ])
    for (let i = 0; i < 20; i++) {
      const style = i % 2 === 0 ? altRowStyle : dataCellStyle
      dataRows.push([
        { v: '', t: 's', s: style },
        { v: '', t: 's', s: style },
        { v: '', t: 's', s: style }
      ])
    }
  } else {
    combinations.forEach((combination, idx) => {
      const key = getCombinationKey(combination)
      const cellValue = values[key] || { value: '', isEstimated: false, notes: '' }
      const style = idx % 2 === 1 ? altRowStyle : dataCellStyle
      
      const row: { v: any; t: string; s: any }[] = combination.map(v => ({
        v: v.valueLabel,
        t: 's',
        s: style
      }))
      
      row.push(
        { v: cellValue.value || '', t: cellValue.value ? 'n' : 's', s: style },
        { v: cellValue.isEstimated ? 'Yes' : '', t: 's', s: style },
        { v: cellValue.notes || '', t: 's', s: style }
      )
      
      dataRows.push(row)
    })
  }
  
  // Create worksheet
  const allData = [headers, ...dataRows]
  const ws = XLSX.utils.aoa_to_sheet(allData)
  
  // Set column widths
  ws['!cols'] = headers.map((h) => {
    const val = h.v as string
    if (val.includes('Notes')) return { wch: 40 }
    if (val.includes('Estimated')) return { wch: 12 }
    if (val.includes('Value')) return { wch: 18 }
    return { wch: 22 }
  })
  
  // Set row heights
  ws['!rows'] = [{ hpt: 28 }] // Header row taller
  
  // Add data validations for dropdowns
  const headerCount = disaggregations.length === 0 ? 3 : disaggregations.length + 3
  
  // Disaggregation column validations
  for (let colIdx = 0; colIdx < disaggregations.length; colIdx++) {
    const disagg = disaggregations[colIdx]
    const validValues = (disagg.values || []).map(v => v.valueLabel)
    const colLetter = getColumnLetter(colIdx)
    
    if (!ws['!dataValidation']) ws['!dataValidation'] = []
    ws['!dataValidation'].push({
      sqref: `${colLetter}2:${colLetter}1000`,
      type: 'list',
      formula1: `"${validValues.join(',')}"`,
      showErrorMessage: true,
      error: `Select: ${validValues.join(', ')}`,
      errorTitle: `Invalid ${disagg.name}`,
      showDropDown: false,
    })
  }
  
  // Estimated column validation (Yes/No dropdown)
  const estimatedColIdx = disaggregations.length === 0 ? 1 : disaggregations.length + 1
  const estimatedColLetter = getColumnLetter(estimatedColIdx)
  if (!ws['!dataValidation']) ws['!dataValidation'] = []
  ws['!dataValidation'].push({
    sqref: `${estimatedColLetter}2:${estimatedColLetter}1000`,
    type: 'list',
    formula1: '"Yes,No"',
    showDropDown: false,
  })
  
  // Add autofilter (table-like headers with dropdown arrows)
  ws['!autofilter'] = { ref: `A1:${getColumnLetter(headerCount - 1)}1` }
  
  // Add sheet to workbook
  const sheetName = indicator.name.substring(0, 28).replace(/[\\/*?[\]]/g, '_')
  XLSX.utils.book_append_sheet(workbook, ws, sheetName)
  
  // Add hidden metadata sheet
  const metadataSheet = XLSX.utils.aoa_to_sheet([
    ['indicatorId', indicator.id],
    ['indicatorName', indicator.name],
    ['periodId', period.id],
    ['periodKey', period.periodKey],
    ['disaggregationCount', disaggregations.length.toString()],
    ...disaggregations.map((d, i) => [`disagg_${i}_id`, d.id]),
    ...disaggregations.map((d, i) => [`disagg_${i}_name`, d.name]),
  ])
  XLSX.utils.book_append_sheet(workbook, metadataSheet, '_meta')
  
  // Hide metadata sheet
  workbook.Workbook = workbook.Workbook || {}
  workbook.Workbook.Sheets = workbook.Workbook.Sheets || []
  workbook.Workbook.Sheets[1] = { Hidden: 2 }
  
  // Download file with styles
  const filename = `${indicator.name.replace(/[^a-z0-9]/gi, '_')}_${period.periodKey}.xlsx`
  XLSX.writeFile(workbook, filename)
}

/**
 * Export empty template for manual data entry
 */
export function exportEmptyTemplate(data: {
  indicator: Indicator
  period: IndicatorPeriod
  disaggregations: DisaggregationDef[]
  rowCount?: number
}): void {
  const { indicator, period, disaggregations, rowCount = 50 } = data
  const workbook = XLSX.utils.book_new()
  const unit = getUnitDisplay(indicator)
  
  // Build headers
  const headers: { v: string; t: string; s: any }[] = []
  for (const disagg of disaggregations) {
    headers.push({ v: disagg.name, t: 's', s: headerStyle })
  }
  headers.push(
    { v: 'Value' + (unit ? ` (${unit})` : ''), t: 's', s: headerStyle },
    { v: 'Estimated', t: 's', s: headerStyle },
    { v: 'Notes', t: 's', s: headerStyle }
  )
  
  // Empty rows
  const dataRows: { v: string; t: string; s: any }[][] = []
  for (let i = 0; i < rowCount; i++) {
    const style = i % 2 === 1 ? altRowStyle : dataCellStyle
    dataRows.push(headers.map(() => ({ v: '', t: 's', s: style })))
  }
  
  const allData = [headers, ...dataRows]
  const ws = XLSX.utils.aoa_to_sheet(allData)
  
  ws['!cols'] = headers.map((h) => {
    const val = h.v as string
    if (val.includes('Notes')) return { wch: 40 }
    if (val.includes('Estimated')) return { wch: 12 }
    if (val.includes('Value')) return { wch: 18 }
    return { wch: 22 }
  })
  
  ws['!rows'] = [{ hpt: 28 }]
  
  // Data validations
  for (let colIdx = 0; colIdx < disaggregations.length; colIdx++) {
    const disagg = disaggregations[colIdx]
    const validValues = (disagg.values || []).map(v => v.valueLabel)
    const colLetter = getColumnLetter(colIdx)
    
    if (!ws['!dataValidation']) ws['!dataValidation'] = []
    ws['!dataValidation'].push({
      sqref: `${colLetter}2:${colLetter}${rowCount + 1}`,
      type: 'list',
      formula1: `"${validValues.join(',')}"`,
      showErrorMessage: true,
      showDropDown: false,
    })
  }
  
  const estimatedColLetter = getColumnLetter(disaggregations.length + 1)
  if (!ws['!dataValidation']) ws['!dataValidation'] = []
  ws['!dataValidation'].push({
    sqref: `${estimatedColLetter}2:${estimatedColLetter}${rowCount + 1}`,
    type: 'list',
    formula1: '"Yes,No"',
    showDropDown: false,
  })
  
  ws['!autofilter'] = { ref: `A1:${getColumnLetter(headers.length - 1)}1` }
  
  const sheetName = indicator.name.substring(0, 28).replace(/[\\/*?[\]]/g, '_')
  XLSX.utils.book_append_sheet(workbook, ws, sheetName)
  
  const metadataSheet = XLSX.utils.aoa_to_sheet([
    ['indicatorId', indicator.id],
    ['indicatorName', indicator.name],
    ['periodId', period.id],
    ['periodKey', period.periodKey],
    ['disaggregationCount', disaggregations.length.toString()],
    ...disaggregations.map((d, i) => [`disagg_${i}_id`, d.id]),
    ...disaggregations.map((d, i) => [`disagg_${i}_name`, d.name]),
  ])
  
  XLSX.utils.book_append_sheet(workbook, metadataSheet, '_meta')
  workbook.Workbook = workbook.Workbook || {}
  workbook.Workbook.Sheets = workbook.Workbook.Sheets || []
  workbook.Workbook.Sheets[1] = { Hidden: 2 }
  
  const filename = `${indicator.name.replace(/[^a-z0-9]/gi, '_')}_${period.periodKey}_template.xlsx`
  XLSX.writeFile(workbook, filename)
}

interface ImportResult {
  success: boolean
  values: Record<string, { value: string; isEstimated: boolean; notes: string }>
  rows: any[]
  errors: string[]
  indicatorId?: string
  periodId?: string
}

/**
 * Import data from Excel file
 */
export async function importDataFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        
        const result: ImportResult = {
          success: false,
          values: {},
          rows: [],
          errors: [],
        }
        
        const metaSheetName = workbook.SheetNames.find(n => n === '_meta' || n === '_metadata')
        if (!metaSheetName) {
          result.errors.push('This file was not created from our system. Please use Export Template first.')
          resolve(result)
          return
        }
        
        const metadataSheet = workbook.Sheets[metaSheetName]
        const metadataRows = XLSX.utils.sheet_to_json<Record<string, string>>(metadataSheet, { header: 1 }) as string[][]
        
        const metadata: Record<string, string> = {}
        for (const row of metadataRows) {
          if (row.length >= 2) {
            metadata[row[0]] = row[1]
          }
        }
        
        result.indicatorId = metadata['indicatorId']
        result.periodId = metadata['periodId']
        
        if (!result.indicatorId || !result.periodId) {
          result.errors.push('Invalid template: Missing indicator or period information')
          resolve(result)
          return
        }
        
        const dataSheetName = workbook.SheetNames.find(name => !name.startsWith('_'))
        if (!dataSheetName) {
          result.errors.push('No data sheet found')
          resolve(result)
          return
        }
        
        const dataSheet = workbook.Sheets[dataSheetName]
        const dataRows = XLSX.utils.sheet_to_json<Record<string, any>>(dataSheet, { 
          defval: ''
        })
        
        const disaggCount = parseInt(metadata['disaggregationCount'] || '0')
        
        for (const row of dataRows) {
          const rowValues = Object.values(row)
          
          const hasValue = rowValues.some(v => v !== '' && v !== null && v !== undefined)
          if (!hasValue) continue
          
          result.rows.push(row)
          
          if (disaggCount === 0) {
            const value = rowValues[0]?.toString() || ''
            const isEstimated = rowValues[1]?.toString().toLowerCase() === 'yes'
            const notes = rowValues[2]?.toString() || ''
            
            if (value) {
              result.values['total'] = { value, isEstimated, notes }
            }
          } else {
            const keys = Object.keys(row)
            const labels = keys.slice(0, disaggCount).map(k => row[k]?.toString() || '')
            const key = labels.join('|')
            
            const valueKey = keys[disaggCount]
            const estimatedKey = keys[disaggCount + 1]
            const notesKey = keys[disaggCount + 2]
            
            const value = row[valueKey]?.toString() || ''
            const isEstimated = row[estimatedKey]?.toString().toLowerCase() === 'yes'
            const notes = row[notesKey]?.toString() || ''
            
            if (value && labels.every(l => l)) {
              result.values[key] = { value, isEstimated, notes }
            }
          }
        }
        
        if (Object.keys(result.values).length === 0) {
          result.errors.push('No data found in the file')
          resolve(result)
          return
        }
        
        result.success = true
        resolve(result)
        
      } catch (error: any) {
        resolve({
          success: false,
          values: {},
          rows: [],
          errors: [error.message || 'Failed to parse Excel file'],
        })
      }
    }
    
    reader.onerror = () => {
      resolve({
        success: false,
        values: {},
        rows: [],
        errors: ['Failed to read file'],
      })
    }
    
    reader.readAsBinaryString(file)
  })
}
