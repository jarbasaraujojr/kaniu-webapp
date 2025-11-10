import { prisma } from './db/prisma'

/**
 * Busca um status de animal no catálogo pelo nome
 */
export async function getAnimalStatusByName(name: string) {
  return await prisma.catalog.findFirst({
    where: {
      category: 'animal_status',
      name: name,
    },
  })
}

/**
 * Busca todos os status de animais disponíveis
 */
export async function getAllAnimalStatuses() {
  return await prisma.catalog.findMany({
    where: {
      category: 'animal_status',
      isActive: true,
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
  return await prisma.catalog.findFirst({
    where: {
      category,
      name,
      isActive: true,
    },
  })
}

/**
 * Busca todos os itens de uma categoria do catálogo
 */
export async function getCatalogByCategory(category: string) {
  return await prisma.catalog.findMany({
    where: {
      category,
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
  })
}
