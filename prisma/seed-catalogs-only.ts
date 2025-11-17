import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed apenas de catálogos (sem deletar dados)...')

  let catalogsCreated = 0

  // Função helper para criar catalog apenas se não existir
  async function createCatalogIfNotExists(category: string, name: string, description?: string, parent_id?: number) {
    const existing = await prisma.catalogs.findFirst({
      where: { category, name }
    })

    if (!existing) {
      await prisma.catalogs.create({
        data: { category, name, description, parent_id }
      })
      catalogsCreated++
      console.log(`  ✓ Criado: ${category} - ${name}`)
    }
  }

  // Espécies
  console.log('\n📚 Verificando espécies...')
  await createCatalogIfNotExists('species', 'Cão', 'Cachorro doméstico')
  await createCatalogIfNotExists('species', 'Gato', 'Gato doméstico')

  // Buscar IDs das espécies
  const dogSpecies = await prisma.catalogs.findFirst({ where: { category: 'species', name: 'Cão' } })
  const catSpecies = await prisma.catalogs.findFirst({ where: { category: 'species', name: 'Gato' } })

  // Raças de Cães
  console.log('\n🐕 Verificando raças de cães...')
  const dogBreeds = [
    'SRD (Sem Raça Definida)',
    'Labrador',
    'Golden Retriever',
    'Bulldog',
    'Poodle',
    'Pastor Alemão',
    'Beagle',
    'Rottweiler',
    'Yorkshire',
    'Boxer',
    'Dachshund (Salsicha)',
    'Shih Tzu',
    'Pug',
    'Chihuahua',
    'Husky Siberiano',
  ]

  for (const breed of dogBreeds) {
    await createCatalogIfNotExists('breed_dog', breed, undefined, dogSpecies?.id)
  }

  // Raças de Gatos
  console.log('\n🐱 Verificando raças de gatos...')
  const catBreeds = [
    'SRD (Sem Raça Definida)',
    'Persa',
    'Siamês',
    'Maine Coon',
    'Bengal',
    'Sphynx',
    'Ragdoll',
    'British Shorthair',
    'Scottish Fold',
    'Abissínio',
  ]

  for (const breed of catBreeds) {
    await createCatalogIfNotExists('breed_cat', breed, undefined, catSpecies?.id)
  }

  // Tamanhos
  console.log('\n📏 Verificando tamanhos...')
  const sizes = ['Pequeno', 'Médio', 'Grande', 'Gigante']
  for (const size of sizes) {
    await createCatalogIfNotExists('size', size)
  }

  // Status dos animais
  console.log('\n📊 Verificando status de animais...')
  const animalStatuses = [
    { name: 'Abrigado', description: 'Animal está abrigado' },
    { name: 'Disponível', description: 'Animal disponível para adoção' },
    { name: 'Adotado', description: 'Animal foi adotado' },
    { name: 'Desaparecido', description: 'Animal desaparecido' },
    { name: 'Internado', description: 'Animal internado para tratamento médico' },
    { name: 'Falecido', description: 'Animal falecido' },
  ]

  for (const status of animalStatuses) {
    await createCatalogIfNotExists('status', status.name, status.description)
  }

  console.log(`\n✅ Seed de catálogos concluído!`)
  console.log(`   - ${catalogsCreated} novos catálogos criados`)

  // Mostrar totais
  const totalCatalogs = await prisma.catalogs.count()
  const totalAnimals = await prisma.animals.count()
  const totalShelters = await prisma.shelters.count()

  console.log(`\n📊 Totais no banco:`)
  console.log(`   - ${totalCatalogs} catálogos`)
  console.log(`   - ${totalAnimals} animais`)
  console.log(`   - ${totalShelters} abrigos`)
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
