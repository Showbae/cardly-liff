import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const categoryId = searchParams.get('categoryId')
    const bankId = searchParams.get('bankId')
    const status = searchParams.get('status') ?? 'active'

    const promos = await prisma.promotions.findMany({
      where: {
        status,
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(bankId ? { bank_id: bankId } : {}),
        OR: [{ end_date: null }, { end_date: { gte: new Date() } }],
      },
      include: {
        banks: true,
        categories: true,
        promotion_merchants: { include: { merchants: true } },
      },
      orderBy: { end_date: 'asc' },
    })

    const data = promos.map(p => ({
      ...p,
      benefit_value: p.benefit_value != null ? Number(p.benefit_value) : null,
      min_spend:     p.min_spend     != null ? Number(p.min_spend)     : null,
      max_cap:       p.max_cap       != null ? Number(p.max_cap)       : null,
    }))

    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/promotions]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
