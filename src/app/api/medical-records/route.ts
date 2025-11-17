import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

// Schema de validação para criação de registro médico
const createMedicalRecordSchema = z.object({
  animal_id: z.string().uuid('ID do animal inválido'),
  record_type: z.string().min(1, 'Tipo de registro é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  veterinarian: z.string().optional().nullable(),
  record_date: z.string(),
  next_due_date: z.string().optional().nullable(),
  details: z.any().optional(),
  clinic_id: z.string().uuid().optional().nullable(),
  document_id: z.string().uuid().optional().nullable(),
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
    const validatedData = createMedicalRecordSchema.parse(body)

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

    // Criar registro médico
    const medicalRecord = await prisma.animal_medical_records.create({
      data: {
        animal_id: validatedData.animal_id,
        record_type: validatedData.record_type,
        description: validatedData.description,
        veterinarian: validatedData.veterinarian,
        record_date: new Date(validatedData.record_date),
        next_due_date: validatedData.next_due_date
          ? new Date(validatedData.next_due_date)
          : null,
        details: validatedData.details || {},
        clinic_id: validatedData.clinic_id,
        document_id: validatedData.document_id,
        created_by: session.user.id,
      },
      include: {
        animals: {
          select: {
            name: true,
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
    })

    return NextResponse.json({ medicalRecord }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar registro médico:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar registro médico' },
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
    const recordType = searchParams.get('record_type')
    const clinicId = searchParams.get('clinic_id')
    const limit = searchParams.get('limit')

    const whereClause: Prisma.animal_medical_recordsWhereInput = {}

    if (animalId) {
      whereClause.animal_id = animalId
    }

    if (recordType) {
      whereClause.record_type = recordType
    }

    if (clinicId) {
      whereClause.clinic_id = clinicId
    }

    const medicalRecords = await prisma.animal_medical_records.findMany({
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
        veterinary_clinic: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        record_date: 'desc',
      },
      take: limit ? Number(limit) : undefined,
    })

    return NextResponse.json({ medicalRecords })
  } catch (error) {
    console.error('Erro ao buscar registros médicos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar registros médicos' },
      { status: 500 }
    )
  }
}
