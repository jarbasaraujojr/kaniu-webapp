import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AnimalsList } from './animals-list'
import { prisma } from '@/lib/db/prisma'

interface AnimaisPageProps {
  searchParams: { status?: string }
}

export default async function AnimaisPage({ searchParams }: AnimaisPageProps) {
  const status = searchParams.status || 'Abrigado'

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

  // Buscar animais do banco com filtro de status
  const animals = await prisma.animal.findMany({
    where: { statusId: statusCatalog?.id },
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
