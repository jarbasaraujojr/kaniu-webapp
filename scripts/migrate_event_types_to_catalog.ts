import { prisma } from '../src/lib/db/prisma'

async function migrateEventTypes() {
  try {
    console.log('Starting event types migration...\n')

    // Step 1: Add event_type_id column
    console.log('Step 1: Adding event_type_id column...')
    await prisma.$executeRaw`
      ALTER TABLE animal_events ADD COLUMN IF NOT EXISTS event_type_id INTEGER;
    `
    console.log('✓ Column added\n')

    // Step 2: Get all event types from catalog
    const eventTypesFromCatalog = await prisma.catalogs.findMany({
      where: { category: 'event_types' }
    })

    const eventTypeMap = new Map<string, number>()
    eventTypesFromCatalog.forEach(et => {
      const details = typeof et.description === 'string' ? JSON.parse(et.description) : et.description
      eventTypeMap.set(details.key, et.id)
    })

    console.log('Step 2: Migrating existing event data...')
    console.log(`Found ${eventTypeMap.size} event types in catalog\n`)

    // Step 3: Migrate each existing event type
    const existingEventTypes = await prisma.$queryRaw<Array<{ event_type: string; count: bigint }>>`
      SELECT event_type, COUNT(*) as count
      FROM animal_events
      WHERE event_type_id IS NULL
      GROUP BY event_type
    `

    for (const row of existingEventTypes) {
      const eventType = row.event_type
      let key = eventType

      // Handle special cases with accents
      const keyMap: Record<string, string> = {
        'socialização': 'socializacao',
        'castração': 'castracao',
      }

      if (keyMap[eventType]) {
        key = keyMap[eventType]
      }

      const catalogId = eventTypeMap.get(key)

      if (!catalogId) {
        console.log(`⚠ Warning: No catalog entry found for event type "${eventType}"`)
        continue
      }

      const result = await prisma.$executeRaw`
        UPDATE animal_events
        SET event_type_id = ${catalogId}
        WHERE event_type = ${eventType}
        AND event_type_id IS NULL
      `

      console.log(`✓ Migrated ${result} records: "${eventType}" -> ID ${catalogId}`)
    }

    // Step 4: Add foreign key constraint
    console.log('\nStep 3: Adding foreign key constraint...')
    try {
      await prisma.$executeRaw`
        ALTER TABLE animal_events
        ADD CONSTRAINT fk_animal_events_event_type
        FOREIGN KEY (event_type_id)
        REFERENCES catalogs(id)
        ON DELETE RESTRICT;
      `
      console.log('✓ Foreign key constraint added\n')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('✓ Foreign key constraint already exists\n')
      } else {
        throw error
      }
    }

    // Step 5: Verify migration
    console.log('Step 4: Verifying migration...')
    const verification = await prisma.$queryRaw<Array<{
      event_type: string
      event_type_id: number
      count: bigint
    }>>`
      SELECT
        event_type,
        event_type_id,
        COUNT(*) as count
      FROM animal_events
      GROUP BY event_type, event_type_id
      ORDER BY event_type
    `

    console.log('\nMigration verification:')
    verification.forEach(row => {
      console.log(`- ${row.event_type}: ID ${row.event_type_id}, ${row.count} records`)
    })

    // Check for unmigrated records
    const unmigrated = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM animal_events
      WHERE event_type_id IS NULL
    `

    if (unmigrated[0].count > 0) {
      console.log(`\n⚠ Warning: ${unmigrated[0].count} records still need migration`)
    } else {
      console.log('\n✅ All records successfully migrated!')
    }

    console.log('\n📝 Note: The event_type column is kept for now.')
    console.log('   After verifying everything works correctly, you can:')
    console.log('   1. Make event_type_id NOT NULL')
    console.log('   2. Drop the event_type column')
    console.log('   3. Update Prisma schema accordingly')

  } catch (error) {
    console.error('Error during migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateEventTypes()
