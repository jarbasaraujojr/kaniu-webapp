'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShelterForm } from '../shelter-form'

interface ShelterDetailsProps {
  shelter: any
  mode: 'view' | 'edit'
  userRole: string
  admins: any[]
}

export function ShelterDetails({ shelter, mode, userRole, admins }: ShelterDetailsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const canEdit = userRole === 'admin'
  const isEditing = mode === 'edit'

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/shelters/${shelter.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir abrigo')
      }

      router.push('/dashboard/abrigos')
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir abrigo')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const getLocationString = (location: any) => {
    if (!location) return null
    if (typeof location === 'string') return location

    const parts = []
    if (location.street) {
      let streetPart = location.street
      if (location.number) streetPart += `, ${location.number}`
      if (location.complement) streetPart += ` - ${location.complement}`
      parts.push(streetPart)
    }
    if (location.neighborhood) parts.push(location.neighborhood)
    if (location.city && location.state) {
      parts.push(`${location.city} - ${location.state}`)
    } else if (location.city) {
      parts.push(location.city)
    } else if (location.state) {
      parts.push(location.state)
    }
    if (location.zip) parts.push(`CEP: ${location.zip}`)

    return parts.length > 0 ? parts.join(', ') : null
  }

  if (isEditing) {
    return (
      <main className="main-container">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-dark)'
          }}>
            Editar Abrigo
          </h1>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--text-light)',
            marginTop: '0.25rem'
          }}>
            Atualize os dados do abrigo {shelter.name}
          </p>
        </div>

        <ShelterForm admins={admins} shelter={shelter} />
      </main>
    )
  }

  return (
    <main className="main-container">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--text-dark)'
            }}>
              {shelter.name}
            </h1>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: shelter.is_active ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: shelter.is_active ? 'var(--success-color)' : 'var(--danger-color)'
            }}>
              {shelter.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          {shelter.description && (
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-light)',
              marginTop: '0.5rem'
            }}>
              {shelter.description}
            </p>
          )}
        </div>

        {canEdit && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => router.push(`/dashboard/abrigos/${shelter.id}?mode=edit`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="fa-solid fa-pen"></i>
              Editar
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--danger-color)',
                borderColor: 'var(--danger-color)'
              }}
            >
              <i className="fa-solid fa-trash"></i>
              Excluir
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card">
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-dark)',
            marginBottom: '1.25rem'
          }}>
            Informações de Contato
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-light)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem'
              }}>
                Responsável
              </p>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--text-dark)',
                fontWeight: 500
              }}>
                {shelter.owner.name}
              </p>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--text-light)',
                marginTop: '0.125rem'
              }}>
                {shelter.owner.email}
              </p>
            </div>

            {shelter.phone && (
              <div>
                <p style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem'
                }}>
                  Telefone
                </p>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-dark)'
                }}>
                  {shelter.phone}
                </p>
              </div>
            )}

            {shelter.email && (
              <div>
                <p style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem'
                }}>
                  Email
                </p>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-dark)'
                }}>
                  {shelter.email}
                </p>
              </div>
            )}

            {shelter.website && (
              <div>
                <p style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem'
                }}>
                  Website
                </p>
                <a
                  href={shelter.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--primary-color)',
                    textDecoration: 'none'
                  }}
                >
                  {shelter.website}
                  <i className="fa-solid fa-external-link" style={{
                    fontSize: '0.75rem',
                    marginLeft: '0.35rem'
                  }}></i>
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-dark)',
            marginBottom: '1.25rem'
          }}>
            Localização
          </h2>

          <div>
            {getLocationString(shelter.location) ? (
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--text-dark)',
                lineHeight: 1.6
              }}>
                {getLocationString(shelter.location)}
              </p>
            ) : (
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-light)',
                fontStyle: 'italic'
              }}>
                Localização não definida
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-dark)'
          }}>
            Animais ({shelter.animalsCount})
          </h2>
          {shelter.animalsCount > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => router.push(`/dashboard/animais`)}
              style={{
                fontSize: '0.875rem',
                padding: '0.5rem 0.875rem'
              }}
            >
              Ver todos
            </button>
          )}
        </div>

        {shelter.recentAnimals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="fa-solid fa-paw" style={{
              fontSize: '2rem',
              color: 'var(--text-faded)',
              marginBottom: '0.5rem'
            }}></i>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
              Nenhum animal cadastrado neste abrigo
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.875rem'
          }}>
            {shelter.recentAnimals.map((animal: any) => (
              <div
                key={animal.id}
                onClick={() => router.push(`/dashboard/animais/${animal.id}`)}
                style={{
                  padding: '0.875rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-color)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <p style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--text-dark)',
                  marginBottom: '0.25rem'
                }}>
                  {animal.name}
                </p>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-light)'
                }}>
                  {animal.species?.name || 'Espécie não definida'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--text-dark)',
              marginBottom: '1rem'
            }}>
              Confirmar Exclusão
            </h3>
            <p style={{
              fontSize: '0.95rem',
              color: 'var(--text-dark)',
              marginBottom: '1.5rem'
            }}>
              Tem certeza que deseja excluir o abrigo <strong>{shelter.name}</strong>?
              {shelter.animalsCount > 0 && (
                <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--danger-color)' }}>
                  Este abrigo possui {shelter.animalsCount} {shelter.animalsCount === 1 ? 'animal cadastrado' : 'animais cadastrados'}.
                </span>
              )}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  background: 'var(--danger-color)',
                  borderColor: 'var(--danger-color)'
                }}
              >
                {isDeleting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Excluindo...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-trash"></i>
                    Confirmar Exclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
