import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const createSchema = z.object({
  userId: z.string(),
  cardId: z.string(),
  last_four: z.string().length(4).regex(/^\d{4}$/).nullable().optional(),
  credit_limit: z.number().positive().nullable().optional(),
  billing_cycle_day: z.number().int().min(1).max(28).nullable().optional(),
  billing_last_day: z.boolean().nullable().optional(),
  payment_due_day: z.number().int().min(1).max(31).nullable().optional(),
  payment_due_last_day: z.boolean().nullable().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const cards = await prisma.users_card.findMany({
      where: { user_id: userId },
      include: { credit_cards: { include: { banks: true } } },
      orderBy: [{ sort_order: 'asc' }, { created_date: 'asc' }],
    })

    return NextResponse.json(cards)
  } catch (err) {
    console.error('[GET /api/cards/my]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, cardId, last_four, credit_limit, billing_cycle_day, billing_last_day, payment_due_day, payment_due_last_day } = createSchema.parse(body)

    const maxOrder = await prisma.users_card.aggregate({
      where: { user_id: userId },
      _max: { sort_order: true },
    })

    await prisma.users_card.create({
      data: {
        user_id: userId,
        card_id: cardId,
        sort_order: (maxOrder._max.sort_order ?? -1) + 1,
        ...(last_four != null && { last_four }),
        ...(credit_limit != null && { credit_limit }),
        ...(billing_cycle_day != null && { billing_cycle_day }),
        ...(billing_last_day != null && { billing_last_day }),
        ...(payment_due_day != null && { payment_due_day }),
        ...(payment_due_last_day != null && { payment_due_last_day }),
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    console.error('[POST /api/cards/my]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
