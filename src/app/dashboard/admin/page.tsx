import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  // Buscar estatísticas globais
  const [
    totalShelters,
    activeShelters,
    totalAnimals,
    availableAnimals,
    adoptedAnimals,
    totalUsers,
  ] = await Promise.all([
    prisma.shelter.count(),
    prisma.shelter.count({ where: { isActive: true } }),
    prisma.animal.count({ where: { deletedAt: null } }),
    prisma.animal.count({
      where: {
        deletedAt: null,
        status: { name: 'Disponível' }
      }
    }),
    prisma.animal.count({
      where: {
        deletedAt: null,
        status: { name: 'Adotado' }
      }
    }),
    prisma.user.count({ where: { deletedAt: null } }),
  ])

  // Buscar abrigos com contagem de animais
  const sheltersWithAnimals = await prisma.shelter.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: { animals: true }
      }
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  })

  const adoptionRate = totalAnimals > 0 ? ((adoptedAnimals / totalAnimals) * 100).toFixed(1) : '0'

  return (
    <main className="main-container">
      <header className="header">
        <div className="header-content">
          <div>
            <div className="eyebrow">PAINEL ADMINISTRATIVO</div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'var(--text-dark)',
              margin: '0.5rem 0 0 0'
            }}>
              Dashboard Global
            </h1>
            <p className="subtitle">
              Visão geral de todos os abrigos e animais do sistema
            </p>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-building"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Abrigos Cadastrados</p>
            <h2 className="stat-value">{totalShelters}</h2>
            <p className="stat-detail">{activeShelters} ativos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-paw"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Total de Animais</p>
            <h2 className="stat-value">{totalAnimals}</h2>
            <p className="stat-detail">Em todos os abrigos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-heart"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Disponíveis</p>
            <h2 className="stat-value">{availableAnimals}</h2>
            <p className="stat-detail">Para adoção</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-house"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Adotados</p>
            <h2 className="stat-value">{adoptedAnimals}</h2>
            <p className="stat-detail">{adoptionRate}% taxa de adoção</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Usuários</p>
            <h2 className="stat-value">{totalUsers}</h2>
            <p className="stat-detail">Cadastrados</p>
          </div>
        </div>
      </div>

      {/* Abrigos Recentes */}
      <div className="card">
        <header>
          <h2>Abrigos Recentes</h2>
        </header>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Animais</th>
                <th>Status</th>
                <th>Data de Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {sheltersWithAnimals.map((shelter) => (
                <tr key={shelter.id}>
                  <td style={{ fontWeight: 600 }}>{shelter.name}</td>
                  <td>{shelter._count.animals}</td>
                  <td>
                    <span className={`status-pill ${shelter.isActive ? 'success' : 'danger'}`}>
                      {shelter.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="muted-text">
                    {new Date(shelter.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
