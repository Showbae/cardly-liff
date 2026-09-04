import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CardDetailClient } from '@/components/admin/CardDetailClient'

/** ฟอร์มแก้บัตร — ข้อมูลบัตร + อัตราตอบแทน + สิทธิพิเศษ (งาน 3.6 · 3.7) */
export default async function AdminCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [card, banks, programs, categories] = await Promise.all([
    prisma.credit_cards.findUnique({
      where: { id },
      include: {
        card_base_benefit: { orderBy: { sort_order: 'asc' } },
        card_perks: { orderBy: { sort_order: 'asc' } },
        _count: { select: { users_card: true } },
      },
    }),
    prisma.banks.findMany({ select: { id: true, name_th: true }, orderBy: { id: 'asc' } }),
    prisma.point_programs.findMany({
      select: { id: true, bank_id: true, name: true, point_value_thb: true },
      orderBy: [{ bank_id: 'asc' }, { name: 'asc' }],
    }),
    prisma.categories.findMany({
      select: { id: true, name_th: true, icon: true },
      orderBy: { sort_order: 'asc' },
    }),
  ])

  if (!card) notFound()

  return (
    <div>
      <Link
        href="/admin/cards"
        className="text-[13px] font-medium inline-block mb-4"
        style={{ color: 'var(--brand-700)' }}
      >
        ← กลับไปรายการบัตร
      </Link>

      <CardDetailClient
        cardId={card.id}
        holderCount={card._count.users_card}
        banks={banks}
        programs={programs.map(p => ({ ...p, point_value_thb: Number(p.point_value_thb) }))}
        categories={categories}
        initialCard={{
          bank_id: card.bank_id ?? '',
          card_name: card.card_name ?? '',
          card_tier: card.card_tier ?? '',
          image_url: card.image_url ?? '',
          point_program_id: card.point_program_id ?? '',
          network: card.network ?? '',
          annual_fee: card.annual_fee == null ? '' : String(Number(card.annual_fee)),
          fee_waiver_condition: card.fee_waiver_condition ?? '',
          foreign_tx_fee_pct:
            card.foreign_tx_fee_pct == null ? '' : String(Number(card.foreign_tx_fee_pct)),
          status: card.status,
        }}
        initialBenefits={card.card_base_benefit.map(b => ({
          id: b.id,
          category_id: b.category_id ?? '',
          benefit_type: b.benefit_type,
          benefit_value: String(Number(b.benefit_value)),
          benefit_unit: b.benefit_unit,
          spend_per_unit: b.spend_per_unit == null ? '' : String(Number(b.spend_per_unit)),
          min_spend: b.min_spend == null ? '' : String(Number(b.min_spend)),
          min_spend_basis: b.min_spend_basis ?? '',
          max_cap: b.max_cap == null ? '' : String(Number(b.max_cap)),
          cap_period: b.cap_period ?? '',
          cap_basis: b.cap_basis ?? '',
          requires_registration: b.requires_registration,
          condition: b.condition ?? '',
        }))}
        initialPerks={card.card_perks.map(p => ({
          id: p.id,
          perk_type: p.perk_type,
          title: p.title,
          value_text: p.value_text ?? '',
          description: p.description ?? '',
          condition: p.condition ?? '',
        }))}
      />
    </div>
  )
}
