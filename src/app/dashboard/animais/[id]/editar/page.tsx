import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EditAnimalForm } from './edit-animal-form'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { redirect, notFound } from 'next/navigation'

interface EditAnimalPageProps {
  params: {
    id: string
  }
}

export default async function EditAnimalPage({ params }: EditAnimalPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Buscar animal
  const animal = await prisma.animals.findUnique({
    where: {
      id: params.id,
      deleted_at: null,
    },
    include: {
      catalogs_animals_species_idTocatalogs: true,
      catalogs_animals_breed_idTocatalogs: true,
      catalogs_animals_status_idTocatalogs: true,
    },
  })

  if (!animal) {
    notFound()
  }

  // Buscar catálogos necessários
  const [species, statuses] = await Promise.all([
    prisma.catalogs.findMany({
      where: {
        category: 'species',
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.catalogs.findMany({
      where: {
        category: 'status',
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ])

  // Buscar raças da espécie do animal
  let breeds: any[] = []
  if (animal.species_id) {
    breeds = await prisma.catalogs.findMany({
      where: {
        category: 'breed',
        parent_id: animal.species_id,
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Editar Animal</h1>
          <p className="text-gray-600 mt-2">
            Edite as informações do animal {animal.name}
          </p>
        </div>
        <EditAnimalForm
          animal={animal}
          species={species}
          statuses={statuses}
          initialBreeds={breeds}
        />
      </div>
    </DashboardLayout>
  )
}
