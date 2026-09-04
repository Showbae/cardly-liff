/**
 * ตัวช่วยยืนยันตัวตน admin สำหรับ route handler และ Server Component
 *
 * แยกจาก `lib/admin-auth.ts` เพราะไฟล์นั้นไม่ผูกกับ Next.js — เทสง่ายกว่า
 * ส่วนไฟล์นี้เป็นตัวเชื่อมเข้ากับ request/cookie ของ Next
 *
 * ── การป้องกันมีสองชั้น ───────────────────────────────────────────────
 *
 *   ชั้น 1 · middleware.ts  เช็กแค่ว่า "มี cookie ไหม" → เด้งออกเร็ว ไม่แตะ DB
 *   ชั้น 2 · ไฟล์นี้         เช็กจริงกับ DB ว่า token ใช้ได้และเจ้าของยัง active
 *
 * ชั้น 1 อย่างเดียวไม่พอ — cookie ปลอมผ่านได้ · ชั้น 2 จึงเป็นตัวตัดสินจริง
 * และ **ทุก route ใน /api/admin ต้องเรียก requireAdmin เสมอ**
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE, getSession, type AdminIdentity } from '@/lib/admin-auth'

/** ใช้ใน route handler ที่มี NextRequest */
export async function getAdminFromRequest(req: NextRequest): Promise<AdminIdentity | null> {
  return getSession(req.cookies.get(ADMIN_COOKIE)?.value)
}

/** ใช้ใน Server Component / layout ที่ไม่มี request object */
export async function getAdmin(): Promise<AdminIdentity | null> {
  const store = await cookies()
  return getSession(store.get(ADMIN_COOKIE)?.value)
}

/**
 * ใช้ต้นทางของทุก route ใน /api/admin
 *
 *   const auth = await requireAdmin(req)
 *   if (auth instanceof NextResponse) return auth      // 401 แล้ว
 *   // auth.email ใช้เขียน updated_by ได้เลย
 */
export async function requireAdmin(req: NextRequest): Promise<AdminIdentity | NextResponse> {
  const admin = await getAdminFromRequest(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return admin
}
