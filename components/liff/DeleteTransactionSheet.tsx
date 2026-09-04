'use client'

import { useEffect, useRef, useState } from 'react'
import { deleteTransaction, type Transaction } from '@/lib/transactions'

interface Props {
  tx: Transaction
  onClose: () => void
  onDeleted: (id: string) => void
}

export function DeleteTransactionSheet({ tx, onClose, onDeleted }: Props) {
  const m = tx.merchants
  const merchantName = m?.name_eng ?? m?.name_th ?? tx.note ?? '—'

  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      await deleteTransaction(tx.id)
      onDeleted(tx.id)
    } catch {
      setError('ลบไม่สำเร็จ กรุณาลองใหม่')
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Overlay — above the tab bar / action bar, locks the page behind */}
      <div
        onClick={deleting ? undefined : onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,.4)',
          backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
          touchAction: 'none',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61,
        background: 'var(--surface)',
        borderRadius: '24px 24px 0 0',
        padding: '12px 0 34px',
        boxShadow: '0 -2px 40px rgba(0,0,0,.15)',
        maxHeight: '90vh', overflowY: 'auto',
        transform: `translateY(${dragY}px)`,
        transition: dragging ? 'none' : 'transform .25s ease',
      }}>
        {/* Grabber */}
        <div
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          style={{ padding: '4px 0 10px', margin: '-4px 0 0', cursor: 'grab', touchAction: 'none' }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line)', margin: '0 auto' }} />
        </div>

        <div style={{ padding: '10px 22px 0', textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 999, background: 'var(--warn-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '6px auto 14px', color: 'var(--warn)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.3px' }}>ลบรายการนี้?</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 7, lineHeight: 1.5 }}>
            <b style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{merchantName} · ฿{Number(tx.amount).toLocaleString('th-TH')}</b><br />
            รายการจะถูกลบถาวร กู้คืนไม่ได้
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--warn-bg)', color: 'var(--warn)', fontSize: 13, marginTop: 14 }}>
              {error}
            </div>
          )}

          <button onClick={handleDelete} disabled={deleting} style={{
            width: '100%', padding: 14, marginTop: 20, borderRadius: 999,
            background: 'var(--warn)', color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
            cursor: deleting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {deleting && <span style={{ width: 14, height: 14, borderRadius: 999, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 1s linear infinite' }} />}
            {deleting ? 'กำลังลบ...' : 'ลบรายการ'}
          </button>
          <button onClick={onClose} disabled={deleting} style={{
            width: '100%', padding: 10, marginTop: 8, borderRadius: 999,
            background: 'transparent', border: 'none', fontSize: 13, fontWeight: 600,
            color: 'var(--ink-3)', fontFamily: 'inherit', cursor: 'pointer',
          }}>
            ยกเลิก
          </button>
        </div>
      </div>
    </>
  )
}
