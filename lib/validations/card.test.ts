import { describe, it, expect } from 'vitest'
import {
  pointProgramSchema,
  creditCardSchema,
  cardBaseBenefitSchema,
  cardPerkSchema,
} from './card'

const CARD_ID = '11111111-1111-4111-8111-111111111111'
const CAT_ID = '22222222-2222-4222-8222-222222222222'

/** benefit ที่ผ่านทุก refine — ใช้เป็นฐานแล้ว override ทีละฟิลด์ */
function benefit(over: Record<string, unknown> = {}) {
  return { card_id: CARD_ID, benefit_type: 'cashback', benefit_value: 1, benefit_unit: '%', ...over }
}

describe('cardBaseBenefitSchema', () => {
  it('รับ cashback ปกติ', () => {
    expect(cardBaseBenefitSchema.safeParse(benefit({ benefit_value: 8 })).success).toBe(true)
  })

  it('รับ points ที่มี spend_per_unit ครบ', () => {
    const r = cardBaseBenefitSchema.safeParse(
      benefit({ benefit_type: 'points', benefit_value: 3, benefit_unit: 'คะแนน', spend_per_unit: 25 }),
    )
    expect(r.success).toBe(true)
  })

  it('category_id เว้นได้ = อัตราพื้นฐานทุกหมวด', () => {
    expect(cardBaseBenefitSchema.safeParse(benefit()).success).toBe(true)
    expect(cardBaseBenefitSchema.safeParse(benefit({ category_id: CAT_ID })).success).toBe(true)
  })

  it('sort_order default เป็น 0', () => {
    const r = cardBaseBenefitSchema.parse(benefit())
    expect(r.sort_order).toBe(0)
  })

  describe('cap_needs_basis — ตรงกับ CHECK ใน DB', () => {
    it('ปฏิเสธ max_cap ที่ไม่บอกรอบ', () => {
      const r = cardBaseBenefitSchema.safeParse(benefit({ max_cap: 1000 }))
      expect(r.success).toBe(false)
      expect(r.error?.issues[0].path).toEqual(['cap_period'])
    })

    // เพดานที่บอกแค่ "ต่อรอบบิล" ยังไม่พอ — ต้องรู้ด้วยว่าเพดานของอะไร
    // '3% สูงสุด ฿500' กับ '3% ของยอดไม่เกิน ฿500' ได้จริงต่างกัน ฿485
    it('ปฏิเสธ max_cap ที่บอกรอบแล้วแต่ไม่บอกว่าเพดานของอะไร', () => {
      const r = cardBaseBenefitSchema.safeParse(
        benefit({ max_cap: 1000, cap_period: 'per_bill' }),
      )
      expect(r.success).toBe(false)
      expect(r.error?.issues.some(i => i.path.includes('cap_basis'))).toBe(true)
    })

    it('รับเมื่อครบทั้งสาม', () => {
      expect(
        cardBaseBenefitSchema.safeParse(
          benefit({ max_cap: 1000, cap_period: 'per_bill', cap_basis: 'reward' }),
        ).success,
      ).toBe(true)
      expect(
        cardBaseBenefitSchema.safeParse(
          benefit({ max_cap: 10000, cap_period: 'per_month', cap_basis: 'spend' }),
        ).success,
      ).toBe(true)
    })

    it('รับเมื่อไม่มีเพดานเลย', () => {
      expect(cardBaseBenefitSchema.safeParse(benefit()).success).toBe(true)
    })
  })

  describe('min_spend_needs_basis — ตรงกับ CHECK ใน DB', () => {
    it('ปฏิเสธ min_spend ที่ไม่บอกว่าต่ออะไร', () => {
      const r = cardBaseBenefitSchema.safeParse(benefit({ min_spend: 3000 }))
      expect(r.success).toBe(false)
      expect(r.error?.issues.some(i => i.path.includes('min_spend_basis'))).toBe(true)
    })

    it('รับเมื่อบอกครบ', () => {
      expect(
        cardBaseBenefitSchema.safeParse(
          benefit({ min_spend: 3000, min_spend_basis: 'per_slip' }),
        ).success,
      ).toBe(true)
    })
  })

  describe('requires_registration', () => {
    it('default เป็น false — เดาต่ำไว้ดีกว่าโฆษณาอัตราที่ user ไม่ได้จริง', () => {
      expect(cardBaseBenefitSchema.parse(benefit()).requires_registration).toBe(false)
    })
  })

  describe('ratio_needs_divisor — ตรงกับ CHECK ใน DB', () => {
    it('ปฏิเสธ points ที่ไม่มี spend_per_unit', () => {
      const r = cardBaseBenefitSchema.safeParse(
        benefit({ benefit_type: 'points', benefit_unit: 'คะแนน' }),
      )
      expect(r.success).toBe(false)
      expect(r.error?.issues.some(i => i.path.includes('spend_per_unit'))).toBe(true)
    })

    it('ปฏิเสธ miles ที่ไม่มี spend_per_unit', () => {
      expect(
        cardBaseBenefitSchema.safeParse(benefit({ benefit_type: 'miles', benefit_unit: 'ไมล์' })).success,
      ).toBe(false)
    })

    it('cashback ไม่ต้องมี spend_per_unit', () => {
      expect(cardBaseBenefitSchema.safeParse(benefit()).success).toBe(true)
    })
  })

  describe('หน่วยต้องเข้าคู่กับ type', () => {
    it("ปฏิเสธ cashback หน่วย 'บาท' เพราะ effectiveRatePct() คำนวณไม่ได้", () => {
      const r = cardBaseBenefitSchema.safeParse(benefit({ benefit_unit: 'บาท', benefit_value: 50 }))
      expect(r.success).toBe(false)
      expect(r.error?.issues.some(i => i.path.includes('benefit_unit'))).toBe(true)
    })

    it("discount หน่วย 'บาท/ลิตร' ผ่าน schema (ไปตกที่ effectiveRatePct แทน)", () => {
      const r = cardBaseBenefitSchema.safeParse(
        benefit({ benefit_type: 'discount', benefit_unit: 'บาท/ลิตร' }),
      )
      expect(r.success).toBe(true)
    })
  })

  it('ปฏิเสธ benefit_type ที่ไม่รู้จัก', () => {
    expect(cardBaseBenefitSchema.safeParse(benefit({ benefit_type: 'lottery' })).success).toBe(false)
  })

  it('ปฏิเสธ benefit_value ติดลบ', () => {
    expect(cardBaseBenefitSchema.safeParse(benefit({ benefit_value: -1 })).success).toBe(false)
  })

  it('ปฏิเสธ spend_per_unit = 0 (กันหารศูนย์)', () => {
    expect(
      cardBaseBenefitSchema.safeParse(
        benefit({ benefit_type: 'points', benefit_unit: 'คะแนน', spend_per_unit: 0 }),
      ).success,
    ).toBe(false)
  })

  it('ไม่รับ effective_rate_pct จาก input — เป็นค่า derived', () => {
    const parsed = cardBaseBenefitSchema.parse(benefit({ effective_rate_pct: 999 }) as never)
    expect('effective_rate_pct' in parsed).toBe(false)
  })
})

describe('cardPerkSchema', () => {
  it('รับ perk ปกติ', () => {
    expect(
      cardPerkSchema.safeParse({
        card_id: CARD_ID, perk_type: 'lounge',
        title: 'ห้องรับรองสนามบิน', value_text: '2 ครั้ง/ปี',
      }).success,
    ).toBe(true)
  })

  it("ปฏิเสธ perk_type = 'fee_waiver' — ค่าธรรมเนียมอยู่ที่ credit_cards", () => {
    expect(
      cardPerkSchema.safeParse({ card_id: CARD_ID, perk_type: 'fee_waiver', title: 'ค่าธรรมเนียมรายปี' })
        .success,
    ).toBe(false)
  })

  it('ปฏิเสธ title ว่าง', () => {
    expect(cardPerkSchema.safeParse({ card_id: CARD_ID, perk_type: 'lounge', title: '   ' }).success).toBe(
      false,
    )
  })
})

describe('pointProgramSchema', () => {
  const base = {
    bank_id: 'KBANK', name: 'K Point',
    point_value_thb: 0.1, valuation_basis: 'cashback',
    valuation_checked_at: '2026-07-15',
  }

  it('รับข้อมูลครบ', () => {
    expect(pointProgramSchema.safeParse(base).success).toBe(true)
  })

  it('ปฏิเสธ point_value_thb = 0', () => {
    expect(pointProgramSchema.safeParse({ ...base, point_value_thb: 0 }).success).toBe(false)
  })

  it('บังคับ valuation_basis — กันคนกรอกคนละมาตรฐาน', () => {
    const { valuation_basis, ...without } = base
    expect(pointProgramSchema.safeParse(without).success).toBe(false)
    expect(pointProgramSchema.safeParse({ ...base, valuation_basis: 'guess' }).success).toBe(false)
  })

  it('point_expiry_months เว้นได้ = ไม่หมดอายุ', () => {
    expect(pointProgramSchema.safeParse({ ...base, point_expiry_months: null }).success).toBe(true)
    expect(pointProgramSchema.safeParse({ ...base, point_expiry_months: 24 }).success).toBe(true)
  })
})

describe('creditCardSchema', () => {
  const base = { bank_id: 'KBANK', card_name: 'Journey Platinum' }

  it('รับข้อมูลขั้นต่ำ', () => {
    expect(creditCardSchema.safeParse(base).success).toBe(true)
  })

  it('point_program_id เว้นได้ = บัตรเงินคืน', () => {
    expect(creditCardSchema.safeParse({ ...base, point_program_id: null }).success).toBe(true)
  })

  it('รับ network ที่ตรงกับ AddCardWizard', () => {
    for (const n of ['visa', 'mastercard', 'jcb', 'amex', 'unionpay']) {
      expect(creditCardSchema.safeParse({ ...base, network: n }).success).toBe(true)
    }
  })

  it('ปฏิเสธ network ที่ไม่รู้จัก', () => {
    expect(creditCardSchema.safeParse({ ...base, network: 'discover' }).success).toBe(false)
  })

  it('รับ annual_fee = 0 (บัตรฟรีค่าธรรมเนียม)', () => {
    expect(creditCardSchema.safeParse({ ...base, annual_fee: 0 }).success).toBe(true)
  })

  it('ปฏิเสธ annual_fee ติดลบ', () => {
    expect(creditCardSchema.safeParse({ ...base, annual_fee: -1 }).success).toBe(false)
  })
})
