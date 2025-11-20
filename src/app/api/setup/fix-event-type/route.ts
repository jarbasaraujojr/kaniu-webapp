import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

const eventTypes = [
  { key: 'entrada', name: 'Entrada no Abrigo', icon: 'fa-hand-holding-heart', eventCategory: 'shelter' },
  { key: 'adocao', name: 'Adoção', icon: 'fa-heart-circle-check', eventCategory: 'adoption' },
  { key: 'fuga', name: 'Fuga', icon: 'fa-door-open', eventCategory: 'shelter' },
  { key: 'internacao', name: 'Internação', icon: 'fa-bed-pulse', eventCategory: 'medical' },
  { key: 'obito', name: 'Óbito', icon: 'fa-cross', eventCategory: 'medical' },
]

export async function POST() {
  try {
    const steps = []

    // Step 1: Populate event types if needed
    console.log('[FIX] Step 1: Checking event types...')
    for (const eventType of eventTypes) {
      const existing = await prisma.catalogs.findFirst({
        where: {
          category: 'event_types',
          name: eventType.name
        }
      })

      if (!existing) {
        const catalog = await prisma.catalogs.create({
          data: {
            category: 'event_types',
            name: eventType.name,
            description: JSON.stringify({
              key: eventType.key,
              icon: eventType.icon,
              eventCategory: eventType.eventCategory
            })
          }
        })
        steps.push(`Created event type: ${eventType.name} (ID: ${catalog.id})`)
      } else {
        steps.push(`Event type already exists: ${eventType.name} (ID: ${existing.id})`)
      }
    }

    // Step 2: Drop the event_type index
    console.log('[FIX] Step 2: Dropping index...')
    try {
      await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "animal_events_event_type_idx"')
      steps.push('✓ Dropped index: animal_events_event_type_idx')
    } catch (error) {
      steps.push(`⚠ Index drop: ${error instanceof Error ? error.message : 'already dropped or not exists'}`)
    }

    // Step 3: Drop the event_type column
    console.log('[FIX] Step 3: Dropping event_type column...')
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "animal_events" DROP COLUMN IF EXISTS "event_type"')
      steps.push('✓ Dropped column: event_type')
    } catch (error) {
      steps.push(`⚠ Column drop: ${error instanceof Error ? error.message : 'already dropped or not exists'}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Database fix completed successfully',
      steps
    })
  } catch (error) {
    console.error('[FIX] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
