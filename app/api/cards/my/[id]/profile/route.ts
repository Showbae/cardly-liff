import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/cards/my/[id]/profile — ข้อมูลแท็บ "สิทธิประโยชน์" ของบัตรหนึ่งใบ
 *
 * `[id]` คือ `users_card.id` (บัตรใบของ user คนนั้น) เหมือน route พี่น้อง
 * `PATCH`/`DELETE` ที่อยู่ระดับเดียวกัน — ไม่ใช่ `credit_cards.id`
 * หน้า `/wallet/[cardId]` ถือ `users_card.id` อยู่แล้ว จึงไม่ต้อง lookup สองรอบ
 *
 * ตัว benefit / perk / annual_fee เป็นข้อมูล **ระดับผลิตภัณฑ์** — route นี้
 * แค่เดินจาก users_card ไปหา credit_cards แล้วอ่านของที่ผูกกับรุ่นบัตร
 *
 * ความหมายของแต่ละคอลัมน์: docs/data-model.md
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** วันนี้ตามเวลาไทย คืนเป็น epoch ของเที่ยงคืน UTC เพื่อเทียบกับ column แบบ date ตรง ๆ */
function todayBangkokUTC(): number {
  // en-CA ให้รูปแบบ YYYY-MM-DD พอดี
  const ymd = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
  return Date.parse(`${ymd}T00:00:00.000Z`)
}

/**
 * เหลืออีกกี่วัน · `null` เมื่อโปรไม่มีวันหมด
 *
 * คิดจาก "วันนี้ที่กรุงเทพ" ไม่ใช่นาฬิกาเครื่อง user — เครื่องที่ตั้ง timezone
 * ผิดจะเห็นตัวเลขต่างจากคนอื่น ซึ่งเป็นตัวเลขที่ทั้งหน้าจอนี้ยืนอยู่บนมัน
 */
function daysLeft(endDate: Date | null, today: number): number | null {
  if (!endDate) return null
  return Math.round((endDate.getTime() - today) / 86_400_000)
}

function num(v: unknown): number | null {
  return v == null ? null : Number(v)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'invalid uuid' }, { status: 400 })
    }

    const userCard = await prisma.users_card.findUnique({
      where: { id },
      include: {
        credit_cards: {
          include: {
            banks: true,
            point_programs: true,
            card_base_benefit: {
              include: { categories: true },
              orderBy: [{ effective_rate_pct: 'desc' }, { sort_order: 'asc' }],
            },
            card_perks: { orderBy: { sort_order: 'asc' } },
          },
        },
      },
    })

    if (!userCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const cc = userCard.credit_cards

    // บัตรที่ user กรอกเองโดยไม่ได้เลือกจากแคตตาล็อก — ไม่มีข้อมูลระดับผลิตภัณฑ์ให้แสดง
    if (!cc) {
      return NextResponse.json({
        card: null,
        promos: [],
        benefits: [],
        perks: [],
      })
    }

    const today = todayBangkokUTC()

    // ── โปรที่ยังใช้ได้ ────────────────────────────────────────────────
    //
    // ⚠️ กับดัก: `promotion_cards` ที่ **ไม่มีแถวเลย** แปลว่า "ใช้ได้กับบัตร
    //    ทุกใบของธนาคารนั้น" ไม่ใช่ "ใช้ไม่ได้กับใบไหนเลย" — กรองผิดข้างเดียว
    //    แล้วหน้านี้จะว่างทั้งที่มีโปรอยู่ (docs/data-model.md → promotion_cards)
    const promoRows = cc.bank_id
      ? await prisma.promotions.findMany({
          where: {
            status: 'active',
            bank_id: cc.bank_id,
            OR: [{ end_date: null }, { end_date: { gte: new Date(today) } }],
            AND: [
              {
                OR: [
                  { promotion_cards: { none: {} } },
                  { promotion_cards: { some: { card_id: cc.id } } },
                ],
              },
            ],
          },
          include: {
            categories: true,
            promotion_cards: { select: { card_id: true } },
            promotion_merchants: { include: { merchants: true } },
          },
        })
      : []

    const promos = promoRows
      .map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        promo_type: p.promo_type,
        benefit_value: num(p.benefit_value),
        benefit_unit: p.benefit_unit,
        min_spend: num(p.min_spend),
        max_cap: num(p.max_cap),
        condition: p.condition,
        source_url: p.source_url,
        end_date: p.end_date ? p.end_date.toISOString() : null,
        days_left: daysLeft(p.end_date, today),
        category: p.categories
          ? { icon: p.categories.icon, name_th: p.categories.name_th }
          : null,
        merchants: p.promotion_merchants
          .map(pm => pm.merchants?.name_eng ?? pm.merchants?.name_th ?? null)
          .filter((n): n is string => n != null),
        // 'card' = ระบุบัตรใบนี้ตรงตัว · 'bank' = โปรระดับธนาคาร ใช้ได้ทุกใบ
        // วันนี้ทุกแถวเป็น 'bank' เพราะ promotion_cards ว่างทั้งตาราง —
        // หน้าจอต้องใช้ค่านี้ติดป้ายให้ตรงความจริง ไม่ใช่อ้างว่าเป็นโปรของบัตรใบนี้
        card_scope: p.promotion_cards.length > 0 ? ('card' as const) : ('bank' as const),
      }))
      // "ของที่หมดอายุขึ้นก่อน" — โปรที่ไม่มีวันหมดไปท้ายสุด เพราะไม่มีความเร่ง
      .sort((a, b) => {
        if (a.days_left == null) return b.days_left == null ? 0 : 1
        if (b.days_left == null) return -1
        return a.days_left - b.days_left
      })

    return NextResponse.json({
      card: {
        id: cc.id,
        card_name: cc.card_name,
        card_tier: cc.card_tier,
        network: cc.network,
        annual_fee: num(cc.annual_fee),
        fee_waiver_condition: cc.fee_waiver_condition,
        bank: cc.banks
          ? { id: cc.banks.id, name_th: cc.banks.name_th, name_eng: cc.banks.name_eng }
          : null,
        // null = บัตรเงินคืน (หน่วยเป็นบาทอยู่แล้ว) ไม่ใช่ "ยังไม่ได้กรอก"
        point_program: cc.point_programs
          ? {
              name: cc.point_programs.name,
              point_value_thb: Number(cc.point_programs.point_value_thb),
              // display-only ทั้งคู่ — จงใจไม่เข้าสูตร effective_rate_pct
              point_expiry_months: cc.point_programs.point_expiry_months,
              min_redemption: cc.point_programs.min_redemption,
            }
          : null,
      },
      promos,
      benefits: cc.card_base_benefit.map(b => ({
        id: b.id,
        benefit_type: b.benefit_type,
        benefit_value: Number(b.benefit_value),
        benefit_unit: b.benefit_unit,
        spend_per_unit: num(b.spend_per_unit),
        min_spend: num(b.min_spend),
        max_cap: num(b.max_cap),
        cap_period: b.cap_period,
        condition: b.condition,
        effective_rate_pct: Number(b.effective_rate_pct),
        // null = อัตราพื้นฐานที่ใช้กับทุกหมวด (บรรทัด "ใช้จ่ายทั่วไป")
        category: b.categories
          ? { icon: b.categories.icon, name_th: b.categories.name_th }
          : null,
      })),
      perks: cc.card_perks.map(p => ({
        id: p.id,
        perk_type: p.perk_type,
        title: p.title,
        value_text: p.value_text,
        description: p.description,
        condition: p.condition,
      })),
    })
  } catch (err) {
    console.error('[GET /api/cards/my/[id]/profile]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
