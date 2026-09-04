import { prisma } from '@/lib/prisma'
import { PromotionsClient } from '@/components/admin/PromotionsClient'
import type { AdminPromoRow } from '@/app/api/admin/promotions/route'

/**
 * รายการโปรโมชัน — ดึงตรงจาก Prisma ไม่เรียก API ตัวเอง
 * (เหตุผลเดียวกับหน้าโปรแกรมสะสม · route API มีไว้ให้ client เรียกตอน mutate)
 */
export default async function PromotionsPage() {
  const promos = await prisma.promotions.findMany({
    include: {
      categories: { select: { name_th: true } },
      _count: { select: { promotion_cards: true, promotion_merchants: true } },
    },
    orderBy: [{ status: 'asc' }, { end_date: 'asc' }],
  })

  const rows: AdminPromoRow[] = promos.map(p => ({
    id: p.id,
    title: p.title,
    bank_id: p.bank_id,
    promo_type: p.promo_type,
    benefit_value: p.benefit_value == null ? null : Number(p.benefit_value),
    benefit_unit: p.benefit_unit,
    effective_rate_pct: p.effective_rate_pct == null ? null : Number(p.effective_rate_pct),
    status: p.status,
    card_scope: p.card_scope,
    requires_registration: p.requires_registration,
    start_date: p.start_date?.toISOString().slice(0, 10) ?? null,
    end_date: p.end_date?.toISOString().slice(0, 10) ?? null,
    category_name: p.categories?.name_th ?? null,
    card_count: p._count.promotion_cards,
    merchant_count: p._count.promotion_merchants,
  }))

  return <PromotionsClient promos={rows} />
}
