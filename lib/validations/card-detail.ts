/**
 * Payload ของฟอร์มแก้บัตร — บันทึกทั้งใบในครั้งเดียว
 *
 * ── ทำไมรวมเป็นก้อนเดียวแทนที่จะแยก /benefits กับ /perks ตามแผนเดิม ──
 *
 * แผนเดิมวางไว้ตอนยังไม่รู้หน้าตาฟอร์ม พอทำจริงแล้วการแก้บัตรหนึ่งใบคือ
 * การแก้ตารางอัตราทั้งชุดพร้อมกัน (เพิ่มแถว ลบแถว แก้ค่า) ถ้าแยก endpoint
 * จะต้องยิงหลายครั้งแล้วถ้าพลาดกลางทางข้อมูลจะค้างครึ่ง ๆ กลาง ๆ
 *
 * รวมเป็น PUT เดียวใน transaction เดียว = กดบันทึกทีเดียว สำเร็จหรือไม่สำเร็จ
 * ทั้งก้อน ไม่มีสถานะกลาง
 */

import { z } from 'zod'
import {
  BENEFIT_TYPES,
  CAP_BASES,
  CAP_PERIODS,
  CARD_STATUSES,
  MIN_SPEND_BASES,
  NETWORKS,
  PERK_TYPES,
} from './card'

const uuid = z.string().uuid()
const optionalText = z.string().trim().min(1).nullable().optional()

/** แถว benefit — `id` มี = แก้ของเดิม · ไม่มี = แถวใหม่ */
export const benefitRowSchema = z
  .object({
    id: uuid.optional(),
    category_id: uuid.nullable().optional(),
    benefit_type: z.enum(BENEFIT_TYPES),
    benefit_value: z.number().min(0),
    benefit_unit: z.string().trim().min(1),
    spend_per_unit: z.number().positive().nullable().optional(),
    min_spend: z.number().min(0).nullable().optional(),
    min_spend_basis: z.enum(MIN_SPEND_BASES).nullable().optional(),
    max_cap: z.number().min(0).nullable().optional(),
    cap_period: z.enum(CAP_PERIODS).nullable().optional(),
    cap_basis: z.enum(CAP_BASES).nullable().optional(),
    requires_registration: z.boolean().default(false),
    condition: optionalText,
  })
  .refine(v => v.max_cap == null || v.cap_period != null, {
    message: 'ระบุเพดานแล้วต้องบอกว่าเพดานต่ออะไร',
    path: ['cap_period'],
  })
  .refine(v => v.max_cap == null || v.cap_basis != null, {
    message: 'ระบุเพดานแล้วต้องบอกว่าเป็นเพดานของเงินคืนที่ได้ หรือของยอดใช้จ่ายที่นับ',
    path: ['cap_basis'],
  })
  .refine(v => v.min_spend == null || v.min_spend_basis != null, {
    message: 'ระบุขั้นต่ำแล้วต้องบอกว่าต่อเซลส์สลิป หรือยอดสะสมต่อรอบ',
    path: ['min_spend_basis'],
  })
  .refine(v => !['points', 'miles'].includes(v.benefit_type) || v.spend_per_unit != null, {
    message: 'คะแนน/ไมล์ ต้องระบุว่าใช้จ่ายกี่บาทได้ 1 หน่วย',
    path: ['spend_per_unit'],
  })
  .refine(v => v.benefit_type !== 'cashback' || v.benefit_unit === '%', {
    message: "เงินคืนรองรับเฉพาะหน่วย '%'",
    path: ['benefit_unit'],
  })

export const perkRowSchema = z.object({
  id: uuid.optional(),
  perk_type: z.enum(PERK_TYPES),
  title: z.string().trim().min(1),
  value_text: optionalText,
  description: optionalText,
  condition: optionalText,
})

export const cardDetailSchema = z
  .object({
    card: z.object({
      bank_id: z.string().min(1),
      card_name: z.string().trim().min(1),
      card_tier: optionalText,
      image_url: z.string().url().nullable().optional(),
      point_program_id: uuid.nullable().optional(),
      network: z.enum(NETWORKS).nullable().optional(),
      annual_fee: z.number().min(0).nullable().optional(),
      fee_waiver_condition: optionalText,
      // null = ยังไม่ได้กรอก · 0 = บัตรไม่คิดค่าธรรมเนียมนี้จริง
      foreign_tx_fee_pct: z.number().min(0).max(10).nullable().optional(),
      status: z.enum(CARD_STATUSES).default('active'),
    }),
    benefits: z.array(benefitRowSchema),
    perks: z.array(perkRowSchema),
  })
  // ตรงกับ trigger `trg_benefit_needs_program` ใน DB — จับตั้งแต่ในฟอร์ม
  // จะได้เห็นข้อความไทยแทนที่จะรอ DB โยน exception ภาษา Postgres
  .superRefine((v, ctx) => {
    const hasPointRow = v.benefits.some(b => b.benefit_type === 'points' || b.benefit_type === 'miles')
    if (hasPointRow && !v.card.point_program_id) {
      ctx.addIssue({
        code: 'custom',
        message: 'มีอัตราแบบคะแนน/ไมล์ ต้องเลือกโปรแกรมสะสมให้บัตรใบนี้ก่อน',
        path: ['card', 'point_program_id'],
      })
    }
  })

export type BenefitRowInput = z.infer<typeof benefitRowSchema>
export type PerkRowInput = z.infer<typeof perkRowSchema>
export type CardDetailInput = z.infer<typeof cardDetailSchema>
