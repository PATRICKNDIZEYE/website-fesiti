'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RecommendationCategory {
  category: string
  count: number
  priority: 'High' | 'Medium' | 'Low'
}

interface AIRecommendationsProps {
  categories: RecommendationCategory[]
}

export function AIRecommendations({ categories }: AIRecommendationsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {categories.map((cat, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{cat.category}</CardTitle>
              <Badge
                variant={cat.priority === 'High' ? 'destructive' : 'secondary'}
                className="ml-2"
              >
                {cat.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground mb-2">{cat.count}</p>
            <p className="text-sm text-muted-foreground">Recommendations available</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
