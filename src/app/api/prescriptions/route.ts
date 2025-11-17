import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// Schema de validação para criação de prescrição
const createPrescriptionSchema = z.object({
  animal_id: z.string().uuid('ID do animal inválido'),
  medication_id: z.number().int().positive('Medicamento é obrigatório'),
  dosage: z.string().min(1, 'Dosagem é obrigatória'),
  route: z.string().min(1, 'Via de administração é obrigatória'),
  interval_hours: z.number().int().positive('Frequência em horas é obrigatória'),
  start_date: z.string(),
  start_time: z.string().optional().nullable(),
  duration_days: z.number().int().positive().optional().nullable(),
  is_continuous: z.boolean().default(false),
  is_completed: z.boolean().default(false),
  prescribed_by: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createPrescriptionSchema.parse(body)

    // Verificar se o animal existe
    const animal = await prisma.animals.findUnique({
      where: {
        id: validatedData.animal_id,
        deleted_at: null,
      },
    })

    if (!animal) {
      return NextResponse.json(
        { error: 'Animal não encontrado' },
        { status: 404 }
      )
    }

    // Criar prescrição
    const prescription = await prisma.prescriptions.create({
      data: {
        animal_id: validatedData.animal_id,
        medication_id: validatedData.medication_id,
        dosage: validatedData.dosage,
        route: validatedData.route,
        interval_hours: validatedData.interval_hours,
        start_date: new Date(validatedData.start_date),
        start_time: validatedData.start_time ? new Date(`1970-01-01T${validatedData.start_time}`) : null,
        duration_days: validatedData.duration_days,
        is_continuous: validatedData.is_continuous,
        is_completed: validatedData.is_completed,
        prescribed_by: validatedData.prescribed_by || session.user.id,
        description: validatedData.description,
      },
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
      },
    })

    return NextResponse.json({ prescription }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar prescrição:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar prescrição' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const animalId = searchParams.get('animal_id')
    const isCompleted = searchParams.get('is_completed')
    const isContinuous = searchParams.get('is_continuous')
    const limit = searchParams.get('limit')

    const whereClause: any = {}

    if (animalId) {
      whereClause.animal_id = animalId
    }

    if (isCompleted !== null) {
      whereClause.is_completed = isCompleted === 'true'
    }

    if (isContinuous !== null) {
      whereClause.is_continuous = isContinuous === 'true'
    }

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
          take: 1,
        },
      },
      orderBy: {
        start_date: 'desc',
      },
      take: limit ? Number(limit) : undefined,
    })

    return NextResponse.json({ prescriptions })
  } catch (error) {
    console.error('Erro ao buscar prescrições:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar prescrições' },
      { status: 500 }
    )
  }
}
