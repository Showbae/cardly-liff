// HomeHiFi.jsx — Hi-fi detail of Home variant A · Search-led
// Built on HiFiShell (Icon, StatusBar, CreditCard) + hi-fi.css tokens.
// Two screens that tell variant A's whole loop:
//   1) HomeSearchLedHF   — the home (search is the hero; answer comes AFTER you search)
//   2) HomeSearchResultHF — typed "Starbucks" → the ranked answer

function fmtHF(n){ return n.toLocaleString('en-US'); }

// Home-led tab bar (HiFiShell's TabBar is wallet-led — home needs its own)
function HomeTabBarHF({ active = 'home' }) {
  const tabs = [
    { id: 'home',     icon: 'home',    label: 'หน้าหลัก' },
    { id: 'wallet',   icon: 'wallet',  label: 'บัตร' },
    { id: 'discover', icon: 'tag',     label: 'โปร' },
    { id: 'me',       icon: 'user',    label: 'ฉัน' },
  ];
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <div key={t.id} className={'tab' + (active === t.id ? ' active' : '')}>
          <Icon name={t.icon} size={22} stroke={active === t.id ? 2 : 1.75}/>
          <span>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

function HomePhoneHF({ children, active = 'home', style }) {
  return (
    <div className="phone" style={style}>
      <StatusBar/>
      {children}
      <HomeTabBarHF active={active}/>
    </div>
  );
}

// small bank-coloured card swatch
function Swatch({ variant, w = 56, h = 36, r = 8 }) {
  return (
    <div style={{width: w, height: h, borderRadius: r, overflow: 'hidden', flex: '0 0 auto',
      boxShadow: '0 1px 4px rgba(0,0,0,.2)'}}>
      <div className={'cc ' + variant} style={{width: '100%', height: '100%', aspectRatio: 'auto',
        borderRadius: r, padding: 0, boxShadow: 'none'}}/>
    </div>
  );
}

// urgency alert row
function AlertRowHF({ icon, iconBg, iconColor, title, sub, tag, tagClass, tagStyle }) {
  return (
    <div className="list-row" style={{gridTemplateColumns: '40px 1fr auto', alignItems: 'center'}}>
      <div style={{width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center',
        background: iconBg, color: iconColor}}>
        <Icon name={icon} size={19}/>
      </div>
      <div style={{minWidth: 0}}>
        <div className="name" style={{whiteSpace: 'normal'}}>{title}</div>
        <div className="sub">{sub}</div>
      </div>
      <span className={'chip ' + (tagClass || '')} style={{fontSize: 11, ...(tagStyle || {})}}>{tag}</span>
    </div>
  );
}

const HOME_CATS = [
  { emoji: '☕', label: 'คาเฟ่' },
  { emoji: '🍜', label: 'ร้านอาหาร' },
  { emoji: '🛒', label: 'ซูเปอร์' },
  { emoji: '⛽', label: 'น้ำมัน' },
  { emoji: '🛍️', label: 'ช้อปปิ้ง' },
  { emoji: '🏥', label: 'โรงพยาบาล' },
];

// ─────────────────────────────────────────────────────────────
// 1 · HOME — Search-led
// ─────────────────────────────────────────────────────────────
function HomeSearchLedHF({ style }) {
  return (
    <HomePhoneHF active="home" style={style}>
      <div className="app-header">
        <div>
          <h1>วันนี้จะรูดที่ไหน?</h1>
          <div className="sub row" style={{gap: 4}}>
            <Icon name="mapPin" size={12} stroke={1.75}/> ทองหล่อ · สวัสดีตอนเช้า, มินต์
          </div>
        </div>
        <div className="icon-btn" style={{position: 'relative'}}>
          <Icon name="bell" size={18}/>
          <span style={{position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%',
            background: 'var(--warn)', border: '1.5px solid var(--surface)'}}/>
        </div>
      </div>

      <div className="app-body" style={{overflow: 'visible'}}>
        {/* ── ZONE 1 · HERO — search is the star ──────────────── */}
        <div style={{display: 'flex', alignItems: 'center', gap: 11, padding: '15px 16px',
          borderRadius: 'var(--r-lg)', background: 'var(--surface)', border: '1.5px solid var(--line)',
          boxShadow: 'var(--shadow-md)'}}>
          <Icon name="search" size={21} stroke={2} style={{color: 'var(--brand-700)'}}/>
          <span style={{flex: 1, color: 'var(--ink-4)', fontSize: 15}}>ค้นหาร้าน หมวด หรือธนาคาร</span>
          <div style={{width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center',
            background: 'var(--brand-100)', color: 'var(--brand-700)'}}>
            <Icon name="qr" size={18}/>
          </div>
        </div>
        <div className="tiny muted" style={{textAlign: 'center', margin: '9px 0 0'}}>
          พิมพ์ชื่อร้าน แล้วเราจะบอกใบที่คุ้มสุดทันที
        </div>

        {/* category quick-access (browse path) */}
        <div className="row" style={{gap: 12, overflowX: 'auto', margin: '14px -2px 0', paddingBottom: 4}}>
          {HOME_CATS.map(c => (
            <div key={c.label} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 58}}>
              <div style={{width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center',
                background: 'var(--surface)', border: '1px solid var(--line)', fontSize: 23}}>{c.emoji}</div>
              <span className="tiny" style={{color: 'var(--ink-2)', whiteSpace: 'nowrap'}}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* recent searches */}
        <div className="row" style={{gap: 6, marginTop: 14, flexWrap: 'wrap'}}>
          <span className="tiny muted">ล่าสุด</span>
          <span className="chip"><Icon name="clock" size={12} stroke={1.75}/> Starbucks</span>
          <span className="chip"><Icon name="clock" size={12} stroke={1.75}/> PT Station</span>
          <span className="chip"><Icon name="clock" size={12} stroke={1.75}/> Lotus's</span>
        </div>

        {/* ── ZONE 2 · URGENCY — ต้องรีบ ──────────────────────── */}
        <div className="sec-h"><h3>ต้องรีบ</h3><span className="more">ดูทั้งหมด</span></div>
        <div className="col" style={{gap: 8}}>
          <AlertRowHF icon="flame" iconBg="var(--warn-bg)" iconColor="var(--warn)"
            title="โปร KBank ลด 15% ใกล้หมด" sub="ร้านในห้าง · ใช้ก่อนหมดสิทธิ์"
            tag="เหลือ 2 วัน" tagClass="warn"/>
          <AlertRowHF icon="alert" iconBg="var(--info-bg)" iconColor="var(--info)"
            title="SCB M ใช้ครบเพดาน cashback แล้ว" sub="รอบนี้สลับไปใช้ KTC Forever แทน"
            tag="สลับใบ" tagClass="brand"/>
          <AlertRowHF icon="gift" iconBg="var(--gold-100)" iconColor="var(--gold-600)"
            title="อีก ฿1,200 ครบขั้นต่ำรับของแถม" sub="UOB Privi · รูดให้ถึง ฿15,000"
            tag="฿1,200" tagClass="gold"/>
        </div>

        {/* ── ZONE 3 · MY CARDS — quiet nav pill ──────────────── */}
        <div style={{display: 'flex', justifyContent: 'center', marginTop: 16}}>
          <div className="row" style={{gap: 10, padding: '8px 16px 8px 12px', borderRadius: 999,
            background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)'}}>
            <div style={{position: 'relative', width: 38, height: 24, flex: '0 0 auto'}}>
              <div className="cc scb-m" style={{position: 'absolute', left: 0, top: 3, width: 26, height: 17,
                aspectRatio: 'auto', borderRadius: 4, padding: 0, boxShadow: 'none', transform: 'rotate(-12deg)'}}/>
              <div className="cc ktc-cb" style={{position: 'absolute', left: 6, top: 2, width: 26, height: 17,
                aspectRatio: 'auto', borderRadius: 4, padding: 0, boxShadow: 'none', transform: 'rotate(-3deg)'}}/>
              <div className="cc kbank-journey" style={{position: 'absolute', left: 12, top: 1, width: 26, height: 17,
                aspectRatio: 'auto', borderRadius: 4, padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,.25)'}}/>
            </div>
            <span className="bold small">บัตรของฉัน · 5 ใบ</span>
            <Icon name="chevronRight" size={16} stroke={2} style={{color: 'var(--ink-4)'}}/>
          </div>
        </div>

        {/* ── VIEWPORT FOLD ───────────────────────────────────── */}
        <div className="row" style={{alignItems: 'center', gap: 10, margin: '18px 0 8px'}}>
          <span style={{flex: 1, height: 1, background: 'var(--line)'}}/>
          <span className="tiny muted" style={{whiteSpace: 'nowrap'}}>เส้นพับจอ · เลื่อนเพื่อดูต่อ</span>
          <span style={{flex: 1, height: 1, background: 'var(--line)'}}/>
        </div>

        {/* ── ZONE 4 · SAVINGS IMPACT (Phase 2) ───────────────── */}
        <div className="sec-h"><h3>ประหยัดเดือนนี้</h3>
          <span className="chip" style={{fontSize: 10, padding: '2px 8px', opacity: .8}}>Phase 2</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px',
          borderRadius: 'var(--r-md)', background: 'var(--brand-50)', border: '1px solid var(--brand-100)'}}>
          <div>
            <div className="bold" style={{fontSize: 26, letterSpacing: -.5, color: 'var(--brand-700)', lineHeight: 1}}>฿1,240</div>
            <div className="tiny muted" style={{marginTop: 3}}>จากการใช้บัตรถูกใบ 14 ครั้ง</div>
          </div>
          <div style={{width: 48, height: 48, borderRadius: 15, display: 'grid', placeItems: 'center',
            background: 'var(--brand-100)', color: 'var(--brand-700)'}}>
            <Icon name="trending" size={23}/>
          </div>
        </div>

        {/* ── ZONE 5 · PERSONALIZED FEED (Phase 3–4) ──────────── */}
        <div className="sec-h"><h3>คัดมาให้คุณ</h3>
          <span className="chip" style={{fontSize: 10, padding: '2px 8px', opacity: .8}}>Phase 3–4</span>
        </div>
        <div className="col" style={{gap: 8}}>
          <AlertRowHF icon="sparkle" iconBg="var(--surface-2)" iconColor="var(--ink-2)"
            title="การบินไทย · สะสมไมล์ x2" sub="ตรงกับ UOB Privi ที่คุณถือ"
            tag="x2" tagClass="brand"/>
          <AlertRowHF icon="star" iconBg="var(--surface-2)" iconColor="var(--ink-2)"
            title="Central · คืน 12% วันเกิด" sub="ใช้ SCB M Legend"
            tag="12%" tagClass="brand"/>
        </div>
      </div>
    </HomePhoneHF>
  );
}

// ─────────────────────────────────────────────────────────────
// 2 · SEARCH RESULT — typed "Starbucks" → ranked answer
// ─────────────────────────────────────────────────────────────
const RESULT_RANK = [
  { variant: 'scb-m',  bank: 'SCB M Legend',  perk: 'x10 M Point หมวดคาเฟ่', back: 30, pct: '10%' },
  { variant: 'ktc-cb', bank: 'KTC Forever',   perk: '2% cashback ทุกหมวด',   back: 6,  pct: '2%' },
  { variant: 'uob-pm', bank: 'UOB Privi',     perk: '10฿ = 1 ไมล์',           back: 3,  pct: 'ไมล์' },
];

function HomeSearchResultHF({ style }) {
  return (
    <HomePhoneHF active="home" style={style}>
      {/* active search header */}
      <div className="app-header" style={{gap: 10, alignItems: 'center'}}>
        <div className="icon-btn">
          <Icon name="chevronRight" size={18} stroke={2} style={{transform: 'rotate(180deg)'}}/>
        </div>
        <div className="row" style={{flex: 1, gap: 9, padding: '9px 13px', borderRadius: 999,
          background: 'var(--surface)', border: '1.5px solid var(--brand-600)'}}>
          <Icon name="search" size={17} stroke={2} style={{color: 'var(--brand-700)'}}/>
          <span style={{flex: 1, fontSize: 14, fontWeight: 500}}>Starbucks</span>
          <Icon name="x" size={16} stroke={2} style={{color: 'var(--ink-4)'}}/>
        </div>
      </div>

      <div className="app-body scroll-y">
        <div className="row" style={{gap: 5, color: 'var(--ink-3)', fontSize: 12, margin: '4px 2px 12px'}}>
          <Icon name="mapPin" size={13} stroke={1.75}/>
          <span>Starbucks ทองหล่อ · 120 ม. · หมวดคาเฟ่</span>
        </div>

        {/* WINNER — the answer */}
        <div style={{borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--brand-100)',
          boxShadow: 'var(--shadow-md)'}}>
          <div style={{background: 'var(--brand-700)', color: '#fff', padding: '8px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span className="tiny bold" style={{letterSpacing: .2}}>บัตรที่คุ้มที่สุดสำหรับร้านนี้</span>
            <span className="chip gold" style={{fontSize: 10, padding: '3px 9px'}}>
              <Icon name="star" size={11}/> คุ้มสุด
            </span>
          </div>
          <div style={{padding: 14, background: 'var(--surface)'}}>
            <div className="row" style={{gap: 12}}>
              <Swatch variant="kbank-journey" w={66} h={42} r={9}/>
              <div style={{flex: 1, minWidth: 0}}>
                <div className="bold" style={{fontSize: 15}}>KBANK Journey</div>
                <div className="tiny muted">Platinum · •••• 4521</div>
              </div>
            </div>
            <div className="between" style={{marginTop: 14}}>
              <div>
                <div className="tiny muted">ได้รับคืนจากบิลนี้</div>
                <div className="row" style={{gap: 8, alignItems: 'baseline'}}>
                  <span className="bold" style={{fontSize: 26, color: 'var(--good)', letterSpacing: -.5}}>฿45</span>
                  <span className="bold small" style={{color: 'var(--good)'}}>15%</span>
                </div>
              </div>
              <button style={{padding: '11px 20px', borderRadius: 999, background: 'var(--brand-700)',
                color: '#fff', border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'}}>
                ใช้ใบนี้ <Icon name="arrowUpRight" size={15}/>
              </button>
            </div>
            <div className="row" style={{gap: 6, marginTop: 14, flexWrap: 'wrap'}}>
              <span className="chip good" style={{fontSize: 11}}><Icon name="check" size={12}/> x10 แต้มคาเฟ่</span>
              <span className="chip" style={{fontSize: 11}}>ยังไม่ชนเพดาน</span>
              <span className="chip" style={{fontSize: 11}}>ถึง 30 มิ.ย.</span>
            </div>
          </div>
        </div>

        {/* runner-ups */}
        <div className="sec-h"><h3>ใบอื่นที่ใช้ได้</h3><span className="more">เทียบทั้งหมด</span></div>
        <div className="col" style={{gap: 8}}>
          {RESULT_RANK.map((c, i) => (
            <div key={i} className="list-row" style={{gridTemplateColumns: '52px 1fr auto'}}>
              <Swatch variant={c.variant} w={52} h={33} r={7}/>
              <div style={{minWidth: 0}}>
                <div className="name">{c.bank}</div>
                <div className="sub">{c.perk}</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div className="bold small">฿{c.back} · {c.pct}</div>
                <div className="tiny" style={{color: 'var(--warn)'}}>−฿{45 - c.back} น้อยกว่า</div>
              </div>
            </div>
          ))}
        </div>

        <div className="row" style={{gap: 6, justifyContent: 'center', marginTop: 14, color: 'var(--ink-4)'}}>
          <Icon name="shield" size={13}/>
          <span className="tiny">คำนวณจากโปรล่าสุด · อัปเดต 14 มิ.ย. 2568</span>
        </div>
      </div>
    </HomePhoneHF>
  );
}

Object.assign(window, { HomeSearchLedHF, HomeSearchResultHF, HomePhoneHF, HomeTabBarHF, fmtHF });
