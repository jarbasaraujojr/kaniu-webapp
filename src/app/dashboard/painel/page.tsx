import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
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

// Revalidate cache every 60 seconds
export const revalidate = 60

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
    prisma.catalogs.findFirst({ where: { category: 'status', name: 'Abrigado' } }),
    prisma.catalogs.findFirst({ where: { category: 'status', name: 'Adotado' } }),
    prisma.catalogs.findFirst({ where: { category: 'status', name: 'Internado' } }),
  ])

  // Construir filtro baseado no role
  const animalFilter: Prisma.animalsWhereInput = { deleted_at: null }
  if (userRole === 'shelter_manager' && userShelterId) {
    animalFilter.shelter_id = userShelterId
  }

  const statsPromise = Promise.all([
    prisma.animals.count({ where: animalFilter }),
    prisma.animals.count({ where: { ...animalFilter, status_id: statusAbrigado?.id } }),
    prisma.animals.count({ where: { ...animalFilter, status_id: statusAdotado?.id } }),
    prisma.animals.count({ where: { ...animalFilter, status_id: statusInternado?.id } }),
    prisma.animals.count({ where: { ...animalFilter, status_id: statusAbrigado?.id, is_available_for_adoption: true } }),
    userRole === 'shelter_manager' && userShelterId
      ? Promise.resolve(1) // Shelter manager vê apenas seu abrigo
      : prisma.shelters.count(),
  ])

  const adoptionFilter: Prisma.adoption_eventsWhereInput = {}
  if (userRole === 'shelter_manager' && userShelterId) {
    adoptionFilter.animals = { shelter_id: userShelterId }
  }

  const adoptionCountsPromise = Promise.all([
    prisma.adoption_events.count({ where: { ...adoptionFilter, created_at: { gte: last30Days } } }),
    prisma.adoption_events.count({
      where: {
        ...adoptionFilter,
        created_at: {
          gte: previous30Days,
          lt: last30Days,
        },
      },
    }),
  ])

  const medicalRecordFilter: Prisma.animal_medical_recordsWhereInput = {
    next_due_date: {
      not: null,
      lte: twoWeeksAhead,
    },
  }
  if (userRole === 'shelter_manager' && userShelterId) {
    medicalRecordFilter.animals = { shelter_id: userShelterId }
  }

  const medicalFollowUpsPromise = prisma.animal_medical_records.findMany({
    where: medicalRecordFilter,
    include: {
      animals: {
        select: {
          id: true,
          name: true,
          shelters: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { next_due_date: 'asc' },
    take: 6,
  })

  const internacoesPromise = prisma.animals.findMany({
    where: { ...animalFilter, status_id: statusInternado?.id },
    select: {
      id: true,
      name: true,
      catalogs_animals_breed_idTocatalogs: { select: { name: true } },
      shelters: { select: { name: true } },
      updated_at: true,
      catalogs_animals_status_idTocatalogs: { select: { name: true } },
    },
    orderBy: { updated_at: 'desc' },
    take: 6,
  })

  const adoptionPipelinePromise = prisma.adoption_events.findMany({
    where: adoptionFilter,
    orderBy: { created_at: 'desc' },
    take: 6,
    include: {
      animals: {
        select: {
          id: true,
          name: true,
          shelters: { select: { name: true } },
        },
      },
      users_adoption_events_adopter_idTousers: {
        select: {
          name: true,
        },
      },
    },
  })

  const weightFilter: Prisma.animal_weightsWhereInput = {}
  if (userRole === 'shelter_manager' && userShelterId) {
    weightFilter.animals = { shelter_id: userShelterId }
  }

  const weightRecordsPromise = prisma.animal_weights.findMany({
    where: weightFilter,
    orderBy: { date_time: 'desc' },
    take: 6,
    include: {
      animals: {
        select: {
          id: true,
          name: true,
          shelters: { select: { name: true } },
        },
      },
    },
  })

  const eventFilter: Prisma.animal_eventsWhereInput = {}
  if (userRole === 'shelter_manager' && userShelterId) {
    eventFilter.animals = { shelter_id: userShelterId }
  }

  const eventsPromise = prisma.animal_events.findMany({
    where: eventFilter,
    orderBy: { created_at: 'desc' },
    take: 8,
    include: {
      animals: { select: { name: true } },
      users: { select: { name: true } },
    },
  })

  // Buscar adoções dos últimos 12 meses para o gráfico
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  const adoptionsFilter: Prisma.adoption_eventsWhereInput = {
    created_at: { gte: twelveMonthsAgo },
    status: 'Aprovada'
  }
  if (userRole === 'shelter_manager' && userShelterId) {
    adoptionsFilter.animals = { shelter_id: userShelterId }
  }

  const adoptionsByMonthPromise = prisma.adoption_events.findMany({
    where: adoptionsFilter,
    select: {
      created_at: true,
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
    adoptionsByMonthRaw,
  ] = await Promise.all([
    statsPromise,
    adoptionCountsPromise,
    medicalFollowUpsPromise,
    internacoesPromise,
    adoptionPipelinePromise,
    weightRecordsPromise,
    eventsPromise,
    adoptionsByMonthPromise,
  ])

  const [totalAnimals, totalSheltered, totalAdopted, totalInternados, totalAvailableForAdoption, totalShelters] = stats
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
    animalName: record.animals.name,
    shelterName: record.animals.shelters?.name ?? 'Sem abrigo',
    value: toPlainNumber(record.value),
    unit: record.unit,
    dateTime: record.date_time,
    notes: record.notes,
  }))

  // Processar adoções por mês para o gráfico
  const adoptionsByMonth = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return {
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
      year: date.getFullYear(),
      count: 0
    }
  })

  adoptionsByMonthRaw.forEach(adoption => {
    const adoptionDate = new Date(adoption.created_at)
    const monthIndex = (adoptionDate.getFullYear() - adoptionsByMonth[0].year) * 12 +
                       (adoptionDate.getMonth() - (now.getMonth() - 11))
    if (monthIndex >= 0 && monthIndex < 12) {
      adoptionsByMonth[monthIndex].count++
    }
  })

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
      id: 'available',
      label: 'Disponíveis para adoção',
      icon: 'fa-heart-circle-check',
      value: formatNumber(totalAvailableForAdoption),
      detail: `${formatNumber(totalSheltered - totalAvailableForAdoption)} não disponíveis`,
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
                      if (!record.next_due_date) return null
                      const dueInfo = describeDueDate(record.next_due_date, now)

                      return (
                        <tr key={record.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{record.animals.name}</div>
                            <span className="muted-text">
                              {record.animals.shelters?.name ?? 'Sem abrigo'}
                            </span>
                          </td>
                          <td>{record.record_type}</td>
                          <td>
                            <div>{formatDate(record.next_due_date)}</div>
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
                      <th>Atualização</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internacoes.map((animal) => (
                      <tr key={animal.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{animal.name}</div>
                          <span className="muted-text">{animal.catalogs_animals_breed_idTocatalogs?.name ?? 'SRD'}</span>
                        </td>
                        <td>
                          <span className={`status-pill ${getStatusVariant(animal.catalogs_animals_status_idTocatalogs?.name ?? '')}`}>
                            {animal.catalogs_animals_status_idTocatalogs?.name ?? 'Sem status'}
                          </span>
                          <div className="muted-text">{formatRelativeDay(animal.updated_at, now)}</div>
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
                            {event.animals?.name ?? 'Animal removido'}
                          </div>
                          <span className="muted-text">
                            {event.animals?.shelters?.name ?? 'Sem abrigo vinculado'}
                          </span>
                        </td>
                        <td>{event.users_adoption_events_adopter_idTousers?.name ?? 'Adotante não informado'}</td>
                        <td>
                          <span className={`status-pill ${getStatusVariant(event.status)}`}>
                            {event.status}
                          </span>
                          <div className="muted-text">{formatDate(event.created_at)}</div>
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

          <article className="dashboard-card">
            <header>
              <i className="fa-solid fa-chart-bar"></i>Adoções por mês
            </header>
            <div style={{ padding: '1.5rem', minHeight: '300px' }}>
              {adoptionsByMonth.every(m => m.count === 0) ? (
                <div className="empty-state">Nenhuma adoção registrada nos últimos 12 meses</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '280px', gap: '0.5rem' }}>
                  {adoptionsByMonth.map((data, index) => {
                    const maxCount = Math.max(...adoptionsByMonth.map(m => m.count), 1)
                    const heightPercent = (data.count / maxCount) * 100

                    return (
                      <div
                        key={index}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--text-dark)',
                          minHeight: '20px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {data.count > 0 ? data.count : ''}
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: `${heightPercent}%`,
                            background: data.count > 0
                              ? 'linear-gradient(180deg, var(--primary-color) 0%, var(--primary-dark) 100%)'
                              : 'var(--border-color)',
                            borderRadius: '6px 6px 0 0',
                            minHeight: data.count > 0 ? '4px' : '2px',
                            transition: 'all 0.3s ease',
                            cursor: data.count > 0 ? 'pointer' : 'default',
                            boxShadow: data.count > 0 ? '0 2px 8px rgba(90, 93, 127, 0.2)' : 'none',
                          }}
                          title={`${data.month}/${data.year}: ${data.count} adoção(ões)`}
                        />
                        <div style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-light)',
                          textTransform: 'capitalize',
                          fontWeight: 500
                        }}>
                          {data.month}
                        </div>
                      </div>
                    )
                  })}
                </div>
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
                      <i className={`fa-solid ${iconForEvent(event.event_type)}`}></i>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">
                        {event.event_type} · {event.animals?.name ?? 'Animal removido'}
                      </div>
                      <p className="timeline-description">{event.description}</p>
                      <div className="timeline-meta">
                        <span>
                          <i className="fa-solid fa-user"></i>{' '}
                          {event.users?.name ?? 'Sistema'}
                        </span>
                        <span>
                          <i className="fa-solid fa-calendar-day"></i>{' '}
                          {formatDateTime(event.created_at)} ({formatRelativeDay(event.created_at, now)})
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
