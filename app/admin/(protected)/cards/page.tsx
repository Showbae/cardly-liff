import { prisma } from '@/lib/prisma'
import { CardsClient } from '@/components/admin/CardsClient'

/**
 * รายการบัตรในแคตตาล็อก (งาน 3.5)
 *
 * เรียงให้ **บัตรที่ยังไม่มีอัตราขึ้นก่อน** เพราะหน้านี้ไม่ได้มีไว้ดูเฉย ๆ
 * แต่มีไว้บอกว่า "ยังต้องกรอกอะไรอีก" — บัตรที่ข้อมูลครบแล้วเลื่อนลงล่างได้
 */
export default async function AdminCardsPage() {
  const [cards, banks] = await Promise.all([
    prisma.credit_cards.findMany({
      include: {
        point_programs: { select: { name: true } },
        card_base_benefit: { select: { effective_rate_pct: true } },
        _count: { select: { card_perks: true, users_card: true } },
      },
      orderBy: [{ bank_id: 'asc' }, { card_name: 'asc' }],
    }),
    prisma.banks.findMany({ select: { id: true }, orderBy: { id: 'asc' } }),
  ])

  const rows = cards.map(c => ({
    id: c.id,
    bank_id: c.bank_id ?? '',
    card_name: c.card_name ?? '(ไม่มีชื่อ)',
    card_tier: c.card_tier,
    network: c.network,
    annual_fee: c.annual_fee == null ? null : Number(c.annual_fee),
    status: c.status,
    program_name: c.point_programs?.name ?? null,
    rate_count: c.card_base_benefit.length,
    perk_count: c._count.card_perks,
    holder_count: c._count.users_card,
    best_rate: c.card_base_benefit.length
      ? Math.max(...c.card_base_benefit.map(b => Number(b.effective_rate_pct)))
      : null,
  }))

  return <CardsClient cards={rows} banks={banks.map(b => b.id)} />
}
