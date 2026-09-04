/**
 * สร้าง admin user — ไม่มีหน้าสมัคร ต้องใช้ script นี้เท่านั้น
 *
 *   npx tsx scripts/create-admin.ts <email> <password> [ชื่อที่แสดง]
 *   npx tsx scripts/create-admin.ts admin@cardly.app 'รหัสยาวอย่างน้อย12ตัว' 'Issara'
 *
 * มีอยู่แล้ว → อัปเดตรหัสผ่านและเตะทุก session ออก (ใช้เป็นตัว reset password ได้)
 *
 * ⚠️ รหัสผ่านจะติดอยู่ใน shell history — เปลี่ยนทันทีหลังใช้บนเครื่องที่ใช้ร่วมกัน
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const [email, password, displayName] = process.argv.slice(2)

if (!email || !password) {
  console.error('ใช้: npx tsx scripts/create-admin.ts <email> <password> [ชื่อที่แสดง]')
  process.exit(1)
}

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error(`❌ อีเมลไม่ถูกต้อง: ${email}`)
  process.exit(1)
}

// import ทีหลังเพราะ lib/prisma อ่าน DATABASE_URL ตอน import — env ต้องโหลดก่อน
async function main() {
  const { hashPassword, destroyAllSessions } = await import('../lib/admin-auth')
  const { prisma } = await import('../lib/prisma')

  const normalized = email.trim().toLowerCase()
  const password_hash = await hashPassword(password)   // โยน error เองถ้ารหัสสั้นไป

  const existing = await prisma.admin_users.findUnique({ where: { email: normalized } })

  if (existing) {
    await prisma.admin_users.update({
      where: { id: existing.id },
      data: {
        password_hash,
        display_name: displayName ?? existing.display_name,
        is_active: true,
        // ตั้งรหัสใหม่แล้วต้องปลดล็อกให้ด้วย — ไม่งั้นเปลี่ยนรหัสเสร็จ
        // ยังเข้าไม่ได้อีก 15 นาที · script นี้จึงใช้เป็นตัวปลดล็อกได้ในตัว
        failed_attempts: 0,
        locked_until: null,
        updated_date: new Date(),
        updated_by: 'create-admin',
      },
    })
    // เปลี่ยนรหัสแล้วต้องเตะทุกอุปกรณ์ออก ไม่งั้น session เก่ายังใช้ได้
    await destroyAllSessions(existing.id)
    console.log(`✅ อัปเดตรหัสผ่านของ ${normalized} แล้ว · session เดิมถูกยกเลิกทั้งหมด`)
    return
  }

  const user = await prisma.admin_users.create({
    data: {
      email: normalized,
      password_hash,
      display_name: displayName ?? null,
      created_by: 'create-admin',
    },
  })
  console.log(`✅ สร้าง admin: ${user.email}${user.display_name ? ` (${user.display_name})` : ''}`)

  const total = await prisma.admin_users.count()
  console.log(`   admin ทั้งหมดในระบบ: ${total}`)
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1) })
  .then(() => process.exit(0))
