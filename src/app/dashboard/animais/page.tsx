import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AnimalsList } from './animals-list'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

interface AnimaisPageProps {
  searchParams: { status?: string }
}

// Revalidate cache every 60 seconds
export const revalidate = 60

export default async function AnimaisPage({ searchParams }: AnimaisPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const status = searchParams.status || 'Abrigado'
  const userRole = session.user.role
  const userShelterId = session.user.shelterId

  // Buscar o status no catálogo
  const statusCatalog = await prisma.catalog.findFirst({
    where: {
      category: 'animal_status',
      name: status,
    },
  })

  // Buscar todos os status disponíveis
  const allStatuses = await prisma.catalog.findMany({
    where: {
      category: 'animal_status',
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Construir filtro baseado no role
  const whereClause: any = {
    statusId: statusCatalog?.id,
    deletedAt: null,
  }

  // Se for shelter_manager, filtrar apenas animais do seu abrigo
  if (userRole === 'shelter_manager' && userShelterId) {
    whereClause.shelterId = userShelterId
  }

  // Buscar animais do banco com filtro de status e abrigo (se aplicável)
  const animals = await prisma.animal.findMany({
    where: whereClause,
    include: {
      shelter: {
        select: {
          id: true,
          name: true,
        },
      },
      species: {
        select: {
          name: true,
        },
      },
      breed: {
        select: {
          name: true,
        },
      },
      status: {
        select: {
          name: true,
        },
      },
      weights: {
        select: {
          value: true,
          dateTime: true,
        },
        orderBy: {
          dateTime: 'desc',
        },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <DashboardLayout>
      <AnimalsList
        initialStatus={status}
        initialAnimals={animals}
        availableStatuses={allStatuses.map(s => s.name)}
      />
    </DashboardLayout>
  )
}
