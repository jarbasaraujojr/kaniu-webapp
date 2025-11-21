import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

// Schema de validação para criação de animal
const createAnimalSchema = z.object({
  // Etapa 1: Dados básicos
  name: z.string().min(1, 'Nome é obrigatório'),
  species_id: z.number().int().positive('Espécie é obrigatória'),
  breed_id: z.number().int().positive().optional().nullable(),
  sex_id: z.number().int().positive().optional().nullable(),
  size: z.enum(['Pequeno', 'Médio', 'Grande']).optional().nullable(),
  birth_date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),

  // Etapa 2: Saúde
  microchip_id: z.string().optional().nullable(),
  castrated: z.boolean().optional().nullable(),
  is_available_for_adoption: z.boolean().optional(),
  health_status: z.object({
    vaccines: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }).optional().nullable(),

  // Etapa 3: Comportamento
  behavior: z.object({
    energy_level: z.enum(['Baixo', 'Médio', 'Alto']).optional(),
    sociability: z.enum(['Tímido', 'Moderado', 'Sociável']).optional(),
    good_with_kids: z.boolean().optional(),
    good_with_dogs: z.boolean().optional(),
    good_with_cats: z.boolean().optional(),
    house_trained: z.boolean().optional(),
    special_needs: z.string().optional(),
    notes: z.string().optional(),
  }).optional().nullable(),

  // Etapa 4: Aparência
  fur_type_id: z.number().int().positive().optional().nullable(),
  color_ids: z.array(z.number().int().positive()).optional(),
  markings: z.string().optional().nullable(),
  distinguishing_features: z.string().optional().nullable(),

  // Status inicial
  status_id: z.number().int().positive().optional().nullable(),
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
    const validatedData = createAnimalSchema.parse(body)

    // Obter shelter_id do usuário da sessão
    const shelterId = session.user.shelterId

    if (!shelterId) {
      return NextResponse.json(
        { error: 'Usuário não está associado a um abrigo' },
        { status: 400 }
      )
    }

    // Criar animal
    const animal = await prisma.animals.create({
      data: {
        name: validatedData.name,
        species_id: validatedData.species_id,
        breed_id: validatedData.breed_id,
        sex_id: validatedData.sex_id,
        size: validatedData.size,
        birth_date: validatedData.birth_date ? new Date(validatedData.birth_date) : null,
        description: validatedData.description,
        microchip_id: validatedData.microchip_id,
        castrated: validatedData.castrated,
        is_available_for_adoption: validatedData.is_available_for_adoption ?? false,
        health_status: validatedData.health_status || {},
        behavior: validatedData.behavior || {},
        fur_type_id: validatedData.fur_type_id,
        status_id: validatedData.status_id,
        shelter_id: shelterId,
        created_by: session.user.id,
        updated_by: session.user.id,
        // Criar relações de cores se fornecidas
        animal_colors: validatedData.color_ids && validatedData.color_ids.length > 0
          ? {
              create: validatedData.color_ids.map((colorId) => ({
                color_id: colorId,
              })),
            }
          : undefined,
      },
      include: {
        shelters: true,
        catalogs_animals_species_idTocatalogs: true,
        catalogs_animals_breed_idTocatalogs: true,
        catalogs_animals_sex_idTocatalogs: true,
        catalogs_animals_status_idTocatalogs: true,
        catalogs_animals_fur_type_idTocatalogs: true,
        animal_colors: {
          include: {
            color: true,
          },
        },
      },
    })

    // Registrar evento de entrada
    // Buscar o tipo de evento 'entrada' no catálogo
    const entradaEventType = await prisma.catalogs.findFirst({
      where: {
        category: 'event_types',
        description: { contains: '"key":"entrada"' }
      }
    })

    if (entradaEventType) {
      await prisma.animal_events.create({
        data: {
          animal_id: animal.id,
          event_type_id: entradaEventType.id,
          description: 'Animal cadastrado no sistema',
          triggered_by: session.user.id,
        },
      })
    }

    return NextResponse.json({ animal }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar animal:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar animal' },
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
    const status = searchParams.get('status')
    const shelterId = searchParams.get('shelterId')

    const whereClause: Prisma.animalsWhereInput = {
      deleted_at: null,
    }

    // Filtrar por status se especificado
    if (status && status !== 'Todos') {
      const statusCatalog = await prisma.catalogs.findFirst({
        where: {
          category: 'animal_status',
          name: status,
        },
      })
      if (statusCatalog) {
        whereClause.status_id = statusCatalog.id
      }
    }

    // Filtrar por abrigo se especificado
    if (shelterId) {
      whereClause.shelter_id = shelterId
    } else if (session.user.role === 'shelter_manager' && session.user.shelterId) {
      // Se for shelter_manager, filtrar apenas animais do seu abrigo
      whereClause.shelter_id = session.user.shelterId
    }

    const animals = await prisma.animals.findMany({
      where: whereClause,
      include: {
        shelters: {
          select: {
            id: true,
            name: true,
          },
        },
        catalogs_animals_species_idTocatalogs: {
          select: {
            name: true,
          },
        },
        catalogs_animals_breed_idTocatalogs: {
          select: {
            name: true,
          },
        },
        catalogs_animals_sex_idTocatalogs: {
          select: {
            name: true,
          },
        },
        catalogs_animals_status_idTocatalogs: {
          select: {
            name: true,
          },
        },
        catalogs_animals_fur_type_idTocatalogs: {
          select: {
            name: true,
          },
        },
        animal_colors: {
          include: {
            color: {
              select: {
                name: true,
              },
            },
          },
        },
        animal_weights: {
          select: {
            value: true,
            date_time: true,
          },
          orderBy: {
            date_time: 'desc',
          },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ animals })
  } catch (error) {
    console.error('Erro ao buscar animais:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar animais' },
      { status: 500 }
    )
  }
}
