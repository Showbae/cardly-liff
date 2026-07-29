'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { initLiff, getLiffProfile } from '@/lib/liff'
import { signInWithLine } from '@/lib/auth'
import { getMyCards, type UserCard } from '@/lib/cards'
import {
  chipGradient, bankInitial,
  nearestBillingDate, nearestDueDate, totalCreditLimit, formatBaht,
} from '@/lib/card-utils'

export default function WalletPage() {
  const router = useRouter()
  const [myCards, setMyCards] = useState<UserCard[]>([])
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMyCards = useCallback(async (uid: string) => {
    const cards = await getMyCards(uid)
    setMyCards(cards)
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        await initLiff()
        const profile = await getLiffProfile()
        const dbUser = profile
          ? await signInWithLine({ userId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl ?? '' })
          : { id: '9ee6ee16-d45a-4750-8bcb-ef59285bf2e4', display_name: 'Showbae🍀' }
        setUserId(dbUser.id)
        await loadMyCards(dbUser.id)
      } catch (err) {
        setError('เกิดข้อผิดพลาด: ' + String(err))
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [loadMyCards])

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
        <div className="bg-warn-bg border border-warn/30 rounded-xl p-4 text-warn text-sm max-w-sm w-full">{error}</div>
      </div>
    )
  }

  const hasCards = myCards.length > 0
  const limitTotal = totalCreditLimit(myCards)
  const nextBilling = nearestBillingDate(myCards)
  const nextDue = nearestDueDate(myCards)

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <div className="flex items-end justify-between px-[22px] pt-10 pb-0 flex-shrink-0">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-4">กระเป๋าบัตร</div>
          <h1 className="text-[34px] font-bold mt-1 tracking-[-1.5px] text-ink leading-none">
            {myCards.length}
            <span className="text-[16px] font-medium tracking-[-0.3px] text-ink-3 ml-1">ใบ</span>
          </h1>
        </div>
        <div
          className="w-9 h-9 flex items-center justify-center text-ink-3 flex-shrink-0"
          style={{ borderRadius: 999, border: '1px solid var(--line)', background: 'var(--surface)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={1.75} strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-[22px] pt-[18px]" style={{ scrollbarWidth: 'none', overscrollBehavior: 'contain' }}>
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

            <div className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-4 mb-1">บัตรของคุณ</div>

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
                    onClick={() => router.push(`/wallet/${uc.id}`)}
                  >
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

                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-ink tracking-[-0.2px] truncate">
                        {card?.card_name}
                      </div>
                      <div className="flex items-center gap-[5px] mt-[3px] flex-wrap">
                        {hasMeta ? (
                          <>
                            {card?.card_tier && (
                              <span className="text-[10px] font-semibold tracking-[.5px] uppercase px-[6px] py-[2px] rounded-[4px] text-ink-3 whitespace-nowrap"
                                style={{ background: 'var(--surface-2)' }}>
                                {card.card_tier}
                              </span>
                            )}
                            {uc.last_four && (
                              <>
                                {card?.card_tier && <span className="text-[11px] text-[var(--line)]">·</span>}
                                <span className="text-[11px] text-ink-3 font-mono tracking-[.5px]">•••• {uc.last_four}</span>
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

                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)"
                      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                )
              })}
            </div>
            <div style={{ height: 24 }} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-24 gap-3 px-10">
            <div className="flex items-center justify-center text-[26px] mb-1"
              style={{ width: 72, height: 48, borderRadius: 10, background: 'var(--surface-2)' }}>
              💳
            </div>
            <div className="text-[17px] font-semibold text-ink">ยังไม่มีบัตรในกระเป๋า</div>
            <div className="text-[13px] text-ink-3 leading-relaxed">
              เพิ่มบัตรได้ที่ ฉัน → บัตรของฉัน
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
