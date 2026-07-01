import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const cards = await prisma.users_card.findMany({
      where: { user_id: userId },
      include: { credit_cards: { include: { banks: true } } },
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
    const { userId, cardId } = body
    if (!userId || !cardId) {
      return NextResponse.json({ error: 'userId and cardId are required' }, { status: 400 })
    }

    await prisma.users_card.create({
      data: { user_id: String(userId), card_id: String(cardId) },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/cards/my]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
