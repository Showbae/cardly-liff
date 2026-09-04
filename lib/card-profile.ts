import { THAI_MONTHS } from './card-utils'

/**
 * ข้อมูลแท็บ "สิทธิประโยชน์" — ชนิดข้อมูลและตัวช่วยแสดงผล
 *
 * `effective_rate_pct` ที่มากับ API เป็นค่าที่ `lib/rewards.ts` คำนวณไว้ตอน
 * บันทึกลง DB แล้ว **ไฟล์นี้ห้ามคำนวณอัตราเอง** — หน้าที่ของมันคือแปลงตัวเลข
 * ให้เป็นข้อความไทย ไม่ใช่ตัดสินว่าตัวเลขควรเป็นเท่าไหร่
 */

export interface ProfileCategory {
  icon: string | null
  name_th: string | null
}

export interface ProfilePromo {
  id: string
  title: string
  description: string | null
  promo_type: string | null
  benefit_value: number | null
  benefit_unit: string | null
  min_spend: number | null
  max_cap: number | null
  condition: string | null
  source_url: string | null
  end_date: string | null
  /** null = โปรไม่มีวันหมด · คิดจากวันที่กรุงเทพฝั่ง server */
  days_left: number | null
  category: ProfileCategory | null
  merchants: string[]
  /** 'bank' = โปรระดับธนาคาร ใช้ได้ทุกใบ — ต้องติดป้ายให้ตรง ไม่ใช่อ้างว่าเป็นของบัตรใบนี้ */
  card_scope: 'card' | 'bank'
}

export interface ProfileBenefit {
  id: string
  benefit_type: string
  benefit_value: number
  benefit_unit: string
  spend_per_unit: number | null
  min_spend: number | null
  max_cap: number | null
  cap_period: string | null
  condition: string | null
  effective_rate_pct: number
  /** null = อัตราพื้นฐานที่ใช้กับทุกหมวด */
  category: ProfileCategory | null
}

export interface ProfilePerk {
  id: string
  perk_type: string
  title: string
  value_text: string | null
  description: string | null
  condition: string | null
}

export interface ProfileCard {
  id: string
  card_name: string | null
  card_tier: string | null
  network: string | null
  annual_fee: number | null
  fee_waiver_condition: string | null
  bank: { id: string; name_th: string | null; name_eng: string | null } | null
  /** null = บัตรเงินคืน ไม่ใช่ "ยังไม่ได้กรอก" */
  point_program: {
    name: string
    point_value_thb: number
    point_expiry_months: number | null
    min_redemption: number | null
  } | null
}

export interface CardProfile {
  card: ProfileCard | null
  promos: ProfilePromo[]
  benefits: ProfileBenefit[]
  perks: ProfilePerk[]
}

export async function getCardProfile(usersCardId: string): Promise<CardProfile> {
  const res = await fetch(`/api/cards/my/${encodeURIComponent(usersCardId)}/profile`)
  if (!res.ok) throw new Error(`getCardProfile failed: ${res.status}`)
  return res.json()
}

// ── ตัวช่วยแสดงผล ───────────────────────────────────────────────────────

/** '31 ส.ค. 68' — ปี พ.ศ. สองหลักตามที่คนไทยอ่านบนโปรจริง */
export function formatThaiDate(iso: string): string {
  const d = new Date(iso)
  const buddhistYear = d.getFullYear() + 543
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${String(buddhistYear).slice(-2)}`
}

/** โปรที่เหลือไม่เกินเท่านี้ถือว่าเร่ง — ใช้สีเตือนบน chip นับวัน */
export const URGENT_DAYS = 14

export function formatDaysLeft(days: number): string {
  if (days <= 0) return 'วันสุดท้าย'
  return `${days} วัน`
}

const CAP_PERIOD_LABEL: Record<string, string> = {
  per_bill: 'รอบบิล',
  per_month: 'เดือน',
  per_year: 'ปี',
}

/** '฿1,000/รอบบิล' · null เมื่อไม่มีเพดาน */
export function formatCap(maxCap: number | null, capPeriod: string | null): string | null {
  if (maxCap == null) return null
  const amount = '฿' + maxCap.toLocaleString('th-TH', { maximumFractionDigits: 0 })
  // cap_period เป็น NOT NULL คู่กับ max_cap ใน DB (constraint cap_needs_period)
  // แต่ข้อมูลจาก promotions ยังไม่มีคอลัมน์นี้ จึงต้องรองรับกรณีไม่รู้
  const period = capPeriod ? CAP_PERIOD_LABEL[capPeriod] : null
  return period ? `${amount}/${period}` : amount
}

/**
 * ตัวเลขที่โชว์บนแถวอัตรา — **ภาษาที่ธนาคารใช้จริง** ไม่ใช่ `effective_rate_pct`
 *
 *   cashback → '8%'
 *   points   → '1 คะแนน / 25฿'
 *
 * เหตุผล: user จำโปรของตัวเองเป็น "x3 คะแนน" ถ้าโชว์ 1.44% เขาจะเทียบกับ
 * โบรชัวร์ธนาคารไม่ได้ · ส่วน 1.44% เอาไว้ให้เครื่องเทียบข้ามบัตร (decision #4)
 */
export function formatBenefitValue(b: ProfileBenefit): string {
  if (b.benefit_unit === '%') return `${b.benefit_value}%`
  if (b.spend_per_unit != null) {
    return `${b.benefit_value} ${b.benefit_unit} / ${b.spend_per_unit.toLocaleString('th-TH')}฿`
  }
  return `${b.benefit_value} ${b.benefit_unit}`
}

/**
 * บรรทัดรอง '≈ 1.44% เทียบเท่าเงินคืน' — โชว์เฉพาะตอนที่หน่วยไม่ใช่ %
 * ถ้าหน่วยเป็น % อยู่แล้วจะกลายเป็นบรรทัดที่พูดซ้ำตัวเลขเดิม
 */
export function formatEquivalentRate(b: ProfileBenefit): string | null {
  if (b.benefit_unit === '%') return null
  return `≈ ${b.effective_rate_pct}% เทียบเท่าเงินคืน`
}

/** อัตราที่ดีที่สุดของบัตร — ใช้เป็นบรรทัดสรุปบนหัว accordion */
export function bestRate(benefits: ProfileBenefit[]): ProfileBenefit | null {
  if (benefits.length === 0) return null
  return benefits.reduce((best, b) =>
    b.effective_rate_pct > best.effective_rate_pct ? b : best,
  )
}
