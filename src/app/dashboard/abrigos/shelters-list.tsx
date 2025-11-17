'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Prisma } from '@prisma/client'

interface Shelter {
  id: string
  name: string
  description: string | null
  location: Prisma.JsonValue
  phone: string | null
  email: string | null
  website: string | null
  is_active: boolean
  created_at: Date
  owner: {
    id: string
    name: string
    email: string
  }
  animalsCount: number
}

interface SheltersListProps {
  initialShelters: Shelter[]
  showActive: boolean
  userRole: string
}

type ViewMode = 'grid' | 'list'

const VIEW_MODE_KEY = 'shelters-view-mode'

export function SheltersList({ initialShelters, showActive, userRole }: SheltersListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentFilter, setCurrentFilter] = useState(showActive)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(VIEW_MODE_KEY)
      return (saved === 'grid' || saved === 'list') ? saved : 'grid'
    }
    return 'grid'
  })

  const handleFilterChange = (active: boolean) => {
    setCurrentFilter(active)
    router.push(`${pathname}?active=${active}`)
  }

  const getLocationString = (location: Prisma.JsonValue) => {
    if (!location) return 'Localização não definida'
    if (typeof location === 'string') return location
    if (typeof location === 'object' && location !== null && !Array.isArray(location)) {
      const loc = location as { city?: string; state?: string }
      if (loc.city && loc.state) {
        return `${loc.city}, ${loc.state}`
      }
      if (loc.city) return loc.city
      if (loc.state) return loc.state
    }
    return 'Localização não definida'
  }

  const canCreateShelter = userRole === 'admin'

  return (
    <main className="main-container">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--text-dark)'
        }}>
          Abrigos
        </h1>
        {canCreateShelter && (
          <Button
            type="button"
            onClick={() => router.push('/dashboard/abrigos/novo')}
            className="gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            Novo Abrigo
          </Button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          background: 'var(--background-soft)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`tab-btn ${currentFilter ? 'active' : ''}`}
              onClick={() => handleFilterChange(true)}
            >
              Ativos
            </button>
            <button
              className={`tab-btn ${!currentFilter ? 'active' : ''}`}
              onClick={() => handleFilterChange(false)}
            >
              Todos
            </button>
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

        {initialShelters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <i className="fa-solid fa-building" style={{
              fontSize: '2rem',
              color: 'var(--text-faded)',
              marginBottom: '0.5rem'
            }}></i>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
              Nenhum abrigo encontrado
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
            }}>
              {initialShelters.map((shelter) => (
                <div
                  key={shelter.id}
                  className="card"
                  onClick={() => router.push(`/dashboard/abrigos/${shelter.id}`)}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: '1.25rem',
                    position: 'relative'
                  }}
                >
                  {!shelter.is_active && (
                    <span style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      background: 'var(--danger-color)',
                      color: 'white',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600
                    }}>
                      Inativo
                    </span>
                  )}

                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <i className="fa-solid fa-building" style={{
                      fontSize: '1.75rem',
                      color: 'white'
                    }}></i>
                  </div>

                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text-dark)',
                    marginBottom: '0.5rem'
                  }}>
                    {shelter.name}
                  </h3>

                  {shelter.description && (
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-light)',
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {shelter.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    marginTop: 'auto'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--text-light)',
                      fontSize: '0.8rem'
                    }}>
                      <i className="fa-solid fa-location-dot" style={{ fontSize: '0.75rem' }}></i>
                      <span>{getLocationString(shelter.location)}</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--text-light)',
                      fontSize: '0.8rem'
                    }}>
                      <i className="fa-solid fa-paw" style={{ fontSize: '0.75rem' }}></i>
                      <span>{shelter.animalsCount} {shelter.animalsCount === 1 ? 'animal' : 'animais'}</span>
                    </div>

                    {shelter.phone && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-light)',
                        fontSize: '0.8rem'
                      }}>
                        <i className="fa-solid fa-phone" style={{ fontSize: '0.75rem' }}></i>
                        <span>{shelter.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
              <thead style={{ borderTop: '1px solid var(--border-color)' }}>
                <tr style={{ background: 'var(--background-soft)' }}>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Localização</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Responsável</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contato</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Animais</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
                </tr>
              </thead>
              <tbody>
                {initialShelters.map((shelter) => (
                  <tr
                    key={shelter.id}
                    onClick={() => router.push(`/dashboard/abrigos/${shelter.id}`)}
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
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--primary-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="fa-solid fa-building" style={{
                            fontSize: '1rem',
                            color: 'white'
                          }}></i>
                        </div>
                        <span style={{
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: 'var(--text-dark)'
                        }}>
                          {shelter.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                      {getLocationString(shelter.location)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                      {shelter.owner.name}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                      {shelter.phone || shelter.email || '-'}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-dark)', textAlign: 'center' }}>
                      {shelter.animalsCount}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.625rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: shelter.is_active ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: shelter.is_active ? 'var(--success-color)' : 'var(--danger-color)'
                      }}>
                        {shelter.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}></i>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
