import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const usersCardId = req.nextUrl.searchParams.get('usersCardId')
  if (!usersCardId || !UUID_RE.test(usersCardId)) {
    return NextResponse.json({ error: 'usersCardId required' }, { status: 400 })
  }
  try {
    const txs = await prisma.transactions.findMany({
      where: { users_card_id: usersCardId },
      orderBy: { spent_at: 'desc' },
      select: {
        id:       true,
        amount:   true,
        spent_at: true,
        note:     true,
        merchants: {
          select: {
            id:       true,
            name_th:  true,
            name_eng: true,
            categories: { select: { icon: true } },
          },
        },
      },
    })
    return NextResponse.json(txs.map(tx => ({ ...tx, amount: Number(tx.amount) })))
  } catch (error) {
    console.error('[GET /api/transactions]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

const createSchema = z.object({
  usersCardId: z.string().regex(UUID_RE, 'invalid uuid'),
  merchantId:  z.string().regex(UUID_RE, 'invalid uuid').optional(),
  amount:      z.number().positive().max(999_999.99),
  spentAt:     z.string().datetime().optional(),
  note:        z.string().max(255).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const tx = await prisma.transactions.create({
      data: {
        users_card_id: data.usersCardId,
        merchant_id:   data.merchantId ?? null,
        amount:        data.amount,
        spent_at:      data.spentAt ? new Date(data.spentAt) : new Date(),
        note:          data.note ?? null,
      },
      select: {
        id:           true,
        amount:       true,
        spent_at:     true,
        users_card_id: true,
        merchant_id:  true,
      },
    })

    return NextResponse.json({
      success: true,
      transaction: {
        ...tx,
        amount: Number(tx.amount),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('[POST /api/transactions]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
