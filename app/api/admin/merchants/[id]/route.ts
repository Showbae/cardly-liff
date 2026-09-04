import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { merchantSchema } from '@/lib/validations/catalog'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await ctx.params
    const data = merchantSchema.parse(await req.json())

    const exists = await prisma.merchants.findUnique({ where: { id } })
    if (!exists) return NextResponse.json({ error: 'ไม่พบร้านค้า' }, { status: 404 })

    const updated = await prisma.merchants.update({
      where: { id },
      data: { ...data, updated_date: new Date(), updated_by: auth.email },
    })

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' · ') },
        { status: 400 },
      )
    }
    console.error('[PUT /api/admin/merchants/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await ctx.params

    const merchant = await prisma.merchants.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true, promotion_merchants: true } } },
    })
    if (!merchant) return NextResponse.json({ error: 'ไม่พบร้านค้า' }, { status: 404 })

    // FK เป็น NoAction ไม่ใช่ Cascade — DB จะปฏิเสธเองอยู่แล้ว แต่ error
    // ของ Postgres อ่านไม่รู้เรื่อง · ตอบเป็นภาษาคนพร้อมบอกว่าติดอะไรอยู่
    const { transactions, promotion_merchants } = merchant._count
    if (transactions > 0 || promotion_merchants > 0) {
      return NextResponse.json(
        {
          error:
            `ลบไม่ได้ — มีรายการใช้จ่าย ${transactions} รายการ ` +
            `และโปรโมชัน ${promotion_merchants} รายการอ้างถึงร้านนี้อยู่`,
        },
        { status: 409 },
      )
    }

    await prisma.merchants.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/merchants/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
