/**
 * One-time script: renders rich menu image → registers with LINE API → sets as default.
 * Run: npm run setup:rich-menu
 *
 * Requires in .env.local:
 *   LINE_CHANNEL_ACCESS_TOKEN=<channel access token from LINE Developers Console>
 *   NEXT_PUBLIC_LIFF_ID=<your LIFF ID>
 */

import puppeteer from 'puppeteer-core'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { execSync } from 'child_process'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// ── Config ─────────────────────────────────────────────────────────

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID

const LINE_API      = 'https://api.line.me/v2/bot'
const LINE_DATA_API = 'https://api-data.line.me/v2/bot'

const MENU_WIDTH  = 2500
const MENU_HEIGHT = 843

// Tap areas: 3 equal columns
const AREAS = [
  {
    bounds: { x: 0,    y: 0, width: 833,  height: MENU_HEIGHT },
    action: { type: 'uri', uri: `https://liff.line.me/${LIFF_ID}` },
  },
  {
    bounds: { x: 833,  y: 0, width: 834,  height: MENU_HEIGHT },
    action: { type: 'uri', uri: `https://liff.line.me/${LIFF_ID}/promo` },
  },
  {
    bounds: { x: 1667, y: 0, width: 833,  height: MENU_HEIGHT },
    action: { type: 'message', text: 'จดรายจ่าย' },
  },
]

// ── Helpers ─────────────────────────────────────────────────────────

function findChrome(): string {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  // Try `which google-chrome` as fallback
  try {
    return execSync('which google-chrome').toString().trim()
  } catch {
    throw new Error(
      'Chrome / Chromium not found. Install Google Chrome or set CHROME_PATH env var.'
    )
  }
}

async function captureImage(): Promise<Buffer> {
  const chromePath = process.env.CHROME_PATH ?? findChrome()
  console.log(`  Using browser: ${chromePath}`)

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: MENU_WIDTH, height: MENU_HEIGHT, deviceScaleFactor: 1 })

  const htmlPath = path.resolve(__dirname, 'rich-menu-image.html')
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' })

  // Small delay to ensure fonts + gradients are rendered
  await new Promise(r => setTimeout(r, 400))

  const screenshot = await page.screenshot({ type: 'png', fullPage: false })
  await browser.close()

  return Buffer.from(screenshot)
}

async function linePost(url: string, body?: object): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`LINE API ${res.status}: ${text}`)
  return text ? JSON.parse(text) : {}
}

async function createMenu(): Promise<string> {
  const data = (await linePost(`${LINE_API}/richmenu`, {
    size: { width: MENU_WIDTH, height: MENU_HEIGHT },
    selected: true,
    name: 'Cardly Rose Gold Menu',
    chatBarText: 'เมนู Cardly',
    areas: AREAS,
  })) as { richMenuId: string }
  return data.richMenuId
}

async function uploadImage(richMenuId: string, image: Buffer): Promise<void> {
  const res = await fetch(`${LINE_DATA_API}/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'image/png',
    },
    body: image,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Upload ${res.status}: ${text}`)
}

async function setDefault(richMenuId: string): Promise<void> {
  await linePost(`${LINE_API}/user/all/richmenu/${richMenuId}`)
}

async function deleteMenu(richMenuId: string): Promise<void> {
  const res = await fetch(`${LINE_API}/richmenu/${richMenuId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  if (!res.ok && res.status !== 404) {
    const text = await res.text()
    console.warn(`  Warning: could not delete ${richMenuId}: ${text}`)
  }
}

async function listMenus(): Promise<string[]> {
  const res = await fetch(`${LINE_API}/richmenu/list`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  const data = (await res.json()) as { richmenus?: { richMenuId: string }[] }
  return data.richmenus?.map(m => m.richMenuId) ?? []
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  // Validate env
  if (!TOKEN) {
    console.error('❌  LINE_CHANNEL_ACCESS_TOKEN is not set in .env.local')
    console.error('   Get it from: https://developers.line.biz/ → your channel → Messaging API → Channel access token')
    process.exit(1)
  }
  if (!LIFF_ID) {
    console.error('❌  NEXT_PUBLIC_LIFF_ID is not set in .env.local')
    process.exit(1)
  }

  console.log('🗑   Deleting existing rich menus...')
  const existing = await listMenus()
  for (const id of existing) {
    await deleteMenu(id)
    console.log(`    Deleted ${id}`)
  }

  console.log('\n📸  Rendering rich menu image (2500 × 843)...')
  const image = await captureImage()

  // Save PNG for inspection
  const outPath = path.resolve(__dirname, 'rich-menu.png')
  fs.writeFileSync(outPath, image)
  console.log(`    Saved → ${outPath}`)

  console.log('\n📋  Creating rich menu structure on LINE...')
  const richMenuId = await createMenu()
  console.log(`    richMenuId: ${richMenuId}`)

  console.log('\n🖼   Uploading image...')
  await uploadImage(richMenuId, image)
  console.log('    Done')

  console.log('\n✅  Setting as default menu for all users...')
  await setDefault(richMenuId)

  console.log('\n🎉  Rich menu is live!')
  console.log(`    Preview: https://developers.line.biz/console/ → Messaging API → Rich menu`)
  console.log(`    richMenuId: ${richMenuId}`)
}

main().catch(err => {
  console.error('\n❌ ', err.message)
  process.exit(1)
})
