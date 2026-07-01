import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const bankId = req.nextUrl.searchParams.get('bankId')
    const cards = await prisma.credit_cards.findMany({
      where: bankId ? { bank_id: bankId } : undefined,
      select: { id: true, card_name: true, card_tier: true, bank_id: true },
      orderBy: { card_name: 'asc' },
    })
    return NextResponse.json(cards)
  } catch (error) {
    console.error('[GET /api/cards/catalog]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
