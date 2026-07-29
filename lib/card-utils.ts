import type { UserCard } from './cards'

export const BANK_GRADIENT: Record<string, string> = {
  KBANK: 'linear-gradient(135deg, #1c8c75, #07332a 60%)',
  SCB:   'linear-gradient(135deg, #7c3fa8, #341252)',
  KTC:   'linear-gradient(135deg, #e3603f, #a02b1f)',
  UOB:   'linear-gradient(135deg, #c8253e, #1c2a6a)',
  BBL:   'linear-gradient(135deg, #1b4d9b, #0c2a5e)',
  BAY:   'linear-gradient(135deg, #d99211, #7a4f00)',
  AMEX:  'linear-gradient(135deg, #c1c7cd, #2f3942)',
  AEON:  'linear-gradient(135deg, #d9416f, #8b1a3d)',
}

export const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

export function chipGradient(bankId?: string | null): string {
  return BANK_GRADIENT[bankId ?? ''] ?? 'linear-gradient(135deg, #2a3a33, #0c1612)'
}

export function bankInitial(bank?: { initial?: string | null; id?: string } | null): string {
  return bank?.initial ?? bank?.id?.charAt(0) ?? '?'
}

export function nearestBillingDate(cards: UserCard[]): string | null {
  const now = new Date()
  let nearest: Date | null = null
  for (const uc of cards) {
    let candidate: Date
    if (uc.billing_last_day) {
      candidate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      if (candidate <= now) candidate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    } else if (uc.billing_cycle_day) {
      const day = uc.billing_cycle_day
      candidate = new Date(now.getFullYear(), now.getMonth(), day)
      if (candidate <= now) candidate = new Date(now.getFullYear(), now.getMonth() + 1, day)
    } else {
      continue
    }
    if (!nearest || candidate < nearest) nearest = candidate
  }
  if (!nearest) return null
  return `${nearest.getDate()} ${THAI_MONTHS[nearest.getMonth()]}`
}

export function nearestDueDate(cards: UserCard[]): string | null {
  const now = new Date()
  let nearest: Date | null = null
  for (const uc of cards) {
    let candidate: Date
    if (uc.payment_due_last_day) {
      candidate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      if (candidate <= now) candidate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    } else if (uc.payment_due_day) {
      const day = uc.payment_due_day
      const clamp = (y: number, m: number) => Math.min(day, new Date(y, m + 1, 0).getDate())
      const cy = now.getFullYear(), cm = now.getMonth()
      candidate = new Date(cy, cm, clamp(cy, cm))
      if (candidate <= now) {
        const next = new Date(cy, cm + 1, 1)
        candidate = new Date(next.getFullYear(), next.getMonth(), clamp(next.getFullYear(), next.getMonth()))
      }
    } else {
      continue
    }
    if (!nearest || candidate < nearest) nearest = candidate
  }
  if (!nearest) return null
  return `${nearest.getDate()} ${THAI_MONTHS[nearest.getMonth()]}`
}

export function totalCreditLimit(cards: UserCard[]): number {
  return cards.reduce((sum, uc) => {
    const v = Number(uc.credit_limit ?? 0)
    return sum + (isNaN(v) ? 0 : v)
  }, 0)
}

export function formatBaht(amount: number): string {
  return '฿' + amount.toLocaleString('th-TH', { maximumFractionDigits: 0 })
}
