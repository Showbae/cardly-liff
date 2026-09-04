'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdminPromoRow } from '@/app/api/admin/promotions/route'

/**
 * รายการโปรโมชัน
 *
 * ── ทำไมเรียง "ใกล้หมดอายุ" ขึ้นก่อน ──────────────────────────────────
 *
 * โปรเป็นข้อมูลที่เน่าเองตามเวลา ต่างจากแคตตาล็อกบัตรที่นิ่ง — แถวที่ต้อง
 * ตัดสินใจก่อนแถวอื่นคือแถวที่กำลังจะหมด ไม่ใช่แถวที่เพิ่งเพิ่ม
 */

const TYPE_LABEL: Record<string, string> = {
  cashback: 'เงินคืน', discount: 'ส่วนลด', points: 'คะแนน', installment: 'ผ่อน',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'ร่าง', active: 'เผยแพร่', expired: 'หมดอายุ',
}

/** เหลือกี่วัน — null เมื่อโปรไม่มีวันหมด */
function daysLeft(end: string | null): number | null {
  if (!end) return null
  const ms = new Date(end + 'T23:59:59').getTime() - Date.now()
  return Math.ceil(ms / 86_400_000)
}

export function PromotionsClient({ promos }: { promos: AdminPromoRow[] }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return promos
      .filter(p => !status || p.status === status)
      .filter(p =>
        !needle ||
        p.title.toLowerCase().includes(needle) ||
        (p.bank_id ?? '').toLowerCase().includes(needle) ||
        (p.category_name ?? '').toLowerCase().includes(needle),
      )
  }, [promos, q, status])

  // นับแยกไว้เตือน — โปรที่เผยแพร่อยู่แต่หมดอายุแล้วคือสิ่งที่ user เห็นผิด ๆ บนแอป
  const staleCount = promos.filter(
    p => p.status === 'active' && (daysLeft(p.end_date) ?? 1) < 0,
  ).length

  return (
    <div>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-.3px]">โปรโมชัน</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>
            แคมเปญที่มีวันหมด · อัตราพื้นฐานที่ได้ตลอดอยู่ในหน้าบัตร
          </p>
        </div>
        <Link href="/admin/promotions/new"><Button size="sm">+ โปรใหม่</Button></Link>
      </div>

      {staleCount > 0 && (
        <div
          className="mb-4 px-4 py-2.5 rounded-lg text-[13px] font-medium"
          style={{ background: 'var(--warn-bg)', color: '#a5411a' }}
        >
          มี {staleCount} โปรที่สถานะยังเป็น “เผยแพร่” ทั้งที่เลยวันจบแล้ว — ผู้ใช้ยังเห็นอยู่บนแอป
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Input
          placeholder="ค้นหาหัวข้อ ธนาคาร หรือหมวด"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">ทุกสถานะ</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className="text-[12px] ml-auto" style={{ color: 'var(--ink-4)' }}>
          แสดง {filtered.length} จาก {promos.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ border: '1px dashed var(--line)', color: 'var(--ink-3)' }}>
          <p className="text-[14px] font-medium">
            {promos.length === 0 ? 'ยังไม่มีโปรโมชัน' : 'ไม่พบโปรที่ตรงกับตัวกรอง'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid var(--line)' }}>
          <table className="w-full text-[13px]" style={{ background: 'var(--surface)', minWidth: 860 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['ธนาคาร', 'หัวข้อ', 'ชนิด', 'ค่า', 'เทียบเท่า', 'ขอบเขต', 'หมดอายุ', 'สถานะ', ''].map(h => (
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
              {filtered.map(p => {
                const left = daysLeft(p.end_date)
                const expired = left != null && left < 0
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderTop: '1px solid var(--line-soft)',
                      background: expired && p.status === 'active' ? 'var(--warn-bg)' : undefined,
                    }}
                  >
                    <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{p.bank_id}</td>
                    <td className="px-3 py-2.5">
                      {p.title}
                      {p.requires_registration && (
                        <span className="text-[10px] ml-1.5 font-bold" style={{ color: 'var(--ink-4)' }}>
                          ต้องลงทะเบียน
                        </span>
                      )}
                      {p.category_name && (
                        <span className="text-[11px] ml-1.5" style={{ color: 'var(--ink-4)' }}>
                          {p.category_name}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--ink-3)' }}>
                      {p.promo_type ? TYPE_LABEL[p.promo_type] ?? p.promo_type : '—'}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums whitespace-nowrap" style={{ color: 'var(--ink-3)' }}>
                      {p.benefit_value == null ? '—' : `${p.benefit_value} ${p.benefit_unit ?? ''}`}
                    </td>
                    {/* NULL ที่นี่แปลว่า "หน่วยนี้ยังเทียบไม่ได้" ไม่ใช่ "ยังไม่กรอก" */}
                    <td className="px-3 py-2.5 tabular-nums">
                      {p.effective_rate_pct == null
                        ? <span style={{ color: 'var(--ink-4)' }}>เทียบไม่ได้</span>
                        : <span className="font-semibold" style={{ color: 'var(--brand-700)' }}>{p.effective_rate_pct}%</span>}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--ink-3)' }}>
                      {p.card_scope === 'all_bank' ? 'ทุกใบ' : `${p.card_count} ใบ`}
                      {p.merchant_count > 0 && (
                        <span className="text-[11px] ml-1" style={{ color: 'var(--ink-4)' }}>
                          · {p.merchant_count} ร้าน
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums whitespace-nowrap" style={{ color: expired ? '#a5411a' : 'var(--ink-3)' }}>
                      {p.end_date == null
                        ? <span style={{ color: 'var(--ink-4)' }}>ไม่มีวันหมด</span>
                        : expired ? `เลยมา ${-left!} วัน` : `อีก ${left} วัน`}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--ink-3)' }}>
                      {p.status ? STATUS_LABEL[p.status] ?? p.status : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/admin/promotions/${p.id}`} className="text-[12px] font-semibold" style={{ color: 'var(--brand-700)' }}>
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
