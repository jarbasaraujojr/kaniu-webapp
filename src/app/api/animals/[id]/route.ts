import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// Schema de validação para atualização de animal
const updateAnimalSchema = z.object({
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

  // Status
  status_id: z.number().int().positive().optional().nullable(),
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

    const animal = await prisma.animals.findUnique({
      where: {
        id: params.id,
        deleted_at: null,
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

    if (!animal) {
      return NextResponse.json(
        { error: 'Animal não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ animal })
  } catch (error) {
    console.error('Erro ao buscar animal:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar animal' },
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
    const validatedData = updateAnimalSchema.parse(body)

    // Verificar se o animal existe
    const existingAnimal = await prisma.animals.findUnique({
      where: {
        id: params.id,
        deleted_at: null,
      },
    })

    if (!existingAnimal) {
      return NextResponse.json(
        { error: 'Animal não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar animal usando transação para lidar com cores
    const animal = await prisma.$transaction(async (tx) => {
      // Se color_ids foi fornecido, atualizar cores
      if (validatedData.color_ids !== undefined) {
        // Deletar cores existentes
        await tx.animal_colors.deleteMany({
          where: { animal_id: params.id },
        })

        // Criar novas cores
        if (validatedData.color_ids.length > 0) {
          await tx.animal_colors.createMany({
            data: validatedData.color_ids.map((colorId) => ({
              animal_id: params.id,
              color_id: colorId,
            })),
          })
        }
      }

      // Atualizar dados do animal
      return await tx.animals.update({
        where: {
          id: params.id,
        },
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
          is_available_for_adoption: validatedData.is_available_for_adoption,
          health_status: validatedData.health_status || {},
          behavior: validatedData.behavior || {},
          fur_type_id: validatedData.fur_type_id,
          status_id: validatedData.status_id,
          updated_by: session.user.id,
          updated_at: new Date(),
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
    })

    return NextResponse.json({ animal })
  } catch (error) {
    console.error('Erro ao atualizar animal:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar animal' },
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

    // Verificar se o animal existe
    const existingAnimal = await prisma.animals.findUnique({
      where: {
        id: params.id,
        deleted_at: null,
      },
    })

    if (!existingAnimal) {
      return NextResponse.json(
        { error: 'Animal não encontrado' },
        { status: 404 }
      )
    }

    // Soft delete
    await prisma.animals.update({
      where: {
        id: params.id,
      },
      data: {
        deleted_at: new Date(),
        updated_by: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar animal:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar animal' },
      { status: 500 }
    )
  }
}
