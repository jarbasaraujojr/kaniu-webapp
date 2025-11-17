'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useSidebar } from './SidebarContext'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  id: string
  label: string
  icon: string
  path: string
}

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAdmin, isShelterManager, isAdopter } = useAuth()

  // Definir itens de navegação baseado no role
  const getMenuItems = (): NavItem[] => {
    if (isAdmin) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', path: '/dashboard/painel' },
        { id: 'shelters', label: 'Abrigos', icon: 'fa-building', path: '/dashboard/abrigos' },
        { id: 'animais', label: 'Animais', icon: 'fa-paw', path: '/dashboard/animais' },
        { id: 'historico', label: 'Histórico', icon: 'fa-clock-rotate-left', path: '/dashboard/historico' },
        { id: 'avaliacoes', label: 'Avaliações', icon: 'fa-file-medical', path: '/dashboard/avaliacoes' },
        { id: 'tratamentos', label: 'Tratamentos', icon: 'fa-syringe', path: '/dashboard/tratamentos' },
      ]
    }

    if (isShelterManager) {
      return [
        { id: 'painel', label: 'Painel', icon: 'fa-chart-line', path: '/dashboard/painel' },
        { id: 'animais', label: 'Animais', icon: 'fa-paw', path: '/dashboard/animais' },
        { id: 'historico', label: 'Histórico', icon: 'fa-clock-rotate-left', path: '/dashboard/historico' },
        { id: 'avaliacoes', label: 'Avaliações', icon: 'fa-file-medical', path: '/dashboard/avaliacoes' },
        { id: 'tratamentos', label: 'Tratamentos', icon: 'fa-syringe', path: '/dashboard/tratamentos' },
      ]
    }

    if (isAdopter) {
      return [
        { id: 'dashboard', label: 'Meu Dashboard', icon: 'fa-home', path: '/dashboard/usuario' },
        { id: 'available', label: 'Disponíveis', icon: 'fa-paw', path: '/dashboard/animais' },
        { id: 'favorites', label: 'Favoritos', icon: 'fa-heart', path: '/dashboard/usuario/favoritos' },
        { id: 'reports', label: 'Meus Relatórios', icon: 'fa-search', path: '/dashboard/usuario/relatorios' },
      ]
    }

    return [
      { id: 'painel', label: 'Painel', icon: 'fa-chart-line', path: '/dashboard/painel' },
      { id: 'animais', label: 'Animais', icon: 'fa-paw', path: '/dashboard/animais' },
    ]
  }

  const menuItems = getMenuItems()

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
        {user && (
          <div style={{
            padding: collapsed ? '0.5rem 0.25rem' : '0.75rem 1rem',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {/* Usuário Logado */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <i className="fa-solid fa-user" style={{
                fontSize: '1rem',
                color: 'var(--primary-color)',
                minWidth: '20px',
                textAlign: 'center'
              }}></i>
              {!collapsed && (
                <div style={{
                  flex: 1,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {user.name}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-light)',
                    marginTop: '0.1rem'
                  }}>
                    {isAdmin && 'Administrador'}
                    {isShelterManager && 'Gerente de Abrigo'}
                    {isAdopter && 'Usuário'}
                  </div>
                </div>
              )}
            </div>

            {/* Abrigo/Sistema */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <i className="fa-solid fa-building" style={{
                fontSize: '1rem',
                color: 'var(--primary-color)',
                minWidth: '20px',
                textAlign: 'center'
              }}></i>
              {!collapsed && (
                <div style={{
                  flex: 1,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {user.shelterName || 'Sistema Kaniu'}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-light)',
                    marginTop: '0.1rem'
                  }}>
                    {user.shelterName ? 'Abrigo' : 'Administração'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
