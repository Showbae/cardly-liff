'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NETWORKS } from '@/lib/validations/card'

/**
 * ฟอร์มสร้างบัตรใหม่ — **ข้อมูลบัตรเท่านั้น**
 *
 * อัตราตอบแทนกับสิทธิพิเศษไม่ได้อยู่ในหน้านี้โดยตั้งใจ เพราะ `POST /api/admin/cards`
 * สร้างได้แค่แถวใน `credit_cards` (อัตรา/สิทธิพิเศษเข้าผ่าน `PUT /api/admin/cards/[id]`
 * ที่บันทึกทั้งใบในทรานแซกชันเดียว) — สร้างเสร็จจึงเด้งไปหน้าแก้ไขให้กรอกต่อทันที
 * ไม่ต้องเดาว่าต้องไปหาบัตรที่เพิ่งสร้างเองในลิสต์
 */

interface FormState {
  bank_id: string
  card_name: string
  card_tier: string
  network: string
  point_program_id: string
  annual_fee: string
  fee_waiver_condition: string
  image_url: string
}

const emptyForm: FormState = {
  bank_id: '', card_name: '', card_tier: '', network: '',
  point_program_id: '', annual_fee: '', fee_waiver_condition: '', image_url: '',
}

const NETWORK_LABEL: Record<string, string> = {
  visa: 'VISA', mastercard: 'Mastercard', jcb: 'JCB', amex: 'AMEX', unionpay: 'UnionPay',
}

const text = (s: string) => (s.trim() === '' ? null : s.trim())
const num = (s: string) => (s.trim() === '' ? null : Number(s))

const selectCls = 'h-9 w-full rounded-md border border-input bg-transparent px-2 text-[13px]'

export function NewCardClient({
  banks,
  programs,
}: {
  banks: { id: string; name_th: string | null }[]
  programs: { id: string; bank_id: string; name: string; point_value_thb: number }[]
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const bankPrograms = programs.filter(p => p.bank_id === form.bank_id)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_id: form.bank_id,
          card_name: form.card_name.trim(),
          card_tier: text(form.card_tier),
          network: form.network || null,
          point_program_id: form.point_program_id || null,
          annual_fee: num(form.annual_fee),
          fee_waiver_condition: text(form.fee_waiver_condition),
          image_url: text(form.image_url),
        }),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(
          typeof body.error === 'string'
            ? body.error
            : Array.isArray(body.error)
              ? body.error.map((i: { message: string }) => i.message).join(' · ')
              : 'สร้างบัตรไม่สำเร็จ',
        )
        return
      }

      // replace ไม่ push — กด back จากหน้าแก้ไขแล้วไม่ควรเจอฟอร์มเปล่าที่สร้างซ้ำได้
      router.replace(`/admin/cards/${body.id}`)
    } catch {
      setError('เชื่อมต่อไม่ได้')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-[-.3px]">เพิ่มบัตรใหม่</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>
          กรอกข้อมูลบัตรก่อน — บันทึกแล้วจะพาไปกรอกอัตราตอบแทนกับสิทธิพิเศษต่อ
        </p>
      </div>

      <section
        className="mb-6 p-5 rounded-xl"
        style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}
      >
        {/* items-start จำเป็น — ไม่ใส่แล้วช่องที่มีข้อความช่วยใต้ input (เช่น "โปรแกรมสะสม")
            จะทำให้แถวสูงขึ้น แล้วช่องอื่นที่ align-content เป็น stretch ยืดแถวในตัวเอง
            ดัน input ลงไปไม่ตรงแนวกับช่องที่มีคำอธิบาย */}
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
          <div className="grid gap-1.5">
            <Label htmlFor="bank">ธนาคาร</Label>
            <select
              id="bank"
              required
              className={selectCls}
              value={form.bank_id}
              // เปลี่ยนธนาคารแล้วโปรแกรมเดิมอาจไม่ใช่ของธนาคารนี้ — ล้างทิ้ง
              onChange={e => setForm(f => ({ ...f, bank_id: e.target.value, point_program_id: '' }))}
            >
              <option value="" disabled>เลือกธนาคาร</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.id} — {b.name_th}</option>)}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="name">ชื่อบัตร</Label>
            <Input
              id="name"
              required
              placeholder="K-VISA Signature"
              value={form.card_name}
              onChange={e => set('card_name', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tier">ระดับบัตร</Label>
            <Input
              id="tier"
              placeholder="Platinum"
              value={form.card_tier}
              onChange={e => set('card_tier', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="network">เครือข่าย</Label>
            <select
              id="network"
              className={selectCls}
              value={form.network}
              onChange={e => set('network', e.target.value)}
            >
              <option value="">— ไม่ระบุ —</option>
              {NETWORKS.map(n => <option key={n} value={n}>{NETWORK_LABEL[n]}</option>)}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="program">โปรแกรมสะสม</Label>
            <select
              id="program"
              className={selectCls}
              value={form.point_program_id}
              onChange={e => set('point_program_id', e.target.value)}
              disabled={!form.bank_id}
            >
              <option value="">— บัตรเงินคืน (ไม่มีแต้ม) —</option>
              {bankPrograms.map(p => (
                <option key={p.id} value={p.id}>{p.name} (฿{p.point_value_thb}/คะแนน)</option>
              ))}
            </select>
            <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
              {!form.bank_id
                ? 'เลือกธนาคารก่อน'
                : bankPrograms.length === 0
                  ? `${form.bank_id} ยังไม่มีโปรแกรมสะสม — เพิ่มได้ที่หน้าโปรแกรมสะสม`
                  : 'เว้นว่าง = บัตรเงินคืน · ต้องเลือกถ้ามีอัตราแบบคะแนน'}
            </span>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="fee">ค่าธรรมเนียมรายปี</Label>
            <Input
              id="fee"
              type="number"
              min="0"
              placeholder="0 = ฟรี"
              value={form.annual_fee}
              onChange={e => set('annual_fee', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5" style={{ gridColumn: '1 / -1' }}>
            <Label htmlFor="waiver">เงื่อนไขยกเว้นค่าธรรมเนียม</Label>
            <Input
              id="waiver"
              placeholder="ฟรีเมื่อมียอดใช้จ่ายครบ ฿100,000 ต่อปี"
              value={form.fee_waiver_condition}
              onChange={e => set('fee_waiver_condition', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5" style={{ gridColumn: '1 / -1' }}>
            <Label htmlFor="image">รูปบัตร (URL)</Label>
            <Input
              id="image"
              type="url"
              placeholder="https://…"
              value={form.image_url}
              onChange={e => set('image_url', e.target.value)}
            />
            <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
              ใช้แสดงในหน้าแนะนำบัตรของ LIFF · เว้นว่างได้
            </span>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? 'กำลังสร้าง…' : 'สร้างบัตร'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/cards')} disabled={busy}>
          ยกเลิก
        </Button>
        {error && (
          <span className="text-[13px] font-medium" style={{ color: 'var(--warn)' }}>{error}</span>
        )}
      </div>
    </form>
  )
}
