'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

// Função para obter o estado inicial do localStorage
const getInitialState = () => {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem('sidebar-collapsed')
  return stored === 'true'
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(getInitialState)

  const updateCollapsed = (value: boolean) => {
    setCollapsed(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(value))
    }
  }

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed: updateCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
