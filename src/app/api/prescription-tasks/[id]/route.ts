import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateTaskSchema = z.object({
  is_completed: z.boolean(),
  administered_at: z.string().optional().nullable(),
  administered_by: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function PATCH(
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
    const validatedData = updateTaskSchema.parse(body)

    const existingTask = await prisma.prescription_tasks.findUnique({
      where: { id: params.id },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    const task = await prisma.prescription_tasks.update({
      where: {
        id: params.id,
      },
      data: {
        is_completed: validatedData.is_completed,
        administered_at: validatedData.administered_at
          ? new Date(validatedData.administered_at)
          : validatedData.is_completed
            ? new Date()
            : null,
        administered_by: validatedData.administered_by || session.user.id,
        notes: validatedData.notes,
      },
      include: {
        users: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa' },
      { status: 500 }
    )
  }
}
