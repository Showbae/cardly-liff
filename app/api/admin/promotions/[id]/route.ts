import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { promotionSchema } from '@/lib/validations/promotion'
import { promoEffectiveRatePct } from '@/lib/promo-rate'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await ctx.params
    const promo = await prisma.promotions.findUnique({
      where: { id },
      include: { promotion_cards: true, promotion_merchants: true },
    })
    if (!promo) return NextResponse.json({ error: 'ไม่พบโปรโมชัน' }, { status: 404 })
    return NextResponse.json(promo)
  } catch (err) {
    console.error('[GET /api/admin/promotions/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * บันทึกทั้งโปรในทรานแซกชันเดียว — ตัวโปร + บัตรที่เข้าข่าย + ร้านที่ร่วม
 *
 * ── ทำไมลบแล้วสร้างใหม่สำหรับตารางเชื่อม ────────────────────────────────
 *
 * `promotion_cards` / `promotion_merchants` เก็บแค่ความสัมพันธ์ ไม่มีข้อมูล
 * ของตัวเองที่จะเสียไป (ต่างจาก `card_base_benefit` ที่มี `created_by` ของ
 * แถวนั้นเป็นประวัติจริง) — sync ด้วยการแทนที่ทั้งชุดจึงง่ายกว่าและไม่เสียอะไร
 *
 * ⚠️ constraint trigger ของ `card_scope` เป็นแบบ DEFERRABLE INITIALLY DEFERRED
 * มันจึงเช็กตอน COMMIT ไม่ใช่ตอน insert — ลำดับ delete/insert ข้างในไม่สำคัญ
 * แต่ทั้งหมด **ต้องอยู่ทรานแซกชันเดียวกัน** ไม่งั้นจะพังกลางทาง
 */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await ctx.params
    const { card_ids, merchant_ids, ...promo } = promotionSchema.parse(await req.json())

    const exists = await prisma.promotions.findUnique({ where: { id } })
    if (!exists) return NextResponse.json({ error: 'ไม่พบโปรโมชัน' }, { status: 404 })

    await prisma.$transaction(async tx => {
      await tx.promotions.update({
        where: { id },
        data: {
          ...promo,
          effective_rate_pct: promoEffectiveRatePct(promo),
          updated_date: new Date(),
          updated_by: auth.email,
        },
      })

      await tx.promotion_cards.deleteMany({ where: { promotion_id: id } })
      if (card_ids.length) {
        await tx.promotion_cards.createMany({
          data: card_ids.map(card_id => ({
            promotion_id: id,
            card_id,
            created_by: auth.email,
          })),
        })
      }

      await tx.promotion_merchants.deleteMany({ where: { promotion_id: id } })
      if (merchant_ids.length) {
        await tx.promotion_merchants.createMany({
          data: merchant_ids.map(merchant_id => ({
            promotion_id: id,
            merchant_id,
            created_by: auth.email,
          })),
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' · ') },
        { status: 400 },
      )
    }
    console.error('[PUT /api/admin/promotions/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await ctx.params
    const exists = await prisma.promotions.findUnique({ where: { id } })
    if (!exists) return NextResponse.json({ error: 'ไม่พบโปรโมชัน' }, { status: 404 })

    // promotion_cards / promotion_merchants มี onDelete: Cascade อยู่แล้ว
    await prisma.promotions.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/promotions/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
