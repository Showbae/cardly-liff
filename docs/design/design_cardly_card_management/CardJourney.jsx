// CardJourney.jsx — Add-card JOURNEY = pack 3 stepped wizard + pack 2 live preview.
// Sequence: 1 เลือกธนาคาร → 2 รายละเอียด (พรีวิวสด) → 3 สิทธิ์ & รอบบัตร → 4 สำเร็จ.
// Relies on HiFiShell.jsx + CardManageShell.jsx globals.

function JHeader({ step, label, total = 4 }) {
  return (
    <div style={{marginTop: 2, marginBottom: 8}}>
      <StepDots step={step} total={total}/>
      <div className="between" style={{marginTop: 10}}>
        <div style={{fontSize: 18, fontWeight: 700, letterSpacing: '-.4px'}}>{label}</div>
        <div className="tiny muted">ขั้น {step}/{total}</div>
      </div>
    </div>
  );
}

function JFooter({ onBack = true, next = 'ถัดไป', icon = 'chevronRight' }) {
  if (!onBack) return <PrimaryBtn icon={icon}>{next}</PrimaryBtn>;
  return (
    <div className="row" style={{gap: 8}}>
      <div style={{flex: '0 0 96px'}}><GhostBtn>ย้อนกลับ</GhostBtn></div>
      <div style={{flex: 1}}><PrimaryBtn icon={icon}>{next}</PrimaryBtn></div>
    </div>
  );
}

// Slim card preview that rides along the journey (pack 2 signature)
function PreviewCard({ size = 'md' }) {
  return (
    <CreditCard variant="kbank-journey" bank="KASIKORNBANK" product="Journey Platinum"
      number="4521" name="Showbae T." network="visa" size={size}/>
  );
}

/* ── Step 1 · เลือกธนาคาร (from wizard) ───────────────────── */
function JStep1Bank() {
  const banks = [
    { n: 'KASIKORNBANK', c: '#0a8665', i: 'K', sel: true },
    { n: 'SCB', c: '#5e2b8f', i: 'ส' },
    { n: 'KTC', c: '#e3603f', i: 'K' },
    { n: 'UOB', c: '#1c2a6a', i: 'U' },
    { n: 'AEON', c: '#d9416f', i: 'A' },
    { n: 'American Express', c: '#2c343c', i: 'A' },
  ];
  return (
    <FlowFrame title="เพิ่มบัตร" footer={<JFooter onBack={false}/>}>
      <JHeader step={1} label="เลือกธนาคาร"/>
      <div style={{display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, marginBottom: 10}}>
        <Icon name="search" size={16} style={{color: 'var(--ink-4)'}}/>
        <span className="small" style={{color: 'var(--ink-4)'}}>ค้นหาธนาคารหรือผู้ออกบัตร</span>
      </div>
      <div className="col" style={{gap: 7}}>
        {banks.map((b, i) => (
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

/* ── Step 2 · รายละเอียด + พรีวิวสด (merge 2+3) ───────────── */
function JStep2Details() {
  return (
    <FlowFrame title="เพิ่มบัตร" footer={<JFooter/>}>
      <JHeader step={2} label="รายละเอียดบัตร"/>
      <PreviewCard/>
      <div className="tiny muted" style={{textAlign: 'center', margin: '8px 0 0'}}>พรีวิวอัปเดตตามที่กรอก · เก็บแค่ 4 ตัวท้าย</div>
      <FieldGroup label="ข้อมูลบัตร" hint="จำเป็น">
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

/* ── Step 3 · สิทธิ์ & รอบบัตร (wizard) ───────────────────── */
function JStep3Rewards() {
  const types = [
    { id: 'cashback', label: 'Cashback', icon: 'gift', sel: true },
    { id: 'miles', label: 'ไมล์', icon: 'trending' },
    { id: 'points', label: 'พอยต์', icon: 'star' },
  ];
  return (
    <FlowFrame title="เพิ่มบัตร" footer={<JFooter next="เพิ่มบัตร" icon="check"/>}>
      <JHeader step={3} label="สิทธิ์ & รอบบัตร"/>
      {/* continuity chip-card */}
      <div className="surface" style={{display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', marginBottom: 4}}>
        <div style={{width: 46, height: 29, borderRadius: 5, background: 'linear-gradient(135deg,#1c8c75,#07332a)', flex: '0 0 46px'}}/>
        <div style={{flex: 1, minWidth: 0}}>
          <div className="small bold">KBANK · Journey Platinum</div>
          <div className="tiny muted">•••• 4521 · VISA</div>
        </div>
        <Icon name="check" size={16} style={{color: 'var(--good)'}}/>
      </div>
      <FieldGroup label="ประเภทสิทธิประโยชน์">
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7}}>
          {types.map(t => (
            <div key={t.id} style={{padding: '12px 4px', borderRadius: 12, textAlign: 'center',
              border: '1.5px solid ' + (t.sel ? 'var(--brand-600)' : 'var(--line)'),
              background: t.sel ? 'var(--brand-50)' : 'var(--surface)',
              color: t.sel ? 'var(--brand-700)' : 'var(--ink-3)'}}>
              <Icon name={t.icon} size={20}/>
              <div className="tiny" style={{fontWeight: 600, marginTop: 5}}>{t.label}</div>
            </div>
          ))}
        </div>
        <FieldBox label="อัตรา" value="1" suffix="% ทุกหมวด" focused/>
      </FieldGroup>
      <FieldGroup label="รอบบัตร & วงเงิน">
        <FieldRow2>
          <FieldBox label="วันสรุปยอด" value="ทุกวันที่ 5" chevron/>
          <FieldBox label="วันครบกำหนด" value="ทุกวันที่ 25" chevron/>
        </FieldRow2>
        <FieldBox label="วงเงิน" value="60,000" prefix="฿" chevron/>
      </FieldGroup>
      <div style={{height: 4}}/>
    </FlowFrame>
  );
}

/* ── Step 4 · สำเร็จ ──────────────────────────────────────── */
function JStep4Done() {
  return (
    <FlowFrame title="" back={false}
      footer={<div className="col" style={{gap: 8}}><PrimaryBtn>ดูบัตรในกระเป๋า</PrimaryBtn><GhostBtn icon="plus">เพิ่มอีกใบ</GhostBtn></div>}>
      <div style={{marginTop: 6}}><StepDots step={4} total={4}/></div>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 4, marginTop: -20}}>
        <div style={{width: 78, height: 78, borderRadius: 999, background: 'var(--good-bg)', display: 'grid', placeItems: 'center', marginBottom: 8}}>
          <div style={{width: 52, height: 52, borderRadius: 999, background: 'var(--good)', color: '#fff', display: 'grid', placeItems: 'center'}}>
            <Icon name="check" size={28} stroke={2.5}/>
          </div>
        </div>
        <div style={{fontSize: 19, fontWeight: 700, letterSpacing: '-.3px'}}>เพิ่มบัตรสำเร็จ</div>
        <div className="small muted" style={{maxWidth: 230, lineHeight: 1.4}}>KBANK Journey Platinum •••• 4521 พร้อมใช้งานแล้ว</div>
        <div style={{marginTop: 18, width: 210}}><PreviewCard size="md"/></div>
      </div>
    </FlowFrame>
  );
}

Object.assign(window, { JStep1Bank, JStep2Details, JStep3Rewards, JStep4Done });
