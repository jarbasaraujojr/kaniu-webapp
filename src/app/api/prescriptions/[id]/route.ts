import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updatePrescriptionSchema = z.object({
  medication_name: z.string().min(1, 'Nome do medicamento é obrigatório'),
  dosage: z.string().min(1, 'Dosagem é obrigatória'),
  dosage_unit_id: z.number().int().positive().optional().nullable(),
  route_id: z.number().int().positive().optional().nullable(),
  frequency_hours: z.number().int().positive('Frequência em horas é obrigatória'),
  start_date: z.string(),
  duration_days: z.number().int().positive().optional().nullable(),
  is_continuous: z.boolean().default(false),
  is_completed: z.boolean().default(false),
  notes: z.string().optional().nullable(),
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

    const prescription = await prisma.prescriptions.findUnique({
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
        catalogs_prescriptions_dosage_unit_idTocatalogs: {
          select: {
            name: true,
          },
        },
        catalogs_prescriptions_route_idTocatalogs: {
          select: {
            name: true,
          },
        },
        prescription_tasks: {
          orderBy: {
            scheduled_time: 'asc',
          },
        },
      },
    })

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescrição não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ prescription })
  } catch (error) {
    console.error('Erro ao buscar prescrição:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar prescrição' },
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
    const validatedData = updatePrescriptionSchema.parse(body)

    const existingPrescription = await prisma.prescriptions.findUnique({
      where: { id: params.id },
    })

    if (!existingPrescription) {
      return NextResponse.json(
        { error: 'Prescrição não encontrada' },
        { status: 404 }
      )
    }

    const prescription = await prisma.prescriptions.update({
      where: {
        id: params.id,
      },
      data: {
        medication_name: validatedData.medication_name,
        dosage: validatedData.dosage,
        dosage_unit_id: validatedData.dosage_unit_id,
        route_id: validatedData.route_id,
        frequency_hours: validatedData.frequency_hours,
        start_date: new Date(validatedData.start_date),
        duration_days: validatedData.duration_days,
        is_continuous: validatedData.is_continuous,
        is_completed: validatedData.is_completed,
        notes: validatedData.notes,
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
        catalogs_prescriptions_dosage_unit_idTocatalogs: {
          select: {
            name: true,
          },
        },
        catalogs_prescriptions_route_idTocatalogs: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ prescription })
  } catch (error) {
    console.error('Erro ao atualizar prescrição:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar prescrição' },
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

    const existingPrescription = await prisma.prescriptions.findUnique({
      where: { id: params.id },
    })

    if (!existingPrescription) {
      return NextResponse.json(
        { error: 'Prescrição não encontrada' },
        { status: 404 }
      )
    }

    // Deletar tarefas associadas primeiro
    await prisma.prescription_tasks.deleteMany({
      where: {
        prescription_id: params.id,
      },
    })

    // Deletar prescrição
    await prisma.prescriptions.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar prescrição:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar prescrição' },
      { status: 500 }
    )
  }
}
