// CardManageShell.jsx — FlowFrame + reusable form field components for card management flows

// ── FlowFrame: phone shell with top app-bar + optional bottom action bar (no tab bar) ──
function FlowFrame({ title, sub, back = true, action, children, footer, bodyStyle, dark = false }) {
  return (
    <div className="phone" style={dark ? {background: 'var(--ink)'} : undefined}>
      <StatusBar/>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '6px 14px 10px', flex: '0 0 auto',
      }}>
        {back && (
          <div style={{
            width: 34, height: 34, borderRadius: 11,
            background: 'var(--surface)', border: '1px solid var(--line)',
            display: 'grid', placeItems: 'center', color: 'var(--ink-2)', flex: '0 0 34px',
          }}>
            <Icon name="chevronRight" size={17} style={{transform: 'scaleX(-1)'}}/>
          </div>
        )}
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{fontSize: 16, fontWeight: 600, letterSpacing: '-.3px'}}>{title}</div>
          {sub && <div className="tiny muted" style={{marginTop: 1}}>{sub}</div>}
        </div>
        {action}
      </div>
      <div className="app-body scroll-y" style={{paddingTop: 2, ...bodyStyle}}>
        {children}
      </div>
      {footer && (
        <div style={{
          flex: '0 0 auto',
          padding: '10px 16px 14px',
          borderTop: '1px solid var(--line-soft)',
          background: 'var(--surface)',
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}

// ── Primary / secondary buttons ──
function PrimaryBtn({ children, icon, full = true, tone = 'brand' }) {
  const bg = tone === 'danger' ? 'var(--warn)' : 'var(--brand-600)';
  return (
    <button style={{
      width: full ? '100%' : 'auto',
      padding: '12px 18px',
      borderRadius: 13,
      background: bg, color: '#fff',
      border: 'none', fontFamily: 'inherit',
      fontSize: 14, fontWeight: 600, letterSpacing: '-.1px',
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 7,
      cursor: 'pointer', boxShadow: '0 4px 12px -2px ' + (tone === 'danger' ? 'rgba(227,107,63,.4)' : 'rgba(15,142,90,.35)'),
    }}>
      {icon && <Icon name={icon} size={16}/>}
      {children}
    </button>
  );
}
function GhostBtn({ children, icon, tone = 'ink' }) {
  const col = tone === 'danger' ? 'var(--warn)' : 'var(--ink-2)';
  return (
    <button style={{
      width: '100%', padding: '11px 18px',
      borderRadius: 13, background: 'transparent',
      border: '1.5px solid ' + (tone === 'danger' ? 'var(--warn)' : 'var(--line)'),
      color: col, fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 7, cursor: 'pointer',
    }}>
      {icon && <Icon name={icon} size={16}/>}
      {children}
    </button>
  );
}

// ── Section label ──
function FieldGroup({ label, hint, children, style }) {
  return (
    <div style={{marginTop: 16, ...style}}>
      {label && (
        <div className="between" style={{margin: '0 2px 8px'}}>
          <div className="tiny" style={{
            fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase',
            color: 'var(--ink-3)', fontSize: 10,
          }}>{label}</div>
          {hint && <div className="tiny muted">{hint}</div>}
        </div>
      )}
      <div className="col" style={{gap: 8}}>{children}</div>
    </div>
  );
}

// ── FieldBox: filled field. Shows value or placeholder; focused = active editing ──
function FieldBox({ label, value, placeholder, chevron, prefix, suffix, focused, hint, error, required, onTapStyle }) {
  return (
    <div>
      <div style={{
        background: 'var(--surface)',
        border: '1.5px solid ' + (error ? 'var(--warn)' : focused ? 'var(--brand-600)' : 'var(--line)'),
        borderRadius: 12,
        padding: '9px 13px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: focused ? '0 0 0 3px var(--brand-50)' : 'none',
        ...onTapStyle,
      }}>
        <div style={{flex: 1, minWidth: 0}}>
          <div className="tiny" style={{color: focused ? 'var(--brand-700)' : 'var(--ink-3)', fontWeight: 500, fontSize: 10.5}}>
            {label}{required && <span style={{color: 'var(--warn)'}}> *</span>}
          </div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2}}>
            {prefix && value && <span style={{fontSize: 14, color: 'var(--ink-3)'}}>{prefix}</span>}
            <span style={{
              fontSize: 14.5, fontWeight: value ? 500 : 400,
              color: value ? 'var(--ink)' : 'var(--ink-4)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{value || placeholder}</span>
            {suffix && value && <span style={{fontSize: 13, color: 'var(--ink-3)'}}>{suffix}</span>}
            {focused && <span style={{width: 1.5, height: 16, background: 'var(--brand-600)', marginLeft: 1, animation: 'caret 1s steps(1) infinite'}}/>}
          </div>
        </div>
        {chevron && <Icon name="chevronRight" size={16} style={{color: 'var(--ink-4)'}}/>}
      </div>
      {(hint || error) && (
        <div className="tiny" style={{margin: '5px 2px 0', color: error ? 'var(--warn)' : 'var(--ink-4)'}}>
          {error || hint}
        </div>
      )}
    </div>
  );
}

// ── Two fields side by side ──
function FieldRow2({ children }) {
  return <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>{children}</div>;
}

// ── Toggle row ──
function ToggleRow({ label, sub, on = true, icon }) {
  return (
    <div className="surface" style={{padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 11}}>
      {icon && (
        <div style={{
          width: 32, height: 32, borderRadius: 9, background: 'var(--surface-2)',
          display: 'grid', placeItems: 'center', color: 'var(--ink-2)', flex: '0 0 32px',
        }}><Icon name={icon} size={16}/></div>
      )}
      <div style={{flex: 1, minWidth: 0}}>
        <div className="small bold" style={{letterSpacing: '-.1px'}}>{label}</div>
        {sub && <div className="tiny muted" style={{marginTop: 1}}>{sub}</div>}
      </div>
      <div style={{
        width: 42, height: 25, borderRadius: 999, flex: '0 0 42px',
        background: on ? 'var(--brand-600)' : 'var(--surface-3)',
        position: 'relative', transition: 'background .2s',
      }}>
        <span style={{
          position: 'absolute', top: 2.5, left: on ? 20 : 2.5,
          width: 20, height: 20, borderRadius: 999, background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,.25)', transition: 'left .2s',
        }}/>
      </div>
    </div>
  );
}

// ── Network picker (segmented) ──
function NetworkPicker({ value = 'visa' }) {
  const nets = [
    { id: 'visa', label: 'VISA' },
    { id: 'mastercard', label: 'Master' },
    { id: 'jcb', label: 'JCB' },
    { id: 'amex', label: 'AMEX' },
  ];
  return (
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6}}>
      {nets.map(n => {
        const sel = n.id === value;
        return (
          <div key={n.id} style={{
            padding: '9px 4px', borderRadius: 10, textAlign: 'center',
            border: '1.5px solid ' + (sel ? 'var(--brand-600)' : 'var(--line)'),
            background: sel ? 'var(--brand-50)' : 'var(--surface)',
            color: sel ? 'var(--brand-700)' : 'var(--ink-3)',
            fontSize: 11, fontWeight: 600, letterSpacing: '.2px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            {sel && <Icon name="check" size={12}/>}
            {n.label}
          </div>
        );
      })}
    </div>
  );
}

// ── Color / design picker ──
const CARD_SWATCHES = [
  { id: 'kbank-journey', bg: 'linear-gradient(135deg, #1c8c75, #07332a)' },
  { id: 'scb-m',         bg: 'linear-gradient(135deg, #6b2d8c, #341252)' },
  { id: 'ktc-cb',        bg: 'linear-gradient(135deg, #e3603f, #a02b1f)' },
  { id: 'uob-pm',        bg: 'linear-gradient(135deg, #c8253e, #1c2a6a)' },
  { id: 'amex-plat',     bg: 'linear-gradient(135deg, #c1c7cd, #2f3942)' },
  { id: 'ink',           bg: 'linear-gradient(135deg, #2a3a33, #0c1612)' },
];
function ColorPicker({ value = 'kbank-journey' }) {
  return (
    <div className="row" style={{gap: 9}}>
      {CARD_SWATCHES.map(s => {
        const sel = s.id === value;
        return (
          <div key={s.id} style={{
            width: 40, height: 26, borderRadius: 6, background: s.bg,
            border: sel ? '2px solid var(--ink)' : '2px solid transparent',
            boxShadow: sel ? '0 0 0 2px var(--bg), 0 2px 5px rgba(0,0,0,.2)' : '0 1px 3px rgba(0,0,0,.15)',
            position: 'relative',
          }}>
            {sel && <span style={{
              position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff',
            }}><Icon name="check" size={13}/></span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Step dots / progress ──
function StepDots({ step = 1, total = 4 }) {
  return (
    <div className="row" style={{gap: 5}}>
      {Array.from({length: total}, (_, i) => (
        <span key={i} style={{
          height: 4, borderRadius: 999, transition: 'all .2s',
          flex: i + 1 === step ? '0 0 22px' : '0 0 7px',
          background: i + 1 <= step ? 'var(--brand-600)' : 'var(--surface-3)',
        }}/>
      ))}
    </div>
  );
}

Object.assign(window, {
  FlowFrame, PrimaryBtn, GhostBtn, FieldGroup, FieldBox, FieldRow2,
  ToggleRow, NetworkPicker, ColorPicker, CARD_SWATCHES, StepDots,
});
