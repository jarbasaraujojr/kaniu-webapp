import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AnimalsList } from './animals-list'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

interface AnimaisPageProps {
  searchParams: { status?: string }
}

type CatalogEntry = { id: number; name: string }

const parseCatalogId = (value?: string | null) => {
  if (!value) return null
  const trimmed = `${value}`.trim()
  if (!trimmed || !/^\d+$/.test(trimmed)) return null
  return Number(trimmed)
}

const resolveCatalogValue = (
  value: string | null | undefined,
  catalogMap: Map<number, string>
) => {
  if (!value) return value
  const catalogId = parseCatalogId(value)
  if (catalogId === null) return value
  return catalogMap.get(catalogId) || value
}

// Revalidate cache every 60 seconds
export const revalidate = 60

export default async function AnimaisPage({ searchParams }: AnimaisPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const requestedStatus = searchParams.status
  const showAllStatuses = requestedStatus === 'Todos'
  const effectiveStatus = showAllStatuses ? null : (requestedStatus || 'Abrigado')
  const userRole = session.user.role
  const userShelterId = session.user.shelterId

  // Buscar o status no catálogo (quando aplicável)
  const statusCatalog = effectiveStatus
    ? await prisma.catalogs.findFirst({
        where: {
          category: 'status',
          name: effectiveStatus,
        },
      })
    : null

  // Buscar todos os status disponíveis
  const allStatuses = await prisma.catalogs.findMany({
    where: {
      category: 'status',
      is_active: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  const shouldFilterByStatus = Boolean(statusCatalog?.id)

  // Construir filtro baseado no role
  const whereClause: any = {
    deleted_at: null,
  }

  if (shouldFilterByStatus) {
    whereClause.status_id = statusCatalog.id
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

  const genderIds = Array.from(
    new Set(
      animals
        .map(animal => parseCatalogId(animal.gender))
        .filter((id): id is number => id !== null)
    )
  )

  const sizeIds = Array.from(
    new Set(
      animals
        .map(animal => parseCatalogId(animal.size))
        .filter((id): id is number => id !== null)
    )
  )

  const [genderCatalogs, sizeCatalogs] = await Promise.all([
    genderIds.length
      ? prisma.catalogs.findMany({
          where: { id: { in: genderIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as CatalogEntry[]),
    sizeIds.length
      ? prisma.catalogs.findMany({
          where: { id: { in: sizeIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as CatalogEntry[]),
  ])

  const genderMap = new Map(genderCatalogs.map(item => [item.id, item.name]))
  const sizeMap = new Map(sizeCatalogs.map(item => [item.id, item.name]))

  // Transformar dados para o formato esperado pelo cliente
  const transformedAnimals = animals.map(animal => ({
    ...animal,
    species: animal.catalogs_animals_species_idTocatalogs,
    breed: animal.catalogs_animals_breed_idTocatalogs,
    status: animal.catalogs_animals_status_idTocatalogs,
    gender: resolveCatalogValue(animal.gender, genderMap),
    size: resolveCatalogValue(animal.size, sizeMap),
    shelter: animal.shelters,
    weights: animal.animal_weights,
  }))

  return (
    <DashboardLayout>
      <AnimalsList
        initialStatus={
          showAllStatuses
            ? 'Todos'
            : shouldFilterByStatus
              ? statusCatalog?.name || effectiveStatus || 'Abrigado'
              : 'Todos'
        }
        initialAnimals={transformedAnimals}
        availableStatuses={allStatuses.map(s => s.name)}
      />
    </DashboardLayout>
  )
}
