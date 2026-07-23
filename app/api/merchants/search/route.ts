import { NextRequest, NextResponse } from 'next/server'
import Fuse from 'fuse.js'
import { prisma } from '@/lib/prisma'

interface MerchantRecord {
  id: string
  name_th: string | null
  name_eng: string | null
  mcc_code: string | null
  category_id: string | null
  categories: { id: string; name_th: string | null; name_eng: string | null; icon: string | null } | null
}

// Module-scope cache — survives across requests on the same serverless instance
let cachedMerchants: MerchantRecord[] | null = null
let cachedAt = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function getMerchants(): Promise<MerchantRecord[]> {
  const now = Date.now()
  if (cachedMerchants && now - cachedAt < CACHE_TTL_MS) return cachedMerchants

  const rows = await prisma.merchants.findMany({
    select: {
      id: true,
      name_th: true,
      name_eng: true,
      mcc_code: true,
      category_id: true,
      categories: { select: { id: true, name_th: true, name_eng: true, icon: true } },
    },
    orderBy: { name_eng: 'asc' },
  })

  cachedMerchants = rows as MerchantRecord[]
  cachedAt = now
  return cachedMerchants
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (!q) {
    return NextResponse.json({ results: [], fallback: false })
  }

  try {
    const merchants = await getMerchants()

    const fuse = new Fuse(merchants, {
      keys: [
        { name: 'name_eng', weight: 0.6 },
        { name: 'name_th', weight: 0.4 },
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    })

    const hits = fuse.search(q, { limit: 10 })

    if (hits.length > 0) {
      return NextResponse.json({
        results: hits.map(h => h.item),
        fallback: false,
      })
    }

    // Fallback: return "อื่นๆ" category so caller can still proceed
    const other = await prisma.categories.findFirst({
      where: { name_th: { contains: 'อื่น' } },
    })

    return NextResponse.json({
      results: [],
      fallback: true,
      fallbackCategory: other ?? null,
    })
  } catch (err) {
    console.error('[GET /api/merchants/search]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
