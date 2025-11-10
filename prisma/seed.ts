import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpar dados existentes (apenas em desenvolvimento)
  console.log('🗑️  Limpando dados existentes...')
  await prisma.favorite.deleteMany()
  await prisma.animalEvent.deleteMany()
  await prisma.animalMedicalRecord.deleteMany()
  await prisma.animalWeight.deleteMany()
  await prisma.document.deleteMany()
  await prisma.animalPhoto.deleteMany()
  await prisma.adoptionEvent.deleteMany()
  await prisma.report.deleteMany()
  await prisma.animal.deleteMany()
  await prisma.shelter.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  await prisma.catalog.deleteMany()

  // 1. Criar Roles (Papéis de usuários)
  console.log('👥 Criando roles...')
  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      description: 'Administrador do sistema',
      permissions: {
        all: true,
        manage_users: true,
        manage_shelters: true,
        manage_animals: true,
        manage_adoptions: true,
      },
    },
  })

  const shelterManagerRole = await prisma.role.create({
    data: {
      name: 'shelter_manager',
      description: 'Gerente de abrigo',
      permissions: {
        manage_shelter: true,
        manage_animals: true,
        approve_adoptions: true,
        view_reports: true,
      },
    },
  })

  const veterinarianRole = await prisma.role.create({
    data: {
      name: 'veterinarian',
      description: 'Veterinário',
      permissions: {
        view_animals: true,
        manage_medical_records: true,
        add_documents: true,
      },
    },
  })

  const adopterRole = await prisma.role.create({
    data: {
      name: 'adopter',
      description: 'Adotante',
      permissions: {
        view_animals: true,
        request_adoption: true,
        add_favorites: true,
      },
    },
  })

  const volunteerRole = await prisma.role.create({
    data: {
      name: 'volunteer',
      description: 'Voluntário',
      permissions: {
        view_animals: true,
        help_shelter: true,
      },
    },
  })

  console.log(`✅ Criadas ${5} roles`)

  // 2. Criar Catálogos (Espécies, Raças, Tamanhos)
  console.log('📚 Criando catálogos...')

  // Espécies
  const dogSpecies = await prisma.catalog.create({
    data: {
      category: 'species',
      name: 'Cão',
      description: 'Cachorro doméstico',
    },
  })

  const catSpecies = await prisma.catalog.create({
    data: {
      category: 'species',
      name: 'Gato',
      description: 'Gato doméstico',
    },
  })

  // Raças de Cães
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
    await prisma.catalog.create({
      data: {
        category: 'breed_dog',
        name: breed,
      },
    })
  }

  // Raças de Gatos
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
    await prisma.catalog.create({
      data: {
        category: 'breed_cat',
        name: breed,
      },
    })
  }

  // Tamanhos
  const sizes = ['Pequeno', 'Médio', 'Grande', 'Gigante']
  for (const size of sizes) {
    await prisma.catalog.create({
      data: {
        category: 'size',
        name: size,
      },
    })
  }

  // Status dos animais
  const animalStatuses = [
    { name: 'Abrigado', description: 'Animal está abrigado' },
    { name: 'Disponível', description: 'Animal disponível para adoção' },
    { name: 'Adotado', description: 'Animal foi adotado' },
    { name: 'Desaparecido', description: 'Animal desaparecido' },
    { name: 'Internado', description: 'Animal internado para tratamento médico' },
    { name: 'Falecido', description: 'Animal falecido' },
  ]

  for (const status of animalStatuses) {
    await prisma.catalog.create({
      data: {
        category: 'animal_status',
        name: status.name,
        description: status.description,
      },
    })
  }

  console.log(`✅ Criados ${dogBreeds.length + catBreeds.length + sizes.length + animalStatuses.length + 2} itens de catálogo`)

  // 3. Criar usuários de exemplo
  console.log('👤 Criando usuários de exemplo...')

  // Senha padrão para todos: "senha123"
  const defaultPassword = await bcrypt.hash('senha123', 10)

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Kaniu',
      email: 'admin@kaniu.com',
      password: defaultPassword,
      phone: '(11) 99999-0001',
      roleId: adminRole.id,
      address: {
        street: 'Rua Principal',
        number: '100',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
      },
    },
  })

  const shelterManager = await prisma.user.create({
    data: {
      name: 'João Silva',
      email: 'joao@abrigo.com',
      password: defaultPassword,
      phone: '(11) 99999-0002',
      roleId: shelterManagerRole.id,
      address: {
        street: 'Av. dos Animais',
        number: '500',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '02000-000',
      },
    },
  })

  const adopter = await prisma.user.create({
    data: {
      name: 'Maria Santos',
      email: 'maria@email.com',
      password: defaultPassword,
      phone: '(11) 99999-0003',
      roleId: adopterRole.id,
      address: {
        street: 'Rua das Flores',
        number: '250',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '03000-000',
      },
    },
  })

  console.log(`✅ Criados ${3} usuários`)

  // 4. Criar abrigos de exemplo
  console.log('🏠 Criando abrigos...')

  const shelter1 = await prisma.shelter.create({
    data: {
      name: 'Abrigo Amigos dos Animais',
      description: 'Abrigo dedicado ao resgate e cuidado de animais abandonados',
      ownerId: shelterManager.id,
      phone: '(11) 3333-4444',
      email: 'contato@amigosanimais.org',
      website: 'https://amigosanimais.org',
      location: {
        address: 'Av. dos Animais, 500',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '02000-000',
        lat: -23.5505,
        lng: -46.6333,
      },
    },
  })

  const shelter2 = await prisma.shelter.create({
    data: {
      name: 'Refúgio Pet Feliz',
      description: 'Espaço acolhedor para pets que precisam de um lar',
      ownerId: shelterManager.id,
      phone: '(11) 5555-6666',
      email: 'contato@petfeliz.org',
      location: {
        address: 'Rua dos Bichos, 300',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04000-000',
        lat: -23.5629,
        lng: -46.6544,
      },
    },
  })

  console.log(`✅ Criados ${2} abrigos`)

  // 5. Criar animais de exemplo
  console.log('🐕 Criando animais...')

  // Buscar status do catálogo
  const statusAbrigado = await prisma.catalog.findFirst({
    where: { category: 'animal_status', name: 'Abrigado' },
  })

  const animal1 = await prisma.animal.create({
    data: {
      name: 'Rex',
      description: 'Cachorro dócil e brincalhão, ótimo com crianças',
      shelterId: shelter1.id,
      speciesId: dogSpecies.id,
      breedId: (await prisma.catalog.findFirst({ where: { name: 'Labrador' } }))?.id,
      gender: 'male',
      size: 'Grande',
      birthDate: new Date('2020-05-15'),
      statusId: statusAbrigado?.id,
      castrated: true,
      healthStatus: {
        vaccinated: true,
        dewormed: true,
        healthConditions: [],
      },
      behavior: {
        goodWithKids: true,
        goodWithDogs: true,
        goodWithCats: false,
        energyLevel: 'high',
      },
      appearance: {
        color: ['Amarelo', 'Dourado'],
        furLength: 'short',
      },
      createdBy: shelterManager.id,
      updatedBy: shelterManager.id,
    },
  })

  const animal2 = await prisma.animal.create({
    data: {
      name: 'Luna',
      description: 'Gatinha carinhosa e tranquila, perfeita para apartamento',
      shelterId: shelter1.id,
      speciesId: catSpecies.id,
      breedId: (await prisma.catalog.findFirst({ where: { name: 'Siamês' } }))?.id,
      gender: 'female',
      size: 'Pequeno',
      birthDate: new Date('2021-08-20'),
      statusId: statusAbrigado?.id,
      castrated: true,
      healthStatus: {
        vaccinated: true,
        dewormed: true,
        healthConditions: [],
      },
      behavior: {
        goodWithKids: true,
        goodWithDogs: false,
        goodWithCats: true,
        energyLevel: 'low',
      },
      appearance: {
        color: ['Branco', 'Creme'],
        furLength: 'short',
      },
      createdBy: shelterManager.id,
      updatedBy: shelterManager.id,
    },
  })

  const animal3 = await prisma.animal.create({
    data: {
      name: 'Toby',
      description: 'Cachorro pequeno e alegre, cheio de energia',
      shelterId: shelter2.id,
      speciesId: dogSpecies.id,
      breedId: (await prisma.catalog.findFirst({ where: { name: 'Beagle' } }))?.id,
      gender: 'male',
      size: 'Médio',
      birthDate: new Date('2022-03-10'),
      statusId: statusAbrigado?.id,
      castrated: false,
      healthStatus: {
        vaccinated: true,
        dewormed: true,
        healthConditions: [],
      },
      behavior: {
        goodWithKids: true,
        goodWithDogs: true,
        goodWithCats: true,
        energyLevel: 'high',
      },
      appearance: {
        color: ['Tricolor'],
        furLength: 'short',
      },
      createdBy: shelterManager.id,
      updatedBy: shelterManager.id,
    },
  })

  console.log(`✅ Criados ${3} animais`)

  console.log('✅ Seed concluído com sucesso!')
  console.log('\n📊 Resumo:')
  console.log(`   - ${5} roles`)
  console.log(`   - ${dogBreeds.length + catBreeds.length + sizes.length + 2} itens de catálogo`)
  console.log(`   - ${3} usuários`)
  console.log(`   - ${2} abrigos`)
  console.log(`   - ${3} animais`)
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
