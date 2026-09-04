'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { tryCapRewardThb, tryEffectiveRatePct, type BenefitType, type CapBasis } from '@/lib/rewards'
import {
  BENEFIT_TYPES, CAP_BASES, CAP_PERIODS, CARD_STATUSES,
  MIN_SPEND_BASES, NETWORKS, PERK_TYPES,
} from '@/lib/validations/card'

// ── ชนิดข้อมูลของฟอร์ม: ทุกช่องเป็น string เพราะ input คืน string เสมอ
//    แปลงเป็นตัวเลขตอนส่งเท่านั้น ไม่แปลงกลับไปกลับมาระหว่างพิมพ์
//    ยกเว้น requires_registration ที่เป็น checkbox → boolean ตรง ๆ
interface CardForm {
  bank_id: string; card_name: string; card_tier: string; image_url: string
  point_program_id: string; network: string; annual_fee: string; fee_waiver_condition: string
  foreign_tx_fee_pct: string; status: string
}
interface BenefitForm {
  id?: string; category_id: string; benefit_type: string; benefit_value: string
  benefit_unit: string; spend_per_unit: string; min_spend: string; min_spend_basis: string
  max_cap: string; cap_period: string; cap_basis: string
  requires_registration: boolean; condition: string
}
interface PerkForm {
  id?: string; perk_type: string; title: string; value_text: string
  description: string; condition: string
}

interface Props {
  cardId: string
  holderCount: number
  banks: { id: string; name_th: string | null }[]
  programs: { id: string; bank_id: string; name: string; point_value_thb: number }[]
  categories: { id: string; name_th: string | null; icon: string | null }[]
  initialCard: CardForm
  initialBenefits: BenefitForm[]
  initialPerks: PerkForm[]
}

const TYPE_LABEL: Record<string, string> = {
  cashback: 'เงินคืน', points: 'คะแนน', miles: 'ไมล์', discount: 'ส่วนลด',
}
const CAP_LABEL: Record<string, string> = {
  per_bill: 'ต่อรอบบิล', per_month: 'ต่อเดือน', per_year: 'ต่อปี',
}
const PERK_LABEL: Record<string, string> = {
  lounge: 'ห้องรับรอง', insurance: 'ประกัน', parking: 'จอดรถ', dining: 'ร้านอาหาร',
  golf: 'กอล์ฟ', health: 'สุขภาพ', travel: 'ท่องเที่ยว', shopping: 'ช้อปปิ้ง', other: 'อื่น ๆ',
}
const NETWORK_LABEL: Record<string, string> = {
  visa: 'VISA', mastercard: 'Mastercard', jcb: 'JCB', amex: 'AMEX', unionpay: 'UnionPay',
}
/** เพดานของอะไร — สองอันนี้ได้ผลไม่เท่ากันเมื่ออัตราไม่ใช่ 100% */
const CAP_BASIS_LABEL: Record<string, string> = {
  reward: 'ของที่ได้', spend: 'ของยอดที่นับ',
}
const MIN_BASIS_LABEL: Record<string, string> = {
  per_slip: 'ต่อเซลส์สลิป', per_period: 'ยอดสะสมต่อรอบ',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'ยังเปิดรับสมัคร', discontinued: 'เลิกออกแล้ว',
}
/** หน่วยที่แนะนำตามชนิด — เปลี่ยนชนิดแล้วเติมให้อัตโนมัติ */
const DEFAULT_UNIT: Record<string, string> = {
  cashback: '%', points: 'คะแนน', miles: 'ไมล์', discount: '%',
}

const emptyBenefit: BenefitForm = {
  category_id: '', benefit_type: 'cashback', benefit_value: '', benefit_unit: '%',
  spend_per_unit: '', min_spend: '', min_spend_basis: '',
  // 'reward' เป็นค่าเริ่มต้นเพราะเป็นแบบที่ธนาคารประกาศบ่อยกว่า
  // ('สูงสุด ฿500/เดือน') — แต่ยังต้องกดยืนยันเพราะเลือกผิดแล้วเลขผิดเงียบ
  max_cap: '', cap_period: '', cap_basis: 'reward',
  requires_registration: false, condition: '',
}
const emptyPerk: PerkForm = {
  perk_type: 'lounge', title: '', value_text: '', description: '', condition: '',
}

/** สลับตำแหน่งสองแถว — sort_order มาจาก index ของ array ตอนบันทึก */
const move = <T,>(rows: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= rows.length) return rows
  const next = [...rows]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

const num = (s: string) => (s.trim() === '' ? null : Number(s))
const text = (s: string) => (s.trim() === '' ? null : s.trim())

const selectCls = 'h-9 w-full rounded-md border border-input bg-transparent px-2 text-[13px]'

export function CardDetailClient({
  cardId, holderCount, banks, programs, categories,
  initialCard, initialBenefits, initialPerks,
}: Props) {
  const router = useRouter()
  const [card, setCard] = useState<CardForm>(initialCard)
  const [benefits, setBenefits] = useState<BenefitForm[]>(initialBenefits)
  const [perks, setPerks] = useState<PerkForm[]>(initialPerks)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const program = programs.find(p => p.id === card.point_program_id) ?? null

  const programInput = program ? { point_value_thb: program.point_value_thb } : null

  const benefitInput = (b: BenefitForm) => ({
    benefit_type: b.benefit_type as BenefitType,
    benefit_value: Number(b.benefit_value || 0),
    benefit_unit: b.benefit_unit,
    spend_per_unit: b.spend_per_unit === '' ? null : Number(b.spend_per_unit),
  })

  /** งาน 3.7 — คำนวณสดตอนพิมพ์ ใช้ฟังก์ชันตัวเดียวกับที่ server ใช้ */
  const liveRate = (b: BenefitForm): number | null =>
    tryEffectiveRatePct(benefitInput(b), programInput)

  /**
   * มูลค่าเพดานเป็นบาท — คำนวณสดด้วยเหตุผลเดียวกับ liveRate
   *
   * สำคัญกว่าตรงที่มันทำให้คนกรอกเห็นทันทีว่าเลือก cap_basis ผิดหรือเปล่า:
   * '3% สูงสุด ฿500' กับ '3% ของยอดไม่เกิน ฿500' ต่างกัน ฿485 บนหน้าจอเลย
   */
  const liveCap = (b: BenefitForm): number | null =>
    tryCapRewardThb(
      {
        ...benefitInput(b),
        max_cap: b.max_cap === '' ? null : Number(b.max_cap),
        cap_basis: (b.cap_basis || null) as CapBasis | null,
      },
      programInput,
    )

  const setB = (i: number, patch: Partial<BenefitForm>) =>
    setBenefits(rows => rows.map((r, x) => (x === i ? { ...r, ...patch } : r)))
  const setP = (i: number, patch: Partial<PerkForm>) =>
    setPerks(rows => rows.map((r, x) => (x === i ? { ...r, ...patch } : r)))

  const save = async () => {
    setBusy(true); setError(null); setSaved(false)
    try {
      const res = await fetch(`/api/admin/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card: {
            bank_id: card.bank_id,
            card_name: card.card_name.trim(),
            card_tier: text(card.card_tier),
            image_url: text(card.image_url),
            point_program_id: card.point_program_id || null,
            network: card.network || null,
            annual_fee: num(card.annual_fee),
            fee_waiver_condition: text(card.fee_waiver_condition),
            foreign_tx_fee_pct: num(card.foreign_tx_fee_pct),
            status: card.status,
          },
          benefits: benefits.map(b => ({
            id: b.id,
            category_id: b.category_id || null,
            benefit_type: b.benefit_type,
            benefit_value: Number(b.benefit_value || 0),
            benefit_unit: b.benefit_unit.trim(),
            spend_per_unit: num(b.spend_per_unit),
            min_spend: num(b.min_spend),
            min_spend_basis: b.min_spend_basis || null,
            max_cap: num(b.max_cap),
            cap_period: b.cap_period || null,
            cap_basis: b.cap_basis || null,
            requires_registration: b.requires_registration,
            condition: text(b.condition),
          })),
          perks: perks.map(p => ({
            id: p.id,
            perk_type: p.perk_type,
            title: p.title.trim(),
            value_text: text(p.value_text),
            description: text(p.description),
            condition: text(p.condition),
          })),
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error ?? 'บันทึกไม่สำเร็จ'); return }
      setSaved(true)
      router.refresh()
    } catch {
      setError('เชื่อมต่อไม่ได้')
    } finally {
      setBusy(false)
    }
  }

  const bestRate = benefits.reduce<number | null>((best, b) => {
    const r = liveRate(b)
    return r == null ? best : best == null ? r : Math.max(best, r)
  }, null)

  return (
    <div className="pb-24">
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-.3px]">
            {card.card_name || '(ยังไม่มีชื่อ)'}
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>
            {card.bank_id}
            {holderCount > 0 && ` · มีผู้ถือ ${holderCount} คน`}
            {bestRate != null && ` · อัตราสูงสุด ${bestRate}%`}
          </p>
        </div>
      </div>

      {/* ── ข้อมูลบัตร ────────────────────────────────────────────── */}
      <section className="mb-8 p-5 rounded-xl" style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
        <h2 className="text-[15px] font-semibold mb-4">ข้อมูลบัตร</h2>
        {/* items-start — ดูเหตุผลใน NewCardClient.tsx (ช่องที่มีคำอธิบายใต้ input ทำให้แนวเพี้ยน) */}
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
          <div className="grid gap-1.5">
            <Label>ธนาคาร</Label>
            <select className={selectCls} value={card.bank_id} onChange={e => setCard({ ...card, bank_id: e.target.value })}>
              {banks.map(b => <option key={b.id} value={b.id}>{b.id} — {b.name_th}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label>ชื่อบัตร</Label>
            <Input value={card.card_name} onChange={e => setCard({ ...card, card_name: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>ระดับบัตร</Label>
            <Input placeholder="Platinum" value={card.card_tier} onChange={e => setCard({ ...card, card_tier: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>เครือข่าย</Label>
            <select className={selectCls} value={card.network} onChange={e => setCard({ ...card, network: e.target.value })}>
              <option value="">— ไม่ระบุ —</option>
              {NETWORKS.map(n => <option key={n} value={n}>{NETWORK_LABEL[n]}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label>โปรแกรมสะสม</Label>
            <select
              className={selectCls}
              value={card.point_program_id}
              onChange={e => setCard({ ...card, point_program_id: e.target.value })}
            >
              <option value="">— บัตรเงินคืน (ไม่มีแต้ม) —</option>
              {programs.filter(p => p.bank_id === card.bank_id).map(p => (
                <option key={p.id} value={p.id}>{p.name} (฿{p.point_value_thb}/คะแนน)</option>
              ))}
            </select>
            <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
              {program
                ? `ใช้ ฿${program.point_value_thb} ต่อคะแนน คำนวณอัตราข้างล่าง`
                : 'เว้นว่าง = บัตรเงินคืน · ต้องเลือกถ้ามีอัตราแบบคะแนน'}
            </span>
          </div>
          <div className="grid gap-1.5">
            <Label>ค่าธรรมเนียมรายปี</Label>
            <Input type="number" min="0" placeholder="0 = ฟรี" value={card.annual_fee} onChange={e => setCard({ ...card, annual_fee: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>ค่าความเสี่ยงแปลงสกุลเงิน (%)</Label>
            <Input
              type="number" step="0.01" min="0" max="10" placeholder="2.5"
              value={card.foreign_tx_fee_pct}
              onChange={e => setCard({ ...card, foreign_tx_fee_pct: e.target.value })}
            />
            <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
              เว้นว่าง = ยังไม่รู้ · ใส่ 0 = บัตรไม่คิดจริง — คนละความหมาย
            </span>
          </div>
          <div className="grid gap-1.5">
            <Label>สถานะบัตร</Label>
            <select className={selectCls} value={card.status} onChange={e => setCard({ ...card, status: e.target.value })}>
              {CARD_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
              เลิกออกแล้ว = คนที่ถืออยู่ยังเห็นสิทธิ์ครบ แต่บัตรไม่ไปโผล่ที่อื่น
            </span>
          </div>
          <div className="grid gap-1.5" style={{ gridColumn: '1 / -1' }}>
            <Label>เงื่อนไขยกเว้นค่าธรรมเนียม</Label>
            <Input placeholder="ฟรีเมื่อมียอดใช้จ่ายครบ ฿100,000 ต่อปี" value={card.fee_waiver_condition} onChange={e => setCard({ ...card, fee_waiver_condition: e.target.value })} />
          </div>
          {/* image_url เดิมถูกส่งไปกับ payload แต่ไม่มีช่องกรอก — แก้ได้แค่ที่ DB */}
          <div className="grid gap-1.5" style={{ gridColumn: '1 / -1' }}>
            <Label>รูปบัตร (URL)</Label>
            <Input type="url" placeholder="https://…" value={card.image_url} onChange={e => setCard({ ...card, image_url: e.target.value })} />
            <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
              ใช้แสดงในหน้าแนะนำบัตรของ LIFF · เว้นว่างได้
            </span>
          </div>
        </div>
      </section>

      {/* ── อัตราตอบแทน ──────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-semibold">อัตราตอบแทน</h2>
            <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
              เว้นหมวดว่าง = อัตราพื้นฐานที่ใช้กับทุกหมวด
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setBenefits(r => [...r, { ...emptyBenefit }])}>
            + เพิ่มอัตรา
          </Button>
        </div>

        {benefits.length === 0 ? (
          <div className="text-center py-10 rounded-xl text-[13px]" style={{ border: '1px dashed var(--line)', color: 'var(--ink-3)' }}>
            ยังไม่มีอัตรา — กด “เพิ่มอัตรา” เพื่อเริ่มกรอก
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {benefits.map((b, i) => {
              const rate = liveRate(b)
              const cap = liveCap(b)
              return (
                <div key={b.id ?? `new-${i}`} className="p-4 rounded-xl" style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
                  <div className="grid gap-3 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))' }}>
                    <div className="grid gap-1">
                      <Label className="text-[11px]">หมวด</Label>
                      <select className={selectCls} value={b.category_id} onChange={e => setB(i, { category_id: e.target.value })}>
                        <option value="">ทุกหมวด (พื้นฐาน)</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_th}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px]">ชนิด</Label>
                      <select
                        className={selectCls}
                        value={b.benefit_type}
                        onChange={e => setB(i, { benefit_type: e.target.value, benefit_unit: DEFAULT_UNIT[e.target.value] ?? '' })}
                      >
                        {BENEFIT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px]">ค่า</Label>
                      <Input type="number" step="0.01" min="0" value={b.benefit_value} onChange={e => setB(i, { benefit_value: e.target.value })} />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px]">หน่วย</Label>
                      <Input value={b.benefit_unit} onChange={e => setB(i, { benefit_unit: e.target.value })} />
                    </div>
                    {(b.benefit_type === 'points' || b.benefit_type === 'miles') && (
                      <div className="grid gap-1">
                        <Label className="text-[11px]">ต่อกี่บาท</Label>
                        <Input type="number" min="1" placeholder="25" value={b.spend_per_unit} onChange={e => setB(i, { spend_per_unit: e.target.value })} />
                      </div>
                    )}
                    <div className="grid gap-1">
                      <Label className="text-[11px]">ขั้นต่ำ (฿)</Label>
                      <Input type="number" min="0" value={b.min_spend} onChange={e => setB(i, { min_spend: e.target.value })} />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px]">ขั้นต่ำต่อ</Label>
                      <select
                        className={selectCls}
                        value={b.min_spend_basis}
                        onChange={e => setB(i, { min_spend_basis: e.target.value })}
                        style={b.min_spend !== '' && b.min_spend_basis === '' ? { borderColor: 'var(--warn)' } : undefined}
                      >
                        <option value="">—</option>
                        {MIN_SPEND_BASES.map(m => <option key={m} value={m}>{MIN_BASIS_LABEL[m]}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px]">
                        เพดาน ({b.cap_basis === 'reward' && (b.benefit_type === 'points' || b.benefit_type === 'miles')
                          ? b.benefit_unit || 'หน่วย'
                          : '฿'})
                      </Label>
                      <Input type="number" min="0" value={b.max_cap} onChange={e => setB(i, { max_cap: e.target.value })} />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px]">เพดานต่อ</Label>
                      <select
                        className={selectCls}
                        value={b.cap_period}
                        onChange={e => setB(i, { cap_period: e.target.value })}
                        style={b.max_cap !== '' && b.cap_period === '' ? { borderColor: 'var(--warn)' } : undefined}
                      >
                        <option value="">—</option>
                        {CAP_PERIODS.map(p => <option key={p} value={p}>{CAP_LABEL[p]}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px]">เพดานของ</Label>
                      <select
                        className={selectCls}
                        value={b.cap_basis}
                        onChange={e => setB(i, { cap_basis: e.target.value })}
                        style={b.max_cap !== '' && b.cap_basis === '' ? { borderColor: 'var(--warn)' } : undefined}
                      >
                        <option value="">—</option>
                        {CAP_BASES.map(c => <option key={c} value={c}>{CAP_BASIS_LABEL[c]}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* ลงทะเบียน — เป็น flag ไม่ใช่ข้อความ เพราะ "ไม่ลงทะเบียน = ได้ 0"
                      เป็นเงื่อนไขที่ engine ต้องอ่านออก ไม่ใช่แค่ให้คนอ่าน */}
                  <label className="flex items-center gap-2 mt-3 text-[12.5px] cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={b.requires_registration}
                      onChange={e => setB(i, { requires_registration: e.target.checked })}
                    />
                    ต้องลงทะเบียนก่อนใช้สิทธิ์
                  </label>

                  <div className="grid gap-1 mt-3">
                    <Label className="text-[11px]">เงื่อนไข</Label>
                    <Input placeholder="เฉพาะวันเสาร์–อาทิตย์ · ต้องลงทะเบียนก่อน" value={b.condition} onChange={e => setB(i, { condition: e.target.value })} />
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 gap-3 flex-wrap" style={{ borderTop: '1px solid var(--line-soft)' }}>
                    <div className="text-[13px] flex items-center gap-3 flex-wrap">
                      <span>
                        <span style={{ color: 'var(--ink-3)' }}>อัตราเทียบเท่า </span>
                        {rate == null ? (
                          <span className="font-semibold" style={{ color: 'var(--warn)' }}>คำนวณไม่ได้ — ข้อมูลยังไม่ครบ</span>
                        ) : (
                          <span className="font-bold tabular-nums" style={{ color: 'var(--brand-700)' }}>{rate}%</span>
                        )}
                      </span>
                      {/* โชว์เฉพาะตอนกรอกเพดานแล้ว — เลข ฿ นี้คือตัวจับว่าเลือก
                          "เพดานของ" ผิดหรือเปล่า ('3% สูงสุด ฿500' vs
                          '3% ของยอดไม่เกิน ฿500' ต่างกัน ฿485) */}
                      {b.max_cap !== '' && (
                        <span>
                          <span style={{ color: 'var(--ink-3)' }}>· มูลค่าเพดาน </span>
                          {cap == null ? (
                            <span className="font-semibold" style={{ color: 'var(--warn)' }}>ยังบอกไม่ได้</span>
                          ) : (
                            <span className="font-bold tabular-nums">฿{cap.toLocaleString('th-TH')}</span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {/* เรียงลำดับ — sort_order เขียนจาก index ตอนบันทึก และ
                          BenefitsTab กาง accordion อันแรกเสมอ ลำดับจึงตัดสิน
                          ว่า user เห็นอะไรก่อน */}
                      <button
                        onClick={() => setBenefits(r => move(r, i, i - 1))}
                        disabled={i === 0}
                        aria-label="เลื่อนขึ้น"
                        className="text-[13px] px-1.5 disabled:opacity-25"
                        style={{ color: 'var(--ink-3)' }}
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => setBenefits(r => move(r, i, i + 1))}
                        disabled={i === benefits.length - 1}
                        aria-label="เลื่อนลง"
                        className="text-[13px] px-1.5 disabled:opacity-25"
                        style={{ color: 'var(--ink-3)' }}
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => setBenefits(r => r.filter((_, x) => x !== i))}
                        className="text-[12px] font-semibold"
                        style={{ color: 'var(--warn)' }}
                      >
                        ลบแถวนี้
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── สิทธิพิเศษ ───────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-semibold">สิทธิพิเศษ</h2>
            <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
              ของที่คิดเป็นอัตราไม่ได้ · ค่าธรรมเนียมรายปีอยู่ในส่วนข้อมูลบัตรข้างบน
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPerks(r => [...r, { ...emptyPerk }])}>
            + เพิ่มสิทธิพิเศษ
          </Button>
        </div>

        {perks.length === 0 ? (
          <div className="text-center py-8 rounded-xl text-[13px]" style={{ border: '1px dashed var(--line)', color: 'var(--ink-3)' }}>
            บัตรใบนี้ยังไม่มีสิทธิพิเศษ
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {perks.map((p, i) => (
              <div key={p.id ?? `new-${i}`} className="p-3 rounded-xl" style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
                <div className="grid gap-2" style={{ gridTemplateColumns: 'minmax(120px,150px) minmax(160px,2fr) minmax(120px,1fr) minmax(140px,1.5fr) auto', alignItems: 'end' }}>
                  <div className="grid gap-1">
                    <Label className="text-[11px]">ชนิด</Label>
                    <select className={selectCls} value={p.perk_type} onChange={e => setP(i, { perk_type: e.target.value })}>
                      {PERK_TYPES.map(t => <option key={t} value={t}>{PERK_LABEL[t]}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[11px]">หัวข้อ</Label>
                    <Input placeholder="ห้องรับรองสนามบิน" value={p.title} onChange={e => setP(i, { title: e.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[11px]">มูลค่า/จำนวน</Label>
                    <Input placeholder="2 ครั้ง/ปี" value={p.value_text} onChange={e => setP(i, { value_text: e.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[11px]">เงื่อนไข</Label>
                    <Input value={p.condition} onChange={e => setP(i, { condition: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2 pb-1.5">
                    <button
                      onClick={() => setPerks(r => move(r, i, i - 1))}
                      disabled={i === 0}
                      aria-label="เลื่อนขึ้น"
                      className="text-[13px] disabled:opacity-25"
                      style={{ color: 'var(--ink-3)' }}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => setPerks(r => move(r, i, i + 1))}
                      disabled={i === perks.length - 1}
                      aria-label="เลื่อนลง"
                      className="text-[13px] disabled:opacity-25"
                      style={{ color: 'var(--ink-3)' }}
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => setPerks(r => r.filter((_, x) => x !== i))}
                      className="text-[12px] font-semibold"
                      style={{ color: 'var(--warn)' }}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
                {/* คอลัมน์นี้มีใน DB และ API เขียนให้อยู่แล้ว แต่ไม่เคยมีช่องกรอก —
                    ผลคือทุกครั้งที่กดบันทึก มันถูกเซ็ตเป็น null ทับของเดิม */}
                <div className="grid gap-1 mt-2">
                  <Label className="text-[11px]">รายละเอียด</Label>
                  <Input
                    placeholder="ใช้ได้ที่เลานจ์ในเครือ Priority Pass ทั่วโลก"
                    value={p.description}
                    onChange={e => setP(i, { description: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── แถบบันทึก — ลอยอยู่ล่างเสมอ ฟอร์มยาวจะได้ไม่ต้องเลื่อนขึ้นไปกด ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-6 py-3 flex items-center gap-3"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', zIndex: 40 }}
      >
        <div className="mx-auto flex items-center gap-3 w-full" style={{ maxWidth: 1100 }}>
          <Button onClick={save} disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</Button>
          <span className="text-[12px]" style={{ color: 'var(--ink-4)' }}>
            {benefits.length} อัตรา · {perks.length} สิทธิพิเศษ
          </span>
          {saved && <span className="text-[13px] font-semibold" style={{ color: 'var(--brand-700)' }}>บันทึกแล้ว</span>}
          {error && <span className="text-[13px] font-medium" style={{ color: 'var(--warn)' }}>{error}</span>}
        </div>
      </div>
    </div>
  )
}
