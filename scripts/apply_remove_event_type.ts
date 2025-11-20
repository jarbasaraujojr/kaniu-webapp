import { prisma } from '../src/lib/db/prisma'

async function applyMigration() {
  try {
    console.log('🔄 Starting migration: Remove event_type field...\n')

    // Drop the index first
    console.log('Dropping index animal_events_event_type_idx...')
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "animal_events_event_type_idx"')
    console.log('✅ Index dropped\n')

    // Drop the column
    console.log('Dropping event_type column...')
    await prisma.$executeRawUnsafe('ALTER TABLE "animal_events" DROP COLUMN IF EXISTS "event_type"')
    console.log('✅ Column dropped\n')

    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Error applying migration:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()
