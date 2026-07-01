'use client'

import { useEffect, useState, useCallback } from 'react'
import { initLiff, getLiffProfile } from '@/lib/liff'
import { signInWithLine } from '@/lib/auth'
import { getMyCards, removeCard, type UserCard } from '@/lib/cards'
import { AddCardWizard } from '@/components/liff/AddCardWizard'

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
function FeaturedCard({ uc, onRemove, removing }: {
  uc: UserCard
  onRemove: (id: string) => void
  removing: boolean
}) {
  const card = uc.credit_cards
  const bank = card?.banks
  const bankName = bank?.name_th ?? bank?.name_eng ?? card?.bank_id ?? ''

  return (
    <div className="w-full text-white mt-2 relative" style={{
      aspectRatio: '1.586 / 1',
      borderRadius: 'var(--r-card)',
      background: cardGradient(card?.bank_id),
      boxShadow: 'var(--shadow-card)',
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div className="flex justify-between items-start">
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', opacity: .8, textTransform: 'uppercase' }}>
          {bankName}
        </div>
        <button
          onClick={() => onRemove(uc.id)}
          disabled={removing}
          style={{
            width: 24, height: 24, borderRadius: 999,
            background: 'rgba(255,255,255,.2)', border: 'none',
            color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center',
          }}
        >
          {removing
            ? <span style={{ width: 10, height: 10, borderRadius: 999, border: '2px solid #fff', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
            : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          }
        </button>
      </div>

      <div style={{ width: 30, height: 22, borderRadius: 4, background: 'linear-gradient(135deg, #e8d97e, #c9a84c)', border: '1px solid rgba(255,255,255,.2)' }} />

      <div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, letterSpacing: 2, opacity: .85 }}>
          •••• •••• •••• ••••
        </div>
        <div className="flex justify-between items-end mt-1.5">
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-.2px' }}>{card?.card_name}</div>
            {card?.card_tier && (
              <div style={{ fontSize: 10, opacity: .6, textTransform: 'uppercase', letterSpacing: '.6px', marginTop: 2 }}>
                {card.card_tier}
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, opacity: .7, textTransform: 'uppercase' }}>
            VISA
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null)
  const [myCards, setMyCards] = useState<UserCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showWizard, setShowWizard] = useState(false)
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
        await loadMyCards(dbUser.id)
      } catch (err) {
        setError('เกิดข้อผิดพลาด: ' + String(err))
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [loadMyCards])

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
            <FeaturedCard
              uc={featured}
              onRemove={handleRemove}
              removing={removing === featured.id}
            />

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
                    <button
                      onClick={() => handleRemove(uc.id)}
                      disabled={removing === uc.id}
                      className="w-6 h-6 flex items-center justify-center text-ink-4 shrink-0"
                      style={{ borderRadius: 999, background: 'var(--surface-2)', border: 'none', cursor: 'pointer' }}
                    >
                      {removing === uc.id
                        ? <span className="w-3 h-3 border-2 border-ink-4 border-t-transparent rounded-full animate-spin" />
                        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-14 text-ink-4">
            <div className="text-4xl mb-3">💳</div>
            <p className="text-sm">ยังไม่มีบัตร กดเพิ่มบัตรด้านล่าง</p>
          </div>
        )}

        {/* ── Add Card button ─────────────────────── */}
        <button
          onClick={() => setShowWizard(true)}
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

      {/* ── Add Card Wizard ─────────────────────── */}
      {showWizard && (
        <AddCardWizard
          userId={user?.id ?? ''}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false)
            if (user) loadMyCards(user.id)
          }}
        />
      )}
    </div>
  )
}
