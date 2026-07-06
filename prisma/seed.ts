import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  // ── Categories ──────────────────────────────────────────────
  const [cafe, restaurant, super_, fuel, shopping, hospital] = await Promise.all([
    upsertCategory('คาเฟ่',            'Cafe',          '☕', 1),
    upsertCategory('ร้านอาหาร',        'Restaurant',    '🍜', 2),
    upsertCategory('ซูเปอร์มาร์เก็ต',  'Supermarket',   '🛒', 3),
    upsertCategory('น้ำมัน',            'Fuel',          '⛽', 4),
    upsertCategory('ช้อปปิ้ง',          'Shopping',      '🛍️', 5),
    upsertCategory('โรงพยาบาล',        'Hospital',      '🏥', 6),
  ])

  // ── Merchants ───────────────────────────────────────────────
  const [starbucks, amazon, mk, mcdonalds, kfc, lotus, bigc, ptt, bangchak, central, samitivej, bumrungrad] = await Promise.all([
    upsertMerchant('Starbucks',      cafe.id),
    upsertMerchant('Amazon Coffee',  cafe.id),
    upsertMerchant('MK Restaurant',  restaurant.id),
    upsertMerchant("McDonald's",     restaurant.id),
    upsertMerchant('KFC',            restaurant.id),
    upsertMerchant("Lotus's",        super_.id),
    upsertMerchant('BigC',           super_.id),
    upsertMerchant('ปตท.',           fuel.id),
    upsertMerchant('Bangchak',       fuel.id),
    upsertMerchant('Central',        shopping.id),
    upsertMerchant('Samitivej',      hospital.id),
    upsertMerchant('Bumrungrad',     hospital.id),
  ])

  // ── Promotions (20 รายการ) ──────────────────────────────────
  const promos = await Promise.all([
    // คาเฟ่ (4)
    createPromo({ title: 'KBank คืน 15% ที่ Starbucks', bank_id: 'KBANK', category_id: cafe.id, promo_type: 'cashback', benefit_value: 15, benefit_unit: '%', min_spend: 100, max_cap: 100, end_date: d('2026-07-31'), condition: 'ชำระผ่านบัตรเครดิต KBank ทุกประเภท', merchant_id: starbucks.id }),
    createPromo({ title: 'SCB ลด 30% ที่ Amazon Coffee', bank_id: 'SCB', category_id: cafe.id, promo_type: 'discount', benefit_value: 30, benefit_unit: '%', min_spend: 80, max_cap: 60, end_date: d('2026-08-31'), condition: 'เฉพาะวันจันทร์–ศุกร์', merchant_id: amazon.id }),
    createPromo({ title: 'KTC คืน 10% ร้านกาแฟทุกร้าน', bank_id: 'KTC', category_id: cafe.id, promo_type: 'cashback', benefit_value: 10, benefit_unit: '%', min_spend: 200, max_cap: 80, end_date: d('2026-07-15'), condition: 'ทุกวัน ไม่จำกัดร้าน' }),
    createPromo({ title: 'UOB ลด 20% คาเฟ่ในห้าง', bank_id: 'UOB', category_id: cafe.id, promo_type: 'discount', benefit_value: 20, benefit_unit: '%', min_spend: 150, max_cap: 100, end_date: d('2026-07-31'), condition: 'เฉพาะร้านในห้างสรรพสินค้า' }),

    // ร้านอาหาร (4)
    createPromo({ title: 'KBank คืน 10% ที่ MK Restaurant', bank_id: 'KBANK', category_id: restaurant.id, promo_type: 'cashback', benefit_value: 10, benefit_unit: '%', min_spend: 500, max_cap: 200, end_date: d('2026-07-31'), condition: 'ทุกสาขาทั่วประเทศ', merchant_id: mk.id }),
    createPromo({ title: "BBL ลด 30% ที่ McDonald's", bank_id: 'BBL', category_id: restaurant.id, promo_type: 'discount', benefit_value: 30, benefit_unit: '%', min_spend: 150, max_cap: 100, end_date: d('2026-07-20'), condition: 'เฉพาะบัตร Bangkok Bank Platinum', merchant_id: mcdonalds.id }),
    createPromo({ title: 'KTC คืน 8% ที่ KFC', bank_id: 'KTC', category_id: restaurant.id, promo_type: 'cashback', benefit_value: 8, benefit_unit: '%', min_spend: 200, max_cap: 120, end_date: d('2026-07-31'), condition: 'สูงสุด 5 ครั้ง/เดือน', merchant_id: kfc.id }),
    createPromo({ title: 'SCB คืน 5% ร้านอาหารทุกประเภท', bank_id: 'SCB', category_id: restaurant.id, promo_type: 'cashback', benefit_value: 5, benefit_unit: '%', min_spend: 300, max_cap: 150, end_date: d('2026-08-31'), condition: 'รวมร้าน delivery' }),

    // ซูเปอร์มาร์เก็ต (4)
    createPromo({ title: "KBank คืน 5% ที่ Lotus's", bank_id: 'KBANK', category_id: super_.id, promo_type: 'cashback', benefit_value: 5, benefit_unit: '%', min_spend: 500, max_cap: 200, end_date: d('2026-07-31'), condition: 'เฉพาะวันเสาร์–อาทิตย์', merchant_id: lotus.id }),
    createPromo({ title: 'KTC คืน 8% ที่ BigC', bank_id: 'KTC', category_id: super_.id, promo_type: 'cashback', benefit_value: 8, benefit_unit: '%', min_spend: 300, max_cap: 150, end_date: d('2026-07-31'), condition: 'เฉพาะวันเสาร์–อาทิตย์', merchant_id: bigc.id }),
    createPromo({ title: 'UOB คืน 3% ที่ Makro', bank_id: 'UOB', category_id: super_.id, promo_type: 'cashback', benefit_value: 3, benefit_unit: '%', min_spend: 1000, max_cap: 300, end_date: d('2026-08-31'), condition: 'ทุกวัน ทุกสาขา' }),
    createPromo({ title: 'BAY รับ 50 บาท ช้อปซูเปอร์', bank_id: 'BAY', category_id: super_.id, promo_type: 'cashback', benefit_value: 50, benefit_unit: 'บาท', min_spend: 1000, end_date: d('2026-07-31'), condition: 'สูงสุด 2 ครั้ง/เดือน' }),

    // น้ำมัน (3)
    createPromo({ title: 'KBank ลด 50 สต./ลิตร ที่ ปตท.', bank_id: 'KBANK', category_id: fuel.id, promo_type: 'discount', benefit_value: 0.5, benefit_unit: 'บาท/ลิตร', min_spend: 400, max_cap: 150, end_date: d('2026-07-31'), condition: 'ทุกวัน ทุกสาขา', merchant_id: ptt.id }),
    createPromo({ title: 'SCB ลด 1 บาท/ลิตร ที่ Bangchak', bank_id: 'SCB', category_id: fuel.id, promo_type: 'discount', benefit_value: 1, benefit_unit: 'บาท/ลิตร', min_spend: 300, max_cap: 150, end_date: d('2026-08-31'), condition: 'เฉพาะน้ำมันแก๊สโซฮอล์', merchant_id: bangchak.id }),
    createPromo({ title: 'BBL คืน 3% เติมน้ำมันทุกปั๊ม', bank_id: 'BBL', category_id: fuel.id, promo_type: 'cashback', benefit_value: 3, benefit_unit: '%', min_spend: 300, max_cap: 100, end_date: d('2026-07-31'), condition: 'ทุกปั๊มน้ำมันในไทย' }),

    // ช้อปปิ้ง (3)
    createPromo({ title: 'SCB ผ่อน 0% 10 เดือน ที่ Central', bank_id: 'SCB', category_id: shopping.id, promo_type: 'installment', benefit_value: 0, benefit_unit: '% ดอกเบี้ย', min_spend: 3000, end_date: d('2026-07-31'), condition: 'เฉพาะสินค้าที่ร่วมรายการ', merchant_id: central.id }),
    createPromo({ title: 'BAY ลด 15% ที่ Robinson', bank_id: 'BAY', category_id: shopping.id, promo_type: 'discount', benefit_value: 15, benefit_unit: '%', min_spend: 500, max_cap: 500, end_date: d('2026-07-31'), condition: 'เฉพาะสินค้าแฟชั่นและไลฟ์สไตล์' }),
    createPromo({ title: 'AEON คืน 10% ทุกร้านในห้าง', bank_id: 'AEON', category_id: shopping.id, promo_type: 'cashback', benefit_value: 10, benefit_unit: '%', min_spend: 500, max_cap: 300, end_date: d('2026-08-31'), condition: 'ทุกห้างสรรพสินค้าทั่วประเทศ' }),

    // โรงพยาบาล (2)
    createPromo({ title: 'KBank คืน 5% ที่ Bumrungrad', bank_id: 'KBANK', category_id: hospital.id, promo_type: 'cashback', benefit_value: 5, benefit_unit: '%', max_cap: 1000, end_date: d('2026-07-31'), condition: 'ค่ารักษาพยาบาลทุกประเภท', merchant_id: bumrungrad.id }),
    createPromo({ title: 'AEON ผ่อน 0% 24 เดือน ที่ Samitivej', bank_id: 'AEON', category_id: hospital.id, promo_type: 'installment', benefit_value: 0, benefit_unit: '% ดอกเบี้ย', min_spend: 5000, end_date: d('2026-12-31'), condition: 'ทุกสาขา Samitivej Group', merchant_id: samitivej.id }),
  ])

  console.log(`✅ Seeded: 6 categories, 12 merchants, ${promos.length} promotions`)
}

// ── Helpers ───────────────────────────────────────────────────

const d = (s: string) => new Date(s)

async function upsertCategory(name_th: string, name_eng: string, icon: string, sort_order: number) {
  const existing = await prisma.categories.findFirst({ where: { name_eng } })
  if (existing) return existing
  return prisma.categories.create({ data: { name_th, name_eng, icon, sort_order, created_by: 'seed' } })
}

async function upsertMerchant(name: string, category_id: string) {
  const existing = await prisma.merchants.findFirst({ where: { name_eng: name } })
  if (existing) return existing
  return prisma.merchants.create({ data: { name_th: name, name_eng: name, category_id, created_by: 'seed' } })
}

async function createPromo({
  title, bank_id, category_id, promo_type, benefit_value, benefit_unit,
  min_spend, max_cap, end_date, condition, merchant_id,
}: {
  title: string; bank_id: string; category_id: string
  promo_type: string; benefit_value: number; benefit_unit: string
  min_spend?: number; max_cap?: number; end_date: Date
  condition?: string; merchant_id?: string
}) {
  const existing = await prisma.promotions.findFirst({ where: { title } })
  if (existing) return existing

  const promo = await prisma.promotions.create({
    data: {
      title, bank_id, category_id, promo_type, benefit_value, benefit_unit,
      min_spend: min_spend ?? null,
      max_cap: max_cap ?? null,
      start_date: new Date('2026-07-01'),
      end_date, condition: condition ?? null,
      status: 'active',
      created_by: 'seed',
    },
  })

  if (merchant_id) {
    await prisma.promotion_merchants.create({
      data: { promotion_id: promo.id, merchant_id },
    })
  }

  return promo
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
