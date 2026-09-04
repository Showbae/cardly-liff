import { prisma } from '@/lib/prisma'
import { ProgramsClient } from '@/components/admin/ProgramsClient'

/**
 * โปรแกรมสะสมแต้ม (งาน 3.4)
 *
 * ดึงข้อมูลตรงจาก Prisma ไม่เรียก `/api/admin/programs` ของตัวเอง —
 * Server Component ต่อ DB ได้อยู่แล้ว เรียก API ตัวเองจะเสีย round trip
 * เปล่า ๆ · route API มีไว้ให้ฝั่ง client เรียกตอน mutate
 *
 * ── ทำไมต้องดึงบัตรมาด้วย ──────────────────────────────────────────────
 *
 * `point_value_thb` ของแถวเดียวเป็นต้นน้ำของ `effective_rate_pct` ทุกแถว
 * ของทุกบัตรในโปรแกรม · คนที่กำลังจะแก้ตัวเลขนี้ต้องเห็นว่ากระทบ **บัตรใบไหน
 * และเปลี่ยนเป็นเท่าไหร่** ก่อนกดบันทึก ไม่ใช่รู้ทีหลังตอน recompute ทำงานไปแล้ว
 */

/** อัตราแบบที่จะขยับตามค่าแต้ม — เงินคืน/ส่วนลดคิดเป็น % ตรง ๆ ไม่เกี่ยวกับค่าแต้ม */
const SCALES_WITH_POINT_VALUE = new Set(['points', 'miles'])

export default async function ProgramsPage() {
  const [programs, banks] = await Promise.all([
    prisma.point_programs.findMany({
      include: {
        credit_cards: {
          select: {
            id: true,
            card_name: true,
            card_base_benefit: {
              select: { effective_rate_pct: true, benefit_type: true },
            },
          },
          orderBy: { card_name: 'asc' },
        },
      },
      orderBy: [{ bank_id: 'asc' }, { name: 'asc' }],
    }),
    prisma.banks.findMany({
      select: { id: true, name_th: true },
      orderBy: { id: 'asc' },
    }),
  ])

  return (
    <ProgramsClient
      banks={banks}
      programs={programs.map(p => ({
        id: p.id,
        bank_id: p.bank_id,
        name: p.name,
        point_value_thb: Number(p.point_value_thb),
        valuation_basis: p.valuation_basis,
        valuation_source_url: p.valuation_source_url,
        valuation_checked_at: p.valuation_checked_at.toISOString().slice(0, 10),
        point_expiry_months: p.point_expiry_months,
        min_redemption: p.min_redemption,
        cards: p.credit_cards.map(c => ({
          id: c.id,
          name: c.card_name ?? '(ไม่มีชื่อ)',
          rates: c.card_base_benefit.map(b => ({
            pct: Number(b.effective_rate_pct),
            // แยกไว้เพราะบัตรใบเดียวมีทั้งแถวคะแนนและแถวเงินคืนพร้อมกันได้
            // ถ้าคูณทั้งชุดตอนพรีวิว แถวเงินคืนจะเพี้ยนทั้งที่ค่าแต้มไม่เกี่ยวกับมัน
            scales: SCALES_WITH_POINT_VALUE.has(b.benefit_type),
          })),
        })),
      }))}
    />
  )
}
