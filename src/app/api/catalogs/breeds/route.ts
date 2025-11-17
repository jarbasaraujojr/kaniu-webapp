import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parent_id')

    if (!parentId) {
      return NextResponse.json(
        { error: 'parent_id é obrigatório' },
        { status: 400 }
      )
    }

    const breeds = await prisma.catalogs.findMany({
      where: {
        category: 'breed',
        parent_id: Number(parentId),
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ breeds })
  } catch (error) {
    console.error('Erro ao buscar raças:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar raças' },
      { status: 500 }
    )
  }
}
