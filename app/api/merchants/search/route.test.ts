import { describe, it, expect, vi, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    merchants: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'starbucks-id',
          name_eng: 'Starbucks',
          name_th: 'สตาร์บัคส์',
          mcc_code: '5812',
          category_id: 'cafe-id',
          categories: { id: 'cafe-id', name_th: 'คาเฟ่', name_eng: 'Café', icon: '☕' },
        },
        {
          id: 'lotus-id',
          name_eng: "Lotus's",
          name_th: 'โลตัส',
          mcc_code: '5411',
          category_id: 'super-id',
          categories: { id: 'super-id', name_th: 'ซูเปอร์มาร์เก็ต', name_eng: 'Supermarket', icon: '🛒' },
        },
        {
          id: 'pt-id',
          name_eng: 'PT Station',
          name_th: 'ปตท.',
          mcc_code: '5541',
          category_id: 'gas-id',
          categories: { id: 'gas-id', name_th: 'น้ำมัน', name_eng: 'Gas Station', icon: '⛽' },
        },
      ]),
    },
    categories: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'other-id',
        name_th: 'อื่นๆ',
        name_eng: 'Other',
        icon: '🏪',
      }),
    },
  },
}))

import { GET } from './route'

function req(q: string) {
  return new NextRequest(`http://localhost/api/merchants/search?q=${encodeURIComponent(q)}`)
}

describe('GET /api/merchants/search', () => {
  describe('empty / short query', () => {
    it('returns empty results and fallback=false when q is empty', async () => {
      const res = await GET(new NextRequest('http://localhost/api/merchants/search'))
      const body = await res.json()
      expect(body.results).toEqual([])
      expect(body.fallback).toBe(false)
    })
  })

  describe('exact match', () => {
    it('returns Starbucks for exact English name', async () => {
      const res = await GET(req('Starbucks'))
      const body = await res.json()
      expect(body.fallback).toBe(false)
      expect(body.results.length).toBeGreaterThan(0)
      expect(body.results[0].id).toBe('starbucks-id')
    })

    it('returns PT Station for exact name', async () => {
      const res = await GET(req('PT Station'))
      const body = await res.json()
      expect(body.results.some((r: { id: string }) => r.id === 'pt-id')).toBe(true)
    })
  })

  describe('fuzzy / partial match', () => {
    it('matches "star" to Starbucks (prefix fuzzy)', async () => {
      const res = await GET(req('star'))
      const body = await res.json()
      expect(body.results.some((r: { id: string }) => r.id === 'starbucks-id')).toBe(true)
    })

    it('matches Thai name "โลตัส" to Lotus\'s', async () => {
      const res = await GET(req('โลตัส'))
      const body = await res.json()
      expect(body.results.some((r: { id: string }) => r.id === 'lotus-id')).toBe(true)
    })

    it('matches Thai name "สตาร์" to Starbucks', async () => {
      const res = await GET(req('สตาร์'))
      const body = await res.json()
      expect(body.results.some((r: { id: string }) => r.id === 'starbucks-id')).toBe(true)
    })
  })

  describe('no match → fallback', () => {
    it('returns results=[] and fallback=true when nothing matches', async () => {
      const res = await GET(req('zzznomatch999'))
      const body = await res.json()
      expect(body.results).toEqual([])
      expect(body.fallback).toBe(true)
    })

    it('attaches fallbackCategory with name containing "อื่น"', async () => {
      const res = await GET(req('zzznomatch999'))
      const body = await res.json()
      expect(body.fallbackCategory?.name_th).toContain('อื่น')
    })
  })

  describe('result shape', () => {
    it('result items include category info with icon', async () => {
      const res = await GET(req('PT Station'))
      const body = await res.json()
      const pt = body.results.find((r: { id: string }) => r.id === 'pt-id')
      expect(pt).toBeDefined()
      expect(pt.categories?.icon).toBe('⛽')
      expect(pt.categories?.name_th).toBe('น้ำมัน')
    })

    it('result items include id, name_eng, name_th', async () => {
      const res = await GET(req('Starbucks'))
      const body = await res.json()
      const sb = body.results[0]
      expect(sb.id).toBe('starbucks-id')
      expect(sb.name_eng).toBe('Starbucks')
      expect(sb.name_th).toBe('สตาร์บัคส์')
    })
  })
})
