import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function HistoricoPage() {
  return (
    <DashboardLayout>
      <main className="main-container">
        <header className="header" style={{ padding: '1.75rem' }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-dark)',
            margin: 0
          }}>
            Histórico
          </h1>
          <p style={{
            color: 'var(--text-light)',
            fontSize: '0.95rem',
            marginTop: '0.5rem'
          }}>
            Registro de eventos e atividades
          </p>
        </header>

        <div style={{ padding: '1.75rem' }}>
          <div className="card">
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              Funcionalidade em desenvolvimento...
            </p>
          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}
