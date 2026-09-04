import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/admin/promotions/[id]
 *
 * ต่างจาก `PUT /cards/[id]` ตรงที่ตารางเชื่อมถูก **แทนที่ทั้งชุด** ไม่ใช่ sync
 * ทีละแถว — `promotion_cards` / `promotion_merchants` ไม่มีข้อมูลของตัวเอง
 * ที่จะเสียไป จึงลบแล้วสร้างใหม่ได้
 *
 * สิ่งที่เทสต์นี้กัน: การเปลี่ยน `card_scope` จาก specific_cards กลับเป็น
 * all_bank ต้อง **ล้างแถวเดิมทิ้ง** ไม่งั้น constraint trigger ตอน COMMIT
 * จะปฏิเสธทั้งก้อน โดยที่คนกรอกไม่รู้ว่าเพราะอะไร
 */

const promoFindUnique = vi.fn()
const promoUpdate = vi.fn()
const cardsDeleteMany = vi.fn()
const cardsCreateMany = vi.fn()
const merchantsDeleteMany = vi.fn()
const merchantsCreateMany = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    promotions: { findUnique: (...a: unknown[]) => promoFindUnique(...a) },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) =>
      fn({
        promotions: { update: promoUpdate },
        promotion_cards: { deleteMany: cardsDeleteMany, createMany: cardsCreateMany },
        promotion_merchants: {
          deleteMany: merchantsDeleteMany,
          createMany: merchantsCreateMany,
        },
      }),
    ),
  },
}))

const requireAdmin = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ requireAdmin: (r: NextRequest) => requireAdmin(r) }))

import { PUT } from './route'

const PROMO_ID = '77777777-7777-4777-8777-777777777777'
const CARD_ID = '88888888-8888-4888-8888-888888888888'
const MERCHANT_ID = '99999999-9999-4999-8999-999999999999'

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

const put = (body: Record<string, unknown>) =>
  PUT(
    new NextRequest(`http://localhost/api/admin/promotions/${PROMO_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: PROMO_ID }) },
  )

beforeEach(() => {
  vi.clearAllMocks()
  requireAdmin.mockResolvedValue({ email: 'admin@cardly.app' })
  promoFindUnique.mockResolvedValue({ id: PROMO_ID })
})

describe('PUT /api/admin/promotions/[id]', () => {
  it('ปฏิเสธคนที่ไม่ได้ล็อกอิน', async () => {
    requireAdmin.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    expect((await put(valid)).status).toBe(401)
    expect(promoUpdate).not.toHaveBeenCalled()
  })

  it('ไม่พบโปร = 404 ไม่เปิดทรานแซกชัน', async () => {
    promoFindUnique.mockResolvedValue(null)

    expect((await put(valid)).status).toBe(404)
    expect(promoUpdate).not.toHaveBeenCalled()
  })

  it('คำนวณ effective_rate_pct ใหม่ทุกครั้งที่บันทึก', async () => {
    await put({ ...valid, benefit_value: 20 })

    expect(promoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PROMO_ID },
        data: expect.objectContaining({ effective_rate_pct: 20 }),
      }),
    )
  })

  it('เปลี่ยนหน่วยเป็นแบบที่เทียบไม่ได้ → เขียนทับเป็น null ไม่ใช่ค้างค่าเก่า', async () => {
    await put({ ...valid, promo_type: 'points', benefit_value: 2, benefit_unit: 'เท่า' })

    expect(promoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ effective_rate_pct: null }),
      }),
    )
  })

  describe('ตารางเชื่อม — แทนที่ทั้งชุด', () => {
    it('ล้างของเดิมก่อนเสมอ แม้ไม่มีของใหม่', async () => {
      await put(valid)

      expect(cardsDeleteMany).toHaveBeenCalledWith({ where: { promotion_id: PROMO_ID } })
      expect(merchantsDeleteMany).toHaveBeenCalledWith({ where: { promotion_id: PROMO_ID } })
    })

    // เคสที่ trigger ใน DB จะปฏิเสธถ้า route ลืมล้าง — เปลี่ยนขอบเขตกลับเป็น
    // all_bank แล้วแถวเดิมยังค้างอยู่ = COMMIT ไม่ผ่าน
    it('all_bank ล้างแถวบัตรเดิมแต่ไม่สร้างใหม่', async () => {
      await put({ ...valid, card_scope: 'all_bank', card_ids: [] })

      expect(cardsDeleteMany).toHaveBeenCalled()
      expect(cardsCreateMany).not.toHaveBeenCalled()
    })

    it('specific_cards เขียนแถวใหม่พร้อม created_by', async () => {
      await put({ ...valid, card_scope: 'specific_cards', card_ids: [CARD_ID] })

      expect(cardsCreateMany).toHaveBeenCalledWith({
        data: [
          { promotion_id: PROMO_ID, card_id: CARD_ID, created_by: 'admin@cardly.app' },
        ],
      })
    })

    it('ร้านที่ร่วมรายการเขียนแยกจากบัตร', async () => {
      await put({ ...valid, merchant_ids: [MERCHANT_ID] })

      expect(merchantsCreateMany).toHaveBeenCalledWith({
        data: [
          { promotion_id: PROMO_ID, merchant_id: MERCHANT_ID, created_by: 'admin@cardly.app' },
        ],
      })
    })
  })

  describe('ด่านตรวจเดียวกับตอนสร้าง', () => {
    it('specific_cards ที่ไม่ระบุบัตร = 400', async () => {
      const res = await put({ ...valid, card_scope: 'specific_cards', card_ids: [] })

      expect(res.status).toBe(400)
      expect(promoUpdate).not.toHaveBeenCalled()
    })

    it('all_bank ที่ดันระบุบัตร = 400', async () => {
      const res = await put({ ...valid, card_scope: 'all_bank', card_ids: [CARD_ID] })

      expect(res.status).toBe(400)
      expect(promoUpdate).not.toHaveBeenCalled()
    })

    it('เพดานที่ไม่บอก cap_basis = 400', async () => {
      const res = await put({ ...valid, max_cap: 500, cap_period: 'per_month' })

      expect(res.status).toBe(400)
      expect((await res.json()).error).toContain('cap_basis')
    })
  })

  it('เขียน updated_by เป็นอีเมลแอดมินที่ล็อกอินอยู่', async () => {
    await put(valid)

    expect(promoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ updated_by: 'admin@cardly.app' }),
      }),
    )
  })
})
