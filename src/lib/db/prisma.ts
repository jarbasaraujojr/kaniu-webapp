import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // Soft delete middleware
  client.$use(async (params, next) => {
    // Models with soft delete support
    const softDeleteModels = ['User', 'Shelter', 'Animal']

    if (!softDeleteModels.includes(params.model || '')) {
      return next(params)
    }

    // Ensure params.args exists
    if (!params.args) {
      params.args = {}
    }

    // Convert delete to soft delete (update with deletedAt)
    if (params.action === 'delete') {
      params.action = 'update'
      params.args.data = { deletedAt: new Date() }
    }

    // Convert deleteMany to soft delete (updateMany with deletedAt)
    if (params.action === 'deleteMany') {
      params.action = 'updateMany'
      if (params.args.data !== undefined) {
        params.args.data.deletedAt = new Date()
      } else {
        params.args.data = { deletedAt: new Date() }
      }
    }

    // Exclude soft deleted records from queries
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.action = 'findFirst'
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      }
    }

    if (params.action === 'findMany') {
      if (params.args.where) {
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null
        }
      } else {
        params.args.where = { deletedAt: null }
      }
    }

    // Exclude soft deleted records from count
    if (params.action === 'count') {
      if (params.args.where) {
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null
        }
      } else {
        params.args.where = { deletedAt: null }
      }
    }

    // Exclude soft deleted records from update
    if (params.action === 'update') {
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      }
    }

    if (params.action === 'updateMany') {
      if (params.args.where !== undefined) {
        params.args.where.deletedAt = null
      } else {
        params.args.where = { deletedAt: null }
      }
    }

    return next(params)
  })

  return client
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
