'use client'

import { useEffect, useRef, useState } from 'react'
import { removeCard, type UserCard } from '@/lib/cards'
import { getTransactions } from '@/lib/transactions'
import { chipGradient } from '@/lib/card-utils'

interface Props {
  card: UserCard
  onClose: () => void
  onDeleted: (id: string) => void
}

export function DeleteCardSheet({ card, onClose, onDeleted }: Props) {
  const cc = card.credit_cards
  const bankId = cc?.bank_id ?? ''
  const cardName = cc?.card_name ?? cc?.banks?.name_th ?? 'บัตรของฉัน'

  const [txCount, setTxCount] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Count the transactions that will be cascade-deleted with this card.
  useEffect(() => {
    let alive = true
    getTransactions(card.id)
      .then(page => { if (alive) setTxCount(page.total) })
      .catch(() => { if (alive) setTxCount(0) })
    return () => { alive = false }
  }, [card.id])

  // Lock the page behind so only the sheet scrolls until it is dismissed.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Drag the grabber down to dismiss.
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragStartY = useRef<number | null>(null)
  const onDragStart = (e: React.TouchEvent) => { dragStartY.current = e.touches[0].clientY; setDragging(true) }
  const onDragMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return
    setDragY(Math.max(0, e.touches[0].clientY - dragStartY.current))
  }
  const onDragEnd = () => {
    setDragging(false)
    dragStartY.current = null
    if (dragY > 90) onClose()
    else setDragY(0)
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await removeCard(card.id)
      onDeleted(card.id)
    } catch {
      setError('ลบไม่สำเร็จ กรุณาลองใหม่')
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Overlay — above the tab bar, locks the page behind */}
      <div
        onClick={deleting ? undefined : onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(10,6,4,.55)',
          backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
          touchAction: 'none',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61,
        background: 'var(--surface)',
        borderRadius: '26px 26px 0 0',
        padding: '0 20px 34px',
        boxShadow: '0 -10px 44px rgba(0,0,0,.24)',
        maxHeight: '90vh', overflowY: 'auto',
        transform: `translateY(${dragY}px)`,
        transition: dragging ? 'none' : 'transform .25s ease',
      }}>
        {/* Grabber */}
        <div
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          style={{ padding: '12px 0 6px', cursor: 'grab', touchAction: 'none' }}
        >
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--line)', margin: '0 auto' }} />
        </div>

        {/* Hero — the card being removed */}
        <div style={{ position: 'relative', width: 132, height: 84, margin: '12px auto 0' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 13, padding: '11px 12px',
            background: chipGradient(bankId),
            boxShadow: '0 12px 24px rgba(6,28,18,.28), inset 0 1px 0 rgba(255,255,255,.22)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            transform: 'rotate(-3deg)', animation: 'cardFloat 4s ease-in-out infinite', overflow: 'hidden',
          }}>
            <div style={{ width: 20, height: 15, borderRadius: 3, background: 'linear-gradient(135deg, #ffe9a8, #c99b3a)', boxShadow: 'inset 0 0 0 .5px rgba(0,0,0,.15)' }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '-.1px', textShadow: '0 1px 2px rgba(0,0,0,.2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cardName}</div>
              {card.last_four && (
                <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,.82)', fontFamily: 'monospace', letterSpacing: 1.5, marginTop: 1 }}>•••• {card.last_four}</div>
              )}
            </div>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 13, background: 'rgba(120,20,10,.32)' }} />
          </div>
          <div style={{
            position: 'absolute', right: -6, bottom: -6, zIndex: 3,
            width: 30, height: 30, borderRadius: 999, background: 'var(--danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            boxShadow: '0 4px 12px rgba(192,57,43,.5), 0 0 0 3px var(--surface)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
          </div>
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.4px', textAlign: 'center', marginTop: 20, color: 'var(--ink)' }}>
          ลบบัตรใบนี้?
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', textAlign: 'center', marginTop: 5, lineHeight: 1.45 }}>
          สิ่งที่ผูกกับบัตรนี้จะถูกลบตามไปด้วย
        </div>

        {/* What gets deleted */}
        <div style={{ marginTop: 17, borderRadius: 14, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={delItem}>
            <div style={delIco}>🧾</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>รายการใช้จ่าย</div>
            <div style={delCnt}>{txCount === null ? 'กำลังนับ…' : `${txCount} รายการ`}</div>
          </div>
          <div style={{ ...delItem, borderTop: '1px solid var(--line-soft)' }}>
            <div style={delIco}>⚙️</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>การตั้งค่าบัตร</div>
            <div style={delCnt}>วงเงิน · รอบบิล</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 13, fontSize: 11, fontWeight: 600, color: 'var(--danger)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          ลบถาวร กู้คืนไม่ได้
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, marginTop: 14, background: 'var(--warn-bg)', color: 'var(--warn)', fontSize: 13, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18 }}>
          <button onClick={handleDelete} disabled={deleting} style={{
            background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 999,
            fontSize: 14.5, fontWeight: 700, padding: 14, fontFamily: 'inherit', letterSpacing: '-.2px',
            cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1,
            boxShadow: '0 6px 16px var(--danger-tint), inset 0 1px 0 rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {deleting && <span style={{ width: 14, height: 14, borderRadius: 999, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 1s linear infinite' }} />}
            {deleting ? 'กำลังลบ…' : 'ลบบัตร'}
          </button>
          <button onClick={onClose} disabled={deleting} style={{
            background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13.5, fontWeight: 600,
            padding: 9, fontFamily: 'inherit', cursor: deleting ? 'not-allowed' : 'pointer',
          }}>
            ยกเลิก
          </button>
        </div>
      </div>
    </>
  )
}

const delItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px' }
const delIco: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, background: 'var(--surface)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0,
  boxShadow: 'inset 0 0 0 1px var(--line-soft)',
}
const delCnt: React.CSSProperties = { marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }
