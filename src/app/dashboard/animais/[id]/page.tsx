import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import AnimalDetailsClient from './AnimalDetailsClient'

interface AnimalDetailsPageProps {
  params: {
    id: string
  }
}

const calculateAge = (birthDate: Date | null) => {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  const years = today.getFullYear() - birth.getFullYear()
  const months = today.getMonth() - birth.getMonth()

  if (years === 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`
  if (months < 0) return `${years - 1} ${years - 1 === 1 ? 'ano' : 'anos'}`
  return `${years} ${years === 1 ? 'ano' : 'anos'}`
}

const getAnimalPhoto = (animal: any) => {
  const appearance = animal.appearance as any
  if (appearance && typeof appearance === 'object' && appearance.photo) {
    return appearance.photo
  }

  const speciesName = animal.species?.name
  if (speciesName === 'Cachorro') {
    return 'https://i.ibb.co/Z6dPncCH/pic-dog.png'
  } else if (speciesName === 'Gato') {
    return 'https://i.ibb.co/9dWLkZs/pic-cat.png'
  }
  return 'https://i.ibb.co/KpVTx4vK/pic-none.png'
}

export default async function AnimalDetailsPage({ params }: AnimalDetailsPageProps) {
  const animal = await prisma.animal.findUnique({
    where: { id: params.id },
    include: {
      species: true,
      breed: true,
      status: true,
      shelter: true,
      weights: {
        orderBy: { dateTime: 'desc' },
        include: {
          recordedByUser: {
            select: {
              name: true,
            },
          },
        },
      },
      medicalRecords: {
        orderBy: { recordDate: 'desc' },
        include: {
          createdByUser: {
            select: {
              name: true,
            },
          },
        },
      },
      events: {
        orderBy: { createdAt: 'desc' },
        include: {
          triggeredByUser: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  if (!animal) {
    notFound()
  }

  // Extract appearance data
  const appearance = animal.appearance as any
  const coat = appearance && typeof appearance === 'object' ? appearance.coat : null
  const color = appearance && typeof appearance === 'object' ? appearance.color : null

  // Extract health status data
  const healthStatus = animal.healthStatus as any
  const vaccinated = healthStatus && typeof healthStatus === 'object' ? healthStatus.vaccinated : false
  const dewormed = healthStatus && typeof healthStatus === 'object' ? healthStatus.dewormed : false
  const deparasitized = healthStatus && typeof healthStatus === 'object' ? healthStatus.deparasitized : false

  // Calculate age
  const age = calculateAge(animal.birthDate)

  // Get latest weight
  const latestWeight = animal.weights[0]
  const previousWeight = animal.weights[1]

  // Get photo
  const photo = getAnimalPhoto(animal)

  // Prepare animal data
  const animalData = {
    id: animal.id,
    name: animal.name,
    description: animal.description,
    photo,
    species: animal.species?.name || '',
    breed: animal.breed?.name || '',
    gender: animal.gender || '',
    size: animal.size || '',
    status: animal.status?.name || '',
    coat,
    color,
    birthDate: animal.birthDate,
    age,
    castrated: animal.castrated,
    vaccinated,
    dewormed,
    deparasitized,
    shelter: animal.shelter.name,
    latestWeight: latestWeight ? `${latestWeight.value} kg` : null,
    previousWeight: previousWeight ? `${previousWeight.value} kg` : null,
    weightVariation: latestWeight && previousWeight
      ? ((Number(latestWeight.value) - Number(previousWeight.value)) / Number(previousWeight.value) * 100).toFixed(1)
      : null,
    weights: animal.weights.map(w => ({
      id: w.id,
      date: w.dateTime,
      value: Number(w.value),
      unit: w.unit,
      notes: w.notes,
      recordedBy: w.recordedByUser?.name || '',
    })),
    medicalRecords: animal.medicalRecords.map(mr => ({
      id: mr.id,
      type: mr.recordType,
      description: mr.description,
      veterinarian: mr.veterinarian,
      date: mr.recordDate,
      nextDueDate: mr.nextDueDate,
      details: mr.details,
      createdBy: mr.createdByUser?.name || '',
    })),
    events: animal.events.map(e => ({
      id: e.id,
      type: e.eventType,
      description: e.description,
      details: e.details,
      date: e.createdAt,
      triggeredBy: e.triggeredByUser?.name || '',
    })),
  }

  return (
    <DashboardLayout>
      <AnimalDetailsClient animal={animalData} />
    </DashboardLayout>
  )
}
