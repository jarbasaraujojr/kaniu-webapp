'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddMedicalRecordModal } from './add-medical-record-modal'

interface MedicalRecord {
  id: string
  record_type: string
  description: string
  veterinarian: string | null
  record_date: Date
  next_due_date: Date | null
  animals: {
    id: string
    name: string
  }
  users: {
    name: string
  } | null
  veterinary_clinic: {
    name: string
  } | null
}

interface Animal {
  id: string
  name: string
}

interface Clinic {
  id: string
  name: string
}

interface MedicalRecordsListProps {
  initialRecords: MedicalRecord[]
  animals: Animal[]
  clinics: Clinic[]
  recordTypes: string[]
  selectedAnimalId?: string
  selectedRecordType?: string
}

export function MedicalRecordsList({
  initialRecords,
  animals,
  clinics,
  recordTypes,
  selectedAnimalId,
  selectedRecordType,
}: MedicalRecordsListProps) {
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [animalFilter, setAnimalFilter] = useState(selectedAnimalId || 'all')
  const [typeFilter, setTypeFilter] = useState(selectedRecordType || 'all')

  const handleAnimalFilterChange = (value: string) => {
    setAnimalFilter(value)
    const params = new URLSearchParams()
    if (value !== 'all') params.set('animal_id', value)
    if (typeFilter !== 'all') params.set('record_type', typeFilter)
    router.push(`/dashboard/historico?${params.toString()}`)
  }

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value)
    const params = new URLSearchParams()
    if (animalFilter !== 'all') params.set('animal_id', animalFilter)
    if (value !== 'all') params.set('record_type', value)
    router.push(`/dashboard/historico?${params.toString()}`)
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Consulta: '#3b82f6',
      Vacinação: '#10b981',
      Exame: '#8b5cf6',
      Cirurgia: '#ef4444',
      Tratamento: '#f59e0b',
      Avaliação: '#06b6d4',
      Emergência: '#dc2626',
      Retorno: '#6366f1',
      Outro: '#6b7280',
    }
    return colors[type] || '#6b7280'
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <main className="main-container">
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{
              margin: '0 0 0 0.5rem',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--primary-color)',
            }}>
              Histórico Médico
            </h2>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '0.5rem 0.85rem',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
            title="Adicionar novo histórico"
          >
            <i className="fa-solid fa-plus" style={{ fontSize: '0.875rem' }}></i>
            Novo Histórico
          </button>
        </div>
      </div>
      <div>
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
                Tipo de Registro
              </label>
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {recordTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lista de registros */}
        {initialRecords.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <i className="fa-solid fa-notes-medical" style={{
              fontSize: '3rem',
              color: 'var(--text-faded)',
              marginBottom: '1rem',
            }}></i>
            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
              Nenhum registro médico encontrado
            </p>
            <p style={{ color: 'var(--text-faded)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Clique em &quot;Novo Registro&quot; para adicionar o primeiro
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {initialRecords.map((record) => (
              <div
                key={record.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderLeft: `4px solid ${getTypeColor(record.record_type)}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                    }}>
                      <span
                        className="chip"
                        style={{
                          backgroundColor: getTypeColor(record.record_type),
                          color: 'white',
                          fontWeight: 600,
                        }}
                      >
                        {record.record_type}
                      </span>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: 'var(--text-dark)',
                        margin: 0,
                      }}>
                        {record.animals.name}
                      </h3>
                    </div>

                    <p style={{
                      color: 'var(--text-dark)',
                      fontSize: '0.95rem',
                      marginBottom: '0.75rem',
                      lineHeight: 1.5,
                    }}>
                      {record.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      gap: '1.5rem',
                      flexWrap: 'wrap',
                      fontSize: '0.875rem',
                      color: 'var(--text-light)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-calendar"></i>
                        <span>{formatDate(record.record_date)}</span>
                      </div>

                      {record.veterinarian && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="fa-solid fa-user-doctor"></i>
                          <span>{record.veterinarian}</span>
                        </div>
                      )}

                      {record.veterinary_clinic && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="fa-solid fa-hospital"></i>
                          <span>{record.veterinary_clinic.name}</span>
                        </div>
                      )}

                      {record.users && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="fa-solid fa-user"></i>
                          <span>Criado por {record.users.name}</span>
                        </div>
                      )}
                    </div>

                    {record.next_due_date && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'var(--background-soft)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        color: 'var(--text-dark)',
                      }}>
                        <i className="fa-solid fa-clock" style={{ marginRight: '0.5rem' }}></i>
                        Próximo: {formatDate(record.next_due_date)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => router.push(`/dashboard/animais/${record.animals.id}`)}
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

      {/* Modal de adicionar registro */}
      <AddMedicalRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        animals={animals}
        clinics={clinics}
        recordTypes={recordTypes}
      />
    </main>
  )
}
