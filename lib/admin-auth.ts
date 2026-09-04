/**
 * Auth ของ Admin Portal — hash รหัสผ่าน + จัดการ session
 *
 * ใช้ตาราง `admin_users` / `admin_sessions` ซึ่งแยกจาก `users` / `sessions`
 * ที่เป็นของ LINE user คนละชุดกันสิ้นเชิง (การตัดสินใจข้อ 10 · docs/admin-portal.md)
 *
 * ⚠️ ไฟล์นี้ใช้ Node.js API (crypto, argon2) — เรียกจาก server เท่านั้น
 *    middleware เรียก `getSession` ได้เพราะรันบน Node runtime (Fluid Compute)
 */

import { randomBytes, timingSafeEqual } from 'node:crypto'
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2'
import { prisma } from '@/lib/prisma'

/** ชื่อ cookie ที่เก็บ session token */
export const ADMIN_COOKIE = 'cardly_admin_session'

/** อายุ session — sliding: ทุกครั้งที่ใช้งานจะต่ออายุจากตอนนั้น */
export const SESSION_TTL_DAYS = 7

/** กรอกรหัสผิดติดกันกี่ครั้งถึงล็อกบัญชี */
export const MAX_FAILED_ATTEMPTS = 5

/** ล็อกนานกี่นาที — ปลดเองเมื่อเลยเวลา ไม่ต้องมีใครไปปลด */
export const LOCKOUT_MINUTES = 15

/**
 * hash ของสตริงสุ่มที่ไม่มีใครรู้ — ใช้เผาเวลาตอน email ไม่มีในระบบ
 * เพื่อให้ "ไม่มี user คนนี้" กับ "รหัสผิด" ใช้เวลาใกล้เคียงกัน
 * ไม่งั้นคนนอกจะไล่เดาได้ว่า email ไหนมีอยู่จริงจากเวลาที่ตอบกลับ
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$ZQfDGX2MSW03C82igJHqQA$yrVjah5ZiVd+DbaNZ6wGZtHY0EUgF9ARWhW4w+a/7Ws'

// ── รหัสผ่าน ────────────────────────────────────────────────────────────

/** ความยาวขั้นต่ำของรหัสผ่าน — 8 ตัวตามที่ NIST SP 800-63B กำหนดเป็นพื้น */
export const MIN_PASSWORD_LENGTH = 8

/** argon2id พร้อม default ของไลบรารี (m=19456, t=2, p=1) ตามที่ OWASP แนะนำ */
export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`)
  }
  return argonHash(plain)
}

export async function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  try {
    return await argonVerify(storedHash, plain)
  } catch {
    // hash เสียรูป — ถือว่าไม่ผ่าน ไม่ใช่ crash
    return false
  }
}

/** เผาเวลาให้เท่ากับการ verify จริง ใช้ตอนหา user ไม่เจอ */
export async function fakeVerify(plain: string): Promise<void> {
  await argonVerify(DUMMY_HASH, plain).catch(() => false)
}

// ── Session ─────────────────────────────────────────────────────────────

/**
 * 32 bytes → hex 64 ตัวอักษร ตรงกับ CHECK (length(token) >= 64) ใน DB
 *
 * **ห้ามใช้ UUID** — UUID v4 ออกแบบมาให้ไม่ซ้ำ ไม่ได้ออกแบบมาให้เดาไม่ได้
 * มี entropy 122 bits และบาง implementation ใช้ PRNG ที่ไม่ใช่ CSPRNG
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

function expiryFromNow(): Date {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
}

export interface AdminIdentity {
  id: string
  email: string
  display_name: string | null
}

export async function createSession(adminUserId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken()
  const expiresAt = expiryFromNow()

  await prisma.admin_sessions.create({
    data: { admin_user_id: adminUserId, token, expires_at: expiresAt },
  })

  return { token, expiresAt }
}

/**
 * คืนตัวตนของ admin ถ้า token ยังใช้ได้ · null ถ้าไม่
 *
 * เช็ก 3 อย่าง: token มีจริง · ยังไม่หมดอายุ · เจ้าของยัง active
 * ข้อสุดท้ายสำคัญ — ปิดบัญชีแล้ว session เดิมต้องใช้ไม่ได้ทันที
 * ไม่ใช่รอจนหมดอายุเอง
 */
export async function getSession(token: string | undefined): Promise<AdminIdentity | null> {
  if (!token) return null

  const session = await prisma.admin_sessions.findUnique({
    where: { token },
    include: { admin_users: true },
  })

  if (!session) return null
  if (session.expires_at <= new Date()) {
    await destroySession(token)
    return null
  }
  if (!session.admin_users.is_active) return null

  // sliding expiry — ใช้งานอยู่ก็ไม่โดนเตะออกกลางคัน
  await prisma.admin_sessions.update({
    where: { token },
    data: { last_used_at: new Date(), expires_at: expiryFromNow() },
  })

  return {
    id: session.admin_users.id,
    email: session.admin_users.email,
    display_name: session.admin_users.display_name,
  }
}

export async function destroySession(token: string): Promise<void> {
  await prisma.admin_sessions.deleteMany({ where: { token } })
}

/** ใช้ตอนเปลี่ยนรหัสผ่านหรือปิดบัญชี — เตะทุกอุปกรณ์ออก */
export async function destroyAllSessions(adminUserId: string): Promise<void> {
  await prisma.admin_sessions.deleteMany({ where: { admin_user_id: adminUserId } })
}

/** เก็บกวาด session ที่หมดอายุ — เรียกจาก cron หรือตอน login */
export async function purgeExpiredSessions(): Promise<number> {
  const { count } = await prisma.admin_sessions.deleteMany({
    where: { expires_at: { lte: new Date() } },
  })
  return count
}

// ── Login ───────────────────────────────────────────────────────────────

export type LoginResult =
  | { ok: true; identity: AdminIdentity; token: string; expiresAt: Date }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'locked'; until: Date }

/**
 * ตรวจ email + password แล้วสร้าง session
 *
 * ── เรื่องที่ตั้งใจออกแบบ ─────────────────────────────────────────────
 *
 * `invalid` ครอบทั้ง "ไม่มี email นี้" และ "รหัสผิด" — ต้องแยกไม่ออกจาก
 * ภายนอก ทั้งข้อความและเวลาที่ใช้ (ดู `fakeVerify`)
 *
 * `locked` แยกออกมาเพราะถ้าไม่บอก คนที่ลืมรหัสจะงงว่าทำไมรหัสที่ถูกก็เข้าไม่ได้
 * มันรั่วข้อมูลว่าบัญชีนี้มีอยู่จริง — แต่รั่วให้เฉพาะคนที่ยิงผิดครบ 5 ครั้ง
 * กับ email นั้นแล้ว ซึ่งแปลว่าเขาเจาะบัญชีนี้อยู่ตั้งแต่แรก ไม่ได้ได้ข้อมูลใหม่
 *
 * ไม่ต่ออายุล็อกเมื่อยิงซ้ำตอนกำลังล็อกอยู่ — ไม่งั้นคนอื่นยิงรัว ๆ
 * จะล็อกบัญชีคุณไว้ตลอดกาลได้
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.admin_users.findUnique({
    where: { email: email.trim().toLowerCase() },
  })

  if (!user || !user.is_active) {
    await fakeVerify(password)   // เผาเวลาให้เท่ากับการ verify จริง
    return { ok: false, reason: 'invalid' }
  }

  const now = new Date()

  if (user.locked_until && user.locked_until > now) {
    await fakeVerify(password)
    return { ok: false, reason: 'locked', until: user.locked_until }
  }

  const ok = await verifyPassword(user.password_hash, password)

  if (!ok) {
    // ถ้าล็อกเก่าหมดอายุแล้ว เริ่มนับใหม่จาก 0
    const expired = user.locked_until != null && user.locked_until <= now
    const attempts = (expired ? 0 : user.failed_attempts) + 1
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS

    await prisma.admin_users.update({
      where: { id: user.id },
      data: {
        failed_attempts: shouldLock ? 0 : attempts,   // ล็อกแล้ว reset ตัวนับ
        locked_until: shouldLock
          ? new Date(now.getTime() + LOCKOUT_MINUTES * 60_000)
          : null,
      },
    })

    if (shouldLock) {
      return {
        ok: false,
        reason: 'locked',
        until: new Date(now.getTime() + LOCKOUT_MINUTES * 60_000),
      }
    }
    return { ok: false, reason: 'invalid' }
  }

  await prisma.admin_users.update({
    where: { id: user.id },
    data: { last_login: now, failed_attempts: 0, locked_until: null },
  })

  const { token, expiresAt } = await createSession(user.id)
  return {
    ok: true,
    identity: { id: user.id, email: user.email, display_name: user.display_name },
    token,
    expiresAt,
  }
}

// ── Cookie ──────────────────────────────────────────────────────────────

/**
 * ตัวเลือก cookie ที่ใช้ทั้งตอน login และ logout — ต้องตรงกันเป๊ะ
 * ไม่งั้นเบราว์เซอร์จะไม่ถือว่าเป็น cookie ตัวเดียวกันแล้วลบไม่ออก
 */
export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,                                    // JS อ่านไม่ได้ กัน XSS ขโมย token
    secure: process.env.NODE_ENV === 'production',     // dev ใช้ http ได้
    sameSite: 'lax' as const,                          // กัน CSRF จากเว็บอื่น
    path: '/',
    expires: expiresAt,
  }
}

/** เทียบ token แบบไม่รั่วข้อมูลผ่านเวลาที่ใช้เปรียบเทียบ */
export function safeTokenEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
