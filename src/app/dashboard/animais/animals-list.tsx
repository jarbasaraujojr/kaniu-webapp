'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Prisma } from '@prisma/client'

interface Animal {
  id: string
  name: string
  birth_date: Date | null
  birthDate?: Date | null
  sex_id: number | null
  catalogs_animals_sex_idTocatalogs?: { name: string } | null
  size: string | null
  is_available_for_adoption?: boolean
  appearance: Prisma.JsonValue
  catalogs_animals_species_idTocatalogs: { name: string } | null
  species?: { name: string } | null
  catalogs_animals_breed_idTocatalogs: { name: string } | null
  breed?: { name: string } | null
  catalogs_animals_status_idTocatalogs: { name: string } | null
  shelters: { name: string }
  shelter?: { name: string }
  weights?: Array<{ value: number }>
}

interface AnimalsListProps {
  initialStatus: string
  initialAnimals: Animal[]
  availableStatuses: string[]
}

type ViewMode = 'grid' | 'list'

const VIEW_MODE_KEY = 'animals-view-mode'

export function AnimalsList({ initialStatus, initialAnimals, availableStatuses }: AnimalsListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentStatus, setCurrentStatus] = useState(initialStatus || 'Todos')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(VIEW_MODE_KEY)
      return (saved === 'grid' || saved === 'list') ? saved : 'grid'
    }
    return 'grid'
  })

  const statusOptions = Array.from(
    new Set(['Todos', ...availableStatuses.filter((status): status is string => Boolean(status))])
  )

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode)
  }, [viewMode])

  const handleStatusChange = (status: string) => {
    setCurrentStatus(status)
    const encodedStatus = encodeURIComponent(status)
    router.push(`${pathname}?status=${encodedStatus}`)
  }

  const getAnimalPhoto = (animal: Animal) => {
    if (typeof animal.appearance === 'object' && animal.appearance !== null && !Array.isArray(animal.appearance)) {
      const app = animal.appearance as Record<string, unknown>
      if (typeof app.photo === 'string') return app.photo
    }

    const speciesName = animal.species?.name || animal.catalogs_animals_species_idTocatalogs?.name
    if (speciesName === 'Cachorro' || speciesName === 'Cão') {
      return 'https://i.ibb.co/Z6dPncCH/pic-dog.png'
    } else if (speciesName === 'Gato') {
      return 'https://i.ibb.co/9dWLkZs/pic-cat.png'
    }
    return 'https://i.ibb.co/KpVTx4vK/pic-none.png'
  }

  const calculateAge = (birthDate: Date | null | undefined) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    const years = today.getFullYear() - birth.getFullYear()
    const months = today.getMonth() - birth.getMonth()

    if (years === 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`
    if (months < 0) return `${years - 1} ${years - 1 === 1 ? 'ano' : 'anos'}`
    return `${years} ${years === 1 ? 'ano' : 'anos'}`
  }

  return (
    <main className="main-container">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '0.5rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <h2 style={{
          margin: 0,
          marginLeft: '0.5rem',
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'var(--primary-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          Animais
        </h2>
        <button
          onClick={() => router.push('/dashboard/animais/novo')}
          style={{
            padding: '0.5rem 0.75rem',
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
            fontWeight: 600
          }}
          title="Adicionar novo animal"
        >
          <i className="fa-solid fa-plus" style={{ fontSize: '0.875rem' }}></i>
          Novo Animal
        </button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
        <div style={{
          padding: '1rem 1.5rem',
        }}>
          {/* Filtros de status e seletores de visualização */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-light)',
                marginRight: '0.25rem'
              }}>
                Status:
              </span>
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={`tab-btn ${currentStatus === status ? 'active' : ''}`}
                  onClick={() => handleStatusChange(status)}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.5rem 0.85rem'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${viewMode === 'grid' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  backgroundColor: viewMode === 'grid' ? 'var(--primary-color)' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : 'var(--text-light)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.875rem'
                }}
                title="Visualização em grade"
              >
                <i className="fa-solid fa-grip" style={{ fontSize: '0.875rem' }}></i>
                Grade
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${viewMode === 'list' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  backgroundColor: viewMode === 'list' ? 'var(--primary-color)' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'var(--text-light)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.875rem'
                }}
                title="Visualização em lista"
              >
                <i className="fa-solid fa-list" style={{ fontSize: '0.875rem' }}></i>
                Lista
              </button>
            </div>
          </div>
        </div>

        {initialAnimals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <i className="fa-solid fa-inbox" style={{
              fontSize: '2rem',
              color: 'var(--text-faded)',
              marginBottom: '0.5rem'
            }}></i>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
              Nenhum animal {currentStatus.toLowerCase()} encontrado
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'
          }}>
            {initialAnimals.map((animal) => (
              <div
                key={animal.id}
                className="card"
                onClick={() => router.push(`/dashboard/animais/${animal.id}`)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '0.875rem'
                }}
              >
                <div style={{
                  width: '100%',
                  height: '140px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  marginBottom: '0.625rem'
                }}>
                  <img
                    src={getAnimalPhoto(animal)}
                    alt={animal.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{
                    fontFamily: "'GoodDog', 'Inter', sans-serif",
                    fontSize: '1.6rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.01em',
                    color: 'var(--text-dark)',
                    margin: 0
                  }}>
                    {animal.name}
                  </h3>
                  {animal.is_available_for_adoption === false && (
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      Indisponível
                    </span>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.4rem',
                  marginBottom: '0.625rem'
                }}>
                  {animal.species && (
                    <span className="chip" style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}>{animal.species.name}</span>
                  )}
                  {animal.catalogs_animals_sex_idTocatalogs?.name && (
                    <span className="chip" style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}>{animal.catalogs_animals_sex_idTocatalogs.name}</span>
                  )}
                  {animal.size && (
                    <span className="chip" style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}>{animal.size}</span>
                  )}
                  {animal.breed && (
                    <span className="chip" style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}>{animal.breed.name}</span>
                  )}
                  {animal.birthDate && (
                    <span className="chip" style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}>{calculateAge(animal.birthDate)}</span>
                  )}
                  {animal.weights && animal.weights.length > 0 && (
                    <span className="chip" style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}>{animal.weights[0].value} kg</span>
                  )}
                </div>

                <div style={{
                  paddingTop: '0.625rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--text-light)',
                  fontSize: '0.75rem'
                }}>
                  <i className="fa-solid fa-building" style={{ fontSize: '0.7rem' }}></i>
                  <span>{animal.shelter?.name}</span>
                </div>
              </div>
            ))}
          </div>
          </div>
        ) : (
            <div style={{ overflowX: 'auto', marginTop: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
                  <thead style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <tr style={{ background: 'var(--background-soft)' }}>
                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Animal</th>
                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Espécie</th>
                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Raça</th>
                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sexo</th>
                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Porte</th>
                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Idade</th>
                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peso</th>
                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {initialAnimals.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                        Nenhum animal encontrado
                      </td>
                    </tr>
                  ) : (
                    initialAnimals.map((animal) => (
                      <tr
                        key={animal.id}
                        onClick={() => router.push(`/dashboard/animais/${animal.id}`)}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background-soft)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={getAnimalPhoto(animal)}
                              alt={animal.name}
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: 'var(--radius-md)',
                                objectFit: 'cover'
                              }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: 'var(--text-dark)'
                              }}>
                                {animal.name}
                              </span>
                              {animal.is_available_for_adoption === false && (
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '0.2rem 0.4rem',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  borderRadius: '4px',
                                  fontWeight: 600
                                }}>
                                  Indisponível
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                          {animal.species?.name || '-'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                          {animal.breed?.name || '-'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                          {animal.catalogs_animals_sex_idTocatalogs?.name || '-'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                          {animal.size || '-'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                          {calculateAge(animal.birthDate) || '-'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                          {animal.weights && animal.weights.length > 0 ? `${animal.weights[0].value} kg` : '-'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}></i>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
        )}
      </div>
    </main>
  )
}
