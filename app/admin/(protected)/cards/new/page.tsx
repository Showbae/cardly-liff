import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { NewCardClient } from '@/components/admin/NewCardClient'

/**
 * สร้างบัตรใหม่ในแคตตาล็อก
 *
 * segment คงที่ `new` ชนะ `[id]` ใน Next.js routing — ไม่ต้องกัน id ชื่อ "new"
 */
export default async function AdminNewCardPage() {
  const [banks, programs] = await Promise.all([
    prisma.banks.findMany({ select: { id: true, name_th: true }, orderBy: { id: 'asc' } }),
    prisma.point_programs.findMany({
      select: { id: true, bank_id: true, name: true, point_value_thb: true },
      orderBy: [{ bank_id: 'asc' }, { name: 'asc' }],
    }),
  ])

  return (
    <div>
      <Link
        href="/admin/cards"
        className="text-[13px] font-medium inline-block mb-4"
        style={{ color: 'var(--brand-700)' }}
      >
        ← กลับไปรายการบัตร
      </Link>

      <NewCardClient
        banks={banks}
        programs={programs.map(p => ({ ...p, point_value_thb: Number(p.point_value_thb) }))}
      />
    </div>
  )
}
