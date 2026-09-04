import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getPromoFormOptions } from '@/lib/admin-promo-options'
import { PromotionFormClient } from '@/components/admin/PromotionFormClient'

/** วันที่จาก DB → 'YYYY-MM-DD' ที่ `<input type="date">` ต้องการ */
const day = (d: Date | null) => d?.toISOString().slice(0, 10) ?? ''

export default async function PromotionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [promo, options] = await Promise.all([
    prisma.promotions.findUnique({
      where: { id },
      include: {
        promotion_cards: { select: { card_id: true } },
        promotion_merchants: { select: { merchant_id: true } },
      },
    }),
    getPromoFormOptions(),
  ])

  if (!promo) notFound()

  return (
    <div>
      <Link
        href="/admin/promotions"
        className="text-[13px] font-medium inline-block mb-4"
        style={{ color: 'var(--brand-700)' }}
      >
        ← กลับไปรายการโปรโมชัน
      </Link>

      <PromotionFormClient
        promoId={promo.id}
        banks={options.banks}
        categories={options.categories}
        cards={options.cards}
        merchants={options.merchants}
        initial={{
          title: promo.title,
          description: promo.description ?? '',
          promo_type: promo.promo_type ?? '',
          benefit_value: promo.benefit_value == null ? '' : String(Number(promo.benefit_value)),
          benefit_unit: promo.benefit_unit ?? '',
          min_spend: promo.min_spend == null ? '' : String(Number(promo.min_spend)),
          max_cap: promo.max_cap == null ? '' : String(Number(promo.max_cap)),
          cap_period: promo.cap_period ?? '',
          cap_basis: promo.cap_basis ?? '',
          max_cap_campaign:
            promo.max_cap_campaign == null ? '' : String(Number(promo.max_cap_campaign)),
          category_id: promo.category_id ?? '',
          bank_id: promo.bank_id ?? '',
          start_date: day(promo.start_date),
          end_date: day(promo.end_date),
          requires_registration: promo.requires_registration,
          condition: promo.condition ?? '',
          source_url: promo.source_url ?? '',
          status: promo.status ?? 'draft',
          card_scope: promo.card_scope,
          card_ids: promo.promotion_cards.map(c => c.card_id),
          merchant_ids: promo.promotion_merchants.map(m => m.merchant_id),
        }}
      />
    </div>
  )
}
