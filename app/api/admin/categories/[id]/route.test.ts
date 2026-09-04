import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/admin/categories/[id]
 *
 * หมวดเป็นแกนที่เชื่อม merchants ↔ promotions ↔ card_base_benefit
 * ลบหมวดที่ยังมีคนใช้ = ตัดสายที่ระบบแนะนำบัตรเดินอยู่ · ต้องนับทั้งสามทาง
 * ไม่ใช่แค่ทางเดียว
 */

const findUnique = vi.fn()
const deleteCategory = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    categories: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      delete: (...a: unknown[]) => deleteCategory(...a),
    },
  },
}))

const requireAdmin = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ requireAdmin: (r: NextRequest) => requireAdmin(r) }))

import { DELETE } from './route'

const ID = '33333333-3333-4333-8333-333333333333'

const del = () =>
  DELETE(
    new NextRequest(`http://localhost/api/admin/categories/${ID}`, { method: 'DELETE' }),
    { params: Promise.resolve({ id: ID }) },
  )

const category = (merchants: number, promotions: number, card_base_benefit: number) => ({
  id: ID,
  name_th: 'ร้านอาหาร',
  _count: { merchants, promotions, card_base_benefit },
})

beforeEach(() => {
  vi.clearAllMocks()
  requireAdmin.mockResolvedValue({ email: 'admin@cardly.app' })
})

describe('DELETE /api/admin/categories/[id]', () => {
  it('ปฏิเสธคนที่ไม่ได้ล็อกอิน', async () => {
    requireAdmin.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    expect((await del()).status).toBe(401)
    expect(deleteCategory).not.toHaveBeenCalled()
  })

  it('ไม่พบหมวด = 404', async () => {
    findUnique.mockResolvedValue(null)
    expect((await del()).status).toBe(404)
  })

  // แต่ละทางต้องกันได้ด้วยตัวเอง — เช็กแค่ merchants แล้วปล่อยอีกสองทางผ่าน
  // คือบั๊กที่จะเจอตอน production เท่านั้น
  it.each([
    ['ร้านค้า', 5, 0, 0],
    ['โปรโมชัน', 0, 4, 0],
    ['อัตราตอบแทน', 0, 0, 7],
  ])('หมวดที่ยังมี%sอ้างถึง = 409', async (_label, m, p, b) => {
    findUnique.mockResolvedValue(category(m, p, b))

    const res = await del()

    expect(res.status).toBe(409)
    expect(deleteCategory).not.toHaveBeenCalled()
  })

  it('หมวดที่ไม่มีใครอ้างถึง ลบได้', async () => {
    findUnique.mockResolvedValue(category(0, 0, 0))
    deleteCategory.mockResolvedValue({})

    expect((await del()).status).toBe(200)
    expect(deleteCategory).toHaveBeenCalledWith({ where: { id: ID } })
  })
})
