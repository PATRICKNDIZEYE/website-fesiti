import { AggregationType } from '@/components/visualizations/types'

export function aggregateData(
  data: any[],
  groupBy: string,
  valueField: string,
  aggregation: AggregationType,
): any[] {
  if (!data || data.length === 0) return []
  if (aggregation === 'none') return data

  const grouped: Record<string, any[]> = {}

  // Group data
  data.forEach((row) => {
    const key = String(row[groupBy] || '')
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(row)
  })

  // Apply aggregation
  return Object.entries(grouped).map(([key, rows]) => {
    const values = rows.map((r) => Number(r[valueField] || 0)).filter((v) => !isNaN(v))

    let aggregatedValue = 0
    switch (aggregation) {
      case 'sum':
        aggregatedValue = values.reduce((a, b) => a + b, 0)
        break
      case 'avg':
        aggregatedValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
        break
      case 'count':
        aggregatedValue = rows.length
        break
      case 'min':
        aggregatedValue = values.length > 0 ? Math.min(...values) : 0
        break
      case 'max':
        aggregatedValue = values.length > 0 ? Math.max(...values) : 0
        break
      default:
        aggregatedValue = values[0] || 0
    }

    return {
      [groupBy]: key,
      value: aggregatedValue,
      count: rows.length,
    }
  })
}

