import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { creditCardSchema } from '@/lib/validations/card'

/** แถวเดียวของแคตตาล็อกบัตร พร้อมตัวเลขสรุปที่หน้า list ต้องใช้ */
export interface AdminCardRow {
  id: string
  bank_id: string | null
  card_name: string | null
  card_tier: string | null
  network: string | null
  annual_fee: number | null
  status: string
  program_name: string | null
  rate_count: number
  perk_count: number
  best_rate: number | null
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const q = req.nextUrl.searchParams.get('q')?.trim()
    const bank = req.nextUrl.searchParams.get('bank')?.trim()

    const cards = await prisma.credit_cards.findMany({
      where: {
        ...(bank ? { bank_id: bank } : {}),
        ...(q
          ? {
              OR: [
                { card_name: { contains: q, mode: 'insensitive' } },
                { bank_id: { contains: q, mode: 'insensitive' } },
                { card_tier: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        point_programs: { select: { name: true } },
        card_base_benefit: { select: { effective_rate_pct: true } },
        _count: { select: { card_perks: true } },
      },
      orderBy: [{ bank_id: 'asc' }, { card_name: 'asc' }],
    })

    const rows: AdminCardRow[] = cards.map(c => ({
      id: c.id,
      bank_id: c.bank_id,
      card_name: c.card_name,
      card_tier: c.card_tier,
      network: c.network,
      annual_fee: c.annual_fee == null ? null : Number(c.annual_fee),
      status: c.status,
      program_name: c.point_programs?.name ?? null,
      rate_count: c.card_base_benefit.length,
      perk_count: c._count.card_perks,
      best_rate: c.card_base_benefit.length
        ? Math.max(...c.card_base_benefit.map(b => Number(b.effective_rate_pct)))
        : null,
    }))

    return NextResponse.json(rows)
  } catch (err) {
    console.error('[GET /api/admin/cards]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const data = creditCardSchema.parse(await req.json())

    // ชื่อบัตรซ้ำในธนาคารเดียวกันมักเป็นการกรอกซ้ำ ไม่ใช่บัตรคนละใบ
    // (ถ้าธนาคารออกทั้ง VISA และ Master จริง ให้ใส่ชื่อแยกให้ต่างกัน)
    const dup = await prisma.credit_cards.findFirst({
      where: { bank_id: data.bank_id, card_name: data.card_name },
    })
    if (dup) {
      return NextResponse.json(
        { error: `${data.bank_id} มีบัตรชื่อ "${data.card_name}" อยู่แล้ว` },
        { status: 409 },
      )
    }

    const created = await prisma.credit_cards.create({
      data: { ...data, created_by: auth.email },
    })

    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    console.error('[POST /api/admin/cards]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
