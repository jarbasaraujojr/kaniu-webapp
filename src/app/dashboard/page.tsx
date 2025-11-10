import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // Redireciona para o painel principal
  redirect('/dashboard/painel')
}
