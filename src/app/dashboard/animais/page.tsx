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
  const statusCatalog = await prisma.catalogs.findFirst({
    where: {
      category: 'animal_status',
      name: status,
    },
  })

  // Buscar todos os status disponíveis
  const allStatuses = await prisma.catalogs.findMany({
    where: {
      category: 'animal_status',
      is_active: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Construir filtro baseado no role
  const whereClause: any = {
    status_id: statusCatalog?.id,
    deleted_at: null,
  }

  // Se for shelter_manager, filtrar apenas animais do seu abrigo
  if (userRole === 'shelter_manager' && userShelterId) {
    whereClause.shelter_id = userShelterId
  }

  // Buscar animais do banco com filtro de status e abrigo (se aplicável)
  const animals = await prisma.animals.findMany({
    where: whereClause,
    include: {
      shelters: {
        select: {
          id: true,
          name: true,
        },
      },
      catalogs_animals_species_idTocatalogs: {
        select: {
          name: true,
        },
      },
      catalogs_animals_breed_idTocatalogs: {
        select: {
          name: true,
        },
      },
      catalogs_animals_status_idTocatalogs: {
        select: {
          name: true,
        },
      },
      animal_weights: {
        select: {
          value: true,
          date_time: true,
        },
        orderBy: {
          date_time: 'desc',
        },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  })

  // Transformar dados para o formato esperado pelo cliente
  const transformedAnimals = animals.map(animal => ({
    ...animal,
    species: animal.catalogs_animals_species_idTocatalogs,
    breed: animal.catalogs_animals_breed_idTocatalogs,
    status: animal.catalogs_animals_status_idTocatalogs,
    shelter: animal.shelters,
    weights: animal.animal_weights,
  }))

  return (
    <DashboardLayout>
      <AnimalsList
        initialStatus={status}
        initialAnimals={transformedAnimals}
        availableStatuses={allStatuses.map(s => s.name)}
      />
    </DashboardLayout>
  )
}
