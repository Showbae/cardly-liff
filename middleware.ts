import { NextRequest, NextResponse } from 'next/server'

/**
 * ด่านหน้าของทุก request ที่ตรง `config.matcher` ข้างล่าง
 *
 * ── ทำอะไรและไม่ทำอะไร ────────────────────────────────────────────────
 *
 * middleware เช็กแค่ว่า **มี session cookie ติดมาไหม** ไม่ได้ตรวจว่า token
 * นั้นใช้ได้จริง เพราะการตรวจจริงต้อง query DB ซึ่งจะรันทุก request ที่ตรง
 * matcher — เปลืองและช้าโดยไม่จำเป็น
 *
 * งานของมันคือ **เด้ง request ที่ไม่มี cookie ออกตั้งแต่ต้นทาง** ซึ่งครอบ
 * เคสส่วนใหญ่ (คนที่ยังไม่ล็อกอิน) ส่วน cookie ปลอมจะผ่านด่านนี้ไปได้ และ
 * ไปตายที่ชั้นสองแทน:
 *
 *   Server Component / layout  → `getAdmin()`   จาก lib/admin-guard
 *   Route handler /api/admin/* → `requireAdmin()` จาก lib/admin-guard
 *
 * **ทั้งสองที่ต้องเรียกเสมอ** — อย่าคิดว่า middleware กันให้แล้ว
 *
 * ── หมายเหตุสำหรับ tech-debt 🔴 2 (session auth ของ LIFF) ──────────────
 *
 * งานนั้นจะเพิ่ม `liffGuard` เข้ามาในไฟล์นี้ ซึ่งตรวจจาก
 * `Authorization: Bearer` แทน cookie · โครงข้างล่างแยกฟังก์ชันไว้ให้แล้ว
 * ให้เติม `liffGuard` แล้วขยาย `matcher` — อย่าเขียนทับ `adminGuard`
 */

const ADMIN_COOKIE = 'cardly_admin_session'

/**
 * ด่านที่ 0 · `/admin` ควรมองเห็นได้จากที่นี่ไหม
 *
 * `npm run dev:tunnel` เปิด ngrok ด้วย domain ตายตัวชี้มาที่ `next dev`
 * ตัวเดียวกับที่มี `/admin` อยู่ — ทุกครั้งที่รัน tunnel เพื่อเทส LIFF
 * หน้า admin ก็เปิดสู่อินเทอร์เน็ตไปด้วย และต่อกับ Supabase ตัวจริง
 * เรื่องเดียวกันนี้เกิดกับ preview deployment ของ Vercel
 *
 * **เป็นตัวกันพลาด ไม่ใช่กำแพง** — Host header เป็นสิ่งที่ client ส่งมาเอง
 * ปลอมได้ · กำแพงจริงยังคือรหัสผ่านกับ account lockout ใน lib/admin-auth
 * ที่มันกันคือการเปิดโดยไม่ได้ตั้งใจ: bot ที่ไต่ URL · คนที่บังเอิญเจอ
 * ngrok domain · preview build ที่ลืมคิดถึง
 *
 * ตอบ 404 ไม่ใช่ 403 — 403 บอกว่ามีของอยู่ตรงนี้แต่เข้าไม่ได้
 * 404 ไม่บอกว่ามีอะไรอยู่เลย
 *
 * **ห้ามใช้ `NODE_ENV === 'development'` แทน** — `dev:tunnel` รัน
 * `next dev` เหมือนกัน เช็ก NODE_ENV แล้วจะปล่อยผ่านเคสที่ตั้งใจกันพอดี
 */
function isAdminReachable(req: NextRequest): boolean {
  const host = req.headers.get('host') ?? ''
  const isLocal =
    host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('[::1]')

  return isLocal || process.env.ENABLE_ADMIN === 'true'
}

function adminGuard(req: NextRequest): NextResponse {
  const hasCookie = Boolean(req.cookies.get(ADMIN_COOKIE)?.value)
  if (hasCookie) return NextResponse.next()

  // API ตอบ 401 · หน้าเว็บเด้งไป login พร้อมจำปลายทางไว้
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/admin/login', req.url)
  loginUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(loginUrl)
}

export function middleware(req: NextRequest): NextResponse {
  const path = req.nextUrl.pathname

  // เช็กว่าเป็น path ของ admin ก่อน แล้วค่อยทำงานข้างใน — ไม่ใช่เช็กที่ต้น
  // ฟังก์ชัน · ตอนงาน liffGuard ขยาย matcher มาครอบ (liff) ด้วย 404 ข้างล่าง
  // จะได้ไม่เผลอไปตกใส่หน้าที่ user LINE ต้องเข้าได้
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    // ต้องมา **ก่อน** ข้อยกเว้นหน้า login ไม่งั้น /admin/login ยังโผล่ให้เห็น
    // จากข้างนอก ซึ่งเท่ากับประกาศว่ามี admin portal อยู่ที่โดเมนนี้
    if (!isAdminReachable(req)) return new NextResponse(null, { status: 404 })

    // หน้า login กับ API login/logout ต้องเข้าถึงได้โดยไม่ต้องมี session
    if (path === '/admin/login' || path.startsWith('/api/admin/login') || path.startsWith('/api/admin/logout')) {
      return NextResponse.next()
    }

    return adminGuard(req)
  }

  return NextResponse.next()
}

export const config = {
  // ครอบ API ด้วย — guard ใน layout.tsx ไม่กัน route handler
  // ห้ามครอบ (liff) หรือ /api/cards/* ไม่งั้น user LINE เข้าแอปไม่ได้
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
