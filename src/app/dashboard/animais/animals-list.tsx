'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

interface AnimalsListProps {
  initialStatus: string
  initialAnimals: any[]
  availableStatuses: string[]
}

type ViewMode = 'grid' | 'list'

export function AnimalsList({ initialStatus, initialAnimals, availableStatuses }: AnimalsListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentStatus, setCurrentStatus] = useState(initialStatus)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const handleStatusChange = (status: string) => {
    setCurrentStatus(status)
    router.push(`${pathname}?status=${status}`)
  }

  const getAnimalPhoto = (animal: any) => {
    if (animal.appearance?.photo) return animal.appearance.photo

    const speciesName = animal.species?.name
    if (speciesName === 'Cachorro') {
      return 'https://i.ibb.co/Z6dPncCH/pic-dog.png'
    } else if (speciesName === 'Gato') {
      return 'https://i.ibb.co/9dWLkZs/pic-cat.png'
    }
    return 'https://i.ibb.co/KpVTx4vK/pic-none.png'
  }

  const calculateAge = (birthDate: Date | null) => {
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
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="tab-nav">
            {availableStatuses.map((status) => (
              <button
                key={status}
                className={`tab-btn ${currentStatus === status ? 'active' : ''}`}
                onClick={() => handleStatusChange(status)}
              >
                {status}s
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
      </header>

      <div style={{ padding: '1.25rem' }}>
        {initialAnimals.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
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

                <h3 style={{
                  fontFamily: "'GoodDog', 'Inter', sans-serif",
                  fontSize: '1.15rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.01em',
                  color: 'var(--text-dark)',
                  marginBottom: '0.5rem'
                }}>
                  {animal.name}
                </h3>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem',
                  marginBottom: '0.625rem'
                }}>
                  {animal.species && (
                    <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}>{animal.species.name}</span>
                  )}
                  {animal.gender && (
                    <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}>{animal.gender}</span>
                  )}
                  {animal.size && (
                    <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}>{animal.size}</span>
                  )}
                  {animal.breed && (
                    <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}>{animal.breed.name}</span>
                  )}
                  {animal.birthDate && (
                    <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}>{calculateAge(animal.birthDate)}</span>
                  )}
                  {animal.weights && animal.weights.length > 0 && (
                    <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}>{animal.weights[0].value} kg</span>
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
                  <span>{animal.shelter.name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {initialAnimals.map((animal) => (
              <div
                key={animal.id}
                className="card"
                onClick={() => router.push(`/dashboard/animais/${animal.id}`)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                {/* Linha 1: Foto + Nome + Abrigo */}
                <div style={{
                  display: 'flex',
                  gap: '0.875rem',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    flexShrink: 0
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

                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                    minWidth: 0
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '1rem'
                    }}>
                      <h3 style={{
                        fontFamily: "'GoodDog', 'Inter', sans-serif",
                        fontSize: '1.15rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.01em',
                        color: 'var(--text-dark)',
                        margin: 0,
                        lineHeight: 1.2
                      }}>
                        {animal.name}
                      </h3>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: 'var(--text-light)',
                        fontSize: '0.7rem',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                      }}>
                        <i className="fa-solid fa-building" style={{ fontSize: '0.65rem' }}></i>
                        <span>{animal.shelter.name}</span>
                      </div>
                    </div>

                    {/* Pills com dados */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      overflow: 'hidden'
                    }}>
                      {animal.species && (
                        <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', whiteSpace: 'nowrap' }}>{animal.species.name}</span>
                      )}
                      {animal.gender && (
                        <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', whiteSpace: 'nowrap' }}>{animal.gender}</span>
                      )}
                      {animal.size && (
                        <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', whiteSpace: 'nowrap' }}>{animal.size}</span>
                      )}
                      {animal.breed && (
                        <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', whiteSpace: 'nowrap' }}>{animal.breed.name}</span>
                      )}
                      {animal.birthDate && (
                        <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', whiteSpace: 'nowrap' }}>{calculateAge(animal.birthDate)}</span>
                      )}
                      {animal.weights && animal.weights.length > 0 && (
                        <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', whiteSpace: 'nowrap' }}>{animal.weights[0].value} kg</span>
                      )}
                    </div>

                    {/* Descrição */}
                    <p style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-light)',
                      margin: 0,
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {animal.description || ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
