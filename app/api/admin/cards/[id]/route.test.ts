import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/admin/cards/[id] — บันทึกทั้งใบในทรานแซกชันเดียว
 *
 * เป็น route ที่ซับซ้อนที่สุดในพอร์ทัล: แก้ข้อมูลบัตร + sync แถวอัตราทั้งชุด
 * + sync แถวสิทธิพิเศษทั้งชุด + คำนวณ derived สองตัวต่อแถว
 *
 * unit test ของ `lib/rewards.ts` พิสูจน์ว่าสูตรถูก · ไฟล์นี้พิสูจน์ว่า
 * **route เรียกสูตรแล้วเอาผลไปเขียนลงคอลัมน์ที่ถูก** และแถวที่ไม่ถูกส่งมา
 * ถูกลบจริง ซึ่ง mock ของ Prisma ตัวเดียวมองไม่เห็นถ้าไม่ตรวจ argument
 */

const cardFindUnique = vi.fn()
const programFindUnique = vi.fn()

const cardUpdate = vi.fn()
const benefitDeleteMany = vi.fn()
const benefitUpdate = vi.fn()
const benefitCreate = vi.fn()
const perkDeleteMany = vi.fn()
const perkUpdate = vi.fn()
const perkCreate = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    credit_cards: { findUnique: (...a: unknown[]) => cardFindUnique(...a) },
    point_programs: { findUnique: (...a: unknown[]) => programFindUnique(...a) },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) =>
      fn({
        credit_cards: { update: cardUpdate },
        card_base_benefit: {
          deleteMany: benefitDeleteMany,
          update: benefitUpdate,
          create: benefitCreate,
        },
        card_perks: { deleteMany: perkDeleteMany, update: perkUpdate, create: perkCreate },
      }),
    ),
  },
}))

const requireAdmin = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ requireAdmin: (r: NextRequest) => requireAdmin(r) }))

import { PUT } from './route'

const CARD_ID = '44444444-4444-4444-8444-444444444444'
const PROGRAM_ID = '55555555-5555-4555-8555-555555555555'
const ROW_ID = '66666666-6666-4666-8666-666666666666'

/** ข้อมูลบัตรที่ผ่านทุกด่าน — เทสต์แต่ละข้อ override เฉพาะที่กำลังทดสอบ */
const card = {
  bank_id: 'KTC',
  card_name: 'KTC X',
  status: 'active',
}

const cashbackRow = {
  benefit_type: 'cashback',
  benefit_value: 3,
  benefit_unit: '%',
  requires_registration: false,
}

const put = (body: Record<string, unknown>) =>
  PUT(
    new NextRequest(`http://localhost/api/admin/cards/${CARD_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: CARD_ID }) },
  )

beforeEach(() => {
  vi.clearAllMocks()
  requireAdmin.mockResolvedValue({ email: 'admin@cardly.app' })
  cardFindUnique.mockResolvedValue({ id: CARD_ID })
  programFindUnique.mockResolvedValue({ point_value_thb: 0.12 })
})

describe('PUT /api/admin/cards/[id]', () => {
  it('ปฏิเสธคนที่ไม่ได้ล็อกอิน — ไม่แตะ DB เลย', async () => {
    requireAdmin.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    expect((await put({ card, benefits: [], perks: [] })).status).toBe(401)
    expect(cardUpdate).not.toHaveBeenCalled()
  })

  it('ไม่พบบัตร = 404 ไม่เปิดทรานแซกชัน', async () => {
    cardFindUnique.mockResolvedValue(null)

    expect((await put({ card, benefits: [], perks: [] })).status).toBe(404)
    expect(cardUpdate).not.toHaveBeenCalled()
  })

  it('เลือกโปรแกรมสะสมที่ไม่มีอยู่ = 400', async () => {
    programFindUnique.mockResolvedValue(null)

    const res = await put({
      card: { ...card, point_program_id: PROGRAM_ID },
      benefits: [],
      perks: [],
    })

    expect(res.status).toBe(400)
    expect(cardUpdate).not.toHaveBeenCalled()
  })

  describe('derived — คำนวณให้ ไม่รับจาก request', () => {
    it('เขียน effective_rate_pct ของ cashback', async () => {
      await put({ card, benefits: [cashbackRow], perks: [] })

      expect(benefitCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ effective_rate_pct: 3 }),
      })
    })

    it('points คิดจากค่าแต้มของโปรแกรมที่ผูกไว้', async () => {
      // 3 คะแนน / 25฿ @ ฿0.12 = 1.44%
      await put({
        card: { ...card, point_program_id: PROGRAM_ID },
        benefits: [
          {
            benefit_type: 'points',
            benefit_value: 3,
            benefit_unit: 'คะแนน',
            spend_per_unit: 25,
            requires_registration: false,
          },
        ],
        perks: [],
      })

      expect(benefitCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ effective_rate_pct: 1.44 }),
      })
    })

    it("max_reward_thb ของ cap_basis='reward' คือตัวเลขเดิม", async () => {
      await put({
        card,
        benefits: [
          { ...cashbackRow, max_cap: 500, cap_period: 'per_month', cap_basis: 'reward' },
        ],
        perks: [],
      })

      expect(benefitCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ max_cap: 500, max_reward_thb: 500 }),
      })
    })

    // เลข max_cap เท่ากันแต่ basis ต่างกัน ต้องได้ max_reward_thb คนละค่า —
    // ถ้าเทสต์นี้ผ่านทั้งที่ค่าเท่ากัน แปลว่า route ไม่ได้เรียก capRewardThb จริง
    it("max_reward_thb ของ cap_basis='spend' ต้องคูณอัตรา", async () => {
      await put({
        card,
        benefits: [
          { ...cashbackRow, max_cap: 500, cap_period: 'per_month', cap_basis: 'spend' },
        ],
        perks: [],
      })

      expect(benefitCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ max_cap: 500, max_reward_thb: 15 }),
      })
    })

    it('ไม่มีเพดาน → max_reward_thb เป็น null', async () => {
      await put({ card, benefits: [cashbackRow], perks: [] })

      expect(benefitCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ max_reward_thb: null }),
      })
    })
  })

  describe('ข้อความ error ต้องบอกว่าแถวไหน', () => {
    it('บอกเลขแถวที่คำนวณไม่ได้ ไม่ใช่ล้มทั้งก้อนแบบไม่รู้สาเหตุ', async () => {
      const res = await put({
        card,
        benefits: [
          cashbackRow,
          // ส่วนลดหน่วย 'บาท/ลิตร' แปลงเป็น % ไม่ได้
          {
            benefit_type: 'discount',
            benefit_value: 1,
            benefit_unit: 'บาท/ลิตร',
            requires_registration: false,
          },
        ],
        perks: [],
      })

      expect(res.status).toBe(400)
      expect((await res.json()).error).toContain('แถวที่ 2')
      expect(cardUpdate).not.toHaveBeenCalled()
    })

    it('มีแถวคะแนนแต่ไม่ผูกโปรแกรมสะสม = 400 (ตรงกับ trigger ใน DB)', async () => {
      const res = await put({
        card,
        benefits: [
          {
            benefit_type: 'points',
            benefit_value: 1,
            benefit_unit: 'คะแนน',
            spend_per_unit: 25,
            requires_registration: false,
          },
        ],
        perks: [],
      })

      expect(res.status).toBe(400)
      expect((await res.json()).error).toContain('point_program_id')
    })
  })

  describe('sync แถวลูก', () => {
    it('sort_order มาจากลำดับใน array — คือผลของปุ่ม ▲▼ บนฟอร์ม', async () => {
      await put({
        card,
        benefits: [
          { ...cashbackRow, benefit_value: 1 },
          { ...cashbackRow, benefit_value: 2 },
          { ...cashbackRow, benefit_value: 3 },
        ],
        perks: [],
      })

      const orders = benefitCreate.mock.calls.map(c => c[0].data.sort_order)
      expect(orders).toEqual([0, 1, 2])
    })

    it('แถวที่มี id = แก้ของเดิม (คง created_by ไว้) · ไม่มี id = แถวใหม่', async () => {
      await put({
        card,
        benefits: [{ ...cashbackRow, id: ROW_ID }, cashbackRow],
        perks: [],
      })

      expect(benefitUpdate).toHaveBeenCalledTimes(1)
      expect(benefitUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ROW_ID } }),
      )
      expect(benefitCreate).toHaveBeenCalledTimes(1)
      expect(benefitCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ created_by: 'admin@cardly.app' }),
      })
    })

    it('แถวเดิมที่ไม่ถูกส่งมา ถูกลบ', async () => {
      await put({ card, benefits: [{ ...cashbackRow, id: ROW_ID }], perks: [] })

      expect(benefitDeleteMany).toHaveBeenCalledWith({
        where: { card_id: CARD_ID, id: { notIn: [ROW_ID] } },
      })
    })

    it('ส่ง benefits ว่าง = ลบทุกแถวของบัตรใบนี้', async () => {
      await put({ card, benefits: [], perks: [] })

      expect(benefitDeleteMany).toHaveBeenCalledWith({ where: { card_id: CARD_ID } })
      expect(benefitCreate).not.toHaveBeenCalled()
    })
  })

  // คอลัมน์นี้เคยถูกเซ็ตเป็น null ทับทุกครั้งที่บันทึก เพราะฟอร์มไม่เคยส่งมา
  it('perk.description ถูกบันทึกจริง', async () => {
    await put({
      card,
      benefits: [],
      perks: [
        {
          perk_type: 'lounge',
          title: 'ห้องรับรองสนามบิน',
          description: 'ใช้ได้ที่เลานจ์ในเครือ Priority Pass',
        },
      ],
    })

    expect(perkCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: 'ใช้ได้ที่เลานจ์ในเครือ Priority Pass',
      }),
    })
  })

  it('เขียน updated_by เป็นอีเมลแอดมินที่ล็อกอินอยู่', async () => {
    await put({ card, benefits: [], perks: [] })

    expect(cardUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CARD_ID },
        data: expect.objectContaining({ updated_by: 'admin@cardly.app' }),
      }),
    )
  })
})
