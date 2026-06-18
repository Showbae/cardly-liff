'use client'

import { useEffect, useState, useCallback } from 'react'
import { initLiff, getLiffProfile } from '@/lib/liff'
import { signInWithLine } from '@/lib/auth'
import {
  getCatalogCards,
  getMyCards,
  addCard,
  removeCard,
  type CreditCard,
  type UserCard,
} from '@/lib/cards'

interface User {
  id: string
  display_name: string
  picture_url: string
}

const BANK_GRADIENT: Record<string, string> = {
  KBANK: 'linear-gradient(135deg, #1c8c75, #07332a 60%, #1c5945)',
  SCB:   'linear-gradient(135deg, #6b2d8c, #341252)',
  KTC:   'linear-gradient(135deg, #e3603f, #a02b1f)',
  UOB:   'linear-gradient(135deg, #c8253e, #1c2a6a)',
  BBL:   'linear-gradient(135deg, #1b4d9b, #0c2a5e)',
  BAY:   'linear-gradient(135deg, #d99211, #7a4f00)',
  AMEX:  'linear-gradient(135deg, #c1c7cd, #2f3942)',
  AEON:  'linear-gradient(135deg, #d9416f, #8b1a3d)',
}

const BANK_COLOR: Record<string, string> = {
  KBANK: '#0a8665', SCB: '#5e2b8f', KTC: '#e3603f',
  UOB: '#1c2a6a', BBL: '#0a3a8b', BAY: '#d99211',
  AMEX: '#2c343c', AEON: '#d9416f',
}

const BANK_INITIAL: Record<string, string> = {
  KBANK: 'K', SCB: 'ส', KTC: 'K', UOB: 'U',
  BBL: 'B', BAY: 'ก', AMEX: 'A', AEON: 'A',
}

function cardGradient(bankId?: string | null) {
  return BANK_GRADIENT[bankId ?? ''] ?? 'linear-gradient(135deg, #2a3a33, #0c1612)'
}

function bankInitial(bankId?: string | null) {
  return BANK_INITIAL[bankId ?? ''] ?? (bankId?.charAt(0) ?? '?')
}

function bankColor(bankId?: string | null) {
  return BANK_COLOR[bankId ?? ''] ?? '#2a3a33'
}

// ── Featured card visual ─────────────────────────────────────
function FeaturedCard({ uc }: { uc: UserCard }) {
  const card = uc.credit_cards
  const bank = card?.banks
  const bankName = bank?.name_th ?? bank?.name_eng ?? card?.bank_id ?? ''

  return (
    <div
      className="w-full text-white mt-2"
      style={{
        aspectRatio: '1.586 / 1',
        borderRadius: 'var(--r-card)',
        background: cardGradient(card?.bank_id),
        boxShadow: 'var(--shadow-card)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top row: bank name + network */}
      <div className="flex justify-between items-start">
        <div className="text-[11px] font-semibold tracking-[0.8px] opacity-80 uppercase">{bankName}</div>
        <div className="text-[11px] font-bold tracking-[1px] opacity-70 uppercase">VISA</div>
      </div>
      {/* Chip */}
      <div
        style={{
          width: 30, height: 22, borderRadius: 4,
          background: 'linear-gradient(135deg, #e8d97e, #c9a84c)',
          border: '1px solid rgba(255,255,255,.2)',
        }}
      />
      {/* Bottom row */}
      <div>
        <div className="font-mono text-[14px] tracking-[2px] opacity-85">•••• •••• •••• ••••</div>
        <div className="flex justify-between items-end mt-1.5">
          <div>
            <div className="text-[13px] font-semibold tracking-tight leading-snug">{card?.card_name}</div>
            {card?.card_tier && (
              <div className="text-[10px] opacity-60 uppercase tracking-[0.6px] mt-0.5">{card.card_tier}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null)
  const [myCards, setMyCards] = useState<UserCard[]>([])
  const [catalog, setCatalog] = useState<CreditCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const loadMyCards = useCallback(async (userId: string) => {
    const cards = await getMyCards(userId)
    setMyCards(cards)
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        await initLiff()
        const profile = await getLiffProfile()

        // Dev fallback: ใช้ Showbae account เมื่อไม่ได้อยู่ใน LINE
        const dbUser = profile
          ? await signInWithLine({
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl ?? '',
            })
          : { id: '9ee6ee16-d45a-4750-8bcb-ef59285bf2e4', display_name: 'Showbae🍀', picture_url: '' }

        setUser(dbUser)
        const [cards, cat] = await Promise.all([getMyCards(dbUser.id), getCatalogCards()])
        setMyCards(cards)
        setCatalog(cat)
      } catch (err) {
        setError('เกิดข้อผิดพลาด: ' + String(err))
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const handleAdd = async (cardId: string) => {
    if (!user) return
    setAdding(cardId)
    try {
      await addCard(user.id, cardId)
      await loadMyCards(user.id)
    } finally {
      setAdding(null)
    }
  }

  const handleRemove = async (userCardId: string) => {
    if (!user) return
    setRemoving(userCardId)
    try {
      await removeCard(userCardId)
      setMyCards(prev => prev.filter(c => c.id !== userCardId))
    } finally {
      setRemoving(null)
    }
  }

  const myCardIds = new Set(myCards.map(c => c.card_id))

  const filteredCatalog = catalog.filter(c => {
    const q = search.toLowerCase()
    return (
      c.card_name?.toLowerCase().includes(q) ||
      c.banks?.name_th?.includes(q) ||
      c.banks?.name_eng?.toLowerCase().includes(q)
    )
  })

  const byBank = filteredCatalog.reduce<Record<string, CreditCard[]>>((acc, c) => {
    const key = c.bank_id ?? 'อื่นๆ'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-ink-3 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg p-6">
        <div className="bg-warn-bg border border-warn/30 rounded-xl p-4 text-warn text-sm max-w-sm w-full">
          {error}
        </div>
      </div>
    )
  }

  const featured = myCards[0]
  const rest = myCards.slice(1)

  return (
    <div className="min-h-screen bg-bg">

      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-start justify-between px-[22px] pt-10 pb-1">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-4">
            กระเป๋าบัตร
          </div>
          <h1 className="text-[30px] font-semibold mt-1 tracking-tight text-ink leading-none">
            {myCards.length} ใบ
          </h1>
        </div>
        <button
          className="w-9 h-9 flex items-center justify-center bg-surface text-ink-2 shrink-0 mt-1"
          style={{ borderRadius: 999, border: '1px solid var(--line)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      <div className="px-[22px] pb-8">

        {/* ── Featured Card ──────────────────────── */}
        {featured ? (
          <>
            <FeaturedCard uc={featured} />

            {/* Section caption */}
            <div className="flex justify-between items-center mt-[14px] mb-1 mx-0.5">
              <div className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-4">
                บัตรของคุณ
              </div>
              <span className="text-[11px] text-ink-3">ประหยัด ฿0</span>
            </div>

            {/* Card rows */}
            <div className="flex flex-col">
              {rest.map(uc => {
                const card = uc.credit_cards
                const bankId = card?.bank_id ?? ''
                const bankName = card?.banks?.name_th ?? card?.banks?.name_eng ?? bankId
                return (
                  <div
                    key={uc.id}
                    className="flex items-center gap-[14px] py-[14px] px-0.5"
                    style={{ borderTop: '1px solid var(--line-soft)' }}
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center text-white font-semibold text-[14px] shrink-0"
                      style={{ borderRadius: 8, background: bankColor(bankId) }}
                    >
                      {bankInitial(bankId)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-ink tracking-[-0.2px] truncate">
                        {card?.card_name}
                      </div>
                      <div className="text-[11px] text-ink-3 mt-0.5">
                        {bankName} · ••••
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-semibold text-ink-2">{card?.card_tier}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="text-center py-14 text-ink-4">
            <div className="text-4xl mb-3">💳</div>
            <p className="text-sm">ยังไม่มีบัตร กดเพิ่มบัตรด้านล่าง</p>
          </div>
        )}

        {/* ── Add Card button ─────────────────────── */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full mt-[18px] flex items-center justify-center gap-2 text-[14px] font-semibold py-[13px]"
          style={{ borderRadius: 999, background: 'var(--ink)', color: 'var(--bg)' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          เพิ่มบัตร
        </button>
      </div>

      {/* ── Add Card Modal ─────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface">
          <div className="flex items-center gap-3 px-5 pt-10 pb-3 border-b border-line">
            <button
              onClick={() => { setShowAddModal(false); setSearch('') }}
              className="text-ink-3 text-xl leading-none"
            >
              ←
            </button>
            <h2 className="font-semibold text-ink flex-1">เพิ่มบัตร</h2>
          </div>
          <div className="px-4 py-3 border-b border-line bg-bg">
            <input
              type="text"
              placeholder="ค้นหาชื่อบัตรหรือธนาคาร..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
            {Object.entries(byBank).map(([bankId, cards]) => {
              const bankName = cards[0]?.banks?.name_th ?? cards[0]?.banks?.name_eng ?? bankId
              return (
                <div key={bankId}>
                  <p className="text-xs font-semibold text-ink-4 uppercase tracking-wide mb-2">
                    {bankName}
                  </p>
                  <div className="space-y-2">
                    {cards.map(card => {
                      const owned = myCardIds.has(card.id)
                      return (
                        <div key={card.id}
                          className="flex items-center justify-between bg-surface border border-line rounded-xl px-4 py-3 shadow-depth-sm">
                          <div>
                            <p className="text-sm font-medium text-ink">{card.card_name}</p>
                            <p className="text-xs text-ink-4 mt-0.5">{card.card_tier}</p>
                          </div>
                          <button
                            onClick={() => !owned && handleAdd(card.id)}
                            disabled={owned || adding === card.id}
                            className={`min-w-[64px] text-sm rounded-full px-3 py-1.5 font-medium transition ${
                              owned
                                ? 'bg-surface-2 text-ink-4 cursor-default'
                                : 'bg-brand-700 text-white hover:bg-brand-600 active:scale-95'
                            }`}
                          >
                            {adding === card.id ? (
                              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : owned ? 'มีแล้ว' : 'เพิ่ม'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {/* Remove card option (long-press simulation) */}
            {myCards.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-4 uppercase tracking-wide mb-2">
                  จัดการบัตร
                </p>
                <div className="space-y-2">
                  {myCards.map(uc => (
                    <div key={uc.id}
                      className="flex items-center justify-between bg-surface border border-line rounded-xl px-4 py-3 shadow-depth-sm">
                      <div>
                        <p className="text-sm font-medium text-ink">{uc.credit_cards?.card_name}</p>
                        <p className="text-xs text-ink-4 mt-0.5">{uc.credit_cards?.card_tier}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(uc.id)}
                        disabled={removing === uc.id}
                        className="min-w-[64px] text-sm rounded-full px-3 py-1.5 font-medium transition bg-warn-bg text-warn"
                      >
                        {removing === uc.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-warn border-t-transparent rounded-full animate-spin" />
                        ) : 'ลบ'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
