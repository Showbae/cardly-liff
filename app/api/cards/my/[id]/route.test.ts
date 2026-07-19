import { describe, it, expect } from 'vitest'
import { patchSchema } from './route'

describe('patchSchema (PATCH /api/cards/my/[id])', () => {
  describe('last_four', () => {
    it('accepts a valid 4-digit string', () => {
      const result = patchSchema.safeParse({ last_four: '1234' })
      expect(result.success).toBe(true)
    })

    it('rejects a string with non-digit characters', () => {
      const result = patchSchema.safeParse({ last_four: '12a4' })
      expect(result.success).toBe(false)
    })

    it('rejects a string shorter than 4 characters', () => {
      const result = patchSchema.safeParse({ last_four: '123' })
      expect(result.success).toBe(false)
    })

    it('rejects a string longer than 4 characters', () => {
      const result = patchSchema.safeParse({ last_four: '12345' })
      expect(result.success).toBe(false)
    })

    it('accepts explicit null (clearing the field)', () => {
      const result = patchSchema.safeParse({ last_four: null })
      expect(result.success).toBe(true)
    })

    it('accepts the field being omitted entirely', () => {
      const result = patchSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('credit_limit', () => {
    it('rejects 0 (must be strictly positive, not just non-negative)', () => {
      const result = patchSchema.safeParse({ credit_limit: 0 })
      expect(result.success).toBe(false)
    })

    it('rejects negative numbers', () => {
      const result = patchSchema.safeParse({ credit_limit: -100 })
      expect(result.success).toBe(false)
    })

    it('accepts a positive number', () => {
      const result = patchSchema.safeParse({ credit_limit: 50000 })
      expect(result.success).toBe(true)
    })

    it('accepts explicit null (clearing the field)', () => {
      const result = patchSchema.safeParse({ credit_limit: null })
      expect(result.success).toBe(true)
    })

    it('rejects a numeric string (must be number type, not just parseable)', () => {
      const result = patchSchema.safeParse({ credit_limit: '50000' })
      expect(result.success).toBe(false)
    })
  })

  describe('billing_cycle_day', () => {
    it('rejects 0 (below min of 1)', () => {
      const result = patchSchema.safeParse({ billing_cycle_day: 0 })
      expect(result.success).toBe(false)
    })

    it('rejects 29 (above max of 28)', () => {
      const result = patchSchema.safeParse({ billing_cycle_day: 29 })
      expect(result.success).toBe(false)
    })

    it('accepts 1 (lower boundary)', () => {
      const result = patchSchema.safeParse({ billing_cycle_day: 1 })
      expect(result.success).toBe(true)
    })

    it('accepts 28 (upper boundary)', () => {
      const result = patchSchema.safeParse({ billing_cycle_day: 28 })
      expect(result.success).toBe(true)
    })

    it('rejects a non-integer value', () => {
      const result = patchSchema.safeParse({ billing_cycle_day: 15.5 })
      expect(result.success).toBe(false)
    })

    it('accepts explicit null (clearing the field)', () => {
      const result = patchSchema.safeParse({ billing_cycle_day: null })
      expect(result.success).toBe(true)
    })
  })

  describe('billing_last_day', () => {
    it('accepts true', () => {
      const result = patchSchema.safeParse({ billing_last_day: true })
      expect(result.success).toBe(true)
    })

    it('accepts false', () => {
      const result = patchSchema.safeParse({ billing_last_day: false })
      expect(result.success).toBe(true)
    })

    it('accepts explicit null (clearing the field)', () => {
      const result = patchSchema.safeParse({ billing_last_day: null })
      expect(result.success).toBe(true)
    })

    it('accepts the field being omitted entirely', () => {
      const result = patchSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('rejects a string "true" (must be strict boolean type, not truthy)', () => {
      const result = patchSchema.safeParse({ billing_last_day: 'true' })
      expect(result.success).toBe(false)
    })

    it('rejects the number 1 (must be strict boolean type, not truthy)', () => {
      const result = patchSchema.safeParse({ billing_last_day: 1 })
      expect(result.success).toBe(false)
    })
  })

  describe('payment_due_day', () => {
    it('rejects 0 (below min of 1)', () => {
      const result = patchSchema.safeParse({ payment_due_day: 0 })
      expect(result.success).toBe(false)
    })

    it('rejects 32 (above max of 31 — note this is a wider range than billing_cycle_day)', () => {
      const result = patchSchema.safeParse({ payment_due_day: 32 })
      expect(result.success).toBe(false)
    })

    it('accepts 1 (lower boundary)', () => {
      const result = patchSchema.safeParse({ payment_due_day: 1 })
      expect(result.success).toBe(true)
    })

    it('accepts 31 (upper boundary)', () => {
      const result = patchSchema.safeParse({ payment_due_day: 31 })
      expect(result.success).toBe(true)
    })

    it('rejects a non-integer value', () => {
      const result = patchSchema.safeParse({ payment_due_day: 15.5 })
      expect(result.success).toBe(false)
    })

    it('accepts explicit null (clearing the field)', () => {
      const result = patchSchema.safeParse({ payment_due_day: null })
      expect(result.success).toBe(true)
    })
  })

  describe('whole-object behavior', () => {
    it('accepts an empty object — documented no-op-update gap, not a fix target here', () => {
      // NOTE: this is a known gap from an earlier code review. An empty PATCH body
      // currently validates successfully, meaning a caller can send `{}` and the
      // route will happily run a Prisma `update` with an empty `data` object. This
      // test documents the CURRENT behavior; it is not asserting this is desirable.
      const result = patchSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('accepts all three fields when all are valid', () => {
      const result = patchSchema.safeParse({
        last_four: '1234',
        credit_limit: 50000,
        billing_cycle_day: 15,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          last_four: '1234',
          credit_limit: 50000,
          billing_cycle_day: 15,
        })
      }
    })

    it('fails when one field is valid and another is invalid, and reports the offending path', () => {
      const result = patchSchema.safeParse({
        last_four: '1234',
        credit_limit: -100,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues[0].path).toEqual(['credit_limit'])
      }
    })

    it('silently strips unexpected extra fields rather than rejecting them (verified Zod v4 default object behavior)', () => {
      // Zod v4's z.object() defaults to "strip" mode (same default as v3), not
      // "strict". Verified directly: safeParse({ last_four: '1234', foo: 'bar' })
      // returns { success: true, data: { last_four: '1234' } } — `foo` is dropped
      // from `data`, not reported as an error, and not passed through either.
      const result = patchSchema.safeParse({
        last_four: '1234',
        foo: 'bar',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ last_four: '1234' })
        expect(result.data).not.toHaveProperty('foo')
      }
    })
  })
})
