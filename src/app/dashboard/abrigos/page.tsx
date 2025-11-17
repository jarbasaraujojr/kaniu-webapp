import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SheltersList } from './shelters-list'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

interface AbrigosPageProps {
  searchParams: { active?: string }
}

// Revalidate cache every 60 seconds
export const revalidate = 60

export default async function AbrigosPage({ searchParams }: AbrigosPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const showActive = searchParams.active !== 'false'
  const userRole = session.user.role

  // Construir filtro baseado no role
  const whereClause: Prisma.sheltersWhereInput = {
    deleted_at: null,
  }

  // Filtro de ativos/inativos
  if (showActive) {
    whereClause.is_active = true
  }

  // Buscar abrigos do banco
  const shelters = await prisma.shelters.findMany({
    where: whereClause,
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          animals: {
            where: {
              deleted_at: null,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Transformar dados para o formato esperado pelo cliente
  const transformedShelters = shelters.map(shelter => ({
    ...shelter,
    owner: shelter.users,
    animalsCount: shelter._count.animals,
  }))

  return (
    <DashboardLayout>
      <SheltersList
        initialShelters={transformedShelters}
        showActive={showActive}
        userRole={userRole}
      />
    </DashboardLayout>
  )
}
