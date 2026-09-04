'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()

  // middleware แนบปลายทางเดิมมาให้ตอนเด้งมาที่นี่ จะได้กลับไปที่เดิมหลังล็อกอิน
  const next = params.get('next') ?? '/admin/cards'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(typeof body.error === 'string' ? body.error : 'เข้าสู่ระบบไม่สำเร็จ')
        return
      }
      // ใช้ replace เพื่อไม่ให้กด back กลับมาหน้า login ได้หลังล็อกอินแล้ว
      router.replace(next)
      router.refresh()
    } catch {
      setError('เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full" style={{ maxWidth: 360 }}>

        <div className="mb-8">
          <div
            className="text-[11px] font-semibold uppercase mb-1"
            style={{ letterSpacing: '1.4px', color: 'var(--ink-4)' }}
          >
            Cardly
          </div>
          <h1 className="text-[26px] font-semibold tracking-[-.5px]">ผู้ดูแลระบบ</h1>
        </div>

        <label className="block mb-4">
          <span className="text-[12px] font-semibold text-ink-2">อีเมล</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full mt-1.5 text-[14px] outline-none"
            style={{
              padding: '11px 13px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--line)',
              background: 'var(--surface)',
            }}
          />
        </label>

        <label className="block mb-6">
          <span className="text-[12px] font-semibold text-ink-2">รหัสผ่าน</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mt-1.5 text-[14px] outline-none"
            style={{
              padding: '11px 13px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--line)',
              background: 'var(--surface)',
            }}
          />
        </label>

        {error && (
          <div
            role="alert"
            className="text-[13px] mb-4"
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--r-sm)',
              background: 'var(--warn-bg)',
              color: '#a5411a',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full text-[15px] font-semibold disabled:opacity-60"
          style={{
            padding: 13,
            borderRadius: 999,
            background: 'var(--ink)',
            color: 'var(--bg)',
            border: 'none',
            cursor: busy ? 'default' : 'pointer',
          }}
        >
          {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
        </button>

        <p className="text-[11px] text-ink-4 mt-5 text-center">
          ไม่มีหน้าสมัคร — ติดต่อผู้ดูแลเพื่อขอบัญชี
        </p>
      </form>
    </div>
  )
}

export default function AdminLoginPage() {
  // useSearchParams ต้องอยู่ใน Suspense ไม่งั้น build จะบังคับให้ทั้งหน้าเป็น dynamic
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
