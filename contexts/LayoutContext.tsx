'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface LayoutContextType {
  sidebarCollapsed: boolean
  chatCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  setChatCollapsed: (collapsed: boolean) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false)
  // Default chat to open (false = not collapsed = open)
  const [chatCollapsed, setChatCollapsedState] = useState(false)

  useEffect(() => {
    const sidebarSaved = localStorage.getItem('sidebarCollapsed')
    const chatSaved = localStorage.getItem('teamChatCollapsed')
    if (sidebarSaved === 'true') {
      setSidebarCollapsedState(true)
    }
    // Only collapse chat if explicitly saved as 'true', otherwise keep it open
    if (chatSaved === 'true') {
      setChatCollapsedState(true)
    } else {
      // Ensure chat is open by default
      setChatCollapsedState(false)
    }
  }, [])

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed)
    localStorage.setItem('sidebarCollapsed', String(collapsed))
  }

  const setChatCollapsed = (collapsed: boolean) => {
    setChatCollapsedState(collapsed)
    localStorage.setItem('teamChatCollapsed', String(collapsed))
  }

  return (
    <LayoutContext.Provider
      value={{
        sidebarCollapsed,
        chatCollapsed,
        setSidebarCollapsed,
        setChatCollapsed,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}

