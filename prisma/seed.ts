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

  // Sexo dos animais
  const sexes = ['Macho', 'Fêmea', 'Indefinido']
  for (const sex of sexes) {
    await prisma.catalogs.create({
      data: {
        category: 'sex',
        name: sex,
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

  console.log(`✅ Criados ${dogBreeds.length + catBreeds.length + sizes.length + sexes.length + animalStatuses.length + 2} itens de catálogo (${dogBreeds.length} raças de cães, ${catBreeds.length} raças de gatos, ${sizes.length} tamanhos, ${sexes.length} sexos, ${animalStatuses.length} status, 2 espécies)`)

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

  // Buscar status e sexos do catálogo
  const statusAbrigado = await prisma.catalogs.findFirst({
    where: { category: 'status', name: 'Abrigado' },
  })

  const sexMacho = await prisma.catalogs.findFirst({
    where: { category: 'sex', name: 'Macho' },
  })

  const sexFemea = await prisma.catalogs.findFirst({
    where: { category: 'sex', name: 'Fêmea' },
  })

  const animal1 = await prisma.animals.create({
    data: {
      name: 'Rex',
      description: 'Cachorro dócil e brincalhão, ótimo com crianças',
      shelter_id: shelter1.id,
      species_id: dogSpecies.id,
      breed_id: (await prisma.catalogs.findFirst({ where: { name: 'Labrador' } }))?.id,
      sex_id: sexMacho?.id,
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
      sex_id: sexFemea?.id,
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
      sex_id: sexMacho?.id,
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

  // 7. Criar registros de peso
  console.log('⚖️  Criando registros de peso...')

  // Rex - 3 registros de peso (evolução de 28kg para 30kg)
  await prisma.animal_weights.createMany({
    data: [
      {
        animal_id: animal1.id,
        value: 28.5,
        unit: 'kg',
        recorded_by: shelterManager.id,
        date_time: new Date('2024-09-01'),
        notes: 'Peso na entrada',
      },
      {
        animal_id: animal1.id,
        value: 29.2,
        unit: 'kg',
        recorded_by: shelterManager.id,
        date_time: new Date('2024-10-15'),
        notes: 'Ganho de peso saudável',
      },
      {
        animal_id: animal1.id,
        value: 30.0,
        unit: 'kg',
        recorded_by: shelterManager.id,
        date_time: new Date('2024-11-15'),
        notes: 'Peso ideal atingido',
      },
    ],
  })

  // Luna - 2 registros de peso
  await prisma.animal_weights.createMany({
    data: [
      {
        animal_id: animal2.id,
        value: 3.2,
        unit: 'kg',
        recorded_by: shelterManager.id,
        date_time: new Date('2024-08-20'),
        notes: 'Peso na entrada',
      },
      {
        animal_id: animal2.id,
        value: 3.5,
        unit: 'kg',
        recorded_by: shelterManager.id,
        date_time: new Date('2024-11-01'),
        notes: 'Peso estável e saudável',
      },
    ],
  })

  // Toby - 2 registros de peso
  await prisma.animal_weights.createMany({
    data: [
      {
        animal_id: animal3.id,
        value: 11.0,
        unit: 'kg',
        recorded_by: shelterManager.id,
        date_time: new Date('2024-10-10'),
        notes: 'Peso na entrada',
      },
      {
        animal_id: animal3.id,
        value: 11.8,
        unit: 'kg',
        recorded_by: shelterManager.id,
        date_time: new Date('2024-11-18'),
        notes: 'Crescimento normal',
      },
    ],
  })

  console.log(`✅ Criados ${7} registros de peso`)

  // 8. Criar registros médicos (vacinas, vermifugação, exames)
  console.log('💉 Criando registros médicos...')

  // Rex - Vacinação completa
  await prisma.animal_medical_records.create({
    data: {
      animal_id: animal1.id,
      record_type: 'vaccination',
      description: 'Vacina V10',
      veterinarian: 'Dr. Carlos Silva',
      record_date: new Date('2024-09-05'),
      next_due_date: new Date('2025-09-05'),
      clinic_id: clinic1.id,
      created_by: shelterManager.id,
      details: {
        vaccine_name: 'V10',
        batch: 'ABC123',
        manufacturer: 'Zoetis',
      },
    },
  })

  await prisma.animal_medical_records.create({
    data: {
      animal_id: animal1.id,
      record_type: 'vaccination',
      description: 'Vacina Antirrábica',
      veterinarian: 'Dr. Carlos Silva',
      record_date: new Date('2024-09-05'),
      next_due_date: new Date('2025-09-05'),
      clinic_id: clinic1.id,
      created_by: shelterManager.id,
      details: {
        vaccine_name: 'Antirrábica',
        batch: 'RAB456',
        manufacturer: 'Zoetis',
      },
    },
  })

  await prisma.animal_medical_records.create({
    data: {
      animal_id: animal1.id,
      record_type: 'deworming',
      description: 'Vermifugação',
      veterinarian: 'Dr. Carlos Silva',
      record_date: new Date('2024-09-10'),
      next_due_date: new Date('2025-03-10'),
      clinic_id: clinic1.id,
      created_by: shelterManager.id,
      details: {
        medication: 'Drontal Plus',
        dosage: '1 comprimido',
      },
    },
  })

  // Luna - Vacinação
  await prisma.animal_medical_records.create({
    data: {
      animal_id: animal2.id,
      record_type: 'vaccination',
      description: 'Vacina V4',
      veterinarian: 'Dra. Ana Paula',
      record_date: new Date('2024-08-25'),
      next_due_date: new Date('2025-08-25'),
      clinic_id: clinic2.id,
      created_by: shelterManager.id,
      details: {
        vaccine_name: 'V4 Felina',
        batch: 'FEL789',
        manufacturer: 'Biovet',
      },
    },
  })

  await prisma.animal_medical_records.create({
    data: {
      animal_id: animal2.id,
      record_type: 'vaccination',
      description: 'Vacina Antirrábica',
      veterinarian: 'Dra. Ana Paula',
      record_date: new Date('2024-08-25'),
      next_due_date: new Date('2025-08-25'),
      clinic_id: clinic2.id,
      created_by: shelterManager.id,
      details: {
        vaccine_name: 'Antirrábica',
        batch: 'RAB789',
        manufacturer: 'Biovet',
      },
    },
  })

  // Toby - Consulta e exame
  await prisma.animal_medical_records.create({
    data: {
      animal_id: animal3.id,
      record_type: 'consultation',
      description: 'Consulta de rotina',
      veterinarian: 'Dr. Carlos Silva',
      record_date: new Date('2024-10-12'),
      clinic_id: clinic1.id,
      created_by: shelterManager.id,
      details: {
        diagnosis: 'Animal saudável',
        observations: 'Energia alta, socialização excelente',
        recommendations: 'Manter dieta balanceada e exercícios diários',
      },
    },
  })

  await prisma.animal_medical_records.create({
    data: {
      animal_id: animal3.id,
      record_type: 'exam',
      description: 'Exame de sangue completo',
      veterinarian: 'Dr. Carlos Silva',
      record_date: new Date('2024-10-12'),
      clinic_id: clinic1.id,
      created_by: shelterManager.id,
      details: {
        exam_type: 'Hemograma completo',
        results: 'Todos os valores dentro da normalidade',
      },
    },
  })

  console.log(`✅ Criados ${8} registros médicos`)

  // 9. Criar medicamentos
  console.log('💊 Criando medicamentos...')

  const medicamento1 = await prisma.medications.create({
    data: {
      name: 'Amoxicilina 500mg',
      shelter_id: shelter1.id,
      is_active: true,
    },
  })

  const medicamento2 = await prisma.medications.create({
    data: {
      name: 'Carprofeno 75mg',
      shelter_id: shelter1.id,
      is_active: true,
    },
  })

  const medicamento3 = await prisma.medications.create({
    data: {
      name: 'Prednisolona 5mg',
      shelter_id: shelter1.id,
      is_active: true,
    },
  })

  console.log(`✅ Criados ${3} medicamentos`)

  // 10. Criar prescrições e tarefas de medicação
  console.log('📋 Criando prescrições...')

  // Rex - Tratamento preventivo (já completado)
  const prescricaoRex = await prisma.prescriptions.create({
    data: {
      animal_id: animal1.id,
      medication_id: medicamento1.id,
      dosage: '500mg',
      route: 'Oral',
      interval_hours: 12,
      start_date: new Date('2024-09-15'),
      start_time: new Date('2024-09-15T08:00:00'),
      duration_days: 7,
      is_continuous: false,
      is_completed: true,
      description: 'Tratamento preventivo pós-castração',
      prescribed_by: shelterManager.id,
    },
  })

  // Criar tarefas para a prescrição do Rex (todas completas)
  const tarefasRex = []
  for (let i = 0; i < 7; i++) {
    const data = new Date('2024-09-15')
    data.setDate(data.getDate() + i)

    // Manhã
    tarefasRex.push({
      prescription_id: prescricaoRex.id,
      scheduled_date: data,
      scheduled_time: new Date('2024-01-01T08:00:00'),
      administered_at: new Date(data.getTime() + 8 * 60 * 60 * 1000),
      administered_by: shelterManager.id,
      is_completed: true,
      notes: i === 0 ? 'Primeira dose' : undefined,
    })

    // Noite
    tarefasRex.push({
      prescription_id: prescricaoRex.id,
      scheduled_date: data,
      scheduled_time: new Date('2024-01-01T20:00:00'),
      administered_at: new Date(data.getTime() + 20 * 60 * 60 * 1000),
      administered_by: shelterManager.id,
      is_completed: true,
      notes: i === 6 ? 'Última dose - tratamento concluído' : undefined,
    })
  }

  await prisma.prescription_tasks.createMany({
    data: tarefasRex,
  })

  // Luna - Tratamento em andamento
  const prescricaoLuna = await prisma.prescriptions.create({
    data: {
      animal_id: animal2.id,
      medication_id: medicamento2.id,
      dosage: '75mg',
      route: 'Oral',
      interval_hours: 24,
      start_date: new Date('2024-11-10'),
      start_time: new Date('2024-11-10T09:00:00'),
      duration_days: 10,
      is_continuous: false,
      is_completed: false,
      description: 'Anti-inflamatório para leve claudicação',
      prescribed_by: shelterManager.id,
    },
  })

  // Criar tarefas para Luna (algumas completas, algumas pendentes)
  const tarefasLuna = []
  const hoje = new Date()
  for (let i = 0; i < 10; i++) {
    const data = new Date('2024-11-10')
    data.setDate(data.getDate() + i)

    const isPassado = data < hoje
    const isHoje = data.toDateString() === hoje.toDateString()

    tarefasLuna.push({
      prescription_id: prescricaoLuna.id,
      scheduled_date: data,
      scheduled_time: new Date('2024-01-01T09:00:00'),
      administered_at: isPassado ? new Date(data.getTime() + 9 * 60 * 60 * 1000) : null,
      administered_by: isPassado ? shelterManager.id : null,
      is_completed: isPassado,
      notes: i === 0 ? 'Início do tratamento' : isHoje ? 'Dose de hoje - pendente' : undefined,
    })
  }

  await prisma.prescription_tasks.createMany({
    data: tarefasLuna,
  })

  // Toby - Tratamento contínuo
  const prescricaoToby = await prisma.prescriptions.create({
    data: {
      animal_id: animal3.id,
      medication_id: medicamento3.id,
      dosage: '5mg',
      route: 'Oral',
      interval_hours: 24,
      start_date: new Date('2024-11-01'),
      start_time: new Date('2024-11-01T10:00:00'),
      duration_days: null,
      is_continuous: true,
      is_completed: false,
      description: 'Controle de alergia sazonal - uso contínuo',
      prescribed_by: shelterManager.id,
    },
  })

  // Criar tarefas para Toby (últimos 18 dias)
  const tarefasToby = []
  for (let i = 17; i >= 0; i--) {
    const data = new Date()
    data.setDate(data.getDate() - i)

    const isHoje = i === 0

    tarefasToby.push({
      prescription_id: prescricaoToby.id,
      scheduled_date: data,
      scheduled_time: new Date('2024-01-01T10:00:00'),
      administered_at: !isHoje ? new Date(data.getTime() + 10 * 60 * 60 * 1000) : null,
      administered_by: !isHoje ? shelterManager.id : null,
      is_completed: !isHoje,
      notes: i === 17 ? 'Início do tratamento contínuo' : isHoje ? 'Dose de hoje - pendente' : undefined,
    })
  }

  await prisma.prescription_tasks.createMany({
    data: tarefasToby,
  })

  console.log(`✅ Criadas ${3} prescrições com ${tarefasRex.length + tarefasLuna.length + tarefasToby.length} tarefas de medicação`)

  // 11. Criar eventos
  console.log('📅 Criando eventos...')

  // Helper function to get event type ID by key
  const getEventTypeId = async (key: string): Promise<number> => {
    const eventType = await prisma.catalogs.findFirst({
      where: {
        category: 'event_types',
        description: {
          contains: `"key":"${key}"`
        }
      }
    })
    if (!eventType) {
      throw new Error(`Event type not found: ${key}`)
    }
    return eventType.id
  }

  const entradaId = await getEventTypeId('entrada')
  const castracaoId = await getEventTypeId('castracao')
  const socializacaoId = await getEventTypeId('socializacao')
  const banhoTosaId = await getEventTypeId('banho_tosa')
  const adestramentoId = await getEventTypeId('adestramento')

  const eventos = [
    // Rex
    {
      animal_id: animal1.id,
      event_type_id: entradaId,
      description: 'Animal resgatado das ruas',
      triggered_by: shelterManager.id,
      created_at: new Date('2024-09-01'),
      details: {
        local: 'Bairro Centro',
        condicao: 'Bom estado geral, mas com sinais de abandono',
      },
    },
    {
      animal_id: animal1.id,
      event_type_id: castracaoId,
      description: 'Procedimento de castração realizado',
      triggered_by: shelterManager.id,
      created_at: new Date('2024-09-14'),
      details: {
        veterinario: 'Dr. Carlos Silva',
        clinica: 'Clínica Veterinária PetCare',
      },
    },
    {
      animal_id: animal1.id,
      event_type_id: socializacaoId,
      description: 'Sessão de socialização com outros cães',
      triggered_by: shelterManager.id,
      created_at: new Date('2024-10-05'),
      details: {
        comportamento: 'Excelente - muito sociável',
        duracao: '2 horas',
      },
    },
    // Luna
    {
      animal_id: animal2.id,
      event_type_id: entradaId,
      description: 'Doação de tutor anterior',
      triggered_by: shelterManager.id,
      created_at: new Date('2024-08-20'),
      details: {
        motivo: 'Mudança para apartamento que não aceita pets',
        documentacao: 'Completa com histórico médico',
      },
    },
    {
      animal_id: animal2.id,
      event_type_id: banhoTosaId,
      description: 'Banho e tosa higiênica',
      triggered_by: shelterManager.id,
      created_at: new Date('2024-09-15'),
      details: {
        tipo: 'Banho e tosa higiênica',
        observacoes: 'Pelagem em bom estado',
      },
    },
    // Toby
    {
      animal_id: animal3.id,
      event_type_id: entradaId,
      description: 'Resgate de animal perdido',
      triggered_by: shelterManager.id,
      created_at: new Date('2024-10-10'),
      details: {
        local: 'Parque Municipal',
        condicao: 'Saudável, usando coleira',
      },
    },
    {
      animal_id: animal3.id,
      event_type_id: adestramentoId,
      description: 'Sessão de adestramento básico',
      triggered_by: shelterManager.id,
      created_at: new Date('2024-11-01'),
      details: {
        comandos: 'Senta, fica, vem',
        progresso: 'Excelente aprendizado',
      },
    },
  ]

  await prisma.animal_events.createMany({
    data: eventos,
  })

  console.log(`✅ Criados ${eventos.length} eventos`)

  console.log('✅ Seed concluído com sucesso!')
  console.log('\n📊 Resumo:')
  console.log(`   - ${5} roles`)
  console.log(`   - ${dogBreeds.length + catBreeds.length + sizes.length + 3 + animalStatuses.length + 2} itens de catálogo (incluindo sexos)`)
  console.log(`   - ${3} usuários`)
  console.log(`   - ${2} abrigos`)
  console.log(`   - ${2} clínicas veterinárias`)
  console.log(`   - ${3} animais`)
  console.log(`   - ${7} registros de peso`)
  console.log(`   - ${8} registros médicos`)
  console.log(`   - ${3} medicamentos`)
  console.log(`   - ${3} prescrições com ${tarefasRex.length + tarefasLuna.length + tarefasToby.length} tarefas`)
  console.log(`   - ${eventos.length} eventos`)
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
