import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // Permitir acesso às rotas públicas
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Se não estiver autenticado, redirecionar para login
  if (!token && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Se estiver autenticado e acessar /dashboard, redirecionar para dashboard específico do role
  if (token && pathname === '/dashboard') {
    const role = token.role as string
    let dashboardPath = '/dashboard/painel'

    if (role === 'admin') {
      dashboardPath = '/dashboard/admin'
    } else if (role === 'shelter_manager') {
      dashboardPath = '/dashboard/painel'
    } else if (role === 'adopter') {
      dashboardPath = '/dashboard/usuario'
    }

    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // Proteção de rotas baseada em role
  if (token) {
    const role = token.role as string

    // Rotas exclusivas do Admin
    if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Rotas exclusivas do Usuário Comum
    if (pathname.startsWith('/dashboard/usuario') && role !== 'adopter') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register']
}
