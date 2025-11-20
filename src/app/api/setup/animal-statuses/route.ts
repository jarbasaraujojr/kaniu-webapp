import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

const animalStatuses = [
  { key: 'disponivel', name: 'Disponível', description: 'Animal disponível para adoção' },
  { key: 'adotado', name: 'Adotado', description: 'Animal foi adotado' },
  { key: 'desaparecido', name: 'Desaparecido', description: 'Animal desaparecido' },
  { key: 'internado', name: 'Internado', description: 'Animal internado para tratamento' },
  { key: 'falecido', name: 'Falecido', description: 'Animal falecido' },
]

export async function POST() {
  try {
    const results = []

    for (const status of animalStatuses) {
      // Check if already exists
      const existing = await prisma.catalogs.findFirst({
        where: {
          category: 'animal_status',
          name: status.name
        }
      })

      if (existing) {
        results.push({
          status: 'skipped',
          name: status.name,
          message: 'Already exists'
        })
        continue
      }

      // Insert into catalogs
      const catalog = await prisma.catalogs.create({
        data: {
          category: 'animal_status',
          name: status.name,
          description: JSON.stringify({
            key: status.key,
            description: status.description
          })
        }
      })

      results.push({
        status: 'created',
        name: status.name,
        key: status.key,
        id: catalog.id
      })
    }

    // Get all statuses
    const allStatuses = await prisma.catalogs.findMany({
      where: { category: 'animal_status' },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      message: 'Animal statuses setup completed',
      results,
      allStatuses: allStatuses.map(s => {
        const details = JSON.parse(s.description || '{}')
        return {
          id: s.id,
          name: s.name,
          key: details.key
        }
      })
    })
  } catch (error) {
    console.error('Error setting up animal statuses:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup animal statuses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
