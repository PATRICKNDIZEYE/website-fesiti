'use client'

export function getTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  
  const stored = localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light') {
    return stored
  }
  
  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  
  return 'light'
}

export function setTheme(theme: 'light' | 'dark') {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('theme', theme)
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function initTheme() {
  if (typeof window === 'undefined') return
  
  const theme = getTheme()
  setTheme(theme)
}

