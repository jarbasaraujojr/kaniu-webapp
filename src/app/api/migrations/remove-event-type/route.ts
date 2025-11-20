import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST() {
  try {
    console.log('[MIGRATION] Starting: Remove event_type field')

    // Drop the index first
    console.log('[MIGRATION] Dropping index animal_events_event_type_idx...')
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "animal_events_event_type_idx"')
    console.log('[MIGRATION] ✓ Index dropped')

    // Drop the column
    console.log('[MIGRATION] Dropping event_type column...')
    await prisma.$executeRawUnsafe('ALTER TABLE "animal_events" DROP COLUMN IF EXISTS "event_type"')
    console.log('[MIGRATION] ✓ Column dropped')

    return NextResponse.json({
      success: true,
      message: 'Migration completed: event_type field removed',
      details: {
        indexDropped: 'animal_events_event_type_idx',
        columnDropped: 'event_type'
      }
    })
  } catch (error) {
    console.error('[MIGRATION] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
