/**
 * Shell ของ Admin Portal
 *
 * จงใจไม่ใส่ auth guard ตรงนี้ เพราะหน้า `/admin/login` อยู่ใน route group
 * เดียวกัน — ถ้า guard ที่นี่จะเด้งตัวเองวนไม่รู้จบ
 *
 * Guard จริงอยู่ที่ `app/(admin)/(protected)/layout.tsx` ซึ่งครอบเฉพาะหน้า
 * ที่ต้องล็อกอิน (Phase 3) · ส่วน middleware.ts เป็นด่านแรกที่เด้ง request
 * ที่ไม่มี cookie ออกก่อนถึงที่นี่
 *
 * ไม่ใช้ LiffLayout เพราะ admin ไม่ได้เปิดใน LINE — ไม่มี tab bar, ไม่มี swipe lock
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg text-ink">{children}</div>
}
