import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const merchantId = req.nextUrl.searchParams.get('merchantId')?.trim()
  const userId = req.nextUrl.searchParams.get('userId')?.trim()

  if (!merchantId || !userId) {
    return NextResponse.json({ error: 'merchantId and userId required' }, { status: 400 })
  }
  if (!UUID_RE.test(merchantId) || !UUID_RE.test(userId)) {
    return NextResponse.json({ error: 'invalid uuid' }, { status: 400 })
  }

  try {
    const [merchant, userCards] = await Promise.all([
      prisma.merchants.findUnique({
        where: { id: merchantId },
        include: { categories: true },
      }),
      prisma.users_card.findMany({
        where: { user_id: userId },
        include: { credit_cards: { include: { banks: true } } },
      }),
    ])

    if (!merchant) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })

    if (userCards.length === 0) {
      return NextResponse.json({
        merchant: formatMerchant(merchant),
        recommendations: [],
        suggestedCards: [],
        noCards: true,
      })
    }

    const now = new Date()
    const promos = await prisma.promotions.findMany({
      where: {
        status: 'active',
        end_date: { gte: now },
        OR: [
          ...(merchant.category_id ? [{ category_id: merchant.category_id }] : []),
          { promotion_merchants: { some: { merchant_id: merchantId } } },
        ],
      },
      include: {
        promotion_cards: true,
        promotion_merchants: true,
      },
    })

    // ── Score a single (card, promo) pair ─────────────────────────────────
    function scorePromo(
      promo: typeof promos[0],
      cardId: string,
      bankId: string,
    ): number | null {
      if (promo.bank_id !== bankId) return null
      if (
        promo.promotion_cards.length > 0 &&
        !promo.promotion_cards.some(pc => pc.card_id === cardId)
      ) return null

      const isMerchant = promo.promotion_merchants.some(pm => pm.merchant_id === merchantId)
      return (isMerchant ? 1000 : 0)
        + (promo.promo_type === 'cashback' ? 200 : promo.promo_type === 'discount' ? 100 : 0)
        + Number(promo.benefit_value ?? 0)
    }

    // ── M3 fix: per bank, try ALL user cards and pick best (card, promo) ──
    const userBankIds = new Set<string>()
    for (const uc of userCards) {
      if (uc.credit_cards?.bank_id) userBankIds.add(uc.credit_cards.bank_id)
    }

    type Rec = {
      userCard: typeof userCards[0]
      promo: typeof promos[0] | null
      score: number
      scope: 'merchant' | 'category' | 'none'
    }

    const bestPerBank = new Map<string, Rec>()

    for (const uc of userCards) {
      const card = uc.credit_cards
      if (!card?.bank_id) continue
      const bankId = card.bank_id

      // Find best promo for this specific card
      let bestPromo: typeof promos[0] | null = null
      let bestScore = -1
      let bestScope: 'merchant' | 'category' | 'none' = 'none'

      for (const promo of promos) {
        const s = scorePromo(promo, card.id, bankId)
        if (s === null || s <= bestScore) continue
        bestScore = s
        bestPromo = promo
        bestScope = promo.promotion_merchants.some(pm => pm.merchant_id === merchantId)
          ? 'merchant'
          : 'category'
      }

      const current = bestPerBank.get(bankId)
      if (!current || bestScore > current.score) {
        bestPerBank.set(bankId, { userCard: uc, promo: bestPromo, score: bestScore, scope: bestScope })
      }
    }

    const recs = [...bestPerBank.values()].sort((a, b) => b.score - a.score)
    const top3 = recs.slice(0, 3)

    // ── Suggested cards: best non-owned cards with a promo ────────────────
    const catalogCards = await prisma.credit_cards.findMany({
      where: { bank_id: { notIn: [...userBankIds] } },
      include: { banks: true },
      take: 50,  // m5: safety cap
    })

    const catalogBankMap = new Map<string, typeof catalogCards[0]>()
    for (const card of catalogCards) {
      if (!card.bank_id || catalogBankMap.has(card.bank_id)) continue
      catalogBankMap.set(card.bank_id, card)
    }

    type SuggRec = {
      card: typeof catalogCards[0]
      promo: typeof promos[0]
      score: number
      scope: 'merchant' | 'category'
    }

    const suggestedRecs: SuggRec[] = []
    for (const [bankId, card] of catalogBankMap) {
      let best: typeof promos[0] | null = null
      let bestScore = -1
      let bestScope: 'merchant' | 'category' = 'category'

      for (const promo of promos) {
        if (promo.bank_id !== bankId) continue
        if (promo.promotion_cards.length > 0 &&
            !promo.promotion_cards.some(pc => pc.card_id === card.id)) continue

        const isMerchant = promo.promotion_merchants.some(pm => pm.merchant_id === merchantId)
        const score = (isMerchant ? 1000 : 0)
          + (promo.promo_type === 'cashback' ? 200 : promo.promo_type === 'discount' ? 100 : 0)
          + Number(promo.benefit_value ?? 0)

        if (score > bestScore) {
          bestScore = score; best = promo
          bestScope = isMerchant ? 'merchant' : 'category'
        }
      }

      if (best) suggestedRecs.push({ card, promo: best, score: bestScore, scope: bestScope })
    }

    suggestedRecs.sort((a, b) => b.score - a.score)
    const topSuggestions = suggestedRecs.slice(0, 2)

    return NextResponse.json({
      merchant: formatMerchant(merchant),
      recommendations: top3.map((r, i) => ({
        rank: i + 1,
        card: {
          id: r.userCard.credit_cards!.id,
          usersCardId: r.userCard.id,
          card_name: r.userCard.credit_cards!.card_name,
          image_url: r.userCard.credit_cards!.image_url,
          last_four: r.userCard.last_four,
          bank: r.userCard.credit_cards!.banks,
        },
        promo: r.promo && r.scope !== 'none' ? formatPromo(r.promo, r.scope, merchantId) : null,
      })),
      suggestedCards: topSuggestions.map(s => ({
        card: {
          id: s.card.id,
          card_name: s.card.card_name,
          image_url: s.card.image_url,
          bank: s.card.banks,
        },
        promo: formatPromo(s.promo, s.scope, merchantId),
      })),
    })
  } catch (err) {
    console.error('[GET /api/recommend]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function formatPromo(
  promo: {
    title: string
    promo_type: string | null
    benefit_value: unknown
    benefit_unit: string | null
    max_cap: unknown
    min_spend: unknown
    end_date: Date | null
    condition: string | null
    promotion_merchants: { merchant_id: string }[]
  },
  scope: 'merchant' | 'category',
  _merchantId: string,
) {
  return {
    title: promo.title,
    promo_type: promo.promo_type,
    benefit_value: Number(promo.benefit_value ?? 0),
    benefit_unit: promo.benefit_unit,
    max_cap: promo.max_cap !== null ? Number(promo.max_cap) : null,
    min_spend: promo.min_spend !== null ? Number(promo.min_spend) : null,
    end_date: promo.end_date?.toISOString().split('T')[0] ?? null,
    condition: promo.condition,
    scope,
  }
}

function formatMerchant(m: {
  id: string
  name_th: string | null
  name_eng: string | null
  categories: { name_th: string | null; name_eng: string | null; icon: string | null } | null
}) {
  return {
    id: m.id,
    name_th: m.name_th,
    name_eng: m.name_eng,
    categories: m.categories,
  }
}
