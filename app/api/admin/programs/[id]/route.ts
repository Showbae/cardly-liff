import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { pointProgramSchema } from '@/lib/validations/card'
import { recomputeProgramRates } from '@/lib/recompute'

/** แก้ได้ทีละฟิลด์ ไม่ต้องส่งมาครบ */
const patchSchema = pointProgramSchema.partial()

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await ctx.params
    const data = patchSchema.parse(await req.json())

    const before = await prisma.point_programs.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: 'ไม่พบโปรแกรม' }, { status: 404 })

    const updated = await prisma.point_programs.update({
      where: { id },
      data: { ...data, updated_date: new Date(), updated_by: auth.email },
    })

    // ค่าแต้มเปลี่ยน → effective_rate_pct ของทุกบัตรในโปรแกรมนี้ผิดหมด
    // ต้องคำนวณใหม่ทันที ไม่ใช่รอให้ใครไปแก้ทีละใบ (งาน 4.2)
    let recomputed = 0
    if (
      data.point_value_thb !== undefined &&
      Number(data.point_value_thb) !== Number(before.point_value_thb)
    ) {
      recomputed = await recomputeProgramRates(id, auth.email)
    }

    return NextResponse.json({
      ...updated,
      point_value_thb: Number(updated.point_value_thb),
      recomputed,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: 'ธนาคารนี้มีโปรแกรมชื่อนี้อยู่แล้ว' }, { status: 409 })
    }
    console.error('[PATCH /api/admin/programs/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await ctx.params

    // ลบโปรแกรมที่ยังมีบัตรผูกอยู่ไม่ได้ — บัตรพวกนั้นจะกลายเป็น
    // "บัตรเงินคืน" ทันทีทั้งที่จริงเป็นบัตรสะสมแต้ม แล้วอัตราจะเพี้ยนเงียบ ๆ
    const cards = await prisma.credit_cards.count({ where: { point_program_id: id } })
    if (cards > 0) {
      return NextResponse.json(
        { error: `ลบไม่ได้ — ยังมีบัตร ${cards} ใบผูกกับโปรแกรมนี้อยู่ ต้องย้ายบัตรออกก่อน` },
        { status: 409 },
      )
    }

    await prisma.point_programs.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/programs/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
