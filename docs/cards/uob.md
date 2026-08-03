# UOB Thailand — Credit Card Inventory

> **สถานะ**: รอบแรก (research) — ใช้เป็น input สำหรับ fill ตาราง `credit_cards` + `card_base_benefit`
> **อัปเดตล่าสุด**: 2026-08-03
> **ที่มา**: UOB Thailand fact sheet / product pages (ผ่าน web search), checkraka, chaimiles, MoneyHub, Punpro
> **ข้อจำกัด**: session นี้ network policy บล็อก `uob.co.th` โดยตรง จึงยังไม่ได้ verify กับ fact sheet PDF ตัวจริง
> ตัวเลขที่ทำเครื่องหมาย ⚠️ ต้องเช็คซ้ำก่อนลง production

---

## สรุปจำนวน

**~18 ใบ** ที่ยังเปิดรับสมัคร/ยังใช้งานอยู่ในไทย ณ ส.ค. 2026 แบ่งเป็น 4 กลุ่ม:

| กลุ่ม | จำนวน | ลักษณะ |
|---|---|---|
| Mass market (รายได้ 15,000/เดือน) | 8 | cashback / points / co-brand |
| Women segment | 2 | UOB Lady's |
| Mid–Premium (30,000–50,000/เดือน) | 6 | travel, miles, lounge |
| Invite-only (affluent) | 2 | Infinite, Reserve |

---

## 1. Mass market — รายได้ขั้นต่ำ 15,000 บาท/เดือน

| # | บัตร | จุดขายหลัก | ค่าธรรมเนียมรายปี | หมายเหตุ |
|---|---|---|---|---|
| 1 | **UOB Yolo Platinum** | เครดิตเงินคืนสูงสุด **15%** (ต้องใช้จ่าย 5 ครั้ง ครั้งละ ≥300 บ./เซลล์สลิป), base **1%** ทุกการใช้จ่าย, ดูหนัง 1 แถม 1 | 2,000 บ. (ฟรีปีถัดไปถ้าใช้จ่าย ≥100,000 บ.) | **บัตร cashback เรือธง** ของ UOB |
| 2 | **UOB One** | cashback ทุกการใช้จ่าย | ⚠️ ยังไม่ยืนยัน | เป็นบัตรปลายทางที่ Citi Cash Back ย้ายมา |
| 3 | **UOB World** | rewards เน้น online shopping | ⚠️ ยังไม่ยืนยัน | ปลายทางอีกใบของ Citi Cash Back |
| 4 | **UOB Preferred** | สะสมคะแนน + เครดิตเงินคืนสูงสุด 15% | ⚠️ ยังไม่ยืนยัน | บัตร rewards mass ที่คนถือเยอะ |
| 5 | **UOB Black Card** | สะสมคะแนน | ⚠️ ยังไม่ยืนยัน | บัตร entry สาย points |
| 6 | **UOB Simple** | **ไม่มีค่าธรรมเนียมรายปี / ค่าออกบัตร / ค่าธรรมเนียมเรียกเก็บ** | 0 บ. (ถาวร) | จุดขายคือฟรีทุกอย่าง |
| 7 | **UOB Lazada** | คะแนน/ส่วนลดบน Lazada | ⚠️ ยังไม่ยืนยัน | co-brand — ยังเปิดรับสมัครถึง 30 มิ.ย. 2026+ |
| 8 | **UOB Grab** | สิทธิ์บน Grab ทุกบริการ + อัป GrabUnlimited ฟรี 1 ปี (อนุมัติในปี 2026) | ⚠️ ยังไม่ยืนยัน | co-brand — active ตลอดปี 2026 |

---

## 2. Women segment

| # | บัตร | จุดขายหลัก | รายได้ขั้นต่ำ | หมายเหตุ |
|---|---|---|---|---|
| 9 | **UOB Lady's Platinum** | สิทธิประโยชน์เน้นผู้หญิง (beauty, fashion, health) | ⚠️ | tier ล่าง |
| 10 | **UOB Lady's Solitaire** | tier บนของสาย Lady's | ⚠️ (สูงกว่า Platinum) | |

---

## 3. Mid–Premium

| # | บัตร | จุดขายหลัก | รายได้ขั้นต่ำ | ค่าธรรมเนียมรายปี |
|---|---|---|---|---|
| 11 | **UOB Premier** | คะแนน **x4**, cashback **5%** ซูเปอร์มาร์เก็ตชั้นนำ, **Miracle Lounge ไม่จำกัดครั้ง แบบไม่มีเงื่อนไข**, เครื่องดื่มฟรี 1 แก้ว/เดือน | 30,000 บ./เดือน | ⚠️ |
| 12 | **UOB Privi Miles** | สาย**สะสมไมล์**: 15 บ. = 1 คะแนน; แลกไมล์ ~18 บ./ไมล์ (ROP, Asia Miles, KrisFlyer) หรือ ~24 บ./ไมล์ ทั่วไป | 50,000 บ./เดือน | ⚠️ |
| 13 | **UOB KrisFlyer World Elite** | co-brand Singapore Airlines — โบนัส **25,000 ไมล์** เมื่อใช้จ่ายครบ 1 ล้านบาท/ปี ตอนต่ออายุบัตร | ⚠️ | ⚠️ |
| 14 | **UOB Royal Orchid Plus (Preferred / Platinum)** | co-brand Thai Airways ROP | ⚠️ | ⚠️ |
| 15 | **UOB Zenith** | travel/rewards ระดับบน — ตั้งแต่ 1 ม.ค. 2026 ได้ **Anniversary Bonus Points 0.5–2%** ตามวันเปิดบัตร | ⚠️ | **7,900 บ.** |
| 16 | **UOB Makro** | co-brand Makro (ร้านค้า/SME) | ⚠️ (สูงกว่า mass tier) | ⚠️ |

---

## 4. Invite-only / Affluent

| # | บัตร | เงื่อนไข | ค่าธรรมเนียมรายปี |
|---|---|---|---|
| 17 | **UOB Infinite** | Privilege Banking — เชิญเท่านั้น | **36,500 บ.** |
| 18 | **UOB Reserve** | Privilege Reserve — เชิญเท่านั้น, ต้องมีเงินฝาก/กองทุนกับ UOB **≥50 ล้านบาท** | **99,000 บ.** |

---

## บัตรไหนนิยมสุด?

ไม่มีตัวเลข issuance สาธารณะรายใบ ประเมินจาก search volume + ปริมาณรีวิว/กระทู้ Pantip + ตำแหน่งบน product page ของ UOB เอง:

| อันดับ | บัตร | เหตุผล |
|---|---|---|
| 🥇 1 | **UOB Yolo Platinum** | บัตร mass ที่ถูกพูดถึงมากที่สุด — cashback 15% เข้าใจง่าย, รายได้ขั้นต่ำ 15k, มีรีวิวจากทุกสำนัก (refinn, checkraka, chaimiles, rewardinside, roodeemoney) เป็นหน้าตาของ UOB ในกลุ่มพนักงานออฟฟิศ |
| 🥈 2 | **UOB Preferred** | บัตร rewards mass — เข้าถึงง่าย + มี cashback 15% ทับซ้อนกับ Yolo, ฐานผู้ถือใหญ่ |
| 🥉 3 | **UOB Privi Miles** | เบอร์ 1 ของ UOB ในสายสะสมไมล์ ชุมชนสาย mileage (chaimiles) พูดถึงต่อเนื่อง มี guide "10 เส้นทางแลกไมล์" โดยเฉพาะ |
| 4 | **UOB Premier** | Miracle Lounge ฟรีไม่จำกัด + x4 points เป็นตัวชูโรงในกระทู้เทียบบัตร UOB ปี 2026 |
| 5 | **UOB One / UOB World** | ฐานผู้ถือใหญ่แบบ "ได้มาโดยปริยาย" จากการโอนย้ายลูกค้า Citi Cash Back |

**บัตรที่วง mileage ยกให้ยืน 1 คือ UOB KrisFlyer World Elite** (โบนัส 25,000 ไมล์ที่ยอด 1 ล้าน/ปี) แต่ฐานผู้ถือเล็กกว่ามากเพราะเป็นบัตรเฉพาะกลุ่ม

---

## บริบท: การโอนย้าย Citi → UOB

UOB ซื้อธุรกิจ consumer ของ Citi (ประกาศ ม.ค. 2565) บัตร Citi ในไทยถูก map มาเป็นบัตร UOB ดังนี้ — สำคัญเพราะผู้ใช้จำนวนมากยัง**เรียกบัตรตัวเองด้วยชื่อ Citi** อยู่:

| บัตรเดิม (Citi) | บัตรใหม่ (UOB) |
|---|---|
| Citi Cash Back | UOB One / UOB World |
| Citi Prestige | UOB Zenith |
| Citi Ultima | UOB Infinite / UOB Reserve |

คะแนนสะสมโอนมา 1:1 และไม่มีวันหมดอายุ · เลขบัตรเดิมคงเดิม เปลี่ยนแค่ชื่อ+หน้าบัตร

> **Implication ต่อ Cardly**: ตอน user เพิ่มบัตร ควรมี alias/ชื่อเดิมให้ค้นเจอ (เช่น พิมพ์ "Citi Cash Back" แล้วเจอ UOB One/World)

---

## ช่องว่างข้อมูลที่ต้องเก็บต่อ (รอบ 2)

ก่อนจะ fill `card_base_benefit` ได้ครบ ยังขาด:

1. **ค่าธรรมเนียมรายปี + เงื่อนไขยกเว้น** ของเกือบทุกใบ (ยืนยันแล้วแค่ Yolo 2,000 / Zenith 7,900 / Infinite 36,500 / Reserve 99,000 / Simple 0)
2. **Base earn rate** ต่อใบ (กี่บาท = 1 คะแนน / กี่ % cashback) — ตอนนี้ชัดแค่ Privi Miles (15 บ. = 1 pt), Yolo (1% base), Premier (x4)
3. **Category multiplier** — บัตรไหนคูณคะแนนหมวดไหน (ต่างประเทศ, online, ปั๊มน้ำมัน, ซูเปอร์)
4. **Cap** ของแต่ละสิทธิ์ (Privi Miles มี cap 6,000 pts/เดือน — ต้องเช็คว่าใบอื่นมีอะไรบ้าง)
5. **อัตราแลกไมล์** ต่อ program (ROP / KrisFlyer / Asia Miles) — มีการอัปเดตเรทตั้งแต่ 1 ต.ค. 2568
6. **FX fee** (UOB คิด ~2.5% ⚠️ ต้องยืนยัน)
7. **รายได้ขั้นต่ำ** ของใบที่ยังว่าง — fact sheet มีตัวเลข 60,000 / 100,000 / 150,000 / 200,000 ซึ่ง**ไม่ตรง**กับรายได้ต่อเดือนที่ checkraka ระบุ (15,000–50,000) เดาว่าเป็นคนละหน่วย (วงเงิน หรือ รายได้ต่อปี) — **ต้องเปิด fact sheet PDF ตัวจริงเพื่อ confirm**
8. **image_url** ของแต่ละบัตร สำหรับ card visual ใน LIFF

## แหล่งข้อมูลสำหรับรอบ 2

- UOB fact sheet (ทางการ, ครบสุด): `uob.co.th/assets/web-resources/pdf/personal/factsheet/uob-credit-card-fact-sheet-en.pdf`
- UOB compare page: `uob.co.th/personal-en/credit-cards/compare.page`
- checkraka.com/creditcard/uob/ — รายได้ขั้นต่ำ + ค่าธรรมเนียม รายใบ
- chaimiles.com — earn rate / เรทแลกไมล์ ละเอียดสุดในไทย

> ⚠️ ทั้งสองแหล่งแรกอยู่บน `uob.co.th` ซึ่งถูก network policy ของ environment นี้บล็อก — ต้องรันจากเครื่อง local หรือเปิด allowlist ก่อน
