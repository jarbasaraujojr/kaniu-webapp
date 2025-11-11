'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  id: string
  label: string
  icon: string
  path: string
}

export function DynamicSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAdmin, isShelterManager, isAdopter } = useAuth()

  // Definir itens de navegação baseado no role
  const getNavItems = (): NavItem[] => {
    if (isAdmin) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', path: '/dashboard/admin' },
        { id: 'shelters', label: 'Abrigos', icon: 'fa-building', path: '/dashboard/admin/abrigos' },
        { id: 'users', label: 'Usuários', icon: 'fa-users', path: '/dashboard/admin/usuarios' },
        { id: 'animals', label: 'Todos Animais', icon: 'fa-paw', path: '/dashboard/admin/animais' },
        { id: 'statistics', label: 'Estatísticas', icon: 'fa-chart-bar', path: '/dashboard/admin/estatisticas' },
        { id: 'reports', label: 'Relatórios', icon: 'fa-file-alt', path: '/dashboard/admin/relatorios' },
      ]
    }

    if (isShelterManager) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', path: '/dashboard/abrigo' },
        { id: 'animals', label: 'Animais', icon: 'fa-paw', path: '/dashboard/animais' },
        { id: 'adoptions', label: 'Adoções', icon: 'fa-heart', path: '/dashboard/abrigo/adocoes' },
        { id: 'medical', label: 'Médico', icon: 'fa-stethoscope', path: '/dashboard/abrigo/medico' },
        { id: 'events', label: 'Eventos', icon: 'fa-calendar', path: '/dashboard/abrigo/eventos' },
        { id: 'settings', label: 'Configurações', icon: 'fa-cog', path: '/dashboard/abrigo/configuracoes' },
      ]
    }

    if (isAdopter) {
      return [
        { id: 'dashboard', label: 'Meu Dashboard', icon: 'fa-home', path: '/dashboard/usuario' },
        { id: 'available', label: 'Disponíveis', icon: 'fa-paw', path: '/dashboard/usuario/disponiveis' },
        { id: 'favorites', label: 'Favoritos', icon: 'fa-heart', path: '/dashboard/usuario/favoritos' },
        { id: 'reports', label: 'Meus Relatórios', icon: 'fa-search', path: '/dashboard/usuario/relatorios' },
        { id: 'adoptions', label: 'Minhas Adoções', icon: 'fa-clipboard-check', path: '/dashboard/usuario/adocoes' },
        { id: 'profile', label: 'Perfil', icon: 'fa-user', path: '/dashboard/usuario/perfil' },
      ]
    }

    // Fallback para outros roles
    return [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-home', path: '/dashboard' },
    ]
  }

  const navItems = getNavItems()

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img
          src="https://i.ibb.co/P1w4Xdj/logo.png"
          alt="Kaniu"
          className="sidebar-logo"
        />
      </div>

      <nav className="sidebar-menu">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/')

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-light)',
            marginBottom: '0.25rem'
          }}>
            Conectado como
          </div>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-dark)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {user?.name}
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

        <button
          onClick={handleSignOut}
          className="sidebar-item"
          style={{ color: 'var(--warning-color)' }}
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
