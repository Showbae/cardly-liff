import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { UserCard } from '@/lib/cards'
import {
  chipGradient,
  bankInitial,
  nearestBillingDate,
  nearestDueDate,
  totalCreditLimit,
  formatBaht,
} from '@/lib/card-utils'

function makeCard(overrides: Partial<UserCard> = {}): UserCard {
  return {
    id: 'uc-1',
    card_id: 'cc-1',
    last_four: '1234',
    credit_limit: null,
    billing_cycle_day: null,
    billing_last_day: null,
    payment_due_day: null,
    payment_due_last_day: null,
    credit_cards: null,
    ...overrides,
  }
}

describe('chipGradient (app/(liff)/wallet/page.tsx)', () => {
  it('returns the exact mapped gradient for a known bankId', () => {
    expect(chipGradient('KBANK')).toBe('linear-gradient(135deg, #1c8c75, #07332a 60%)')
    expect(chipGradient('AMEX')).toBe('linear-gradient(135deg, #c1c7cd, #2f3942)')
  })

  it('returns the fallback gradient for null/undefined/unknown bankId', () => {
    const fallback = 'linear-gradient(135deg, #2a3a33, #0c1612)'
    expect(chipGradient(null)).toBe(fallback)
    expect(chipGradient(undefined)).toBe(fallback)
    expect(chipGradient('NOT_A_BANK')).toBe(fallback)
  })
})

describe('bankInitial', () => {
  it('uses bank.initial directly when set', () => {
    expect(bankInitial({ initial: 'K', id: 'kbank' })).toBe('K')
  })

  it('falls back to the first character of id when initial is missing', () => {
    expect(bankInitial({ id: 'kbank' })).toBe('k')
  })

  it('returns "?" when bank is null', () => {
    expect(bankInitial(null)).toBe('?')
  })

  it('returns "?" when bank has neither initial nor id', () => {
    expect(bankInitial({})).toBe('?')
  })
})

describe('nearestBillingDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Fixed "now": 15 Mar 2025, 10:00 local time
    vi.setSystemTime(new Date(2025, 2, 15, 10, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null for an empty array', () => {
    expect(nearestBillingDate([])).toBeNull()
  })

  it('returns null when no cards have billing_cycle_day set', () => {
    const cards = [makeCard({ billing_cycle_day: null }), makeCard({ billing_cycle_day: undefined as unknown as null })]
    expect(nearestBillingDate(cards)).toBeNull()
  })

  it('returns the formatted date for a single card with a future billing day this month', () => {
    const cards = [makeCard({ billing_cycle_day: 20 })]
    expect(nearestBillingDate(cards)).toBe('20 มี.ค.')
  })

  it('returns the nearest upcoming billing date among multiple cards', () => {
    const cards = [
      makeCard({ id: 'a', billing_cycle_day: 20 }), // this month, future -> 20 Mar
      makeCard({ id: 'b', billing_cycle_day: 5 }),  // already passed this month -> rolls to 5 Apr
    ]
    // 20 Mar is nearer than 5 Apr
    expect(nearestBillingDate(cards)).toBe('20 มี.ค.')
  })

  it('rolls over to next month when the billing day equals today (candidate <= now)', () => {
    const cards = [makeCard({ billing_cycle_day: 15 })]
    expect(nearestBillingDate(cards)).toBe('15 เม.ย.')
  })

  it('rolls over to next month when the billing day is earlier in the month than today', () => {
    const cards = [makeCard({ billing_cycle_day: 5 })]
    expect(nearestBillingDate(cards)).toBe('5 เม.ย.')
  })
})

describe('nearestDueDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 2, 15, 10, 0, 0)) // 15 Mar 2025
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null for an empty array', () => {
    expect(nearestDueDate([])).toBeNull()
  })

  it('returns null when no cards have payment_due_day set', () => {
    expect(nearestDueDate([makeCard({ payment_due_day: null })])).toBeNull()
  })

  it('returns future due date this month', () => {
    expect(nearestDueDate([makeCard({ payment_due_day: 20 })])).toBe('20 มี.ค.')
  })

  it('rolls over to next month when due day equals today', () => {
    expect(nearestDueDate([makeCard({ payment_due_day: 15 })])).toBe('15 เม.ย.')
  })

  it('rolls over to next month when due day already passed', () => {
    expect(nearestDueDate([makeCard({ payment_due_day: 5 })])).toBe('5 เม.ย.')
  })

  it('clamps day 31 to 30 when rolling into April (30-day month)', () => {
    // now = 15 Mar, due day 31 → this month Mar 31 is valid (future)
    expect(nearestDueDate([makeCard({ payment_due_day: 31 })])).toBe('31 มี.ค.')
    // now = 1 Apr, due day 31 → clamps to Apr 30
    vi.setSystemTime(new Date(2025, 3, 1, 10, 0, 0))
    expect(nearestDueDate([makeCard({ payment_due_day: 31 })])).toBe('30 เม.ย.')
  })

  it('clamps day 29 to 28 in February (non-leap year)', () => {
    vi.setSystemTime(new Date(2025, 1, 1, 10, 0, 0)) // 1 Feb 2025 (28-day month)
    expect(nearestDueDate([makeCard({ payment_due_day: 29 })])).toBe('28 ก.พ.')
  })

  it('returns last day of current month when payment_due_last_day is set', () => {
    // now = 15 Mar 2025, last day of March = 31
    expect(nearestDueDate([makeCard({ payment_due_last_day: true })])).toBe('31 มี.ค.')
  })

  it('rolls payment_due_last_day to next month when last day already passed', () => {
    vi.setSystemTime(new Date(2025, 2, 31, 23, 0, 0)) // 31 Mar 2025 evening
    // last day of Mar (31) <= now → use last day of Apr = 30
    expect(nearestDueDate([makeCard({ payment_due_last_day: true })])).toBe('30 เม.ย.')
  })

  it('returns the nearest due date across multiple cards', () => {
    const cards = [
      makeCard({ id: 'a', payment_due_day: 20 }), // 20 Mar
      makeCard({ id: 'b', payment_due_day: 5 }),  // rolled to 5 Apr
    ]
    expect(nearestDueDate(cards)).toBe('20 มี.ค.')
  })
})

describe('totalCreditLimit', () => {
  it('returns 0 for an empty array', () => {
    expect(totalCreditLimit([])).toBe(0)
  })

  it('treats null/undefined credit_limit as 0 without throwing', () => {
    const cards = [
      makeCard({ credit_limit: null }),
      makeCard({ credit_limit: undefined as unknown as null }),
    ]
    expect(() => totalCreditLimit(cards)).not.toThrow()
    expect(totalCreditLimit(cards)).toBe(0)
  })

  it('treats a non-numeric credit_limit string as 0 instead of breaking the sum', () => {
    const cards = [
      makeCard({ id: 'a', credit_limit: 'abc' }),
      makeCard({ id: 'b', credit_limit: '1000' }),
    ]
    expect(totalCreditLimit(cards)).toBe(1000)
  })

  it('sums multiple cards correctly, including decimal Decimal-serialised strings', () => {
    const cards = [
      makeCard({ id: 'a', credit_limit: '1250.50' }),
      makeCard({ id: 'b', credit_limit: '2500' }),
      makeCard({ id: 'c', credit_limit: null }),
    ]
    expect(totalCreditLimit(cards)).toBe(3750.5)
  })
})

describe('formatBaht', () => {
  it('formats 0 as "฿0"', () => {
    expect(formatBaht(0)).toBe('฿0')
  })

  it('rounds decimal input per maximumFractionDigits: 0', () => {
    expect(formatBaht(1234.5)).toBe('฿1,235')
    expect(formatBaht(1234.4)).toBe('฿1,234')
  })

  it('adds thousands separators for th-TH locale on large numbers', () => {
    expect(formatBaht(100000)).toBe('฿100,000')
    expect(formatBaht(1234567)).toBe('฿1,234,567')
  })

  it('does not guard against negative numbers (documents current behaviour)', () => {
    expect(formatBaht(-500)).toBe('฿-500')
  })
})
