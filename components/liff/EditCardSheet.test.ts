import { describe, it, expect } from 'vitest'
import { chipGradient } from './EditCardSheet'
import { chipGradient as chipGradientFromWallet } from '@/app/(liff)/wallet/page'

describe('chipGradient (components/liff/EditCardSheet.tsx — duplicate copy)', () => {
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

  it('produces identical output to the wallet/page.tsx copy for every known bankId + fallback cases', () => {
    const bankIds = ['KBANK', 'SCB', 'KTC', 'UOB', 'BBL', 'BAY', 'AMEX', 'AEON', 'UNKNOWN', null, undefined]
    for (const id of bankIds) {
      expect(chipGradient(id)).toBe(chipGradientFromWallet(id))
    }
  })
})
