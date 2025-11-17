import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// Schema de validação
const updateShelterSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  owner_id: z.string().uuid().optional(),
  location: z.any().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal(null)),
  website: z.string().url().nullable().optional().or(z.literal(null)),
  is_active: z.boolean().optional(),
})

// GET /api/shelters/[id] - Buscar abrigo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const shelter = await prisma.shelters.findUnique({
      where: { id: params.id },
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
      },
    })

    if (!shelter || shelter.deleted_at) {
      return NextResponse.json(
        { error: 'Abrigo não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(shelter)
  } catch (error) {
    console.error('Error fetching shelter:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar abrigo' },
      { status: 500 }
    )
  }
}

// PUT /api/shelters/[id] - Atualizar abrigo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas admins podem editar abrigos
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem editar abrigos' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validar dados
    const validatedData = updateShelterSchema.parse(body)

    // Verificar se o abrigo existe
    const existingShelter = await prisma.shelters.findUnique({
      where: { id: params.id },
    })

    if (!existingShelter || existingShelter.deleted_at) {
      return NextResponse.json(
        { error: 'Abrigo não encontrado' },
        { status: 404 }
      )
    }

    // Se está mudando o owner, verificar se o novo owner existe
    if (validatedData.owner_id) {
      const owner = await prisma.users.findUnique({
        where: { id: validatedData.owner_id },
      })

      if (!owner) {
        return NextResponse.json(
          { error: 'Responsável não encontrado' },
          { status: 404 }
        )
      }
    }

    // Atualizar abrigo
    const shelter = await prisma.shelters.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(shelter)
  } catch (error) {
    console.error('Error updating shelter:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar abrigo' },
      { status: 500 }
    )
  }
}

// DELETE /api/shelters/[id] - Excluir abrigo (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas admins podem excluir abrigos
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem excluir abrigos' },
        { status: 403 }
      )
    }

    // Verificar se o abrigo existe
    const existingShelter = await prisma.shelters.findUnique({
      where: { id: params.id },
    })

    if (!existingShelter || existingShelter.deleted_at) {
      return NextResponse.json(
        { error: 'Abrigo não encontrado' },
        { status: 404 }
      )
    }

    // Soft delete
    await prisma.shelters.update({
      where: { id: params.id },
      data: {
        deleted_at: new Date(),
        is_active: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shelter:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir abrigo' },
      { status: 500 }
    )
  }
}
