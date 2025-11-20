import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Global catalogs (shelter_id = null) - visible to all shelters
const globalCatalogs = {
  // Species
  species: [
    { name: 'Cão', description: 'Cachorro doméstico' },
    { name: 'Gato', description: 'Gato doméstico' },
  ],

  // Sex
  sex: [
    { name: 'Macho' },
    { name: 'Fêmea' },
    { name: 'Indefinido' },
  ],

  // Dog Breeds
  dogBreeds: [
    'Sem raça definida',
    'Akita',
    'American Bully',
    'American Pit Bull Terrier',
    'American Staffordshire Terrier',
    'Basset Hound',
    'Beagle',
    'Bichon Frisé',
    'Border Collie',
    'Boston Terrier',
    'Boxer',
    'Bull Terrier',
    'Bulldog Francês',
    'Bulldog Inglês',
    'Cane Corso',
    'Cavalier King Charles Spaniel',
    'Chihuahua',
    'Chow Chow',
    'Cocker Spaniel',
    'Dachshund',
    'Dálmata',
    'Dobermann',
    'Dogo Argentino',
    'Fila Brasileiro',
    'Fox Terrier',
    'Golden Retriever',
    'Greyhound',
    'Husky Siberiano',
    'Jack Russell Terrier',
    'Labrador Retriever',
    'Lhasa Apso',
    'Lulu da Pomerânia',
    'Maltês',
    'Mastiff',
    'Mastiff Inglês',
    'Pastor Alemão',
    'Pastor Australiano',
    'Pastor Belga',
    'Pastor de Shetland',
    'Pequinês',
    'Pinscher',
    'Pit Bull',
    'Pointer',
    'Poodle',
    'Pug',
    'Rottweiler',
    'Samoieda',
    'Schnauzer',
    'Setter Irlandês',
    'Shar-Pei',
    'Shiba Inu',
    'Shih Tzu',
    'Staffordshire Bull Terrier',
    'Teckel',
    'Terra Nova',
    'Weimaraner',
    'West Highland White Terrier',
    'Whippet',
    'Yorkshire Terrier',
  ],

  // Cat Breeds
  catBreeds: [
    'Sem raça',
    'Abissínio',
    'Angorá',
    'Azul Russo',
    'Bengal',
    'Birmanês',
    'Bombaim',
    'British Shorthair',
    'Burmês',
    'Chartreux',
    'Cornish Rex',
    'Devon Rex',
    'Exótico',
    'Himalaio',
    'Maine Coon',
    'Manx',
    'Munchkin',
    'Norueguês da Floresta',
    'Persa',
    'Ragdoll',
    'Savannah',
    'Scottish Fold',
    'Siamês',
    'Siberiano',
    'Singapura',
    'Somali',
    'Sphynx',
    'Tonquinês',
    'Van Turco',
  ],

  // Animal Status
  animalStatus: [
    { key: 'disponivel', name: 'Disponível', description: 'Animal disponível para adoção' },
    { key: 'adotado', name: 'Adotado', description: 'Animal foi adotado' },
    { key: 'desaparecido', name: 'Desaparecido', description: 'Animal desaparecido' },
    { key: 'internado', name: 'Internado', description: 'Animal internado para tratamento' },
    { key: 'falecido', name: 'Falecido', description: 'Animal falecido' },
  ],

  // Event Types
  eventTypes: [
    // Shelter
    { key: 'entrada', name: 'Entrada no Abrigo', icon: 'fa-hand-holding-heart', eventCategory: 'shelter' },
    { key: 'resgate', name: 'Resgate', icon: 'fa-hand-holding-heart', eventCategory: 'shelter' },
    { key: 'transferencia_entrada', name: 'Transferência (Entrada)', icon: 'fa-arrow-right-to-bracket', eventCategory: 'shelter' },
    { key: 'devolucao', name: 'Devolução', icon: 'fa-rotate-left', eventCategory: 'shelter' },
    { key: 'transferencia_saida', name: 'Transferência (Saída)', icon: 'fa-arrow-right-from-bracket', eventCategory: 'shelter' },
    { key: 'fuga', name: 'Fuga', icon: 'fa-door-open', eventCategory: 'shelter' },

    // Adoption
    { key: 'adocao', name: 'Adoção', icon: 'fa-heart-circle-check', eventCategory: 'adoption' },
    { key: 'pre_adocao', name: 'Pré-Adoção', icon: 'fa-heart', eventCategory: 'adoption' },
    { key: 'adocao_cancelada', name: 'Adoção Cancelada', icon: 'fa-heart-crack', eventCategory: 'adoption' },

    // Medical
    { key: 'obito', name: 'Óbito', icon: 'fa-cross', eventCategory: 'medical' },
    { key: 'vacinacao', name: 'Vacinação', icon: 'fa-syringe', eventCategory: 'medical' },
    { key: 'vermifugacao', name: 'Vermifugação', icon: 'fa-pills', eventCategory: 'medical' },
    { key: 'castracao', name: 'Castração', icon: 'fa-scissors', eventCategory: 'medical' },
    { key: 'cirurgia', name: 'Cirurgia', icon: 'fa-user-doctor', eventCategory: 'medical' },
    { key: 'consulta', name: 'Consulta Veterinária', icon: 'fa-stethoscope', eventCategory: 'medical' },
    { key: 'exame', name: 'Exame', icon: 'fa-microscope', eventCategory: 'medical' },
    { key: 'tratamento', name: 'Tratamento', icon: 'fa-briefcase-medical', eventCategory: 'medical' },
    { key: 'medicacao', name: 'Medicação', icon: 'fa-pills', eventCategory: 'medical' },
    { key: 'internacao', name: 'Internação', icon: 'fa-bed-pulse', eventCategory: 'medical' },
    { key: 'alta_medica', name: 'Alta Médica', icon: 'fa-circle-check', eventCategory: 'medical' },

    // Care
    { key: 'banho_tosa', name: 'Banho e Tosa', icon: 'fa-shower', eventCategory: 'care' },
    { key: 'socializacao', name: 'Socialização', icon: 'fa-users', eventCategory: 'care' },
    { key: 'adestramento', name: 'Adestramento', icon: 'fa-graduation-cap', eventCategory: 'care' },
    { key: 'passeio', name: 'Passeio', icon: 'fa-person-walking-with-cane', eventCategory: 'care' },
    { key: 'enriquecimento', name: 'Enriquecimento Ambiental', icon: 'fa-puzzle-piece', eventCategory: 'care' },

    // Monitoring
    { key: 'pesagem', name: 'Pesagem', icon: 'fa-weight-scale', eventCategory: 'monitoring' },
    { key: 'avaliacao_comportamental', name: 'Avaliação Comportamental', icon: 'fa-clipboard-check', eventCategory: 'monitoring' },
    { key: 'avaliacao_saude', name: 'Avaliação de Saúde', icon: 'fa-heart-pulse', eventCategory: 'monitoring' },

    // Documentation
    { key: 'foto', name: 'Registro Fotográfico', icon: 'fa-camera', eventCategory: 'documentation' },
    { key: 'video', name: 'Registro em Vídeo', icon: 'fa-video', eventCategory: 'documentation' },
    { key: 'documento', name: 'Documentação', icon: 'fa-file-lines', eventCategory: 'documentation' },

    // Other
    { key: 'observacao', name: 'Observação', icon: 'fa-eye', eventCategory: 'other' },
    { key: 'incidente', name: 'Incidente', icon: 'fa-triangle-exclamation', eventCategory: 'other' },
    { key: 'outro', name: 'Outro', icon: 'fa-circle-check', eventCategory: 'other' },
  ],
}

async function seedCatalogs() {
  try {
    console.log('🌱 Starting catalog seeding...\n')

    // 1. Seed Species
    console.log('📦 Seeding species...')
    const speciesMap: Record<string, number> = {}
    for (const species of globalCatalogs.species) {
      const existing = await prisma.catalogs.findFirst({
        where: {
          category: 'species',
          name: species.name,
          shelter_id: null,
        },
      })

      if (existing) {
        console.log(`  ✓ Species "${species.name}" already exists`)
        speciesMap[species.name] = existing.id
      } else {
        const created = await prisma.catalogs.create({
          data: {
            category: 'species',
            name: species.name,
            description: species.description,
            shelter_id: null,
          },
        })
        console.log(`  ✓ Created species: ${species.name}`)
        speciesMap[species.name] = created.id
      }
    }

    // 2. Seed Dog Breeds
    console.log('\n🐕 Seeding dog breeds...')
    for (const breedName of globalCatalogs.dogBreeds) {
      const existing = await prisma.catalogs.findFirst({
        where: {
          category: 'breed',
          name: breedName,
          parent_id: speciesMap['Cão'],
          shelter_id: null,
        },
      })

      if (!existing) {
        await prisma.catalogs.create({
          data: {
            category: 'breed',
            name: breedName,
            parent_id: speciesMap['Cão'],
            shelter_id: null,
          },
        })
        console.log(`  ✓ Created dog breed: ${breedName}`)
      }
    }

    // 3. Seed Cat Breeds
    console.log('\n🐱 Seeding cat breeds...')
    for (const breedName of globalCatalogs.catBreeds) {
      const existing = await prisma.catalogs.findFirst({
        where: {
          category: 'breed',
          name: breedName,
          parent_id: speciesMap['Gato'],
          shelter_id: null,
        },
      })

      if (!existing) {
        await prisma.catalogs.create({
          data: {
            category: 'breed',
            name: breedName,
            parent_id: speciesMap['Gato'],
            shelter_id: null,
          },
        })
        console.log(`  ✓ Created cat breed: ${breedName}`)
      }
    }

    // 4. Seed Sex
    console.log('\n⚧️ Seeding sex options...')
    for (const sex of globalCatalogs.sex) {
      const existing = await prisma.catalogs.findFirst({
        where: {
          category: 'sex',
          name: sex.name,
          shelter_id: null,
        },
      })

      if (!existing) {
        await prisma.catalogs.create({
          data: {
            category: 'sex',
            name: sex.name,
            shelter_id: null,
          },
        })
        console.log(`  ✓ Created sex: ${sex.name}`)
      }
    }

    // 5. Seed Animal Status
    console.log('\n📊 Seeding animal statuses...')
    for (const status of globalCatalogs.animalStatus) {
      const existing = await prisma.catalogs.findFirst({
        where: {
          category: 'animal_status',
          name: status.name,
          shelter_id: null,
        },
      })

      if (!existing) {
        await prisma.catalogs.create({
          data: {
            category: 'animal_status',
            name: status.name,
            description: JSON.stringify({
              key: status.key,
              description: status.description,
            }),
            shelter_id: null,
          },
        })
        console.log(`  ✓ Created animal status: ${status.name}`)
      }
    }

    // 6. Seed Event Types
    console.log('\n📅 Seeding event types...')
    for (const eventType of globalCatalogs.eventTypes) {
      const existing = await prisma.catalogs.findFirst({
        where: {
          category: 'event_types',
          name: eventType.name,
          shelter_id: null,
        },
      })

      if (!existing) {
        await prisma.catalogs.create({
          data: {
            category: 'event_types',
            name: eventType.name,
            description: JSON.stringify({
              key: eventType.key,
              icon: eventType.icon,
              eventCategory: eventType.eventCategory,
            }),
            shelter_id: null,
          },
        })
        console.log(`  ✓ Created event type: ${eventType.name}`)
      }
    }

    console.log('\n✅ Catalog seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding catalogs:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  seedCatalogs()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedCatalogs }
