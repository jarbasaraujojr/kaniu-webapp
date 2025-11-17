import { prisma } from './db/prisma'

/**
 * Busca um status de animal no catálogo pelo nome
 */
export async function getAnimalStatusByName(name: string) {
  return await prisma.catalogs.findFirst({
    where: {
      category: 'status',
      name: name,
    },
  })
}

/**
 * Busca todos os status de animais disponíveis
 */
export async function getAllAnimalStatuses() {
  return await prisma.catalogs.findMany({
    where: {
      category: 'status',
      is_active: true,
    },
    orderBy: {
      name: 'asc',
    },
  })
}

/**
 * Busca um item do catálogo por categoria e nome
 */
export async function getCatalogItem(category: string, name: string) {
  return await prisma.catalogs.findFirst({
    where: {
      category,
      name,
      is_active: true,
    },
  })
}

/**
 * Busca todos os itens de uma categoria do catálogo
 */
export async function getCatalogByCategory(category: string) {
  return await prisma.catalogs.findMany({
    where: {
      category,
      is_active: true,
    },
    orderBy: {
      name: 'asc',
    },
  })
}
