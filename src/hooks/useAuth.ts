import { useSession } from 'next-auth/react'

export type UserRole = 'admin' | 'shelter_manager' | 'veterinarian' | 'adopter' | 'volunteer'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  roleId: number
  permissions: Record<string, boolean>
  shelterId?: string
  shelterName?: string
}

export function useAuth() {
  const { data: session, status } = useSession()

  const user = session?.user as AuthUser | undefined
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'

  // Helper functions para verificar role
  const isAdmin = user?.role === 'admin'
  const isShelterManager = user?.role === 'shelter_manager'
  const isAdopter = user?.role === 'adopter'
  const isVeterinarian = user?.role === 'veterinarian'
  const isVolunteer = user?.role === 'volunteer'

  // Verifica se usuário tem uma permissão específica
  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false
    return user.permissions[permission] === true || user.permissions.all === true
  }

  // Verifica se usuário tem TODAS as permissões especificadas
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  // Verifica se usuário tem ALGUMA das permissões especificadas
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  // Retorna o dashboard path baseado no role
  const getDashboardPath = (): string => {
    if (!user) return '/login'

    switch (user.role) {
      case 'admin':
        return '/dashboard/admin'
      case 'shelter_manager':
        return '/dashboard/abrigo'
      case 'adopter':
      case 'veterinarian':
      case 'volunteer':
      default:
        return '/dashboard/usuario'
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isShelterManager,
    isAdopter,
    isVeterinarian,
    isVolunteer,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    getDashboardPath,
  }
}
