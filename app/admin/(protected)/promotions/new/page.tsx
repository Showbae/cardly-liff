import Link from 'next/link'
import { getPromoFormOptions } from '@/lib/admin-promo-options'
import { PromotionFormClient, emptyPromo } from '@/components/admin/PromotionFormClient'

export default async function NewPromotionPage() {
  const { banks, categories, cards, merchants } = await getPromoFormOptions()

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
        promoId={null}
        banks={banks}
        categories={categories}
        cards={cards}
        merchants={merchants}
        initial={emptyPromo}
      />
    </div>
  )
}
