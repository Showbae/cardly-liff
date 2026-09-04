'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VALUATION_BASES } from '@/lib/validations/card'

/** อัตราหนึ่งแถวของบัตร · `scales` = ขยับตามค่าแต้มไหม (คะแนน/ไมล์ ใช่ · เงินคืน ไม่) */
export interface ProgramCardRate {
  pct: number
  scales: boolean
}

export interface ProgramCard {
  id: string
  name: string
  rates: ProgramCardRate[]
}

export interface ProgramRow {
  id: string
  bank_id: string
  name: string
  point_value_thb: number
  valuation_basis: string
  valuation_source_url: string | null
  valuation_checked_at: string
  point_expiry_months: number | null
  min_redemption: number | null
  /** บัตรในแคตตาล็อกที่ผูกกับโปรแกรมนี้ — คือใบที่จะถูก recompute เมื่อแก้ค่าแต้ม */
  cards: ProgramCard[]
}

interface Bank {
  id: string
  name_th: string | null
}

const BASIS_LABEL: Record<string, string> = {
  cashback: 'แลกเงินคืน',
  miles: 'แลกไมล์',
  voucher: 'แลกของรางวัล',
}

/**
 * ตัวอย่างคร่าว ๆ ตอน**กรอกฟอร์ม** ว่าค่าแต้มที่พิมพ์แปลว่าอัตราประมาณเท่าไหร่
 *
 * ⚠️ เลข 25 เป็นสมมติฐาน ไม่ใช่ข้อมูลจริง — ใช้ได้เฉพาะที่ที่**เขียนกำกับไว้ว่าสมมติ**
 * ห้ามเอาไปโชว์ลอย ๆ ในตาราง เพราะจะอ่านเหมือนเป็นคุณสมบัติของโปรแกรมนั้นจริง ๆ
 * (ตารางใช้ `formatRateRange` ที่คิดจากอัตราจริงของบัตรแทน)
 */
function samplePct(pointValue: number) {
  return ((1 * pointValue) / 25) * 100
}

/**
 * ช่วงอัตราของอัตราชุดหนึ่ง · `factor` = คูณเฉพาะแถวที่ขยับตามค่าแต้ม
 *
 * ใช้ทั้งตอนแสดงค่าปัจจุบัน (factor = 1) และตอนพรีวิวว่าถ้าเปลี่ยนค่าแต้ม
 * อัตราจะกลายเป็นเท่าไหร่ — สูตรเดียวกัน ต่างแค่ตัวคูณ
 *
 * `null` = ไม่มีอัตราให้คิด ซึ่งต้องแยกให้ออกจาก 0%
 */
function rateRange(rates: ProgramCardRate[], factor = 1) {
  if (rates.length === 0) return null
  const scaled = rates.map(r => (r.scales ? r.pct * factor : r.pct))
  return { min: Math.min(...scaled), max: Math.max(...scaled) }
}

/** '0.40 – 0.80%' · ค่าเดียวถ้าไม่มีช่วง */
function formatRateRange(range: { min: number; max: number } | null): string | null {
  if (!range) return null
  const fmt = (n: number) => n.toFixed(2)
  return range.min === range.max ? `${fmt(range.min)}%` : `${fmt(range.min)} – ${fmt(range.max)}%`
}

/** อัตราทุกแถวของทุกบัตรในโปรแกรม รวมเป็นชุดเดียว */
function allRates(p: ProgramRow): ProgramCardRate[] {
  return p.cards.flatMap(c => c.rates)
}

/**
 * บอกว่าการแก้ค่าแต้มครั้งนี้กระทบบัตรใบไหน และอัตราจะกลายเป็นเท่าไหร่
 *
 * มีอยู่เพราะเลข "บัตร 1" ในตารางบอกแค่**จำนวน** ไม่บอกว่า**ใบไหน** —
 * คนที่กำลังจะกดบันทึกจึงไม่รู้ว่ากำลังเปลี่ยนอะไร จนกว่า `lib/recompute.ts`
 * จะทำงานไปแล้ว ซึ่งสายเกินจะทบทวน
 *
 * ตัวเลขที่โชว์เป็น **พรีวิว** คำนวณแบบคูณตัวประกอบ (อัตราแปรผันตรงกับค่าแต้ม)
 * ค่าจริงที่จะถูกเขียนลง DB มาจาก `lib/rewards.ts` ตอน recompute เสมอ
 */
function ImpactPreview({
  program,
  nextPointValue,
}: {
  program: ProgramRow
  nextPointValue: number
}) {
  const current = program.point_value_thb
  const changed =
    Number.isFinite(nextPointValue) && nextPointValue > 0 && nextPointValue !== current
  const factor = changed ? nextPointValue / current : 1

  return (
    <div
      className="mt-4 p-3.5 rounded-lg"
      style={{ background: 'var(--surface-2)' }}
    >
      <div className="text-[11px] font-bold uppercase mb-2.5" style={{ letterSpacing: '.8px', color: 'var(--ink-4)' }}>
        บัตรที่ใช้โปรแกรมนี้ ({program.cards.length})
      </div>

      {program.cards.length === 0 ? (
        <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
          ยังไม่มีบัตรใบไหนผูกกับโปรแกรมนี้ — แก้ค่าแต้มตอนนี้จึงยังไม่กระทบอัตราของใคร
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {program.cards.map(c => {
            const now = rateRange(c.rates)
            const nowText = formatRateRange(now)
            const nextText = changed ? formatRateRange(rateRange(c.rates, factor)) : null
            // เปลี่ยนค่าแต้มนิดเดียวจนปัดทศนิยมแล้วเท่าเดิม — ไม่ต้องโชว์ลูกศร
            // ชี้ไปหาเลขตัวเดิม เพราะอ่านแล้วสับสนว่าตกลงเปลี่ยนหรือไม่เปลี่ยน
            const next = nextText !== nowText ? nextText : null
            return (
              <div key={c.id} className="flex items-baseline gap-2 text-[12.5px]">
                <span className="font-semibold">{c.name}</span>
                <span className="ml-auto tabular-nums" style={{ color: 'var(--ink-3)' }}>
                  {nowText ?? 'ยังไม่มีอัตรา'}
                </span>
                {next && (
                  <>
                    <span style={{ color: 'var(--ink-4)' }}>→</span>
                    <span
                      className="tabular-nums font-bold"
                      style={{ color: factor > 1 ? 'var(--brand-700)' : '#a5411a' }}
                    >
                      {next}
                    </span>
                  </>
                )}
              </div>
            )
          })}

          {changed && (
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--ink-4)' }}>
              กดบันทึกแล้วอัตราทุกแถวของบัตรข้างบนจะถูกคำนวณใหม่ทันที
              {/* แถวเงินคืนของบัตรใบเดียวกันจะไม่ขยับ เพราะไม่ได้คิดจากค่าแต้ม */}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const emptyForm = {
  bank_id: '',
  name: '',
  point_value_thb: '',
  valuation_basis: 'cashback',
  valuation_source_url: '',
  valuation_checked_at: new Date().toISOString().slice(0, 10),
  point_expiry_months: '',
  min_redemption: '',
}
type FormState = typeof emptyForm

function toPayload(f: FormState) {
  return {
    bank_id: f.bank_id,
    name: f.name.trim(),
    point_value_thb: Number(f.point_value_thb),
    valuation_basis: f.valuation_basis,
    valuation_source_url: f.valuation_source_url.trim() || null,
    valuation_checked_at: f.valuation_checked_at,
    point_expiry_months: f.point_expiry_months === '' ? null : Number(f.point_expiry_months),
    min_redemption: f.min_redemption === '' ? null : Number(f.min_redemption),
  }
}

export function ProgramsClient({
  programs,
  banks,
}: {
  programs: ProgramRow[]
  banks: Bank[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)   // id หรือ 'new'
  // โปรแกรมที่กำลังแก้อยู่ · null ตอนสร้างใหม่ (ยังไม่มีบัตรผูก จึงไม่มีอะไรให้พรีวิว)
  const editingProgram = programs.find(p => p.id === editing) ?? null
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const startNew = () => {
    setForm({ ...emptyForm, bank_id: banks[0]?.id ?? '' })
    setEditing('new')
    setError(null); setNote(null)
  }

  const startEdit = (p: ProgramRow) => {
    setForm({
      bank_id: p.bank_id,
      name: p.name,
      point_value_thb: String(p.point_value_thb),
      valuation_basis: p.valuation_basis,
      valuation_source_url: p.valuation_source_url ?? '',
      valuation_checked_at: p.valuation_checked_at,
      point_expiry_months: p.point_expiry_months == null ? '' : String(p.point_expiry_months),
      min_redemption: p.min_redemption == null ? '' : String(p.min_redemption),
    })
    setEditing(p.id)
    setError(null); setNote(null)
  }

  const cancel = () => { setEditing(null); setError(null) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null); setNote(null)
    try {
      const isNew = editing === 'new'
      const res = await fetch(
        isNew ? '/api/admin/programs' : `/api/admin/programs/${editing}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toPayload(form)),
        },
      )
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(
          typeof body.error === 'string'
            ? body.error
            : Array.isArray(body.error)
              ? body.error.map((i: { message: string }) => i.message).join(' · ')
              : 'บันทึกไม่สำเร็จ',
        )
        return
      }

      // แจ้งจำนวนแถวที่ถูกคำนวณใหม่ ไม่งั้นคนแก้จะไม่รู้ว่ากระทบอะไรบ้าง
      if (typeof body.recomputed === 'number' && body.recomputed > 0) {
        setNote(`คำนวณอัตราใหม่ให้ ${body.recomputed} แถวที่ใช้โปรแกรมนี้แล้ว`)
      }
      setEditing(null)
      router.refresh()
    } catch {
      setError('เชื่อมต่อไม่ได้')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (p: ProgramRow) => {
    if (!confirm(`ลบ "${p.name}" ของ ${p.bank_id}?`)) return
    setBusy(true); setError(null); setNote(null)
    try {
      const res = await fetch(`/api/admin/programs/${p.id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error ?? 'ลบไม่สำเร็จ'); return }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-.3px]">โปรแกรมสะสมแต้ม</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>
            ค่าแต้มที่ตั้งไว้ที่นี่ถูกใช้คำนวณอัตราของบัตรทุกใบในโปรแกรม — แก้แล้วระบบคำนวณใหม่ให้อัตโนมัติ
          </p>
        </div>
        {editing === null && <Button onClick={startNew}>เพิ่มโปรแกรม</Button>}
      </div>

      {note && (
        <div
          className="text-[13px] mb-4 px-3 py-2.5 rounded-md"
          style={{ background: 'var(--good-bg)', color: 'var(--brand-700)' }}
        >
          {note}
        </div>
      )}

      {editing !== null && (
        <form
          onSubmit={save}
          className="mb-6 p-5 rounded-xl"
          style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}
        >
          <h2 className="text-[15px] font-semibold mb-4">
            {editing === 'new' ? 'โปรแกรมใหม่' : 'แก้ไขโปรแกรม'}
          </h2>

          {/* items-start — ดูเหตุผลใน NewCardClient.tsx (ช่องที่มีคำอธิบายใต้ input ทำให้แนวเพี้ยน) */}
          <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
            <div className="grid gap-1.5">
              <Label htmlFor="bank">ธนาคาร</Label>
              <select
                id="bank"
                required
                value={form.bank_id}
                onChange={e => set('bank_id', e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="" disabled>เลือกธนาคาร</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.id} — {b.name_th}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="name">ชื่อโปรแกรม</Label>
              <Input
                id="name" required placeholder="K Point"
                value={form.name} onChange={e => set('name', e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="pv">1 คะแนน = กี่บาท</Label>
              <Input
                id="pv" required type="number" step="0.0001" min="0.0001" placeholder="0.10"
                value={form.point_value_thb} onChange={e => set('point_value_thb', e.target.value)}
              />
              {Number(form.point_value_thb) > 0 && (
                <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                  = {samplePct(Number(form.point_value_thb)).toFixed(2)}% ถ้าได้ 1 คะแนนต่อ 25 บาท
                </span>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="basis">ตีค่าจากช่องทาง</Label>
              <select
                id="basis" required
                value={form.valuation_basis}
                onChange={e => set('valuation_basis', e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {VALUATION_BASES.map(b => (
                  <option key={b} value={b}>{BASIS_LABEL[b]}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="checked">เช็กค่าแต้มล่าสุด</Label>
              <Input
                id="checked" required type="date"
                value={form.valuation_checked_at}
                onChange={e => set('valuation_checked_at', e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="src">ลิงก์อ้างอิง</Label>
              <Input
                id="src" type="url" placeholder="https://…"
                value={form.valuation_source_url}
                onChange={e => set('valuation_source_url', e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="exp">คะแนนหมดอายุ (เดือน)</Label>
              <Input
                id="exp" type="number" min="1" placeholder="เว้นว่าง = ไม่หมดอายุ"
                value={form.point_expiry_months}
                onChange={e => set('point_expiry_months', e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="minr">แลกขั้นต่ำ (คะแนน)</Label>
              <Input
                id="minr" type="number" min="1" placeholder="เว้นว่าง = ไม่มีขั้นต่ำ"
                value={form.min_redemption}
                onChange={e => set('min_redemption', e.target.value)}
              />
            </div>
          </div>

          {editingProgram && (
            <ImpactPreview
              program={editingProgram}
              nextPointValue={Number(form.point_value_thb)}
            />
          )}

          {error && (
            <div
              className="text-[13px] mt-4 px-3 py-2.5 rounded-md"
              style={{ background: 'var(--warn-bg)', color: '#a5411a' }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-5">
            <Button type="submit" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</Button>
            <Button type="button" variant="ghost" onClick={cancel} disabled={busy}>ยกเลิก</Button>
          </div>
        </form>
      )}

      {error && editing === null && (
        <div
          className="text-[13px] mb-4 px-3 py-2.5 rounded-md"
          style={{ background: 'var(--warn-bg)', color: '#a5411a' }}
        >
          {error}
        </div>
      )}

      {programs.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--ink-3)' }}>
          <p className="text-[14px] font-medium">ยังไม่มีโปรแกรมสะสม</p>
          <p className="text-[12px] mt-1">บัตรเงินคืนไม่ต้องมีโปรแกรม — เพิ่มเฉพาะบัตรที่ให้คะแนนหรือไมล์</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--line)' }}>
          <table className="w-full text-[13px]" style={{ background: 'var(--surface)' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {/* "1 คะแนน = ฿" ไม่ใช่ "1 คะแนน" — ต้องบอกทิศทางในหัวตาราง
                    ไม่งั้นอ่านไม่ออกว่าเลขในช่องคือ "แลกได้กี่บาท" หรือ "จ่ายกี่บาทถึงได้"
                    ซึ่งเป็นคนละตัวเลขกันคนละตาราง (ดู card_base_benefit.spend_per_unit) */}
                {['ธนาคาร', 'โปรแกรม', '1 คะแนน = ฿', 'อัตราจริงของบัตร', 'ตีค่าจาก', 'เช็กล่าสุด', 'หมดอายุ', 'บัตร', ''].map(h => (
                  <th
                    key={h}
                    className="text-left font-semibold px-3 py-2.5 text-[11px] uppercase"
                    style={{ letterSpacing: '.6px', color: 'var(--ink-4)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {programs.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--line-soft)' }}>
                  <td className="px-3 py-2.5 font-semibold">{p.bank_id}</td>
                  <td className="px-3 py-2.5">{p.name}</td>
                  <td className="px-3 py-2.5 tabular-nums">฿{p.point_value_thb}</td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {formatRateRange(rateRange(allRates(p))) ?? (
                      <span style={{ color: 'var(--ink-4)' }}>
                        {p.cards.length === 0 ? 'ยังไม่มีบัตร' : 'ยังไม่มีอัตรา'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--ink-3)' }}>
                    {BASIS_LABEL[p.valuation_basis] ?? p.valuation_basis}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ink-3)' }}>
                    {p.valuation_checked_at}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--ink-3)' }}>
                    {p.point_expiry_months == null ? 'ไม่หมดอายุ' : `${p.point_expiry_months} เดือน`}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{p.cards.length}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-[12px] font-semibold mr-3"
                      style={{ color: 'var(--brand-700)' }}
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => remove(p)}
                      disabled={busy}
                      className="text-[12px] font-semibold disabled:opacity-40"
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
      )}
    </div>
  )
}
