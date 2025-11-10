'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useSidebar } from './SidebarContext'

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { id: 'painel', label: 'Painel', icon: 'fa-chart-line', path: '/dashboard/painel' },
    { id: 'animais', label: 'Animais', icon: 'fa-paw', path: '/dashboard/animais' },
    { id: 'historico', label: 'Histórico', icon: 'fa-clock-rotate-left', path: '/dashboard/historico' },
    { id: 'avaliacoes', label: 'Avaliações', icon: 'fa-file-medical', path: '/dashboard/avaliacoes' },
    { id: 'tratamentos', label: 'Tratamentos', icon: 'fa-syringe', path: '/dashboard/tratamentos' },
  ]

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <img
          src="/logo-kaniu.png"
          alt="Kaniu"
          className="sidebar-logo"
        />
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <i className={`fa-solid ${collapsed ? 'fa-bars' : 'fa-angles-left'}`}></i>
        </button>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNavigate(item.path)}
            title={item.label}
          >
            <i className={`fa-solid ${item.icon}`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-item"
          onClick={handleLogout}
          title="Sair"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
