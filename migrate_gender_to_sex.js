const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateGenderToSex() {
  try {
    console.log('Starting migration from gender to sex_id...')

    // Check if gender column still exists
    const result = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'animals' AND column_name = 'gender'
    `

    if (result.length === 0) {
      console.log('✅ Gender column already removed. Migration not needed.')
      return
    }

    console.log('Gender column found. Proceeding with migration...')

    // Get sex catalog IDs
    const macho = await prisma.catalogs.findFirst({
      where: { category: 'sex', name: 'Macho' }
    })
    const femea = await prisma.catalogs.findFirst({
      where: { category: 'sex', name: 'Fêmea' }
    })
    const indefinido = await prisma.catalogs.findFirst({
      where: { category: 'sex', name: 'Indefinido' }
    })

    if (!macho || !femea || !indefinido) {
      console.error('❌ Sex catalog values not found. Please run seed first.')
      return
    }

    console.log(`Found sex catalog IDs:`)
    console.log(`  Macho: ${macho.id}`)
    console.log(`  Fêmea: ${femea.id}`)
    console.log(`  Indefinido: ${indefinido.id}`)

    // Migrate data
    console.log('\nMigrating data...')

    // Update Macho
    const machoCount = await prisma.$executeRaw`
      UPDATE animals
      SET sex_id = ${macho.id}
      WHERE LOWER(gender) IN ('male', 'macho', 'm')
    `
    console.log(`  Migrated ${machoCount} animals to Macho`)

    // Update Fêmea
    const femeaCount = await prisma.$executeRaw`
      UPDATE animals
      SET sex_id = ${femea.id}
      WHERE LOWER(gender) IN ('female', 'fêmea', 'femea', 'f')
    `
    console.log(`  Migrated ${femeaCount} animals to Fêmea`)

    // Update remaining with gender to Indefinido
    const indefinidoCount = await prisma.$executeRaw`
      UPDATE animals
      SET sex_id = ${indefinido.id}
      WHERE gender IS NOT NULL AND sex_id IS NULL
    `
    console.log(`  Migrated ${indefinidoCount} animals to Indefinido`)

    // Check remaining NULL
    const nullCount = await prisma.animals.count({
      where: { sex_id: null }
    })
    console.log(`  ${nullCount} animals kept with NULL sex_id (had NULL gender)`)

    console.log('\n✅ Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateGenderToSex()
