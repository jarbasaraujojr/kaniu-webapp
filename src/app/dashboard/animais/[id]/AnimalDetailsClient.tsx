'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, DotProps } from 'recharts'
import { Prisma } from '@prisma/client'

interface TooltipProps {
  text: string
  visible: boolean
}

const Tooltip = ({ text, visible }: TooltipProps) => {
  if (!visible) return null

  return (
    <div style={{
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: '8px',
      padding: '6px 12px',
      background: '#1e293b',
      color: 'white',
      fontSize: '0.75rem',
      fontWeight: 500,
      borderRadius: '6px',
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      pointerEvents: 'none',
    }}>
      {text}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid #1e293b',
      }} />
    </div>
  )
}

interface AnimalData {
  id: string
  name: string
  description: string | null
  photo: string
  species: string
  breed: string
  gender: string
  size: string
  status: string
  coat: string | null
  color: string | null
  birthDate: Date | null
  age: string | null
  castrated: boolean | null
  vaccinated: boolean
  dewormed: boolean
  deparasitized: boolean
  shelter: string
  latestWeight: string | null
  previousWeight: string | null
  weightVariation: string | null
  weights: Array<{
    id: string | number
    date: Date
    value: number
    unit: string
    notes: string | null
    recordedBy: string
  }>
  medicalRecords: Array<{
    id: string
    type: string
    description: string
    veterinarian: string | null
    date: Date
    nextDueDate: Date | null
    details: Prisma.JsonValue
    createdBy: string
  }>
  events: Array<{
    id: string
    type: string
    description: string
    details: Prisma.JsonValue
    date: Date
    triggeredBy: string
  }>
}

interface AnimalDetailsClientProps {
  animal: AnimalData
}

export default function AnimalDetailsClient({ animal }: AnimalDetailsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('painel')
  const [hoveredButton, setHoveredButton] = useState<number | null>(null)

  const tabs = [
    { id: 'painel', label: 'Resumo', icon: 'fa-chart-line' },
    { id: 'historico', label: 'Histórico', icon: 'fa-clock-rotate-left' },
    { id: 'avaliacao', label: 'Avaliação', icon: 'fa-stethoscope' },
    { id: 'pesagem', label: 'Pesagem', icon: 'fa-weight-scale' },
    { id: 'imunizacao', label: 'Imunização', icon: 'fa-syringe' },
    { id: 'tratamento', label: 'Tratamento', icon: 'fa-pills' },
    { id: 'arquivos', label: 'Arquivos', icon: 'fa-folder-open' },
  ]

  // Filter medical records by type
  const assessments = animal.medicalRecords.filter(mr =>
    mr.type === 'Avaliação' || mr.type === 'Consulta' || mr.type === 'Exame'
  )
  const vaccinations = animal.medicalRecords.filter(mr =>
    mr.type === 'Vacinação' || mr.type === 'Vacina'
  )
  const treatments = animal.medicalRecords.filter(mr =>
    mr.type === 'Tratamento' || mr.type === 'Medicamento'
  )

  // Get latest assessment
  const latestAssessment = assessments[0]
  const latestVaccination = vaccinations[0]

  return (
    <main className="main-container">
      {/* Header Section */}
      <header className="header">
        <div className="header-content">
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1.25rem',
            width: '100%',
          }}>
            <div style={{ position: 'relative' }}>
              <img
                src={animal.photo}
                alt={animal.name}
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '16px',
                  objectFit: 'cover',
                  border: '4px solid var(--background-soft)',
                  boxShadow: '0 6px 16px rgba(15, 23, 42, 0.15)',
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              flex: 1,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'var(--primary-color)',
                  margin: 0,
                  lineHeight: 1.1,
                }}>
                  {animal.name}
                </h1>
                <button
                  onClick={() => router.push(`/dashboard/animais/${animal.id}/editar`)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-dark)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-color)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                  title="Editar animal"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                  Editar
                </button>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.6rem',
                flexWrap: 'wrap',
                fontSize: '0.95rem',
              }}>
                {animal.species && <span className="chip">{animal.species}</span>}
                {animal.gender && <span className="chip">{animal.gender}</span>}
                {animal.size && <span className="chip">{animal.size}</span>}
                {animal.breed && <span className="chip">{animal.breed}</span>}
                {animal.coat && <span className="chip">{animal.coat}</span>}
                {animal.color && <span className="chip">{animal.color}</span>}
                {animal.birthDate && (
                  <span className="chip">
                    {new Date(animal.birthDate).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {animal.age && <span className="chip">{animal.age}</span>}
                {animal.latestWeight && <span className="chip">{animal.latestWeight}</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Botões de Status */}
                {[
                  { icon: 'fa-heart', label: 'Disponível', status: 'Disponível' },
                  { icon: 'fa-house', label: 'Adotado', status: 'Adotado' },
                  { icon: 'fa-magnifying-glass', label: 'Desaparecido', status: 'Desaparecido' },
                  { icon: 'fa-hospital', label: 'Internado', status: 'Internado' },
                  { icon: 'fa-cross', label: 'Falecido', status: 'Falecido' },
                ].map((action, idx) => {
                  const isActive = animal.status === action.status
                  return (
                    <div
                      key={idx}
                      style={{ position: 'relative' }}
                      onMouseEnter={() => setHoveredButton(idx)}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <button
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          border: isActive ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                          background: isActive ? 'var(--primary-color)' : 'var(--card-background)',
                          color: isActive ? 'white' : 'var(--text-light)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          transition: 'all 0.2s ease',
                          boxShadow: isActive ? '0 2px 8px rgba(90, 93, 127, 0.25)' : 'none',
                        }}
                        onMouseOver={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'var(--background-soft)'
                            e.currentTarget.style.borderColor = 'var(--primary-color)'
                            e.currentTarget.style.color = 'var(--primary-color)'
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'var(--card-background)'
                            e.currentTarget.style.color = 'var(--text-light)'
                            e.currentTarget.style.borderColor = 'var(--border-color)'
                          }
                        }}
                      >
                        <i className={`fa-solid ${action.icon}`}></i>
                      </button>
                      <Tooltip text={action.label} visible={hoveredButton === idx} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.65rem 1.1rem',
              border: activeTab === tab.id ? 'none' : '1px solid var(--border-color)',
              background: activeTab === tab.id ? 'var(--primary-color)' : 'var(--card-background)',
              color: activeTab === tab.id ? 'white' : 'var(--text-dark)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <i className={`fa-solid ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: '0.5rem' }}>
        {activeTab === 'painel' && <PainelTab animal={animal} latestAssessment={latestAssessment} latestVaccination={latestVaccination} />}
        {activeTab === 'historico' && <HistoricoTab events={animal.events} />}
        {activeTab === 'avaliacao' && <AvaliacaoTab assessments={assessments} />}
        {activeTab === 'pesagem' && <PesagemTab weights={animal.weights} />}
        {activeTab === 'imunizacao' && <ImunizacaoTab vaccinations={vaccinations} />}
        {activeTab === 'tratamento' && <TratamentoTab treatments={treatments} />}
        {activeTab === 'arquivos' && <ArquivosTab />}
      </div>
    </main>
  )
}

function PainelTab({ animal, latestAssessment, latestVaccination }: { animal: AnimalData, latestAssessment: { date: Date } | null, latestVaccination: { id: string; type: string; description: string; veterinarian: string | null; date: Date; nextDueDate: Date | null; details: Prisma.JsonValue; createdBy: string } | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Grid de Cards - 2 colunas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>

        {/* Informações Gerais */}
        <div className="card">
          <header style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.05rem',
            }}>
              <i className="fa-solid fa-info-circle"></i>
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Informações Gerais</h2>
          </header>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="info-field">
              <div className="info-field__label">Status</div>
              <div className="info-field__value">{animal.status || 'N/A'}</div>
            </div>
            <div className="info-field">
              <div className="info-field__label">Abrigo</div>
              <div className="info-field__value">{animal.shelter}</div>
            </div>
            <div className="info-field">
              <div className="info-field__label">Última Avaliação</div>
              <div className="info-field__value">
                {latestAssessment ? new Date(latestAssessment.date).toLocaleDateString('pt-BR') : 'Nenhuma avaliação registrada'}
              </div>
            </div>
          </div>
        </div>

        {/* Saúde e Cuidados */}
        <div className="card">
          <header style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.05rem',
            }}>
              <i className="fa-solid fa-heart-pulse"></i>
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Saúde e Cuidados</h2>
          </header>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="info-field">
              <div className="info-field__label">Castrado</div>
              <div className="info-field__value">
                {animal.castrated ? '✓ Sim' : '✗ Não'}
              </div>
            </div>
            <div className="info-field">
              <div className="info-field__label">Vacinado</div>
              <div className="info-field__value">
                {animal.vaccinated ? '✓ Sim' : '✗ Não'}
              </div>
            </div>
            <div className="info-field">
              <div className="info-field__label">Vermifugado</div>
              <div className="info-field__value">
                {animal.dewormed ? '✓ Sim' : '✗ Não'}
              </div>
            </div>
            <div className="info-field">
              <div className="info-field__label">Desparasitado</div>
              <div className="info-field__value">
                {animal.deparasitized ? '✓ Sim' : '✗ Não'}
              </div>
            </div>
          </div>
        </div>

        {/* Vacinação */}
        <div className="card">
          <header style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.05rem',
            }}>
              <i className="fa-solid fa-syringe"></i>
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Vacinação</h2>
          </header>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="info-field">
              <div className="info-field__label">Última Vacinação</div>
              <div className="info-field__value">
                {latestVaccination ? new Date(latestVaccination.date).toLocaleDateString('pt-BR') : 'Nenhuma vacinação registrada'}
              </div>
            </div>
            <div className="info-field">
              <div className="info-field__label">Próxima Vacinação</div>
              <div className="info-field__value">
                {latestVaccination?.nextDueDate ? new Date(latestVaccination.nextDueDate).toLocaleDateString('pt-BR') : 'Não agendada'}
              </div>
            </div>
          </div>
        </div>

        {/* Peso e Medidas */}
        <div className="card">
          <header style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.05rem',
            }}>
              <i className="fa-solid fa-weight-scale"></i>
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Peso e Medidas</h2>
          </header>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>
            {/* Valores à esquerda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: '0 0 auto', minWidth: '140px' }}>
              <div className="info-field">
                <div className="info-field__label">Peso Atual</div>
                <div className="info-field__value">
                  {animal.latestWeight || 'Não registrado'}
                </div>
              </div>
              {animal.previousWeight && (
                <>
                  <div className="info-field">
                    <div className="info-field__label">Peso Anterior</div>
                    <div className="info-field__value">{animal.previousWeight}</div>
                  </div>
                  {animal.weightVariation && (
                    <div className="info-field">
                      <div className="info-field__label">Variação</div>
                      <div className="info-field__value">
                        {Number(animal.weightVariation) > 0 ? '+' : ''}{animal.weightVariation}%
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Gráfico à direita */}
            {animal.weights.length > 0 && (
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-light)',
                  marginBottom: '0.5rem',
                  fontWeight: 500
                }}>
                  Evolução Recente
                </div>
                <div style={{ flex: 1, minHeight: '180px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={(() => {
                        const recentWeights = [...animal.weights].reverse().slice(-10)
                        const chartData = recentWeights.map(w => ({
                          date: new Date(w.date).getTime(),
                          dateLabel: new Date(w.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                          peso: Number(w.value),
                          isActual: true
                        }))

                        // Adicionar ponto na data atual sem valor (para criar espaço no eixo X)
                        if (chartData.length > 0) {
                          const now = new Date().getTime()
                          chartData.push({
                            date: now,
                            dateLabel: 'Hoje',
                            peso: 0,
                            isActual: false
                          })
                        }

                        return chartData
                      })()}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                      <XAxis
                        dataKey="date"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        stroke="var(--text-light)"
                        style={{ fontSize: '0.65rem' }}
                        tick={{ fill: 'var(--text-light)' }}
                        tickFormatter={(timestamp) => {
                          const date = new Date(timestamp)
                          const month = date.getMonth()
                          if (month === 0) { // Janeiro
                            return date.getFullYear().toString()
                          }
                          return ''
                        }}
                      />
                      <YAxis
                        stroke="var(--text-light)"
                        style={{ fontSize: '0.65rem' }}
                        tick={{ fill: 'var(--text-light)' }}
                        width={35}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'var(--card-background)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          padding: '0.5rem'
                        }}
                        labelFormatter={(timestamp: number | string) => {
                          const date = new Date(timestamp)
                          return date.toLocaleDateString('pt-BR')
                        }}
                        formatter={(value) => (value && typeof value === 'number') ? [`${value} kg`, 'Peso'] : []}
                      />
                      <Line
                        type="monotone"
                        dataKey="peso"
                        stroke="var(--primary-color)"
                        strokeWidth={2}
                        connectNulls={false}
                        dot={(props) => {
                          const { cx, cy, payload } = props
                          if (!payload.isActual || !payload.peso) return null
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={3}
                              fill="var(--primary-color)"
                              stroke="none"
                            />
                          )
                        }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {animal.description && (
        <div className="card">
          <header style={{ marginBottom: '0.85rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)' }}>Descrição</h2>
          </header>
          <p style={{ color: 'var(--text-dark)', lineHeight: 1.6, margin: 0, fontSize: '0.95rem' }}>
            {animal.description}
          </p>
        </div>
      )}
    </div>
  )
}

function HistoricoTab({ events }: { events: AnimalData['events'] }) {
  return (
    <div className="card" style={{ padding: '0' }}>
      <div style={{ padding: '1rem 1rem 0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Histórico de Eventos</h2>
        <button style={{
          padding: '0.6rem 1rem',
          background: 'var(--primary-color)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--background-soft)' }}>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Responsável</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                  Nenhum evento registrado
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    {new Date(event.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{event.type}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{event.description}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{event.triggeredBy}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '1rem' }}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AvaliacaoTab({ assessments }: { assessments: Array<{ id: string; date: Date; type: string; description?: string; veterinarian?: string | null; createdBy?: string }> }) {
  return (
    <div className="card" style={{ padding: '0' }}>
      <div style={{ padding: '1rem 1rem 0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Avaliações de Saúde</h2>
        <button style={{
          padding: '0.6rem 1rem',
          background: 'var(--primary-color)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--background-soft)' }}>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Veterinário</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registrado por</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
            </tr>
          </thead>
          <tbody>
            {assessments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                  Nenhuma avaliação registrada
                </td>
              </tr>
            ) : (
              assessments.map((assessment) => (
                <tr key={assessment.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    {new Date(assessment.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{assessment.type}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{assessment.description}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{assessment.veterinarian || '-'}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{assessment.createdBy}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '1rem' }}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PesagemTab({ weights }: { weights: AnimalData['weights'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1rem 1rem 0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Histórico de Peso</h2>
          <button style={{
            padding: '0.6rem 1rem',
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--background-soft)' }}>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Medição</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registrado por</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
              </tr>
            </thead>
            <tbody>
              {weights.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                    Nenhum registro de peso
                  </td>
                </tr>
              ) : (
                weights.map((weight, idx) => {
                  const previousWeight = weights[idx + 1]
                  const variation = previousWeight
                    ? ((weight.value - previousWeight.value) / previousWeight.value * 100).toFixed(1)
                    : null

                  return (
                    <tr key={weight.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                        {new Date(weight.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                        {weight.value} {weight.unit}
                        {variation && (
                          <span style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.8rem',
                            color: Number(variation) > 0 ? 'green' : Number(variation) < 0 ? 'red' : 'var(--text-light)'
                          }}>
                            ({Number(variation) > 0 ? '+' : ''}{variation}%)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{weight.recordedBy}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{weight.notes || '-'}</td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '1rem' }}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weight Chart */}
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem' }}>Evolução do Peso</h2>
        {weights.length === 0 ? (
          <div style={{
            height: '300px',
            background: 'var(--background-soft)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-light)',
          }}>
            <i className="fa-solid fa-chart-line" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
          </div>
        ) : (
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={(() => {
                  const allWeights = [...weights].reverse()
                  const chartData = allWeights.map(w => ({
                    date: new Date(w.date).getTime(),
                    dateLabel: new Date(w.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    peso: Number(w.value),
                    fullDate: new Date(w.date).toLocaleDateString('pt-BR'),
                    isActual: true
                  }))

                  // Adicionar ponto na data atual sem valor (para criar espaço no eixo X)
                  if (chartData.length > 0) {
                    const now = new Date().getTime()
                    chartData.push({
                      date: now,
                      dateLabel: 'Hoje',
                      peso: 0,
                      fullDate: new Date().toLocaleDateString('pt-BR'),
                      isActual: false
                    })
                  }

                  return chartData
                })()}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="date"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  stroke="var(--text-light)"
                  style={{ fontSize: '0.75rem' }}
                  tickFormatter={(timestamp) => {
                    const date = new Date(timestamp)
                    const month = date.getMonth()
                    if (month === 0) { // Janeiro
                      return date.getFullYear().toString()
                    }
                    return ''
                  }}
                />
                <YAxis
                  stroke="var(--text-light)"
                  style={{ fontSize: '0.75rem' }}
                  label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-light)' } }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-background)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                  labelStyle={{ color: 'var(--text-dark)', fontWeight: 600 }}
                  formatter={(value) => (value && typeof value === 'number') ? [`${value} kg`, 'Peso'] : []}
                  labelFormatter={(timestamp: number | string) => {
                    const date = new Date(timestamp)
                    return date.toLocaleDateString('pt-BR')
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '0.875rem' }}
                  formatter={() => 'Peso (kg)'}
                />
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke="var(--primary-color)"
                  strokeWidth={2}
                  connectNulls={false}
                  dot={(props) => {
                    const { cx, cy, payload } = props
                    if (!payload.isActual || !payload.peso) return null
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="var(--primary-color)"
                        stroke="none"
                      />
                    )
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

function ImunizacaoTab({ vaccinations }: { vaccinations: Array<{ id: string; type: string; description: string; veterinarian: string | null; date: Date; nextDueDate: Date | null; details: Prisma.JsonValue; createdBy: string }> }) {
  return (
    <div className="card" style={{ padding: '0' }}>
      <div style={{ padding: '1rem 1rem 0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Registro de Imunizações</h2>
        <button style={{
          padding: '0.6rem 1rem',
          background: 'var(--primary-color)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--background-soft)' }}>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Veterinário</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Próxima Dose</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
            </tr>
          </thead>
          <tbody>
            {vaccinations.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                  Nenhuma vacinação registrada
                </td>
              </tr>
            ) : (
              vaccinations.map((vaccination) => (
                <tr key={vaccination.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    {new Date(vaccination.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{vaccination.type}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{vaccination.description}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{vaccination.veterinarian || '-'}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    {vaccination.nextDueDate ? new Date(vaccination.nextDueDate).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '1rem' }}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TratamentoTab({ treatments }: { treatments: Array<{ id: string; type: string; description: string; veterinarian: string | null; date: Date; nextDueDate: Date | null; details: Prisma.JsonValue; createdBy: string }> }) {
  return (
    <div className="card" style={{ padding: '0' }}>
      <div style={{ padding: '1rem 1rem 0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Tratamentos Médicos</h2>
        <button style={{
          padding: '0.6rem 1rem',
          background: 'var(--primary-color)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--background-soft)' }}>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Veterinário</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Próxima Consulta</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
            </tr>
          </thead>
          <tbody>
            {treatments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                  Nenhum tratamento registrado
                </td>
              </tr>
            ) : (
              treatments.map((treatment) => (
                <tr key={treatment.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    {new Date(treatment.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{treatment.type}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{treatment.description}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{treatment.veterinarian || '-'}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    {treatment.nextDueDate ? new Date(treatment.nextDueDate).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '1rem' }}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ArquivosTab() {
  return (
    <div className="card">
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem' }}>Arquivos e Documentos</h2>
      <div style={{
        height: '200px',
        background: 'var(--background-soft)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-light)',
        gap: '1rem',
      }}>
        <i className="fa-solid fa-folder-open" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Nenhum arquivo disponível</p>
      </div>
    </div>
  )
}
