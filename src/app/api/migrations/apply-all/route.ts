import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST() {
  try {
    const steps: string[] = []

    // Migration 1: Add shelter_id to catalogs
    steps.push('📦 Migration 1: Adding shelter_id to catalogs...')

    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "catalogs" ADD COLUMN IF NOT EXISTS "shelter_id" UUID')
      steps.push('✓ Added shelter_id column')
    } catch (e) {
      steps.push(`⚠️ shelter_id column might already exist: ${e}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'catalogs_shelter_id_fkey'
          ) THEN
            ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_shelter_id_fkey"
              FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `)
      steps.push('✓ Added shelter_id foreign key')
    } catch (e) {
      steps.push(`⚠️ Foreign key might already exist: ${e}`)
    }

    try {
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "catalogs_shelter_id_idx" ON "catalogs"("shelter_id")')
      steps.push('✓ Created shelter_id index')
    } catch (e) {
      steps.push(`⚠️ Index might already exist: ${e}`)
    }

    try {
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "catalogs_category_shelter_id_idx" ON "catalogs"("category", "shelter_id")')
      steps.push('✓ Created category_shelter_id index')
    } catch (e) {
      steps.push(`⚠️ Index might already exist: ${e}`)
    }

    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "catalogs" DROP CONSTRAINT IF EXISTS "catalogs_category_name_key"')
      steps.push('✓ Dropped old unique constraint')
    } catch (e) {
      steps.push(`⚠️ Old constraint might not exist: ${e}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'catalogs_category_name_shelter_id_key'
          ) THEN
            ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_category_name_shelter_id_key"
              UNIQUE ("category", "name", "shelter_id");
          END IF;
        END $$;
      `)
      steps.push('✓ Created new unique constraint with shelter_id')
    } catch (e) {
      steps.push(`⚠️ Unique constraint might already exist: ${e}`)
    }

    // Migration 2: Replace appearance with colors and fur type
    steps.push('\n📦 Migration 2: Replacing appearance with colors and fur type...')

    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "animals" ADD COLUMN IF NOT EXISTS "fur_type_id" INTEGER')
      steps.push('✓ Added fur_type_id column')
    } catch (e) {
      steps.push(`⚠️ fur_type_id column might already exist: ${e}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'animals_fur_type_id_fkey'
          ) THEN
            ALTER TABLE "animals" ADD CONSTRAINT "animals_fur_type_id_fkey"
              FOREIGN KEY ("fur_type_id") REFERENCES "catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$;
      `)
      steps.push('✓ Added fur_type_id foreign key')
    } catch (e) {
      steps.push(`⚠️ Foreign key might already exist: ${e}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "animal_colors" (
          "animal_id" UUID NOT NULL,
          "color_id" INTEGER NOT NULL,
          CONSTRAINT "animal_colors_pkey" PRIMARY KEY ("animal_id", "color_id"),
          CONSTRAINT "animal_colors_animal_id_fkey"
            FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "animal_colors_color_id_fkey"
            FOREIGN KEY ("color_id") REFERENCES "catalogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `)
      steps.push('✓ Created animal_colors table')
    } catch (e) {
      steps.push(`⚠️ animal_colors table might already exist: ${e}`)
    }

    try {
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "animal_colors_animal_id_idx" ON "animal_colors"("animal_id")')
      steps.push('✓ Created animal_colors_animal_id index')
    } catch (e) {
      steps.push(`⚠️ Index might already exist: ${e}`)
    }

    try {
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "animal_colors_color_id_idx" ON "animal_colors"("color_id")')
      steps.push('✓ Created animal_colors_color_id index')
    } catch (e) {
      steps.push(`⚠️ Index might already exist: ${e}`)
    }

    try {
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "animals_fur_type_id_idx" ON "animals"("fur_type_id")')
      steps.push('✓ Created animals_fur_type_id index')
    } catch (e) {
      steps.push(`⚠️ Index might already exist: ${e}`)
    }

    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "animals" DROP COLUMN IF EXISTS "appearance"')
      steps.push('✓ Dropped appearance column')
    } catch (e) {
      steps.push(`⚠️ appearance column might not exist: ${e}`)
    }

    steps.push('\n✅ All migrations completed!')

    return NextResponse.json({
      success: true,
      message: 'Migrations applied successfully',
      steps
    })
  } catch (error) {
    console.error('[MIGRATIONS] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to apply migrations',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
