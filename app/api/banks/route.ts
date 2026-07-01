import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const banks = await prisma.banks.findMany({
      select: { id: true, name_th: true, name_eng: true, color: true, initial: true },
      orderBy: { id: 'asc' },
    })
    return NextResponse.json(banks)
  } catch (err) {
    console.error('[GET /api/banks]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
