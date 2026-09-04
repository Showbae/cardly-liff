import { NextRequest, NextResponse } from 'next/server'
import { destroySession, ADMIN_COOKIE, sessionCookieOptions } from '@/lib/admin-auth'

/**
 * ลบ session ทั้งใน DB และใน browser
 *
 * ลบแค่ cookie ไม่พอ — token ยังใช้ได้อยู่ใน DB ถ้ามีใครก๊อปไว้
 * ต้องลบฝั่ง server ด้วยเสมอ
 *
 * ตอบ 200 เสมอแม้ไม่มี session — logout ควรสำเร็จได้เรื่อย ๆ
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE)?.value
    if (token) await destroySession(token)

    const res = NextResponse.json({ ok: true })

    // ตัวเลือกต้องตรงกับตอน set เป๊ะ ไม่งั้นเบราว์เซอร์ถือว่าคนละ cookie แล้วลบไม่ออก
    res.cookies.set(ADMIN_COOKIE, '', sessionCookieOptions(new Date(0)))

    return res
  } catch (error) {
    console.error('[POST /api/admin/logout]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
