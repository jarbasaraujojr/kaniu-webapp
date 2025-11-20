import { PrismaClient } from '@prisma/client'

const oldPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/kaniu_old'
    }
  }
})

async function queryOldDatabase() {
  try {
    console.log('Querying old database for event types...\n')

    // Execute raw SQL to find event-related tables
    const tables = await oldPrisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%event%'
      ORDER BY table_name
    `

    console.log('Tables related to events:')
    console.log(tables)
    console.log('\n')

    // Try to find event types table
    const eventTypesTables = await oldPrisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (table_name LIKE '%event_type%' OR table_name LIKE '%tipo%evento%')
      ORDER BY table_name
    `

    console.log('Event types tables:')
    console.log(eventTypesTables)

  } catch (error) {
    console.error('Error querying old database:', error)
  } finally {
    await oldPrisma.$disconnect()
  }
}

queryOldDatabase()
