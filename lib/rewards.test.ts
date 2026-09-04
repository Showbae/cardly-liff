import { describe, it, expect } from 'vitest'
import {
  capRewardThb,
  effectiveRatePct,
  tryCapRewardThb,
  tryEffectiveRatePct,
  RewardCalculationError,
  type BenefitInput,
} from './rewards'

// โปรแกรมสะสมตามตัวอย่างใน docs/data-model.md
const K_POINT = { point_value_thb: 0.10 }   // KBANK
const FOREVER = { point_value_thb: 0.12 }   // KTC

function benefit(over: Partial<BenefitInput> = {}): BenefitInput {
  return {
    benefit_type: 'cashback',
    benefit_value: 1,
    benefit_unit: '%',
    spend_per_unit: null,
    ...over,
  }
}

describe('effectiveRatePct', () => {
  describe('cashback — หน่วยเป็น % อยู่แล้ว', () => {
    it('คืนค่าเดิมเมื่อเป็น %', () => {
      expect(effectiveRatePct(benefit({ benefit_value: 8 }), null)).toBe(8)
    })

    it('รองรับทศนิยม', () => {
      expect(effectiveRatePct(benefit({ benefit_value: 0.3 }), null)).toBe(0.3)
    })

    it('ไม่สนใจ program ที่ส่งมา เพราะไม่ต้องแปลงหน่วย', () => {
      expect(effectiveRatePct(benefit({ benefit_value: 2 }), K_POINT)).toBe(2)
    })

    it('โยน error เมื่อหน่วยเป็นบาท เพราะต้องรู้ยอดที่รูดก่อน', () => {
      expect(() =>
        effectiveRatePct(benefit({ benefit_value: 50, benefit_unit: 'บาท' }), null),
      ).toThrow(RewardCalculationError)
    })
  })

  describe('points — ต้องแปลงหน่วยเป็นบาท', () => {
    it('1 คะแนน/25 บาท @ ฿0.10 = 0.4%', () => {
      const result = effectiveRatePct(
        benefit({
          benefit_type: 'points',
          benefit_value: 1,
          benefit_unit: 'คะแนน',
          spend_per_unit: 25,
        }),
        K_POINT,
      )
      expect(result).toBe(0.4)
    })

    it('3 คะแนน/25 บาท @ ฿0.12 = 1.44%', () => {
      const result = effectiveRatePct(
        benefit({
          benefit_type: 'points',
          benefit_value: 3,
          benefit_unit: 'คะแนน',
          spend_per_unit: 25,
        }),
        FOREVER,
      )
      expect(result).toBe(1.44)
    })

    it('x3 คะแนน (1.44%) ชนะ x2 (0.8%) แต่ยังแพ้เงินคืน 2%', () => {
      const x3 = effectiveRatePct(
        benefit({ benefit_type: 'points', benefit_value: 3, benefit_unit: 'คะแนน', spend_per_unit: 25 }),
        FOREVER,
      )
      const x2 = effectiveRatePct(
        benefit({ benefit_type: 'points', benefit_value: 2, benefit_unit: 'คะแนน', spend_per_unit: 25 }),
        K_POINT,
      )
      const cashback2 = effectiveRatePct(benefit({ benefit_value: 2 }), null)

      expect(x3).toBeGreaterThan(x2)
      expect(x3).toBeLessThan(cashback2)
    })

    it('miles คิดสูตรเดียวกับ points', () => {
      const args = { benefit_value: 2, benefit_unit: 'ไมล์', spend_per_unit: 20 } as const
      expect(effectiveRatePct(benefit({ benefit_type: 'miles', ...args }), K_POINT)).toBe(
        effectiveRatePct(benefit({ benefit_type: 'points', ...args }), K_POINT),
      )
    })

    it('ปัดเป็น 4 ตำแหน่งให้ตรงกับ numeric(8,4)', () => {
      // 1 × 0.10 ÷ 30 × 100 = 0.3333...
      const result = effectiveRatePct(
        benefit({ benefit_type: 'points', benefit_value: 1, benefit_unit: 'คะแนน', spend_per_unit: 30 }),
        K_POINT,
      )
      expect(result).toBe(0.3333)
    })

    it('โยน error เมื่อบัตรไม่ได้ผูกโปรแกรมสะสม', () => {
      expect(() =>
        effectiveRatePct(
          benefit({ benefit_type: 'points', benefit_value: 1, benefit_unit: 'คะแนน', spend_per_unit: 25 }),
          null,
        ),
      ).toThrow(/point_program/)
    })

    it('โยน error เมื่อไม่มี spend_per_unit — "3 คะแนน" ไม่มีความหมายลอย ๆ', () => {
      expect(() =>
        effectiveRatePct(
          benefit({ benefit_type: 'points', benefit_value: 3, benefit_unit: 'คะแนน', spend_per_unit: null }),
          K_POINT,
        ),
      ).toThrow(/spend_per_unit/)
    })

    it('โยน error เมื่อ spend_per_unit = 0 แทนที่จะคืน Infinity', () => {
      expect(() =>
        effectiveRatePct(
          benefit({ benefit_type: 'points', benefit_value: 1, benefit_unit: 'คะแนน', spend_per_unit: 0 }),
          K_POINT,
        ),
      ).toThrow(RewardCalculationError)
    })

    it('โยน error เมื่อ point_value_thb = 0', () => {
      expect(() =>
        effectiveRatePct(
          benefit({ benefit_type: 'points', benefit_value: 1, benefit_unit: 'คะแนน', spend_per_unit: 25 }),
          { point_value_thb: 0 },
        ),
      ).toThrow(/point_value_thb/)
    })
  })

  describe('discount', () => {
    it('หน่วย % แปลงตรง ๆ', () => {
      expect(
        effectiveRatePct(benefit({ benefit_type: 'discount', benefit_value: 30 }), null),
      ).toBe(30)
    })

    it('บาท/ลิตร ยังแปลงไม่ได้ — ต้องโยน error ไม่ใช่เดาราคาน้ำมัน', () => {
      expect(() =>
        effectiveRatePct(
          benefit({ benefit_type: 'discount', benefit_value: 1, benefit_unit: 'บาท/ลิตร' }),
          null,
        ),
      ).toThrow(/ยังแปลงเป็น % ไม่ได้/)
    })
  })

  describe('ค่าที่ใช้ไม่ได้', () => {
    it('ปฏิเสธค่าติดลบ', () => {
      expect(() => effectiveRatePct(benefit({ benefit_value: -1 }), null)).toThrow(
        RewardCalculationError,
      )
    })

    it('ปฏิเสธ NaN', () => {
      expect(() => effectiveRatePct(benefit({ benefit_value: NaN }), null)).toThrow(
        RewardCalculationError,
      )
    })

    it('ยอมรับ 0 (บัตรที่ไม่ให้อะไรในหมวดนั้น)', () => {
      expect(effectiveRatePct(benefit({ benefit_value: 0 }), null)).toBe(0)
    })
  })
})

describe('tryEffectiveRatePct', () => {
  it('คืน null แทนการโยน error', () => {
    const result = tryEffectiveRatePct(
      benefit({ benefit_type: 'points', benefit_value: 1, benefit_unit: 'คะแนน', spend_per_unit: 25 }),
      null,
    )
    expect(result).toBeNull()
  })

  it('คืนตัวเลขตามปกติเมื่อคำนวณได้', () => {
    expect(tryEffectiveRatePct(benefit({ benefit_value: 8 }), null)).toBe(8)
  })
})

// ── เพดาน ────────────────────────────────────────────────────────────────

describe('capRewardThb', () => {
  it('คืน null เมื่อไม่มีเพดาน', () => {
    expect(capRewardThb({ ...benefit(), max_cap: null, cap_basis: null }, null)).toBeNull()
  })

  describe("cap_basis='reward' — เพดานของที่ได้", () => {
    it('cashback เป็นบาทอยู่แล้ว คืนค่าเดิม', () => {
      expect(
        capRewardThb(
          { ...benefit({ benefit_value: 3 }), max_cap: 500, cap_basis: 'reward' },
          null,
        ),
      ).toBe(500)
    })

    it('points เป็นคะแนน ต้องคูณค่าแต้ม', () => {
      // 20,000 คะแนน × ฿0.12 = ฿2,400
      expect(
        capRewardThb(
          {
            ...benefit({ benefit_type: 'points', benefit_value: 3, benefit_unit: 'คะแนน', spend_per_unit: 25 }),
            max_cap: 20000,
            cap_basis: 'reward',
          },
          FOREVER,
        ),
      ).toBe(2400)
    })

    it('points ที่ไม่มี program คำนวณไม่ได้', () => {
      expect(() =>
        capRewardThb(
          {
            ...benefit({ benefit_type: 'points', benefit_value: 1, benefit_unit: 'คะแนน', spend_per_unit: 25 }),
            max_cap: 20000,
            cap_basis: 'reward',
          },
          null,
        ),
      ).toThrow(RewardCalculationError)
    })
  })

  describe("cap_basis='spend' — เพดานของยอดที่นับ", () => {
    it('คูณด้วยอัตราถึงจะได้มูลค่าจริง', () => {
      // ยอดไม่เกิน ฿10,000 ที่ 3% = ได้จริง ฿300
      expect(
        capRewardThb(
          { ...benefit({ benefit_value: 3 }), max_cap: 10000, cap_basis: 'spend' },
          null,
        ),
      ).toBe(300)
    })

    it('เลข max_cap เท่ากันแต่ basis ต่างกัน ให้ผลต่างกัน — เหตุผลที่คอลัมน์นี้ต้องมี', () => {
      const reward = capRewardThb(
        { ...benefit({ benefit_value: 3 }), max_cap: 500, cap_basis: 'reward' },
        null,
      )
      const spend = capRewardThb(
        { ...benefit({ benefit_value: 3 }), max_cap: 500, cap_basis: 'spend' },
        null,
      )
      expect(reward).toBe(500)
      expect(spend).toBe(15)
      expect(reward).not.toBe(spend)
    })

    it('points ใช้อัตราที่แปลงแล้ว', () => {
      // 3 คะแนน/25฿ @ ฿0.12 = 1.44% · ยอด ฿50,000 → ฿720
      expect(
        capRewardThb(
          {
            ...benefit({ benefit_type: 'points', benefit_value: 3, benefit_unit: 'คะแนน', spend_per_unit: 25 }),
            max_cap: 50000,
            cap_basis: 'spend',
          },
          FOREVER,
        ),
      ).toBe(720)
    })
  })

  it('มีเพดานแต่ไม่บอก basis = คำนวณไม่ได้ ไม่ใช่เดา', () => {
    expect(() =>
      capRewardThb({ ...benefit({ benefit_value: 3 }), max_cap: 500, cap_basis: null }, null),
    ).toThrow(RewardCalculationError)
  })

  it('max_cap ติดลบไม่ได้', () => {
    expect(() =>
      capRewardThb({ ...benefit(), max_cap: -1, cap_basis: 'reward' }, null),
    ).toThrow(RewardCalculationError)
  })
})

describe('tryCapRewardThb', () => {
  it('คืน null แทนการโยน error', () => {
    expect(
      tryCapRewardThb({ ...benefit(), max_cap: 500, cap_basis: null }, null),
    ).toBeNull()
  })
})
