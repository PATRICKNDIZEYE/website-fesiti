export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'area'
  | 'scatter'
  | 'composed'
  | 'heatmap'
  | 'treemap'
  | 'sankey'
  | 'scatter3d'
  | 'surface'

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none'

export interface ChartConfig {
  xAxis?: string
  yAxis?: string
  value?: string
  source?: string
  target?: string
  groupBy?: string
  aggregation?: AggregationType
  colorscale?: string
  layout?: Record<string, any>
  nodeLabels?: string[]
  nodeColors?: string[]
  color?: string
}

