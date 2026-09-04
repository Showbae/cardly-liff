import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { merchantSchema } from '@/lib/validations/catalog'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const merchants = await prisma.merchants.findMany({
      include: {
        categories: { select: { name_th: true, icon: true } },
        _count: { select: { transactions: true, promotion_merchants: true } },
      },
      orderBy: { name_th: 'asc' },
    })

    return NextResponse.json(
      merchants.map(m => ({
        ...m,
        tx_count: m._count.transactions,
        promo_count: m._count.promotion_merchants,
      })),
    )
  } catch (err) {
    console.error('[GET /api/admin/merchants]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const data = merchantSchema.parse(await req.json())

    // ชื่อร้านซ้ำมักเป็นการกรอกซ้ำ ไม่ใช่ร้านคนละร้าน — และร้านซ้ำทำให้
    // ยอดใช้จ่ายของ user กระจายไปสองแถวจนสถิติต่อร้านผิด
    const dup = await prisma.merchants.findFirst({ where: { name_th: data.name_th } })
    if (dup) {
      return NextResponse.json({ error: `มีร้าน "${data.name_th}" อยู่แล้ว` }, { status: 409 })
    }

    const created = await prisma.merchants.create({
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
    console.error('[POST /api/admin/merchants]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
