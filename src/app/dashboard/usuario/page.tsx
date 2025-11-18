import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

interface AnimalAppearance {
  photo?: string | null
}

export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const userId = session.user.id

  // Buscar dados do usuário
  const [
    favoritesCount,
    reportsCount,
    adoptionRequestsCount,
    favorites,
    reports
  ] = await Promise.all([
    prisma.favorites.count({ where: { user_id: userId } }),
    prisma.reports.count({ where: { reporter_id: userId } }),
    prisma.adoption_events.count({ where: { adopter_id: userId } }),
    prisma.favorites.findMany({
      where: { user_id: userId },
      include: {
        animals: {
          include: {
            catalogs_animals_species_idTocatalogs: true,
            catalogs_animals_breed_idTocatalogs: true,
            shelters: true
          }
        }
      },
      take: 6,
      orderBy: { created_at: 'desc' }
    }),
    prisma.reports.findMany({
      where: { reporter_id: userId },
      include: {
        animals: true
      },
      take: 5,
      orderBy: { created_at: 'desc' }
    })
  ])

  return (
    <main className="main-container">
      <header className="header">
        <div className="header-content">
          <div>
            <div className="eyebrow">MEU PAINEL</div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'var(--text-dark)',
              margin: '0.5rem 0 0 0'
            }}>
              Olá, {session.user.name}!
            </h1>
            <p className="subtitle">
              Acompanhe seus favoritos, relatórios e solicitações de adoção
            </p>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-heart"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Favoritos</p>
            <h2 className="stat-value">{favoritesCount}</h2>
            <p className="stat-detail">Animais salvos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-search"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Relatórios</p>
            <h2 className="stat-value">{reportsCount}</h2>
            <p className="stat-detail">Perdidos/Encontrados</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-clipboard-check"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Solicitações</p>
            <h2 className="stat-value">{adoptionRequestsCount}</h2>
            <p className="stat-detail">De adoção</p>
          </div>
        </div>
      </div>

      {/* Favoritos Recentes */}
      {favorites.length > 0 && (
        <div className="card">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Meus Favoritos</h2>
            <Link href="/dashboard/usuario/favoritos" style={{
              color: 'var(--primary-color)',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              Ver todos →
            </Link>
          </header>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {favorites.map((fav) => (
              <Link
                key={fav.animals.id}
                href={`/dashboard/animais/${fav.animals.id}`}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '100%',
                  height: '140px',
                  background: 'var(--background-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {(fav.animals.appearance as AnimalAppearance | null)?.photo ? (
                    <img
                      src={(fav.animals.appearance as AnimalAppearance).photo || ''}
                      alt={fav.animals.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <i className="fa-solid fa-paw" style={{ fontSize: '2rem', color: 'var(--text-faded)' }}></i>
                  )}
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    marginBottom: '0.25rem'
                  }}>
                    {fav.animals.name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: 0 }}>
                    {fav.animals.catalogs_animals_species_idTocatalogs?.name} • {fav.animals.shelters.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Relatórios Recentes */}
      {reports.length > 0 && (
        <div className="card">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Meus Relatórios</h2>
            <Link href="/dashboard/usuario/relatorios" style={{
              color: 'var(--primary-color)',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              Ver todos →
            </Link>
          </header>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <span className={`status-pill ${report.report_type === 'lost' ? 'danger' : 'warning'}`}>
                        {report.report_type === 'lost' ? 'Perdido' : 'Encontrado'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {report.description}
                    </td>
                    <td>
                      <span className={`status-pill ${report.resolved ? 'success' : 'warning'}`}>
                        {report.resolved ? 'Resolvido' : 'Aberto'}
                      </span>
                    </td>
                    <td className="muted-text">
                      {new Date(report.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {favorites.length === 0 && reports.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <i className="fa-solid fa-heart" style={{ fontSize: '3rem', color: 'var(--text-faded)', marginBottom: '1rem' }}></i>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
            Bem-vindo ao Kaniu!
          </h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
            Comece navegando pelos animais disponíveis para adoção
          </p>
          <Link
            href="/dashboard/animais"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'var(--primary-color)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            Ver Animais Disponíveis
          </Link>
        </div>
      )}
    </main>
  )
}
