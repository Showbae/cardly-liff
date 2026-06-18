// CardChain.jsx — 5 cohesive "Home + Add card" pairs for Cardly card management
// Each pair = a landing screen (first page) and its matching Add-card screen.
// Relies on globals from HiFiShell.jsx (Icon, StatusBar, TabBar, CreditCard) and
// CardManageShell.jsx (FlowFrame, PrimaryBtn, GhostBtn, FieldGroup, FieldBox,
// FieldRow2, NetworkPicker, ColorPicker, StepDots).

const CC = [
  { variant: 'kbank-journey', bank: 'KASIKORNBANK',     product: 'Journey Platinum', number: '4521', network: 'visa',       perk: 'Cashback 1%',  cap: 60000,  used: 37420, saved: 412,  i: 'K', c: '#0a8665' },
  { variant: 'scb-m',         bank: 'SCB',              product: 'M Legend',         number: '8821', network: 'mastercard', perk: 'x10 M Point',  cap: 50000,  used: 14200, saved: 280,  i: 'ส', c: '#5e2b8f' },
  { variant: 'ktc-cb',        bank: 'KTC',              product: 'Cashback Forever',  number: '1109', network: 'visa',       perk: '2% ทุกหมวด',   cap: 30000,  used: 28800, saved: 576,  i: 'K', c: '#e3603f' },
  { variant: 'uob-pm',        bank: 'UOB',              product: 'Privi Miles',       number: '7733', network: 'visa',       perk: '10฿ = 1 ไมล์', cap: 100000, used: 14010, saved: 140,  i: 'U', c: '#1c2a6a' },
  { variant: 'aeon',          bank: 'AEON',             product: 'Wellness',          number: '4402', network: 'jcb',        perk: 'รพ. 5%',       cap: 30000,  used: 16500, saved: 825,  i: 'A', c: '#d9416f' },
  { variant: 'amex-plat',     bank: 'AMERICAN EXPRESS', product: 'Platinum',          number: '0028', network: 'amex',       perk: 'Lounge ∞',     cap: 999999, used: 81200, saved: 1240, i: 'A', c: '#2c343c' },
];
const money = (n) => n.toLocaleString('en-US');

const POP_BANKS = [
  { n: 'KBANK',  i: 'K', c: '#0a8665' },
  { n: 'SCB',    i: 'ส', c: '#5e2b8f' },
  { n: 'KTC',    i: 'K', c: '#e3603f' },
  { n: 'UOB',    i: 'U', c: '#1c2a6a' },
  { n: 'BBL',    i: 'B', c: '#0a3a8b' },
  { n: 'Krungsri', i: 'ก', c: '#d99211' },
  { n: 'AEON',   i: 'A', c: '#d9416f' },
  { n: 'Citi',   i: 'C', c: '#0e2c5c' },
  { n: 'AMEX',   i: 'A', c: '#2c343c' },
];

/* ════════════════════════════════════════════════════════════
   PAIR 1 · DECK  — tactile / premium
   Home: stacked physical cards · Add: dark scan-first viewfinder
   ════════════════════════════════════════════════════════════ */
function DeckHome() {
  return (
    <div className="phone">
      <StatusBar/>
      <div className="app-header">
        <div>
          <h1>กระเป๋าบัตร</h1>
          <div className="sub">{CC.length} ใบ · ประหยัดเดือนนี้ <b style={{color: 'var(--good)'}}>฿2,209</b></div>
        </div>
        <div className="icon-btn"><Icon name="settings" size={18}/></div>
      </div>
      <div className="app-body scroll-y">
        <div style={{position: 'relative', marginTop: 4, height: 5 * 60 + 150}}>
          {CC.slice(0, 5).map((c, i) => (
            <div key={i} style={{position: 'absolute', top: i * 60, left: 0, right: 0,
              transform: `rotate(${i % 2 ? 0.4 : -0.4}deg)`, filter: i === 0 ? 'none' : 'brightness(.99)'}}>
              <CreditCard {...c} size="md"/>
            </div>
          ))}
        </div>
        <button style={{width: '100%', marginTop: 4, padding: '14px', borderRadius: 'var(--r-md)',
          background: 'var(--surface)', border: '1.5px dashed var(--ink-4)', color: 'var(--ink-2)',
          fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8}}>
          <Icon name="plus" size={18}/> เพิ่มบัตรใหม่
        </button>
        <div className="row" style={{marginTop: 10, gap: 8, justifyContent: 'center'}}>
          <span className="chip"><Icon name="camera" size={13}/> สแกนบัตร</span>
          <span className="chip"><Icon name="qr" size={13}/> ย้ายจากเครื่องเดิม</span>
        </div>
        <div style={{height: 8}}/>
      </div>
      <TabBar active="wallet"/>
    </div>
  );
}

function DeckAdd() {
  return (
    <FlowFrame title="เพิ่มบัตร" sub="สแกนบัตรเพื่อกรอกอัตโนมัติ" dark
      action={<div className="tiny" style={{color: '#7ad9a6', fontWeight: 600}}>กรอกเอง</div>}
      bodyStyle={{padding: 0, display: 'flex', flexDirection: 'column'}}>
      <div style={{flex: 1, position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18,
        background: 'radial-gradient(120% 80% at 50% 35%, #20302a 0%, #0c1612 100%)'}}>
        <div style={{width: 250, aspectRatio: '1.586 / 1', borderRadius: 14, position: 'relative',
          background: 'linear-gradient(135deg, #1c8c75, #07332a)', transform: 'rotate(-3deg)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,.6)'}}>
          <div style={{position: 'absolute', inset: 0, padding: 14, color: '#fff',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div style={{fontSize: 10, fontWeight: 600, letterSpacing: '.8px', opacity: .85}}>KASIKORNBANK</div>
            <div style={{fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: 2}}>5412 88•• •••• 4521</div>
          </div>
          {[[0,0],[1,0],[0,1],[1,1]].map(([x,y], k) => (
            <span key={k} style={{position: 'absolute', width: 22, height: 22,
              [y ? 'bottom' : 'top']: -7, [x ? 'right' : 'left']: -7,
              borderTop: !y ? '3px solid #fff' : 'none', borderBottom: y ? '3px solid #fff' : 'none',
              borderLeft: !x ? '3px solid #fff' : 'none', borderRight: x ? '3px solid #fff' : 'none', borderRadius: 4}}/>
          ))}
          <div style={{position: 'absolute', left: 6, right: 6, top: '50%', height: 2,
            background: 'var(--brand-500)', boxShadow: '0 0 12px 2px var(--brand-500)',
            animation: 'cc-scan 2s ease-in-out infinite'}}/>
        </div>
        <div style={{color: 'rgba(255,255,255,.85)', fontSize: 13, fontWeight: 500}}>วางบัตรให้อยู่ในกรอบ</div>
        <div className="tiny" style={{color: 'rgba(255,255,255,.5)'}}>กำลังอ่านเลขบัตรและธนาคาร…</div>
      </div>
      <div style={{padding: '16px 0 22px', display: 'flex', justifyContent: 'center', background: '#0c1612'}}>
        <div style={{width: 60, height: 60, borderRadius: 999, border: '3px solid rgba(255,255,255,.4)', display: 'grid', placeItems: 'center'}}>
          <div style={{width: 46, height: 46, borderRadius: 999, background: '#fff'}}/>
        </div>
      </div>
      <style>{`@keyframes cc-scan{0%,100%{top:18%;opacity:.4}50%{top:82%;opacity:1}}`}</style>
    </FlowFrame>
  );
}

/* ════════════════════════════════════════════════════════════
   PAIR 2 · DASHBOARD — data-forward
   Home: hero card + stats + grid · Add: form with live preview
   ════════════════════════════════════════════════════════════ */
function DashHome() {
  const hero = CC[0];
  const others = CC.slice(1, 5);
  const pct = Math.round(hero.used / hero.cap * 100);
  return (
    <div className="phone">
      <StatusBar/>
      <div className="app-header">
        <div>
          <h1>บัตรหลัก</h1>
          <div className="sub">แตะบัตรเพื่อสลับใบหลัก</div>
        </div>
        <div className="row" style={{gap: 8}}>
          <div className="icon-btn"><Icon name="eye" size={18}/></div>
          <div className="icon-btn solid"><Icon name="plus" size={18}/></div>
        </div>
      </div>
      <div className="app-body scroll-y">
        <CreditCard {...hero} size="md"/>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14}}>
          <div className="stat"><div className="label">ใช้ไป</div><div className="value">฿{money(hero.used)}</div><div className="tiny muted">จาก ฿{money(hero.cap)}</div></div>
          <div className="stat"><div className="label">ประหยัด</div><div className="value" style={{color: 'var(--good)'}}>+฿{hero.saved}</div><div className="delta up">+18% MoM</div></div>
          <div className="stat"><div className="label">ครบ</div><div className="value">{pct}%</div><div className="progress brand" style={{marginTop: 6}}><i style={{width: pct + '%'}}/></div></div>
        </div>
        <div className="sec-h"><h3>บัตรอื่นๆ ({others.length})</h3><span className="more row" style={{gap: 4}}>จัดเรียง <Icon name="chevronDown" size={14}/></span></div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
          {others.map((c, i) => (
            <div key={i} style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <CreditCard {...c} mini/>
              <div className="tiny muted" style={{padding: '0 4px'}}>
                <div className="bold" style={{color: 'var(--ink-2)', fontSize: 11}}>{c.bank.split(' ')[0]} · {c.product}</div>
                <div>{c.perk}</div>
              </div>
            </div>
          ))}
          <div style={{aspectRatio: '1.586 / 1', border: '1.5px dashed var(--ink-4)', borderRadius: 12,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--ink-3)'}}>
            <Icon name="plus" size={20}/><span className="tiny">เพิ่มบัตร</span>
          </div>
        </div>
        <div style={{height: 8}}/>
      </div>
      <TabBar active="wallet"/>
    </div>
  );
}

function DashAdd() {
  return (
    <FlowFrame title="เพิ่มบัตร" sub="กรอกแล้วเห็นบัตรอัปเดตทันที"
      footer={<PrimaryBtn icon="check">บันทึกบัตร</PrimaryBtn>}>
      {/* live preview */}
      <div style={{margin: '6px 0 4px'}}>
        <CreditCard variant="kbank-journey" bank="KASIKORNBANK" product="Journey Platinum" number="4521" name="Showbae T." network="visa" size="md"/>
      </div>
      <div className="tiny muted" style={{textAlign: 'center', margin: '8px 0 2px'}}>ตัวอย่างบัตร — เก็บแค่ 4 ตัวท้ายเพื่อความปลอดภัย</div>
      <FieldGroup label="ข้อมูลบัตร" hint="จำเป็น">
        <FieldBox label="ธนาคาร / ผู้ออกบัตร" value="KASIKORNBANK" chevron required/>
        <FieldBox label="ชื่อบัตร / ประเภท" value="Journey Platinum" focused/>
        <FieldRow2>
          <FieldBox label="เลข 4 ตัวท้าย" value="4521" prefix="••••" required/>
          <FieldBox label="ชื่อบนบัตร" value="Showbae T."/>
        </FieldRow2>
      </FieldGroup>
      <FieldGroup label="เครือข่าย & สีบัตร">
        <NetworkPicker value="visa"/>
        <div style={{marginTop: 2}}><ColorPicker value="kbank-journey"/></div>
      </FieldGroup>
      <div style={{height: 4}}/>
    </FlowFrame>
  );
}

/* ════════════════════════════════════════════════════════════
   PAIR 3 · LIST — efficient / power-user
   Home: compact rows + filters · Add: stepped wizard (bank step)
   ════════════════════════════════════════════════════════════ */
function ListHome() {
  return (
    <div className="phone">
      <StatusBar/>
      <div className="app-header">
        <div>
          <h1>บัตรทั้งหมด</h1>
          <div className="sub">{CC.length} ใบ · ใช้แล้ว 42% ของวงเงินรวม</div>
        </div>
        <div className="row" style={{gap: 6}}>
          <div className="icon-btn"><Icon name="filter" size={16}/></div>
          <div className="icon-btn solid"><Icon name="plus" size={18}/></div>
        </div>
      </div>
      <div className="app-body scroll-y">
        <div className="row" style={{gap: 6, overflowX: 'auto', paddingBottom: 4, margin: '0 -2px'}}>
          <span className="chip solid">ทั้งหมด · {CC.length}</span>
          <span className="chip">Cashback · 3</span>
          <span className="chip">Miles · 2</span>
          <span className="chip">Premium · 1</span>
        </div>
        <div className="col" style={{gap: 8, marginTop: 12}}>
          {CC.map((c, i) => {
            const pct = c.cap > 100000 ? Math.min(100, Math.round(c.used / 100000 * 100)) : Math.round(c.used / c.cap * 100);
            const hi = pct > 80;
            return (
              <div key={i} className="list-row" style={{gridTemplateColumns: '54px 1fr auto'}}>
                <div style={{width: 54, height: 34, borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.2)'}}>
                  <div className={'cc ' + c.variant} style={{width: '100%', height: '100%', aspectRatio: 'auto', borderRadius: 6, padding: 0, boxShadow: 'none'}}/>
                </div>
                <div style={{minWidth: 0}}>
                  <div className="between" style={{gap: 8}}>
                    <div className="name" style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{c.bank.split(' ')[0]} · {c.product}</div>
                    <div className="bold small" style={{color: 'var(--good)'}}>+฿{c.saved}</div>
                  </div>
                  <div className="between" style={{marginTop: 2, gap: 8}}>
                    <div className="tiny muted">{c.perk}</div>
                    <div className="tiny muted">{pct}%</div>
                  </div>
                  <div className={'progress ' + (hi ? 'warn' : 'brand')} style={{marginTop: 5, height: 4}}><i style={{width: pct + '%'}}/></div>
                </div>
                <Icon name="chevronRight" size={16} stroke={1.5} style={{color: 'var(--ink-4)'}}/>
              </div>
            );
          })}
        </div>
        <div className="surface" style={{marginTop: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)'}}>
          <div><div className="bold small">รวมประหยัดเดือนนี้</div><div className="tiny muted">จากทุกบัตร</div></div>
          <div className="bold" style={{fontSize: 18, color: 'var(--good)'}}>+฿3,473</div>
        </div>
        <div style={{height: 8}}/>
      </div>
      <TabBar active="wallet"/>
    </div>
  );
}

function ListAdd() {
  return (
    <FlowFrame title="เพิ่มบัตรใหม่" footer={<PrimaryBtn icon="chevronRight">ถัดไป</PrimaryBtn>}>
      <div style={{marginTop: 2, marginBottom: 6}}>
        <StepDots step={1} total={4}/>
        <div className="between" style={{marginTop: 10}}>
          <div style={{fontSize: 18, fontWeight: 700, letterSpacing: '-.4px'}}>เลือกธนาคาร</div>
          <div className="tiny muted">ขั้น 1/4</div>
        </div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, marginBottom: 10}}>
        <Icon name="search" size={16} style={{color: 'var(--ink-4)'}}/>
        <span className="small" style={{color: 'var(--ink-4)'}}>ค้นหาธนาคารหรือผู้ออกบัตร</span>
      </div>
      <div className="col" style={{gap: 7}}>
        {[{n:'KASIKORNBANK',c:'#0a8665',i:'K',sel:true},{n:'SCB',c:'#5e2b8f',i:'ส'},{n:'KTC',c:'#e3603f',i:'K'},{n:'UOB',c:'#1c2a6a',i:'U'},{n:'AEON',c:'#d9416f',i:'A'},{n:'American Express',c:'#2c343c',i:'A'}].map((b, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px',
            background: 'var(--surface)', borderRadius: 12, border: '1.5px solid ' + (b.sel ? 'var(--brand-600)' : 'var(--line)')}}>
            <div style={{width: 36, height: 36, borderRadius: 9, background: b.c, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 600, flex: '0 0 36px'}}>{b.i}</div>
            <div className="small bold" style={{flex: 1}}>{b.n}</div>
            {b.sel
              ? <div style={{width: 22, height: 22, borderRadius: 999, background: 'var(--brand-600)', color: '#fff', display: 'grid', placeItems: 'center'}}><Icon name="check" size={13} stroke={2.5}/></div>
              : <div style={{width: 22, height: 22, borderRadius: 999, border: '2px solid var(--surface-3)'}}/>}
          </div>
        ))}
      </div>
    </FlowFrame>
  );
}

/* ════════════════════════════════════════════════════════════
   PAIR 4 · EDITORIAL — minimal / calm  (new direction)
   Home: airy, typographic, hairline rows · Add: quick-add, big inputs
   ════════════════════════════════════════════════════════════ */
function EditorialHome() {
  const featured = CC[0];
  return (
    <div className="phone">
      <StatusBar/>
      <div className="app-header" style={{padding: '16px 22px 4px'}}>
        <div>
          <div className="tiny" style={{textTransform: 'uppercase', letterSpacing: '1.4px', color: 'var(--ink-4)', fontWeight: 600}}>กระเป๋าบัตร</div>
          <h1 style={{fontSize: 30, marginTop: 4, fontWeight: 600}}>{CC.length} ใบ</h1>
        </div>
        <div className="icon-btn" style={{borderRadius: 999}}><Icon name="search" size={18}/></div>
      </div>
      <div className="app-body scroll-y" style={{padding: '8px 22px 12px'}}>
        <CreditCard {...featured} size="md"/>
        <div className="between" style={{margin: '14px 2px 4px'}}>
          <div className="tiny" style={{textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-4)', fontWeight: 600}}>บัตรของคุณ</div>
          <span className="tiny muted">ประหยัด ฿2,209</span>
        </div>
        <div className="col">
          {CC.slice(1).map((c, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 2px',
              borderTop: '1px solid var(--line-soft)'}}>
              <div style={{width: 32, height: 32, borderRadius: 8, background: c.c, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 14, flex: '0 0 32px'}}>{c.i}</div>
              <div style={{flex: 1, minWidth: 0}}>
                <div className="bold" style={{fontSize: 14, letterSpacing: '-.2px'}}>{c.product}</div>
                <div className="tiny muted">{c.bank.split(' ')[0]} ·  •••• {c.number}</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div className="tiny" style={{color: 'var(--ink-2)', fontWeight: 600}}>{c.perk}</div>
              </div>
            </div>
          ))}
        </div>
        <button style={{width: '100%', marginTop: 18, padding: '13px', borderRadius: 999,
          background: 'var(--ink)', color: 'var(--bg)', border: 'none', fontFamily: 'inherit',
          fontSize: 14, fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: 'pointer'}}>
          <Icon name="plus" size={17}/> เพิ่มบัตร
        </button>
        <div style={{height: 8}}/>
      </div>
      <TabBar active="wallet"/>
    </div>
  );
}

function EditorialAdd() {
  return (
    <FlowFrame title="" footer={<PrimaryBtn icon="check">เพิ่มบัตร</PrimaryBtn>}>
      <div style={{padding: '12px 4px 0'}}>
        <div className="tiny" style={{textTransform: 'uppercase', letterSpacing: '1.4px', color: 'var(--ink-4)', fontWeight: 600}}>เพิ่มบัตรแบบเร็ว</div>
        <h1 style={{fontSize: 28, margin: '6px 0 4px', fontWeight: 600, letterSpacing: '-.5px'}}>บัตรใบใหม่</h1>
        <div className="small muted" style={{lineHeight: 1.45, maxWidth: 260}}>ใส่แค่ธนาคารกับ 4 ตัวท้าย — เราดึงลายบัตรและสิทธิ์ที่เหลือให้อัตโนมัติ</div>
      </div>

      <div style={{marginTop: 26}}>
        <div className="tiny" style={{color: 'var(--ink-3)', fontWeight: 600, margin: '0 2px 8px'}}>ธนาคาร</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, border: '1.5px solid var(--line)', background: 'var(--surface)'}}>
          <div style={{width: 38, height: 38, borderRadius: 10, background: '#0a8665', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 16}}>K</div>
          <div style={{flex: 1, fontSize: 16, fontWeight: 600}}>KASIKORNBANK</div>
          <Icon name="chevronDown" size={18} style={{color: 'var(--ink-4)'}}/>
        </div>
      </div>

      <div style={{marginTop: 22}}>
        <div className="tiny" style={{color: 'var(--ink-3)', fontWeight: 600, margin: '0 2px 10px'}}>เลข 4 ตัวท้าย</div>
        <div className="row" style={{gap: 12, justifyContent: 'center'}}>
          {['4','5','2','1'].map((d, i) => (
            <div key={i} style={{width: 60, height: 72, borderRadius: 16, display: 'grid', placeItems: 'center',
              border: '1.5px solid ' + (i === 3 ? 'var(--brand-600)' : 'var(--line)'),
              boxShadow: i === 3 ? '0 0 0 3px var(--brand-50)' : 'none',
              background: 'var(--surface)', fontSize: 30, fontWeight: 600, fontFamily: 'var(--font-mono)'}}>{d}</div>
          ))}
        </div>
        <div className="tiny muted" style={{textAlign: 'center', marginTop: 12}}>เก็บแค่ 4 ตัวท้ายเท่านั้น · ไม่เก็บเลขเต็ม</div>
      </div>
    </FlowFrame>
  );
}

/* ════════════════════════════════════════════════════════════
   PAIR 5 · CAROUSEL — playful / focused  (new direction)
   Home: coverflow carousel + focused stats · Add: visual bank grid
   ════════════════════════════════════════════════════════════ */
function CarouselHome() {
  const focus = CC[0];
  const pct = Math.round(focus.used / focus.cap * 100);
  return (
    <div className="phone">
      <StatusBar/>
      <div className="app-header">
        <div>
          <h1>บัตรของฉัน</h1>
          <div className="sub">ปัดเพื่อเลือกบัตร · {CC.length} ใบ</div>
        </div>
        <div className="icon-btn"><Icon name="settings" size={18}/></div>
      </div>
      <div className="app-body scroll-y" style={{padding: '4px 0 12px'}}>
        {/* coverflow */}
        <div style={{position: 'relative', height: 218, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{position: 'absolute', left: -54, width: 200, opacity: .55, transform: 'scale(.84)', filter: 'brightness(.95)'}}>
            <CreditCard {...CC[4]} size="md"/>
          </div>
          <div style={{position: 'absolute', right: -54, width: 200, opacity: .55, transform: 'scale(.84)', filter: 'brightness(.95)'}}>
            <CreditCard {...CC[1]} size="md"/>
          </div>
          <div style={{width: 250, zIndex: 2, boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--r-card)'}}>
            <CreditCard {...focus} size="md"/>
          </div>
        </div>
        <div className="row" style={{gap: 6, justifyContent: 'center', marginTop: 14}}>
          {CC.map((_, i) => (
            <span key={i} style={{height: 6, borderRadius: 999, transition: 'all .2s',
              width: i === 0 ? 20 : 6, background: i === 0 ? 'var(--brand-600)' : 'var(--surface-3)'}}/>
          ))}
        </div>
        <div style={{padding: '0 18px'}}>
          <div className="between" style={{marginTop: 18}}>
            <div>
              <div className="bold" style={{fontSize: 16, letterSpacing: '-.2px'}}>{focus.bank.split(' ')[0]} · {focus.product}</div>
              <div className="tiny muted" style={{marginTop: 2}}>{focus.perk} · •••• {focus.number}</div>
            </div>
            <span className="chip brand">บัตรหลัก</span>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14}}>
            <div className="stat"><div className="label">ใช้ไป</div><div className="value">฿{money(focus.used)}</div><div className="progress brand" style={{marginTop: 6}}><i style={{width: pct + '%'}}/></div></div>
            <div className="stat"><div className="label">ประหยัด</div><div className="value" style={{color: 'var(--good)'}}>+฿{focus.saved}</div><div className="delta up">+18% MoM</div></div>
          </div>
          <button style={{width: '100%', marginTop: 14, padding: '13px', borderRadius: 'var(--r-md)',
            background: 'var(--brand-600)', color: '#fff', border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: 'pointer',
            boxShadow: '0 4px 12px -2px rgba(15,142,90,.35)'}}>
            <Icon name="plus" size={17}/> เพิ่มบัตรใหม่
          </button>
        </div>
        <div style={{height: 8}}/>
      </div>
      <TabBar active="wallet"/>
    </div>
  );
}

function CarouselAdd() {
  return (
    <FlowFrame title="เพิ่มบัตร" sub="เริ่มจากเลือกธนาคาร"
      footer={<GhostBtn icon="search">หาธนาคารอื่น</GhostBtn>}>
      <div style={{display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, marginTop: 4, marginBottom: 14}}>
        <Icon name="search" size={16} style={{color: 'var(--ink-4)'}}/>
        <span className="small" style={{color: 'var(--ink-4)'}}>ค้นหา 200+ ผู้ออกบัตร</span>
      </div>
      <div className="tiny" style={{color: 'var(--ink-3)', fontWeight: 600, margin: '0 2px 10px'}}>ยอดนิยม</div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10}}>
        {POP_BANKS.map((b, i) => (
          <div key={i} style={{aspectRatio: '1 / 1', borderRadius: 16, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            border: '1.5px solid ' + (i === 0 ? 'var(--brand-600)' : 'var(--line)'),
            background: i === 0 ? 'var(--brand-50)' : 'var(--surface)', position: 'relative'}}>
            {i === 0 && <span style={{position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 999, background: 'var(--brand-600)', color: '#fff', display: 'grid', placeItems: 'center'}}><Icon name="check" size={11} stroke={2.5}/></span>}
            <div style={{width: 42, height: 42, borderRadius: 12, background: b.c, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 18}}>{b.i}</div>
            <div className="tiny bold" style={{color: 'var(--ink-2)'}}>{b.n}</div>
          </div>
        ))}
      </div>
      <div className="surface" style={{marginTop: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 11, background: 'var(--surface-2)'}}>
        <div style={{width: 32, height: 32, borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)'}}><Icon name="camera" size={16}/></div>
        <div style={{flex: 1}}><div className="small bold">หรือสแกนบัตรเลย</div><div className="tiny muted">กล้องอ่านธนาคาร + เลขให้อัตโนมัติ</div></div>
        <Icon name="chevronRight" size={16} style={{color: 'var(--ink-4)'}}/>
      </div>
    </FlowFrame>
  );
}

Object.assign(window, {
  DeckHome, DeckAdd, DashHome, DashAdd, ListHome, ListAdd,
  EditorialHome, EditorialAdd, CarouselHome, CarouselAdd,
});
