import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { login, purgeExpiredSessions, ADMIN_COOKIE, sessionCookieOptions } from '@/lib/admin-auth'

export const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
})

/**
 * ⚠️ ยังไม่มี rate limit — ดู docs/tech-debt.md
 *
 * ตอนนี้พึ่งต้นทุนของ argon2 (~100ms/ครั้ง) เป็นตัวหน่วงตามธรรมชาติ
 * ซึ่งช่วยได้ระดับหนึ่งแต่ไม่ใช่การป้องกันจริง · limiter แบบเก็บใน memory
 * ใช้ไม่ได้ผลบน serverless เพราะแต่ละ instance นับแยกกัน ต้องใช้ store กลาง
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)

    const result = await login(email, password)

    if (!result.ok) {
      // บัญชีถูกล็อก — ตอบ 429 เพื่อให้ client แยกออกจากรหัสผิดธรรมดา
      if (result.reason === 'locked') {
        const mins = Math.max(1, Math.ceil((result.until.getTime() - Date.now()) / 60_000))
        return NextResponse.json(
          { error: `กรอกรหัสผิดหลายครั้งเกินไป — ลองใหม่ในอีก ${mins} นาที` },
          { status: 429, headers: { 'Retry-After': String(mins * 60) } },
        )
      }
      // ข้อความเดียวกันเสมอ ไม่ว่าจะไม่มี email หรือรหัสผิด
      // ไม่งั้นคนนอกจะไล่เดาได้ว่า email ไหนมีอยู่จริง
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    const res = NextResponse.json({ admin: result.identity })
    res.cookies.set(ADMIN_COOKIE, result.token, sessionCookieOptions(result.expiresAt))

    // เก็บกวาด session เก่าตอน login — ไม่ต้องตั้ง cron แยก
    purgeExpiredSessions().catch(err => console.error('[purgeExpiredSessions]', err))

    return res
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('[POST /api/admin/login]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
