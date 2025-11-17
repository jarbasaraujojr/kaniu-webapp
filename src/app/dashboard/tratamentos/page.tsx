import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PrescriptionsList } from './prescriptions-list'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

interface TratamentosPageProps {
  searchParams: {
    animal_id?: string
    status?: string
  }
}

export const revalidate = 30

export default async function TratamentosPage({ searchParams }: TratamentosPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const whereClause: Prisma.prescriptionsWhereInput = {}

  if (searchParams.animal_id) {
    whereClause.animal_id = searchParams.animal_id
  }

  if (searchParams.status === 'active') {
    whereClause.is_completed = false
  } else if (searchParams.status === 'completed') {
    whereClause.is_completed = true
  }

  // Se for shelter_manager, filtrar apenas prescrições de animais do seu abrigo
  if (session.user.role === 'shelter_manager' && session.user.shelterId) {
    whereClause.animals = {
      shelter_id: session.user.shelterId,
      deleted_at: null,
    }
  } else {
    whereClause.animals = {
      deleted_at: null,
    }
  }

  // Buscar prescrições
  const prescriptions = await prisma.prescriptions.findMany({
    where: whereClause,
    include: {
      animals: {
        select: {
          id: true,
          name: true,
        },
      },
      users: {
        select: {
          name: true,
        },
      },
      medications: {
        select: {
          name: true,
        },
      },
      prescription_tasks: {
        orderBy: {
          scheduled_time: 'desc',
        },
        take: 5,
        include: {
          users: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      start_date: 'desc',
    },
    take: 100,
  })

  // Buscar todos os animais para o filtro
  const animalsFilter: Prisma.animalsWhereInput = {
    deleted_at: null,
  }

  if (session.user.role === 'shelter_manager' && session.user.shelterId) {
    animalsFilter.shelter_id = session.user.shelterId
  }

  const animals = await prisma.animals.findMany({
    where: animalsFilter,
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Buscar medicamentos disponíveis
  const medications = await prisma.medications.findMany({
    where: {
      is_active: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Vias de administração disponíveis
  const administrationRoutes = [
    'Oral',
    'Injetável (IM)',
    'Injetável (IV)',
    'Injetável (SC)',
    'Tópica',
    'Oftálmica',
    'Auricular',
    'Nasal',
    'Retal',
    'Outra',
  ]

  return (
    <DashboardLayout>
      <PrescriptionsList
        initialPrescriptions={prescriptions}
        animals={animals}
        medications={medications}
        administrationRoutes={administrationRoutes}
        selectedAnimalId={searchParams.animal_id}
        selectedStatus={searchParams.status}
      />
    </DashboardLayout>
  )
}
