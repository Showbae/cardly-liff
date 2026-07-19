import { describe, it, expect } from 'vitest'
import { inferNetwork } from './AddCardWizard'

describe('inferNetwork', () => {
  it('matches amex via bankId === "AMEX" regardless of card name', () => {
    expect(inferNetwork('Some Random Card', 'AMEX')).toBe('amex')
  })

  it('matches amex via card name containing "amex" (case-insensitive)', () => {
    expect(inferNetwork('amex platinum', 'KBANK')).toBe('amex')
    expect(inferNetwork('AMEX Platinum', 'KBANK')).toBe('amex')
  })

  it('matches amex via card name containing "american express"', () => {
    expect(inferNetwork('American Express Gold', 'KBANK')).toBe('amex')
  })

  it('matches jcb case-insensitively', () => {
    expect(inferNetwork('jcb gold', 'KBANK')).toBe('jcb')
    expect(inferNetwork('JCB Gold', 'KBANK')).toBe('jcb')
    expect(inferNetwork('Jcb Gold', 'KBANK')).toBe('jcb')
  })

  it('matches unionpay case-insensitively', () => {
    expect(inferNetwork('UnionPay Diamond', 'BBL')).toBe('unionpay')
    expect(inferNetwork('unionpay diamond', 'BBL')).toBe('unionpay')
  })

  it('matches mastercard case-insensitively', () => {
    expect(inferNetwork('World Mastercard', 'SCB')).toBe('mastercard')
    expect(inferNetwork('world mastercard', 'SCB')).toBe('mastercard')
  })

  it('defaults to visa when nothing matches', () => {
    expect(inferNetwork('Krungsri First Choice', 'BAY')).toBe('visa')
    expect(inferNetwork('', 'KBANK')).toBe('visa')
  })

  it('prioritises amex over other keywords when bankId is AMEX even if name suggests otherwise', () => {
    expect(inferNetwork('JCB-style rewards', 'AMEX')).toBe('amex')
  })
})
