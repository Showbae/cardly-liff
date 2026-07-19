'use client'

import { useEffect, useState, useCallback } from 'react'
import { initLiff, getLiffProfile } from '@/lib/liff'
import { signInWithLine } from '@/lib/auth'
import { getMyCards, removeCard, type UserCard } from '@/lib/cards'
import { AddCardWizard } from '@/components/liff/AddCardWizard'
import { EditCardSheet } from '@/components/liff/EditCardSheet'

interface User {
  id: string
  display_name: string
  picture_url: string
}

const BANK_GRADIENT: Record<string, string> = {
  KBANK: 'linear-gradient(135deg, #1c8c75, #07332a 60%)',
  SCB:   'linear-gradient(135deg, #7c3fa8, #341252)',
  KTC:   'linear-gradient(135deg, #e3603f, #a02b1f)',
  UOB:   'linear-gradient(135deg, #c8253e, #1c2a6a)',
  BBL:   'linear-gradient(135deg, #1b4d9b, #0c2a5e)',
  BAY:   'linear-gradient(135deg, #d99211, #7a4f00)',
  AMEX:  'linear-gradient(135deg, #c1c7cd, #2f3942)',
  AEON:  'linear-gradient(135deg, #d9416f, #8b1a3d)',
}

const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

export function chipGradient(bankId?: string | null) {
  return BANK_GRADIENT[bankId ?? ''] ?? 'linear-gradient(135deg, #2a3a33, #0c1612)'
}
export function bankInitial(bank?: { initial?: string | null; id?: string } | null) {
  return bank?.initial ?? bank?.id?.charAt(0) ?? '?'
}

export function nearestBillingDate(cards: UserCard[]): string | null {
  const now = new Date()
  let nearest: Date | null = null
  for (const uc of cards) {
    let candidate: Date
    if (uc.billing_last_day) {
      // last day of current month; if already past, last day of next month
      candidate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      if (candidate <= now) candidate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    } else if (uc.billing_cycle_day) {
      const day = uc.billing_cycle_day
      candidate = new Date(now.getFullYear(), now.getMonth(), day)
      if (candidate <= now) candidate = new Date(now.getFullYear(), now.getMonth() + 1, day)
    } else {
      continue
    }
    if (!nearest || candidate < nearest) nearest = candidate
  }
  if (!nearest) return null
  return `${nearest.getDate()} ${THAI_MONTHS[nearest.getMonth()]}`
}

export function nearestDueDate(cards: UserCard[]): string | null {
  const now = new Date()
  let nearest: Date | null = null
  for (const uc of cards) {
    let candidate: Date
    if (uc.payment_due_last_day) {
      candidate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      if (candidate <= now) candidate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    } else if (uc.payment_due_day) {
      const day = uc.payment_due_day
      const clamp = (y: number, m: number) =>
        Math.min(day, new Date(y, m + 1, 0).getDate())
      const cy = now.getFullYear(), cm = now.getMonth()
      candidate = new Date(cy, cm, clamp(cy, cm))
      if (candidate <= now) {
        const next = new Date(cy, cm + 1, 1)
        candidate = new Date(next.getFullYear(), next.getMonth(), clamp(next.getFullYear(), next.getMonth()))
      }
    } else {
      continue
    }
    if (!nearest || candidate < nearest) nearest = candidate
  }
  if (!nearest) return null
  return `${nearest.getDate()} ${THAI_MONTHS[nearest.getMonth()]}`
}

export function totalCreditLimit(cards: UserCard[]): number {
  return cards.reduce((sum, uc) => {
    const v = Number(uc.credit_limit ?? 0)
    return sum + (isNaN(v) ? 0 : v)
  }, 0)
}

export function formatBaht(amount: number): string {
  return '฿' + amount.toLocaleString('th-TH', { maximumFractionDigits: 0 })
}

const XIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null)
  const [myCards, setMyCards] = useState<UserCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<UserCard | null>(null)

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

  const hasCards = myCards.length > 0
  const limitTotal = totalCreditLimit(myCards)
  const nextBilling = nearestBillingDate(myCards)
  const nextDue = nearestDueDate(myCards)

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-end justify-between px-[22px] pt-10 pb-0 flex-shrink-0">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-4">
            กระเป๋าบัตร
          </div>
          <h1 className="text-[34px] font-bold mt-1 tracking-[-1.5px] text-ink leading-none">
            {myCards.length}
            <span className="text-[16px] font-medium tracking-[-0.3px] text-ink-3 ml-1">ใบ</span>
          </h1>
        </div>
        <button
          className="w-9 h-9 flex items-center justify-center bg-surface text-ink-3 shrink-0"
          style={{ borderRadius: 999, border: '1px solid var(--line)' }}
          aria-label="ค้นหา"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={1.75} strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable content ─────────────────── */}
      <div className="flex-1 overflow-y-auto px-[22px] pt-[18px]" style={{ scrollbarWidth: 'none' }}>

        {hasCards ? (
          <>
            {/* Summary bar */}
            <div
              className="flex justify-between items-center px-4 py-[14px] mb-5 rounded-[14px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
            >
              <div>
                <div className="text-[12px] text-ink-3">วงเงินรวมทุกใบ</div>
                <div className="text-[15px] font-bold text-ink tracking-[-0.3px] mt-0.5 tabular-nums">
                  {limitTotal > 0 ? formatBaht(limitTotal) : '—'}
                </div>
              </div>
              {(nextBilling || nextDue) && (
                <div className="text-right flex gap-4">
                  {nextBilling && (
                    <div>
                      <div className="text-[12px] text-ink-3">ตัดรอบถัดไป</div>
                      <div className="text-[13px] font-semibold text-ink mt-0.5">{nextBilling}</div>
                    </div>
                  )}
                  {nextDue && (
                    <div>
                      <div className="text-[12px] text-ink-3">ชำระถัดไป</div>
                      <div className="text-[13px] font-semibold text-ink mt-0.5">{nextDue}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section label */}
            <div className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-4 mb-1">
              บัตรของคุณ
            </div>

            {/* Card list */}
            <div className="flex flex-col">
              {myCards.map((uc, i) => {
                const card = uc.credit_cards
                const bankId = card?.bank_id ?? ''
                const bankName = card?.banks?.name_th ?? card?.banks?.name_eng ?? bankId
                const hasMeta = !!(card?.card_tier || uc.last_four || uc.billing_cycle_day || uc.billing_last_day || uc.payment_due_day || uc.payment_due_last_day)
                return (
                  <div
                    key={uc.id}
                    className="flex items-center gap-[13px] py-[14px]"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)', cursor: 'pointer' }}
                    onClick={() => setEditingCard(uc)}
                  >
                    {/* Mini card chip */}
                    <div
                      className="shrink-0 flex items-center justify-center text-white font-bold text-[13px] relative overflow-hidden"
                      style={{
                        width: 44, height: 30, borderRadius: 6,
                        background: chipGradient(bankId),
                        boxShadow: '0 2px 6px rgba(0,0,0,.18)',
                      }}
                    >
                      {bankInitial(card?.banks)}
                    </div>

                    {/* Card info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-ink tracking-[-0.2px] truncate">
                        {card?.card_name}
                      </div>
                      <div className="flex items-center gap-[5px] mt-[3px] flex-wrap">
                        {hasMeta ? (
                          <>
                            {card?.card_tier && (
                              <span
                                className="text-[10px] font-semibold tracking-[.5px] uppercase px-[6px] py-[2px] rounded-[4px] text-ink-3 whitespace-nowrap"
                                style={{ background: 'var(--surface-2)' }}
                              >
                                {card.card_tier}
                              </span>
                            )}
                            {uc.last_four && (
                              <>
                                {card?.card_tier && <span className="text-[11px] text-[var(--line)]">·</span>}
                                <span className="text-[11px] text-ink-3 font-mono tracking-[.5px]">
                                  •••• {uc.last_four}
                                </span>
                              </>
                            )}
                            {(uc.billing_cycle_day || uc.billing_last_day) && (
                              <>
                                {(card?.card_tier || uc.last_four) && <span className="text-[11px] text-[var(--line)]">·</span>}
                                <span className="text-[11px] text-ink-4">
                                  ตัดรอบ {uc.billing_last_day ? 'สิ้นเดือน' : uc.billing_cycle_day}
                                </span>
                              </>
                            )}
                            {(uc.payment_due_day || uc.payment_due_last_day) && (
                              <>
                                <span className="text-[11px] text-[var(--line)]">·</span>
                                <span className="text-[11px] text-ink-4">
                                  ชำระ {uc.payment_due_last_day ? 'สิ้นเดือน' : uc.payment_due_day}
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-ink-4">{bankName}</span>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={e => { e.stopPropagation(); handleRemove(uc.id) }}
                      disabled={removing === uc.id}
                      className="w-7 h-7 flex items-center justify-center text-ink-4 shrink-0"
                      style={{ borderRadius: 999, background: 'var(--surface-2)', border: 'none', cursor: 'pointer' }}
                      aria-label="ลบบัตร"
                    >
                      {removing === uc.id
                        ? <span className="w-3 h-3 border-2 border-ink-4 border-t-transparent rounded-full animate-spin" />
                        : <XIcon />
                      }
                    </button>
                  </div>
                )
              })}
            </div>
            <div style={{ height: 24 }} />
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center text-center py-24 gap-3 px-10">
            <div
              className="flex items-center justify-center text-[26px] mb-1"
              style={{ width: 72, height: 48, borderRadius: 10, background: 'var(--surface-2)' }}
            >
              💳
            </div>
            <div className="text-[17px] font-semibold text-ink">ยังไม่มีบัตรในกระเป๋า</div>
            <div className="text-[13px] text-ink-3 leading-relaxed">
              เพิ่มบัตรเครดิตของคุณเพื่อดูโปรที่คุ้มที่สุด<br />และจัดการรอบบัตรได้เลย
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────── */}
      <div
        className="flex-shrink-0 px-[22px] pb-8 pt-3"
        style={{ background: 'linear-gradient(to top, var(--bg) 80%, transparent)' }}
      >
        <button
          onClick={() => setShowWizard(true)}
          className="w-full flex items-center justify-center gap-2 text-[15px] font-semibold py-[15px]"
          style={{ borderRadius: 999, background: 'var(--ink)', color: 'var(--bg)', border: 'none', cursor: 'pointer', letterSpacing: '-.2px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {hasCards ? 'เพิ่มบัตร' : 'เพิ่มบัตรใบแรก'}
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

      {/* ── Edit Card Sheet ──────────────────────── */}
      {editingCard && (
        <EditCardSheet
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSaved={updated => {
            setMyCards(prev => prev.map(c =>
              c.id === updated.id ? { ...c, ...updated } : c
            ))
            setEditingCard(null)
          }}
        />
      )}
    </div>
  )
}
