import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Rotas admin - apenas para admin
    if (path.startsWith('/dashboard/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Rotas de shelter - apenas para shelter_manager e admin
    if (
      path.startsWith('/dashboard/shelter') &&
      token?.role !== 'shelter_manager' &&
      token?.role !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/shelters/new',
    '/shelters/:id/edit',
    '/animals/new',
    '/animals/:id/edit',
    '/adoptions/:path*',
  ],
}
