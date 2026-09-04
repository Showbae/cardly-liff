/**
 * Zod schema สำหรับโปรโมชัน — ใช้ร่วมกันระหว่างฟอร์ม admin กับ API route
 *
 * ความหมายของแต่ละคอลัมน์: docs/data-model.md → กลุ่ม 4
 *
 * ⚠️ enum และ refine ในไฟล์นี้สะท้อน CHECK constraint จริงใน
 * `prisma/sql/002_promo_card_scope.sql` + `005_cap_basis_and_engine_gaps.sql`
 * แก้ SQL แล้วต้องแก้ที่นี่ด้วย
 */

import { z } from 'zod'
import { CAP_BASES, CAP_PERIODS } from './card'

// ── ค่าที่อนุญาต ────────────────────────────────────────────────────────

export const PROMO_TYPES = ['cashback', 'discount', 'points', 'installment'] as const
export const PROMO_STATUSES = ['draft', 'active', 'expired'] as const

/**
 * ขอบเขตบัตรของโปร — อ่านคู่กับตาราง `promotion_cards` เสมอ
 *
 *   all_bank        "บัตร KTC ทุกประเภท"       → promotion_cards ต้องว่าง
 *   specific_cards  "เฉพาะบัตร KTC Signature"  → ต้องมีอย่างน้อย 1 ใบ
 *
 * constraint trigger ใน DB บังคับความสอดคล้องนี้ทั้งสองทาง — schema นี้จับ
 * ตั้งแต่ในฟอร์มเพื่อไม่ให้คนกรอกเจอ exception ภาษา Postgres
 */
export const CARD_SCOPES = ['all_bank', 'specific_cards'] as const

const uuid = z.string().uuid()
const optionalText = z.string().trim().min(1).nullable().optional()

export const promotionSchema = z
  .object({
    title: z.string().trim().min(1),
    description: optionalText,

    promo_type: z.enum(PROMO_TYPES).nullable().optional(),
    benefit_value: z.number().min(0).nullable().optional(),
    benefit_unit: optionalText,

    min_spend: z.number().min(0).nullable().optional(),

    // เพดานต่อรอบ — ต้องบอกครบทั้ง "ต่ออะไร" และ "ของอะไร" เหมือน card_base_benefit
    max_cap: z.number().min(0).nullable().optional(),
    cap_period: z.enum(CAP_PERIODS).nullable().optional(),
    cap_basis: z.enum(CAP_BASES).nullable().optional(),

    // เพดานชั้นที่สอง — "สูงสุด ฿2,500/เดือน และ ฿7,500 ตลอดรายการ"
    max_cap_campaign: z.number().min(0).nullable().optional(),

    category_id: uuid.nullable().optional(),
    bank_id: z.string().min(1),

    start_date: z.coerce.date().nullable().optional(),
    end_date: z.coerce.date().nullable().optional(),

    requires_registration: z.boolean().default(false),
    condition: optionalText,
    source_url: z.string().url().nullable().optional(),

    status: z.enum(PROMO_STATUSES).default('draft'),
    card_scope: z.enum(CARD_SCOPES).default('all_bank'),

    card_ids: z.array(uuid).default([]),
    merchant_ids: z.array(uuid).default([]),
  })
  // ตรงกับ constraint promo_cap_needs_period
  .refine(v => v.max_cap == null || v.cap_period != null, {
    message: 'ระบุเพดานแล้วต้องบอกว่าเพดานต่ออะไร (รอบบิล / เดือน / ปี)',
    path: ['cap_period'],
  })
  .refine(v => v.max_cap == null || v.cap_basis != null, {
    message: 'ระบุเพดานแล้วต้องบอกว่าเป็นเพดานของเงินคืนที่ได้ หรือของยอดใช้จ่ายที่นับ',
    path: ['cap_basis'],
  })
  // ตรงกับ constraint promo_campaign_cap_gte_period_cap — ถ้าเพดานตลอดรายการ
  // น้อยกว่าเพดานต่อรอบ เพดานต่อรอบไม่มีความหมายเลย มักเป็นการกรอกสลับช่อง
  .refine(
    v => v.max_cap_campaign == null || v.max_cap == null || v.max_cap_campaign >= v.max_cap,
    {
      message: 'เพดานตลอดรายการต้องไม่น้อยกว่าเพดานต่อรอบ — กรอกสลับช่องหรือเปล่า',
      path: ['max_cap_campaign'],
    },
  )
  .refine(
    v => v.start_date == null || v.end_date == null || v.end_date >= v.start_date,
    { message: 'วันจบต้องไม่มาก่อนวันเริ่ม', path: ['end_date'] },
  )
  // ตรงกับ constraint trigger trg_promo_scope_* — จับตั้งแต่ในฟอร์ม
  .refine(v => v.card_scope !== 'specific_cards' || v.card_ids.length > 0, {
    message: 'เลือก "เฉพาะบัตรที่ระบุ" แล้วต้องเลือกบัตรอย่างน้อยหนึ่งใบ',
    path: ['card_ids'],
  })
  .refine(v => v.card_scope !== 'all_bank' || v.card_ids.length === 0, {
    message: 'ขอบเขต "ทุกใบของธนาคาร" ต้องไม่ระบุบัตรรายใบ — ถ้าจะจำกัดให้เปลี่ยนเป็น "เฉพาะบัตรที่ระบุ"',
    path: ['card_ids'],
  })
  // โปรที่เผยแพร่แล้วต้องตรวจสอบย้อนได้ว่าเอามาจากไหน — draft ยังไม่ต้อง
  .refine(v => v.status !== 'active' || v.source_url != null, {
    message: 'โปรที่เผยแพร่ต้องมีลิงก์อ้างอิงจากเว็บธนาคาร',
    path: ['source_url'],
  })

export type PromotionInput = z.infer<typeof promotionSchema>
