import { prisma } from '../src/lib/db/prisma'

const animalStatuses = [
  { key: 'disponivel', name: 'Disponível', description: 'Animal disponível para adoção' },
  { key: 'adotado', name: 'Adotado', description: 'Animal foi adotado' },
  { key: 'desaparecido', name: 'Desaparecido', description: 'Animal desaparecido' },
  { key: 'internado', name: 'Internado', description: 'Animal internado para tratamento' },
  { key: 'falecido', name: 'Falecido', description: 'Animal falecido' },
]

async function insertAnimalStatuses() {
  try {
    console.log('Starting animal statuses insertion...\n')

    for (const status of animalStatuses) {
      // Check if already exists
      const existing = await prisma.catalogs.findFirst({
        where: {
          category: 'animal_status',
          name: status.name
        }
      })

      if (existing) {
        console.log(`✓ Animal status "${status.name}" already exists, skipping...`)
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

      console.log(`✓ Created animal status: ${status.name} (${status.key})`)
    }

    console.log('\n✅ Animal statuses insertion completed!')

    // Display all animal statuses
    const allStatuses = await prisma.catalogs.findMany({
      where: { category: 'animal_status' },
      orderBy: { name: 'asc' }
    })

    console.log('\nAll animal statuses in catalog:')
    allStatuses.forEach(s => {
      const details = JSON.parse(s.description || '{}')
      console.log(`  - ${s.name} (${details.key}): ID ${s.id}`)
    })
  } catch (error) {
    console.error('Error inserting animal statuses:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

insertAnimalStatuses()
