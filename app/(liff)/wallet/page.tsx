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

const TIER_COLOR: Record<string, string> = {
  Infinite:  'from-gray-800 to-gray-600',
  Prestige:  'from-gray-800 to-gray-600',
  Signature: 'from-blue-900 to-blue-700',
  Platinum:  'from-slate-600 to-slate-400',
  Gold:      'from-yellow-700 to-yellow-500',
}

function tierColor(tier: string | null) {
  return TIER_COLOR[tier ?? ''] ?? 'from-gray-500 to-gray-400'
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
        const [cards, cat] = await Promise.all([
          getMyCards(dbUser.id),
          getCatalogCards(),
        ])
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

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-surface px-5 pt-10 pb-5 border-b border-line">
        <div className="flex items-center gap-3">
          {user?.picture_url && (
            <img
              src={user.picture_url}
              alt="profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div>
            <p className="text-xs text-ink-4">สวัสดี</p>
            <p className="font-semibold text-ink">{user?.display_name}</p>
          </div>
        </div>
        <h1 className="mt-4 text-lg font-semibold text-ink">กระเป๋าบัตร</h1>
        <p className="text-sm text-ink-4">{myCards.length} ใบ</p>
      </div>

      {/* My Cards */}
      <div className="px-4 mt-4 space-y-3">
        {myCards.length === 0 && (
          <div className="text-center py-14 text-ink-4">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-sm">ยังไม่มีบัตร กด + เพื่อเพิ่มบัตร</p>
          </div>
        )}
        {myCards.map(uc => {
          const card = uc.credit_cards
          const bank = card?.banks
          return (
            <div
              key={uc.id}
              className={`relative rounded-card bg-gradient-to-br ${tierColor(card?.card_tier ?? null)} text-white p-4 shadow-card`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs opacity-70">{bank?.name_th ?? bank?.name_eng}</p>
                  <p className="font-semibold mt-0.5">{card?.card_name}</p>
                  <span className="inline-block mt-2 text-xs bg-white/20 rounded-full px-2 py-0.5">
                    {card?.card_tier}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(uc.id)}
                  disabled={removing === uc.id}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                >
                  {removing === uc.id ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-sm leading-none">✕</span>
                  )}
                </button>
              </div>
              <div className="mt-4 w-8 h-6 rounded bg-yellow-300/60" />
            </div>
          )
        })}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-brand-700 text-white shadow-depth-lg text-2xl flex items-center justify-center hover:bg-brand-600 active:scale-95 transition"
      >
        +
      </button>

      {/* Add Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface">
          <div className="flex items-center gap-3 px-5 pt-10 pb-3 border-b border-line">
            <button
              onClick={() => { setShowAddModal(false); setSearch('') }}
              className="text-ink-3 text-xl"
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
                        <div
                          key={card.id}
                          className="flex items-center justify-between bg-surface border border-line rounded-xl px-4 py-3 shadow-depth-sm"
                        >
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
                            ) : owned ? (
                              'มีแล้ว'
                            ) : (
                              'เพิ่ม'
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
