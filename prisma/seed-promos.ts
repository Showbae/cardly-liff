/**
 * Seed ตัวอย่าง — โปรโมชันผูกกับบัตรจาก seed-cards.ts
 *
 *   npx tsx prisma/seed-cards.ts    ← ต้องรันก่อน
 *   npx tsx prisma/seed-promos.ts
 *
 * รันซ้ำได้ — ลบเฉพาะแถวที่ created_by = 'seed-promos' แล้วสร้างใหม่
 *
 * ⚠️ ข้อมูลสมมติทั้งหมด ต้องล้างก่อนขึ้น production (docs/tech-debt.md 🔴 4)
 *
 * ชุดนี้จงใจครอบทุกสถานะที่หน้าจอแบบ ค ต้องรับมือ:
 *   · card_scope ทั้ง all_bank และ specific_cards
 *   · end_date ใกล้หมด (≤7 วัน → pill สีส้ม) · กลาง · ไกล · และ null (ไม่มีวันหมด)
 *   · ทุกใบมีโปรอย่างน้อย 1 ตัว แต่จำนวนไม่เท่ากัน
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const BY = 'seed-promos'

/** วันหมดอายุนับจากวันนี้ · null = ไม่มีวันหมด */
function inDays(n: number | null): Date | null {
  if (n === null) return null
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(0, 0, 0, 0)
  return d
}

type PromoSpec = {
  title: string
  bank_id: string
  promo_type: 'cashback' | 'discount' | 'installment' | 'points'
  benefit_value: number
  benefit_unit: string
  category: string | null
  merchant: string | null          // name_eng
  min_spend?: number
  max_cap?: number
  endInDays: number | null
  condition?: string
  /** null = all_bank · array = specific_cards (ชื่อบัตร) */
  cards: string[] | null
}

const PROMOS: PromoSpec[] = [
  // ── KBANK ─────────────────────────────────────────────────────────────
  {
    title: 'KBank คืน 15% ที่ Starbucks', bank_id: 'KBANK',
    promo_type: 'cashback', benefit_value: 15, benefit_unit: '%',
    category: 'คาเฟ่', merchant: 'Starbucks',
    min_spend: 100, max_cap: 100,
    endInDays: 4,                                    // ← urgent (≤7 วัน)
    condition: 'ชำระผ่านบัตรเครดิต KBank ทุกประเภท',
    cards: null,                                     // all_bank
  },
  {
    title: 'รับคะแนน x2 ที่เซ็นทรัล', bank_id: 'KBANK',
    promo_type: 'points', benefit_value: 2, benefit_unit: 'เท่า',
    category: 'ช้อปปิ้ง', merchant: 'Central',
    min_spend: 1000,
    endInDays: 45,
    condition: 'ลงทะเบียนรับสิทธิ์ก่อนใช้จ่าย',
    cards: ['KBank Platinum'],                       // specific_cards
  },

  // ── UOB ───────────────────────────────────────────────────────────────
  {
    title: 'UOB ลด 20% ที่ MK Restaurant', bank_id: 'UOB',
    promo_type: 'discount', benefit_value: 20, benefit_unit: '%',
    category: 'ร้านอาหาร', merchant: 'MK Restaurant',
    min_spend: 500, max_cap: 200,
    endInDays: 25,
    condition: 'ทุกสาขาทั่วประเทศ',
    cards: null,
  },
  {
    title: 'รับไมล์ x3 จองที่พักผ่าน Agoda', bank_id: 'UOB',
    promo_type: 'points', benefit_value: 3, benefit_unit: 'เท่า',
    category: 'โรงแรม', merchant: 'Agoda',
    min_spend: 3000,
    endInDays: 90,
    condition: 'จองผ่านลิงก์ของธนาคารเท่านั้น',
    cards: ['UOB PRVI Miles'],
  },

  // ── KTC ───────────────────────────────────────────────────────────────
  {
    title: "KTC ลด 12% ที่ Lotus's", bank_id: 'KTC',
    promo_type: 'discount', benefit_value: 12, benefit_unit: '%',
    category: 'ซูเปอร์มาร์เก็ต', merchant: "Lotus's",
    min_spend: 800, max_cap: 150,
    endInDays: null,                                 // ← ไม่มีวันหมด · countdown ไม่มีอะไรแสดง
    condition: 'ทุกวัน ทุกสาขา',
    cards: null,
  },
  {
    title: 'ผ่อน 0% นาน 10 เดือน', bank_id: 'KTC',
    promo_type: 'installment', benefit_value: 0, benefit_unit: '% ดอกเบี้ย',
    category: 'อิเล็กทรอนิกส์', merchant: null,
    min_spend: 5000,
    endInDays: 6,                                    // ← urgent
    condition: 'เฉพาะสินค้าที่ร่วมรายการ',
    cards: ['KTC FOREVER Platinum'],
  },

  // ── AEON ──────────────────────────────────────────────────────────────
  {
    title: 'AEON คืน 5% ที่ 7-Eleven', bank_id: 'AEON',
    promo_type: 'cashback', benefit_value: 5, benefit_unit: '%',
    category: 'ร้านสะดวกซื้อ', merchant: '7-Eleven',
    min_spend: 200, max_cap: 100,
    endInDays: 60,
    condition: 'สูงสุด 3 ครั้ง/เดือน',
    cards: null,
  },
  {
    title: 'รับคะแนน x3 ทุกวันพุธ', bank_id: 'AEON',
    promo_type: 'points', benefit_value: 3, benefit_unit: 'เท่า',
    category: 'ช้อปปิ้ง', merchant: null,
    endInDays: 15,
    condition: 'เฉพาะวันพุธ ที่ห้างในเครือ AEON',
    cards: ['AEON Royal Orchid Plus'],
  },
]

// ────────────────────────────────────────────────────────────────────────

async function main() {
  // ล้างของเดิม — promotion_cards / promotion_merchants cascade ตามไปเอง
  const removed = await prisma.promotions.deleteMany({ where: { created_by: BY } })
  if (removed.count) console.log(`🧹 ลบโปรเดิม ${removed.count} รายการ`)

  const cats = await prisma.categories.findMany()
  const merchants = await prisma.merchants.findMany()
  const cards = await prisma.credit_cards.findMany()

  const catId = (n: string) => {
    const c = cats.find(x => x.name_th === n)
    if (!c) throw new Error(`ไม่พบหมวด "${n}"`)
    return c.id
  }
  const cardId = (n: string) => {
    const c = cards.find(x => x.card_name === n)
    if (!c) throw new Error(`ไม่พบบัตร "${n}" — รัน seed-cards.ts ก่อน`)
    return c.id
  }

  let linkedMerchants = 0

  for (const p of PROMOS) {
    // ทั้งโปรและบัตรที่ผูกต้องอยู่ทรานแซกชันเดียวกัน — constraint trigger
    // เป็นแบบ deferred จึงเช็กตอน commit ไม่ใช่ตอน insert
    await prisma.$transaction(async tx => {
      const promo = await tx.promotions.create({
        data: {
          title: p.title,
          promo_type: p.promo_type,
          benefit_value: p.benefit_value,
          benefit_unit: p.benefit_unit,
          min_spend: p.min_spend ?? null,
          max_cap: p.max_cap ?? null,
          category_id: p.category ? catId(p.category) : null,
          bank_id: p.bank_id,
          start_date: new Date(),
          end_date: inDays(p.endInDays),
          condition: p.condition ?? null,
          status: 'active',
          card_scope: p.cards ? 'specific_cards' : 'all_bank',
          created_by: BY,
        },
      })

      if (p.cards) {
        for (const name of p.cards) {
          await tx.promotion_cards.create({
            data: { promotion_id: promo.id, card_id: cardId(name), created_by: BY },
          })
        }
      }

      if (p.merchant) {
        const m = merchants.find(x => x.name_eng === p.merchant)
        if (m) {
          await tx.promotion_merchants.create({
            data: { promotion_id: promo.id, merchant_id: m.id, created_by: BY },
          })
          linkedMerchants++
        } else {
          console.warn(`   ⚠️ ไม่พบร้าน "${p.merchant}" — ข้ามการผูก`)
        }
      }
    })

    const days = p.endInDays
    const when = days === null ? 'ไม่มีวันหมด' : `${days} วัน${days <= 7 ? ' ⚠️' : ''}`
    const scope = p.cards ? `เฉพาะ ${p.cards.join(', ')}` : 'ทุกใบของธนาคาร'
    console.log(`   ${p.bank_id.padEnd(6)} ${p.title.padEnd(34)} ${when.padEnd(16)} ${scope}`)
  }

  console.log(`\n✅ ${PROMOS.length} โปร · ผูกร้าน ${linkedMerchants} · ` +
    `all_bank ${PROMOS.filter(p => !p.cards).length} · specific_cards ${PROMOS.filter(p => p.cards).length}`)

  // สรุปว่าบัตรแต่ละใบจะเห็นโปรกี่ตัว (ตาม logic ของ recommend/route.ts)
  console.log('\nโปรที่แต่ละใบจะเห็น:')
  for (const c of cards.filter(x => ['KBANK', 'UOB', 'KTC', 'AEON'].includes(x.bank_id ?? ''))) {
    const n = PROMOS.filter(p =>
      p.bank_id === c.bank_id && (!p.cards || p.cards.includes(c.card_name ?? '')),
    ).length
    if (n > 0) console.log(`   ${(c.card_name ?? '').padEnd(28)} ${n}`)
  }
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
