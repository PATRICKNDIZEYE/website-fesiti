import XLSX from 'xlsx-js-style'
import { DisaggregationDef, DisaggregationValue, Indicator, IndicatorPeriod, Unit, IndicatorInput } from './types'

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

function getIndicatorInputs(indicator: Indicator): IndicatorInput[] {
  return Array.isArray(indicator.inputs) ? indicator.inputs : []
}

function getInputDisaggregations(input: IndicatorInput): DisaggregationDef[] {
  return (input.disaggregations || [])
    .map(d => d.definition)
    .filter((d): d is DisaggregationDef => !!d && !!d.values && d.values.length > 0)
}

export function getInputCombinationKey(inputId: string, combination: DisaggregationValue[]): string {
  const comboKey = combination.length > 0 ? getCombinationKey(combination) : 'total'
  return `${inputId}::${comboKey}`
}

function getFormulaDisaggregationColumns(inputs: IndicatorInput[]): DisaggregationDef[] {
  const seen = new Map<string, DisaggregationDef>()
  for (const input of inputs) {
    for (const disagg of getInputDisaggregations(input)) {
      if (!seen.has(disagg.id)) {
        seen.set(disagg.id, disagg)
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
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

// FESITI branding - professional header
const brandingTitleStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
  fill: { fgColor: { rgb: '2F5496' } },
  alignment: { horizontal: 'center' as const, vertical: 'center' as const },
  border: {
    top: { style: 'thin' as const, color: { rgb: '2F5496' } },
    bottom: { style: 'thin' as const, color: { rgb: '2F5496' } },
    left: { style: 'thin' as const, color: { rgb: '2F5496' } },
    right: { style: 'thin' as const, color: { rgb: '2F5496' } },
  },
}
const brandingSubtitleStyle = {
  font: { sz: 11, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '4472C4' } },
  alignment: { horizontal: 'center' as const, vertical: 'center' as const },
  border: {
    top: { style: 'thin' as const, color: { rgb: '2F5496' } },
    bottom: { style: 'thin' as const, color: { rgb: '2F5496' } },
    left: { style: 'thin' as const, color: { rgb: '2F5496' } },
    right: { style: 'thin' as const, color: { rgb: '2F5496' } },
  },
}
const brandingInfoStyle = {
  font: { sz: 10, color: { rgb: '2F5496' } },
  fill: { fgColor: { rgb: 'D6DCE4' } },
  alignment: { vertical: 'center' as const, wrapText: true },
  border: {
    top: { style: 'thin' as const, color: { rgb: 'BDC3C7' } },
    bottom: { style: 'thin' as const, color: { rgb: 'BDC3C7' } },
    left: { style: 'thin' as const, color: { rgb: 'BDC3C7' } },
    right: { style: 'thin' as const, color: { rgb: 'BDC3C7' } },
  },
}

/** Number of FESITI branding rows at top of exported data sheets; import/mapping must skip these */
export const BRANDING_ROWS = 5

/** First-cell value on FESITI-branded sheets; used to detect and skip branding when parsing */
export const FESITI_BRANDING_TITLE = 'FESITI M&E Suite'

function buildBrandingRows(indicator: Indicator, period: IndicatorPeriod, numCols: number): { v: string; t: string; s: object }[][] {
  const unit = getUnitDisplay(indicator)
  const unitStr = unit ? ` (${unit})` : ''
  const rows: { v: string; t: string; s: object }[][] = [
    Array.from({ length: numCols }, (_, i) => i === 0 ? { v: FESITI_BRANDING_TITLE, t: 's', s: brandingTitleStyle } : { v: '', t: 's', s: brandingTitleStyle }),
    Array.from({ length: numCols }, (_, i) => i === 0 ? { v: 'Enterprise monitoring workspace', t: 's', s: brandingSubtitleStyle } : { v: '', t: 's', s: brandingSubtitleStyle }),
    Array.from({ length: numCols }, (_, i) => i === 0 ? { v: indicator.name + (indicator.definition ? `\n${indicator.definition}` : ''), t: 's', s: brandingInfoStyle } : { v: '', t: 's', s: brandingInfoStyle }),
    Array.from({ length: numCols }, (_, i) => i === 0 ? { v: `Period: ${period.periodKey}${unitStr ? `  |  Unit: ${unitStr}` : ''}`, t: 's', s: brandingInfoStyle } : { v: '', t: 's', s: brandingInfoStyle }),
    Array.from({ length: numCols }, (_, i) => ({ v: '', t: 's', s: dataCellStyle })),
  ]
  return rows
}

/**
 * Export data collection template to Excel - FESITI branded, DevResults style
 * Professional header (FESITI M&E Suite, Enterprise monitoring workspace) + data table with validation
 */
export function exportDataTemplate(data: ExportData): void {
  const { indicator, period, disaggregations, combinations, values } = data
  const workbook = XLSX.utils.book_new()
  const unit = getUnitDisplay(indicator)
  const inputs = getIndicatorInputs(indicator)

  if (indicator.calcType === 'formula' && inputs.length > 0) {
    exportFormulaTemplate({ indicator, period, inputs, values }, workbook)
    const filename = `${indicator.name.replace(/[^a-z0-9]/gi, '_')}_${period.periodKey}.xlsx`
    XLSX.writeFile(workbook, filename)
    return
  }
  
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
  
  // Create worksheet with FESITI branding at top
  const headerCount = disaggregations.length === 0 ? 3 : disaggregations.length + 3
  const numCols = Math.max(headerCount, 10)
  const brandingRows = buildBrandingRows(indicator, period, numCols)
  const padRow = (row: { v: any; t: string; s: any }[], len: number) => {
    if (row.length >= len) return row
    return [...row, ...Array.from({ length: len - row.length }, () => ({ v: '', t: 's', s: dataCellStyle }))]
  }
  const allData = [...brandingRows, padRow(headers, numCols), ...dataRows.map(r => padRow(r, numCols))]
  const ws = XLSX.utils.aoa_to_sheet(allData)
  
  // Merge branding cells (first column across full width)
  if (!ws['!merges']) ws['!merges'] = []
  for (let r = 0; r < BRANDING_ROWS; r++) {
    ws['!merges'].push({ s: { r, c: 0 }, e: { r, c: numCols - 1 } })
  }
  
  // Set column widths
  ws['!cols'] = Array.from({ length: numCols }, (_, i) => {
    if (i < headers.length) {
      const val = (headers[i]?.v as string) || ''
      if (val.includes('Notes')) return { wch: 40 }
      if (val.includes('Estimated')) return { wch: 12 }
      if (val.includes('Value')) return { wch: 18 }
      return { wch: 22 }
    }
    return { wch: 12 }
  })
  
  // Set row heights (branding + header)
  ws['!rows'] = [
    { hpt: 24 },
    { hpt: 20 },
    { hpt: 36 },
    { hpt: 20 },
    { hpt: 16 },
    { hpt: 28 },
  ]
  
  const dataStartRow1Based = BRANDING_ROWS + 2 // Excel 1-based: header at BRANDING_ROWS+1, first data at +2
  
  // Add data validations for dropdowns (offset by branding rows)
  for (let colIdx = 0; colIdx < disaggregations.length; colIdx++) {
    const disagg = disaggregations[colIdx]
    const validValues = (disagg.values || []).map(v => v.valueLabel)
    const colLetter = getColumnLetter(colIdx)
    if (!ws['!dataValidation']) ws['!dataValidation'] = []
    ws['!dataValidation'].push({
      sqref: `${colLetter}${dataStartRow1Based}:${colLetter}1000`,
      type: 'list',
      formula1: `"${validValues.join(',')}"`,
      showErrorMessage: true,
      error: `Select: ${validValues.join(', ')}`,
      errorTitle: `Invalid ${disagg.name}`,
      showDropDown: false,
    })
  }
  
  const estimatedColIdx = disaggregations.length === 0 ? 1 : disaggregations.length + 1
  const estimatedColLetter = getColumnLetter(estimatedColIdx)
  if (!ws['!dataValidation']) ws['!dataValidation'] = []
  ws['!dataValidation'].push({
    sqref: `${estimatedColLetter}${dataStartRow1Based}:${estimatedColLetter}1000`,
    type: 'list',
    formula1: '"Yes,No"',
    showDropDown: false,
  })
  
  const headerRow1Based = BRANDING_ROWS + 1
  ws['!autofilter'] = { ref: `A${headerRow1Based}:${getColumnLetter(headerCount - 1)}${headerRow1Based}` }
  
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
  
  const filename = `${indicator.name.replace(/[^a-z0-9]/gi, '_')}_${period.periodKey}.xlsx`
  XLSX.writeFile(workbook, filename)
}

function exportFormulaTemplate(
  data: {
    indicator: Indicator
    period: IndicatorPeriod
    inputs: IndicatorInput[]
    values: Record<string, { value: string; isEstimated: boolean; notes: string }>
  },
  workbook?: XLSX.WorkBook
): void {
  const { indicator, period, inputs, values } = data
  const book = workbook || XLSX.utils.book_new()
  const disaggColumns = getFormulaDisaggregationColumns(inputs)

  const headers: { v: string; t: string; s: any }[] = [
    { v: 'Input', t: 's', s: headerStyle },
  ]
  for (const disagg of disaggColumns) {
    headers.push({ v: disagg.name, t: 's', s: headerStyle })
  }
  headers.push(
    { v: 'Value', t: 's', s: headerStyle },
    { v: 'Estimated', t: 's', s: headerStyle },
    { v: 'Notes', t: 's', s: headerStyle }
  )
  const headerCount = headers.length
  const numCols = Math.max(headerCount, 10)
  const brandingRows = buildBrandingRows(indicator, period, numCols)

  const dataRows: { v: any; t: string; s: any }[][] = []

  inputs.forEach((input, inputIndex) => {
    const inputDisaggs = getInputDisaggregations(input)
    const combos = generateDisaggCombinations(inputDisaggs)

    combos.forEach((combination, comboIndex) => {
      const style = (dataRows.length + comboIndex) % 2 === 0 ? dataCellStyle : altRowStyle
      const row: { v: any; t: string; s: any }[] = [
        { v: input.name, t: 's', s: style },
      ]

      const comboByDef = new Map(combination.map(v => [v.disaggregationDefId, v.valueLabel]))
      for (const disagg of disaggColumns) {
        const label = comboByDef.get(disagg.id) || ''
        row.push({ v: label, t: 's', s: style })
      }

      const key = getInputCombinationKey(input.id, combination)
      const cellValue = values[key] || { value: '', isEstimated: false, notes: '' }

      row.push(
        { v: cellValue.value || '', t: cellValue.value ? 'n' : 's', s: style },
        { v: cellValue.isEstimated ? 'Yes' : '', t: 's', s: style },
        { v: cellValue.notes || '', t: 's', s: style }
      )

      dataRows.push(row)
    })
  })

  const allData = [...brandingRows, headers, ...dataRows]
  const ws = XLSX.utils.aoa_to_sheet(allData)

  if (!ws['!merges']) ws['!merges'] = []
  for (let r = 0; r < BRANDING_ROWS; r++) {
    ws['!merges'].push({ s: { r, c: 0 }, e: { r, c: numCols - 1 } })
  }

  ws['!cols'] = Array.from({ length: numCols }, (_, i) => {
    if (i < headers.length) {
      const val = (headers[i]?.v as string) || ''
      if (val === 'Input') return { wch: 24 }
      if (val.includes('Notes')) return { wch: 40 }
      if (val.includes('Estimated')) return { wch: 12 }
      if (val.includes('Value')) return { wch: 16 }
      return { wch: 22 }
    }
    return { wch: 12 }
  })

  ws['!rows'] = [
    { hpt: 24 },
    { hpt: 20 },
    { hpt: 36 },
    { hpt: 20 },
    { hpt: 16 },
    { hpt: 28 },
  ]

  const dataStartRow1Based = BRANDING_ROWS + 2
  const headerRow1Based = BRANDING_ROWS + 1

  if (!ws['!dataValidation']) ws['!dataValidation'] = []

  const inputColLetter = getColumnLetter(0)
  ws['!dataValidation'].push({
    sqref: `${inputColLetter}${dataStartRow1Based}:${inputColLetter}1000`,
    type: 'list',
    formula1: `"${inputs.map(i => i.name).join(',')}"`,
    showDropDown: false,
  })

  disaggColumns.forEach((disagg, idx) => {
    const validValues = (disagg.values || []).map(v => v.valueLabel)
    const colLetter = getColumnLetter(idx + 1)
    ws['!dataValidation'].push({
      sqref: `${colLetter}${dataStartRow1Based}:${colLetter}1000`,
      type: 'list',
      formula1: `"${validValues.join(',')}"`,
      showErrorMessage: true,
      error: `Select: ${validValues.join(', ')}`,
      errorTitle: `Invalid ${disagg.name}`,
      showDropDown: false,
    })
  })

  const estimatedColIdx = disaggColumns.length + 2
  const estimatedColLetter = getColumnLetter(estimatedColIdx)
  ws['!dataValidation'].push({
    sqref: `${estimatedColLetter}${dataStartRow1Based}:${estimatedColLetter}1000`,
    type: 'list',
    formula1: '"Yes,No"',
    showDropDown: false,
  })

  ws['!autofilter'] = { ref: `A${headerRow1Based}:${getColumnLetter(headerCount - 1)}${headerRow1Based}` }

  const sheetName = indicator.name.substring(0, 28).replace(/[\\/*?[\]]/g, '_')
  XLSX.utils.book_append_sheet(book, ws, sheetName)

  const metadataSheet = XLSX.utils.aoa_to_sheet([
    ['indicatorId', indicator.id],
    ['indicatorName', indicator.name],
    ['periodId', period.id],
    ['periodKey', period.periodKey],
    ['calcType', indicator.calcType || 'direct'],
    ['inputCount', inputs.length.toString()],
    ...inputs.map((input, i) => [`input_${i}_id`, input.id]),
    ...inputs.map((input, i) => [`input_${i}_name`, input.name]),
    ['disaggregationCount', disaggColumns.length.toString()],
    ...disaggColumns.map((d, i) => [`disagg_${i}_id`, d.id]),
    ...disaggColumns.map((d, i) => [`disagg_${i}_name`, d.name]),
  ])
  XLSX.utils.book_append_sheet(book, metadataSheet, '_meta')

  book.Workbook = book.Workbook || {}
  book.Workbook.Sheets = book.Workbook.Sheets || []
  book.Workbook.Sheets[1] = { Hidden: 2 }

  if (!workbook) {
    const filename = `${indicator.name.replace(/[^a-z0-9]/gi, '_')}_${period.periodKey}.xlsx`
    XLSX.writeFile(book, filename)
  }
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
  const inputs = getIndicatorInputs(indicator)

  if (indicator.calcType === 'formula' && inputs.length > 0) {
    exportFormulaTemplate(
      {
        indicator,
        period,
        inputs,
        values: {},
      },
      workbook
    )
    const filename = `${indicator.name.replace(/[^a-z0-9]/gi, '_')}_${period.periodKey}_template.xlsx`
    XLSX.writeFile(workbook, filename)
    return
  }
  
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
  const headerCount = headers.length
  const numCols = Math.max(headerCount, 10)
  const brandingRows = buildBrandingRows(indicator, period, numCols)
  const padRow = (row: { v: string; t: string; s: any }[], len: number) => {
    if (row.length >= len) return row
    return [...row, ...Array.from({ length: len - row.length }, () => ({ v: '', t: 's', s: dataCellStyle }))]
  }
  
  // Empty rows
  const dataRows: { v: string; t: string; s: any }[][] = []
  for (let i = 0; i < rowCount; i++) {
    const style = i % 2 === 1 ? altRowStyle : dataCellStyle
    dataRows.push(headers.map(() => ({ v: '', t: 's', s: style })))
  }
  
  const allData = [...brandingRows, padRow(headers, numCols), ...dataRows.map(r => padRow(r, numCols))]
  const ws = XLSX.utils.aoa_to_sheet(allData)
  
  if (!ws['!merges']) ws['!merges'] = []
  for (let r = 0; r < BRANDING_ROWS; r++) {
    ws['!merges'].push({ s: { r, c: 0 }, e: { r, c: numCols - 1 } })
  }
  
  ws['!cols'] = Array.from({ length: numCols }, (_, i) => {
    if (i < headers.length) {
      const val = (headers[i]?.v as string) || ''
      if (val.includes('Notes')) return { wch: 40 }
      if (val.includes('Estimated')) return { wch: 12 }
      if (val.includes('Value')) return { wch: 18 }
      return { wch: 22 }
    }
    return { wch: 12 }
  })
  
  ws['!rows'] = [
    { hpt: 24 },
    { hpt: 20 },
    { hpt: 36 },
    { hpt: 20 },
    { hpt: 16 },
    { hpt: 28 },
  ]
  
  const dataStartRow1Based = BRANDING_ROWS + 2
  const headerRow1Based = BRANDING_ROWS + 1
  const lastDataRow = dataStartRow1Based + rowCount - 1
  
  for (let colIdx = 0; colIdx < disaggregations.length; colIdx++) {
    const disagg = disaggregations[colIdx]
    const validValues = (disagg.values || []).map(v => v.valueLabel)
    const colLetter = getColumnLetter(colIdx)
    if (!ws['!dataValidation']) ws['!dataValidation'] = []
    ws['!dataValidation'].push({
      sqref: `${colLetter}${dataStartRow1Based}:${colLetter}${lastDataRow}`,
      type: 'list',
      formula1: `"${validValues.join(',')}"`,
      showErrorMessage: true,
      showDropDown: false,
    })
  }
  
  const estimatedColLetter = getColumnLetter(disaggregations.length + 1)
  if (!ws['!dataValidation']) ws['!dataValidation'] = []
  ws['!dataValidation'].push({
    sqref: `${estimatedColLetter}${dataStartRow1Based}:${estimatedColLetter}${lastDataRow}`,
    type: 'list',
    formula1: '"Yes,No"',
    showDropDown: false,
  })
  
  ws['!autofilter'] = { ref: `A${headerRow1Based}:${getColumnLetter(headers.length - 1)}${headerRow1Based}` }
  
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
  calcType?: string
  inputMap?: Record<string, string>
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
        result.calcType = metadata['calcType'] || 'direct'
        const inputCount = parseInt(metadata['inputCount'] || '0')
        if (inputCount > 0) {
          const inputMap: Record<string, string> = {}
          for (let i = 0; i < inputCount; i++) {
            const inputId = metadata[`input_${i}_id`]
            const inputName = metadata[`input_${i}_name`]
            if (inputId && inputName) {
              inputMap[inputName.toLowerCase()] = inputId
            }
          }
          result.inputMap = inputMap
        }
        
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
        // Skip FESITI branding rows (5) so header row is the table header
        const dataRange = `A${BRANDING_ROWS + 1}:ZZ1000`
        const dataRows = XLSX.utils.sheet_to_json<Record<string, any>>(dataSheet, { 
          defval: '',
          range: dataRange as any,
        })
        
        const disaggCount = parseInt(metadata['disaggregationCount'] || '0')
        const isFormula = result.calcType === 'formula' && (metadata['inputCount'] || '0') !== '0'

        if (isFormula) {
          const headerRows = XLSX.utils.sheet_to_json<string[]>(dataSheet, { header: 1, range: dataRange as any }) as string[][]
          const headers = (headerRows[0] || []).map(h => String(h || '').trim())
          const norm = (val: string) => val.trim().toLowerCase()
          const inputHeader = headers.find(h => norm(h) === 'input')
          const valueHeader = headers.find(h => norm(h).startsWith('value'))
          const estimatedHeader = headers.find(h => norm(h).startsWith('estimated'))
          const notesHeader = headers.find(h => norm(h).startsWith('notes'))
          const disaggHeaders = headers.filter(h => h && h !== inputHeader && h !== valueHeader && h !== estimatedHeader && h !== notesHeader)

          for (const row of dataRows) {
            const rowValues = Object.values(row)
            const hasValue = rowValues.some(v => v !== '' && v !== null && v !== undefined)
            if (!hasValue) continue

            const inputName = inputHeader ? String(row[inputHeader] || '').trim() : ''
            const inputId = inputName && result.inputMap ? result.inputMap[inputName.toLowerCase()] : undefined

            const disaggValues: Record<string, string> = {}
            for (const header of disaggHeaders) {
              const val = row[header]
              if (val !== undefined && val !== null && String(val).trim() !== '') {
                disaggValues[header] = String(val).trim()
              }
            }

            const value = valueHeader ? row[valueHeader]?.toString() || '' : ''
            const isEstimated = estimatedHeader ? row[estimatedHeader]?.toString().toLowerCase() === 'yes' : false
            const notes = notesHeader ? row[notesHeader]?.toString() || '' : ''

            result.rows.push({
              inputName,
              inputId,
              disaggregations: disaggValues,
              value,
              isEstimated,
              notes,
            })
          }

          if (result.rows.length === 0) {
            result.errors.push('No data found in the file')
            resolve(result)
            return
          }

          result.success = true
          resolve(result)
          return
        }
        
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
