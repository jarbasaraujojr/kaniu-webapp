import { prisma } from './prisma'

/**
 * Soft delete utilities for restoring and permanently deleting records
 */

/**
 * Restore a soft-deleted user
 */
export async function restoreUser(id: string) {
  return prisma.users.updateMany({
    where: {
      id,
      deleted_at: { not: null },
    },
    data: {
      deleted_at: null,
    },
  })
}

/**
 * Restore a soft-deleted shelter
 */
export async function restoreShelter(id: string) {
  return prisma.shelters.updateMany({
    where: {
      id,
      deleted_at: { not: null },
    },
    data: {
      deleted_at: null,
    },
  })
}

/**
 * Restore a soft-deleted animal
 */
export async function restoreAnimal(id: string) {
  return prisma.animals.updateMany({
    where: {
      id,
      deleted_at: { not: null },
    },
    data: {
      deleted_at: null,
    },
  })
}

/**
 * Find all soft-deleted users
 */
export async function findDeletedUsers() {
  return prisma.users.findMany({
    where: {
      deleted_at: { not: null },
    },
  })
}

/**
 * Find all soft-deleted shelters
 */
export async function findDeletedShelters() {
  return prisma.shelters.findMany({
    where: {
      deleted_at: { not: null },
    },
  })
}

/**
 * Find all soft-deleted animals
 */
export async function findDeletedAnimals() {
  return prisma.animals.findMany({
    where: {
      deleted_at: { not: null },
    },
  })
}

/**
 * Permanently delete a user (hard delete)
 * Use with caution - this cannot be undone
 */
export async function hardDeleteUser(id: string) {
  // First, we need to bypass the middleware by using raw query
  return prisma.$executeRaw`DELETE FROM users WHERE id = ${id}::uuid`
}

/**
 * Permanently delete a shelter (hard delete)
 * Use with caution - this cannot be undone
 */
export async function hardDeleteShelter(id: string) {
  return prisma.$executeRaw`DELETE FROM shelters WHERE id = ${id}::uuid`
}

/**
 * Permanently delete an animal (hard delete)
 * Use with caution - this cannot be undone
 */
export async function hardDeleteAnimal(id: string) {
  return prisma.$executeRaw`DELETE FROM animals WHERE id = ${id}::uuid`
}

/**
 * Clean up old soft-deleted records (older than specified days)
 */
export async function cleanupOldDeletedRecords(daysOld: number = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const results = await Promise.all([
    prisma.$executeRaw`DELETE FROM users WHERE deleted_at IS NOT NULL AND deleted_at < ${cutoffDate}`,
    prisma.$executeRaw`DELETE FROM shelters WHERE deleted_at IS NOT NULL AND deleted_at < ${cutoffDate}`,
    prisma.$executeRaw`DELETE FROM animals WHERE deleted_at IS NOT NULL AND deleted_at < ${cutoffDate}`,
  ])

  return {
    usersDeleted: results[0],
    sheltersDeleted: results[1],
    animalsDeleted: results[2],
  }
}
