/**
 * `promotions.effective_rate_pct` — อัตราเทียบเท่าของโปรโมชัน
 *
 * ── ทำไมแยกจาก lib/rewards.ts ──────────────────────────────────────────
 *
 * สูตรเป็นตัวเดียวกัน (delegate ไปที่ `effectiveRatePct`) แต่ **กฎว่าเมื่อไหร่
 * ยอมแพ้** ต่างกันคนละเรื่อง:
 *
 *   card_base_benefit → คอลัมน์ NOT NULL · แปลงไม่ได้ = บันทึกไม่ได้ ต้องโยน error
 *   promotions        → คอลัมน์ NULLABLE · แปลงไม่ได้ = ยอมรับได้ เก็บ NULL
 *
 * เหตุผลที่ยอมให้ NULL เฉพาะที่นี่: โปรจริงในตลาดมีหน่วยที่แปลงเป็น % ไม่ได้
 * โดยไม่สมมติอะไรเพิ่ม และเราไม่ยอมสมมติเงียบ ๆ
 *
 *   'ผ่อน 0%'          → % ดอกเบี้ย ไม่ใช่ % ตอบแทน คนละแกนกัน
 *   'รับ 300 บาท'      → ต้องรู้ยอดที่รูดก่อนถึงคิดเป็น % ได้
 *   'รับคะแนน 2 เท่า'  → ต้องรู้อัตราพื้นฐานของบัตรใบนั้นก่อน ซึ่งต่างกันทุกใบ
 *   'ลด 1 บาท/ลิตร'    → ต้องสมมติราคาน้ำมัน (docs/admin-portal.md ข้อ 2)
 *
 * NULL ที่นี่จึงแปลว่า **"ยังเทียบไม่ได้"** ไม่ใช่ "ยังไม่ได้กรอก" —
 * `scorePromo` ต้องถอยไปใช้ heuristic เฉพาะแถวที่เป็น NULL
 */

import { tryEffectiveRatePct } from '@/lib/rewards'

export interface PromoRateInput {
  promo_type?: string | null
  benefit_value?: number | null
  benefit_unit?: string | null
}

/** ชนิดที่ตัวเลขเป็น "% ของยอดที่รูด" ตรง ๆ — ชนิดอื่นแปลงไม่ได้ */
const PERCENT_OF_SPEND = new Set(['cashback', 'discount'])

export function promoEffectiveRatePct(promo: PromoRateInput): number | null {
  const { promo_type, benefit_value, benefit_unit } = promo

  if (benefit_value == null || promo_type == null) return null
  if (!PERCENT_OF_SPEND.has(promo_type)) return null

  // '%' เท่านั้น — 'บาท' และ 'บาท/ลิตร' ต้องรู้ยอด/ราคาต่อหน่วยก่อน
  if (benefit_unit?.trim() !== '%') return null

  // delegate เพื่อไม่ให้มีสูตรแปลงอัตราตัวที่สองในระบบ
  return tryEffectiveRatePct(
    {
      benefit_type: 'cashback',
      benefit_value,
      benefit_unit: '%',
      spend_per_unit: null,
    },
    null,
  )
}
