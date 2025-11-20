import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

const eventTypes = [
  // Entrada e Resgate
  { key: 'entrada', name: 'Entrada no Abrigo', icon: 'fa-hand-holding-heart', eventCategory: 'shelter' },
  { key: 'resgate', name: 'Resgate', icon: 'fa-hand-holding-heart', eventCategory: 'shelter' },
  { key: 'transferencia_entrada', name: 'Transferência (Entrada)', icon: 'fa-arrow-right-to-bracket', eventCategory: 'shelter' },
  { key: 'devolucao', name: 'Devolução', icon: 'fa-rotate-left', eventCategory: 'shelter' },

  // Adoção
  { key: 'adocao', name: 'Adoção', icon: 'fa-heart-circle-check', eventCategory: 'adoption' },
  { key: 'pre_adocao', name: 'Pré-Adoção', icon: 'fa-heart', eventCategory: 'adoption' },
  { key: 'adocao_cancelada', name: 'Adoção Cancelada', icon: 'fa-heart-crack', eventCategory: 'adoption' },

  // Saída
  { key: 'transferencia_saida', name: 'Transferência (Saída)', icon: 'fa-arrow-right-from-bracket', eventCategory: 'shelter' },
  { key: 'obito', name: 'Óbito', icon: 'fa-cross', eventCategory: 'medical' },
  { key: 'fuga', name: 'Fuga', icon: 'fa-door-open', eventCategory: 'shelter' },

  // Saúde e Medicina
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

  // Cuidados e Bem-estar
  { key: 'banho_tosa', name: 'Banho e Tosa', icon: 'fa-shower', eventCategory: 'care' },
  { key: 'socializacao', name: 'Socialização', icon: 'fa-users', eventCategory: 'care' },
  { key: 'adestramento', name: 'Adestramento', icon: 'fa-graduation-cap', eventCategory: 'care' },
  { key: 'passeio', name: 'Passeio', icon: 'fa-person-walking-with-cane', eventCategory: 'care' },
  { key: 'enriquecimento', name: 'Enriquecimento Ambiental', icon: 'fa-puzzle-piece', eventCategory: 'care' },

  // Pesagem e Avaliação
  { key: 'pesagem', name: 'Pesagem', icon: 'fa-weight-scale', eventCategory: 'monitoring' },
  { key: 'avaliacao_comportamental', name: 'Avaliação Comportamental', icon: 'fa-clipboard-check', eventCategory: 'monitoring' },
  { key: 'avaliacao_saude', name: 'Avaliação de Saúde', icon: 'fa-heart-pulse', eventCategory: 'monitoring' },

  // Documentação
  { key: 'foto', name: 'Registro Fotográfico', icon: 'fa-camera', eventCategory: 'documentation' },
  { key: 'video', name: 'Registro em Vídeo', icon: 'fa-video', eventCategory: 'documentation' },
  { key: 'documento', name: 'Documentação', icon: 'fa-file-lines', eventCategory: 'documentation' },

  // Outros
  { key: 'observacao', name: 'Observação', icon: 'fa-eye', eventCategory: 'other' },
  { key: 'incidente', name: 'Incidente', icon: 'fa-triangle-exclamation', eventCategory: 'other' },
  { key: 'outro', name: 'Outro', icon: 'fa-circle-check', eventCategory: 'other' },
]

export async function POST() {
  try {
    const results = []

    for (const eventType of eventTypes) {
      // Check if already exists
      const existing = await prisma.catalogs.findFirst({
        where: {
          category: 'event_types',
          name: eventType.name
        }
      })

      if (existing) {
        results.push({
          status: 'skipped',
          name: eventType.name,
          message: 'Already exists'
        })
        continue
      }

      // Insert into catalogs
      const catalog = await prisma.catalogs.create({
        data: {
          category: 'event_types',
          name: eventType.name,
          description: JSON.stringify({
            key: eventType.key,
            icon: eventType.icon,
            eventCategory: eventType.eventCategory
          })
        }
      })

      results.push({
        status: 'created',
        name: eventType.name,
        key: eventType.key,
        id: catalog.id
      })
    }

    // Get count
    const count = await prisma.catalogs.count({
      where: { category: 'event_types' }
    })

    return NextResponse.json({
      success: true,
      message: 'Event types setup completed',
      results,
      totalEventTypes: count
    })
  } catch (error) {
    console.error('Error setting up event types:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup event types',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
