/**
 * Seed ตัวอย่าง — สิทธิประโยชน์บัตร (Feature #23)
 *
 *   npx tsx prisma/seed-cards.ts
 *
 * รันซ้ำได้ (idempotent) — ลบ benefit/perk ของบัตรในชุดนี้ก่อนแล้วใส่ใหม่
 *
 * ⚠️ ตัวเลขทั้งหมดเป็น **ข้อมูลสมมติเพื่อทดสอบหน้าจอ** ไม่ใช่เงื่อนไขจริง
 *    ของผลิตภัณฑ์ใด — ต้องล้างทิ้งก่อนขึ้น production (docs/tech-debt.md 🔴 4)
 *
 * effective_rate_pct คำนวณผ่าน lib/rewards.ts เสมอ ไม่มีการพิมพ์มือ
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'
import { effectiveRatePct, type BenefitType } from '../lib/rewards'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// ── โปรแกรมสะสมแต้ม ─────────────────────────────────────────────────────
const PROGRAMS = [
  { bank_id: 'KBANK', name: 'K Point',      point_value_thb: 0.10, valuation_basis: 'cashback', point_expiry_months: 24,   min_redemption: 1000 },
  { bank_id: 'UOB',   name: 'PRVI Miles',   point_value_thb: 0.28, valuation_basis: 'miles',    point_expiry_months: null, min_redemption: 5000 },
  { bank_id: 'KTC',   name: 'KTC FOREVER',  point_value_thb: 0.12, valuation_basis: 'cashback', point_expiry_months: null, min_redemption: 500  },
  { bank_id: 'AEON',  name: 'AEON Point',   point_value_thb: 0.08, valuation_basis: 'voucher',  point_expiry_months: 24,   min_redemption: 1000 },
]

type Rate = {
  cat: string | null            // ชื่อหมวดภาษาไทย · null = ทุกหมวด (อัตราพื้นฐาน)
  type: BenefitType
  value: number
  unit: string
  per?: number                  // spend_per_unit
  min?: number
  cap?: number
  capPeriod?: 'per_bill' | 'per_month' | 'per_year'
  cond?: string
}

type Perk = { type: string; title: string; value?: string; cond?: string }

type CardSpec = {
  bank_id: string
  card_name: string
  card_tier: string
  program: string | null        // ชื่อโปรแกรม · null = บัตรเงินคืน
  network: string
  annual_fee: number
  fee_waiver: string | null
  rates: Rate[]
  perks: Perk[]
}

const CARDS: CardSpec[] = [
  // ── KBANK ─────────────────────────────────────────────────────────────
  {
    bank_id: 'KBANK', card_name: 'KBank Platinum', card_tier: 'Platinum',
    program: 'K Point', network: 'visa', annual_fee: 2500,
    fee_waiver: 'ฟรีเมื่อมียอดใช้จ่ายครบ ฿100,000 ต่อปี',
    rates: [
      { cat: null,             type: 'points', value: 1, unit: 'คะแนน', per: 25, cond: 'ทุกการใช้จ่ายทั่วไป' },
      { cat: 'ซูเปอร์มาร์เก็ต',   type: 'points', value: 2, unit: 'คะแนน', per: 25, cap: 20000, capPeriod: 'per_year' },
      { cat: 'ออนไลน์',         type: 'points', value: 2, unit: 'คะแนน', per: 25, cond: 'เฉพาะร้านที่ร่วมรายการ' },
    ],
    perks: [
      { type: 'lounge',    title: 'ห้องรับรองสนามบิน', value: '2 ครั้ง/ปี', cond: 'สุวรรณภูมิ · ดอนเมือง' },
      { type: 'insurance', title: 'ประกันอุบัติเหตุการเดินทาง', value: 'สูงสุด ฿8,000,000', cond: 'เมื่อซื้อตั๋วด้วยบัตรนี้' },
    ],
  },
  {
    bank_id: 'KBANK', card_name: 'KBank Cashback', card_tier: 'Gold',
    program: null, network: 'mastercard', annual_fee: 1500,
    fee_waiver: 'ฟรีปีแรก',
    rates: [
      { cat: null,             type: 'cashback', value: 1, unit: '%' },
      { cat: 'ซูเปอร์มาร์เก็ต',   type: 'cashback', value: 3, unit: '%', min: 3000, cap: 500, capPeriod: 'per_month' },
      { cat: 'ร้านอาหาร',       type: 'cashback', value: 2, unit: '%', cap: 300, capPeriod: 'per_month' },
    ],
    perks: [
      { type: 'parking', title: 'จอดรถฟรี', value: '3 ชม./ครั้ง', cond: 'ศูนย์การค้าร่วมรายการ' },
    ],
  },

  // ── UOB ───────────────────────────────────────────────────────────────
  {
    bank_id: 'UOB', card_name: 'UOB Absolute Cashback', card_tier: 'Platinum',
    program: null, network: 'visa', annual_fee: 3210,
    fee_waiver: 'ฟรีเมื่อมียอดใช้จ่ายครบ ฿120,000 ต่อปี',
    rates: [
      { cat: null, type: 'cashback', value: 1.5, unit: '%', cap: 2000, capPeriod: 'per_month', cond: 'ทุกหมวด ไม่ต้องลงทะเบียน' },
    ],
    perks: [
      { type: 'lounge',  title: 'ห้องรับรองสนามบิน', value: '2 ครั้ง/ปี' },
      { type: 'parking', title: 'จอดรถฟรี', value: '2 ชม./ครั้ง' },
    ],
  },
  {
    bank_id: 'UOB', card_name: 'UOB PRVI Miles', card_tier: 'Signature',
    program: 'PRVI Miles', network: 'visa', annual_fee: 4000,
    fee_waiver: null,
    rates: [
      { cat: null,          type: 'miles', value: 1, unit: 'ไมล์', per: 25 },
      { cat: 'สายการบิน',    type: 'miles', value: 3, unit: 'ไมล์', per: 25, cond: 'จองผ่านสายการบินโดยตรง' },
      { cat: 'โรงแรม',       type: 'miles', value: 2, unit: 'ไมล์', per: 25 },
    ],
    perks: [
      { type: 'lounge',    title: 'ห้องรับรองสนามบิน', value: 'ไม่จำกัดจำนวนครั้ง', cond: 'ผ่าน Priority Pass' },
      { type: 'insurance', title: 'ประกันการเดินทาง', value: 'สูงสุด ฿10,000,000' },
      { type: 'golf',      title: 'กรีนฟีกอล์ฟ', value: '2 ครั้ง/ปี', cond: 'สนามที่ร่วมรายการ' },
    ],
  },

  // ── KTC ───────────────────────────────────────────────────────────────
  {
    bank_id: 'KTC', card_name: 'KTC FOREVER Platinum', card_tier: 'Platinum',
    program: 'KTC FOREVER', network: 'mastercard', annual_fee: 2000,
    fee_waiver: 'ฟรีตลอดชีพเมื่อสมัครออนไลน์',
    rates: [
      { cat: null,        type: 'points', value: 1, unit: 'คะแนน', per: 25 },
      { cat: 'ร้านอาหาร',  type: 'points', value: 2, unit: 'คะแนน', per: 25 },
      { cat: 'บันเทิง',     type: 'points', value: 3, unit: 'คะแนน', per: 25, cap: 30000, capPeriod: 'per_year', cond: 'ต้องลงทะเบียนก่อนใช้สิทธิ์' },
    ],
    perks: [
      { type: 'dining',  title: 'ส่วนลดร้านอาหารในเครือ', value: 'ลด 15%', cond: 'ร้านที่ร่วมรายการ' },
      { type: 'parking', title: 'จอดรถฟรี', value: '3 ชม./ครั้ง' },
    ],
  },
  {
    bank_id: 'KTC', card_name: 'KTC Cash Back Platinum', card_tier: 'Platinum',
    program: null, network: 'visa', annual_fee: 2000,
    fee_waiver: 'ฟรีปีแรก',
    rates: [
      { cat: null,     type: 'cashback', value: 1, unit: '%', cap: 2000, capPeriod: 'per_bill' },
      { cat: 'น้ำมัน',  type: 'cashback', value: 2, unit: '%', min: 3000, cap: 500, capPeriod: 'per_month' },
    ],
    // จงใจให้มี perk เดียว — ทดสอบว่าหน้าจอดูโล่งไปไหมเมื่อบัตรมีสิทธิพิเศษน้อย
    perks: [
      { type: 'travel', title: 'ประกันการเดินทาง', value: 'สูงสุด ฿2,000,000' },
    ],
  },

  // ── AEON ──────────────────────────────────────────────────────────────
  {
    bank_id: 'AEON', card_name: 'AEON Royal Orchid Plus', card_tier: 'Platinum',
    program: 'AEON Point', network: 'jcb', annual_fee: 1000,
    fee_waiver: 'ฟรีปีแรก',
    rates: [
      { cat: null,      type: 'points', value: 1, unit: 'คะแนน', per: 25 },
      { cat: 'ช้อปปิ้ง',  type: 'points', value: 2, unit: 'คะแนน', per: 25, cond: 'เฉพาะห้างในเครือ' },
    ],
    perks: [
      { type: 'shopping', title: 'ส่วนลดร้านค้าในเครือ', value: 'ลด 5%', cond: 'ทุกวันพุธ' },
    ],
  },
  {
    bank_id: 'AEON', card_name: 'AEON Cashback', card_tier: 'Classic',
    program: null, network: 'jcb',
    annual_fee: 0,                 // ← ทดสอบเคสค่าธรรมเนียม 0
    fee_waiver: null,
    rates: [
      { cat: null,           type: 'cashback', value: 0.5, unit: '%' },
      { cat: 'ร้านสะดวกซื้อ',  type: 'cashback', value: 3, unit: '%', cap: 300, capPeriod: 'per_month' },
    ],
    perks: [],                     // ← ทดสอบเคสบัตรไม่มีสิทธิพิเศษเลย
  },
]

// ────────────────────────────────────────────────────────────────────────

async function main() {
  // 1 · point_programs
  const programIds = new Map<string, string>()
  for (const p of PROGRAMS) {
    const row = await prisma.point_programs.upsert({
      where: { bank_id_name: { bank_id: p.bank_id, name: p.name } },
      update: { ...p, updated_date: new Date(), updated_by: 'seed-cards' },
      create: { ...p, created_by: 'seed-cards' },
    })
    programIds.set(p.name, row.id)
  }
  console.log(`✅ point_programs: ${PROGRAMS.length}`)

  // 2 · categories lookup
  const cats = await prisma.categories.findMany()
  const catId = (name: string) => {
    const c = cats.find(x => x.name_th === name)
    if (!c) throw new Error(`ไม่พบหมวด "${name}" — ตรวจ prisma/seed.ts ว่ารันแล้วหรือยัง`)
    return c.id
  }

  let rateCount = 0
  let perkCount = 0

  for (const spec of CARDS) {
    const programId = spec.program ? programIds.get(spec.program)! : null
    const program = spec.program
      ? { point_value_thb: Number(PROGRAMS.find(p => p.name === spec.program)!.point_value_thb) }
      : null

    // 3 · credit_cards — หาใบเดิมก่อน ถ้าไม่มีค่อยสร้าง
    const existing = await prisma.credit_cards.findFirst({
      where: { bank_id: spec.bank_id, card_name: spec.card_name },
    })

    const data = {
      bank_id: spec.bank_id,
      card_name: spec.card_name,
      card_tier: spec.card_tier,
      point_program_id: programId,
      network: spec.network,
      annual_fee: spec.annual_fee,
      fee_waiver_condition: spec.fee_waiver,
    }

    const card = existing
      ? await prisma.credit_cards.update({
          where: { id: existing.id },
          data: { ...data, updated_date: new Date(), updated_by: 'seed-cards' },
        })
      : await prisma.credit_cards.create({ data: { ...data, created_by: 'seed-cards' } })

    // 4 · ล้างของเดิมให้ rerun ได้
    await prisma.card_base_benefit.deleteMany({ where: { card_id: card.id } })
    await prisma.card_perks.deleteMany({ where: { card_id: card.id } })

    // 5 · card_base_benefit — effective_rate_pct มาจาก lib/rewards.ts เท่านั้น
    for (const [i, r] of spec.rates.entries()) {
      const rate = effectiveRatePct(
        { benefit_type: r.type, benefit_value: r.value, benefit_unit: r.unit, spend_per_unit: r.per ?? null },
        program,
      )
      await prisma.card_base_benefit.create({
        data: {
          card_id: card.id,
          category_id: r.cat ? catId(r.cat) : null,
          benefit_type: r.type,
          benefit_value: r.value,
          benefit_unit: r.unit,
          spend_per_unit: r.per ?? null,
          min_spend: r.min ?? null,
          max_cap: r.cap ?? null,
          cap_period: r.capPeriod ?? null,
          condition: r.cond ?? null,
          effective_rate_pct: rate,
          sort_order: i,
          created_by: 'seed-cards',
        },
      })
      rateCount++
    }

    // 6 · card_perks
    for (const [i, p] of spec.perks.entries()) {
      await prisma.card_perks.create({
        data: {
          card_id: card.id,
          perk_type: p.type,
          title: p.title,
          value_text: p.value ?? null,
          condition: p.cond ?? null,
          sort_order: i,
          created_by: 'seed-cards',
        },
      })
      perkCount++
    }

    const best = Math.max(...spec.rates.map(r =>
      effectiveRatePct(
        { benefit_type: r.type, benefit_value: r.value, benefit_unit: r.unit, spend_per_unit: r.per ?? null },
        program,
      ),
    ))
    console.log(
      `   ${spec.bank_id.padEnd(6)} ${spec.card_name.padEnd(26)} ` +
      `${spec.rates.length} rates · ${spec.perks.length} perks · สูงสุด ${best}%`,
    )
  }

  console.log(`\n✅ ${CARDS.length} บัตร · ${rateCount} อัตรา · ${perkCount} สิทธิพิเศษ`)
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
