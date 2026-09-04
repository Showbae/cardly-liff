/**
 * Zod schema สำหรับข้อมูลแคตตาล็อกบัตร — ใช้ร่วมกันระหว่างฟอร์ม admin กับ API route
 *
 * ทุก enum และ refine ในไฟล์นี้ **สะท้อน constraint จริงใน DB** ตาม
 * `prisma/sql/001_card_benefits.sql` — มีไว้ให้คนกรอกเห็น error ทันทีในฟอร์ม
 * ไม่ใช่ให้รอ DB ปฏิเสธแล้วเจอข้อความภาษา Postgres
 *
 * ⚠️ ถ้าแก้ CHECK constraint ใน SQL ต้องแก้ที่นี่ด้วย ทั้งสองที่ต้องตรงกัน
 *
 * ความหมายของแต่ละคอลัมน์: docs/data-model.md
 */

import { z } from 'zod'

// ── ค่าที่อนุญาต — ตรงกับ CHECK constraint ใน DB ────────────────────────

export const BENEFIT_TYPES = ['cashback', 'points', 'miles', 'discount'] as const
export const CAP_PERIODS = ['per_bill', 'per_month', 'per_year'] as const
export const VALUATION_BASES = ['cashback', 'miles', 'voucher'] as const
export const NETWORKS = ['visa', 'mastercard', 'jcb', 'amex', 'unionpay'] as const

/** เพดานของอะไร — 'รับ 3% สูงสุด ฿500' ≠ 'รับ 3% สำหรับยอดไม่เกิน ฿10,000' */
export const CAP_BASES = ['reward', 'spend'] as const

/** ขั้นต่ำต่ออะไร — 'ทุก ๆ ฿1,000/เซลส์สลิป' ≠ 'ยอดสะสมครบ ฿10,000/เดือน' */
export const MIN_SPEND_BASES = ['per_slip', 'per_period'] as const

/** discontinued = เลิกออกแล้ว แต่คนที่ถืออยู่ยังต้องเห็น benefit */
export const CARD_STATUSES = ['active', 'discontinued'] as const

/** ไม่มี 'fee_waiver' โดยตั้งใจ — ค่าธรรมเนียมรายปีอยู่ที่ credit_cards */
export const PERK_TYPES = [
  'lounge', 'insurance', 'parking', 'dining',
  'golf', 'health', 'travel', 'shopping', 'other',
] as const

const uuid = z.string().uuid()
const optionalText = z.string().trim().min(1).nullable().optional()

// ── point_programs ──────────────────────────────────────────────────────

export const pointProgramSchema = z.object({
  bank_id: z.string().min(1),
  name: z.string().trim().min(1),

  // NOT NULL ใน DB — แถวนี้มีอยู่ก็ต่อเมื่อเป็นโปรแกรมสะสมแต้มจริง
  point_value_thb: z.number().positive(),

  // บังคับเลือก เพราะถ้าคนกรอกคนละมาตรฐาน (แลกเงินคืน vs แลกไมล์)
  // บัตรสองใบจะเทียบกันไม่ได้ทั้งที่หน้าจอบอกว่าเทียบให้แล้ว
  valuation_basis: z.enum(VALUATION_BASES),
  valuation_source_url: z.string().url().nullable().optional(),
  valuation_checked_at: z.coerce.date(),

  // display-only — ไม่เข้าสูตร effective_rate_pct
  point_expiry_months: z.number().int().positive().nullable().optional(),
  min_redemption: z.number().int().positive().nullable().optional(),
})

// ── credit_cards (แคตตาล็อก) ────────────────────────────────────────────

export const creditCardSchema = z.object({
  bank_id: z.string().min(1),
  card_name: z.string().trim().min(1),
  card_tier: optionalText,
  image_url: z.string().url().nullable().optional(),

  // null = บัตรเงินคืน ไม่ใช่ "ยังไม่ได้กรอก"
  point_program_id: uuid.nullable().optional(),

  network: z.enum(NETWORKS).nullable().optional(),
  annual_fee: z.number().min(0).nullable().optional(),
  fee_waiver_condition: optionalText,

  // null = ยังไม่ได้กรอก · 0 = บัตรไม่คิดค่าธรรมเนียมนี้จริง — คนละความหมาย
  // ช่วง 0–10 ตรงกับ CHECK cc_fx_fee_range (ตลาดจริง 2.0–2.5%)
  foreign_tx_fee_pct: z.number().min(0).max(10).nullable().optional(),

  status: z.enum(CARD_STATUSES).default('active'),
})

// ── card_base_benefit ───────────────────────────────────────────────────

/**
 * ไม่มี `effective_rate_pct` และ `max_reward_thb` โดยตั้งใจ
 *
 * ทั้งคู่เป็นค่า derived ที่ต้องคำนวณผ่าน `lib/rewards.ts`
 * (`effectiveRatePct()` · `capRewardThb()`) ถ้ารับจาก request ได้
 * ใครก็ส่งเลขผิดเข้ามาได้ แล้วสูตรจะไม่ได้มีที่เดียวในระบบอีกต่อไป
 * — ซึ่งเป็นเหตุผลทั้งหมดที่มีสองคอลัมน์นี้
 */
export const cardBaseBenefitSchema = z
  .object({
    card_id: uuid,

    // null = ใช้กับทุกหมวด (อัตราพื้นฐาน)
    category_id: uuid.nullable().optional(),

    benefit_type: z.enum(BENEFIT_TYPES),
    benefit_value: z.number().min(0),
    benefit_unit: z.string().trim().min(1),

    // "1 คะแนน ต่อ 25 บาท" — null เมื่อไม่ใช่อัตราส่วน
    spend_per_unit: z.number().positive().nullable().optional(),

    min_spend: z.number().min(0).nullable().optional(),
    min_spend_basis: z.enum(MIN_SPEND_BASES).nullable().optional(),

    max_cap: z.number().min(0).nullable().optional(),
    cap_period: z.enum(CAP_PERIODS).nullable().optional(),
    cap_basis: z.enum(CAP_BASES).nullable().optional(),

    // ไม่ลงทะเบียน = ได้ 0 ไม่ใช่ได้น้อยลง — จึงต้องเป็น flag ที่เครื่องอ่านได้
    // ไม่ใช่ข้อความใน condition แบบที่ seed เดิมทำ
    requires_registration: z.boolean().default(false),

    condition: optionalText,
    sort_order: z.number().int().min(0).default(0),
  })
  // ตรงกับ constraint cbb_cap_needs_basis — เพดานต้องบอกครบทั้ง "ต่ออะไร"
  // และ "ของอะไร" · ขาดอย่างใดอย่างหนึ่งแล้วตัวเลขไม่มีความหมายเดียว
  .refine(v => v.max_cap == null || v.cap_period != null, {
    message: 'ระบุเพดานแล้วต้องบอกด้วยว่าเพดานต่ออะไร (รอบบิล / เดือน / ปี)',
    path: ['cap_period'],
  })
  .refine(v => v.max_cap == null || v.cap_basis != null, {
    message:
      'ระบุเพดานแล้วต้องบอกด้วยว่าเป็นเพดานของอะไร — ' +
      'เพดานเงินคืนที่ได้ หรือเพดานยอดใช้จ่ายที่นับ (สองอย่างนี้ได้ผลไม่เท่ากัน)',
    path: ['cap_basis'],
  })
  // ตรงกับ constraint cbb_min_spend_needs_basis
  .refine(v => v.min_spend == null || v.min_spend_basis != null, {
    message: 'ระบุขั้นต่ำแล้วต้องบอกด้วยว่าต่อเซลส์สลิป หรือยอดสะสมต่อรอบ',
    path: ['min_spend_basis'],
  })
  // ตรงกับ constraint ratio_needs_divisor — "3 คะแนน" ลอย ๆ ไม่มีความหมาย
  .refine(
    v => !['points', 'miles'].includes(v.benefit_type) || v.spend_per_unit != null,
    {
      message: 'คะแนน/ไมล์ ต้องระบุว่าใช้จ่ายกี่บาทได้ 1 หน่วย',
      path: ['spend_per_unit'],
    },
  )
  // หน่วยต้องเข้าคู่กับ type ไม่งั้น effectiveRatePct() จะโยน error ตอนบันทึก
  .refine(v => v.benefit_type !== 'cashback' || v.benefit_unit === '%', {
    message: "เงินคืนรองรับเฉพาะหน่วย '%'",
    path: ['benefit_unit'],
  })

// ── card_perks ──────────────────────────────────────────────────────────

export const cardPerkSchema = z.object({
  card_id: uuid,
  perk_type: z.enum(PERK_TYPES),
  title: z.string().trim().min(1),
  value_text: optionalText,   // '2 ครั้ง/ปี' · 'สูงสุด ฿8,000,000'
  description: optionalText,
  condition: optionalText,
  sort_order: z.number().int().min(0).default(0),
})

// ── Types ───────────────────────────────────────────────────────────────

export type PointProgramInput = z.infer<typeof pointProgramSchema>
export type CreditCardInput = z.infer<typeof creditCardSchema>
export type CardBaseBenefitInput = z.infer<typeof cardBaseBenefitSchema>
export type CardPerkInput = z.infer<typeof cardPerkSchema>
