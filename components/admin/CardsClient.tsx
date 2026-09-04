'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface CardRow {
  id: string
  bank_id: string
  card_name: string
  card_tier: string | null
  network: string | null
  annual_fee: number | null
  status: string
  program_name: string | null
  rate_count: number
  perk_count: number
  holder_count: number
  best_rate: number | null
}

const NETWORK_LABEL: Record<string, string> = {
  visa: 'VISA', mastercard: 'Master', jcb: 'JCB', amex: 'AMEX', unionpay: 'UnionPay',
}

export function CardsClient({ cards, banks }: { cards: CardRow[]; banks: string[] }) {
  const [q, setQ] = useState('')
  const [bank, setBank] = useState('')
  const [onlyIncomplete, setOnlyIncomplete] = useState(false)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return cards
      .filter(c => !bank || c.bank_id === bank)
      .filter(c => !onlyIncomplete || c.rate_count === 0)
      .filter(c =>
        !needle ||
        c.card_name.toLowerCase().includes(needle) ||
        c.bank_id.toLowerCase().includes(needle) ||
        (c.card_tier ?? '').toLowerCase().includes(needle),
      )
      // บัตรที่ยังไม่มีอัตราขึ้นก่อน — หน้านี้มีไว้บอกว่าเหลืออะไรต้องกรอก
      .sort((a, b) => {
        if ((a.rate_count === 0) !== (b.rate_count === 0)) return a.rate_count === 0 ? -1 : 1
        return a.bank_id.localeCompare(b.bank_id) || a.card_name.localeCompare(b.card_name)
      })
  }, [cards, q, bank, onlyIncomplete])

  const incomplete = cards.filter(c => c.rate_count === 0).length

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-.3px]">บัตรในแคตตาล็อก</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>
            {cards.length} ใบ
            {incomplete > 0 && (
              <>
                {' · '}
                <span style={{ color: 'var(--warn)' }}>{incomplete} ใบยังไม่มีอัตราตอบแทน</span>
              </>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cards/new">เพิ่มบัตร</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Input
          placeholder="ค้นหาชื่อบัตร ธนาคาร หรือระดับบัตร"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="max-w-[300px]"
        />
        <select
          value={bank}
          onChange={e => setBank(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">ทุกธนาคาร</option>
          {banks.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-[13px] cursor-pointer" style={{ color: 'var(--ink-2)' }}>
          <input
            type="checkbox"
            checked={onlyIncomplete}
            onChange={e => setOnlyIncomplete(e.target.checked)}
          />
          เฉพาะที่ยังไม่ได้กรอก
        </label>
        {(q || bank || onlyIncomplete) && (
          <button
            onClick={() => { setQ(''); setBank(''); setOnlyIncomplete(false) }}
            className="text-[12px] font-semibold"
            style={{ color: 'var(--brand-700)' }}
          >
            ล้างตัวกรอง
          </button>
        )}
        <span className="text-[12px] ml-auto" style={{ color: 'var(--ink-4)' }}>
          แสดง {filtered.length} จาก {cards.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--ink-3)' }}>
          <p className="text-[14px] font-medium">ไม่พบบัตรที่ตรงกับตัวกรอง</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid var(--line)' }}>
          <table className="w-full text-[13px]" style={{ background: 'var(--surface)', minWidth: 780 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['ธนาคาร', 'ชื่อบัตร', 'เครือข่าย', 'โปรแกรม', 'ค่าธรรมเนียม', 'อัตราสูงสุด', 'อัตรา', 'สิทธิพิเศษ', 'ผู้ถือ', ''].map(h => (
                  <th
                    key={h}
                    className="text-left font-semibold px-3 py-2.5 text-[11px] uppercase whitespace-nowrap"
                    style={{ letterSpacing: '.6px', color: 'var(--ink-4)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const incompleteRow = c.rate_count === 0
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderTop: '1px solid var(--line-soft)',
                      background: incompleteRow ? 'var(--warn-bg)' : undefined,
                    }}
                  >
                    <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{c.bank_id}</td>
                    <td className="px-3 py-2.5">
                      {c.card_name}
                      {c.card_tier && (
                        <span className="text-[11px] ml-1.5" style={{ color: 'var(--ink-4)' }}>
                          {c.card_tier}
                        </span>
                      )}
                      {/* บัตรที่เลิกออกแล้วยังต้องอยู่ในตาราง เพราะคนที่ถืออยู่
                          ต้องเห็น benefit — ป้ายนี้กันไม่ให้เผลอกรอกโปรใหม่ให้มัน */}
                      {c.status === 'discontinued' && (
                        <span
                          className="text-[10px] font-bold ml-1.5 align-middle whitespace-nowrap"
                          style={{ padding: '1px 6px', borderRadius: 999, background: 'var(--warn-bg)', color: '#a5411a' }}
                        >
                          เลิกออกแล้ว
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--ink-3)' }}>
                      {c.network ? NETWORK_LABEL[c.network] ?? c.network : '—'}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--ink-3)' }}>
                      {c.program_name ?? <span style={{ color: 'var(--ink-4)' }}>เงินคืน</span>}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ink-3)' }}>
                      {c.annual_fee == null
                        ? '—'
                        : c.annual_fee === 0
                          ? 'ฟรี'
                          : `฿${c.annual_fee.toLocaleString('th-TH')}`}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums font-semibold">
                      {c.best_rate == null
                        ? <span style={{ color: 'var(--warn)' }}>ยังไม่ได้กรอก</span>
                        : `${c.best_rate}%`}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ink-3)' }}>{c.rate_count}</td>
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ink-3)' }}>{c.perk_count}</td>
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ink-3)' }}>{c.holder_count}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/admin/cards/${c.id}`}
                        className="text-[12px] font-semibold whitespace-nowrap"
                        style={{ color: 'var(--brand-700)' }}
                      >
                        แก้ไข
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
