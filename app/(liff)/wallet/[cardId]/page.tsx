'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { initLiff, getLiffProfile } from '@/lib/liff'
import { signInWithLine } from '@/lib/auth'
import { getMyCards, type UserCard } from '@/lib/cards'
import { chipGradient, bankInitial, THAI_MONTHS } from '@/lib/card-utils'

interface Merchant {
  id: string
  name_th: string | null
  name_eng: string | null
  categories: { icon: string | null } | null
}

interface Transaction {
  id: string
  amount: number
  spent_at: string
  note: string | null
  merchants: Merchant | null
}

interface MonthGroup {
  label: string
  total: number
  txs: Transaction[]
}

function groupByMonth(txs: Transaction[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>()
  for (const tx of txs) {
    const d = new Date(tx.spent_at)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    if (!map.has(key)) {
      map.set(key, {
        label: `${THAI_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        total: 0,
        txs: [],
      })
    }
    const g = map.get(key)!
    g.total += tx.amount
    g.txs.push(tx)
  }
  return Array.from(map.values())
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}.`
}

export default function CardTransactionsPage() {
  const router = useRouter()
  const params = useParams()
  const cardId = params.cardId as string

  const [card, setCard] = useState<UserCard | null>(null)
  const [groups, setGroups] = useState<MonthGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        await initLiff()
        const profile = await getLiffProfile()
        const dbUser = profile
          ? await signInWithLine({ userId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl ?? '' })
          : { id: '9ee6ee16-d45a-4750-8bcb-ef59285bf2e4', display_name: 'Showbae🍀' }

        const cards = await getMyCards(dbUser.id)
        const found = cards.find(c => c.id === cardId) ?? null
        setCard(found)

        if (found) {
          const res = await fetch(`/api/transactions?usersCardId=${encodeURIComponent(cardId)}`)
          if (!res.ok) throw new Error('fetch failed')
          const txs: Transaction[] = await res.json()
          setGroups(groupByMonth(txs))
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาด: ' + String(err))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [cardId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg p-6">
        <div className="bg-warn-bg border border-warn/30 rounded-xl p-4 text-warn text-sm">
          {error ?? 'ไม่พบข้อมูลบัตร'}
        </div>
      </div>
    )
  }

  const cc = card.credit_cards
  const bankId = cc?.bank_id ?? ''
  const bankName = cc?.banks?.name_th ?? cc?.banks?.name_eng ?? bankId

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <div className="flex-shrink-0 px-[22px] pt-10 pb-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[14px] font-medium mb-4"
          style={{ color: 'var(--brand-600)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          บัตรของฉัน
        </button>

        {/* Card hero */}
        <div className="flex items-center gap-4 pb-5" style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <div
            className="flex items-center justify-center font-bold text-white text-[16px] relative overflow-hidden flex-shrink-0"
            style={{
              width: 56, height: 36,
              borderRadius: 8,
              background: chipGradient(bankId),
              boxShadow: '0 3px 10px rgba(0,0,0,.2)',
            }}
          >
            {bankInitial(cc?.banks)}
            <div
              className="absolute"
              style={{
                width: 40, height: 40,
                borderRadius: '50%',
                background: 'rgba(255,255,255,.08)',
                right: -8, top: -10,
              }}
            />
          </div>
          <div>
            <div className="text-[17px] font-bold text-ink tracking-tight">{cc?.card_name ?? bankName}</div>
            {card.last_four && (
              <div className="text-[12px] text-ink-4 mt-0.5 font-mono tracking-wider">•••• {card.last_four}</div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto px-[22px]" style={{ scrollbarWidth: 'none', overscrollBehavior: 'contain' }}>
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="text-[32px]">📭</div>
            <p className="text-[14px] font-semibold text-ink-3">ยังไม่มีรายการ</p>
            <p className="text-[12px] text-ink-4">บันทึกยอดหลังจากรูดบัตรใน Cardly</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label}>
              {/* Month header */}
              <div
                className="flex justify-between items-baseline py-[14px] sticky top-0 z-10"
                style={{ background: 'var(--bg)' }}
              >
                <span className="text-[13px] font-bold text-ink-2">{group.label}</span>
                <span className="text-[13px] font-bold text-ink-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {'฿' + group.total.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Transactions */}
              {group.txs.map((tx, i) => {
                const m = tx.merchants
                const merchantName = m?.name_eng ?? m?.name_th ?? tx.note ?? '—'
                const icon = m?.categories?.icon ?? '💳'
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 py-[11px]"
                    style={{ borderTop: i === 0 ? '1px solid var(--line-soft)' : '1px solid var(--line-soft)' }}
                  >
                    <div
                      className="flex items-center justify-center text-[18px] flex-shrink-0"
                      style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)' }}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-ink truncate">{merchantName}</div>
                      <div className="text-[11px] text-ink-4 mt-0.5">{formatDate(tx.spent_at)}</div>
                    </div>
                    <div
                      className="text-[14px] font-bold text-ink flex-shrink-0"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {'฿' + tx.amount.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                )
              })}
              <div style={{ height: 8 }} />
            </div>
          ))
        )}
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
