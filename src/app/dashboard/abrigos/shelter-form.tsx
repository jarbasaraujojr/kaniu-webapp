'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

interface LocationData {
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zip?: string
}

const shelterSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  description: z.string().optional(),
  owner_id: z.string().uuid('Selecione um responsável válido'),

  // Localização
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),

  // Contatos
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),

  is_active: z.boolean().default(true),
})

type ShelterFormData = z.infer<typeof shelterSchema>

interface Admin {
  id: string
  name: string
  email: string
}

interface ShelterFormProps {
  admins: Admin[]
  shelter?: {
    id: string
    name: string
    description: string | null
    owner_id: string
    location: Prisma.JsonValue
    phone: string | null
    email: string | null
    website: string | null
    is_active: boolean
  }
}

export function ShelterForm({ admins, shelter }: ShelterFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!shelter

  // Parse location if editing
  const locationData = (shelter?.location as LocationData) || {}

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShelterFormData>({
    resolver: zodResolver(shelterSchema),
    defaultValues: isEditing ? {
      name: shelter.name,
      description: shelter.description || '',
      owner_id: shelter.owner_id,
      street: locationData.street || '',
      number: locationData.number || '',
      complement: locationData.complement || '',
      neighborhood: locationData.neighborhood || '',
      city: locationData.city || '',
      state: locationData.state || '',
      zip: locationData.zip || '',
      phone: shelter.phone || '',
      email: shelter.email || '',
      website: shelter.website || '',
      is_active: shelter.is_active,
    } : {
      is_active: true,
    },
  })

  const onSubmit = async (data: ShelterFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Construir objeto de localização
      const location = {
        street: data.street || null,
        number: data.number || null,
        complement: data.complement || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
      }

      // Remover campos vazios
      const payload = {
        name: data.name,
        description: data.description || null,
        owner_id: data.owner_id,
        location,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        is_active: data.is_active,
      }

      const url = isEditing ? `/api/shelters/${shelter.id}` : '/api/shelters'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar abrigo')
      }

      const result = await response.json()

      // Redirecionar para a página de detalhes
      router.push(`/dashboard/abrigos/${result.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar abrigo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--text-dark)',
          marginBottom: '1.25rem'
        }}>
          Informações Básicas
        </h2>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label htmlFor="name" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              Nome do Abrigo *
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className="input"
              placeholder="Ex: Abrigo Amigos dos Animais"
            />
            {errors.name && (
              <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              Descrição
            </label>
            <textarea
              {...register('description')}
              id="description"
              className="input"
              rows={4}
              placeholder="Descreva o abrigo, sua missão e atividades..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label htmlFor="owner_id" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              Responsável *
            </label>
            <select
              {...register('owner_id')}
              id="owner_id"
              className="input"
            >
              <option value="">Selecione um responsável</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} ({admin.email})
                </option>
              ))}
            </select>
            {errors.owner_id && (
              <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {errors.owner_id.message}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              {...register('is_active')}
              type="checkbox"
              id="is_active"
              style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
            />
            <label htmlFor="is_active" style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              cursor: 'pointer'
            }}>
              Abrigo ativo
            </label>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--text-dark)',
          marginBottom: '1.25rem'
        }}>
          Localização
        </h2>

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label htmlFor="street" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              Rua/Avenida
            </label>
            <input
              {...register('street')}
              type="text"
              id="street"
              className="input"
              placeholder="Ex: Rua das Flores"
            />
          </div>

          <div>
            <label htmlFor="number" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              Número
            </label>
            <input
              {...register('number')}
              type="text"
              id="number"
              className="input"
              placeholder="Ex: 123"
            />
          </div>

          <div>
            <label htmlFor="complement" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              Complemento
            </label>
            <input
              {...register('complement')}
              type="text"
              id="complement"
              className="input"
              placeholder="Ex: Sala 10"
            />
          </div>

          <div>
            <label htmlFor="neighborhood" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              Bairro
            </label>
            <input
              {...register('neighborhood')}
              type="text"
              id="neighborhood"
              className="input"
              placeholder="Ex: Centro"
            />
          </div>

          <div>
            <label htmlFor="city" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              Cidade
            </label>
            <input
              {...register('city')}
              type="text"
              id="city"
              className="input"
              placeholder="Ex: São Paulo"
            />
          </div>

          <div>
            <label htmlFor="state" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              Estado
            </label>
            <input
              {...register('state')}
              type="text"
              id="state"
              className="input"
              placeholder="Ex: SP"
              maxLength={2}
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div>
            <label htmlFor="zip" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              CEP
            </label>
            <input
              {...register('zip')}
              type="text"
              id="zip"
              className="input"
              placeholder="Ex: 01234-567"
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--text-dark)',
          marginBottom: '1.25rem'
        }}>
          Contatos
        </h2>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label htmlFor="phone" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              Telefone
            </label>
            <input
              {...register('phone')}
              type="tel"
              id="phone"
              className="input"
              placeholder="Ex: (11) 98765-4321"
            />
          </div>

          <div>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="input"
              placeholder="Ex: contato@abrigo.com"
            />
            {errors.email && (
              <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="website" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem'
            }}>
              Website
            </label>
            <input
              {...register('website')}
              type="url"
              id="website"
              className="input"
              placeholder="Ex: https://www.abrigo.com"
            />
            {errors.website && (
              <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {errors.website.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem'
        }}>
          <p style={{ color: 'var(--danger-color)', fontSize: '0.875rem' }}>
            {error}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              {isEditing ? 'Salvando...' : 'Criando...'}
            </>
          ) : (
            <>
              <i className="fa-solid fa-check"></i>
              {isEditing ? 'Salvar Alterações' : 'Criar Abrigo'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
