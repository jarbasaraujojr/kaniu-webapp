import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Não autorizado')
  }
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Permissão negada')
  }
  return user
}

export function checkPermission(userRole: string, requiredRole: string[]): boolean {
  return requiredRole.includes(userRole) || userRole === 'admin'
}
