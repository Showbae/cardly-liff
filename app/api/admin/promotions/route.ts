import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { promotionSchema } from '@/lib/validations/promotion'
import { promoEffectiveRatePct } from '@/lib/promo-rate'

/**
 * โปรโมชัน — แคมเปญที่มีวันหมด ต่างจาก `card_base_benefit` ที่ได้ตลอดไป
 *
 * ⚠️ ทุก route ต้องเรียก `requireAdmin` เอง — middleware เช็กแค่ว่ามี cookie
 */

export interface AdminPromoRow {
  id: string
  title: string
  bank_id: string | null
  promo_type: string | null
  benefit_value: number | null
  benefit_unit: string | null
  effective_rate_pct: number | null
  status: string | null
  card_scope: string
  requires_registration: boolean
  start_date: string | null
  end_date: string | null
  category_name: string | null
  card_count: number
  merchant_count: number
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const promos = await prisma.promotions.findMany({
      include: {
        categories: { select: { name_th: true } },
        _count: { select: { promotion_cards: true, promotion_merchants: true } },
      },
      // ของที่กำลังจะหมดอายุต้องอยู่บนสุด — เป็นแถวที่ต้องตัดสินใจก่อนแถวอื่น
      orderBy: [{ status: 'asc' }, { end_date: 'asc' }],
    })

    const rows: AdminPromoRow[] = promos.map(p => ({
      id: p.id,
      title: p.title,
      bank_id: p.bank_id,
      promo_type: p.promo_type,
      benefit_value: p.benefit_value == null ? null : Number(p.benefit_value),
      benefit_unit: p.benefit_unit,
      effective_rate_pct:
        p.effective_rate_pct == null ? null : Number(p.effective_rate_pct),
      status: p.status,
      card_scope: p.card_scope,
      requires_registration: p.requires_registration,
      start_date: p.start_date?.toISOString().slice(0, 10) ?? null,
      end_date: p.end_date?.toISOString().slice(0, 10) ?? null,
      category_name: p.categories?.name_th ?? null,
      card_count: p._count.promotion_cards,
      merchant_count: p._count.promotion_merchants,
    }))

    return NextResponse.json(rows)
  } catch (err) {
    console.error('[GET /api/admin/promotions]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { card_ids, merchant_ids, ...promo } = promotionSchema.parse(await req.json())

    const created = await prisma.$transaction(async tx => {
      const row = await tx.promotions.create({
        data: {
          ...promo,
          // derived — nullable ต่างจาก card_base_benefit เพราะโปรมีหน่วยที่
          // แปลงเป็น % ไม่ได้จริง (บาท/ลิตร · % ดอกเบี้ย)
          effective_rate_pct: promoEffectiveRatePct(promo),
          created_by: auth.email,
        },
      })

      if (card_ids.length) {
        await tx.promotion_cards.createMany({
          data: card_ids.map(card_id => ({
            promotion_id: row.id,
            card_id,
            created_by: auth.email,
          })),
        })
      }
      if (merchant_ids.length) {
        await tx.promotion_merchants.createMany({
          data: merchant_ids.map(merchant_id => ({
            promotion_id: row.id,
            merchant_id,
            created_by: auth.email,
          })),
        })
      }

      return row
    })

    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' · ') },
        { status: 400 },
      )
    }
    console.error('[POST /api/admin/promotions]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
