import Link from 'next/link'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--background-light)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <img
            src="/logo-kaniu.png"
            alt="Kaniu"
            style={{
              width: '240px',
              height: 'auto',
              marginBottom: '1.25rem',
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          />
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--primary-color)',
            lineHeight: 1.3
          }}>
            Sistema de Gestão de Animais
          </h2>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text-light)',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: 1.5
          }}>
            Conectando animais abandonados com famílias amorosas. Gerencie abrigos, cadastre animais e facilite adoções responsáveis.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '2rem'
        }}>
          <Link href="/animals" style={{
            padding: '0.65rem 1.5rem',
            background: 'var(--primary-color)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.95rem',
            textDecoration: 'none',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(90, 93, 127, 0.2)'
          }}>
            Ver Animais Disponíveis
          </Link>
          <Link href="/shelters" style={{
            padding: '0.65rem 1.5rem',
            background: 'var(--card-background)',
            color: 'var(--primary-color)',
            border: '2px solid var(--primary-color)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.95rem',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}>
            Encontrar Abrigos
          </Link>
        </div>

        <div style={{
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-color)',
          marginBottom: '2rem'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            marginBottom: '0.75rem'
          }}>
            Já tem uma conta ou quer se cadastrar?
          </p>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center'
          }}>
            <Link href="/login" style={{
              padding: '0.6rem 1.25rem',
              background: 'var(--card-background)',
              color: 'var(--primary-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              fontSize: '0.875rem',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}>
              Fazer Login
            </Link>
            <Link href="/register" style={{
              padding: '0.6rem 1.25rem',
              background: 'var(--primary-color)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              fontSize: '0.875rem',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}>
              Criar Conta
            </Link>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          paddingTop: '1.5rem',
          textAlign: 'left'
        }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{
              fontWeight: 600,
              fontSize: '1rem',
              marginBottom: '0.4rem',
              color: 'var(--text-dark)'
            }}>
              Para Abrigos
            </h3>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-light)',
              lineHeight: 1.5
            }}>
              Gerencie seus animais, processos de adoção e documentos em um só lugar.
            </p>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{
              fontWeight: 600,
              fontSize: '1rem',
              marginBottom: '0.4rem',
              color: 'var(--text-dark)'
            }}>
              Para Adotantes
            </h3>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-light)',
              lineHeight: 1.5
            }}>
              Encontre o pet perfeito, favorite animais e acompanhe sua solicitação.
            </p>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{
              fontWeight: 600,
              fontSize: '1rem',
              marginBottom: '0.4rem',
              color: 'var(--text-dark)'
            }}>
              Para Veterinários
            </h3>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-light)',
              lineHeight: 1.5
            }}>
              Registre consultas, vacinas e mantenha o histórico médico atualizado.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
