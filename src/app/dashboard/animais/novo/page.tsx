import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NewAnimalForm } from './new-animal-form'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

export default async function NewAnimalPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Buscar catálogos necessários
  const [species, sexes, statuses, colors, furTypes] = await Promise.all([
    prisma.catalogs.findMany({
      where: {
        category: 'species',
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.catalogs.findMany({
      where: {
        category: 'sex',
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.catalogs.findMany({
      where: {
        category: 'animal_status',
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.catalogs.findMany({
      where: {
        category: 'color',
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.catalogs.findMany({
      where: {
        category: 'fur_type',
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ])

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Novo Animal</h1>
          <p className="text-gray-600 mt-2">
            Cadastre um novo animal no sistema preenchendo as informações abaixo
          </p>
        </div>
        <NewAnimalForm
          species={species}
          sexes={sexes}
          statuses={statuses}
          colors={colors}
          furTypes={furTypes}
        />
      </div>
    </DashboardLayout>
  )
}
