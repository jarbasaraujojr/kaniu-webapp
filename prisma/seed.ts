import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpar dados existentes (apenas em desenvolvimento)
  console.log('🗑️  Limpando dados existentes...')
  await prisma.favorites.deleteMany()
  await prisma.animal_events.deleteMany()
  await prisma.animal_medical_records.deleteMany()
  await prisma.animal_weights.deleteMany()
  await prisma.documents.deleteMany()
  await prisma.animal_photos.deleteMany()
  await prisma.adoption_events.deleteMany()
  await prisma.reports.deleteMany()
  await prisma.animals.deleteMany()
  await prisma.shelters.deleteMany()
  await prisma.users.deleteMany()
  await prisma.roles.deleteMany()
  await prisma.catalogs.deleteMany()

  // 1. Criar Roles (Papéis de usuários)
  console.log('👥 Criando roles...')
  const adminRole = await prisma.roles.create({
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

  const shelterManagerRole = await prisma.roles.create({
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

  const veterinarianRole = await prisma.roles.create({
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

  const adopterRole = await prisma.roles.create({
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

  const volunteerRole = await prisma.roles.create({
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
  const dogSpecies = await prisma.catalogs.create({
    data: {
      category: 'species',
      name: 'Cão',
      description: 'Cachorro doméstico',
    },
  })

  const catSpecies = await prisma.catalogs.create({
    data: {
      category: 'species',
      name: 'Gato',
      description: 'Gato doméstico',
    },
  })

  // Raças de Cães (usando parent_id para referenciar a espécie)
  const dogBreeds = [
    'SRD (Cão)',
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
    await prisma.catalogs.create({
      data: {
        category: 'breed',
        name: breed,
        parent_id: dogSpecies.id,
      },
    })
  }

  // Raças de Gatos (usando parent_id para referenciar a espécie)
  const catBreeds = [
    'SRD (Gato)',
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
    await prisma.catalogs.create({
      data: {
        category: 'breed',
        name: breed,
        parent_id: catSpecies.id,
      },
    })
  }

  // Tamanhos (com descrição de peso)
  const sizes = [
    { name: 'Mini', description: 'Até 5kg' },
    { name: 'Pequeno', description: 'Até 10kg' },
    { name: 'Médio', description: 'Até 15kg' },
    { name: 'Grande', description: 'Até 30kg' },
    { name: 'Gigante', description: 'Acima de 30kg' },
  ]

  for (const size of sizes) {
    await prisma.catalogs.create({
      data: {
        category: 'size',
        name: size.name,
        description: size.description,
      },
    })
  }

  // Status dos animais
  const animalStatuses = [
    { name: 'Abrigado', description: 'Animal está abrigado' },
    // NOTA: "Disponível" foi removido como status separado.
    // Agora, a disponibilidade para adoção é controlada pelo campo
    // "is_available_for_adoption" nos animais com status "Abrigado"
    { name: 'Adotado', description: 'Animal foi adotado' },
    { name: 'Desaparecido', description: 'Animal desaparecido' },
    { name: 'Internado', description: 'Animal internado para tratamento médico' },
    { name: 'Falecido', description: 'Animal falecido' },
  ]

  for (const status of animalStatuses) {
    await prisma.catalogs.create({
      data: {
        category: 'status',
        name: status.name,
        description: status.description,
      },
    })
  }

  console.log(`✅ Criados ${dogBreeds.length + catBreeds.length + sizes.length + animalStatuses.length + 2} itens de catálogo (${dogBreeds.length} raças de cães, ${catBreeds.length} raças de gatos, ${sizes.length} tamanhos, ${animalStatuses.length} status, 2 espécies)`)

  // 3. Criar usuários de exemplo
  console.log('👤 Criando usuários de exemplo...')

  // Senha padrão para todos: "senha123"
  const defaultPassword = await bcrypt.hash('senha123', 10)

  const adminUser = await prisma.users.create({
    data: {
      name: 'Admin Kaniu',
      email: 'admin@kaniu.com',
      password: defaultPassword,
      phone: '(11) 99999-0001',
      role_id: adminRole.id,
      address: {
        street: 'Rua Principal',
        number: '100',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
      },
    },
  })

  const shelterManager = await prisma.users.create({
    data: {
      name: 'João Silva',
      email: 'joao@abrigo.com',
      password: defaultPassword,
      phone: '(11) 99999-0002',
      role_id: shelterManagerRole.id,
      address: {
        street: 'Av. dos Animais',
        number: '500',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '02000-000',
      },
    },
  })

  const adopter = await prisma.users.create({
    data: {
      name: 'Maria Santos',
      email: 'maria@email.com',
      password: defaultPassword,
      phone: '(11) 99999-0003',
      role_id: adopterRole.id,
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

  const shelter1 = await prisma.shelters.create({
    data: {
      name: 'Abrigo Amigos dos Animais',
      description: 'Abrigo dedicado ao resgate e cuidado de animais abandonados',
      owner_id: shelterManager.id,
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

  const shelter2 = await prisma.shelters.create({
    data: {
      name: 'Refúgio Pet Feliz',
      description: 'Espaço acolhedor para pets que precisam de um lar',
      owner_id: shelterManager.id,
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

  // 5. Criar clínicas veterinárias de exemplo
  console.log('🏥 Criando clínicas veterinárias...')

  const clinic1 = await prisma.veterinary_clinics.create({
    data: {
      name: 'Clínica Veterinária PetCare',
      address: {
        street: 'Av. Paulista, 1500',
        number: '1500',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
      },
      phone: '(11) 3333-4444',
      email: 'contato@petcare.com.br',
      crmv: 'CRMV-SP 12345',
      description: 'Clínica veterinária com atendimento 24h, especializada em pequenos animais',
    },
  })

  const clinic2 = await prisma.veterinary_clinics.create({
    data: {
      name: 'Hospital Veterinário Animal Care',
      address: {
        street: 'Rua Augusta, 2500',
        number: '2500',
        neighborhood: 'Consolação',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01412-100',
      },
      phone: '(11) 5555-6666',
      email: 'hospital@animalcare.vet.br',
      crmv: 'CRMV-SP 67890',
      description: 'Hospital veterinário completo com centro cirúrgico e internação',
    },
  })

  console.log(`✅ Criadas ${2} clínicas veterinárias`)

  // 6. Criar animais de exemplo
  console.log('🐕 Criando animais...')

  // Buscar status do catálogo
  const statusAbrigado = await prisma.catalogs.findFirst({
    where: { category: 'status', name: 'Abrigado' },
  })

  const animal1 = await prisma.animals.create({
    data: {
      name: 'Rex',
      description: 'Cachorro dócil e brincalhão, ótimo com crianças',
      shelter_id: shelter1.id,
      species_id: dogSpecies.id,
      breed_id: (await prisma.catalogs.findFirst({ where: { name: 'Labrador' } }))?.id,
      gender: 'male',
      size: 'Grande',
      birth_date: new Date('2020-05-15'),
      status_id: statusAbrigado?.id,
      castrated: true,
      health_status: {
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
      created_by: shelterManager.id,
      updated_by: shelterManager.id,
    },
  })

  const animal2 = await prisma.animals.create({
    data: {
      name: 'Luna',
      description: 'Gatinha carinhosa e tranquila, perfeita para apartamento',
      shelter_id: shelter1.id,
      species_id: catSpecies.id,
      breed_id: (await prisma.catalogs.findFirst({ where: { name: 'Siamês' } }))?.id,
      gender: 'female',
      size: 'Pequeno',
      birth_date: new Date('2021-08-20'),
      status_id: statusAbrigado?.id,
      castrated: true,
      health_status: {
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
      created_by: shelterManager.id,
      updated_by: shelterManager.id,
    },
  })

  const animal3 = await prisma.animals.create({
    data: {
      name: 'Toby',
      description: 'Cachorro pequeno e alegre, cheio de energia',
      shelter_id: shelter2.id,
      species_id: dogSpecies.id,
      breed_id: (await prisma.catalogs.findFirst({ where: { name: 'Beagle' } }))?.id,
      gender: 'male',
      size: 'Médio',
      birth_date: new Date('2022-03-10'),
      status_id: statusAbrigado?.id,
      castrated: false,
      health_status: {
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
      created_by: shelterManager.id,
      updated_by: shelterManager.id,
    },
  })

  console.log(`✅ Criados ${3} animais`)

  console.log('✅ Seed concluído com sucesso!')
  console.log('\n📊 Resumo:')
  console.log(`   - ${5} roles`)
  console.log(`   - ${dogBreeds.length + catBreeds.length + sizes.length + animalStatuses.length + 2} itens de catálogo`)
  console.log(`   - ${3} usuários`)
  console.log(`   - ${2} abrigos`)
  console.log(`   - ${2} clínicas veterinárias`)
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
