'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * ร้านค้า · หมวด — สองตารางในหน้าเดียว
 *
 * ── ทำไมไม่แยกหน้า ────────────────────────────────────────────────────
 *
 * หมวดมีอยู่ราว 7–10 แถวและแทบไม่เปลี่ยน · แยกหน้าให้มันจะได้เมนูที่คนกด
 * ปีละครั้ง · และเวลาเพิ่มร้านใหม่ต้องเลือกหมวดอยู่แล้ว การเห็นหมวดทั้งชุด
 * อยู่หน้าเดียวกันทำให้รู้ทันทีว่าต้องเพิ่มหมวดก่อนไหม
 */

export interface CategoryRow {
  id: string; name_th: string | null; name_eng: string | null
  icon: string | null; sort_order: number | null
  merchant_count: number; promo_count: number; rate_count: number
}
export interface MerchantRow {
  id: string; name_th: string | null; name_eng: string | null
  mcc_code: string | null; logo_url: string | null
  category_id: string | null; category_name: string | null
  tx_count: number; promo_count: number
}

const selectCls = 'h-9 w-full rounded-md border border-input bg-transparent px-2 text-[13px]'

export function CatalogClient({
  categories,
  merchants,
}: {
  categories: CategoryRow[]
  merchants: MerchantRow[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'merchants' | 'categories'>('merchants')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  /** ยิง API แล้ว refresh — server component ดึงข้อมูลใหม่เอง ไม่ต้องถือ state ซ้ำ */
  const send = async (url: string, method: string, body?: unknown) => {
    setBusy(true); setError(null)
    try {
      const res = await fetch(url, {
        method,
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'ทำรายการไม่สำเร็จ'); return false }
      router.refresh()
      return true
    } catch {
      setError('เชื่อมต่อไม่ได้')
      return false
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-[-.3px]">ร้านค้า · หมวด</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>
          แกนที่เชื่อมร้าน ↔ โปรโมชัน ↔ อัตราตอบแทน — ระบบแนะนำบัตรทำงานได้เพราะรู้ว่าร้านนี้อยู่หมวดไหน
        </p>
      </div>

      <div className="flex gap-1 mb-5">
        {([
          ['merchants', `ร้านค้า (${merchants.length})`],
          ['categories', `หมวด (${categories.length})`],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="text-[13px] font-medium px-3 py-1.5 rounded-lg"
            style={{
              background: tab === k ? 'var(--surface)' : 'transparent',
              color: tab === k ? 'var(--ink)' : 'var(--ink-3)',
              border: `1px solid ${tab === k ? 'var(--line)' : 'transparent'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="mb-4 px-4 py-2.5 rounded-lg text-[13px] font-medium"
          style={{ background: 'var(--warn-bg)', color: '#a5411a' }}
        >
          {error}
        </div>
      )}

      {tab === 'merchants'
        ? <MerchantsTab merchants={merchants} categories={categories} send={send} busy={busy} />
        : <CategoriesTab categories={categories} send={send} busy={busy} />}
    </div>
  )
}

type Send = (url: string, method: string, body?: unknown) => Promise<boolean>

// ── ร้านค้า ──────────────────────────────────────────────────────────────

function MerchantsTab({
  merchants, categories, send, busy,
}: {
  merchants: MerchantRow[]; categories: CategoryRow[]; send: Send; busy: boolean
}) {
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState({ name_th: '', name_eng: '', mcc_code: '', category_id: '' })
  const [editing, setEditing] = useState<string | null>(null)
  const [edit, setEdit] = useState({ name_th: '', name_eng: '', mcc_code: '', category_id: '' })

  const needle = q.trim().toLowerCase()
  const filtered = merchants.filter(
    m => !needle || (m.name_th ?? '').toLowerCase().includes(needle) ||
      (m.name_eng ?? '').toLowerCase().includes(needle) ||
      (m.mcc_code ?? '').includes(needle),
  )

  const payload = (d: typeof draft) => ({
    name_th: d.name_th.trim(),
    name_eng: d.name_eng.trim() || null,
    mcc_code: d.mcc_code.trim() || null,
    category_id: d.category_id || null,
  })

  const add = async () => {
    if (!draft.name_th.trim()) return
    if (await send('/api/admin/merchants', 'POST', payload(draft))) {
      setDraft({ name_th: '', name_eng: '', mcc_code: '', category_id: '' })
    }
  }

  return (
    <>
      <div
        className="p-4 rounded-xl mb-4 grid gap-3 items-end"
        style={{ border: '1px solid var(--line)', background: 'var(--surface)', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr)) auto' }}
      >
        <div className="grid gap-1">
          <Label className="text-[11px]">ชื่อร้าน (ไทย)</Label>
          <Input placeholder="เซเว่น อีเลฟเว่น" value={draft.name_th} onChange={e => setDraft({ ...draft, name_th: e.target.value })} />
        </div>
        <div className="grid gap-1">
          <Label className="text-[11px]">ชื่อร้าน (อังกฤษ)</Label>
          <Input placeholder="7-Eleven" value={draft.name_eng} onChange={e => setDraft({ ...draft, name_eng: e.target.value })} />
        </div>
        <div className="grid gap-1">
          <Label className="text-[11px]">MCC</Label>
          <Input placeholder="5411" maxLength={4} value={draft.mcc_code} onChange={e => setDraft({ ...draft, mcc_code: e.target.value })} />
        </div>
        <div className="grid gap-1">
          <Label className="text-[11px]">หมวด</Label>
          <select className={selectCls} value={draft.category_id} onChange={e => setDraft({ ...draft, category_id: e.target.value })}>
            <option value="">— ไม่ระบุ —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_th}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={add} disabled={busy || !draft.name_th.trim()}>+ เพิ่มร้าน</Button>
      </div>

      <Input
        placeholder="ค้นหาชื่อร้าน หรือ MCC"
        value={q}
        onChange={e => setQ(e.target.value)}
        className="max-w-xs mb-3"
      />

      <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid var(--line)' }}>
        <table className="w-full text-[13px]" style={{ background: 'var(--surface)', minWidth: 740 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['ชื่อร้าน', 'อังกฤษ', 'MCC', 'หมวด', 'รายการ', 'โปร', ''].map(h => (
                <th key={h} className="text-left font-semibold px-3 py-2.5 text-[11px] uppercase whitespace-nowrap" style={{ letterSpacing: '.6px', color: 'var(--ink-4)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const isEditing = editing === m.id
              return (
                <tr key={m.id} style={{ borderTop: '1px solid var(--line-soft)' }}>
                  {isEditing ? (
                    <>
                      <td className="px-3 py-2"><Input value={edit.name_th} onChange={e => setEdit({ ...edit, name_th: e.target.value })} /></td>
                      <td className="px-3 py-2"><Input value={edit.name_eng} onChange={e => setEdit({ ...edit, name_eng: e.target.value })} /></td>
                      <td className="px-3 py-2"><Input maxLength={4} value={edit.mcc_code} onChange={e => setEdit({ ...edit, mcc_code: e.target.value })} /></td>
                      <td className="px-3 py-2">
                        <select className={selectCls} value={edit.category_id} onChange={e => setEdit({ ...edit, category_id: e.target.value })}>
                          <option value="">— ไม่ระบุ —</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_th}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 tabular-nums" style={{ color: 'var(--ink-4)' }}>{m.tx_count}</td>
                      <td className="px-3 py-2 tabular-nums" style={{ color: 'var(--ink-4)' }}>{m.promo_count}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          onClick={async () => {
                            if (await send(`/api/admin/merchants/${m.id}`, 'PUT', payload(edit))) setEditing(null)
                          }}
                          disabled={busy}
                          className="text-[12px] font-semibold mr-3"
                          style={{ color: 'var(--brand-700)' }}
                        >
                          บันทึก
                        </button>
                        <button onClick={() => setEditing(null)} className="text-[12px]" style={{ color: 'var(--ink-4)' }}>
                          ยกเลิก
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 font-medium">{m.name_th}</td>
                      <td className="px-3 py-2.5" style={{ color: 'var(--ink-3)' }}>{m.name_eng ?? '—'}</td>
                      <td className="px-3 py-2.5 tabular-nums" style={{ color: m.mcc_code ? 'var(--ink-3)' : 'var(--ink-4)' }}>
                        {m.mcc_code ?? '—'}
                      </td>
                      <td className="px-3 py-2.5" style={{ color: m.category_name ? 'var(--ink-3)' : 'var(--warn)' }}>
                        {/* ร้านที่ไม่มีหมวดจะไม่ถูกจับคู่กับอัตราของหมวดไหนเลย */}
                        {m.category_name ?? 'ยังไม่จัดหมวด'}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ink-4)' }}>{m.tx_count}</td>
                      <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ink-4)' }}>{m.promo_count}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditing(m.id)
                            setEdit({
                              name_th: m.name_th ?? '', name_eng: m.name_eng ?? '',
                              mcc_code: m.mcc_code ?? '', category_id: m.category_id ?? '',
                            })
                          }}
                          className="text-[12px] font-semibold mr-3"
                          style={{ color: 'var(--brand-700)' }}
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`ลบร้าน "${m.name_th}"?`)) send(`/api/admin/merchants/${m.id}`, 'DELETE')
                          }}
                          disabled={busy}
                          className="text-[12px] font-semibold"
                          style={{ color: 'var(--warn)' }}
                        >
                          ลบ
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── หมวด ─────────────────────────────────────────────────────────────────

function CategoriesTab({
  categories, send, busy,
}: {
  categories: CategoryRow[]; send: Send; busy: boolean
}) {
  const [draft, setDraft] = useState({ name_th: '', name_eng: '', icon: '', sort_order: '' })

  const payload = (d: typeof draft) => ({
    name_th: d.name_th.trim(),
    name_eng: d.name_eng.trim() || null,
    icon: d.icon.trim() || null,
    sort_order: d.sort_order.trim() === '' ? null : Number(d.sort_order),
  })

  const add = async () => {
    if (!draft.name_th.trim()) return
    if (await send('/api/admin/categories', 'POST', payload(draft))) {
      setDraft({ name_th: '', name_eng: '', icon: '', sort_order: '' })
    }
  }

  return (
    <>
      <div
        className="p-4 rounded-xl mb-4 grid gap-3 items-end"
        style={{ border: '1px solid var(--line)', background: 'var(--surface)', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr)) auto' }}
      >
        <div className="grid gap-1">
          <Label className="text-[11px]">ชื่อหมวด (ไทย)</Label>
          <Input placeholder="ร้านอาหาร" value={draft.name_th} onChange={e => setDraft({ ...draft, name_th: e.target.value })} />
        </div>
        <div className="grid gap-1">
          <Label className="text-[11px]">ชื่อหมวด (อังกฤษ)</Label>
          <Input placeholder="Dining" value={draft.name_eng} onChange={e => setDraft({ ...draft, name_eng: e.target.value })} />
        </div>
        <div className="grid gap-1">
          <Label className="text-[11px]">ไอคอน (emoji)</Label>
          <Input placeholder="🍜" maxLength={8} value={draft.icon} onChange={e => setDraft({ ...draft, icon: e.target.value })} />
        </div>
        <div className="grid gap-1">
          <Label className="text-[11px]">ลำดับ</Label>
          <Input type="number" min="0" value={draft.sort_order} onChange={e => setDraft({ ...draft, sort_order: e.target.value })} />
        </div>
        <Button size="sm" onClick={add} disabled={busy || !draft.name_th.trim()}>+ เพิ่มหมวด</Button>
      </div>

      <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid var(--line)' }}>
        <table className="w-full text-[13px]" style={{ background: 'var(--surface)', minWidth: 640 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['', 'ชื่อหมวด', 'อังกฤษ', 'ลำดับ', 'ร้าน', 'โปร', 'อัตรา', ''].map(h => (
                <th key={h} className="text-left font-semibold px-3 py-2.5 text-[11px] uppercase whitespace-nowrap" style={{ letterSpacing: '.6px', color: 'var(--ink-4)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid var(--line-soft)' }}>
                <td className="px-3 py-2.5 text-[16px]">{c.icon ?? '·'}</td>
                <td className="px-3 py-2.5 font-medium">{c.name_th}</td>
                <td className="px-3 py-2.5" style={{ color: 'var(--ink-3)' }}>{c.name_eng ?? '—'}</td>
                <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ink-4)' }}>{c.sort_order ?? '—'}</td>
                <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ink-4)' }}>{c.merchant_count}</td>
                <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ink-4)' }}>{c.promo_count}</td>
                <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ink-4)' }}>{c.rate_count}</td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => {
                      if (confirm(`ลบหมวด "${c.name_th}"?`)) send(`/api/admin/categories/${c.id}`, 'DELETE')
                    }}
                    disabled={busy}
                    className="text-[12px] font-semibold"
                    style={{ color: 'var(--warn)' }}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
