import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * รวม class name แบบที่ class ทีหลังชนะเสมอ
 *
 * `clsx` จัดการ conditional (`{ 'x': cond }`) ส่วน `twMerge` แก้ปัญหาที่
 * Tailwind สอง class ชนกัน เช่น `px-2 px-4` → เหลือ `px-4` ไม่ใช่ทั้งคู่
 * ซึ่งจำเป็นเวลาส่ง className มา override component
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
