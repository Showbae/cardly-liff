import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { categorySchema } from '@/lib/validations/catalog'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await ctx.params
    const data = categorySchema.parse(await req.json())

    const exists = await prisma.categories.findUnique({ where: { id } })
    if (!exists) return NextResponse.json({ error: 'ไม่พบหมวด' }, { status: 404 })

    const updated = await prisma.categories.update({
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
    console.error('[PUT /api/admin/categories/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await ctx.params

    const category = await prisma.categories.findUnique({
      where: { id },
      include: {
        _count: {
          select: { merchants: true, promotions: true, card_base_benefit: true },
        },
      },
    })
    if (!category) return NextResponse.json({ error: 'ไม่พบหมวด' }, { status: 404 })

    // หมวดเป็นแกนที่เชื่อม merchants ↔ promotions ↔ card_base_benefit
    // ลบหมวดที่ยังมีคนใช้ = ตัดสายที่ระบบแนะนำบัตรเดินอยู่
    const { merchants, promotions, card_base_benefit } = category._count
    const total = merchants + promotions + card_base_benefit
    if (total > 0) {
      return NextResponse.json(
        {
          error:
            `ลบไม่ได้ — ยังมี ร้านค้า ${merchants} · โปรโมชัน ${promotions} · ` +
            `อัตราตอบแทน ${card_base_benefit} อ้างถึงหมวดนี้อยู่`,
        },
        { status: 409 },
      )
    }

    await prisma.categories.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/categories/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
