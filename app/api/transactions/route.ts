import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The list is paged by 6-month windows, always cut on a month boundary so the
// per-month subtotals rendered on the client stay correct. The `before` cursor
// is the month-start of the oldest window already loaded; omit it for the first
// (most recent 6 months) page. HARD_CAP is a safety net — it should never fire
// at manual-capture volume, only guards against a pathological single window.
const LOOKBACK_MONTHS = 6
const HARD_CAP = 500

// Month boundaries are computed in Asia/Bangkok (UTC+7, no DST) so the server's
// window cut lines up with how the client groups rows by month — otherwise a
// transaction in the first hours of a Bangkok month (still the previous month in
// UTC) would fall outside the window and leave that month's subtotal incomplete.
const TZ_OFFSET_MS = 7 * 60 * 60 * 1000

// First of a Bangkok-local month, returned as the equivalent UTC instant.
function bangkokMonthStart(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1) - TZ_OFFSET_MS)
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const usersCardId = params.get('usersCardId')
  if (!usersCardId || !UUID_RE.test(usersCardId)) {
    return NextResponse.json({ error: 'usersCardId required' }, { status: 400 })
  }

  // Resolve the [lower, upper) window, both aligned to a Bangkok month boundary.
  const beforeParam = params.get('before')
  let upper: Date | null
  let lower: Date
  if (beforeParam) {
    const cursor = new Date(beforeParam)
    if (Number.isNaN(cursor.getTime())) {
      return NextResponse.json({ error: 'invalid before cursor' }, { status: 400 })
    }
    // Read the cursor's Bangkok year/month, then step back a full window.
    const bkk = new Date(cursor.getTime() + TZ_OFFSET_MS)
    upper = cursor
    lower = bangkokMonthStart(bkk.getUTCFullYear(), bkk.getUTCMonth() - LOOKBACK_MONTHS)
  } else {
    const bkk = new Date(Date.now() + TZ_OFFSET_MS)
    upper = null
    // current month + (LOOKBACK_MONTHS - 1) prior months = LOOKBACK_MONTHS months
    lower = bangkokMonthStart(bkk.getUTCFullYear(), bkk.getUTCMonth() - (LOOKBACK_MONTHS - 1))
  }

  try {
    const spentAt: { gte: Date; lt?: Date } = { gte: lower }
    if (upper) spentAt.lt = upper

    const [txs, older, total] = await Promise.all([
      prisma.transactions.findMany({
        where: { users_card_id: usersCardId, spent_at: spentAt },
        orderBy: { spent_at: 'desc' },
        take: HARD_CAP,
        select: {
          id:       true,
          amount:   true,
          spent_at: true,
          note:     true,
          merchants: {
            select: {
              id:       true,
              name_th:  true,
              name_eng: true,
              categories: { select: { icon: true, name_th: true } },
            },
          },
        },
      }),
      prisma.transactions.findFirst({
        where: { users_card_id: usersCardId, spent_at: { lt: lower } },
        select: { id: true },
      }),
      prisma.transactions.count({ where: { users_card_id: usersCardId } }),
    ])

    const hasMore = older !== null
    return NextResponse.json({
      transactions: txs.map(tx => ({ ...tx, amount: Number(tx.amount) })),
      nextCursor: hasMore ? lower.toISOString() : null,
      hasMore,
      total,
    })
  } catch (error) {
    console.error('[GET /api/transactions]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

const createSchema = z.object({
  usersCardId: z.string().regex(UUID_RE, 'invalid uuid'),
  merchantId:  z.string().regex(UUID_RE, 'invalid uuid').optional(),
  amount:      z.number().positive().max(999_999.99),
  spentAt:     z.string().datetime().optional(),
  note:        z.string().max(255).optional(),

  // ── วัดผลระบบแนะนำบัตร ──────────────────────────────────────────────
  // ทั้งสองฟิลด์ optional เพื่อไม่ให้ caller เดิมพัง — source ตกไปเป็น
  // 'liff' ตาม default ของ DB
  source: z.enum(['liff', 'chat', 'ocr', 'import']).optional(),

  // บัตรที่ระบบแนะนำตอนที่ user กำลังจะรูด · ส่งมาเมื่อผ่านหน้าแนะนำเท่านั้น
  // เทียบกับ usersCardId แล้วรู้ว่า user ทำตามคำแนะนำหรือรูดสวน
  recommendedCardId: z.string().regex(UUID_RE, 'invalid uuid').optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const tx = await prisma.transactions.create({
      data: {
        users_card_id: data.usersCardId,
        merchant_id:   data.merchantId ?? null,
        amount:        data.amount,
        spent_at:      data.spentAt ? new Date(data.spentAt) : new Date(),
        note:          data.note ?? null,
        source:              data.source ?? 'liff',
        recommended_card_id: data.recommendedCardId ?? null,
      },
      select: {
        id:           true,
        amount:       true,
        spent_at:     true,
        users_card_id: true,
        merchant_id:  true,
      },
    })

    return NextResponse.json({
      success: true,
      transaction: {
        ...tx,
        amount: Number(tx.amount),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('[POST /api/transactions]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
