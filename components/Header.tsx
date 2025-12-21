'use client'

import { Search, Sun, Moon, Plus, FileText, PieChart, Hand, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTheme, setTheme, initTheme } from '@/lib/theme'

export function Header({ title }: { title: string }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    initTheme()
    setThemeState(getTheme())
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    setThemeState(newTheme)
  }

  return (
    <div className="bg-background border-b border-border px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        
        <div className="flex items-center space-x-4">
          {/* Action Icons */}
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-gold-500/20 dark:bg-gold-500/20 text-gold-600 dark:text-gold-500 border-gold-500/30 px-3 py-1.5">
              <FileText className="w-4 h-4 mr-1.5" />
              On Going 87
            </Badge>
            <Button variant="ghost" size="icon" className="hover:bg-accent text-muted-foreground">
              <PieChart className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-accent text-muted-foreground">
              <Hand className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-accent text-muted-foreground">
              <XCircle className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-accent text-muted-foreground">
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search"
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-accent text-muted-foreground"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
