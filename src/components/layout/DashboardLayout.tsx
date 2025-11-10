'use client'

import { Sidebar } from './Sidebar'
import { SidebarProvider, useSidebar } from './SidebarContext'
import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { collapsed } = useSidebar()

  return (
    <div className="app-shell">
      <Sidebar />
      <div className={`main-with-sidebar ${collapsed ? 'expanded' : ''}`}>
        {children}
      </div>
    </div>
  )
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  )
}
