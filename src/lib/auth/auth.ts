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
        try {
          console.log('[AUTH] Iniciando autenticação para:', credentials?.email)

          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Credenciais faltando')
            throw new Error('Email e senha são obrigatórios')
          }

          // Buscar usuário no banco
          console.log('[AUTH] Buscando usuário no banco...')
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
            console.log('[AUTH] Usuário não encontrado')
            throw new Error('Credenciais inválidas')
          }

          console.log('[AUTH] Usuário encontrado:', user.email, 'Role:', user.roles.name)

          // Verificar senha
          console.log('[AUTH] Verificando senha...')
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            console.log('[AUTH] Senha inválida')
            throw new Error('Credenciais inválidas')
          }

          console.log('[AUTH] Senha válida')
          console.log('[AUTH] Shelters do usuário:', user.shelters)

          // Pegar o primeiro abrigo que o usuário é dono (owner)
          const userShelter = user.shelters && user.shelters.length > 0 ? user.shelters[0] : null

          const authResult = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.roles.name,
            roleId: user.role_id,
            permissions: user.roles.permissions as Record<string, boolean>,
            shelterId: userShelter?.id || null,
            shelterName: userShelter?.name || null,
          }

          console.log('[AUTH] Autenticação bem-sucedida:', authResult)

          return authResult
        } catch (error) {
          console.error('[AUTH] Erro durante autenticação:', error)
          throw error
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
        token.shelterName = user.shelterName
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
        session.user.shelterName = token.shelterName as string | null
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
