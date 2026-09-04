import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * โปรที่บัตรในกระเป๋าของ user ใช้ได้จริง — อ่านคู่กับ docs/data-model.md
 *   card_scope = 'all_bank'       → ใช้ได้ทุกใบของธนาคารนั้น (promotion_cards ว่าง)
 *   card_scope = 'specific_cards' → ใช้ได้เฉพาะใบที่อยู่ใน promotion_cards
 * constraint trigger รับประกันว่าสองเคสนี้สอดคล้องกันเสมอ จึงเช็คแค่นี้พอ
 */
function myCardsFilter(bankIds: string[], cardIds: string[]): Prisma.promotionsWhereInput {
  return {
    OR: [
      { card_scope: 'all_bank', bank_id: { in: bankIds } },
      { card_scope: 'specific_cards', promotion_cards: { some: { card_id: { in: cardIds } } } },
    ],
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const categoryId = searchParams.get('categoryId')
    const bankId = searchParams.get('bankId')
    const status = searchParams.get('status') ?? 'active'
    const userId = searchParams.get('userId')?.trim()

    // เฉพาะบัตรฉัน — ส่ง userId มาเมื่อไหร่ถือว่าขอ scope นี้
    let myCards: Prisma.promotionsWhereInput | null = null
    if (userId) {
      if (!UUID_RE.test(userId)) {
        return NextResponse.json({ error: 'invalid userId' }, { status: 400 })
      }

      const userCards = await prisma.users_card.findMany({
        where: { user_id: userId },
        select: { card_id: true, credit_cards: { select: { bank_id: true } } },
      })

      const cardIds = userCards.map(c => c.card_id).filter((id): id is string => id != null)
      const bankIds = [...new Set(
        userCards.map(c => c.credit_cards?.bank_id).filter((id): id is string => id != null),
      )]

      // ยังไม่มีบัตรในกระเป๋า → ไม่มีโปรใบไหนใช้ได้
      if (cardIds.length === 0) return NextResponse.json([])

      myCards = myCardsFilter(bankIds, cardIds)
    }

    const promos = await prisma.promotions.findMany({
      where: {
        status,
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(bankId ? { bank_id: bankId } : {}),
        AND: [
          { OR: [{ end_date: null }, { end_date: { gte: new Date() } }] },
          ...(myCards ? [myCards] : []),
        ],
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
