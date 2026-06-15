// HiFiShell.jsx — PhoneFrame, StatusBar, TabBar, Icons (inline SVG)

// ── Inline SVG icons (Lucide-style strokes) ──
const Icon = ({ name, size = 20, stroke = 1.75, ...rest }) => {
  const s = size;
  const sw = stroke;
  const props = {
    width: s, height: s,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: sw,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...rest,
  };
  switch (name) {
    case 'wallet':
      return <svg {...props}><path d="M3 8a2 2 0 0 1 2-2h13a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/><path d="M17 14h.01"/><path d="M21 11h-6a2 2 0 0 0 0 4h6"/></svg>;
    case 'search':
      return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'bell':
      return <svg {...props}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
    case 'user':
      return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case 'plus':
      return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'settings':
      return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'chevronRight':
      return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chevronDown':
      return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case 'sparkle':
      return <svg {...props}><path d="M9.94 6.06 12 2l2.06 4.06L18 8l-3.94 1.94L12 14l-2.06-4.06L6 8l3.94-1.94z"/><path d="M19 14l1 2.5L22 18l-2 .5L19 21l-1-2.5L16 18l2-1.5z"/></svg>;
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'trending':
      return <svg {...props}><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>;
    case 'filter':
      return <svg {...props}><path d="M3 5h18M6 12h12M10 19h4"/></svg>;
    case 'sort':
      return <svg {...props}><path d="M3 6h13M3 12h9M3 18h5M17 8V4m0 0-2 2m2-2 2 2M17 16v4m0 0-2-2m2 2 2-2"/></svg>;
    case 'qr':
      return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM21 14v3M14 21h3M21 21h-3"/></svg>;
    case 'camera':
      return <svg {...props}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.5"/></svg>;
    case 'flame':
      return <svg {...props}><path d="M12 22c4.5 0 8-3.5 8-8 0-3-2-5-3-7-2 2.5-2.5 4-4 4-1 0-1.5-1-1.5-2.5C11.5 6 12 4 12 2c-3 2-7 5-7 12 0 4.5 3.5 8 7 8z"/></svg>;
    case 'star':
      return <svg {...props}><path d="M12 2 14.5 8.5 21 9.3l-5 4.6 1.5 6.8L12 17.3 6.5 20.7 8 13.9l-5-4.6 6.5-.8z"/></svg>;
    case 'arrowUpRight':
      return <svg {...props}><path d="M7 17 17 7M8 7h9v9"/></svg>;
    case 'check':
      return <svg {...props}><path d="m5 13 4 4L19 7"/></svg>;
    case 'circle':
      return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>;
    case 'shield':
      return <svg {...props}><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4z"/></svg>;
    case 'home':
      return <svg {...props}><path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9z"/></svg>;
    case 'compass':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/></svg>;
    case 'creditCard':
      return <svg {...props}><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h3"/></svg>;
    case 'lightning':
      return <svg {...props}><path d="m13 2-9 12h7l-1 8 9-12h-7z"/></svg>;
    case 'gift':
      return <svg {...props}><path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
    case 'mapPin':
      return <svg {...props}><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'tag':
      return <svg {...props}><path d="m20.6 13.4-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="8" cy="8" r="1.5"/></svg>;
    case 'menu':
      return <svg {...props}><path d="M3 6h18M3 12h18M3 18h18"/></svg>;
    case 'eye':
      return <svg {...props}><path d="M1.5 12s4-7 10.5-7 10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eyeOff':
      return <svg {...props}><path d="M3 3l18 18M10.5 6.5A11 11 0 0 1 12 5c6.5 0 10.5 7 10.5 7a18 18 0 0 1-3 4M6.5 6.5C3.5 8.5 1.5 12 1.5 12s4 7 10.5 7c1.5 0 2.9-.3 4.2-.8M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>;
    case 'cellSignal':
      return <svg {...props} strokeWidth="1.5"><rect x="2"  y="9"  width="3" height="6" rx=".5" fill="currentColor" stroke="none"/><rect x="7"  y="7"  width="3" height="8" rx=".5" fill="currentColor" stroke="none"/><rect x="12" y="5"  width="3" height="10" rx=".5" fill="currentColor" stroke="none"/><rect x="17" y="3"  width="3" height="12" rx=".5" fill="currentColor" stroke="none"/></svg>;
    case 'wifi':
      return <svg {...props}><path d="M2 8.5C5 5.5 8.4 4 12 4s7 1.5 10 4.5"/><path d="M5 12c2-2 4.4-3 7-3s5 1 7 3"/><path d="M8.5 15.5c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>;
    case 'battery':
      return <svg {...props}><rect x="2" y="7" width="18" height="10" rx="2.5"/><path d="M22 11v2"/><rect x="4" y="9" width="13" height="6" rx="1" fill="currentColor" stroke="none"/></svg>;
    case 'x':
      return <svg {...props}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case 'trash':
      return <svg {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/></svg>;
    case 'archive':
      return <svg {...props}><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/></svg>;
    case 'snowflake':
      return <svg {...props}><path d="M12 2v20M4 7l16 10M20 7 4 17M12 6l3-3M12 6 9 3M12 18l3 3M12 18l-3 3M5.5 9.5 2 9m3.5 .5L5 5.5m13.5 4L22 9m-3.5 .5L19 5.5M5.5 14.5 2 15m3.5-.5L5 18.5m13.5-4L22 15m-3.5-.5.5 4"/></svg>;
    case 'lock':
      return <svg {...props}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
    case 'pencil':
      return <svg {...props}><path d="M16 3 21 8 8 21H3v-5L16 3z"/><path d="M13.5 5.5 18.5 10.5"/></svg>;
    case 'image':
      return <svg {...props}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 4.5-4.5 3 3L16 11l4 4.5"/></svg>;
    case 'undo':
      return <svg {...props}><path d="M9 7 4 12l5 5M4 12h11a5 5 0 0 1 0 10h-3"/></svg>;
    case 'building':
      return <svg {...props}><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/></svg>;
    case 'nfc':
      return <svg {...props}><path d="M6 8a14 14 0 0 1 0 8M10 6a20 20 0 0 1 0 12M14 6a20 20 0 0 0 0 12M18 8a14 14 0 0 0 0 8"/></svg>;
    case 'link':
      return <svg {...props}><path d="M9 15 15 9M10.5 6.5 12 5a4 4 0 0 1 6 6l-1.5 1.5M13.5 17.5 12 19a4 4 0 0 1-6-6l1.5-1.5"/></svg>;
    case 'grip':
      return <svg {...props}><circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/></svg>;
    case 'minus':
      return <svg {...props}><path d="M5 12h14"/></svg>;
    case 'calendar':
      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case 'alert':
      return <svg {...props}><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>;
    case 'layers':
      return <svg {...props}><path d="m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5"/></svg>;
    case 'message':
      return <svg {...props}><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/></svg>;
    case 'ellipsis':
      return <svg {...props}><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>;
    case 'phone':
      return <svg {...props}><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>;
    default:
      return null;
  }
};

// ── StatusBar (iOS-like) ──
function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <span className="right">
        <Icon name="cellSignal" size={16} stroke={1.5}/>
        <Icon name="wifi" size={16} stroke={1.5}/>
        <Icon name="battery" size={22} stroke={1.5}/>
      </span>
    </div>
  );
}

// ── TabBar ──
function TabBar({ active = 'wallet' }) {
  const tabs = [
    { id: 'wallet',   icon: 'wallet',   label: 'บัตร' },
    { id: 'discover', icon: 'compass',  label: 'โปร' },
    { id: 'alerts',   icon: 'bell',     label: 'แจ้งเตือน' },
    { id: 'me',       icon: 'user',     label: 'ฉัน' },
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

// ── PhoneFrame ──
function PhoneFrame({ children, active = 'wallet' }) {
  return (
    <div className="phone">
      <StatusBar/>
      {children}
      <TabBar active={active}/>
    </div>
  );
}

// ── Credit Card visual ──
// Inline chip + contactless SVG
function CardChip({ size = 26, color = 'rgba(255,255,255,.95)' }) {
  return (
    <svg width={size} height={size * 0.78} viewBox="0 0 32 25" fill="none" className="chip-svg">
      <rect x="1" y="1" width="30" height="23" rx="4" fill="#dcc78c"/>
      <rect x="1" y="1" width="30" height="23" rx="4" fill="url(#chipGrad)" fillOpacity=".7"/>
      <path d="M12 1v8M20 1v8M12 16v8M20 16v8M1 8h12M19 8h12M1 16h12M19 16h12M12 8v8M20 8v8" stroke="rgba(0,0,0,.3)" strokeWidth=".8"/>
      <defs>
        <linearGradient id="chipGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff5d6"/>
          <stop offset="1" stopColor="#9b7d2c"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
function Contactless({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="wave-svg">
      <path d="M8 8c1 1.4 1 6.6 0 8M11 5c2.5 3 2.5 11 0 14M14 2c4 4.5 4 15.5 0 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".9"/>
    </svg>
  );
}

// network mark (Visa / Mastercard / JCB) as text
function NetworkMark({ network = 'visa' }) {
  if (network === 'mastercard') {
    return (
      <svg width="30" height="20" viewBox="0 0 30 20">
        <circle cx="11" cy="10" r="7.5" fill="#eb001b"/>
        <circle cx="19" cy="10" r="7.5" fill="#f79e1b" fillOpacity=".9"/>
      </svg>
    );
  }
  if (network === 'jcb') {
    return <span className="cc-network" style={{fontSize: 11, letterSpacing: 1}}>JCB</span>;
  }
  if (network === 'amex') {
    return <span className="cc-network" style={{fontSize: 11, letterSpacing: 1}}>AMEX</span>;
  }
  return <span className="cc-network" style={{fontFamily: 'Georgia, serif', fontStyle: 'italic'}}>VISA</span>;
}

// CreditCard — full size with chip, contactless, number, name, network
function CreditCard({
  variant = 'kbank-journey',
  bank = 'KASIKORNBANK',
  product = 'Journey Platinum',
  number = '4521',
  name = 'Showbae T.',
  network = 'visa',
  mini = false,
  size = 'md', // 'sm', 'md', 'lg'
  style,
  children,
}) {
  return (
    <div className={'cc-wrap ' + size}>
      <div className={'cc ' + variant + (mini ? ' mini' : '')} style={style}>
        <div className="cc-row">
          <div>
            <div className="cc-bank">{bank}</div>
            <div className="cc-prod">{product}</div>
          </div>
          {!mini && <Contactless size={20}/>}
        </div>
        {!mini && (
          <div className="cc-row" style={{alignItems: 'flex-start'}}>
            <CardChip size={28}/>
          </div>
        )}
        <div>
          <div className="cc-num">•••• •••• •••• {number}</div>
          <div className="cc-row" style={{marginTop: mini ? 2 : 6}}>
            <div className="cc-name">{name}</div>
            {!mini && <NetworkMark network={network}/>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { Icon, StatusBar, TabBar, PhoneFrame, CreditCard, CardChip, Contactless, NetworkMark });
