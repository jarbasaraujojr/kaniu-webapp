'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddPrescriptionModal } from './add-prescription-modal'
import { Checkbox } from '@/components/ui/checkbox'

interface PrescriptionTask {
  id: string
  scheduled_date: Date
  scheduled_time: Date
  administered_at: Date | null
  administered_by: string | null
  is_completed: boolean
  notes: string | null
  users: {
    name: string
  } | null
}

interface Prescription {
  id: string
  dosage: string
  route: string
  interval_hours: number
  start_date: Date
  start_time: Date | null
  duration_days: number | null
  is_continuous: boolean
  is_completed: boolean
  description: string | null
  animals: {
    id: string
    name: string
  }
  users: {
    name: string
  } | null
  medications: {
    name: string
  }
  prescription_tasks: PrescriptionTask[]
}

interface Animal {
  id: string
  name: string
}

interface Medication {
  id: number
  name: string
}

interface PrescriptionsListProps {
  initialPrescriptions: Prescription[]
  animals: Animal[]
  medications: Medication[]
  administrationRoutes: string[]
  selectedAnimalId?: string
  selectedStatus?: string
}

export function PrescriptionsList({
  initialPrescriptions,
  animals,
  medications,
  administrationRoutes,
  selectedAnimalId,
  selectedStatus,
}: PrescriptionsListProps) {
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [animalFilter, setAnimalFilter] = useState(selectedAnimalId || 'all')
  const [statusFilter, setStatusFilter] = useState(selectedStatus || 'all')

  const handleAnimalFilterChange = (value: string) => {
    setAnimalFilter(value)
    const params = new URLSearchParams()
    if (value !== 'all') params.set('animal_id', value)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    router.push(`/dashboard/tratamentos?${params.toString()}`)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    const params = new URLSearchParams()
    if (animalFilter !== 'all') params.set('animal_id', animalFilter)
    if (value !== 'all') params.set('status', value)
    router.push(`/dashboard/tratamentos?${params.toString()}`)
  }

  const handleTaskToggle = async (taskId: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/prescription-tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          was_administered: isCompleted,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar tarefa')
      }

      router.refresh()
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      alert('Erro ao atualizar tarefa. Por favor, tente novamente.')
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: Date, time: Date) => {
    const dateStr = new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
    const timeStr = new Date(time).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${dateStr} às ${timeStr}`
  }

  const getStatusBadge = (prescription: Prescription) => {
    if (prescription.is_completed) {
      return (
        <span className="chip" style={{ backgroundColor: '#6b7280', color: 'white' }}>
          Concluído
        </span>
      )
    }
    if (prescription.is_continuous) {
      return (
        <span className="chip" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
          Contínuo
        </span>
      )
    }
    return (
      <span className="chip" style={{ backgroundColor: '#10b981', color: 'white' }}>
        Ativo
      </span>
    )
  }

  return (
    <main className="main-container">
      <header className="header" style={{ padding: '1.75rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--text-dark)',
              margin: 0
            }}>
              Tratamentos e Prescrições
            </h1>
            <p style={{
              color: 'var(--text-light)',
              fontSize: '0.95rem',
              marginTop: '0.5rem'
            }}>
              Gerenciamento de medicamentos e acompanhamento de administração
            </p>
          </div>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'white',
            }}
          >
            <i className="fa-solid fa-plus" style={{ marginRight: '0.5rem' }}></i>
            Nova Prescrição
          </Button>
        </div>
      </header>

      <div style={{ padding: '1.75rem' }}>
        {/* Filtros */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-dark)',
                marginBottom: '0.5rem',
              }}>
                Animal
              </label>
              <Select value={animalFilter} onValueChange={handleAnimalFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os animais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os animais</SelectItem>
                  {animals.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-dark)',
                marginBottom: '0.5rem',
              }}>
                Status
              </label>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lista de prescrições */}
        {initialPrescriptions.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <i className="fa-solid fa-pills" style={{
              fontSize: '3rem',
              color: 'var(--text-faded)',
              marginBottom: '1rem',
            }}></i>
            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
              Nenhuma prescrição encontrada
            </p>
            <p style={{ color: 'var(--text-faded)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Clique em &quot;Nova Prescrição&quot; para adicionar o primeiro tratamento
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {initialPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="card"
                style={{ padding: '1.25rem' }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem',
                    }}>
                      {getStatusBadge(prescription)}
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: 'var(--text-dark)',
                        margin: 0,
                      }}>
                        {prescription.medications.name}
                      </h3>
                    </div>

                    <p style={{
                      color: 'var(--text-light)',
                      fontSize: '0.875rem',
                      marginBottom: '0.75rem',
                    }}>
                      Animal: <strong>{prescription.animals.name}</strong>
                    </p>

                    <div style={{
                      display: 'flex',
                      gap: '1.5rem',
                      flexWrap: 'wrap',
                      fontSize: '0.875rem',
                      color: 'var(--text-light)',
                      marginBottom: '1rem',
                    }}>
                      <div>
                        <strong>Dosagem:</strong> {prescription.dosage}
                      </div>

                      <div>
                        <strong>Via:</strong> {prescription.route}
                      </div>

                      <div>
                        <strong>Frequência:</strong> A cada {prescription.interval_hours}h
                      </div>

                      <div>
                        <strong>Início:</strong> {formatDate(prescription.start_date)}
                      </div>

                      {prescription.duration_days && (
                        <div>
                          <strong>Duração:</strong> {prescription.duration_days} dias
                        </div>
                      )}
                    </div>

                    {prescription.description && (
                      <p style={{
                        color: 'var(--text-dark)',
                        fontSize: '0.875rem',
                        fontStyle: 'italic',
                        marginBottom: '1rem',
                      }}>
                        Observações: {prescription.description}
                      </p>
                    )}

                    {/* Últimas administrações */}
                    {prescription.prescription_tasks.length > 0 && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: 'var(--background-soft)',
                        borderRadius: 'var(--radius-md)',
                      }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-dark)',
                          marginBottom: '0.75rem',
                        }}>
                          Últimas Administrações
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {prescription.prescription_tasks.map((task) => (
                            <div
                              key={task.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontSize: '0.875rem',
                              }}
                            >
                              <Checkbox
                                checked={task.is_completed}
                                onCheckedChange={(checked) =>
                                  handleTaskToggle(task.id, checked as boolean)
                                }
                              />
                              <span style={{
                                color: task.is_completed ? 'var(--text-light)' : 'var(--text-dark)',
                                textDecoration: task.is_completed ? 'line-through' : 'none',
                              }}>
                                {formatDateTime(task.scheduled_date, task.scheduled_time)}
                              </span>
                              {task.is_completed && task.users && (
                                <span style={{ color: 'var(--text-faded)', fontSize: '0.8rem' }}>
                                  por {task.users.name}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => router.push(`/dashboard/animais/${prescription.animals.id}`)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--primary-color)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--background-soft)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    Ver Animal
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de adicionar prescrição */}
      <AddPrescriptionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        animals={animals}
        medications={medications}
        administrationRoutes={administrationRoutes}
      />
    </main>
  )
}
