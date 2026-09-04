import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/admin/merchants/[id]
 *
 * FK ของ `transactions.merchant_id` เป็น NoAction — DB ปฏิเสธการลบเองอยู่แล้ว
 * แต่ error ที่ได้เป็นภาษา Postgres ที่คนกรอกอ่านไม่รู้เรื่องและกลายเป็น 500
 * route จึงต้องเช็กก่อนแล้วตอบ 409 พร้อมบอกว่าติดอะไรอยู่กี่รายการ
 */

const findUnique = vi.fn()
const deleteMerchant = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    merchants: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      delete: (...a: unknown[]) => deleteMerchant(...a),
    },
  },
}))

const requireAdmin = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ requireAdmin: (r: NextRequest) => requireAdmin(r) }))

import { DELETE } from './route'

const ID = '22222222-2222-4222-8222-222222222222'

const del = () =>
  DELETE(
    new NextRequest(`http://localhost/api/admin/merchants/${ID}`, { method: 'DELETE' }),
    { params: Promise.resolve({ id: ID }) },
  )

const merchant = (transactions: number, promotion_merchants: number) => ({
  id: ID,
  name_th: 'สตาร์บัคส์',
  _count: { transactions, promotion_merchants },
})

beforeEach(() => {
  vi.clearAllMocks()
  requireAdmin.mockResolvedValue({ email: 'admin@cardly.app' })
})

describe('DELETE /api/admin/merchants/[id]', () => {
  it('ปฏิเสธคนที่ไม่ได้ล็อกอิน', async () => {
    requireAdmin.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    expect((await del()).status).toBe(401)
    expect(deleteMerchant).not.toHaveBeenCalled()
  })

  it('ไม่พบร้าน = 404', async () => {
    findUnique.mockResolvedValue(null)

    expect((await del()).status).toBe(404)
    expect(deleteMerchant).not.toHaveBeenCalled()
  })

  it('ร้านที่มีรายการใช้จ่ายอยู่ = 409 พร้อมบอกจำนวน', async () => {
    findUnique.mockResolvedValue(merchant(12, 0))

    const res = await del()
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error).toContain('12')
    expect(deleteMerchant).not.toHaveBeenCalled()
  })

  it('ร้านที่ผูกโปรอยู่ = 409', async () => {
    findUnique.mockResolvedValue(merchant(0, 3))

    const res = await del()

    expect(res.status).toBe(409)
    expect((await res.json()).error).toContain('3')
    expect(deleteMerchant).not.toHaveBeenCalled()
  })

  it('ร้านที่ไม่มีใครอ้างถึง ลบได้', async () => {
    findUnique.mockResolvedValue(merchant(0, 0))
    deleteMerchant.mockResolvedValue({})

    expect((await del()).status).toBe(200)
    expect(deleteMerchant).toHaveBeenCalledWith({ where: { id: ID } })
  })
})
