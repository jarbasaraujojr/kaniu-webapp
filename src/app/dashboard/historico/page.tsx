import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MedicalRecordsList } from './medical-records-list'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

interface HistoricoPageProps {
  searchParams: {
    animal_id?: string
    record_type?: string
  }
}

export const revalidate = 30

export default async function HistoricoPage({ searchParams }: HistoricoPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const whereClause: Prisma.animal_medical_recordsWhereInput = {}

  if (searchParams.animal_id) {
    whereClause.animal_id = searchParams.animal_id
  }

  if (searchParams.record_type) {
    whereClause.record_type = searchParams.record_type
  }

  // Se for shelter_manager, filtrar apenas registros de animais do seu abrigo
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

  // Buscar registros médicos
  const medicalRecords = await prisma.animal_medical_records.findMany({
    where: whereClause,
    include: {
      animals: {
        select: {
          id: true,
          name: true,
          shelter_id: true,
        },
      },
      users: {
        select: {
          name: true,
        },
      },
      veterinary_clinic: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      record_date: 'desc',
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

  // Buscar todas as clínicas para o modal
  const clinics = await prisma.veterinary_clinics.findMany({
    where: {
      deleted_at: null,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Tipos de registros disponíveis
  const recordTypes = [
    'Consulta',
    'Vacinação',
    'Exame',
    'Cirurgia',
    'Tratamento',
    'Avaliação',
    'Emergência',
    'Retorno',
    'Outro',
  ]

  return (
    <DashboardLayout>
      <MedicalRecordsList
        initialRecords={medicalRecords}
        animals={animals}
        clinics={clinics}
        recordTypes={recordTypes}
        selectedAnimalId={searchParams.animal_id}
        selectedRecordType={searchParams.record_type}
      />
    </DashboardLayout>
  )
}
