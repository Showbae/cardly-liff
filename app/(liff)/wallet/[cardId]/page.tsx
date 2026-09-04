'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { initLiff, getLiffProfile } from '@/lib/liff'
import { signInWithLine } from '@/lib/auth'
import { getMyCards, type UserCard } from '@/lib/cards'
import { getCardProfile, type CardProfile } from '@/lib/card-profile'
import { BenefitsTab } from '@/components/liff/BenefitsTab'
import { TransactionList } from '@/components/liff/TransactionList'
import { chipGradient, bankInitial } from '@/lib/card-utils'

/**
 * หน้าบัตรหนึ่งใบ — hero บัตร + สองแท็บ (การตัดสินใจข้อ 1 ใน docs/admin-portal.md)
 *
 *   สิทธิประโยชน์ → ดีไซน์แบบ ค · ของที่มีวันหมดขึ้นบน สิทธิ์ถาวรพับเป็น accordion
 *   รายการ        → ลิสต์ธุรกรรมของเดิม ย้ายไป components/liff/TransactionList
 *
 * โครงนี้เผื่อแท็บที่สาม (#10 Analytics) ไว้แล้ว ไม่ต้องรื้อตอนเพิ่ม
 */

type TabKey = 'benefits' | 'transactions'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'benefits', label: 'สิทธิประโยชน์' },
  { key: 'transactions', label: 'รายการ' },
]

export default function CardDetailPage() {
  const router = useRouter()
  const params = useParams()
  const cardId = params.cardId as string

  const [card, setCard] = useState<UserCard | null>(null)
  const [profile, setProfile] = useState<CardProfile | null>(null)
  const [tab, setTab] = useState<TabKey>('benefits')
  const [editMode, setEditMode] = useState(false)
  const [hasTx, setHasTx] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const onHasTransactionsChange = useCallback((has: boolean) => {
    setHasTx(has)
    if (!has) setEditMode(false)
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        await initLiff()
        const liffProfile = await getLiffProfile()
        const dbUser = liffProfile
          ? await signInWithLine({ userId: liffProfile.userId, displayName: liffProfile.displayName, pictureUrl: liffProfile.pictureUrl ?? '' })
          : { id: '9ee6ee16-d45a-4750-8bcb-ef59285bf2e4', display_name: 'Showbae🍀' }

        const cards = await getMyCards(dbUser.id)
        const found = cards.find(c => c.id === cardId) ?? null
        setCard(found)

        if (found) {
          // ข้อมูลระดับผลิตภัณฑ์ · ไม่กระทบแท็บรายการถ้าดึงไม่ได้
          try {
            setProfile(await getCardProfile(cardId))
          } catch {
            setProfile({ card: null, promos: [], benefits: [], perks: [] })
          }
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
        <div className="flex items-center gap-4 pb-[17px]">
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

        {/* Tabs — ปุ่ม "แก้ไข" ย้ายมาอยู่แถวนี้ ใช้ได้เฉพาะแท็บรายการ */}
        <div className="flex items-center" style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <div className="flex gap-[26px]">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="text-[14px] font-semibold pb-[11px]"
                style={{
                  color: tab === t.key ? 'var(--ink)' : 'var(--ink-4)',
                  borderBottom: `2px solid ${tab === t.key ? 'var(--brand-500)' : 'transparent'}`,
                  marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'transactions' && hasTx && (
            <button
              onClick={() => setEditMode(m => !m)}
              className="ml-auto text-[14px] font-semibold pb-[11px]"
              style={{ color: editMode ? 'var(--brand-700)' : 'var(--ink-3)' }}
            >
              {editMode ? 'เสร็จ' : 'แก้ไข'}
            </button>
          )}
        </div>
      </div>

      {/* Tab body */}
      <div
        className="flex-1 overflow-y-auto px-[22px] pt-[18px]"
        style={{ scrollbarWidth: 'none', overscrollBehavior: 'contain' }}
      >
        {tab === 'benefits' ? (
          profile ? (
            <BenefitsTab profile={profile} />
          ) : (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )
        ) : (
          <TransactionList
            cardId={cardId}
            editMode={editMode}
            onHasTransactionsChange={onHasTransactionsChange}
          />
        )}
      </div>
    </div>
  )
}
