import { prisma } from '@/lib/prisma'

/**
 * ตัวเลขที่แถบข้างของ Admin Portal ต้องใช้
 *
 * มีอยู่เพื่อให้ "ของที่ต้องเห็นตลอดเวลา" มีที่อยู่ถาวร ไม่ใช่ต้องเข้าไปหาเอง
 */

/**
 * ค่าแต้มที่ตรวจครั้งล่าสุดเกินกี่เดือนถือว่า "เก่า"
 *
 * ทำไมต้องมีตัวเลขนี้เลย — `effective_rate_pct` ของ **ทุกแถว ของทุกบัตร**
 * ในโปรแกรมหนึ่ง คำนวณจาก `point_value_thb` ตัวเดียว ถ้าธนาคารลดค่าแต้มแล้ว
 * เราไม่รู้ ระบบจะแนะนำบัตรผิดทั้งกระดานโดยไม่มีอะไรฟ้องสักอย่าง
 * `valuation_checked_at` คือคอลัมน์เดียวที่ตอบได้ว่าตัวเลขเก่าไปหรือยัง
 *
 * ⚠️ 6 เดือนเป็นค่าที่ตั้งขึ้นเอง ยังไม่ได้อิงอะไร — ถ้าจะเปลี่ยนให้แก้ที่นี่
 *    ที่เดียว และถ้าวันหนึ่งแต่ละธนาคารต้องใช้เกณฑ์ต่างกัน ค่านี้ต้องย้ายไป
 *    เป็นคอลัมน์ใน `point_programs` แทน
 */
export const STALE_VALUATION_MONTHS = 6

export interface AdminNavStats {
  cardCount: number
  programCount: number
  /** โปรแกรมที่ยังไม่ได้ตรวจค่าแต้มเกิน STALE_VALUATION_MONTHS */
  staleProgramCount: number
  promoCount: number
  /**
   * โปรที่สถานะยังเป็น 'active' ทั้งที่เลยวันจบแล้ว
   *
   * ต้องติดไว้บนแถบข้างด้วยเหตุผลเดียวกับค่าแต้มเก่า — เป็นข้อมูลผิดที่
   * **ผู้ใช้เห็นอยู่จริงบนแอปตอนนี้** และไม่มีอะไรฟ้องถ้าไม่มีใครเปิดดู
   */
  expiredActivePromoCount: number
  merchantCount: number
  /** ร้านที่ยังไม่จัดหมวด — จับคู่กับอัตราของหมวดไหนไม่ได้เลย */
  uncategorizedMerchantCount: number
}

export function staleBefore(now: Date = new Date()): Date {
  const d = new Date(now)
  d.setMonth(d.getMonth() - STALE_VALUATION_MONTHS)
  return d
}

export async function getAdminNavStats(): Promise<AdminNavStats> {
  const [
    cardCount,
    programCount,
    staleProgramCount,
    promoCount,
    expiredActivePromoCount,
    merchantCount,
    uncategorizedMerchantCount,
  ] = await Promise.all([
    prisma.credit_cards.count(),
    prisma.point_programs.count(),
    prisma.point_programs.count({
      where: { valuation_checked_at: { lt: staleBefore() } },
    }),
    prisma.promotions.count(),
    prisma.promotions.count({
      where: { status: 'active', end_date: { lt: new Date() } },
    }),
    prisma.merchants.count(),
    prisma.merchants.count({ where: { category_id: null } }),
  ])

  return {
    cardCount,
    programCount,
    staleProgramCount,
    promoCount,
    expiredActivePromoCount,
    merchantCount,
    uncategorizedMerchantCount,
  }
}
