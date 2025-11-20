import { prisma } from '../src/lib/db/prisma'

async function checkCurrentEventTypes() {
  try {
    console.log('Checking current event types in use...\n')

    // Get distinct event types from animal_events
    const eventTypes = await prisma.$queryRaw<Array<{ event_type: string; count: bigint }>>`
      SELECT event_type, COUNT(*) as count
      FROM animal_events
      GROUP BY event_type
      ORDER BY count DESC
    `

    console.log('Current event types in animal_events:')
    eventTypes.forEach(et => {
      console.log(`- ${et.event_type}: ${et.count} occurrences`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurrentEventTypes()
