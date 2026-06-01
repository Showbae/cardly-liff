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

export default function HomePage() {
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
        if (!profile) return
        const dbUser = await signInWithLine({
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl ?? '',
        })
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

  // Group catalog by bank
  const byBank = filteredCatalog.reduce<Record<string, CreditCard[]>>((acc, c) => {
    const key = c.bank_id ?? 'อื่นๆ'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm max-w-sm w-full">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-5 shadow-sm">
        <div className="flex items-center gap-3">
          {user?.picture_url && (
            <img
              src={user.picture_url}
              alt="profile"
              className="w-11 h-11 rounded-full object-cover"
            />
          )}
          <div>
            <p className="text-xs text-gray-400">สวัสดี</p>
            <p className="font-semibold text-gray-800">{user?.display_name}</p>
          </div>
        </div>
        <h1 className="mt-4 text-lg font-bold text-gray-900">กระเป๋าบัตรของฉัน</h1>
        <p className="text-sm text-gray-400">{myCards.length} บัตร</p>
      </div>

      {/* My Cards */}
      <div className="px-4 mt-5 space-y-3">
        {myCards.length === 0 && (
          <div className="text-center py-12 text-gray-400">
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
              className={`relative rounded-2xl bg-gradient-to-br ${tierColor(card?.card_tier ?? null)} text-white p-4 shadow-md`}
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
              {/* Card chip */}
              <div className="mt-4 w-8 h-6 rounded bg-yellow-300/60" />
            </div>
          )
        })}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 text-white shadow-lg text-2xl flex items-center justify-center hover:bg-green-600 active:scale-95 transition"
      >
        +
      </button>

      {/* Add Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Modal header */}
          <div className="flex items-center gap-3 px-4 pt-10 pb-3 border-b">
            <button
              onClick={() => { setShowAddModal(false); setSearch('') }}
              className="text-gray-500 text-xl"
            >
              ←
            </button>
            <h2 className="font-semibold text-gray-800 flex-1">เพิ่มบัตร</h2>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b bg-gray-50">
            <input
              type="text"
              placeholder="ค้นหาชื่อบัตรหรือธนาคาร..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400"
            />
          </div>

          {/* Catalog list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
            {Object.entries(byBank).map(([bankId, cards]) => {
              const bankName = cards[0]?.banks?.name_th ?? cards[0]?.banks?.name_eng ?? bankId
              return (
                <div key={bankId}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {bankName}
                  </p>
                  <div className="space-y-2">
                    {cards.map(card => {
                      const owned = myCardIds.has(card.id)
                      return (
                        <div
                          key={card.id}
                          className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">{card.card_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{card.card_tier}</p>
                          </div>
                          <button
                            onClick={() => !owned && handleAdd(card.id)}
                            disabled={owned || adding === card.id}
                            className={`min-w-[64px] text-sm rounded-full px-3 py-1.5 font-medium transition ${
                              owned
                                ? 'bg-gray-100 text-gray-400 cursor-default'
                                : 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
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
