'use client'

import { useEffect, useMemo, useState } from 'react'
import { getTransactions, type Transaction } from '@/lib/transactions'
import { EditTransactionSheet } from '@/components/liff/EditTransactionSheet'
import { DeleteTransactionSheet } from '@/components/liff/DeleteTransactionSheet'
import { THAI_MONTHS } from '@/lib/card-utils'

/**
 * แท็บ "รายการ" ของ /wallet/[cardId] — ยกมาจากหน้าเดิมทั้งดุ้น
 *
 * ตัว component ถือ state ของรายการเองทั้งหมด (โหลด · เลื่อนหน้า · เลือกแถว ·
 * sheet แก้/ลบ) ยกเว้น `editMode` ที่หน้าแม่ถือ เพราะปุ่มสลับโหมดอยู่บนแถบแท็บ
 * ซึ่งอยู่นอก component นี้
 */

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

interface Props {
  /** users_card.id */
  cardId: string
  editMode: boolean
  /** บอกหน้าแม่ว่าควรโชว์ปุ่ม "แก้ไข" ไหม — ลบรายการสุดท้ายแล้วต้องพาออกจากโหมด */
  onHasTransactionsChange?: (has: boolean) => void
}

export function TransactionList({ cardId, editMode, onHasTransactionsChange }: Props) {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null)

  const groups = useMemo(() => groupByMonth(txs), [txs])
  const selectedTx = useMemo(() => txs.find(t => t.id === selectedId) ?? null, [txs, selectedId])

  // ออกจากโหมดแก้ไขแล้วต้องล้างแถวที่เลือกค้างไว้ ไม่งั้นกดกลับเข้ามาจะเจอ
  // แถบปุ่มโผล่ทันทีทั้งที่ยังไม่ได้แตะอะไร
  useEffect(() => {
    if (!editMode) setSelectedId(null)
  }, [editMode])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const page = await getTransactions(cardId)
        if (cancelled) return
        setTxs(page.transactions)
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
        onHasTransactionsChange?.(page.transactions.length > 0)
      } catch {
        // ปล่อยให้ลิสต์ว่าง — หน้าแม่แสดง error ระดับบัตรอยู่แล้ว
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // onHasTransactionsChange ตั้งใจไม่ใส่ใน deps — หน้าแม่ส่ง inline function
    // มาทุกรอบ render ใส่แล้วจะโหลดรายการใหม่ไม่รู้จบ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId])

  const loadMore = async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const page = await getTransactions(cardId, cursor)
      setTxs(prev => [...prev, ...page.transactions])
      setCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch {
      // เก็บลิสต์เดิมไว้ · ปุ่มยังอยู่ให้กดลองใหม่
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
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
            {group.txs.map(tx => {
              const m = tx.merchants
              const merchantName = m?.name_eng ?? m?.name_th ?? tx.note ?? '—'
              const icon = m?.categories?.icon ?? '💳'
              const selected = editMode && selectedId === tx.id
              return (
                <div
                  key={tx.id}
                  onClick={() => {
                    if (editMode) setSelectedId(prev => (prev === tx.id ? null : tx.id))
                  }}
                  className="flex items-center gap-3 py-[11px]"
                  style={{
                    borderTop: '1px solid var(--line-soft)',
                    cursor: editMode ? 'pointer' : 'default',
                    background: selected ? 'var(--brand-50)' : undefined,
                  }}
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

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full flex items-center justify-center gap-2 text-[13px] font-bold mt-2 disabled:opacity-60"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 11,
            padding: 12,
            color: 'var(--brand-700)',
            cursor: loadingMore ? 'default' : 'pointer',
          }}
        >
          {loadingMore ? (
            <span
              className="w-4 h-4 rounded-full animate-spin"
              style={{ border: '2px solid var(--line)', borderTopColor: 'var(--brand-500)' }}
            />
          ) : (
            <>ดูรายการเก่ากว่านี้ ↓</>
          )}
        </button>
      )}

      <div style={{ height: 24 }} />

      {/* Selection action bar — renders over the bottom tab bar (z-55 > z-50) */}
      {editMode && selectedTx && (
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 55,
            background: 'var(--surface)', borderTop: '1px solid var(--line)',
            padding: '10px 22px calc(10px + env(safe-area-inset-bottom, 8px))',
            display: 'flex', gap: 10,
            boxShadow: '0 -2px 16px rgba(0,0,0,.06)',
          }}
        >
          <button
            onClick={() => setEditingTx(selectedTx)}
            className="flex-1 flex items-center justify-center gap-2 text-[14px] font-bold"
            style={{ background: 'var(--ink)', color: 'var(--bg)', border: 'none', borderRadius: 999, padding: 13, cursor: 'pointer' }}
          >
            ✎ แก้ไข
          </button>
          <button
            onClick={() => setDeletingTx(selectedTx)}
            className="flex items-center justify-center gap-2 text-[14px] font-bold"
            style={{ background: 'var(--warn-bg)', color: 'var(--warn)', border: 'none', borderRadius: 999, padding: '13px 22px', cursor: 'pointer' }}
          >
            🗑 ลบ
          </button>
        </div>
      )}

      {editingTx && (
        <EditTransactionSheet
          tx={editingTx}
          onClose={() => setEditingTx(null)}
          onSaved={updated => {
            setTxs(prev => prev.map(t => (t.id === updated.id ? updated : t)))
            setEditingTx(null)
          }}
        />
      )}

      {deletingTx && (
        <DeleteTransactionSheet
          tx={deletingTx}
          onClose={() => setDeletingTx(null)}
          onDeleted={id => {
            setTxs(prev => {
              const next = prev.filter(t => t.id !== id)
              // ลบแถวสุดท้ายแล้วต้องพาหน้าแม่ออกจากโหมดแก้ไข ไม่งั้นปุ่ม "เสร็จ"
              // จะค้างอยู่บนหน้าจอที่ไม่มีอะไรให้แก้
              onHasTransactionsChange?.(next.length > 0)
              return next
            })
            setSelectedId(null)
            setDeletingTx(null)
          }}
        />
      )}
    </>
  )
}
