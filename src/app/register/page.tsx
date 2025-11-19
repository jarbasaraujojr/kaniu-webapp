'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta')
        return
      }

      // Fazer login automático após registro
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (signInResult?.error) {
        // Se houver erro no login, redirecionar para página de login
        router.push('/login')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background-light)',
      padding: '1.5rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '1.75rem'
      }}>
        <div style={{
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <img
            src="/logo-kaniu.png"
            alt="Kaniu"
            style={{
              width: '160px',
              height: 'auto',
              marginBottom: '1.25rem',
              marginLeft: 'auto',
              marginRight: 'auto',
              display: 'block'
            }}
          />
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)'
          }}>
            Preencha os dados abaixo para criar sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-md)',
              color: '#DC2626',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
          <div style={{ marginBottom: '0.85rem' }}>
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="João Silva"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.65rem',
              background: 'var(--primary-color)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
              marginBottom: '1rem'
            }}
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </button>

          <div style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--text-light)'
          }}>
            Já tem uma conta?{' '}
            <Link href="/login" style={{
              color: 'var(--primary-color)',
              fontWeight: 500,
              textDecoration: 'none'
            }}>
              Faça login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
