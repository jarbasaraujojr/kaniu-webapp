import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateMedicalRecordSchema = z.object({
  record_type: z.string().min(1, 'Tipo de registro é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  veterinarian: z.string().optional().nullable(),
  record_date: z.string(),
  next_due_date: z.string().optional().nullable(),
  details: z.any().optional(),
  clinic_id: z.string().uuid().optional().nullable(),
  document_id: z.string().uuid().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const medicalRecord = await prisma.animal_medical_records.findUnique({
      where: {
        id: params.id,
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
        veterinary_clinic: {
          select: {
            name: true,
          },
        },
        documents: true,
      },
    })

    if (!medicalRecord) {
      return NextResponse.json(
        { error: 'Registro médico não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ medicalRecord })
  } catch (error) {
    console.error('Erro ao buscar registro médico:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar registro médico' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateMedicalRecordSchema.parse(body)

    const existingRecord = await prisma.animal_medical_records.findUnique({
      where: { id: params.id },
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Registro médico não encontrado' },
        { status: 404 }
      )
    }

    const medicalRecord = await prisma.animal_medical_records.update({
      where: {
        id: params.id,
      },
      data: {
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

    return NextResponse.json({ medicalRecord })
  } catch (error) {
    console.error('Erro ao atualizar registro médico:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar registro médico' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const existingRecord = await prisma.animal_medical_records.findUnique({
      where: { id: params.id },
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Registro médico não encontrado' },
        { status: 404 }
      )
    }

    await prisma.animal_medical_records.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar registro médico:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar registro médico' },
      { status: 500 }
    )
  }
}
