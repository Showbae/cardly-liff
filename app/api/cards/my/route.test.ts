import { describe, it, expect } from 'vitest'
import { createSchema } from './route'

describe('createSchema (POST /api/cards/my)', () => {
  describe('userId / cardId', () => {
    it('rejects when userId is missing', () => {
      const result = createSchema.safeParse({ cardId: 'card-1' })
      expect(result.success).toBe(false)
    })

    it('rejects when cardId is missing', () => {
      const result = createSchema.safeParse({ userId: 'user-1' })
      expect(result.success).toBe(false)
    })

    it('rejects when both userId and cardId are missing', () => {
      const result = createSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('accepts when both userId and cardId are present as non-empty strings', () => {
      const result = createSchema.safeParse({ userId: 'user-1', cardId: 'card-1' })
      expect(result.success).toBe(true)
    })
  })

  describe('last_four', () => {
    it('accepts a valid 4-digit string', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', last_four: '1234' })
      expect(result.success).toBe(true)
    })

    it('rejects a string with non-digit characters', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', last_four: '12a4' })
      expect(result.success).toBe(false)
    })

    it('accepts explicit null (clearing the field)', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', last_four: null })
      expect(result.success).toBe(true)
    })

    it('accepts the field being omitted entirely', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c' })
      expect(result.success).toBe(true)
    })
  })

  describe('credit_limit', () => {
    it('accepts a positive number', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', credit_limit: 50000 })
      expect(result.success).toBe(true)
    })

    it('rejects 0 (must be strictly positive)', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', credit_limit: 0 })
      expect(result.success).toBe(false)
    })

    it('accepts explicit null (clearing the field)', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', credit_limit: null })
      expect(result.success).toBe(true)
    })

    it('accepts the field being omitted entirely', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c' })
      expect(result.success).toBe(true)
    })
  })

  describe('billing_cycle_day', () => {
    it('accepts 1 (lower boundary)', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', billing_cycle_day: 1 })
      expect(result.success).toBe(true)
    })

    it('rejects 29 (above max of 28)', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', billing_cycle_day: 29 })
      expect(result.success).toBe(false)
    })

    it('accepts explicit null (clearing the field)', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', billing_cycle_day: null })
      expect(result.success).toBe(true)
    })

    it('accepts the field being omitted entirely', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c' })
      expect(result.success).toBe(true)
    })
  })

  describe('billing_last_day', () => {
    it('accepts true', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', billing_last_day: true })
      expect(result.success).toBe(true)
    })

    it('rejects a non-boolean value like the string "true"', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', billing_last_day: 'true' })
      expect(result.success).toBe(false)
    })

    it('accepts explicit null (clearing the field)', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', billing_last_day: null })
      expect(result.success).toBe(true)
    })

    it('accepts the field being omitted entirely', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c' })
      expect(result.success).toBe(true)
    })
  })

  describe('payment_due_day', () => {
    it('accepts 31 (upper boundary, wider than billing_cycle_day max of 28)', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', payment_due_day: 31 })
      expect(result.success).toBe(true)
    })

    it('rejects 32 (above max of 31)', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', payment_due_day: 32 })
      expect(result.success).toBe(false)
    })

    it('accepts explicit null (clearing the field)', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c', payment_due_day: null })
      expect(result.success).toBe(true)
    })

    it('accepts the field being omitted entirely', () => {
      const result = createSchema.safeParse({ userId: 'u', cardId: 'c' })
      expect(result.success).toBe(true)
    })
  })

  describe('whole-object behavior', () => {
    it('accepts all 7 fields when all are valid, with the full parsed data shape', () => {
      const result = createSchema.safeParse({
        userId: 'user-1',
        cardId: 'card-1',
        last_four: '1234',
        credit_limit: 50000,
        billing_cycle_day: 15,
        billing_last_day: false,
        payment_due_day: 20,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          userId: 'user-1',
          cardId: 'card-1',
          last_four: '1234',
          credit_limit: 50000,
          billing_cycle_day: 15,
          billing_last_day: false,
          payment_due_day: 20,
        })
      }
    })

    it('accepts a realistic "add card" payload omitting billing_last_day', () => {
      const result = createSchema.safeParse({
        userId: 'user-1',
        cardId: 'card-1',
        last_four: '5678',
        credit_limit: 100000,
        billing_cycle_day: 5,
        payment_due_day: 25,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          userId: 'user-1',
          cardId: 'card-1',
          last_four: '5678',
          credit_limit: 100000,
          billing_cycle_day: 5,
          payment_due_day: 25,
        })
      }
    })
  })
})
