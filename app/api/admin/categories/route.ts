import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { categorySchema } from '@/lib/validations/catalog'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const categories = await prisma.categories.findMany({
      include: {
        _count: {
          select: { merchants: true, promotions: true, card_base_benefit: true },
        },
      },
      orderBy: [{ sort_order: 'asc' }, { name_th: 'asc' }],
    })

    return NextResponse.json(
      categories.map(c => ({
        ...c,
        merchant_count: c._count.merchants,
        promo_count: c._count.promotions,
        rate_count: c._count.card_base_benefit,
      })),
    )
  } catch (err) {
    console.error('[GET /api/admin/categories]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const data = categorySchema.parse(await req.json())

    const dup = await prisma.categories.findFirst({ where: { name_th: data.name_th } })
    if (dup) {
      return NextResponse.json({ error: `มีหมวด "${data.name_th}" อยู่แล้ว` }, { status: 409 })
    }

    const created = await prisma.categories.create({
      data: { ...data, created_by: auth.email },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' · ') },
        { status: 400 },
      )
    }
    console.error('[POST /api/admin/categories]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
