import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: { sort_order: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (err) {
    console.error('[GET /api/categories]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
