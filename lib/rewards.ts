/**
 * สูตรคำนวณอัตราตอบแทนของทั้งระบบ — มีที่เดียวเท่านั้น
 *
 * ใครก็ตามที่เขียน `effective_rate_pct` ลง DB ต้องผ่านไฟล์นี้:
 *   - seed script
 *   - admin form (งาน 3.7)
 *   - `/api/recommend` ตอนเทียบบัตร (งาน 6.1)
 *
 * ถ้ามีที่ไหนคิดเลขเองหรือพิมพ์มือ ข้อมูลเก่ากับใหม่จะคิดคนละแบบโดยไม่มีใครรู้
 *
 * เหตุผลเบื้องหลัง: docs/data-model.md → card_base_benefit
 */

export type BenefitType = 'cashback' | 'points' | 'miles' | 'discount'

/** หน่วยที่แปลงเป็น % ได้โดยไม่ต้องสมมติอะไรเพิ่ม */
const PERCENT_UNITS = new Set(['%'])

export interface BenefitInput {
  benefit_type: BenefitType
  /** ตัวเลขตามที่ธนาคารประกาศ เช่น 8 (%) หรือ 3 (คะแนน) */
  benefit_value: number
  /** '%' · 'คะแนน' · 'ไมล์' · 'บาท' · 'บาท/ลิตร' */
  benefit_unit: string
  /** ใช้จ่ายกี่บาทได้ 1 หน่วย — null เมื่อไม่ใช่อัตราส่วน */
  spend_per_unit?: number | null
}

export interface PointProgramInput {
  /** มูลค่าของ 1 คะแนน/ไมล์ เป็นบาท */
  point_value_thb: number
}

/**
 * แยกจาก Error ธรรมดาเพื่อให้ caller จับได้ว่าเป็นปัญหาเชิงข้อมูล
 * ไม่ใช่บั๊ก — admin form ควรแสดงข้อความนี้ให้คนกรอกเห็น
 */
export class RewardCalculationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RewardCalculationError'
  }
}

/** ปัดให้ตรงกับ numeric(8,4) ใน DB — กัน float error สะสมตอนเทียบบัตร */
function round4(n: number): number {
  return Math.round(n * 1e4) / 1e4
}

/** ปัดให้ตรงกับ numeric(12,2) ของ max_reward_thb — หน่วยเป็นบาท ทศนิยม 2 พอ */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * แปลงอัตราตอบแทนให้เป็น "% คืนเทียบเท่า" เพื่อให้เทียบข้ามบัตรได้
 *
 *   cashback 8%              → 8
 *   1 คะแนน/25 บาท @ ฿0.10  → 0.4
 *   3 คะแนน/25 บาท @ ฿0.12  → 1.44
 *
 * @param program โปรแกรมสะสมของบัตรใบนั้น · null = บัตรเงินคืน (ไม่มีแต้ม)
 * @throws {RewardCalculationError} เมื่อข้อมูลไม่พอคำนวณ หรือหน่วยยังไม่รองรับ
 */
export function effectiveRatePct(
  benefit: BenefitInput,
  program: PointProgramInput | null,
): number {
  const { benefit_type, benefit_value, benefit_unit, spend_per_unit } = benefit

  if (!Number.isFinite(benefit_value) || benefit_value < 0) {
    throw new RewardCalculationError(
      `benefit_value ต้องเป็นตัวเลขไม่ติดลบ (ได้ ${benefit_value})`,
    )
  }

  switch (benefit_type) {
    // ── หน่วยเป็น % อยู่แล้ว ไม่ต้องแปลง ────────────────────────────
    case 'cashback': {
      if (!PERCENT_UNITS.has(benefit_unit)) {
        throw new RewardCalculationError(
          `cashback รองรับเฉพาะหน่วย '%' (ได้ '${benefit_unit}') — ` +
            `เงินคืนเป็นจำนวนบาทคงที่ต้องรู้ยอดที่รูดก่อนถึงจะคิดเป็น % ได้`,
        )
      }
      return round4(benefit_value)
    }

    // ── ต้องแปลงหน่วยสะสมเป็นบาทก่อน ────────────────────────────────
    case 'points':
    case 'miles': {
      if (!program) {
        throw new RewardCalculationError(
          `benefit_type='${benefit_type}' ต้องมี point_program — ` +
            `บัตรใบนี้ยังไม่ได้ผูก credit_cards.point_program_id`,
        )
      }
      if (!Number.isFinite(program.point_value_thb) || program.point_value_thb <= 0) {
        throw new RewardCalculationError(
          `point_value_thb ต้องมากกว่า 0 (ได้ ${program.point_value_thb})`,
        )
      }
      if (spend_per_unit == null || !Number.isFinite(spend_per_unit) || spend_per_unit <= 0) {
        throw new RewardCalculationError(
          `benefit_type='${benefit_type}' ต้องมี spend_per_unit มากกว่า 0 — ` +
            `"${benefit_value} ${benefit_unit}" ไม่มีความหมายถ้าไม่รู้ว่าต่อกี่บาท`,
        )
      }
      return round4((benefit_value * program.point_value_thb) / spend_per_unit * 100)
    }

    // ── ส่วนลด: เป็น % ได้ตรง ๆ · ต่อหน่วยยังตัดสินใจไม่ได้ ─────────
    case 'discount': {
      if (PERCENT_UNITS.has(benefit_unit)) return round4(benefit_value)

      // 'บาท/ลิตร' แปลงเป็น % ต้องสมมติราคาน้ำมันต่อลิตร ซึ่งเป็นสมมติฐาน
      // ที่ไม่มีที่เก็บและเปลี่ยนตลอดเวลา — โยน error ดีกว่าเดาเงียบ ๆ
      // แล้วปล่อยให้ตัวเลขผิดฝังอยู่ใน DB โดยไม่มีใครรู้ที่มา
      // ดู docs/admin-portal.md → "ที่ยังไม่ได้ตัดสินใจ" ข้อ 2
      throw new RewardCalculationError(
        `ส่วนลดหน่วย '${benefit_unit}' ยังแปลงเป็น % ไม่ได้ — ` +
          `ต้องมีสมมติฐานราคาต่อหน่วยซึ่งยังไม่ได้ตัดสินใจว่าจะเก็บที่ไหน ` +
          `(docs/admin-portal.md → ที่ยังไม่ได้ตัดสินใจ ข้อ 2)`,
      )
    }

    default: {
      const exhaustive: never = benefit_type
      throw new RewardCalculationError(`benefit_type ไม่รู้จัก: ${exhaustive}`)
    }
  }
}

/**
 * เวอร์ชันที่ไม่โยน error — คืน null เมื่อคำนวณไม่ได้
 *
 * ใช้ตอนแสดงผลรวม ๆ ที่ไม่อยากให้ทั้งหน้าพังเพราะบัตรใบเดียวข้อมูลไม่ครบ
 * **อย่าใช้ตอนเขียนลง DB** — คอลัมน์เป็น NOT NULL และ error มีข้อมูลว่าขาดอะไร
 */
export function tryEffectiveRatePct(
  benefit: BenefitInput,
  program: PointProgramInput | null,
): number | null {
  try {
    return effectiveRatePct(benefit, program)
  } catch (err) {
    if (err instanceof RewardCalculationError) return null
    throw err
  }
}

// ── เพดาน ────────────────────────────────────────────────────────────────

export type CapBasis = 'reward' | 'spend'

export interface CapInput extends BenefitInput {
  /** ตัวเลขตามที่ธนาคารประกาศ — หน่วยขึ้นกับ cap_basis + benefit_type */
  max_cap?: number | null
  /** 'reward' = เพดานของที่ได้ · 'spend' = เพดานของยอดที่นับ */
  cap_basis?: CapBasis | null
}

/**
 * แปลงเพดานให้เป็น **มูลค่าบาท** เพื่อให้เทียบข้ามบัตรได้
 *
 * ธนาคารประกาศเพดานสองแบบที่ให้ผลต่างกัน และเดิมยัดลง `max_cap` ทั้งคู่:
 *
 *   'รับเงินคืน 3% สูงสุด 500 บาท/เดือน'              → reward · 500฿
 *   'รับเงินคืน 3% สำหรับยอดไม่เกิน 10,000 บาท/เดือน'  → spend  · 300฿
 *
 * สังเกตว่าสองบรรทัดนี้ **ไม่เท่ากัน** ทั้งที่อัตราเดียวกัน — นี่คือเหตุผล
 * ที่ `cap_basis` ต้องมี และเป็นข้อที่เติมย้อนหลังไม่ได้ถ้าปล่อยให้กรอกไปก่อน
 *
 * ค่าที่คืนคือคอลัมน์ `card_base_benefit.max_reward_thb` — derived ห้ามพิมพ์มือ
 * แบบเดียวกับ `effective_rate_pct`
 *
 * ⚠️ ค่านี้ **ไม่เข้าสูตรจัดอันดับ** (การตัดสินใจข้อ 7) — เพดานจะมีความหมาย
 * ต่อการแนะนำก็ต่อเมื่อรู้ว่า user รูดไปเท่าไหร่แล้วในรอบนั้น ซึ่งต้องพึ่ง
 * `transactions` ที่ user บันทึกเองไม่ครบ · เก็บไว้ตอบ "บัตรไหนเพดานใจกว้างกว่า"
 * ซึ่งเทียบได้โดยไม่ต้องรู้พฤติกรรมใครเลย
 *
 * @returns null เมื่อไม่มีเพดาน (`max_cap` เป็น null)
 * @throws {RewardCalculationError} เมื่อมีเพดานแต่ข้อมูลไม่พอแปลง
 */
export function capRewardThb(
  cap: CapInput,
  program: PointProgramInput | null,
): number | null {
  const { max_cap, cap_basis, benefit_type } = cap

  if (max_cap == null) return null

  if (!Number.isFinite(max_cap) || max_cap < 0) {
    throw new RewardCalculationError(`max_cap ต้องเป็นตัวเลขไม่ติดลบ (ได้ ${max_cap})`)
  }

  if (cap_basis == null) {
    throw new RewardCalculationError(
      'ระบุเพดานแล้วต้องบอกด้วยว่าเป็นเพดานของอะไร — ' +
        "'reward' (ของที่ได้) หรือ 'spend' (ยอดที่นับ) · " +
        'ตัวเลขเพดานลอย ๆ ให้ผลต่างกันเมื่ออัตราไม่ใช่ 100%',
    )
  }

  // เพดานยอดที่นับ → คูณอัตราเพื่อได้มูลค่าที่ได้จริง
  // ใช้ effectiveRatePct() ตัวเดิม เพื่อไม่ให้มีสูตรอัตราตัวที่สองในระบบ
  if (cap_basis === 'spend') {
    return round2((max_cap * effectiveRatePct(cap, program)) / 100)
  }

  // เพดานผลตอบแทน → หน่วยขึ้นกับชนิด ไม่ต้องมีคอลัมน์ cap_unit แยก
  switch (benefit_type) {
    // เป็นบาทอยู่แล้ว
    case 'cashback':
    case 'discount':
      return round2(max_cap)

    // เป็นคะแนน/ไมล์ ต้องคูณค่าแต้ม — เหตุผลเดียวกับที่ effectiveRatePct ต้องใช้ program
    case 'points':
    case 'miles': {
      if (!program) {
        throw new RewardCalculationError(
          `เพดานของ benefit_type='${benefit_type}' เป็นหน่วยสะสม ต้องมี point_program ถึงจะรู้มูลค่าเป็นบาท`,
        )
      }
      if (!Number.isFinite(program.point_value_thb) || program.point_value_thb <= 0) {
        throw new RewardCalculationError(
          `point_value_thb ต้องมากกว่า 0 (ได้ ${program.point_value_thb})`,
        )
      }
      return round2(max_cap * program.point_value_thb)
    }

    default: {
      const exhaustive: never = benefit_type
      throw new RewardCalculationError(`benefit_type ไม่รู้จัก: ${exhaustive}`)
    }
  }
}

/** คู่กับ `tryEffectiveRatePct` — ใช้ตอนแสดงผล ไม่ใช่ตอนเขียน DB */
export function tryCapRewardThb(
  cap: CapInput,
  program: PointProgramInput | null,
): number | null {
  try {
    return capRewardThb(cap, program)
  } catch (err) {
    if (err instanceof RewardCalculationError) return null
    throw err
  }
}
