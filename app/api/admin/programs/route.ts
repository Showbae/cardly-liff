import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { pointProgramSchema } from '@/lib/validations/card'

/**
 * โปรแกรมสะสมแต้ม — ต้นน้ำของ `effective_rate_pct` ทุกแถวในระบบ
 *
 * ⚠️ ทุก route ในนี้ต้องเรียก `requireAdmin` เอง — middleware เช็กแค่ว่ามี
 *    cookie ไม่ได้ตรวจว่าใช้ได้จริง (ดู lib/admin-guard.ts)
 */

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const programs = await prisma.point_programs.findMany({
      include: {
        banks: { select: { name_th: true, name_eng: true, color: true } },
        _count: { select: { credit_cards: true } },
      },
      orderBy: [{ bank_id: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(
      programs.map(p => ({
        ...p,
        point_value_thb: Number(p.point_value_thb),
        card_count: p._count.credit_cards,
      })),
    )
  } catch (err) {
    console.error('[GET /api/admin/programs]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const data = pointProgramSchema.parse(await req.json())

    const created = await prisma.point_programs.create({
      data: { ...data, created_by: auth.email },
    })

    return NextResponse.json(
      { ...created, point_value_thb: Number(created.point_value_thb) },
      { status: 201 },
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    // unique (bank_id, name) — ธนาคารเดียวมีโปรแกรมชื่อซ้ำไม่ได้
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'ธนาคารนี้มีโปรแกรมชื่อนี้อยู่แล้ว' },
        { status: 409 },
      )
    }
    console.error('[POST /api/admin/programs]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
