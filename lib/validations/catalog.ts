/**
 * Zod schema สำหรับหมวดใช้จ่ายและร้านค้า
 *
 * สองตารางนี้เป็นแกนที่เชื่อม `merchants` ↔ `promotions` ↔ `card_base_benefit`
 * เข้าด้วยกัน — ระบบแนะนำบัตรทำงานได้เพราะรู้ว่าร้านนี้อยู่หมวดไหน
 * แล้วหมวดนั้นบัตรไหนให้ดีสุด (docs/data-model.md → กลุ่ม 3)
 */

import { z } from 'zod'

const uuid = z.string().uuid()
const optionalText = z.string().trim().min(1).nullable().optional()

export const categorySchema = z.object({
  name_th: z.string().trim().min(1),
  name_eng: optionalText,

  // emoji ที่ใช้จริงบนหน้าจอ LIFF — ไม่ใช่ชื่อ icon set
  icon: z.string().trim().min(1).max(8).nullable().optional(),

  sort_order: z.number().int().min(0).nullable().optional(),
})

export const merchantSchema = z.object({
  name_th: z.string().trim().min(1),
  name_eng: optionalText,
  logo_url: z.string().url().nullable().optional(),
  category_id: uuid.nullable().optional(),

  // รหัสประเภทร้านมาตรฐานบัตรเครดิต 4 หลัก — ใช้ตอน reconcile กับ statement
  // ต้องเป็นตัวเลขล้วน ไม่งั้นจับคู่กับ statement ไม่ได้
  mcc_code: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'MCC ต้องเป็นตัวเลข 4 หลัก')
    .nullable()
    .optional(),
})

export type CategoryInput = z.infer<typeof categorySchema>
export type MerchantInput = z.infer<typeof merchantSchema>
