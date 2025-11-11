import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

const numberFormatter = new Intl.NumberFormat('pt-BR')
const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
})
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const relativeTimeFormatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

const MS_PER_DAY = 1000 * 60 * 60 * 24

const normalizeLabel = (value: string) =>
  value
    ? value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    : ''

const iconForEvent = (type: string) => {
  const normalized = normalizeLabel(type)
  if (normalized.includes('ado')) return 'fa-heart-circle-check'
  if (normalized.includes('peso')) return 'fa-weight-scale'
  if (normalized.includes('vacina') || normalized.includes('trat')) return 'fa-syringe'
  if (normalized.includes('saud') || normalized.includes('medic') || normalized.includes('exame')) {
    return 'fa-stethoscope'
  }
  if (normalized.includes('resgate') || normalized.includes('abrig')) return 'fa-hand-holding-heart'
  return 'fa-bell'
}

const hasToNumber = (value: unknown): value is { toNumber: () => number } =>
  typeof value === 'object' &&
  value !== null &&
  'toNumber' in value &&
  typeof (value as { toNumber?: unknown }).toNumber === 'function'

const toPlainNumber = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  if (hasToNumber(value)) return value.toNumber()
  const parsed = Number(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

const formatNumber = (value: number) => numberFormatter.format(value)
const formatPercent = (value: number) => percentFormatter.format(value)
const formatDecimal = (value: number) => decimalFormatter.format(value)
const formatDate = (date: Date) => dateFormatter.format(date)
const formatDateTime = (date: Date) => dateTimeFormatter.format(date)

const formatRelativeDay = (target: Date, base: Date) =>
  relativeTimeFormatter.format(
    Math.round((target.getTime() - base.getTime()) / MS_PER_DAY),
    'day',
  )

const describeDueDate = (target: Date, base: Date) => {
  const diffDays = Math.ceil((target.getTime() - base.getTime()) / MS_PER_DAY)

  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)} dia(s) em atraso`, variant: 'danger' as const }
  }
  if (diffDays === 0) {
    return { label: 'vence hoje', variant: 'warning' as const }
  }
  if (diffDays <= 3) {
    return { label: `em ${diffDays} dia(s)`, variant: 'warning' as const }
  }
  return { label: `em ${diffDays} dia(s)`, variant: '' as const }
}

const getStatusVariant = (status: string) => {
  const normalized = normalizeLabel(status)

  if (
    normalized.includes('cancel') ||
    normalized.includes('crit') ||
    normalized.includes('risco')
  ) {
    return 'danger'
  }

  if (
    normalized.includes('pend') ||
    normalized.includes('anal') ||
    normalized.includes('intern')
  ) {
    return 'warning'
  }

  if (
    normalized.includes('concl') ||
    normalized.includes('aprov') ||
    normalized.includes('adot') ||
    normalized.includes('liber')
  ) {
    return 'success'
  }

  return ''
}

export default async function PainelPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const userRole = session.user.role
  const userShelterId = session.user.shelterId

  const now = new Date()
  const twoWeeksAhead = new Date(now.getTime() + 14 * MS_PER_DAY)
  const last30Days = new Date(now.getTime() - 30 * MS_PER_DAY)
  const previous30Days = new Date(now.getTime() - 60 * MS_PER_DAY)

  // Buscar IDs dos status no catálogo
  const [statusAbrigado, statusAdotado, statusInternado] = await Promise.all([
    prisma.catalog.findFirst({ where: { category: 'animal_status', name: 'Abrigado' } }),
    prisma.catalog.findFirst({ where: { category: 'animal_status', name: 'Adotado' } }),
    prisma.catalog.findFirst({ where: { category: 'animal_status', name: 'Internado' } }),
  ])

  // Construir filtro baseado no role
  const animalFilter: any = { deletedAt: null }
  if (userRole === 'shelter_manager' && userShelterId) {
    animalFilter.shelterId = userShelterId
  }

  const statsPromise = Promise.all([
    prisma.animal.count({ where: animalFilter }),
    prisma.animal.count({ where: { ...animalFilter, statusId: statusAbrigado?.id } }),
    prisma.animal.count({ where: { ...animalFilter, statusId: statusAdotado?.id } }),
    prisma.animal.count({ where: { ...animalFilter, statusId: statusInternado?.id } }),
    userRole === 'shelter_manager' && userShelterId
      ? Promise.resolve(1) // Shelter manager vê apenas seu abrigo
      : prisma.shelter.count(),
  ])

  const adoptionFilter: any = {}
  if (userRole === 'shelter_manager' && userShelterId) {
    adoptionFilter.animal = { shelterId: userShelterId }
  }

  const adoptionCountsPromise = Promise.all([
    prisma.adoptionEvent.count({ where: { ...adoptionFilter, createdAt: { gte: last30Days } } }),
    prisma.adoptionEvent.count({
      where: {
        ...adoptionFilter,
        createdAt: {
          gte: previous30Days,
          lt: last30Days,
        },
      },
    }),
  ])

  const medicalRecordFilter: any = {
    nextDueDate: {
      not: null,
      lte: twoWeeksAhead,
    },
  }
  if (userRole === 'shelter_manager' && userShelterId) {
    medicalRecordFilter.animal = { shelterId: userShelterId }
  }

  const medicalFollowUpsPromise = prisma.animalMedicalRecord.findMany({
    where: medicalRecordFilter,
    include: {
      animal: {
        select: {
          id: true,
          name: true,
          shelter: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { nextDueDate: 'asc' },
    take: 6,
  })

  const internacoesPromise = prisma.animal.findMany({
    where: { ...animalFilter, statusId: statusInternado?.id },
    select: {
      id: true,
      name: true,
      breed: { select: { name: true } },
      shelter: { select: { name: true } },
      updatedAt: true,
      status: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 6,
  })

  const adoptionPipelinePromise = prisma.adoptionEvent.findMany({
    where: adoptionFilter,
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      animal: {
        select: {
          id: true,
          name: true,
          shelter: { select: { name: true } },
        },
      },
      adopter: {
        select: {
          name: true,
        },
      },
    },
  })

  const weightFilter: any = {}
  if (userRole === 'shelter_manager' && userShelterId) {
    weightFilter.animal = { shelterId: userShelterId }
  }

  const weightRecordsPromise = prisma.animalWeight.findMany({
    where: weightFilter,
    orderBy: { dateTime: 'desc' },
    take: 6,
    include: {
      animal: {
        select: {
          id: true,
          name: true,
          shelter: { select: { name: true } },
        },
      },
    },
  })

  const eventFilter: any = {}
  if (userRole === 'shelter_manager' && userShelterId) {
    eventFilter.animal = { shelterId: userShelterId }
  }

  const eventsPromise = prisma.animalEvent.findMany({
    where: eventFilter,
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: {
      animal: { select: { name: true } },
      triggeredByUser: { select: { name: true } },
    },
  })

  const [
    stats,
    adoptionCounts,
    medicalFollowUps,
    internacoes,
    adoptionPipeline,
    weightRecordsRaw,
    recentEvents,
  ] = await Promise.all([
    statsPromise,
    adoptionCountsPromise,
    medicalFollowUpsPromise,
    internacoesPromise,
    adoptionPipelinePromise,
    weightRecordsPromise,
    eventsPromise,
  ])

  const [totalAnimals, totalSheltered, totalAdopted, totalInternados, totalShelters] = stats
  const [adoptionsLast30Days, adoptionsPrev30Days] = adoptionCounts

  const adoptionTrend =
    adoptionsPrev30Days === 0
      ? adoptionsLast30Days > 0
        ? 100
        : 0
      : ((adoptionsLast30Days - adoptionsPrev30Days) / adoptionsPrev30Days) * 100

  const adoptionRate = totalAnimals === 0 ? 0 : (totalAdopted / totalAnimals) * 100

  const weightRecords = weightRecordsRaw.map((record) => ({
    id: record.id.toString(),
    animalName: record.animal.name,
    shelterName: record.animal.shelter?.name ?? 'Sem abrigo',
    value: toPlainNumber(record.value),
    unit: record.unit,
    dateTime: record.dateTime,
    notes: record.notes,
  }))

  const statCards: Array<{
    id: string
    label: string
    icon: string
    value: string
    detail: string
    trend?: number
  }> = [
    {
      id: 'animals',
      label: 'Animais cadastrados',
      icon: 'fa-paw',
      value: formatNumber(totalAnimals),
      detail: `${formatNumber(totalSheltered)} estão abrigados`,
    },
    {
      id: 'adoption-rate',
      label: 'Taxa de adoção',
      icon: 'fa-heart',
      value: `${formatPercent(adoptionRate)}%`,
      detail: `${formatNumber(adoptionsLast30Days)} adoções nos últimos 30 dias`,
      trend: Number.isFinite(adoptionTrend) ? adoptionTrend : 0,
    },
    {
      id: 'internados',
      label: 'Internações',
      icon: 'fa-kit-medical',
      value: formatNumber(totalInternados),
      detail: `${internacoes.length} casos recentes monitorados`,
    },
    {
      id: 'shelters',
      label: 'Abrigos monitorados',
      icon: 'fa-warehouse',
      value: formatNumber(totalShelters),
      detail: `Pendências médicas: ${formatNumber(medicalFollowUps.length)}`,
    },
  ]

  return (
    <DashboardLayout>
      <main className="main-container">
        <header className="header">
          <div className="header-content">
            <div className="header-actions">
              <span className="chip is-action">
                <i className="fa-solid fa-clock"></i>
                {` Atualizado em ${formatDateTime(now)}`}
              </span>
              <span className="chip">
                <i className="fa-solid fa-stethoscope"></i>
                {` ${medicalFollowUps.length} pendências de saúde`}
              </span>
            </div>
          </div>
        </header>

        <section className="stats-grid">
          {statCards.map((card) => (
            <article key={card.id} className="stat-card">
              <span className="stat-icon">
                <i className={`fa-solid ${card.icon}`}></i>
              </span>
              <div className="stat-info">
                <p className="stat-label">{card.label}</p>
                <p className="stat-value">{card.value}</p>
                <p className="stat-detail">{card.detail}</p>
              </div>
              {card.trend !== undefined ? (
                <div className={`stat-trend ${card.trend >= 0 ? 'trend-up' : 'trend-down'}`}>
                  <span>
                    {card.trend >= 0 ? '+' : ''}
                    {formatPercent(card.trend)}%
                  </span>
                  <span className="trend-label">vs. último mês</span>
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card">
            <header>
              <i className="fa-solid fa-clipboard-list"></i>Pendências médicas
            </header>
            <div className="table-wrapper">
              {medicalFollowUps.length === 0 ? (
                <div className="empty-state">Nenhuma consulta ou vacina próxima</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Animal</th>
                      <th>Tipo</th>
                      <th>Prazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicalFollowUps.map((record) => {
                      if (!record.nextDueDate) return null
                      const dueInfo = describeDueDate(record.nextDueDate, now)

                      return (
                        <tr key={record.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{record.animal.name}</div>
                            <span className="muted-text">
                              {record.animal.shelter?.name ?? 'Sem abrigo'}
                            </span>
                          </td>
                          <td>{record.recordType}</td>
                          <td>
                            <div>{formatDate(record.nextDueDate)}</div>
                            <span
                              className={`status-pill ${dueInfo.variant ? dueInfo.variant : ''}`}
                            >
                              {dueInfo.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </article>

          <article className="dashboard-card">
            <header>
              <i className="fa-solid fa-hospital"></i>Internações em andamento
            </header>
            <div className="table-wrapper">
              {internacoes.length === 0 ? (
                <div className="empty-state">Nenhum animal internado</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Animal</th>
                      <th>Abrigo</th>
                      <th>Atualização</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internacoes.map((animal) => (
                      <tr key={animal.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{animal.name}</div>
                          <span className="muted-text">{animal.breed?.name ?? 'SRD'}</span>
                        </td>
                        <td>{animal.shelter?.name ?? 'Sem abrigo'}</td>
                        <td>
                          <span className={`status-pill ${getStatusVariant(animal.status?.name ?? '')}`}>
                            {animal.status?.name ?? 'Sem status'}
                          </span>
                          <div className="muted-text">{formatRelativeDay(animal.updatedAt, now)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </article>

          <article className="dashboard-card">
            <header>
              <i className="fa-solid fa-hand-holding-heart"></i>Trâmite de adoções
            </header>
            <div className="table-wrapper">
              {adoptionPipeline.length === 0 ? (
                <div className="empty-state">Nenhum processo registrado</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Animal</th>
                      <th>Adotante</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adoptionPipeline.map((event) => (
                      <tr key={event.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {event.animal?.name ?? 'Animal removido'}
                          </div>
                          <span className="muted-text">
                            {event.animal?.shelter?.name ?? 'Sem abrigo vinculado'}
                          </span>
                        </td>
                        <td>{event.adopter?.name ?? 'Adotante não informado'}</td>
                        <td>
                          <span className={`status-pill ${getStatusVariant(event.status)}`}>
                            {event.status}
                          </span>
                          <div className="muted-text">{formatDate(event.createdAt)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </article>

          <article className="dashboard-card">
            <header>
              <i className="fa-solid fa-weight-scale"></i>Registros de peso
            </header>
            <div className="table-wrapper">
              {weightRecords.length === 0 ? (
                <div className="empty-state">Nenhuma pesagem recente</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Animal</th>
                      <th>Peso</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightRecords.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{record.animalName}</div>
                          <span className="muted-text">{record.shelterName}</span>
                        </td>
                        <td>
                          {formatDecimal(record.value)} {record.unit}
                        </td>
                        <td>{formatDate(record.dateTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </article>

          <article className="dashboard-card full-span">
            <header>
              <i className="fa-solid fa-wave-square"></i>Últimas atividades
            </header>
            {recentEvents.length === 0 ? (
              <div className="empty-state">Nenhum evento registrado</div>
            ) : (
              <div className="timeline-list">
                {recentEvents.map((event) => (
                  <div key={event.id} className="timeline-item">
                    <div className="timeline-marker">
                      <i className={`fa-solid ${iconForEvent(event.eventType)}`}></i>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">
                        {event.eventType} · {event.animal?.name ?? 'Animal removido'}
                      </div>
                      <p className="timeline-description">{event.description}</p>
                      <div className="timeline-meta">
                        <span>
                          <i className="fa-solid fa-user"></i>{' '}
                          {event.triggeredByUser?.name ?? 'Sistema'}
                        </span>
                        <span>
                          <i className="fa-solid fa-calendar-day"></i>{' '}
                          {formatDateTime(event.createdAt)} ({formatRelativeDay(event.createdAt, now)})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </main>
    </DashboardLayout>
  )
}
