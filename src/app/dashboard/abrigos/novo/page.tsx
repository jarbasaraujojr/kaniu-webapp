import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ShelterForm } from '../shelter-form'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

export default async function NovoAbrigoPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Apenas admins podem criar abrigos
  if (session.user.role !== 'admin') {
    redirect('/dashboard/abrigos')
  }

  // Buscar usuários que podem ser donos de abrigo (admins)
  const admins = await prisma.users.findMany({
    where: {
      deleted_at: null,
      roles: {
        name: 'admin',
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <DashboardLayout>
      <main className="main-container">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-dark)'
          }}>
            Novo Abrigo
          </h1>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--text-light)',
            marginTop: '0.25rem'
          }}>
            Preencha os dados para cadastrar um novo abrigo
          </p>
        </div>

        <ShelterForm admins={admins} />
      </main>
    </DashboardLayout>
  )
}
