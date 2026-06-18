# Handoff: Cardly Home — Variant A (Search-led)

## Overview
Cardly is a Thai credit-card optimizer — "Google Maps for cards." Users add their cards once, then the app tells them **which card to swipe** at any given merchant to maximize cashback / points / miles. This handoff covers the **Home screen, variant A (Search-led)** and its companion **Search Result** screen.

The core product insight driving this design:
- **The wallet is an _input_, not the destination.** Users don't open the app to admire their cards — they open it to get an answer ("which card here?").
- **The pain is decision overload, not lack of data.** So the UI reduces everything to **one recommended answer**, with runner-ups available but de-emphasized.
- Home is a **decision tool**, not a data dashboard.

## About the Design Files
The files in this bundle are **design references created in HTML/React (via Babel in-browser)** — prototypes showing intended look and behavior, **not production code to copy directly**. The icons are inline SVG, the "phone" is a CSS frame for presentation, and state is hardcoded sample data.

Your task is to **recreate these designs in the target codebase's environment** (React Native, Flutter, native iOS/Android, or web) using its established components, navigation, and data layer. If no environment exists yet, choose the most appropriate stack for a mobile-first financial app. Treat the HTML as the source of truth for **layout, spacing, color, type, and copy** — not for architecture.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, iconography, and copy are specified. Recreate the UI pixel-faithfully using your codebase's component library, matching the exact tokens in the **Design Tokens** section below. The light/dark themes, brand color, and font are all tokenized and should map to your theming system.

> Note on scope: the design marks **Zone 4 (Savings) as "Phase 2"** and **Zone 5 (Feed) as "Phase 3–4"** — these are post-MVP. **MVP = Zones 1–3** (search hero, urgency alerts, cards entry) plus the **Search Result** screen. The Phase chips are annotations for planning and should NOT be rendered in the shipped UI.

---

## Screens / Views

### Screen 1 — Home (Search-led)
**Purpose:** Entry point. The user either (a) searches for a place to get a card recommendation, or (b) scans the urgency alerts for time-sensitive actions. A vertically scrolling screen.

**Layout:** Single column, mobile width (design frame 360–400px). Standard mobile app chrome: status bar (presentation only — use the OS status bar), a header, a scrollable body, and a fixed bottom tab bar. Body horizontal padding 20px (16px at `compact`, 18px at `cozy`). Vertical rhythm via section headers with `14px 2px 8px` margins.

Top-to-bottom zones:

**Header** (`.app-header`, padding `12px 20px 8px`)
- Title `h1`: **"วันนี้จะรูดที่ไหน?"** — 22px / weight 600 / line-height 1.1 / letter-spacing −0.3px, color `--ink`.
- Subtitle row: map-pin icon (12px) + **"ทองหล่อ · สวัสดีตอนเช้า, มินต์"** — 12px, color `--ink-3`.
- Right: circular icon button with **bell** icon (18px); a 7px red dot (`--warn`) badge top-right with a 1.5px `--surface` ring.

**Zone 1 — Search hero (THE star)**
- A large search field: row, padding `15px 16px`, `border-radius: var(--r-lg)` (18px), `background: --surface`, `border: 1.5px solid --line`, `box-shadow: --shadow-md`.
  - Left: **search** icon, 21px, stroke 2, color `--brand-700`.
  - Center: placeholder **"ค้นหาร้าน หมวด หรือธนาคาร"**, 15px, color `--ink-4`.
  - Right: a 32×32 rounded-10px button, `background: --brand-100`, color `--brand-700`, containing a **qr** icon (18px). (Scan-to-pay / scan promo entry.)
- Helper microcopy below, centered, 9px top margin: **"พิมพ์ชื่อร้าน แล้วเราจะบอกใบที่คุ้มสุดทันที"**, 12px (`.tiny`), color `--ink-4`.

**Category quick-access** (browse path, horizontally scrollable row, gap 12px, top margin 14px)
- 6 tiles, each: a 52×52 rounded-16px square, `background: --surface`, `border: 1px solid --line`, centered emoji 23px; label below 12px color `--ink-2`, nowrap.
- Categories (emoji + label): ☕ คาเฟ่ · 🍜 ร้านอาหาร · 🛒 ซูเปอร์ · ⛽ น้ำมัน · 🛍️ ช้อปปิ้ง · 🏥 โรงพยาบาล

**Recent searches** (row, gap 6px, top margin 14px, wraps)
- Leading label **"ล่าสุด"** 12px `--ink-4`.
- Chips (`.chip`): each with a **clock** icon (12px) + text. Values: **Starbucks**, **PT Station**, **Lotus's**.

**Zone 2 — Urgency ("ต้องรีบ")**
- Section header (`.sec-h`): h3 **"ต้องรีบ"** (13px/600) + "more" link **"ดูทั้งหมด"** (12px, `--brand-700`).
- 3 alert rows (`.list-row`, grid `40px 1fr auto`, gap 8px between rows). Each row: a 40×40 rounded-12px icon tile (tinted bg + colored icon 19px), a title (13px/600, wraps) + sub (11px, `--ink-3`), and a trailing status chip.

| # | Icon / tile | Title | Sub | Chip |
|---|---|---|---|---|
| 1 | `flame` on `--warn-bg` / `--warn` | โปร KBank ลด 15% ใกล้หมด | ร้านในห้าง · ใช้ก่อนหมดสิทธิ์ | **เหลือ 2 วัน** (`.chip.warn`) |
| 2 | `alert` on `--info-bg` / `--info` | SCB M ใช้ครบเพดาน cashback แล้ว | รอบนี้สลับไปใช้ KTC Forever แทน | **สลับใบ** (`.chip.brand`) |
| 3 | `gift` on `--gold-100` / `--gold-600` | อีก ฿1,200 ครบขั้นต่ำรับของแถม | UOB Privi · รูดให้ถึง ฿15,000 | **฿1,200** (`.chip.gold`) |

These three alert _types_ are the habit-loop engine: **expiring promo**, **cap reached → switch card**, **threshold to a reward**. They are the most product-specific part — preserve the semantics.

**Zone 3 — My Cards (quiet entry pill)**
- Centered, top margin 16px. NOT a card/list-row (deliberately lower visual weight than the alerts above).
- A fully-rounded pill (`border-radius: 999px`), `background: --surface`, `border: 1px solid --line`, `box-shadow: --shadow-sm`, padding `8px 16px 8px 12px`, row gap 10px:
  - A 38×24 cluster of **3 overlapping mini card swatches** (each 26×17, rounded 4px, rotated −12°/−3°/0°, using bank gradient classes `scb-m`, `ktc-cb`, `kbank-journey`; the front one carries a small shadow).
  - Label **"บัตรของฉัน · 5 ใบ"** (13px/600).
  - Trailing **chevronRight** icon (16px, stroke 2, `--ink-4`).
- Tapping navigates to the **Wallet tab** (card management — add/edit/delete lives there, NOT on Home).

**Fold divider** (presentation aid — keep or drop in production)
- A centered row: thin 1px `--line` rule, label **"เส้นพับจอ · เลื่อนเพื่อดูต่อ"** (12px `--ink-4`), thin rule. This marks the viewport fold in the mock; in production it's just where the first scroll ends.

**Zone 4 — Savings impact** _(Phase 2 — do not build for MVP)_
- Section header h3 **"ประหยัดเดือนนี้"** + a "Phase 2" annotation chip (remove in production).
- A brand-tinted card: padding `14px 16px`, `border-radius: var(--r-md)` (14px), `background: --brand-50`, `border: 1px solid --brand-100`, space-between:
  - Left: **"฿1,240"** at 26px/700, letter-spacing −0.5px, color `--brand-700`; sub **"จากการใช้บัตรถูกใบ 14 ครั้ง"** 11px `--ink-4`.
  - Right: 48×48 rounded-15px tile, `--brand-100` bg, `--brand-700` **trending** icon (23px).

**Zone 5 — Personalized feed** _(Phase 3–4 — do not build for MVP)_
- Section header h3 **"คัดมาให้คุณ"** + "Phase 3–4" annotation chip (remove in production).
- 2 alert rows (same `.list-row` structure), neutral `--surface-2` icon tiles:
  - `sparkle` — **การบินไทย · สะสมไมล์ x2** / ตรงกับ UOB Privi ที่คุณถือ / chip **x2** (`.chip.brand`)
  - `star` — **Central · คืน 12% วันเกิด** / ใช้ SCB M Legend / chip **12%** (`.chip.brand`)

**Bottom tab bar** (`.tabbar`, fixed, grid of equal columns)
- 4 tabs, each = icon (22px) over 10–11px label; active tab color `--brand-700` (`--brand-500` in dark), weight 600.
- Tabs: **หน้าหลัก** (`home`, active) · **บัตร** (`wallet`) · **โปร** (`tag`) · **ฉัน** (`user`).

---

### Screen 2 — Search Result (typed "Starbucks")
**Purpose:** The payoff of variant A. After the user searches a merchant, show the single best card plus ranked alternatives. This is where "reduce to one answer" matters most.

**Layout:** Same phone chrome. Header is an **active search bar**; body scrolls (`.scroll-y`).

**Header** (active search)
- Left: circular icon button, **back chevron** (chevronRight rotated 180°, 18px).
- Search pill, flex 1, padding `9px 13px`, `border-radius: 999px`, `background: --surface`, **`border: 1.5px solid --brand-600`** (focused state): search icon (17px, `--brand-700`) + query text **"Starbucks"** (14px/500) + an **x** clear icon (16px, `--ink-4`).

**Context line** (row, margin `4px 2px 12px`, 12px `--ink-3`)
- **mapPin** icon (13px) + **"Starbucks ทองหล่อ · 120 ม. · หมวดคาเฟ่"**.

**Winner card** (the answer)
- Container: `border-radius: var(--r-lg)` (18px), overflow hidden, `border: 1px solid --brand-100`, `box-shadow: --shadow-md`.
- **Header strip:** `background: --brand-700`, white text, padding `8px 14px`, space-between: label **"บัตรที่คุ้มที่สุดสำหรับร้านนี้"** (12px/700) + a gold chip (`.chip.gold`) **star + "คุ้มสุด"**.
- **Body** (padding 14px, `background: --surface`):
  - Card identity row (gap 12px): a **66×42 KBANK Journey swatch** (rounded 9px, gradient `--cc.kbank-journey`, drop shadow) + name **"KBANK Journey"** (15px/600) + sub **"Platinum · •••• 4521"** (`.tiny`, `--ink-4`).
  - Reward row (margin-top 14px, space-between):
    - Left: label **"ได้รับคืนจากบิลนี้"** (`.tiny --ink-4`) then a baseline row: **"฿45"** (26px/700, `--good`, letter-spacing −0.5) + **"15%"** (13px/600, `--good`).
    - Right: primary button — padding `11px 20px`, `border-radius: 999px`, `background: --brand-700`, white, 13px/600, label **"ใช้ใบนี้"** + **arrowUpRight** icon (15px).
  - Reason chips (row, gap 6px, margin-top 14px, wraps): **good** chip with check + **"x10 แต้มคาเฟ่"**; neutral chip **"ยังไม่ชนเพดาน"**; neutral chip **"ถึง 30 มิ.ย."**.

**Runner-ups** ("ใบอื่นที่ใช้ได้")
- Section header + "more" link **"เทียบทั้งหมด"**.
- 3 `.list-row` (grid `52px 1fr auto`, gap 8px): a 52×33 bank swatch + name/perk + right-aligned value block showing **"฿{back} · {pct}"** (13px/600) and a red (`--warn`) line **"−฿{diff} น้อยกว่า"** (11px), where diff = 45 − back.

| Swatch | Bank | Perk | Value | Less |
|---|---|---|---|---|
| `scb-m` | SCB M Legend | x10 M Point หมวดคาเฟ่ | ฿30 · 10% | −฿15 น้อยกว่า |
| `ktc-cb` | KTC Forever | 2% cashback ทุกหมวด | ฿6 · 2% | −฿39 น้อยกว่า |
| `uob-pm` | UOB Privi | 10฿ = 1 ไมล์ | ฿3 · ไมล์ | −฿42 น้อยกว่า |

**Trust footer** (row, centered, margin-top 14px, `--ink-4`)
- **shield** icon (13px) + **"คำนวณจากโปรล่าสุด · อัปเดต 14 มิ.ย. 2568"**.

---

## Interactions & Behavior
- **Tap search field (Home)** → navigate/transition to the active-search state (Screen 2's header), show recent searches + suggestions, then results as the user types or selects.
- **Tap a category tile** → run a category search (equivalent to searching that category at the current location).
- **Tap a recent-search chip** → re-run that search → Screen 2.
- **Tap an urgency alert row** → open the relevant detail (promo detail / card statement / reward progress).
- **Tap "บัตรของฉัน · 5 ใบ" pill** → switch to the **Wallet** tab.
- **Tap "ใช้ใบนี้" (Screen 2)** → primary action: mark/confirm this card as the one to use (e.g. surface card number / open pay sheet / log the choice). Define per platform.
- **Tap a runner-up row** → could swap it into the winner slot or open a full comparison ("เทียบทั้งหมด").
- **Back chevron (Screen 2)** → return to Home.
- **Recommendation logic (conceptual):** rank the user's cards by net reward for the searched merchant's category, factoring in current cap utilization and promo validity windows; the top card is the "winner," others are ranked with the baht delta vs. the winner.
- **Transitions:** standard push/pop navigation between Home and Result. Keep motion subtle (financial-app tone). No specific durations are prescribed — match platform defaults.

## State Management
- `cards[]` — the user's saved cards (bank variant, product name, last4, network, cap status, points/miles balances). Drives the wallet pill, recommendation ranking, and runner-ups.
- `searchQuery` / `activeSearch` (bool) — toggles Home hero vs. active-search header.
- `recentSearches[]` — persisted list of recent merchant/category lookups.
- `currentLocation` — drives the header subtitle and nearby-merchant context.
- `recommendation` — derived: `{ winner: card, rankedAlternatives: card[] }` for the active merchant/category.
- `alerts[]` — urgency items (type: `expiring` | `cap_reached` | `threshold`, plus payload).
- `savingsThisMonth`, `feedItems[]` — Phase 2 / Phase 3–4 only.
- `theme` (light/dark), `density`, `brandColor`, `font` — theming, map to your design-token system.

## Design Tokens
From `hi-fi.css` (`:root`). Map these to your theme system.

**Brand (green)**
- `--brand-900` #062a1f · `--brand-700` #0e6e4b · `--brand-600` #0f8e5a · `--brand-500` #16a974 · `--brand-100` #d8efe2 · `--brand-50` #ecf6ee

**Accent (gold)**
- `--gold-600` #c98e1f · `--gold-500` #e8b339 · `--gold-100` #fbe9b6

**Surfaces (light)**
- `--bg` #fbfaf6 · `--surface` #ffffff · `--surface-2` #f4f1e9 · `--surface-3` #e9e5d8

**Ink / lines (light)**
- `--ink` #0f1f18 · `--ink-2` #2a3b32 · `--ink-3` #5e6e64 · `--ink-4` #98a39b · `--line` #e5e1d4 · `--line-soft` #efece1

**Status**
- `--good` #16a974 / `--good-bg` #e6f6ec · `--warn` #e36b3f / `--warn-bg` #fdece1 · `--info` #2f6bd9 / `--info-bg` #e3edfb

**Dark theme overrides** (`[data-theme="dark"]`)
- `--bg` #0c1612 · `--surface` #131e19 · `--surface-2` #1a2620 · `--surface-3` #243029 · `--ink` #f3eee0 · `--ink-2` #d6d1c1 · `--ink-3` #9aa49d · `--ink-4` #6c7770 · `--line` #2a3530 · `--line-soft` #1f2a25 · `--brand-100` #1a3a2a · `--brand-50` #14271e · `--gold-100` #3a2e10 · `--good-bg` #143b29 · `--warn-bg` #3a1f12 · `--info-bg` #11264c

**Radii**
- `--r-xs` 8 · `--r-sm` 10 · `--r-md` 14 · `--r-lg` 18 · `--r-xl` 22 · `--r-card` 16 (px)

**Shadows**
- `--shadow-sm` 0 1px 2px rgba(15,31,24,.06), 0 1px 1px rgba(15,31,24,.04)
- `--shadow-md` 0 4px 14px rgba(15,31,24,.07), 0 2px 5px rgba(15,31,24,.04)
- `--shadow-lg` 0 16px 40px rgba(15,31,24,.13), 0 4px 10px rgba(15,31,24,.06)
- `--shadow-card` 0 14px 30px rgba(6,28,18,.20), 0 4px 10px rgba(6,28,18,.10)

**Typography**
- Sans: **IBM Plex Sans Thai** (also Sarabun, Noto Sans Thai as alternates), fallback IBM Plex Sans / system-ui.
- Mono: IBM Plex Mono.
- Scale used: h1 22/600 · section h3 13/600 · row title 13/600 · body 14–15 · sub 11–12 · tiny 11–12. Big numbers 26/700, letter-spacing −0.5px.
- `font-feature-settings: 'ss01' on, 'cv01' on;`

**Spacing**
- Body padding 20px (compact 14, cozy 18). Section header margin `14px 2px 8px`. Row gaps 8px. Card paddings 14–16px. Tile gaps 12px.

**Bank card gradients** (135°)
- `kbank-journey` #1c8c75 → #07332a (60%) → #1c5945
- `scb-m` #6b2d8c → #341252 (60%) → #8e4cb6
- `ktc-cb` #e3603f → #a02b1f
- `uob-pm` #c8253e → #5d0a16 (60%) → #1c2a6a
- (full set incl. kbank, scb, ktc, uob, aeon, amex/-plat/-gold, citi, bbl, krungsri, tmrw — see `hi-fi.css` lines ~305–321)

## Assets
- **Icons:** inline SVG, **Lucide-style** 24×24 viewBox strokes (see `HiFiShell.jsx` `Icon` component for exact paths). Replace with your icon library's equivalents (Lucide recommended). Icons used here: home, wallet, tag, user, search, qr, bell, mapPin, clock, flame, alert, gift, sparkle, star, trending, chevronRight, x, arrowUpRight, check, shield.
- **Card art:** pure CSS linear-gradients (no image assets) — see token list. Card chip/wave are small inline SVGs in `HiFiShell.jsx`.
- **Fonts:** Google Fonts — IBM Plex Sans Thai / IBM Plex Sans / IBM Plex Mono / Sarabun / Noto Sans Thai.
- **Emoji:** used for category tiles (☕🍜🛒⛽🛍️🏥) — system emoji, no asset needed.
- No raster/logo assets. Bank names are text only.

## Files
In this bundle:
- `Cardly Home Hi-Fi (A · Search-led).html` — the runnable prototype (open in a browser). Contains the canvas with both screens + a Tweaks panel (theme/brand/font/density).
- `HomeHiFi.jsx` — the two screen components (`HomeSearchLedHF`, `HomeSearchResultHF`) + home tab bar. **Primary reference for structure & values.**
- `HiFiShell.jsx` — shared shell: `StatusBar`, `Icon` (all SVG paths), card components, `TabBar`.
- `hi-fi.css` — all design tokens + component classes (`.app-header`, `.app-body`, `.tabbar`, `.chip`, `.list-row`, `.sec-h`, `.cc.*` card gradients, density modes, dark theme).

To run the reference: open the `.html` file in a browser (it loads React + Babel from CDN). The other JSX/CSS files must sit alongside it.
