import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ShelterDetails } from './shelter-details'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { redirect, notFound } from 'next/navigation'

interface ShelterPageProps {
  params: {
    id: string
  }
  searchParams: {
    mode?: string
  }
}

export const revalidate = 60

export default async function ShelterPage({ params, searchParams }: ShelterPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const { id } = params
  const mode = searchParams.mode || 'view'

  // Buscar o abrigo
  const shelter = await prisma.shelters.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
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
      animals: {
        where: {
          deleted_at: null,
        },
        take: 5,
        orderBy: {
          created_at: 'desc',
        },
        include: {
          catalogs_animals_species_idTocatalogs: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  if (!shelter || shelter.deleted_at) {
    notFound()
  }

  // Buscar usuários que podem ser donos de abrigo (apenas se estiver em modo de edição)
  let admins: any[] = []
  if (mode === 'edit' && session.user.role === 'admin') {
    admins = await prisma.users.findMany({
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
  }

  return (
    <DashboardLayout>
      <ShelterDetails
        shelter={{
          ...shelter,
          owner: shelter.users,
          animalsCount: shelter._count.animals,
          recentAnimals: shelter.animals.map(a => ({
            ...a,
            species: a.catalogs_animals_species_idTocatalogs,
          })),
        }}
        mode={mode as 'view' | 'edit'}
        userRole={session.user.role}
        admins={admins}
      />
    </DashboardLayout>
  )
}
