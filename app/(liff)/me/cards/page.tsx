'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Reorder, useDragControls } from 'framer-motion'
import { initLiff, getLiffProfile } from '@/lib/liff'
import { signInWithLine } from '@/lib/auth'
import { getMyCards, reorderCards, type UserCard } from '@/lib/cards'
import { AddCardWizard } from '@/components/liff/AddCardWizard'
import { EditCardSheet } from '@/components/liff/EditCardSheet'
import { DeleteCardSheet } from '@/components/liff/DeleteCardSheet'
import { chipGradient, bankInitial } from '@/lib/card-utils'

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const DragHandleIcon = () => (
  <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
    <circle cx="3" cy="3" r="1.6" /><circle cx="9" cy="3" r="1.6" />
    <circle cx="3" cy="10" r="1.6" /><circle cx="9" cy="10" r="1.6" />
    <circle cx="3" cy="17" r="1.6" /><circle cx="9" cy="17" r="1.6" />
  </svg>
)

export default function MyCardsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [myCards, setMyCards] = useState<UserCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [manageMode, setManageMode] = useState(false)
  const [deletingCard, setDeletingCard] = useState<UserCard | null>(null)
  const [editingCard, setEditingCard] = useState<UserCard | null>(null)

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
          : { id: '9ee6ee16-d45a-4750-8bcb-ef59285bf2e4', display_name: 'Showbae🍀', picture_url: '' }
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

  const handleReorderCommit = useCallback((ordered: UserCard[]) => {
    if (!userId) return
    reorderCards(userId, ordered.map(c => c.id)).catch(() => loadMyCards(userId))
  }, [userId, loadMyCards])

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

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <div
        className="grid items-center px-[22px] pt-10 pb-5 flex-shrink-0"
        style={{ gridTemplateColumns: '1fr auto 1fr', borderBottom: '1px solid var(--line-soft)' }}
      >
        <button
          onClick={() => router.push('/me')}
          className="flex items-center gap-1.5 text-[14px] font-medium py-2"
          style={{ color: 'var(--brand-600)', justifySelf: 'start' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          ฉัน
        </button>
        <span className="text-[15px] font-semibold text-ink">บัตรของฉัน</span>
        {hasCards ? (
          <button
            onClick={() => setManageMode(m => !m)}
            className="text-[14px] py-2"
            style={{ color: 'var(--brand-600)', justifySelf: 'end', fontWeight: manageMode ? 700 : 500 }}
          >
            {manageMode ? 'เสร็จ' : 'จัดการ'}
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-[22px] pt-4" style={{ scrollbarWidth: 'none', overscrollBehavior: 'contain' }}>
        {hasCards ? (
          <>

            <Reorder.Group as="div" axis="y" values={myCards} onReorder={setMyCards} className="flex flex-col">
              {myCards.map((uc, i) => (
                <SortableCardRow
                  key={uc.id}
                  uc={uc}
                  index={i}
                  manageMode={manageMode}
                  onEdit={setEditingCard}
                  onRequestDelete={setDeletingCard}
                  onDragEnd={() => handleReorderCommit(myCards)}
                />
              ))}
            </Reorder.Group>
            <div style={{ height: 24 }} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-24 gap-3 px-10">
            <div className="flex items-center justify-center text-[26px] mb-1"
              style={{ width: 72, height: 48, borderRadius: 10, background: 'var(--surface-2)' }}>
              💳
            </div>
            <div className="text-[17px] font-semibold text-ink">ยังไม่มีบัตรในกระเป๋า</div>
            <div className="text-[13px] text-ink-3 leading-relaxed">เพิ่มบัตรเครดิตเพื่อดูโปรที่คุ้มที่สุด</div>
          </div>
        )}
      </div>

      {/* Add button */}
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

      {showWizard && (
        <AddCardWizard
          userId={userId}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false)
            if (userId) loadMyCards(userId)
          }}
        />
      )}

      {editingCard && (
        <EditCardSheet
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSaved={updated => {
            setMyCards(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
            setEditingCard(null)
          }}
        />
      )}

      {deletingCard && (
        <DeleteCardSheet
          card={deletingCard}
          onClose={() => setDeletingCard(null)}
          onDeleted={id => {
            setMyCards(prev => prev.filter(c => c.id !== id))
            if (myCards.length <= 1) setManageMode(false)
            setDeletingCard(null)
          }}
        />
      )}
    </div>
  )
}

function SortableCardRow({
  uc, index, manageMode, onEdit, onRequestDelete, onDragEnd,
}: {
  uc: UserCard
  index: number
  manageMode: boolean
  onEdit: (uc: UserCard) => void
  onRequestDelete: (uc: UserCard) => void
  onDragEnd: () => void
}) {
  const dragControls = useDragControls()
  const card = uc.credit_cards
  const bankId = card?.bank_id ?? ''
  const bankName = card?.banks?.name_th ?? card?.banks?.name_eng ?? bankId
  const hasMeta = !!(card?.card_tier || uc.last_four || uc.billing_cycle_day || uc.billing_last_day || uc.payment_due_day || uc.payment_due_last_day)

  return (
    <Reorder.Item
      as="div"
      value={uc}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className="flex items-center gap-[13px] py-[14px] bg-bg"
      style={{ borderTop: index === 0 ? 'none' : '1px solid var(--line-soft)' }}
    >
      {manageMode && (
        <div
          onPointerDown={e => dragControls.start(e)}
          onClick={e => e.stopPropagation()}
          className="shrink-0 flex items-center justify-center text-ink-4"
          style={{ width: 20, touchAction: 'none', cursor: 'grab' }}
          aria-label="ลากเพื่อสลับลำดับ"
        >
          <DragHandleIcon />
        </div>
      )}
      <div
        className="flex items-center gap-[13px] flex-1 min-w-0"
        style={{ cursor: manageMode ? 'default' : 'pointer' }}
        onClick={manageMode ? undefined : () => onEdit(uc)}
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
          <div className="text-[14px] font-semibold text-ink tracking-[-0.2px] truncate">{card?.card_name}</div>
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
        {!manageMode && <span className="shrink-0"><ChevronRightIcon /></span>}
      </div>
      {manageMode && (
        <button
          onClick={e => { e.stopPropagation(); onRequestDelete(uc) }}
          className="w-7 h-7 flex items-center justify-center shrink-0"
          style={{ borderRadius: 999, background: 'var(--danger-tint)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}
          aria-label="ลบบัตร"
        >
          <TrashIcon />
        </button>
      )}
    </Reorder.Item>
  )
}
