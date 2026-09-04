import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/admin-guard'
import { getAdminNavStats } from '@/lib/admin-stats'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

/**
 * ชั้นป้องกันจริงของ Admin Portal
 *
 * `middleware.ts` เช็กแค่ว่ามี cookie ไหม (ถูกกว่า เร็วกว่า ไม่แตะ DB)
 * ที่นี่คือที่ที่ตรวจว่า token **ใช้ได้จริง** และเจ้าของยัง active อยู่
 * cookie ปลอมจะผ่าน middleware มาได้ แต่มาตายตรงนี้
 *
 * `(protected)` เป็น route group — ไม่โผล่ใน URL ทำหน้าที่แค่แยกว่าหน้าไหน
 * อยู่หลัง guard หน้า `/admin/login` อยู่นอกกลุ่มนี้จึงเข้าได้โดยไม่ต้องล็อกอิน
 *
 * ⚠️ Server Component เท่านั้น — อย่าใส่ 'use client'
 *    ไม่งั้น getAdmin() จะรันบน browser แล้วหลุดทั้งชั้น
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')

  // นับหลัง guard เสมอ — คนที่ยังไม่ล็อกอินไม่ควรทำให้เรายิง query
  const stats = await getAdminNavStats()

  return (
    <div className="min-h-screen md:flex md:items-stretch">
      <AdminSidebar email={admin.email} displayName={admin.display_name} stats={stats} />
      <main className="flex-1 min-w-0 px-6 py-8">
        <div className="w-full" style={{ maxWidth: 1180 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
