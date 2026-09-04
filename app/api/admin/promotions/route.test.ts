import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Route test ของ POST /api/admin/promotions
 *
 * unit test ใน lib/promo-rate.test.ts พิสูจน์ว่า **สูตรถูก**
 * ไฟล์นี้พิสูจน์ว่า **route เรียกสูตรนั้นจริง** และด่านตรวจต่าง ๆ ทำงาน
 * ก่อนที่ constraint ใน DB จะได้ทำงาน — คนกรอกจะได้เห็นภาษาไทย
 * ไม่ใช่ exception ของ Postgres
 */

const createPromo = vi.fn()
const createManyCards = vi.fn()
const createManyMerchants = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) =>
      fn({
        promotions: { create: createPromo },
        promotion_cards: { createMany: createManyCards },
        promotion_merchants: { createMany: createManyMerchants },
      }),
    ),
  },
}))

const requireAdmin = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ requireAdmin: (r: NextRequest) => requireAdmin(r) }))

import { POST } from './route'

const CARD_ID = '11111111-1111-4111-8111-111111111111'

/** โปรที่ผ่านทุกด่าน — เทสต์แต่ละข้อ override เฉพาะช่องที่กำลังทดสอบ */
const valid = {
  title: 'รับเครดิตเงินคืน 15%',
  bank_id: 'KTC',
  promo_type: 'cashback',
  benefit_value: 15,
  benefit_unit: '%',
  status: 'active',
  source_url: 'https://www.ktc.co.th/promotion/x',
  card_scope: 'all_bank',
  card_ids: [],
  merchant_ids: [],
}

const post = (body: Record<string, unknown>) =>
  POST(
    new NextRequest('http://localhost/api/admin/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )

beforeEach(() => {
  vi.clearAllMocks()
  requireAdmin.mockResolvedValue({ email: 'admin@cardly.app' })
  createPromo.mockResolvedValue({ id: 'new-promo-id' })
})

describe('POST /api/admin/promotions', () => {
  it('ปฏิเสธคนที่ไม่ได้ล็อกอิน — ไม่แตะ DB เลย', async () => {
    requireAdmin.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    )

    const res = await post(valid)

    expect(res.status).toBe(401)
    expect(createPromo).not.toHaveBeenCalled()
  })

  describe('effective_rate_pct — derived ต้องถูกคำนวณให้ ไม่ใช่รับจาก request', () => {
    it('cashback หน่วย % คำนวณให้', async () => {
      await post({ ...valid, benefit_value: 15, benefit_unit: '%' })

      expect(createPromo).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ effective_rate_pct: 15 }),
        }),
      )
    })

    // NULL ที่นี่แปลว่า "หน่วยนี้ยังเทียบไม่ได้" ไม่ใช่ "ยังไม่ได้กรอก"
    it('ผ่อน 0% เทียบไม่ได้ → null ไม่ใช่ 0', async () => {
      await post({
        ...valid,
        promo_type: 'installment',
        benefit_value: 0,
        benefit_unit: '% ดอกเบี้ย',
      })

      expect(createPromo).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ effective_rate_pct: null }),
        }),
      )
    })

    it('คะแนน "2 เท่า" เทียบไม่ได้ → null', async () => {
      await post({ ...valid, promo_type: 'points', benefit_value: 2, benefit_unit: 'เท่า' })

      expect(createPromo).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ effective_rate_pct: null }),
        }),
      )
    })

    it('ไม่รับค่าที่ client ส่งมาเอง — สูตรมีที่เดียว', async () => {
      await post({ ...valid, benefit_value: 15, effective_rate_pct: 999 })

      expect(createPromo).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ effective_rate_pct: 15 }),
        }),
      )
    })
  })

  describe('card_scope — จับก่อน constraint trigger ใน DB จะได้ทำงาน', () => {
    it('specific_cards ที่ไม่ระบุบัตร = 400', async () => {
      const res = await post({ ...valid, card_scope: 'specific_cards', card_ids: [] })

      expect(res.status).toBe(400)
      expect((await res.json()).error).toContain('card_ids')
      expect(createPromo).not.toHaveBeenCalled()
    })

    it('all_bank ที่ดันระบุบัตร = 400', async () => {
      const res = await post({ ...valid, card_scope: 'all_bank', card_ids: [CARD_ID] })

      expect(res.status).toBe(400)
      expect(createPromo).not.toHaveBeenCalled()
    })

    it('specific_cards ที่ระบุบัตรครบ → เขียนแถวเชื่อมให้', async () => {
      const res = await post({ ...valid, card_scope: 'specific_cards', card_ids: [CARD_ID] })

      expect(res.status).toBe(201)
      expect(createManyCards).toHaveBeenCalledWith({
        data: [
          { promotion_id: 'new-promo-id', card_id: CARD_ID, created_by: 'admin@cardly.app' },
        ],
      })
    })

    it('all_bank ไม่เขียนแถวเชื่อมเลย', async () => {
      await post(valid)
      expect(createManyCards).not.toHaveBeenCalled()
    })
  })

  describe('เพดานต้องบอกครบ', () => {
    it('max_cap ที่ไม่บอก cap_period = 400', async () => {
      const res = await post({ ...valid, max_cap: 500 })
      expect(res.status).toBe(400)
    })

    it('max_cap ที่ไม่บอก cap_basis = 400', async () => {
      const res = await post({ ...valid, max_cap: 500, cap_period: 'per_month' })

      expect(res.status).toBe(400)
      expect((await res.json()).error).toContain('cap_basis')
    })

    it('เพดานตลอดรายการน้อยกว่าเพดานต่อรอบ = 400 (มักเป็นการกรอกสลับช่อง)', async () => {
      const res = await post({
        ...valid,
        max_cap: 7500,
        cap_period: 'per_month',
        cap_basis: 'reward',
        max_cap_campaign: 2500,
      })

      expect(res.status).toBe(400)
      expect((await res.json()).error).toContain('max_cap_campaign')
    })

    it('เพดานสองชั้นที่ถูกลำดับ → ผ่าน', async () => {
      const res = await post({
        ...valid,
        max_cap: 2500,
        cap_period: 'per_month',
        cap_basis: 'reward',
        max_cap_campaign: 7500,
      })

      expect(res.status).toBe(201)
    })
  })

  describe('เผยแพร่ต้องตรวจย้อนได้', () => {
    it('status=active ที่ไม่มี source_url = 400', async () => {
      const res = await post({ ...valid, status: 'active', source_url: null })

      expect(res.status).toBe(400)
      expect((await res.json()).error).toContain('source_url')
    })

    it('draft ไม่ต้องมี source_url', async () => {
      const res = await post({ ...valid, status: 'draft', source_url: null })
      expect(res.status).toBe(201)
    })
  })

  it('วันจบมาก่อนวันเริ่ม = 400', async () => {
    const res = await post({ ...valid, start_date: '2026-09-01', end_date: '2026-08-01' })

    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('end_date')
  })

  it('เขียน created_by เป็นอีเมลแอดมินที่ล็อกอินอยู่', async () => {
    await post(valid)

    expect(createPromo).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ created_by: 'admin@cardly.app' }),
      }),
    )
  })
})
