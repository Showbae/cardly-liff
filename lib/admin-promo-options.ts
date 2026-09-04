import { prisma } from '@/lib/prisma'

/**
 * ตัวเลือกที่ฟอร์มโปรโมชันต้องใช้ — ธนาคาร · หมวด · บัตร · ร้าน
 *
 * แยกออกมาเพราะหน้า `promotions/new` กับ `promotions/[id]` ต้องการชุดเดียวกัน
 * เป๊ะ ๆ · ถ้าเขียนซ้ำสองที่แล้ววันหนึ่งเพิ่มเงื่อนไขการกรอง (เช่น ซ่อนบัตรที่
 * เลิกออกแล้ว) จะแก้ที่เดียวแล้วอีกหน้ายังใช้ของเก่าโดยไม่มีใครรู้
 */
export async function getPromoFormOptions() {
  const [banks, categories, cards, merchants] = await Promise.all([
    prisma.banks.findMany({ select: { id: true, name_th: true }, orderBy: { id: 'asc' } }),
    prisma.categories.findMany({
      select: { id: true, name_th: true, icon: true },
      orderBy: { sort_order: 'asc' },
    }),
    // บัตรที่เลิกออกแล้วไม่ควรผูกโปรใหม่ — คนที่ถืออยู่ยังเห็นโปรเก่าที่ผูกไว้แล้ว
    prisma.credit_cards.findMany({
      where: { status: 'active' },
      select: { id: true, bank_id: true, card_name: true, card_tier: true },
      orderBy: [{ bank_id: 'asc' }, { card_name: 'asc' }],
    }),
    prisma.merchants.findMany({
      select: { id: true, name_th: true },
      orderBy: { name_th: 'asc' },
    }),
  ])

  return { banks, categories, cards, merchants }
}
