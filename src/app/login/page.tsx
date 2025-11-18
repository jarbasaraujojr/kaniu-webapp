'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou senha inválidos')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.')
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
        maxWidth: '400px',
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
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--primary-color)',
            marginBottom: '0.4rem'
          }}>
            Gestão de animais
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)'
          }}>
            Entre com suas credenciais para acessar o sistema
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

          <div style={{ marginBottom: '1rem' }}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>

          <div style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--text-light)'
          }}>
            Não tem uma conta?{' '}
            <Link href="/register" style={{
              color: 'var(--primary-color)',
              fontWeight: 500,
              textDecoration: 'none'
            }}>
              Cadastre-se
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
