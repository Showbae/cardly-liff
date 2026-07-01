import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, displayName, pictureUrl } = body
    if (!userId || !displayName) {
      return NextResponse.json({ error: 'userId and displayName are required' }, { status: 400 })
    }

    const user = await prisma.users.upsert({
      where: { line_id: String(userId) },
      update: {
        display_name: String(displayName),
        picture_url: String(pictureUrl ?? ''),
        last_login: new Date(),
        updated_date: new Date(),
      },
      create: {
        line_id: String(userId),
        display_name: String(displayName),
        picture_url: String(pictureUrl ?? ''),
        last_login: new Date(),
      },
    })

    return NextResponse.json(user)
  } catch (err) {
    console.error('[POST /api/auth/line]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
