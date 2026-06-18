# Handoff: Cardly — Card Wallet Home (Editorial) + Add-Card Journey

## Overview
Two connected mobile flows for the **Cardly** credit-card management app (Thai-language UI):

1. **Home / Wallet (Editorial style)** — the first screen of card management. A calm, typographic list of the user's cards.
2. **Add-Card Journey** — a 4-step wizard launched from the Home "เพิ่มบัตร" (Add card) button, ending back at Home.

Target device: **iPhone-class mobile, 360 × 780 px** logical viewport. Single-column, full-screen views.

## About the Design Files
The files in this bundle are **design references created in HTML/React (Babel JSX)** — prototypes that show the intended look and behavior. They are **not production code to copy directly**. The task is to **recreate these designs in the target codebase's existing environment** (React Native, Swift/SwiftUI, Flutter, Vue, etc.) using its established components, navigation, and styling patterns. If no environment exists yet, pick the most appropriate framework for a mobile app and implement there.

The prototypes render as a pan/zoom **design canvas** (`design-canvas.jsx`) holding phone artboards — that canvas, the `tweaks-panel.jsx`, and the `DCArtboard`/`PhoneFrame` chrome are **presentation scaffolding only**; do not reproduce them. Implement the screen *contents*.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and component styling are intended to be matched. Exact tokens are in `hi-fi.css` (`:root`) and summarized under **Design Tokens** below. Recreate pixel-faithfully using the codebase's own primitives.

---

## Screens / Views

### 1. Home — Editorial Wallet
**Component:** `EditorialHome` in `CardChain.jsx`.
**Purpose:** Entry point of card management; view all cards, tap one for detail, tap "เพิ่มบัตร" to start the Add journey.

**Layout (top → bottom), inside the 360-wide phone, 22px horizontal page padding:**
- **Header** (`padding: 16px 22px 4px`, space-between row):
  - Left: eyebrow label `กระเป๋าบัตร` — 11px, uppercase, letter-spacing 1.4px, weight 600, color `--ink-4`. Below it title `5 ใบ` — 30px, weight 600, margin-top 4px.
  - Right: circular icon button (search), 36×36, `border-radius: 999px`, `1px solid --line`, bg `--surface`.
- **Featured card**: full-width `CreditCard` (see Components). aspect-ratio 1.586:1.
- **Section caption row** (`margin: 14px 2px 4px`, space-between): left `บัตรของคุณ` (11px uppercase, letter-spacing 1px, weight 600, `--ink-4`); right `ประหยัด ฿2,209` (11px, `--ink-3`).
- **Card rows** (one per remaining card, flex row, `gap:14`, `padding:14px 2px`, top border `1px solid --line-soft`):
  - Leading 32×32 rounded-8 tile, brand color bg, white initial letter (weight 600, 14px).
  - Middle: product name (14px, weight 600, letter-spacing −.2px) + sub `{BANK} · •••• {last4}` (11px, `--ink-3`).
  - Trailing: perk text (11px, weight 600, `--ink-2`), right-aligned.
- **Add button** (`margin-top:18`, full width, `padding:13px`, `border-radius:999px` pill, bg `--ink`, text `--bg`, 14px weight 600, centered icon+label): `+ เพิ่มบัตร`. **This navigates to Add-Card Journey step 1.**
- Bottom **TabBar** (4 tabs: บัตร / โปร / แจ้งเตือน / ฉัน) — app chrome; wallet tab active. Reuse the app's real tab bar.

**Sample data** (6 cards) is defined as `CC` at the top of `CardChain.jsx` (bank, product, last-4, network, perk, cap, used, saved, initial, color).

### 2. Add Journey — Step 1 · เลือกธนาคาร (Choose bank)
**Component:** `JStep1Bank` in `CardJourney.jsx`.
**Purpose:** Pick the card issuer first to reduce downstream errors.
- App bar: back chevron (34×34 rounded-11 button) + title `เพิ่มบัตร`.
- **Step header** (`JHeader`): progress dots (`StepDots`, 4 total, step 1 active — active dot is a 22px-wide brand pill, others 7px `--surface-3`), then row: bold 18px `เลือกธนาคาร` + muted `ขั้น 1/4`.
- **Search field**: rounded-12, `1px solid --line`, search icon + placeholder `ค้นหาธนาคารหรือผู้ออกบัตร`.
- **Bank list** (6 rows, gap 7): each row rounded-12, `1.5px` border (`--brand-600` if selected else `--line`); 36×36 rounded-9 colored tile + initial; bank name (12px weight 600); trailing radio (selected = filled brand circle w/ white check). KBANK selected by default.
- Footer: full-width primary button `ถัดไป` (next).

### 3. Add Journey — Step 2 · รายละเอียดบัตร + live preview
**Component:** `JStep2Details` in `CardJourney.jsx`. **This is the merge of "pack 3 wizard" + "pack 2 live preview".**
**Purpose:** Enter card details and watch the card preview update live.
- Step header: dots step 2, label `รายละเอียดบัตร`, `ขั้น 2/4`.
- **Live preview `CreditCard`** at top (KBANK Journey Platinum, •••• 4521, VISA). Caption under it (11px muted, centered): `พรีวิวอัปเดตตามที่กรอก · เก็บแค่ 4 ตัวท้าย`.
- **FieldGroup "ข้อมูลบัตร" (hint: จำเป็น):**
  - `ชื่อบัตร / ประเภท` = "Journey Platinum" (focused state).
  - Two-up row: `เลข 4 ตัวท้าย` (prefix `••••`, required) + `ชื่อบนบัตร`.
- **FieldGroup "เครือข่าย & สีบัตร":** `NetworkPicker` (VISA/Master/JCB/AMEX segmented) + `ColorPicker` (6 gradient swatches).
- Footer: **two buttons** — `ย้อนกลับ` (ghost, fixed 96px) + `ถัดไป` (primary, flex).

### 4. Add Journey — Step 3 · สิทธิ์ & รอบบัตร (Rewards & cycle)
**Component:** `JStep3Rewards` in `CardJourney.jsx`.
**Purpose:** Set reward type/rate, statement & due dates, credit limit.
- Step header: dots step 3, label `สิทธิ์ & รอบบัตร`, `ขั้น 3/4`.
- **Continuity strip** (surface row): 46×29 mini card gradient + `KBANK · Journey Platinum` / `•••• 4521 · VISA` + green check. Keeps the just-built card visible.
- **Reward type** 3-up grid (Cashback / ไมล์ / พอยต์) — selected tile has brand border + `--brand-50` bg + brand text; icon + label. Cashback selected.
- `อัตรา` field = "1" suffix `% ทุกหมวด` (focused).
- **FieldGroup "รอบบัตร & วงเงิน":** two-up `วันสรุปยอด` (ทุกวันที่ 5) + `วันครบกำหนด` (ทุกวันที่ 25), then `วงเงิน` prefix `฿` = "60,000".
- Footer: `ย้อนกลับ` + primary `เพิ่มบัตร` (check icon) → completes, goes to step 4.

### 5. Add Journey — Step 4 · สำเร็จ (Success)
**Component:** `JStep4Done` in `CardJourney.jsx`.
**Purpose:** Confirm success, route back to wallet or add another.
- No back button. Progress dots show step 4 (all complete).
- Centered: 78px `--good-bg` ring → 52px `--good` filled circle with white check (28px, stroke 2.5).
- Title `เพิ่มบัตรสำเร็จ` (19px weight 700) + muted line `KBANK Journey Platinum •••• 4521 พร้อมใช้งานแล้ว`.
- 210px-wide `CreditCard` of the new card.
- Footer (stacked): primary `ดูบัตรในกระเป๋า` (→ back to Home) + ghost `+ เพิ่มอีกใบ` (→ step 1).

---

## Interactions & Behavior
- **Home → Add:** tapping `เพิ่มบัตร` pushes Step 1.
- **Wizard nav:** `ถัดไป` advances 1→2→3; `ย้อนกลับ` pops; `เพิ่มบัตร` (step 3) commits and shows Step 4. Progress dots reflect current step.
- **Live preview (Step 2):** the `CreditCard` reflects field values in real time — bank/product/last-4/network/color all bind to the preview. In the prototype values are static placeholders; wire them to form state.
- **Step 4 routing:** `ดูบัตรในกระเป๋า` resets the flow and returns to Home (new card now appears in the list); `เพิ่มอีกใบ` restarts at Step 1.
- **Field focus state:** focused field = `1.5px --brand-600` border + `0 0 0 3px --brand-50` focus ring + a blinking caret (1.5px wide, `--brand-600`, 1s steps animation).
- **Toggles/segments:** selected = brand border + `--brand-50` fill + brand text + check mark.
- No page-level transitions are specified beyond standard push/pop; keep them native to the platform. Respect `prefers-reduced-motion` for the caret/any animation.

## State Management
Form state for the new card, persisted across steps:
- `issuer` (bank id), `product` (string), `last4` (4 digits, the only card-number data stored — **never store the full PAN**), `nameOnCard`, `network` (visa|mastercard|jcb|amex), `colorVariant` (swatch id).
- `rewardType` (cashback|miles|points), `rate` (number, %), `statementDay`, `dueDay`, `creditLimit`.
- `step` (1–4) for wizard position.
- On commit (step 3 → 4): append the card to the wallet collection used by Home. Home derives "ประหยัด/perk" display from card data.
- Validation: `last4` required (exactly 4 digits); issuer required; everything else optional with sensible defaults (rate 1%, network visa).

## Design Tokens
From `hi-fi.css` `:root` (light) — see file for the full dark-mode (`[data-theme="dark"]`) overrides.

**Brand (green):** `--brand-900 #062a1f`, `--brand-700 #0e6e4b`, `--brand-600 #0f8e5a` (primary), `--brand-500 #16a974`, `--brand-100 #d8efe2`, `--brand-50 #ecf6ee`.
**Accent (gold):** `--gold-600 #c98e1f`, `--gold-500 #e8b339`, `--gold-100 #fbe9b6`.
**Surfaces:** `--bg #fbfaf6`, `--surface #ffffff`, `--surface-2 #f4f1e9`, `--surface-3 #e9e5d8`.
**Ink/text:** `--ink #0f1f18`, `--ink-2 #2a3b32`, `--ink-3 #5e6e64`, `--ink-4 #98a39b`. Lines: `--line #e5e1d4`, `--line-soft #efece1`.
**Status:** good `#16a974` (bg `#e6f6ec`), warn `#e36b3f` (bg `#fdece1`), info `#2f6bd9` (bg `#e3edfb`).
**Radii:** xs 8 / sm 10 / md 14 / lg 18 / xl 22 / card 16 / pill 999 (px).
**Shadows:** `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-card 0 14px 30px rgba(6,28,18,.20), 0 4px 10px rgba(6,28,18,.10)`.
**Type:** sans = `IBM Plex Sans Thai, IBM Plex Sans, Noto Sans Thai, system-ui` (Sarabun / Noto Sans Thai are alternates); mono = `IBM Plex Mono` (used for card numbers, letter-spacing ~2px). Sizes seen: title 30/28, h1 22, body 14, small 12, tiny 11, card number 15. Headings weight 600–700, letter-spacing −.2 to −.5px.
**Card gradients** (`.cc.<variant>` in `hi-fi.css`): e.g. `kbank-journey: linear-gradient(135deg,#1c8c75,#07332a 60%,#1c5945)`, `scb-m`, `ktc-cb`, `uob-pm`, `aeon`, `amex-plat`, etc. Each card face: aspect 1.586:1, radius 16, white text, chip + contactless + masked number `•••• •••• •••• {last4}`.

## Assets
- **Icons:** inline Lucide-style SVGs in `HiFiShell.jsx` (`Icon` component — search, plus, settings, check, chevronRight/Down, camera, gift, trending, star, eye, etc.). Replace with the codebase's icon set (Lucide or equivalent).
- **Card chip / contactless / network marks:** inline SVG in `HiFiShell.jsx` (`CardChip`, `Contactless`, `NetworkMark`). VISA/AMEX rendered as text; Mastercard as two overlapping circles.
- **Bank logos:** represented as colored tiles with a single initial letter (no real logos). Swap for licensed issuer logos in production.
- No external image files. Fonts via Google Fonts (IBM Plex families).

## Files
- `Cardly Editorial Home + Add Journey.html` — the runnable prototype (open in a browser). Loads the JSX below.
- `CardChain.jsx` — `EditorialHome` (Home screen) + the other 4 explored directions for reference.
- `CardJourney.jsx` — `JStep1Bank`, `JStep2Details`, `JStep3Rewards`, `JStep4Done` (the Add journey) + `JHeader`, `JFooter`, `PreviewCard` helpers.
- `CardManageShell.jsx` — flow primitives: `FlowFrame`, `PrimaryBtn`, `GhostBtn`, `FieldGroup`, `FieldBox`, `FieldRow2`, `ToggleRow`, `NetworkPicker`, `ColorPicker`, `StepDots`.
- `HiFiShell.jsx` — `Icon`, `StatusBar`, `TabBar`, `PhoneFrame`, `CreditCard` and card sub-parts.
- `hi-fi.css` — all design tokens + base component styles (the source of truth for colors/spacing/type).
- `design-canvas.jsx`, `tweaks-panel.jsx` — **presentation scaffolding only; ignore for implementation.**
```
