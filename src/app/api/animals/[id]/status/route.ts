import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { statusName } = await request.json()
    const animalId = params.id

    // Map status names to their keys and event types
    const statusMapping: Record<string, { catalogKey: string; eventKey: string; description: string }> = {
      'Disponível': {
        catalogKey: 'disponivel',
        eventKey: 'entrada',
        description: 'Animal disponível para adoção'
      },
      'Adotado': {
        catalogKey: 'adotado',
        eventKey: 'adocao',
        description: 'Animal adotado'
      },
      'Desaparecido': {
        catalogKey: 'desaparecido',
        eventKey: 'fuga',
        description: 'Animal desaparecido'
      },
      'Internado': {
        catalogKey: 'internado',
        eventKey: 'internacao',
        description: 'Animal internado para tratamento'
      },
      'Falecido': {
        catalogKey: 'falecido',
        eventKey: 'obito',
        description: 'Animal falecido'
      },
    }

    const mapping = statusMapping[statusName]
    if (!mapping) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    // Find status catalog entry
    const statusCatalog = await prisma.catalogs.findFirst({
      where: {
        category: 'animal_status',
        description: { contains: `"key":"${mapping.catalogKey}"` }
      }
    })

    if (!statusCatalog) {
      return NextResponse.json({ error: 'Status não encontrado no catálogo' }, { status: 404 })
    }

    // Find event type catalog entry
    const eventTypeCatalog = await prisma.catalogs.findFirst({
      where: {
        category: 'event_types',
        description: { contains: `"key":"${mapping.eventKey}"` }
      }
    })

    if (!eventTypeCatalog) {
      console.error('[STATUS] Event type not found for key:', mapping.eventKey)
      return NextResponse.json({
        error: 'Tipo de evento não encontrado no catálogo',
        details: `Event type "${mapping.eventKey}" not found`
      }, { status: 404 })
    }

    console.log('[STATUS] Found status catalog:', statusCatalog.id, statusCatalog.name)
    console.log('[STATUS] Found event type catalog:', eventTypeCatalog.id, eventTypeCatalog.name)

    // Update animal status and create event in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update animal status
      const updatedAnimal = await tx.animals.update({
        where: { id: animalId },
        data: {
          status_id: statusCatalog.id,
          updated_by: session.user.id,
          updated_at: new Date(),
          // Update is_available_for_adoption based on status
          is_available_for_adoption: statusName === 'Disponível',
        },
      })

      // Create event in animal history
      const event = await tx.animal_events.create({
        data: {
          animal_id: animalId,
          event_type_id: eventTypeCatalog.id,
          description: mapping.description,
          triggered_by: session.user.id,
          created_at: new Date(),
        },
      })

      return { animal: updatedAnimal, event }
    })

    return NextResponse.json({
      success: true,
      message: `Status alterado para ${statusName}`,
      data: result,
    })
  } catch (error) {
    console.error('[STATUS] Error updating animal status:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Erro ao atualizar status do animal',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
