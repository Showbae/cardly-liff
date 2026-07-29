import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const reorderSchema = z.object({
  userId: z.string(),
  cardIds: z.array(z.string()).min(1),
})

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, cardIds } = reorderSchema.parse(body)

    const owned = await prisma.users_card.findMany({
      where: { user_id: userId, id: { in: cardIds } },
      select: { id: true },
    })
    if (owned.length !== cardIds.length) {
      return NextResponse.json({ error: 'cardIds must all belong to userId' }, { status: 400 })
    }

    await prisma.$transaction(
      cardIds.map((id, i) => prisma.users_card.update({ where: { id }, data: { sort_order: i } }))
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('[PATCH /api/cards/my/reorder]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
