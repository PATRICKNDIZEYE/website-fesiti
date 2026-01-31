import XLSX from 'xlsx-js-style'

interface PittPeriodRow {
  periodId: string
  periodKey: string
  startDate: string
  endDate: string
  year: number
  quarter?: number
  target?: number
  actual?: number
  deviationPercent?: number | null
  narrative?: string
}

interface PittAnnualTotal {
  year: number
  target?: number
  actual?: number
  deviationPercent?: number | null
}

interface PittIndicator {
  id: string
  name: string
  definition?: string | null
  unit?: string | null
  unitSymbol?: string | null
  frequency: string
  baseline?: number | null
  baselineDate?: string | null
  periods: PittPeriodRow[]
  annualTotalsByYear: PittAnnualTotal[]
  lifeOfProject?: { target?: number; actual?: number; deviationPercent?: number | null }
}

interface PittObjective {
  id: string
  title: string
  description?: string | null
  sortOrder: number
  indicators: PittIndicator[]
}

export interface PittResponseForExcel {
  project: { id: string; name: string }
  years: number[]
  objectives: PittObjective[]
}

// Reference-style PITT: dark blue title, medium blue FY headers, orange objective sections
const titleRowStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
  fill: { fgColor: { rgb: '2F5496' } },
  alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
  border: {
    top: { style: 'thin' as const, color: { rgb: '2F5496' } },
    bottom: { style: 'thin' as const, color: { rgb: '2F5496' } },
    left: { style: 'thin' as const, color: { rgb: '2F5496' } },
    right: { style: 'thin' as const, color: { rgb: '2F5496' } },
  },
}

const fyHeaderStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: '4472C4' } },
  alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
  border: {
    top: { style: 'thin' as const, color: { rgb: '2F5496' } },
    bottom: { style: 'thin' as const, color: { rgb: '2F5496' } },
    left: { style: 'thin' as const, color: { rgb: '2F5496' } },
    right: { style: 'thin' as const, color: { rgb: '2F5496' } },
  },
}

const subHeaderStyle = {
  font: { bold: true, color: { rgb: '2F5496' }, sz: 10 },
  fill: { fgColor: { rgb: 'D6DCE4' } },
  alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
  border: {
    top: { style: 'thin' as const, color: { rgb: '2F5496' } },
    bottom: { style: 'thin' as const, color: { rgb: '2F5496' } },
    left: { style: 'thin' as const, color: { rgb: '2F5496' } },
    right: { style: 'thin' as const, color: { rgb: '2F5496' } },
  },
}

const metricHeaderStyle = {
  font: { bold: true, color: { rgb: '2F5496' }, sz: 10 },
  fill: { fgColor: { rgb: 'FFFFFF' } },
  alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
  border: {
    top: { style: 'thin' as const, color: { rgb: '2F5496' } },
    bottom: { style: 'thin' as const, color: { rgb: '2F5496' } },
    left: { style: 'thin' as const, color: { rgb: '2F5496' } },
    right: { style: 'thin' as const, color: { rgb: '2F5496' } },
  },
}

const objectiveSectionStyle = {
  font: { bold: true, color: { rgb: '5B3A29' }, sz: 11 },
  fill: { fgColor: { rgb: 'FCE4D6' } },
  alignment: { vertical: 'center' as const, wrapText: true },
  border: {
    top: { style: 'thin' as const, color: { rgb: 'BD8B6F' } },
    bottom: { style: 'thin' as const, color: { rgb: 'BD8B6F' } },
    left: { style: 'thin' as const, color: { rgb: 'BD8B6F' } },
    right: { style: 'thin' as const, color: { rgb: 'BD8B6F' } },
  },
}

const dataCellStyle = {
  font: { sz: 10, color: { rgb: '000000' } },
  fill: { fgColor: { rgb: 'FFFFFF' } },
  alignment: { vertical: 'center' as const, wrapText: true },
  border: {
    top: { style: 'thin' as const, color: { rgb: 'BDC3C7' } },
    bottom: { style: 'thin' as const, color: { rgb: 'BDC3C7' } },
    left: { style: 'thin' as const, color: { rgb: 'BDC3C7' } },
    right: { style: 'thin' as const, color: { rgb: 'BDC3C7' } },
  },
}

const dataNumStyle = {
  ...dataCellStyle,
  alignment: { vertical: 'center' as const, horizontal: 'right' as const },
}

const leftLabelStyle = {
  ...dataCellStyle,
  font: { sz: 10, bold: false },
}

type CellVal = string | number | null | undefined
function c(v: CellVal, style: object = dataCellStyle): { v: string | number; t: string; s: object } {
  const val = v === null || v === undefined ? '' : v
  return { v: val as string | number, t: typeof val === 'number' ? 'n' : 's', s: style }
}

const QUARTER_LABELS = ['Q1 (Oct-Dec)', 'Q2 (Jan-Mar)', 'Q3 (Apr-Jun)', 'Q4 (Jul-Sep)']

/**
 * Build PITT workbook in reference layout: wide table with FY columns, quarter blocks, annual totals, cumulative.
 */
export function buildPittWorkbook(data: PittResponseForExcel): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  const years = data.years.length ? data.years : [new Date().getFullYear()]
  const colsPerYear = 4 * 2 + 3 // 4 quarters (Target, Actual) + Annual (Target, Actual, Deviate Comments) = 11
  const cumulativeCols = 3 // Target, Actual, Deviate Comments
  const totalDataCols = years.length * colsPerYear + cumulativeCols
  const leftCols = 5 // A empty, B Objectives, C Indicator, D Frequency, E Baseline
  const totalCols = leftCols + totalDataCols

  const wsData: { v: string | number; t: string; s: object }[][] = []

  // Row 0: Title merged across (value in first cell so merge displays it)
  const titleRow: { v: string | number; t: string; s: object }[] = []
  for (let i = 0; i < totalCols; i++) {
    titleRow.push(i === 0 ? { v: 'Performance Indicator Tracking Table (PITT)', t: 's', s: titleRowStyle } : { v: '', t: 's', s: titleRowStyle })
  }
  wsData.push(titleRow)

  // Row 1: Project name (optional)
  const projectRow: { v: string | number; t: string; s: object }[] = []
  for (let i = 0; i < totalCols; i++) {
    projectRow.push(i === 1 ? { v: data.project.name, t: 's', s: leftLabelStyle } : { v: '', t: 's', s: dataCellStyle })
  }
  wsData.push(projectRow)

  // Row 2: Main headers - Project Objectives, Indicator, Data Collection Frequency, Baseline, then FY labels (one per block, merged) + Cumulative
  const row2: { v: string | number; t: string; s: object }[] = [
    c('', fyHeaderStyle),
    c('Project Objectives / Results', fyHeaderStyle),
    c('Indicator', fyHeaderStyle),
    c('Data Collection Frequency', fyHeaderStyle),
    c('Baseline', fyHeaderStyle),
  ]
  years.forEach((y) => {
    row2.push(c(`FY ${y}`, fyHeaderStyle))
    for (let i = 1; i < colsPerYear; i++) row2.push(c('', fyHeaderStyle))
  })
  row2.push(c('Cumulative Totals\n(End of Project)', fyHeaderStyle))
  for (let i = 1; i < cumulativeCols; i++) row2.push(c('', fyHeaderStyle))
  wsData.push(row2)

  // Row 3: FY labels (merged per FY) + quarter labels + Annual Totals + Cumulative Totals
  const row3: { v: string | number; t: string; s: object }[] = [
    c('', subHeaderStyle),
    c('', subHeaderStyle),
    c('', subHeaderStyle),
    c('', subHeaderStyle),
    c('', subHeaderStyle),
  ]
  years.forEach((y) => {
    row3.push(c(`FY ${y}`, subHeaderStyle))
    for (let q = 0; q < 4; q++) {
      row3.push(c(QUARTER_LABELS[q], subHeaderStyle))
      row3.push(c('', subHeaderStyle))
    }
    row3.push(c('Annual Totals', subHeaderStyle))
    row3.push(c('', subHeaderStyle))
    row3.push(c('', subHeaderStyle))
  })
  row3.push(c('Cumulative Totals', subHeaderStyle))
  row3.push(c('', subHeaderStyle))
  row3.push(c('', subHeaderStyle))
  wsData.push(row3)

  // Row 4: Metric labels - Target, Actual per quarter, then Target, Actual, Deviate Comments per annual/cumulative
  const row4: { v: string | number; t: string; s: object }[] = [
    c('', metricHeaderStyle),
    c('', metricHeaderStyle),
    c('', metricHeaderStyle),
    c('', metricHeaderStyle),
    c('', metricHeaderStyle),
  ]
  years.forEach(() => {
    for (let q = 0; q < 4; q++) {
      row4.push(c('Target', metricHeaderStyle))
      row4.push(c('Actual', metricHeaderStyle))
    }
    row4.push(c('Target', metricHeaderStyle))
    row4.push(c('Actual', metricHeaderStyle))
    row4.push(c('Deviate Comments', metricHeaderStyle))
  })
  row4.push(c('Target', metricHeaderStyle))
  row4.push(c('Actual', metricHeaderStyle))
  row4.push(c('Deviate Comments', metricHeaderStyle))
  wsData.push(row4)

  // Data rows: objective section row (orange) then one row per indicator
  for (const obj of data.objectives) {
    // Section row: objective title in col B, rest empty with orange style
    const sectionRow: { v: string | number; t: string; s: object }[] = []
    for (let i = 0; i < totalCols; i++) {
      sectionRow.push(i === 1 ? c(obj.title, objectiveSectionStyle) : c('', objectiveSectionStyle))
    }
    wsData.push(sectionRow)

    for (const ind of obj.indicators) {
      const indicatorRow: { v: string | number; t: string; s: object }[] = [
        c('', dataCellStyle),
        c('', dataCellStyle),
        c(ind.definition ? `${ind.name}\n${ind.definition}` : ind.name, leftLabelStyle),
        c(ind.frequency || '', dataCellStyle),
        c(ind.baseline != null ? ind.baseline : '', dataNumStyle),
      ]

      const periodByYearQ: Record<number, Record<number, PittPeriodRow>> = {}
      ind.periods.forEach((p) => {
        if (!periodByYearQ[p.year]) periodByYearQ[p.year] = {}
        if (p.quarter) periodByYearQ[p.year][p.quarter] = p
      })

      years.forEach((y) => {
        for (let q = 1; q <= 4; q++) {
          const pr = periodByYearQ[y]?.[q]
          indicatorRow.push(c(pr?.target ?? '', dataNumStyle))
          indicatorRow.push(c(pr?.actual ?? '', dataNumStyle))
        }
        const annual = ind.annualTotalsByYear.find((a) => a.year === y)
        indicatorRow.push(c(annual?.target ?? '', dataNumStyle))
        indicatorRow.push(c(annual?.actual ?? '', dataNumStyle))
        const annComment = annual?.deviationPercent != null ? `${annual.deviationPercent}%` : ''
        indicatorRow.push(c(annComment, dataCellStyle))
      })
      indicatorRow.push(c(ind.lifeOfProject?.target ?? '', dataNumStyle))
      indicatorRow.push(c(ind.lifeOfProject?.actual ?? '', dataNumStyle))
      indicatorRow.push(c(ind.lifeOfProject?.deviationPercent != null ? `${ind.lifeOfProject.deviationPercent}%` : '', dataCellStyle))
      wsData.push(indicatorRow)
    }
  }

  const valuesOnly = wsData.map((row) => row.map((cell) => cell.v))
  const ws = XLSX.utils.aoa_to_sheet(valuesOnly)

  for (let r = 0; r < wsData.length; r++) {
    for (let col = 0; col < wsData[r].length; col++) {
      const ref = XLSX.utils.encode_cell({ r, c: col })
      if (ws[ref]) ws[ref].s = wsData[r][col].s
    }
  }

  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
  ]
  let mergeCol = leftCols
  years.forEach(() => {
    merges.push({ s: { r: 2, c: mergeCol }, e: { r: 2, c: mergeCol + colsPerYear - 1 } })
    mergeCol += colsPerYear
  })
  merges.push({ s: { r: 2, c: mergeCol }, e: { r: 2, c: mergeCol + cumulativeCols - 1 } })
  ws['!merges'] = merges

  ws['!cols'] = [
    { wch: 2 },
    { wch: 38 },
    { wch: 42 },
    { wch: 12 },
    { wch: 10 },
    ...Array(totalDataCols).fill({ wch: 10 }),
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'PITT')
  return wb
}

export function exportPittToExcel(data: PittResponseForExcel, filename?: string): void {
  const wb = buildPittWorkbook(data)
  const name = filename || `PITT_${data.project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, name)
}
