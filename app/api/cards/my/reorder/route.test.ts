import { describe, it, expect } from 'vitest'
import { reorderSchema } from './route'

describe('reorderSchema (PATCH /api/cards/my/reorder)', () => {
  it('accepts a valid userId with a non-empty cardIds array', () => {
    const result = reorderSchema.safeParse({ userId: 'user-1', cardIds: ['card-1', 'card-2'] })
    expect(result.success).toBe(true)
  })

  it('rejects when userId is missing', () => {
    const result = reorderSchema.safeParse({ cardIds: ['card-1'] })
    expect(result.success).toBe(false)
  })

  it('rejects when cardIds is missing', () => {
    const result = reorderSchema.safeParse({ userId: 'user-1' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty cardIds array', () => {
    const result = reorderSchema.safeParse({ userId: 'user-1', cardIds: [] })
    expect(result.success).toBe(false)
  })

  it('rejects cardIds containing non-string values', () => {
    const result = reorderSchema.safeParse({ userId: 'user-1', cardIds: ['card-1', 42] })
    expect(result.success).toBe(false)
  })
})
