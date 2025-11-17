import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// Schema de validação
const createShelterSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  owner_id: z.string().uuid(),
  location: z.any().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal(null)),
  website: z.string().url().nullable().optional().or(z.literal(null)),
  is_active: z.boolean().default(true),
})

// GET /api/shelters - Listar abrigos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')

    const whereClause: any = {
      deleted_at: null,
    }

    if (active === 'true') {
      whereClause.is_active = true
    }

    const shelters = await prisma.shelters.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
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
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(shelters)
  } catch (error: any) {
    console.error('Error fetching shelters:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar abrigos' },
      { status: 500 }
    )
  }
}

// POST /api/shelters - Criar novo abrigo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas admins podem criar abrigos
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar abrigos' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validar dados
    const validatedData = createShelterSchema.parse(body)

    // Verificar se o owner existe
    const owner = await prisma.users.findUnique({
      where: { id: validatedData.owner_id },
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Responsável não encontrado' },
        { status: 404 }
      )
    }

    // Criar abrigo
    const shelter = await prisma.shelters.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        owner_id: validatedData.owner_id,
        location: validatedData.location,
        phone: validatedData.phone,
        email: validatedData.email,
        website: validatedData.website,
        is_active: validatedData.is_active,
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

    return NextResponse.json(shelter, { status: 201 })
  } catch (error: any) {
    console.error('Error creating shelter:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar abrigo' },
      { status: 500 }
    )
  }
}
