import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { middleware } from './middleware'

/**
 * เทสของด่านที่ 0 (`isAdminReachable`) เท่านั้น
 *
 * ด่านที่ 1 (cookie) กับด่านที่ 2 (`getAdmin`/`requireAdmin`) มีเทสของตัวเอง
 * ที่ lib/admin-auth.test.ts และ route test ของแต่ละ endpoint
 *
 * สิ่งที่ไฟล์นี้ต้องพิสูจน์คือ **404 มาก่อนทุกอย่าง** — รวมถึงมาก่อน
 * ข้อยกเว้นหน้า login ซึ่งเป็นจุดที่พลาดง่ายที่สุดถ้ามีคนมาเรียงลำดับใหม่
 */

const TUNNEL = 'padded-celtic-retouch.ngrok-free.dev'

function get(path: string, host: string) {
  return middleware(new NextRequest(`https://${host}${path}`, { headers: { host } }))
}

let saved: string | undefined

beforeEach(() => {
  saved = process.env.ENABLE_ADMIN
  delete process.env.ENABLE_ADMIN
})

afterEach(() => {
  if (saved === undefined) delete process.env.ENABLE_ADMIN
  else process.env.ENABLE_ADMIN = saved
})

describe('host ไม่ใช่ localhost และไม่ได้ตั้ง ENABLE_ADMIN', () => {
  it('ซ่อนหน้า admin', () => {
    expect(get('/admin/cards', TUNNEL).status).toBe(404)
  })

  it('ซ่อน **หน้า login** ด้วย — ไม่งั้นเท่ากับประกาศว่ามี admin portal อยู่', () => {
    expect(get('/admin/login', TUNNEL).status).toBe(404)
  })

  it('ตอบ 404 ไม่ใช่ 401 ที่ API login — 401 บอกว่า endpoint มีอยู่จริง', () => {
    expect(get('/api/admin/login', TUNNEL).status).toBe(404)
  })

  it('ไม่ยุ่งกับหน้าฝั่ง LIFF', () => {
    expect(get('/wallet', TUNNEL).status).toBe(200)
  })
})

describe('ทางที่ยังต้องเข้าได้', () => {
  it('localhost เข้าได้ — ตกไปเจอด่าน cookie ตามปกติ', () => {
    const res = get('/admin/cards', 'localhost:3000')
    expect(res.status).not.toBe(404)
    expect(res.headers.get('location')).toContain('/admin/login')
  })

  it('127.0.0.1 เข้าได้เหมือน localhost', () => {
    expect(get('/admin/cards', '127.0.0.1:3000').status).not.toBe(404)
  })

  it('ENABLE_ADMIN=true เปิดให้โดเมนจริงเข้าได้ (production)', () => {
    process.env.ENABLE_ADMIN = 'true'
    const res = get('/admin/cards', 'cardly.example.com')
    expect(res.status).not.toBe(404)
    expect(res.headers.get('location')).toContain('/admin/login')
  })

  it('ค่าอื่นที่ไม่ใช่ "true" ไม่นับว่าเปิด', () => {
    process.env.ENABLE_ADMIN = '1'
    expect(get('/admin/cards', 'cardly.example.com').status).toBe(404)
  })
})
