import { describe, it, expect } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  safeTokenEqual,
  sessionCookieOptions,
  ADMIN_COOKIE,
  SESSION_TTL_DAYS,
  MIN_PASSWORD_LENGTH,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_MINUTES,
} from './admin-auth'

// เทสเฉพาะส่วนที่ไม่แตะ DB — createSession/getSession/login ต้องมี Postgres
// จริงจึงทดสอบด้วย script แยก (ดูหมายเหตุท้ายไฟล์)

describe('hashPassword / verifyPassword', () => {
  it('hash แล้ว verify กลับได้', async () => {
    const h = await hashPassword('correct-horse-battery')
    expect(await verifyPassword(h, 'correct-horse-battery')).toBe(true)
  })

  it('ปฏิเสธรหัสผิด', async () => {
    const h = await hashPassword('correct-horse-battery')
    expect(await verifyPassword(h, 'correct-horse-batteryX')).toBe(false)
  })

  it('ใช้ argon2id', async () => {
    const h = await hashPassword('correct-horse-battery')
    expect(h.startsWith('$argon2id$')).toBe(true)
  })

  it('salt ต่างกันทุกครั้ง — รหัสเดียวกันได้ hash คนละตัว', async () => {
    const [a, b] = await Promise.all([
      hashPassword('correct-horse-battery'),
      hashPassword('correct-horse-battery'),
    ])
    expect(a).not.toBe(b)
    expect(await verifyPassword(a, 'correct-horse-battery')).toBe(true)
    expect(await verifyPassword(b, 'correct-horse-battery')).toBe(true)
  })

  it(`ปฏิเสธรหัสสั้นกว่า ${MIN_PASSWORD_LENGTH} ตัว`, async () => {
    await expect(hashPassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).rejects.toThrow(
      new RegExp(String(MIN_PASSWORD_LENGTH)),
    )
  })

  it(`รับรหัสยาวพอดี ${MIN_PASSWORD_LENGTH} ตัว`, async () => {
    const h = await hashPassword('a'.repeat(MIN_PASSWORD_LENGTH))
    expect(await verifyPassword(h, 'a'.repeat(MIN_PASSWORD_LENGTH))).toBe(true)
  })

  it('hash เสียรูปคืน false ไม่ crash', async () => {
    expect(await verifyPassword('not-a-hash', 'anything')).toBe(false)
    expect(await verifyPassword('', 'anything')).toBe(false)
  })
})

describe('generateSessionToken', () => {
  it('ยาว 64 ตัวอักษร ตรงกับ CHECK ใน DB', () => {
    expect(generateSessionToken()).toHaveLength(64)
  })

  it('เป็น hex ล้วน', () => {
    expect(generateSessionToken()).toMatch(/^[0-9a-f]{64}$/)
  })

  it('ไม่ใช่รูปแบบ UUID', () => {
    expect(generateSessionToken()).not.toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('สุ่มไม่ซ้ำ — 1,000 ครั้งได้ค่าไม่ซ้ำเลย', () => {
    const seen = new Set(Array.from({ length: 1000 }, () => generateSessionToken()))
    expect(seen.size).toBe(1000)
  })
})

describe('safeTokenEqual', () => {
  it('เท่ากันคืน true', () => {
    const t = generateSessionToken()
    expect(safeTokenEqual(t, t)).toBe(true)
  })

  it('ต่างกันคืน false', () => {
    expect(safeTokenEqual(generateSessionToken(), generateSessionToken())).toBe(false)
  })

  it('ความยาวต่างกันคืน false ไม่ throw', () => {
    expect(safeTokenEqual('abc', 'abcdef')).toBe(false)
  })
})

describe('sessionCookieOptions', () => {
  const opts = sessionCookieOptions(new Date('2026-12-31'))

  it('httpOnly — JS อ่านไม่ได้ กัน XSS ขโมย token', () => {
    expect(opts.httpOnly).toBe(true)
  })

  it('sameSite lax — กัน CSRF จากเว็บอื่น', () => {
    expect(opts.sameSite).toBe('lax')
  })

  it('path ครอบทั้งเว็บ', () => {
    expect(opts.path).toBe('/')
  })

  it('secure ปิดใน dev เพื่อให้ http localhost ใช้ได้', () => {
    expect(opts.secure).toBe(process.env.NODE_ENV === 'production')
  })
})

describe('ค่าคงที่', () => {
  it('ชื่อ cookie ไม่ชนกับของ LIFF', () => {
    expect(ADMIN_COOKIE).toBe('cardly_admin_session')
  })

  it('อายุ session เป็นบวก', () => {
    expect(SESSION_TTL_DAYS).toBeGreaterThan(0)
  })

  it('เกณฑ์ล็อกบัญชีมากกว่า 1 — ไม่ล็อกตั้งแต่พิมพ์ผิดครั้งแรก', () => {
    expect(MAX_FAILED_ATTEMPTS).toBeGreaterThan(1)
  })

  it('ระยะล็อกนานพอให้ brute force ไม่คุ้ม แต่ไม่นานจนคนใช้จริงเดือดร้อน', () => {
    expect(LOCKOUT_MINUTES).toBeGreaterThanOrEqual(5)
    expect(LOCKOUT_MINUTES).toBeLessThanOrEqual(60)
  })
})
