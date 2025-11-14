import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        // Buscar usuário no banco
        const user = await prisma.users.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            roles: true,
            shelters: true,
          },
        })

        if (!user) {
          throw new Error('Credenciais inválidas')
        }

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('Credenciais inválidas')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.roles.name,
          roleId: user.role_id,
          permissions: user.roles.permissions as Record<string, boolean>,
          shelterId: user.shelters[0]?.id || null,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.roleId = user.roleId
        token.permissions = user.permissions
        token.shelterId = user.shelterId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.roleId = token.roleId as number
        session.user.permissions = token.permissions as Record<string, boolean>
        session.user.shelterId = token.shelterId as string | null
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
