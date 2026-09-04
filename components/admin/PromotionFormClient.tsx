'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { promoEffectiveRatePct } from '@/lib/promo-rate'
import { CAP_BASES, CAP_PERIODS } from '@/lib/validations/card'
import { CARD_SCOPES, PROMO_STATUSES, PROMO_TYPES } from '@/lib/validations/promotion'

/**
 * ฟอร์มโปรโมชัน — ใช้ทั้งสร้างใหม่และแก้ของเดิม (`promoId = null` = ของใหม่)
 *
 * โครงเดียวกับ CardDetailClient: ทุกช่องเป็น string แปลงเป็นตัวเลขตอนส่ง
 * เท่านั้น ไม่แปลงกลับไปกลับมาระหว่างพิมพ์
 */

export interface PromoForm {
  title: string; description: string
  promo_type: string; benefit_value: string; benefit_unit: string
  min_spend: string
  max_cap: string; cap_period: string; cap_basis: string; max_cap_campaign: string
  category_id: string; bank_id: string
  start_date: string; end_date: string
  requires_registration: boolean
  condition: string; source_url: string
  status: string; card_scope: string
  card_ids: string[]; merchant_ids: string[]
}

interface Props {
  promoId: string | null
  banks: { id: string; name_th: string | null }[]
  categories: { id: string; name_th: string | null; icon: string | null }[]
  cards: { id: string; bank_id: string | null; card_name: string | null; card_tier: string | null }[]
  merchants: { id: string; name_th: string | null }[]
  initial: PromoForm
}

const TYPE_LABEL: Record<string, string> = {
  cashback: 'เงินคืน', discount: 'ส่วนลด', points: 'คะแนน', installment: 'ผ่อนชำระ',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'ร่าง (ไม่แสดงบนแอป)', active: 'เผยแพร่', expired: 'หมดอายุ',
}
const SCOPE_LABEL: Record<string, string> = {
  all_bank: 'ทุกใบของธนาคารนี้', specific_cards: 'เฉพาะบัตรที่ระบุ',
}
const CAP_LABEL: Record<string, string> = {
  per_bill: 'ต่อรอบบิล', per_month: 'ต่อเดือน', per_year: 'ต่อปี',
}
const CAP_BASIS_LABEL: Record<string, string> = {
  reward: 'ของที่ได้', spend: 'ของยอดที่นับ',
}
/** หน่วยที่แนะนำตามชนิด — เปลี่ยนชนิดแล้วเติมให้อัตโนมัติ */
const DEFAULT_UNIT: Record<string, string> = {
  cashback: '%', discount: '%', points: 'เท่า', installment: '% ดอกเบี้ย',
}

export const emptyPromo: PromoForm = {
  title: '', description: '',
  promo_type: 'cashback', benefit_value: '', benefit_unit: '%',
  min_spend: '',
  max_cap: '', cap_period: '', cap_basis: 'reward', max_cap_campaign: '',
  category_id: '', bank_id: '',
  start_date: '', end_date: '',
  requires_registration: false,
  condition: '', source_url: '',
  status: 'draft', card_scope: 'all_bank',
  card_ids: [], merchant_ids: [],
}

const num = (s: string) => (s.trim() === '' ? null : Number(s))
const text = (s: string) => (s.trim() === '' ? null : s.trim())
const selectCls = 'h-9 w-full rounded-md border border-input bg-transparent px-2 text-[13px]'

export function PromotionFormClient({
  promoId, banks, categories, cards, merchants, initial,
}: Props) {
  const router = useRouter()
  const [f, setF] = useState<PromoForm>(initial)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (patch: Partial<PromoForm>) => setF(prev => ({ ...prev, ...patch }))

  /** เห็นทันทีว่าโปรนี้เครื่องเทียบได้หรือไม่ ก่อนกดบันทึก */
  const liveRate = promoEffectiveRatePct({
    promo_type: f.promo_type || null,
    benefit_value: f.benefit_value === '' ? null : Number(f.benefit_value),
    benefit_unit: f.benefit_unit || null,
  })

  // บัตรของธนาคารที่เลือกเท่านั้น — โปรของ KTC เลือกบัตร KBANK ไม่ได้
  const bankCards = cards.filter(c => c.bank_id === f.bank_id)

  const toggle = (key: 'card_ids' | 'merchant_ids', id: string) =>
    setF(prev => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter(x => x !== id) : [...prev[key], id],
    }))

  const save = async () => {
    setBusy(true); setError(null); setSaved(false)
    try {
      const res = await fetch(
        promoId ? `/api/admin/promotions/${promoId}` : '/api/admin/promotions',
        {
          method: promoId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: f.title.trim(),
            description: text(f.description),
            promo_type: f.promo_type || null,
            benefit_value: num(f.benefit_value),
            benefit_unit: text(f.benefit_unit),
            min_spend: num(f.min_spend),
            max_cap: num(f.max_cap),
            cap_period: f.cap_period || null,
            cap_basis: f.cap_basis || null,
            max_cap_campaign: num(f.max_cap_campaign),
            category_id: f.category_id || null,
            bank_id: f.bank_id,
            start_date: f.start_date || null,
            end_date: f.end_date || null,
            requires_registration: f.requires_registration,
            condition: text(f.condition),
            source_url: text(f.source_url),
            status: f.status,
            card_scope: f.card_scope,
            // scope เป็น all_bank แล้วต้องไม่ส่งบัตรมา — trigger ใน DB ปฏิเสธ
            card_ids: f.card_scope === 'specific_cards' ? f.card_ids : [],
            merchant_ids: f.merchant_ids,
          }),
        },
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error ?? 'บันทึกไม่สำเร็จ'); return }

      setSaved(true)
      if (!promoId && body.id) router.replace(`/admin/promotions/${body.id}`)
      router.refresh()
    } catch {
      setError('เชื่อมต่อไม่ได้')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!promoId) return
    if (!confirm(`ลบโปร "${f.title}" ถาวร?`)) return
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/promotions/${promoId}`, { method: 'DELETE' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error ?? 'ลบไม่สำเร็จ'); return }
      router.replace('/admin/promotions')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pb-24">
      <h1 className="text-[22px] font-semibold tracking-[-.3px] mb-6">
        {promoId ? f.title || '(ยังไม่มีชื่อ)' : 'โปรโมชันใหม่'}
      </h1>

      {/* ── เนื้อโปร ──────────────────────────────────────────────── */}
      <section className="mb-6 p-5 rounded-xl" style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
        <h2 className="text-[15px] font-semibold mb-4">เนื้อโปร</h2>
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
          <div className="grid gap-1.5" style={{ gridColumn: '1 / -1' }}>
            <Label>หัวข้อ</Label>
            <Input placeholder="รับเครดิตเงินคืน 15% ที่ร้านอาหารในเครือ" value={f.title} onChange={e => set({ title: e.target.value })} />
          </div>

          <div className="grid gap-1.5">
            <Label>ธนาคาร</Label>
            <select
              className={selectCls}
              value={f.bank_id}
              // เปลี่ยนธนาคารแล้วบัตรที่เลือกไว้เป็นของธนาคารเก่า ต้องล้าง
              onChange={e => set({ bank_id: e.target.value, card_ids: [] })}
            >
              <option value="">— เลือกธนาคาร —</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.id} — {b.name_th}</option>)}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label>หมวด</Label>
            <select className={selectCls} value={f.category_id} onChange={e => set({ category_id: e.target.value })}>
              <option value="">— ไม่ระบุหมวด —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_th}</option>)}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label>ชนิด</Label>
            <select
              className={selectCls}
              value={f.promo_type}
              onChange={e => set({ promo_type: e.target.value, benefit_unit: DEFAULT_UNIT[e.target.value] ?? '' })}
            >
              {PROMO_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label>ค่า</Label>
            <Input type="number" step="0.01" min="0" value={f.benefit_value} onChange={e => set({ benefit_value: e.target.value })} />
          </div>

          <div className="grid gap-1.5">
            <Label>หน่วย</Label>
            <Input value={f.benefit_unit} onChange={e => set({ benefit_unit: e.target.value })} />
            <span className="text-[11px]" style={{ color: liveRate == null ? 'var(--warn)' : 'var(--ink-4)' }}>
              {liveRate == null
                ? 'หน่วยนี้เครื่องยังเทียบกับบัตรอื่นไม่ได้ — จะจัดอันดับด้วยการเดาแทน'
                : `เทียบเท่า ${liveRate}% — เครื่องเอาไปเทียบกับบัตรอื่นได้`}
            </span>
          </div>

          <div className="grid gap-1.5" style={{ gridColumn: '1 / -1' }}>
            <Label>รายละเอียด</Label>
            <Input value={f.description} onChange={e => set({ description: e.target.value })} />
          </div>
        </div>
      </section>

      {/* ── เงื่อนไขและเพดาน ─────────────────────────────────────── */}
      <section className="mb-6 p-5 rounded-xl" style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
        <h2 className="text-[15px] font-semibold mb-1">เงื่อนไขและเพดาน</h2>
        <p className="text-[12px] mb-4" style={{ color: 'var(--ink-3)' }}>
          ตลาดจริงมีเพดานซ้อนกันสองชั้น — “฿2,500/เดือน และ ฿7,500 ตลอดรายการ”
        </p>
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
          <div className="grid gap-1.5">
            <Label>ยอดขั้นต่ำ (฿)</Label>
            <Input type="number" min="0" value={f.min_spend} onChange={e => set({ min_spend: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>เพดานต่อรอบ (฿)</Label>
            <Input type="number" min="0" value={f.max_cap} onChange={e => set({ max_cap: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>เพดานต่อ</Label>
            <select
              className={selectCls} value={f.cap_period}
              onChange={e => set({ cap_period: e.target.value })}
              style={f.max_cap !== '' && f.cap_period === '' ? { borderColor: 'var(--warn)' } : undefined}
            >
              <option value="">—</option>
              {CAP_PERIODS.map(p => <option key={p} value={p}>{CAP_LABEL[p]}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label>เพดานของ</Label>
            <select
              className={selectCls} value={f.cap_basis}
              onChange={e => set({ cap_basis: e.target.value })}
              style={f.max_cap !== '' && f.cap_basis === '' ? { borderColor: 'var(--warn)' } : undefined}
            >
              <option value="">—</option>
              {CAP_BASES.map(c => <option key={c} value={c}>{CAP_BASIS_LABEL[c]}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label>เพดานตลอดรายการ (฿)</Label>
            <Input type="number" min="0" placeholder="ไม่มี = เว้นว่าง" value={f.max_cap_campaign} onChange={e => set({ max_cap_campaign: e.target.value })} />
          </div>

          <div className="grid gap-1.5">
            <Label>วันเริ่ม</Label>
            <Input type="date" value={f.start_date} onChange={e => set({ start_date: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>วันจบ</Label>
            <Input type="date" value={f.end_date} onChange={e => set({ end_date: e.target.value })} />
            <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
              เว้นว่าง = ไม่มีวันหมด · หน้าแอปจะไม่มี countdown
            </span>
          </div>

          <div className="grid gap-1.5" style={{ gridColumn: '1 / -1' }}>
            <Label>เงื่อนไขเพิ่มเติม</Label>
            <Input placeholder="เฉพาะร้านที่ร่วมรายการ · จำกัด 1 สิทธิ์/ท่าน/เดือน" value={f.condition} onChange={e => set({ condition: e.target.value })} />
          </div>
        </div>

        {/* flag ไม่ใช่ข้อความ — 'ไม่ลงทะเบียน = ได้ 0' เป็นเงื่อนไขที่ engine ต้องอ่านออก */}
        <label className="flex items-center gap-2 mt-4 text-[13px] cursor-pointer w-fit">
          <input type="checkbox" checked={f.requires_registration} onChange={e => set({ requires_registration: e.target.checked })} />
          ต้องลงทะเบียนก่อนใช้สิทธิ์ (SMS / กดปุ่ม)
        </label>
      </section>

      {/* ── ขอบเขต ───────────────────────────────────────────────── */}
      <section className="mb-6 p-5 rounded-xl" style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
        <h2 className="text-[15px] font-semibold mb-4">ใช้ได้กับบัตรไหน</h2>

        <div className="grid gap-1.5 mb-4" style={{ maxWidth: 320 }}>
          <Label>ขอบเขต</Label>
          <select className={selectCls} value={f.card_scope} onChange={e => set({ card_scope: e.target.value })}>
            {CARD_SCOPES.map(s => <option key={s} value={s}>{SCOPE_LABEL[s]}</option>)}
          </select>
        </div>

        {f.card_scope === 'specific_cards' && (
          !f.bank_id ? (
            <p className="text-[13px]" style={{ color: 'var(--warn)' }}>เลือกธนาคารก่อนถึงจะเลือกบัตรได้</p>
          ) : bankCards.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--warn)' }}>ธนาคารนี้ยังไม่มีบัตรในแคตตาล็อก</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {bankCards.map(c => (
                <label key={c.id} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="checkbox" checked={f.card_ids.includes(c.id)} onChange={() => toggle('card_ids', c.id)} />
                  {c.card_name}
                  {c.card_tier && <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>{c.card_tier}</span>}
                </label>
              ))}
            </div>
          )
        )}
      </section>

      {/* ── ร้านที่ร่วมรายการ ────────────────────────────────────── */}
      <section className="mb-6 p-5 rounded-xl" style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
        <h2 className="text-[15px] font-semibold mb-1">ร้านที่ร่วมรายการ</h2>
        <p className="text-[12px] mb-3" style={{ color: 'var(--ink-3)' }}>
          ไม่เลือกเลย = ใช้ได้ทั้งหมวดที่เลือกไว้ข้างบน · โปรที่ระบุร้านตรงตัวชนะโปรระดับหมวดเสมอ
        </p>
        {merchants.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--ink-4)' }}>ยังไม่มีร้านในระบบ</p>
        ) : (
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {merchants.map(m => (
              <label key={m.id} className="flex items-center gap-2 text-[13px] cursor-pointer">
                <input type="checkbox" checked={f.merchant_ids.includes(m.id)} onChange={() => toggle('merchant_ids', m.id)} />
                {m.name_th}
              </label>
            ))}
          </div>
        )}
      </section>

      {/* ── เผยแพร่ ──────────────────────────────────────────────── */}
      <section className="mb-6 p-5 rounded-xl" style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
        <h2 className="text-[15px] font-semibold mb-4">เผยแพร่</h2>
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
          <div className="grid gap-1.5">
            <Label>สถานะ</Label>
            <select className={selectCls} value={f.status} onChange={e => set({ status: e.target.value })}>
              {PROMO_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5" style={{ gridColumn: '2 / -1' }}>
            <Label>ลิงก์อ้างอิง</Label>
            <Input type="url" placeholder="https://www.ktc.co.th/promotion/…" value={f.source_url} onChange={e => set({ source_url: e.target.value })} />
            <span className="text-[11px]" style={{ color: f.status === 'active' && !f.source_url ? 'var(--warn)' : 'var(--ink-4)' }}>
              บังคับเมื่อสถานะเป็น “เผยแพร่” — ต้องย้อนไปตรวจกับเว็บธนาคารได้
            </span>
          </div>
        </div>
      </section>

      <div
        className="fixed bottom-0 left-0 right-0 px-6 py-3 flex items-center gap-3"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', zIndex: 40 }}
      >
        <div className="mx-auto flex items-center gap-3 w-full" style={{ maxWidth: 1100 }}>
          <Button onClick={save} disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</Button>
          {saved && <span className="text-[13px] font-semibold" style={{ color: 'var(--brand-700)' }}>บันทึกแล้ว</span>}
          {error && <span className="text-[13px] font-medium" style={{ color: 'var(--warn)' }}>{error}</span>}
          {promoId && (
            <button onClick={remove} disabled={busy} className="ml-auto text-[12px] font-semibold" style={{ color: 'var(--warn)' }}>
              ลบโปรนี้
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
