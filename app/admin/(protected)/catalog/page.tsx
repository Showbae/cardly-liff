import { prisma } from '@/lib/prisma'
import { CatalogClient } from '@/components/admin/CatalogClient'

/** ร้านค้า + หมวด — ดึงตรงจาก Prisma เหมือนหน้าอื่นในพอร์ทัล */
export default async function CatalogPage() {
  const [categories, merchants] = await Promise.all([
    prisma.categories.findMany({
      include: {
        _count: { select: { merchants: true, promotions: true, card_base_benefit: true } },
      },
      orderBy: [{ sort_order: 'asc' }, { name_th: 'asc' }],
    }),
    prisma.merchants.findMany({
      include: {
        categories: { select: { name_th: true } },
        _count: { select: { transactions: true, promotion_merchants: true } },
      },
      orderBy: { name_th: 'asc' },
    }),
  ])

  return (
    <CatalogClient
      categories={categories.map(c => ({
        id: c.id,
        name_th: c.name_th,
        name_eng: c.name_eng,
        icon: c.icon,
        sort_order: c.sort_order,
        merchant_count: c._count.merchants,
        promo_count: c._count.promotions,
        rate_count: c._count.card_base_benefit,
      }))}
      merchants={merchants.map(m => ({
        id: m.id,
        name_th: m.name_th,
        name_eng: m.name_eng,
        mcc_code: m.mcc_code,
        logo_url: m.logo_url,
        category_id: m.category_id,
        category_name: m.categories?.name_th ?? null,
        tx_count: m._count.transactions,
        promo_count: m._count.promotion_merchants,
      }))}
    />
  )
}
