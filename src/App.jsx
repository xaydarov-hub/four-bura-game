/**
 * ═══════════════════════════════════════════════════════════════
 *  KARTA O'YINI — ULTRA PREMIUM FRONTEND
 *  To'rt Bura (Kozel) + 108 — Real Multiplayer
 *  React + Socket.IO + Framer Motion
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

// ─── GLOBAL STYLES ───────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --deep:      #020408;
    --mid:       #060c16;
    --surface:   #0b1425;
    --surface2:  #0f1e38;
    --gold:      #f5c842;
    --gold2:     #ffaa00;
    --cyan:      #00e5ff;
    --pink:      #ff2d6e;
    --green:     #00ff94;
    --purple:    #a855f7;
    --red:       #ff3b5c;
    --blue:      #4488ff;
    --text:      #dde8ff;
    --dim:       #4a6080;
    --dimmer:    #2a3a50;
    --card-w:    #f0f5ff;
    --font-d:    'Cinzel Decorative', serif;
    --font-ui:   'Orbitron', monospace;
    --font-b:    'Rajdhani', sans-serif;
  }

  html, body, #root {
    width:100%; height:100%;
    background: var(--deep);
    color: var(--text);
    font-family: var(--font-b);
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--deep); }
  ::-webkit-scrollbar-thumb { background: var(--cyan); border-radius: 2px; }

  input, button { font-family: var(--font-b); }

  @keyframes bg-shift {
    0%,100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }
  @keyframes float-y {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-10px); }
  }
  @keyframes glow-pulse {
    0%,100% { opacity:.6; }
    50%      { opacity:1; }
  }
  @keyframes spin-slow {
    to { transform: rotate(360deg); }
  }
  @keyframes deal-in {
    from { transform: translateY(-60px) rotate(-8deg) scale(0.85); opacity:0; }
    to   { transform: translateY(0) rotate(0deg) scale(1); opacity:1; }
  }
  @keyframes particle-rise {
    0%   { transform:translateY(0) scale(1); opacity:.8; }
    100% { transform:translateY(-120px) scale(0); opacity:0; }
  }
  @keyframes scan {
    0%   { transform:translateY(-100%); }
    100% { transform:translateY(110vh); }
  }
  @keyframes shimmer {
    0%   { left:-100%; }
    100% { left:200%; }
  }
  @keyframes bounce-in {
    0%   { transform:scale(0.3); opacity:0; }
    50%  { transform:scale(1.1); }
    100% { transform:scale(1); opacity:1; }
  }
  @keyframes shake {
    0%,100% { transform:translateX(0); }
    25%      { transform:translateX(-6px); }
    75%      { transform:translateX(6px); }
  }
  @keyframes winner-flash {
    0%,100% { box-shadow:0 0 20px var(--gold); }
    50%      { box-shadow:0 0 60px var(--gold), 0 0 100px var(--gold2); }
  }

  .glass {
    background: rgba(11,20,37,0.75);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(0,229,255,0.12);
  }
  .glass2 {
    background: rgba(15,30,56,0.8);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.07);
  }
  .neon { text-shadow: 0 0 10px currentColor, 0 0 30px currentColor; }
  .shimmer-line {
    position:absolute; top:0; width:30%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);
    animation: shimmer 3s infinite;
    pointer-events:none;
  }
`;

if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ─── SOCKET SINGLETON ────────────────────────────────────────────
let _socket = null;
function getSocket() {
  if (!_socket) {
    _socket = io(SERVER_URL, { autoConnect: false, reconnection: true, reconnectionAttempts: 8, reconnectionDelay: 1000 });
  }
  return _socket;
}

// ─── CONSTANTS ───────────────────────────────────────────────────
const SUIT_SYM   = { spades:'♠', hearts:'♥', diamonds:'♦', clubs:'♣' };
const SUIT_CLR   = { spades:'#b8cce8', hearts:'#ff3b5c', diamonds:'#ff3b5c', clubs:'#b8cce8' };
const SUIT_LBL   = { spades:'Pik', hearts:'Qoʻr', diamonds:'Karo', clubs:'Treff' };
const BURA_PTS   = { A:11, '10':10, K:4, Q:3, J:2, 9:0, 8:0, 7:0, 6:0 };
const RANK_ORDER = ['6','7','8','9','J','Q','K','10','A'];

// ─── AUDIO ENGINE ────────────────────────────────────────────────
const AC = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;
function tone(f, d, t='sine', v=0.25) {
  if (!AC) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain();
    o.connect(g); g.connect(AC.destination);
    o.frequency.value = f; o.type = t;
    g.gain.setValueAtTime(v, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + d);
    o.start(); o.stop(AC.currentTime + d);
  } catch(e) {}
}
const SFX = {
  deal:    () => { for(let i=0;i<4;i++) setTimeout(()=>tone(280+i*40,.08,'triangle',.18),i*70); },
  play:    () => { tone(440,.08,'triangle',.2); setTimeout(()=>tone(550,.08,'triangle',.15),50); },
  draw:    () => tone(300,.15,'sawtooth',.15),
  win:     () => { [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>tone(f,.35,'sine',.25),i*100)); },
  error:   () => { tone(180,.3,'sawtooth',.3); },
  join:    () => tone(660,.2,'sine',.2),
  throw_:  () => { tone(220,.2,'sawtooth',.2); },
  tick:    () => tone(880,.04,'square',.12),
  reveal:  () => { tone(700,.12,'sine',.2); setTimeout(()=>tone(900,.12,'sine',.18),80); },
};

// ─── BACKGROUND ──────────────────────────────────────────────────
function BG({ variant = 'default' }) {
  const orbs = useMemo(() => Array.from({length: 6}, (_,i) => ({
    id: i,
    x: Math.random()*100, y: Math.random()*100,
    size: 200 + Math.random()*300,
    color: ['rgba(0,229,255,0.04)','rgba(168,85,247,0.05)','rgba(245,200,66,0.04)','rgba(255,45,110,0.04)'][i%4],
    dur: 8 + Math.random()*10,
    delay: Math.random()*5,
  })), []);

  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
      {/* Base gradient */}
      <div style={{
        position:'absolute', inset:0,
        background: variant === 'game'
          ? 'radial-gradient(ellipse at 30% 20%, #041a10 0%, #020408 60%)'
          : 'radial-gradient(ellipse at 20% 10%, #050d1a 0%, #020408 60%)',
      }} />
      {/* Orbs */}
      {orbs.map(o => (
        <div key={o.id} style={{
          position:'absolute',
          left:`${o.x}%`, top:`${o.y}%`,
          width:o.size, height:o.size,
          borderRadius:'50%',
          background:`radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
          transform:'translate(-50%,-50%)',
          animation:`float-y ${o.dur}s ease-in-out ${o.delay}s infinite`,
        }} />
      ))}
      {/* Scanline */}
      <div style={{
        position:'absolute', width:'100%', height:'2px',
        background:'linear-gradient(90deg,transparent,rgba(0,229,255,0.2),transparent)',
        animation:'scan 10s linear infinite',
      }} />
      {/* Grid */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.03 }}>
        <defs>
          <pattern id="g" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00e5ff" strokeWidth=".5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
      </svg>
    </div>
  );
}

// ─── CARD COMPONENT ──────────────────────────────────────────────
function Card({ card, onClick, selected, playable, faceDown, small, trump, animDelay=0, shake: doShake=false }) {
  const w = small ? 50 : 68;
  const h = small ? 72 : 100;
  const color = card ? SUIT_CLR[card.suit] : '#fff';
  const sym   = card ? SUIT_SYM[card.suit] : '';

  if (faceDown) {
    return (
      <motion.div
        whileHover={onClick ? { scale:1.05, y:-4 } : {}}
        onClick={onClick}
        style={{
          width:w, height:h, borderRadius:8, flexShrink:0,
          background:'linear-gradient(135deg, #0a1a3a 0%, #152040 50%, #0a1220 100%)',
          border:'1px solid rgba(0,229,255,0.25)',
          boxShadow:'0 4px 16px rgba(0,0,0,0.6)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor: onClick ? 'pointer' : 'default',
          position:'relative', overflow:'hidden',
        }}
      >
        <div style={{
          width:'80%', height:'80%',
          border:'1px solid rgba(0,229,255,0.15)', borderRadius:4,
          backgroundImage:`repeating-linear-gradient(45deg,rgba(0,229,255,.04) 0,rgba(0,229,255,.04) 2px,transparent 2px,transparent 9px)`,
        }}/>
        <div className="shimmer-line"/>
      </motion.div>
    );
  }

  if (!card) return null;

  const isPlayable = playable && !!onClick;

  return (
    <motion.div
      onClick={() => isPlayable && onClick(card)}
      animate={doShake ? { x:[0,-6,6,-4,4,-2,2,0] } : {}}
      transition={doShake ? { duration:.4 } : {}}
      whileHover={isPlayable ? { scale:1.1, y: selected ? -22 : -10 } : selected ? {} : {}}
      whileTap={isPlayable ? { scale:.93 } : {}}
      style={{
        width:w, height:h, borderRadius:8, flexShrink:0,
        background: selected
          ? 'linear-gradient(145deg, #1a3a26, #0d2418)'
          : 'linear-gradient(145deg, #f4f8ff 0%, #e4ecff 100%)',
        border: trump
          ? '2px solid var(--gold)'
          : selected
            ? '2.5px solid var(--green)'
            : isPlayable
              ? '2px solid rgba(0,229,255,0.7)'
              : '1px solid rgba(180,200,240,0.25)',
        boxShadow: trump
          ? '0 0 14px rgba(245,200,66,0.6), 0 4px 14px rgba(0,0,0,0.5), animation:winner-flash 2s infinite'
          : selected
            ? '0 0 20px rgba(0,255,148,0.6), 0 -10px 0 0 rgba(0,255,148,0.25)'
            : isPlayable
              ? '0 0 12px rgba(0,229,255,0.4), 0 4px 16px rgba(0,0,0,0.4)'
              : '0 3px 10px rgba(0,0,0,0.4)',
        transform: selected ? 'translateY(-16px)' : undefined,
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        padding: small ? '4px 5px' : '6px 8px',
        cursor: isPlayable ? 'pointer' : 'default',
        position:'relative', overflow:'hidden',
        animation:`deal-in .35s cubic-bezier(0.34,1.4,0.64,1) ${animDelay}s both`,
        transition:'box-shadow .2s, border .2s',
      }}
    >
      <div style={{ color, lineHeight:1 }}>
        <div style={{ fontSize:small?11:14, fontWeight:900, fontFamily:'var(--font-ui)', letterSpacing:'-0.02em' }}>{card.rank}</div>
        <div style={{ fontSize:small?10:13 }}>{sym}</div>
      </div>
      <div style={{ textAlign:'center', color, fontSize:small?18:28, textShadow:`0 0 6px ${color}50`, lineHeight:1 }}>{sym}</div>
      <div style={{ color, lineHeight:1, transform:'rotate(180deg)', alignSelf:'flex-end' }}>
        <div style={{ fontSize:small?11:14, fontWeight:900, fontFamily:'var(--font-ui)', letterSpacing:'-0.02em' }}>{card.rank}</div>
        <div style={{ fontSize:small?10:13 }}>{sym}</div>
      </div>
      {trump && (
        <div style={{
          position:'absolute', top:-7, right:-7,
          width:16, height:16, borderRadius:'50%',
          background:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:9, color:'#000', fontWeight:900,
          boxShadow:'0 0 8px var(--gold)',
        }}>★</div>
      )}
      {isPlayable && !selected && (
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:3,
          background:'linear-gradient(90deg,transparent,var(--cyan),transparent)',
          borderRadius:'0 0 8px 8px',
        }}/>
      )}
    </motion.div>
  );
}

// ─── UI COMPONENTS ────────────────────────────────────────────────
function Btn({ children, onClick, color='cyan', disabled, small, full, style:sx }) {
  const map = {
    cyan:   { c:'var(--cyan)',   bg:'rgba(0,229,255,0.08)',  b:'rgba(0,229,255,0.5)' },
    gold:   { c:'var(--gold)',   bg:'rgba(245,200,66,0.08)', b:'rgba(245,200,66,0.5)' },
    pink:   { c:'var(--pink)',   bg:'rgba(255,45,110,0.08)', b:'rgba(255,45,110,0.5)' },
    green:  { c:'var(--green)',  bg:'rgba(0,255,148,0.08)',  b:'rgba(0,255,148,0.5)' },
    purple: { c:'var(--purple)', bg:'rgba(168,85,247,0.08)', b:'rgba(168,85,247,0.5)' },
    red:    { c:'var(--red)',    bg:'rgba(255,59,92,0.08)',  b:'rgba(255,59,92,0.5)' },
  };
  const clr = map[color] || map.cyan;
  return (
    <motion.button
      onClick={!disabled ? onClick : undefined}
      whileHover={!disabled ? { scale:1.03 } : {}}
      whileTap={!disabled ? { scale:.96 } : {}}
      style={{
        background: disabled ? 'rgba(255,255,255,.04)' : clr.bg,
        border: `1px solid ${disabled ? 'rgba(255,255,255,.08)' : clr.b}`,
        color: disabled ? 'rgba(255,255,255,.25)' : clr.c,
        padding: small ? '7px 14px' : '11px 22px',
        borderRadius: 8,
        fontFamily:'var(--font-ui)', fontSize: small ? 10 : 12, fontWeight:700,
        letterSpacing:'0.08em', textTransform:'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 0 12px ${clr.b}50, inset 0 0 12px ${clr.b}10`,
        transition:'all .2s',
        width: full ? '100%' : undefined,
        position:'relative', overflow:'hidden',
        ...sx,
      }}
    >
      {!disabled && <div className="shimmer-line"/>}
      {children}
    </motion.button>
  );
}

function Input({ value, onChange, placeholder, onKeyDown, autoFocus, maxLength }) {
  return (
    <input
      value={value} onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown} placeholder={placeholder}
      autoFocus={autoFocus} maxLength={maxLength||20}
      style={{
        background:'rgba(0,229,255,0.05)',
        border:'1px solid rgba(0,229,255,0.35)', borderRadius:8,
        color:'var(--cyan)', padding:'13px 18px',
        fontSize:17, fontFamily:'var(--font-ui)', letterSpacing:'.08em',
        outline:'none', width:'100%',
        boxShadow:'0 0 20px rgba(0,229,255,0.1), inset 0 0 10px rgba(0,229,255,0.04)',
        transition:'all .3s',
      }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--cyan)';
        e.target.style.boxShadow = '0 0 30px rgba(0,229,255,0.25), inset 0 0 15px rgba(0,229,255,0.08)';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(0,229,255,0.35)';
        e.target.style.boxShadow = '0 0 20px rgba(0,229,255,0.1)';
      }}
    />
  );
}

function Toast({ toasts }) {
  return (
    <div style={{ position:'fixed', top:16, right:16, zIndex:9999, display:'flex', flexDirection:'column', gap:8, maxWidth:300 }}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ x:80, opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:80, opacity:0 }}
            style={{
              padding:'11px 18px', borderRadius:8, fontSize:12,
              fontFamily:'var(--font-ui)', letterSpacing:'.05em',
              background: t.type==='error' ? 'rgba(255,45,110,.15)' : t.type==='success' ? 'rgba(0,255,148,.12)' : 'rgba(0,229,255,.12)',
              border:`1px solid ${t.type==='error'?'var(--pink)':t.type==='success'?'var(--green)':'var(--cyan)'}`,
              color: t.type==='error' ? 'var(--pink)' : t.type==='success' ? 'var(--green)' : 'var(--cyan)',
              boxShadow:'0 4px 20px rgba(0,0,0,.4)',
            }}
          >{t.msg}</motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── SCREEN: LOGIN ────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('karta_nick');
    if (saved) setName(saved);
    setTimeout(() => setReady(true), 1800);
  }, []);

  function submit() {
    const n = name.trim();
    if (n.length < 2) return;
    setLoading(true);
    localStorage.setItem('karta_nick', n);
    setTimeout(() => onLogin(n), 400);
  }

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <BG/>
      <AnimatePresence mode="wait">
        {!ready ? (
          <motion.div key="intro"
            initial={{ opacity:0, scale:.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:1.05 }}
            style={{ textAlign:'center', zIndex:1 }}
          >
            <motion.div
              animate={{ rotateY:[0,360] }}
              transition={{ duration:1.4, ease:'easeInOut' }}
              style={{ fontSize:88, marginBottom:20 }}
            >🎴</motion.div>
            <motion.h1
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.3 }}
              style={{ fontFamily:'var(--font-d)', fontSize:'clamp(26px,6vw,48px)', color:'var(--gold)', textShadow:'0 0 20px var(--gold)', letterSpacing:'.04em' }}
            >KARTA O'YINI</motion.h1>
            <motion.p
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.8 }}
              style={{ color:'var(--cyan)', fontFamily:'var(--font-ui)', fontSize:10, letterSpacing:'.3em', marginTop:8 }}
            >TO'RT BURA • 108 • ONLINE MULTIPLAYER</motion.p>
          </motion.div>
        ) : (
          <motion.div key="form"
            initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
            style={{ zIndex:1, width:'100%', maxWidth:420, padding:'0 20px' }}
          >
            <div className="glass" style={{ borderRadius:20, padding:'44px 36px', boxShadow:'0 0 60px rgba(0,229,255,0.07), 0 40px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ textAlign:'center', marginBottom:36 }}>
                <motion.div
                  animate={{ animation:'float-y 4s ease-in-out infinite' }}
                  style={{ fontSize:52, marginBottom:14 }}
                >🎴</motion.div>
                <h1 style={{ fontFamily:'var(--font-d)', fontSize:22, color:'var(--gold)', textShadow:'0 0 12px var(--gold)' }}>
                  KARTA O'YINI
                </h1>
                <p style={{ color:'var(--dim)', fontSize:11, marginTop:8, fontFamily:'var(--font-ui)', letterSpacing:'.15em' }}>
                  NICKNAME KIRITING
                </p>
              </div>
              <div style={{ marginBottom:20 }}>
                <Input value={name} onChange={setName} placeholder="Ismingiz..." autoFocus onKeyDown={e=>e.key==='Enter'&&submit()} />
              </div>
              <Btn color="gold" onClick={submit} disabled={name.trim().length<2||loading} full sx={{ padding:'15px', fontSize:13 }}>
                {loading ? 'YUKLANMOQDA...' : "O'YINGA KIRISH →"}
              </Btn>
              <p style={{ textAlign:'center', color:'var(--dimmer)', fontSize:10, marginTop:18, fontFamily:'var(--font-ui)' }}>
                O'ZBEKISTON • ONLINE KARTA O'YINI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SCREEN: MAIN MENU ────────────────────────────────────────────
function MenuScreen({ nickname, onSelect, onLogout }) {
  const games = [
    {
      id:'bura', icon:'🃏', title:"TO'RT BURA", sub:'2 yoki 4 kishilik',
      desc:'Oʻzbek klassik kozel oʻyini. Kartalar bilan trick yutib, 61+ ball yigʻing. 12 jarima = yutqazding!',
      rules:['Tuz=11, 10=10, Shoh=4, Dama=3, Valet=2', 'Kozir istalgan kartani uradi', 'Jarima: 61+=0, 32-60=2, 1-31=4, 0=6 shtraf'],
      color:'var(--gold)', glow:'rgba(245,200,66,0.12)',
    },
    {
      id:'108', icon:'🔥', title:'108', sub:'2-6 kishilik',
      desc:'Kartalardan qutuling! Maxsus kartalar bilan raqibga karta bering yoki uning navbatini o\'tkazib yuboring.',
      rules:['6=+2 karta, 7=+1 karta, Ks=+5 karta', 'Dama=suit o\'zgartirish, 8=skip, Valet=burilish', 'Birinchi kartasiz qolgan g\'alaba!'],
      color:'var(--pink)', glow:'rgba(255,45,110,0.12)',
    },
  ];

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', zIndex:10 }}>
      <BG/>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 24px', zIndex:1,
        background:'rgba(2,4,8,0.7)', backdropFilter:'blur(12px)',
        borderBottom:'1px solid rgba(0,229,255,0.07)',
      }}>
        <div>
          <div style={{ fontFamily:'var(--font-d)', fontSize:16, color:'var(--gold)', textShadow:'0 0 10px var(--gold)' }}>KARTA O'YINI</div>
          <div style={{ fontFamily:'var(--font-ui)', fontSize:9, color:'var(--dim)', letterSpacing:'.2em' }}>ONLINE MULTIPLAYER</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            padding:'7px 14px', borderRadius:6,
            background:'rgba(0,229,255,0.07)', border:'1px solid rgba(0,229,255,0.2)',
            fontFamily:'var(--font-ui)', fontSize:11, color:'var(--cyan)',
            display:'flex', alignItems:'center', gap:7,
          }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 6px var(--green)' }}/>
            {nickname}
          </div>
          <Btn small color="red" onClick={onLogout}>CHIQISH</Btn>
        </div>
      </div>

      {/* Game cards */}
      <div style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        padding:'30px 20px', zIndex:1, gap:'clamp(16px,3vw,40px)', flexWrap:'wrap',
      }}>
        {games.map((g, i) => (
          <motion.div key={g.id}
            initial={{ opacity:0, y:50 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:i*.15, type:'spring', stiffness:100 }}
            onClick={() => { SFX.join(); onSelect(g.id); }}
            whileHover={{ scale:1.03, y:-8 }} whileTap={{ scale:.97 }}
            style={{
              width:'clamp(260px,38vw,360px)', padding:'36px 30px',
              borderRadius:20,
              background:`radial-gradient(circle at 25% 25%, ${g.glow}, rgba(11,20,37,0.9))`,
              border:`1px solid ${g.color}35`,
              cursor:'pointer', position:'relative', overflow:'hidden',
              boxShadow:`0 0 50px ${g.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
              animation:`float-y ${7+i*2}s ease-in-out ${i*1.5}s infinite`,
            }}
          >
            <div className="shimmer-line"/>
            <div style={{ fontSize:56, marginBottom:18, textAlign:'center', animation:`float-y 4s ease-in-out ${i*.5}s infinite` }}>{g.icon}</div>
            <h2 style={{ fontFamily:'var(--font-d)', fontSize:20, color:g.color, textShadow:`0 0 12px ${g.color}`, textAlign:'center', marginBottom:6 }}>
              {g.title}
            </h2>
            <div style={{ textAlign:'center', fontFamily:'var(--font-ui)', fontSize:10, color:g.color, opacity:.7, letterSpacing:'.15em', marginBottom:14 }}>
              {g.sub}
            </div>
            <p style={{ color:'rgba(180,210,255,0.55)', fontSize:12.5, textAlign:'center', lineHeight:1.7, marginBottom:20 }}>{g.desc}</p>
            {/* Mini rules */}
            <div style={{ borderTop:`1px solid ${g.color}20`, paddingTop:14, display:'flex', flexDirection:'column', gap:5 }}>
              {g.rules.map((r,ri) => (
                <div key={ri} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                  <span style={{ color:g.color, fontSize:10, flexShrink:0, marginTop:1 }}>▸</span>
                  <span style={{ color:'var(--dim)', fontSize:11, lineHeight:1.4 }}>{r}</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop:22, padding:'11px', borderRadius:8, textAlign:'center',
              background:`${g.color}12`, border:`1px solid ${g.color}25`,
              fontFamily:'var(--font-ui)', fontSize:11, color:g.color, letterSpacing:'.1em',
            }}>
              O'YNASH →
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── SCREEN: GAME SELECT ─────────────────────────────────────────
function SelectScreen({ gameMode, onBack, onCreate, onJoin }) {
  const [tab, setTab]       = useState('create');
  const [type, setType]     = useState('2p');
  const [decks, setDecks]   = useState(1);
  const [code, setCode]     = useState('');
  const [busy, setBusy]     = useState(false);
  const isBura = gameMode === 'bura';

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', zIndex:20, overflowY:'auto' }}>
      <BG/>
      <div style={{ zIndex:1, maxWidth:500, margin:'0 auto', width:'100%', padding:'20px 18px' }}>
        <Btn small onClick={onBack} style={{ marginBottom:22 }}>← ORQAGA</Btn>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:46, marginBottom:10 }}>{isBura?'🃏':'🔥'}</div>
          <h1 style={{
            fontFamily:'var(--font-d)', fontSize:22,
            color:isBura?'var(--gold)':'var(--pink)',
            textShadow:`0 0 12px ${isBura?'var(--gold)':'var(--pink)'}`,
          }}>{isBura?"TO'RT BURA":'108'}</h1>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:3, marginBottom:22, background:'rgba(255,255,255,.02)', borderRadius:9, padding:3, border:'1px solid rgba(0,229,255,.09)' }}>
          {[['create','+ XONA YARATISH'],['join','→ XONAGA KIRISH']].map(([t,l]) => (
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1, padding:'11px', borderRadius:7,
              background:tab===t?'rgba(0,229,255,0.1)':'transparent',
              border:tab===t?'1px solid rgba(0,229,255,0.3)':'1px solid transparent',
              color:tab===t?'var(--cyan)':'var(--dim)',
              fontFamily:'var(--font-ui)', fontSize:11, fontWeight:700, letterSpacing:'.08em',
              cursor:'pointer', transition:'all .2s', textTransform:'uppercase',
            }}>{l}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'create' ? (
            <motion.div key="cr" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <div className="glass" style={{ borderRadius:16, padding:'26px 22px' }}>
                {isBura && (
                  <div style={{ marginBottom:22 }}>
                    <p style={{ color:'var(--dim)', fontFamily:'var(--font-ui)', fontSize:10, letterSpacing:'.15em', marginBottom:10 }}>O'YINCHILAR SONI</p>
                    <div style={{ display:'flex', gap:8 }}>
                      {[['2p','2 KISHILIK'],['4p','4 KISHILIK (2v2)']].map(([v,l]) => (
                        <button key={v} onClick={()=>setType(v)} style={{
                          flex:1, padding:'13px 8px', borderRadius:8,
                          background:type===v?'rgba(245,200,66,0.12)':'rgba(255,255,255,0.03)',
                          border:`1px solid ${type===v?'var(--gold)':'rgba(255,255,255,0.07)'}`,
                          color:type===v?'var(--gold)':'var(--dim)',
                          fontFamily:'var(--font-ui)', fontSize:10.5, fontWeight:700,
                          letterSpacing:'.07em', cursor:'pointer', transition:'all .2s',
                        }}>{l}</button>
                      ))}
                    </div>
                  </div>
                )}
                {!isBura && (
                  <div style={{ marginBottom:22 }}>
                    <p style={{ color:'var(--dim)', fontFamily:'var(--font-ui)', fontSize:10, letterSpacing:'.15em', marginBottom:10 }}>DAST SONI</p>
                    <div style={{ display:'flex', gap:8 }}>
                      {[1,2,3].map(d => (
                        <button key={d} onClick={()=>setDecks(d)} style={{
                          flex:1, padding:'13px 8px', borderRadius:8,
                          background:decks===d?'rgba(255,45,110,0.12)':'rgba(255,255,255,0.03)',
                          border:`1px solid ${decks===d?'var(--pink)':'rgba(255,255,255,0.07)'}`,
                          color:decks===d?'var(--pink)':'var(--dim)',
                          fontFamily:'var(--font-ui)', fontSize:12, fontWeight:700,
                          cursor:'pointer', transition:'all .2s',
                        }}>{d} DAST</button>
                      ))}
                    </div>
                  </div>
                )}
                <Btn color={isBura?'gold':'pink'} onClick={()=>onCreate({gameMode,gameType:type,deckCount:decks})} full sx={{padding:'15px',fontSize:13}}>
                  XONA YARATISH
                </Btn>
              </div>
            </motion.div>
          ) : (
            <motion.div key="jo" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <div className="glass" style={{ borderRadius:16, padding:'26px 22px' }}>
                <p style={{ color:'var(--dim)', fontFamily:'var(--font-ui)', fontSize:10, letterSpacing:'.15em', marginBottom:10 }}>XONA KODI (6 raqam)</p>
                <div style={{ marginBottom:18 }}>
                  <Input value={code} onChange={v=>setCode(v.replace(/\D/g,'').slice(0,6))} placeholder="123456" maxLength={6} onKeyDown={e=>e.key==='Enter'&&code.length===6&&onJoin(code)}/>
                </div>
                <Btn color="cyan" disabled={code.length!==6||busy} onClick={()=>{setBusy(true);onJoin(code);}} full sx={{padding:'15px',fontSize:13}}>
                  {busy?'KIRILMOQDA...':'XONAGA KIRISH →'}
                </Btn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── SCREEN: LOBBY ────────────────────────────────────────────────
function LobbyScreen({ room, nickname, socketId, onStart, onLeave, onToggleReady, onSendChat, chats, typingUsers }) {
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const chatRef = useRef(null);
  const isHost  = room.host === socketId;
  const isReady = room.readyPlayers?.includes(socketId);
  const canStart= isHost && room.players.length >= room.minPlayers;

  useEffect(() => { chatRef.current?.scrollIntoView({behavior:'smooth'}); }, [chats]);

  function copyCode() {
    navigator.clipboard.writeText(room.id).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  }
  function send() {
    if (!msg.trim()) return;
    onSendChat(msg.trim());
    setMsg('');
  }

  const avatarColor = (nick) => `hsl(${nick.charCodeAt(0)*13%360},55%,28%)`;
  const avatarBorder= (nick) => `hsl(${nick.charCodeAt(0)*13%360},75%,50%)`;

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', zIndex:20 }}>
      <BG/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', zIndex:1, overflow:'hidden', maxWidth:680, margin:'0 auto', width:'100%', padding:'14px 16px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-d)', fontSize:16, color:'var(--gold)', textShadow:'0 0 8px var(--gold)' }}>
              {room.gameMode==='bura'?"TO'RT BURA":'108'} — LOBBY
            </h2>
            <p style={{ color:'var(--dim)', fontSize:10, fontFamily:'var(--font-ui)' }}>
              {room.players.length}/{room.maxPlayers} O'YINCHI • {room.gameMode==='bura'?`${room.gameType==='4p'?'4 KISHILIK 2v2':'2 KISHILIK'}`:`${room.deckCount} DAST`}
            </p>
          </div>
          <Btn small color="red" onClick={onLeave}>CHIQISH</Btn>
        </div>

        {/* Room code */}
        <div className="glass" style={{ borderRadius:12, padding:'14px 18px', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ color:'var(--dim)', fontFamily:'var(--font-ui)', fontSize:9, letterSpacing:'.2em', marginBottom:3 }}>XONA KODI</p>
            <div style={{ fontFamily:'var(--font-ui)', fontSize:26, fontWeight:900, color:'var(--cyan)', letterSpacing:'.3em', textShadow:'0 0 12px var(--cyan)' }}>
              {room.id}
            </div>
          </div>
          <Btn small color="cyan" onClick={copyCode}>{copied?'✓ NUSXA':'NUSXA OLISH'}</Btn>
        </div>

        {/* Players */}
        <div className="glass" style={{ borderRadius:12, padding:'14px', marginBottom:12 }}>
          <p style={{ color:'var(--dim)', fontFamily:'var(--font-ui)', fontSize:9, letterSpacing:'.2em', marginBottom:10 }}>O'YINCHILAR</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {Array.from({length:room.maxPlayers}).map((_,i) => {
              const p = room.players[i];
              const isMe = p?.id === socketId;
              const isHostP = p?.id === room.host;
              const rdy = room.readyPlayers?.includes(p?.id);
              return (
                <motion.div key={i}
                  initial={p?{scale:.85,opacity:0}:{}}
                  animate={p?{scale:1,opacity:1}:{}}
                  style={{
                    padding:'10px 12px', borderRadius:8,
                    background:p?(isMe?'rgba(0,229,255,0.07)':'rgba(255,255,255,0.03)'):'rgba(255,255,255,0.015)',
                    border:p?(isMe?'1px solid rgba(0,229,255,0.25)':'1px solid rgba(255,255,255,0.07)'):'1px dashed rgba(255,255,255,0.05)',
                    display:'flex', alignItems:'center', gap:8,
                  }}
                >
                  {p ? (
                    <>
                      <div style={{
                        width:30, height:30, borderRadius:'50%',
                        background:avatarColor(p.nickname),
                        border:`2px solid ${avatarBorder(p.nickname)}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:13, fontWeight:700, color:'#fff', flexShrink:0,
                      }}>{p.nickname[0].toUpperCase()}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {p.nickname} {isMe && <span style={{ color:'var(--cyan)', fontSize:9 }}>(sen)</span>}
                        </div>
                        <div style={{ fontSize:9.5, fontFamily:'var(--font-ui)', color:isHostP?'var(--gold)':rdy?'var(--green)':'var(--dim)' }}>
                          {isHostP?'👑 HOST':rdy?'✓ TAYYOR':'kutmoqda...'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <motion.div animate={{opacity:[.3,.7,.3]}} transition={{repeat:Infinity,duration:1.5}}
                      style={{ color:'var(--dimmer)', fontSize:11, fontFamily:'var(--font-ui)', width:'100%', textAlign:'center' }}
                    >BO'SH SLOT...</motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Chat */}
        <div className="glass" style={{ borderRadius:12, padding:'12px', marginBottom:12, flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden' }}>
          <p style={{ color:'var(--dim)', fontFamily:'var(--font-ui)', fontSize:9, letterSpacing:'.2em', marginBottom:8 }}>CHAT</p>
          <div style={{ flex:1, overflowY:'auto', marginBottom:8, minHeight:0 }}>
            {chats.map(m => (
              <div key={m.id} style={{ marginBottom:5, display:'flex', gap:7, alignItems:'baseline' }}>
                <span style={{ color:'var(--cyan)', fontSize:11.5, fontWeight:700, flexShrink:0 }}>{m.nickname}:</span>
                <span style={{ color:'var(--text)', fontSize:12.5 }}>{m.text}</span>
              </div>
            ))}
            {typingUsers.length > 0 && (
              <div style={{ color:'var(--dim)', fontSize:10.5, fontStyle:'italic' }}>
                {typingUsers.join(', ')} yozmoqda...
              </div>
            )}
            <div ref={chatRef}/>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Xabar..."
              style={{
                flex:1, background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(0,229,255,0.13)', borderRadius:6,
                color:'var(--text)', padding:'8px 12px', fontSize:12.5,
                fontFamily:'var(--font-b)', outline:'none',
              }}
            />
            <Btn small onClick={send}>↑</Btn>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:10 }}>
          {!isHost && (
            <Btn color={isReady?'green':'cyan'} onClick={onToggleReady} full sx={{padding:'13px'}}>
              {isReady?'✓ TAYYOR':'TAYYOR'}
            </Btn>
          )}
          {isHost && (
            <Btn color="gold" disabled={!canStart} onClick={onStart} full sx={{padding:'13px',fontSize:13}}>
              {canStart?'▶ BOSHLASH':`KUTISH... (${room.players.length}/${room.minPlayers})`}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BURA GAME SCREEN ─────────────────────────────────────────────
function BuraScreen({ room, gs, myHand, socketId, nickname, onPlay, onThrow, onLeave, onPlayAgain, onNextRound }) {
  const [selected, setSelected] = useState(null);
  const [shakeCard, setShakeCard] = useState(null);
  const players = room.players;
  const myIdx   = players.findIndex(p => p.id === socketId);
  const trump   = gs?.trumpSuit;
  const phase2  = gs?.phase2;
  const isAttacker = gs?.attackerId === socketId;
  const isDefender = gs?.defenderId === socketId;
  const isMyTurn   = gs?.currentPlayer === socketId;

  // What can I play?
  const playable = useMemo(() => {
    if (!myHand || !gs) return new Set();
    if (!isMyTurn) return new Set();
    
    if (phase2 === 'attacking' && isAttacker) {
      return new Set(myHand.map(c => c.id));
    }
    if (phase2 === 'defending' && isDefender) {
      const lastAttack = gs.attackCards[gs.attackCards.length - 1];
      if (!lastAttack) return new Set();
      return new Set(myHand.filter(c => {
        // Can beat if same suit + higher rank, or trump over non-trump
        if (c.suit === lastAttack.suit) {
          return RANK_ORDER.indexOf(c.rank) > RANK_ORDER.indexOf(lastAttack.rank);
        }
        if (c.suit === trump && lastAttack.suit !== trump) return true;
        return false;
      }).map(c => c.id));
    }
    return new Set();
  }, [myHand, gs, isMyTurn, isAttacker, isDefender, phase2, trump]);

  function handleCardClick(card) {
    if (!playable.has(card.id)) {
      setShakeCard(card.id);
      SFX.error();
      setTimeout(() => setShakeCard(null), 500);
      return;
    }
    if (selected?.id === card.id) {
      SFX.play();
      onPlay(card.id);
      setSelected(null);
    } else {
      setSelected(card);
    }
  }

  function handleThrow() {
    SFX.throw_();
    onThrow();
    setSelected(null);
  }

  // Round over screen
  if (gs?.phase === 'roundOver') {
    return <BuraRoundOver gs={gs} room={room} socketId={socketId} onNext={onNextRound} onLeave={onLeave}/>;
  }
  if (gs?.phase === 'gameOver') {
    return <BuraGameOver gs={gs} room={room} socketId={socketId} onPlayAgain={onPlayAgain} onLeave={onLeave}/>;
  }

  const getPos = (idx) => {
    const rel = (idx - myIdx + players.length) % players.length;
    if (players.length === 2) return rel === 0 ? 'bottom' : 'top';
    return ['bottom','right','top','left'][rel] || 'top';
  };

  const penaltyBar = (pen) => {
    const bars = [];
    for (let i = 0; i < 12; i++) {
      bars.push(
        <div key={i} style={{
          width:8, height:8, borderRadius:2,
          background: i < pen ? 'var(--red)' : 'rgba(255,255,255,0.08)',
          border: i < pen ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.05)',
        }}/>
      );
    }
    return bars;
  };

  const myPenalty = gs?.penalties?.[socketId] || 0;
  const myScore   = gs?.scores?.[socketId] || 0;

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', zIndex:20, overflow:'hidden' }}>
      <BG variant="game"/>

      {/* TOP BAR */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 14px', zIndex:10,
        background:'rgba(2,4,8,0.82)', backdropFilter:'blur(12px)',
        borderBottom:'1px solid rgba(0,229,255,0.07)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Trump display */}
          {trump && (
            <div style={{
              display:'flex', alignItems:'center', gap:5,
              padding:'5px 10px', borderRadius:6,
              background:'rgba(245,200,66,0.1)', border:'1px solid rgba(245,200,66,0.3)',
            }}>
              <span style={{ color:SUIT_CLR[trump], fontSize:18 }}>{SUIT_SYM[trump]}</span>
              <span style={{ color:'var(--gold)', fontSize:9, fontFamily:'var(--font-ui)' }}>KOZIR</span>
            </div>
          )}
          {/* Deck remaining */}
          {gs?.deckRemaining > 0 && (
            <div style={{ fontFamily:'var(--font-ui)', fontSize:10, color:'var(--dim)' }}>
              🃏 {gs.deckRemaining}
            </div>
          )}
          {/* Scores */}
          {gs?.teams ? (
            <div style={{ display:'flex', gap:6 }}>
              <div style={{ padding:'4px 8px', borderRadius:4, background:'rgba(0,229,255,0.07)', fontFamily:'var(--font-ui)', fontSize:10, color:'var(--cyan)' }}>
                JAMOA 1: {gs.teamScores?.team1||0}pts
              </div>
              <div style={{ padding:'4px 8px', borderRadius:4, background:'rgba(255,45,110,0.07)', fontFamily:'var(--font-ui)', fontSize:10, color:'var(--pink)' }}>
                JAMOA 2: {gs.teamScores?.team2||0}pts
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', gap:5 }}>
              {players.map(p => (
                <div key={p.id} style={{
                  padding:'4px 8px', borderRadius:4,
                  background:p.id===socketId?'rgba(0,229,255,0.07)':'rgba(255,255,255,0.03)',
                  fontFamily:'var(--font-ui)', fontSize:10,
                  color:p.id===socketId?'var(--cyan)':'var(--dim)',
                }}>
                  {p.nickname.slice(0,8)}: {gs?.scores?.[p.id]||0}pt
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {/* My penalty meter */}
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ fontFamily:'var(--font-ui)', fontSize:9, color:'var(--dim)' }}>JARIMA:</span>
            <div style={{ display:'flex', gap:2, flexWrap:'wrap', maxWidth:120 }}>{penaltyBar(myPenalty)}</div>
            <span style={{ fontFamily:'var(--font-ui)', fontSize:10, color: myPenalty >= 9 ? 'var(--red)' : 'var(--dim)' }}>
              {myPenalty}/12
            </span>
          </div>
          <Btn small color="red" onClick={onLeave}>✕</Btn>
        </div>
      </div>

      {/* TABLE AREA */}
      <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>

        {/* Green felt table */}
        <div style={{
          width:'min(80vw,480px)', height:'min(42vw,260px)',
          borderRadius:'50%',
          background:'radial-gradient(ellipse at center, #1d5c35 0%, #0e3a1e 55%, #071811 100%)',
          border:'5px solid rgba(255,215,0,0.2)',
          boxShadow:'inset 0 0 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,80,30,0.15), inset 0 0 30px rgba(0,100,40,0.15)',
          position:'absolute',
        }}/>

        {/* Opponents */}
        {players.map((p, i) => {
          if (p.id === socketId) return null;
          const pos = getPos(i);
          const isCurrent = gs?.currentPlayer === p.id;
          const isAtt = gs?.attackerId === p.id;
          const isDef = gs?.defenderId === p.id;
          const hSize = gs?.handSizes?.[p.id] || 0;
          const pPen  = gs?.penalties?.[p.id] || 0;

          const posStyles = {
            top:   { position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', flexDirection:'column', alignItems:'center' },
            left:  { position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', flexDirection:'column', alignItems:'center' },
            right: { position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', flexDirection:'column', alignItems:'center' },
          };

          return (
            <div key={p.id} style={{ display:'flex', gap:6, zIndex:5, ...posStyles[pos] }}>
              <div style={{
                padding:'6px 12px', borderRadius:8, textAlign:'center',
                background:isCurrent?'rgba(0,255,148,0.1)':'rgba(255,255,255,0.03)',
                border:`1px solid ${isCurrent?'var(--green)':isAtt?'rgba(255,200,66,0.3)':isDef?'rgba(0,229,255,0.3)':'rgba(255,255,255,0.07)'}`,
                boxShadow:isCurrent?'0 0 15px rgba(0,255,148,0.25)':'none',
                minWidth:90,
              }}>
                <div style={{ fontSize:10.5, fontFamily:'var(--font-ui)', color:isCurrent?'var(--green)':'var(--text)', marginBottom:2 }}>
                  {p.nickname}
                  {isAtt && <span style={{ color:'var(--gold)', fontSize:8 }}> ⚔</span>}
                  {isDef && <span style={{ color:'var(--cyan)', fontSize:8 }}> 🛡</span>}
                </div>
                <div style={{ display:'flex', gap:2, justifyContent:'center', alignItems:'center' }}>
                  <span style={{ fontSize:9, color:'var(--dim)' }}>🃏×{hSize}</span>
                  <span style={{ fontSize:9, color: pPen>=9?'var(--red)':'var(--dim)' }}>⚡{pPen}</span>
                </div>
              </div>
              {/* Face-down cards */}
              <div style={{ display:'flex' }}>
                {Array.from({length:Math.min(hSize,6)}).map((_,ci) => (
                  <div key={ci} style={{
                    width:24, height:36, borderRadius:4, marginLeft:ci>0?-10:0, zIndex:ci,
                    background:'linear-gradient(135deg,#0a1a3a,#152040)',
                    border:'1px solid rgba(0,229,255,0.2)',
                  }}/>
                ))}
              </div>
            </div>
          );
        })}

        {/* Trick area on table */}
        <div style={{
          position:'absolute', display:'flex', gap:8, zIndex:6,
          flexWrap:'wrap', justifyContent:'center', maxWidth:320,
        }}>
          {/* Attack cards */}
          <div style={{ display:'flex', gap:4, alignItems:'flex-start' }}>
            <AnimatePresence>
              {(gs?.attackCards||[]).map((c, i) => {
                const defended = gs?.defendCards?.[i];
                return (
                  <motion.div key={c.id} initial={{scale:0,rotate:-15}} animate={{scale:1,rotate:(i%2===0?-6:6)}}
                    style={{ position:'relative' }}
                  >
                    <Card card={c} small trump={c.suit===trump}/>
                    {defended && (
                      <motion.div initial={{scale:0,rotate:0}} animate={{scale:1,rotate:12}}
                        style={{ position:'absolute', top:-4, left:4, zIndex:1 }}
                      >
                        <Card card={defended} small trump={defended.suit===trump}/>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Trump card (deck indicator) */}
        {gs?.trumpCard && gs?.deckRemaining > 0 && (
          <div style={{ position:'absolute', right:'4%', top:'50%', transform:'translateY(-50%)', zIndex:5, textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--gold)', fontFamily:'var(--font-ui)', marginBottom:4 }}>KOZIR KARTI</div>
            <Card card={gs.trumpCard} small trump/>
            <div style={{ fontSize:9, color:'var(--dim)', fontFamily:'var(--font-ui)', marginTop:3 }}>{gs.deckRemaining} karta</div>
          </div>
        )}

        {/* Role / Turn indicator */}
        <div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', zIndex:10 }}>
          <AnimatePresence>
            {isMyTurn && (
              <motion.div initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.8}}
                style={{
                  padding:'7px 18px', borderRadius:20,
                  background: isAttacker?'rgba(245,200,66,0.15)':'rgba(0,229,255,0.12)',
                  border:`1px solid ${isAttacker?'var(--gold)':'var(--cyan)'}`,
                  color: isAttacker?'var(--gold)':'var(--cyan)',
                  fontFamily:'var(--font-ui)', fontSize:11,
                  boxShadow:`0 0 18px ${isAttacker?'rgba(245,200,66,0.3)':'rgba(0,229,255,0.25)'}`,
                }}
              >
                {isAttacker ? '⚔ HUJUM QILING' : '🛡 HIMOYA QILING'}
              </motion.div>
            )}
            {!isMyTurn && gs?.currentPlayer && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                style={{
                  padding:'6px 14px', borderRadius:20,
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  color:'var(--dim)', fontFamily:'var(--font-ui)', fontSize:10,
                }}
              >
                {players.find(p=>p.id===gs.currentPlayer)?.nickname} o'ynamoqda...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bura rules reminder */}
        <div style={{
          position:'absolute', left:'2%', top:'50%', transform:'translateY(-50%)',
          zIndex:5, display:'flex', flexDirection:'column', gap:3,
        }}>
          {[['A','11'], ['10','10'], ['K','4'], ['Q','3'], ['J','2']].map(([r,v]) => (
            <div key={r} style={{
              display:'flex', gap:4, alignItems:'center',
              padding:'2px 6px', borderRadius:4,
              background:'rgba(255,255,255,0.03)',
            }}>
              <span style={{ fontFamily:'var(--font-ui)', fontSize:9, color:'var(--dim)', fontWeight:700 }}>{r}</span>
              <span style={{ fontFamily:'var(--font-ui)', fontSize:8, color:'var(--dimmer)' }}>=</span>
              <span style={{ fontFamily:'var(--font-ui)', fontSize:8.5, color:'var(--gold)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MY HAND AREA */}
      <div style={{
        background:'rgba(2,4,8,0.88)', backdropFilter:'blur(14px)',
        borderTop:'1px solid rgba(0,229,255,0.07)',
        padding:'10px 8px 18px', zIndex:10,
      }}>
        {/* My info bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:8 }}>
          <span style={{ fontFamily:'var(--font-ui)', fontSize:10,
            color: isMyTurn?(isAttacker?'var(--gold)':'var(--cyan)'):'var(--dim)',
          }}>
            {nickname}
            {isAttacker ? ' • ⚔ HUJUMCHI' : isDefender ? ' • 🛡 HIMOYACHI' : ''}
          </span>
          <span style={{ fontFamily:'var(--font-ui)', fontSize:9, color:'var(--dim)' }}>
            BALL: <span style={{ color:'var(--text)' }}>{myScore}</span>
          </span>
          <span style={{ fontFamily:'var(--font-ui)', fontSize:9, color: myPenalty>=9?'var(--red)':'var(--dim)' }}>
            JARIMA: <span style={{ color:myPenalty>=9?'var(--red)':'var(--text)' }}>{myPenalty}</span>/12
          </span>
        </div>

        {/* Cards */}
        <div style={{
          display:'flex', gap:4, justifyContent:'center',
          flexWrap:'nowrap', overflowX:'auto',
          paddingTop:18, paddingBottom:4,
        }}>
          <AnimatePresence>
            {(myHand||[]).map((c, i) => (
              <Card
                key={c.id} card={c}
                onClick={handleCardClick}
                selected={selected?.id === c.id}
                playable={playable.has(c.id) && isMyTurn}
                trump={c.suit===trump}
                animDelay={i*0.05}
                shake={shakeCard===c.id}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:10 }}>
          {selected && isMyTurn && playable.has(selected.id) && (
            <Btn small color={isAttacker?'gold':'cyan'} onClick={() => { SFX.play(); onPlay(selected.id); setSelected(null); }}>
              ▶ {selected.rank}{SUIT_SYM[selected.suit]} O'YNASH
            </Btn>
          )}
          {isDefender && isMyTurn && phase2 === 'defending' && (gs?.attackCards||[]).length > 0 && (
            <Btn small color="red" onClick={handleThrow}>
              ✕ TASHLAB YUBORISH
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BURA ROUND OVER ─────────────────────────────────────────────
function BuraRoundOver({ gs, room, socketId, onNext, onLeave }) {
  const isHost = room.host === socketId;
  const players = room.players;
  const summary = gs?.roundSummary || {};

  useEffect(() => { SFX.reveal(); }, []);

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <BG/>
      <motion.div initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:120}}
        style={{
          background:'rgba(8,16,34,0.97)', borderRadius:22,
          padding:'40px 36px', maxWidth:440, width:'90%',
          border:'1px solid rgba(0,229,255,0.2)',
          boxShadow:'0 0 60px rgba(0,229,255,0.08), 0 40px 80px rgba(0,0,0,0.6)',
          textAlign:'center', zIndex:1,
        }}
      >
        <div style={{ fontSize:52, marginBottom:14 }}>📊</div>
        <h2 style={{ fontFamily:'var(--font-d)', fontSize:20, color:'var(--cyan)', textShadow:'0 0 12px var(--cyan)', marginBottom:6 }}>
          RAUND YAKUNLANDI
        </h2>
        <p style={{ color:'var(--dim)', fontFamily:'var(--font-ui)', fontSize:10, marginBottom:24 }}>
          RAUND #{gs?.roundNumber||1}
        </p>

        {/* Penalty explanation */}
        <div style={{ marginBottom:20, padding:'12px 16px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily:'var(--font-ui)', fontSize:9, color:'var(--dim)', marginBottom:8, letterSpacing:'.1em' }}>JARIMA QOIDASI</div>
          <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
            {[['61-120','0 shtraf','green'],['32-60','2 shtraf','cyan'],['1-31','4 shtraf','gold'],['0','6 shtraf','red']].map(([r,l,c]) => (
              <div key={r} style={{ padding:'4px 8px', borderRadius:4, background:`rgba(255,255,255,0.03)`, border:`1px solid rgba(255,255,255,0.07)`, fontSize:9, fontFamily:'var(--font-ui)', color:`var(--${c})` }}>
                {r}: {l}
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:26 }}>
          {players.map(p => {
            const s = summary[p.id] || {};
            return (
              <div key={p.id} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'12px 16px', borderRadius:10,
                background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
              }}>
                <div>
                  <div style={{ fontFamily:'var(--font-ui)', fontSize:12, color:'var(--text)' }}>{p.nickname}</div>
                  <div style={{ fontFamily:'var(--font-ui)', fontSize:9, color:'var(--dim)', marginTop:2 }}>
                    Jami jarima: <span style={{ color:(gs?.penalties?.[p.id]||0)>=9?'var(--red)':'var(--text)' }}>{gs?.penalties?.[p.id]||0}</span>/12
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--font-ui)', fontSize:16, fontWeight:700, color:'var(--gold)' }}>{s.points||0} ball</div>
                  <div style={{ fontFamily:'var(--font-ui)', fontSize:11, color: s.penalty===0?'var(--green)':s.penalty===6?'var(--red)':'var(--pink)' }}>
                    +{s.penalty||0} shtraf
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          {isHost && <Btn color="gold" onClick={onNext}>▶ KEYINGI RAUND</Btn>}
          <Btn color="cyan" onClick={onLeave}>← MENU</Btn>
        </div>
        {!isHost && (
          <p style={{ color:'var(--dim)', fontSize:10, marginTop:14, fontFamily:'var(--font-ui)' }}>
            Host keyingi raundni boshlashini kuting...
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ─── BURA GAME OVER ──────────────────────────────────────────────
function BuraGameOver({ gs, room, socketId, onPlayAgain, onLeave }) {
  const isHost  = room.host === socketId;
  const players = room.players;
  const winner  = gs?.winner;
  const isTeam  = room.gameType === '4p';

  let iWon = false;
  if (isTeam) {
    const myTeam = gs?.teams?.team1?.includes(socketId) ? 'team1' : 'team2';
    iWon = winner === myTeam;
  } else {
    iWon = winner === socketId;
  }

  useEffect(() => { if (iWon) SFX.win(); else SFX.error(); }, []);

  const sorted = [...players].sort((a,b) => (gs?.penalties?.[a.id]||0) - (gs?.penalties?.[b.id]||0));

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <BG/>
      <motion.div initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:100}}
        style={{
          background:'rgba(8,16,34,0.97)', borderRadius:22,
          padding:'44px 38px', maxWidth:440, width:'90%',
          border:`1px solid ${iWon?'rgba(245,200,66,0.35)':'rgba(255,45,110,0.25)'}`,
          boxShadow:`0 0 80px ${iWon?'rgba(245,200,66,0.1)':'rgba(255,45,110,0.07)'}, 0 40px 80px rgba(0,0,0,0.7)`,
          textAlign:'center', zIndex:1,
          animation: iWon?'winner-flash 2s infinite':undefined,
        }}
      >
        <div style={{ fontSize:64, marginBottom:16 }}>{iWon?'🏆':'💀'}</div>
        <h2 style={{
          fontFamily:'var(--font-d)', fontSize:22,
          color:iWon?'var(--gold)':'var(--pink)',
          textShadow:`0 0 15px ${iWon?'var(--gold)':'var(--pink)'}`,
          marginBottom:8,
        }}>
          {iWon ? "G'ALABA!" : "YUTQAZDINGIZ"}
        </h2>
        <p style={{ color:'var(--dim)', fontSize:13, marginBottom:28 }}>
          {isTeam
            ? (iWon ? 'Sizning jamoangiz g\'alaba qildi!' : 'Raqib jamoa g\'alaba qildi')
            : (iWon ? 'Tabriklaymiz! Siz eng kam jarima yigʻdingiz!' : `${gs?.winnerNickname || players.find(p=>p.id===winner)?.nickname} gʻalaba qildi!`)}
        </p>

        {/* Final standings */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:28 }}>
          {sorted.map((p, rank) => {
            const pen = gs?.penalties?.[p.id] || 0;
            const isLoser = pen >= 12;
            return (
              <div key={p.id} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'12px 16px', borderRadius:10,
                background: rank===0?'rgba(245,200,66,0.08)':'rgba(255,255,255,0.03)',
                border: `1px solid ${rank===0?'rgba(245,200,66,0.3)':isLoser?'rgba(255,45,110,0.3)':'rgba(255,255,255,0.07)'}`,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontFamily:'var(--font-ui)', fontSize:14, color:rank===0?'var(--gold)':isLoser?'var(--red)':'var(--dim)' }}>
                    {rank===0?'🥇':rank===1?'🥈':rank===2?'🥉':'💀'}
                  </span>
                  <span style={{ fontFamily:'var(--font-ui)', fontSize:12, color:rank===0?'var(--gold)':'var(--text)' }}>{p.nickname}</span>
                  {p.id===socketId && <span style={{ fontSize:9, color:'var(--cyan)' }}>(sen)</span>}
                </div>
                <span style={{ fontFamily:'var(--font-ui)', fontSize:14, fontWeight:700, color:isLoser?'var(--red)':rank===0?'var(--gold)':'var(--text)' }}>
                  {pen} shtraf
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          {isHost && <Btn color="gold" onClick={onPlayAgain}>🔄 QAYTA O'YNASH</Btn>}
          <Btn color="cyan" onClick={onLeave}>← BOSH MENU</Btn>
        </div>
        {!isHost && <p style={{ color:'var(--dim)', fontSize:10, marginTop:14, fontFamily:'var(--font-ui)' }}>Host qayta boshlashini kuting...</p>}
      </motion.div>
    </div>
  );
}

// ─── 108 GAME SCREEN ──────────────────────────────────────────────
function Game108Screen({ room, gs, myHand, socketId, nickname, onPlay, onDraw, onLeave, onPlayAgain }) {
  const [selected, setSelected] = useState(null);
  const [suitModal, setSuitModal] = useState(false);
  const players     = room.players;
  const isMyTurn    = gs?.currentPlayer === socketId;
  const topCard     = gs?.topCard;
  const pending     = gs?.pendingDraw || 0;
  const effSuit     = gs?.suitRequest || gs?.currentSuit;

  const playable = useMemo(() => {
    if (!isMyTurn || !myHand || !gs) return new Set();
    return new Set(myHand.filter(c => {
      if (pending > 0) return c.rank==='6' || c.rank==='7' || (c.rank==='K'&&c.suit==='spades');
      if (c.rank==='8') return c.suit === effSuit;
      return c.suit === effSuit || c.rank === gs.currentRank;
    }).map(c => c.id));
  }, [isMyTurn, myHand, pending, effSuit, gs]);

  function handleCardClick(c) {
    if (!isMyTurn || !playable.has(c.id)) return;
    if (c.rank === 'Q') { setSelected(c); setSuitModal(true); }
    else { SFX.play(); onPlay(c.id, null); }
  }

  if (gs?.phase === 'gameOver') {
    const iWon = gs.winner === socketId;
    return (
      <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
        <BG/>
        <motion.div initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:120}}
          style={{ background:'rgba(8,16,34,0.97)', borderRadius:22, padding:'44px 38px', maxWidth:400, width:'90%', border:`1px solid ${iWon?'rgba(0,255,148,0.35)':'rgba(255,45,110,0.25)'}`, boxShadow:'0 40px 80px rgba(0,0,0,0.7)', textAlign:'center', zIndex:1 }}>
          <div style={{ fontSize:64, marginBottom:16 }}>{iWon?'🏆':'💀'}</div>
          <h2 style={{ fontFamily:'var(--font-d)', fontSize:22, color:iWon?'var(--green)':'var(--pink)', textShadow:`0 0 14px ${iWon?'var(--green)':'var(--pink)'}`, marginBottom:8 }}>
            {iWon?'G\'ALABA!':'YUTQAZDINGIZ'}
          </h2>
          <p style={{ color:'var(--dim)', marginBottom:28 }}>
            {gs.winnerNickname} barcha kartasidan qutulib gʻalaba qildi!
          </p>
          <div style={{ marginBottom:20, display:'flex', flexDirection:'column', gap:8 }}>
            {players.map(p => (
              <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontFamily:'var(--font-ui)', fontSize:12, color:p.id===gs.winner?'var(--green)':'var(--text)' }}>{p.nickname}</span>
                <span style={{ fontFamily:'var(--font-ui)', fontSize:12, color:'var(--dim)' }}>🃏 {gs.handSizes?.[p.id]||0} qoldi</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            {room.host===socketId && <Btn color="green" onClick={onPlayAgain}>🔄 QAYTA</Btn>}
            <Btn color="cyan" onClick={onLeave}>← MENU</Btn>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', zIndex:20, overflow:'hidden' }}>
      <BG variant="game"/>

      {/* Suit modal */}
      <AnimatePresence>
        {suitModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center' }}
          >
            <motion.div initial={{scale:.8,y:24}} animate={{scale:1,y:0}}
              style={{ background:'var(--surface)', borderRadius:16, padding:'30px', border:'1px solid rgba(0,229,255,0.25)', textAlign:'center' }}
            >
              <h3 style={{ fontFamily:'var(--font-d)', fontSize:16, color:'var(--gold)', marginBottom:20 }}>SUIT TANLANG (QUEEN)</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {['spades','hearts','diamonds','clubs'].map(s => (
                  <motion.button key={s} onClick={()=>{ SFX.play(); onPlay(selected.id,s); setSuitModal(false); setSelected(null); }}
                    whileHover={{scale:1.06}} whileTap={{scale:.94}}
                    style={{
                      padding:'16px 20px', borderRadius:10,
                      background:'rgba(255,255,255,0.04)', border:`2px solid ${SUIT_CLR[s]}`,
                      cursor:'pointer', color:SUIT_CLR[s], fontSize:26,
                      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    }}
                  >
                    <span>{SUIT_SYM[s]}</span>
                    <span style={{ fontSize:10, fontFamily:'var(--font-ui)' }}>{SUIT_LBL[s]}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', zIndex:10, background:'rgba(2,4,8,0.82)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,229,255,0.07)' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {players.map(p => {
            const isCurrent = gs?.currentPlayer === p.id;
            return (
              <div key={p.id} style={{
                padding:'4px 9px', borderRadius:5,
                background:isCurrent?'rgba(0,255,148,0.1)':'rgba(255,255,255,0.03)',
                border:`1px solid ${isCurrent?'var(--green)':'rgba(255,255,255,0.07)'}`,
                fontFamily:'var(--font-ui)', fontSize:10,
                color:isCurrent?'var(--green)':p.id===socketId?'var(--cyan)':'var(--dim)',
              }}>
                {p.nickname.slice(0,8)} 🃏{gs?.handSizes?.[p.id]||0}
              </div>
            );
          })}
        </div>
        <Btn small color="red" onClick={onLeave}>✕</Btn>
      </div>

      {/* GAME AREA */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1 }}>
        {/* Direction */}
        <div style={{ marginBottom:12, fontFamily:'var(--font-ui)', fontSize:11, color:'var(--cyan)' }}>
          {gs?.direction===1?'↻ Soat yo\'nalishi':'↺ Teskari yo\'nalish'}
        </div>
        {/* Pending draw warning */}
        {pending > 0 && (
          <motion.div animate={{scale:[1,1.06,1]}} transition={{repeat:Infinity,duration:.7}}
            style={{
              marginBottom:12, padding:'7px 18px', borderRadius:20,
              background:'rgba(255,45,110,0.15)', border:'1px solid var(--pink)',
              color:'var(--pink)', fontFamily:'var(--font-ui)', fontSize:12,
              boxShadow:'0 0 18px rgba(255,45,110,0.3)',
            }}
          >⚠ +{pending} KARTA OLISH KERAK</motion.div>
        )}
        {/* Deck + Discard */}
        <div style={{ display:'flex', gap:36, alignItems:'center' }}>
          {/* Draw pile */}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--dim)', fontFamily:'var(--font-ui)', marginBottom:6 }}>
              DAST ({gs?.drawPileCount||0})
            </div>
            <motion.div whileHover={isMyTurn?{scale:1.06}:{}} whileTap={isMyTurn?{scale:.94}:{}} onClick={isMyTurn?()=>{SFX.draw();onDraw();}:undefined} style={{ cursor:isMyTurn?'pointer':'default' }}>
              <Card faceDown/>
            </motion.div>
            {isMyTurn && (
              <div style={{ marginTop:8 }}>
                <Btn small color="cyan" onClick={()=>{SFX.draw();onDraw();}}>
                  {pending>0?`+${pending} KARTA AL`:'KARTA OLISH'}
                </Btn>
              </div>
            )}
          </div>
          {/* Discard */}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--dim)', fontFamily:'var(--font-ui)', marginBottom:6 }}>
              TASHLANGAN {gs?.suitRequest?`(${SUIT_LBL[gs.suitRequest]} ZAKAZ)`:''}
            </div>
            <AnimatePresence mode="wait">
              {topCard && (
                <motion.div key={topCard.id} initial={{scale:.8,rotate:-12}} animate={{scale:1,rotate:0}} exit={{scale:.8}}>
                  <Card card={topCard}/>
                </motion.div>
              )}
            </AnimatePresence>
            {effSuit && (
              <div style={{ marginTop:6, fontSize:22, color:SUIT_CLR[effSuit] }}>{SUIT_SYM[effSuit]}</div>
            )}
          </div>
        </div>
        {isMyTurn && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{ marginTop:18, padding:'7px 18px', borderRadius:20, background:'rgba(0,255,148,0.12)', border:'1px solid var(--green)', color:'var(--green)', fontFamily:'var(--font-ui)', fontSize:11, boxShadow:'0 0 16px rgba(0,255,148,0.25)' }}>
            SIZNING NAVBATINGIZ
          </motion.div>
        )}
      </div>

      {/* MY HAND */}
      <div style={{ background:'rgba(2,4,8,0.88)', backdropFilter:'blur(14px)', borderTop:'1px solid rgba(0,229,255,0.07)', padding:'10px 6px 16px', zIndex:10 }}>
        <div style={{ textAlign:'center', marginBottom:6, fontFamily:'var(--font-ui)', fontSize:9, color:'var(--dim)' }}>
          {nickname} • {myHand?.length||0} karta
        </div>
        <div style={{ display:'flex', gap:3, justifyContent:'center', flexWrap:'nowrap', overflowX:'auto', paddingTop:14, paddingBottom:4 }}>
          {(myHand||[]).map((c,i) => (
            <Card key={c.id} card={c} onClick={handleCardClick} playable={playable.has(c.id)&&isMyTurn} animDelay={i*.04} small/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [screen,   setScreen]   = useState('login');
  const [nickname, setNickname] = useState('');
  const [socketId, setSocketId] = useState('');
  const [selGame,  setSelGame]  = useState('');
  const [room,     setRoom]     = useState(null);
  const [gs,       setGs]       = useState(null);
  const [myHand,   setMyHand]   = useState([]);
  const [chats,    setChats]    = useState([]);
  const [typing,   setTyping]   = useState([]);
  const [toasts,   setToasts]   = useState([]);
  const [online,   setOnline]   = useState(false);

  const sockRef  = useRef(null);
  const tTyping  = useRef({});
  const toastId  = useRef(0);

  const toast = useCallback((msg, type='info') => {
    const id = ++toastId.current;
    setToasts(p => [...p, {id,msg,type}]);
    setTimeout(() => setToasts(p => p.filter(t=>t.id!==id)), 3500);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    sockRef.current = socket;

    socket.on('connect', () => {
      setOnline(true);
      setSocketId(socket.id);
      const saved = localStorage.getItem('karta_nick');
      if (saved) socket.emit('register', {nickname:saved});
    });
    socket.on('disconnect', () => {
      setOnline(false);
      toast('Ulanish uzildi. Qayta ulanmoqda...', 'error');
    });
    socket.on('registered', ({nickname:n}) => { setNickname(n); });
    socket.on('error', ({msg}) => { toast(msg,'error'); SFX.error(); });
    socket.on('moveError', ({msg}) => { toast(msg,'error'); SFX.error(); });
    socket.on('joinError', ({msg}) => { toast(msg,'error'); SFX.error(); });

    socket.on('roomCreated', ({room:r}) => {
      setRoom(r); setChats(r.chat||[]); setScreen('lobby');
    });
    socket.on('roomJoined', ({room:r}) => {
      setRoom(r); setChats(r.chat||[]); setScreen('lobby');
    });
    socket.on('roomUpdate', ({room:r}) => setRoom(r));
    socket.on('playerJoined', ({nickname:n}) => { toast(`${n} qoʻshildi!`,'success'); SFX.join(); });
    socket.on('playerLeft', ({nickname:n, room:r}) => {
      toast(`${n} chiqdi`,'info');
      if (r) setRoom(r);
    });

    socket.on('gameStarted', ({room:r}) => {
      setRoom(r); setMyHand([]); setGs(null); SFX.deal();
    });
    socket.on('dealCards', ({hand}) => { setMyHand(hand); SFX.deal(); });
    socket.on('handUpdate', ({hand}) => setMyHand(hand));

    socket.on('gameState', (state) => {
      setGs(state);
      setScreen(prev => {
        if (prev==='lobby' && state) return roomRef.current?.gameMode || prev;
        return prev;
      });
    });

    socket.on('roundOver', (state) => { setGs(state); });
    socket.on('gameOver', (state) => { setGs(prev => ({...prev,...state,phase:'gameOver'})); });

    socket.on('gameCancelled', ({reason, room:r}) => {
      toast(reason,'error');
      if (r) setRoom(r);
      setGs(null); setMyHand([]);
      setScreen('lobby');
    });

    socket.on('returnToLobby', ({room:r}) => {
      setRoom(r); setGs(null); setMyHand([]); setScreen('lobby');
    });

    socket.on('chatMessage', m => setChats(p=>[...p,m]));
    socket.on('typing', ({nickname:n}) => {
      setTyping(p=>[...new Set([...p,n])]);
      clearTimeout(tTyping.current[n]);
      tTyping.current[n] = setTimeout(()=>setTyping(p=>p.filter(u=>u!==n)), 2000);
    });

    socket.on('reconnected', ({room:r, gameState:gs2}) => {
      setRoom(r);
      if (gs2?.hand) setMyHand(gs2.hand);
      if (gs2?.public) setGs(gs2.public);
      setChats(r.chat||[]);
      setScreen(r.status==='playing'?r.gameMode:'lobby');
      toast('Xonaga qayta ulandi!','success');
    });

    socket.connect();
    return () => {
      ['connect','disconnect','registered','error','moveError','joinError',
       'roomCreated','roomJoined','roomUpdate','playerJoined','playerLeft',
       'gameStarted','dealCards','handUpdate','gameState','roundOver','gameOver',
       'gameCancelled','returnToLobby','chatMessage','typing','reconnected'
      ].forEach(ev => socket.off(ev));
    };
  }, []);

  // Sync game screen
  const roomRef = useRef(null);
  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => {
    if (gs && room && screen==='lobby') setScreen(room.gameMode);
  }, [gs]);

  // Handlers
  function login(n) {
    setNickname(n);
    sockRef.current.emit('register', {nickname:n});
    setScreen('menu');
  }
  function logout() {
    localStorage.removeItem('karta_nick');
    setNickname(''); setRoom(null); setGs(null); setMyHand([]);
    setScreen('login');
  }
  function createRoom({gameMode,gameType,deckCount}) {
    sockRef.current.emit('createRoom',{gameMode,gameType,deckCount});
  }
  function joinRoom(roomId) {
    sockRef.current.emit('joinRoom',{roomId:roomId.trim()});
  }
  function leave() {
    if (room?.id) sockRef.current.emit('leaveRoom',{roomId:room.id});
    setRoom(null); setGs(null); setMyHand([]); setChats([]);
    setScreen('menu');
  }
  function sendChat(text) { sockRef.current.emit('chatMessage',{roomId:room?.id,text}); }
  function buraPlay(cardId) { sockRef.current.emit('buraPlayCard',{roomId:room?.id,cardId}); }
  function buraThrow() { sockRef.current.emit('buraThrow',{roomId:room?.id}); }
  function play108(cardId, suit) { sockRef.current.emit('108PlayCard',{roomId:room?.id,cardId,chosenSuit:suit}); }
  function draw108() { sockRef.current.emit('108DrawCard',{roomId:room?.id}); }
  function playAgain() { sockRef.current.emit('playAgain',{roomId:room?.id}); }
  function nextRound() { sockRef.current.emit('playAgain',{roomId:room?.id}); }

  return (
    <div style={{ width:'100%', height:'100%', position:'fixed', inset:0, overflow:'hidden' }}>
      {/* Online indicator */}
      <div style={{
        position:'fixed', bottom:10, left:10, zIndex:9999,
        display:'flex', alignItems:'center', gap:5,
        padding:'4px 9px', borderRadius:20,
        background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)',
        border:`1px solid ${online?'rgba(0,255,148,0.25)':'rgba(255,45,110,0.25)'}`,
      }}>
        <div style={{ width:5, height:5, borderRadius:'50%', background:online?'var(--green)':'var(--pink)', boxShadow:`0 0 5px ${online?'var(--green)':'var(--pink)'}` }}/>
        <span style={{ fontSize:8.5, fontFamily:'var(--font-ui)', color:'var(--dim)', letterSpacing:'.1em' }}>
          {online?'ONLINE':'OFFLINE'}
        </span>
      </div>

      <Toast toasts={toasts}/>

      <AnimatePresence mode="wait">
        {screen==='login' && (
          <motion.div key="login" style={{position:'fixed',inset:0}} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <LoginScreen onLogin={login}/>
          </motion.div>
        )}
        {screen==='menu' && (
          <motion.div key="menu" style={{position:'fixed',inset:0}} initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}>
            <MenuScreen nickname={nickname} onSelect={id=>{setSelGame(id);setScreen('select');}} onLogout={logout}/>
          </motion.div>
        )}
        {screen==='select' && (
          <motion.div key="sel" style={{position:'fixed',inset:0}} initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}>
            <SelectScreen gameMode={selGame} onBack={()=>setScreen('menu')} onCreate={createRoom} onJoin={joinRoom}/>
          </motion.div>
        )}
        {screen==='lobby' && room && (
          <motion.div key="lobby" style={{position:'fixed',inset:0}} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <LobbyScreen room={room} nickname={nickname} socketId={socketId} onStart={()=>sockRef.current.emit('startGame',{roomId:room.id})} onLeave={leave} onToggleReady={()=>sockRef.current.emit('toggleReady',{roomId:room.id})} onSendChat={sendChat} chats={chats} typingUsers={typing}/>
          </motion.div>
        )}
        {screen==='bura' && room && (
          <motion.div key="bura" style={{position:'fixed',inset:0}} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <BuraScreen room={room} gs={gs} myHand={myHand} socketId={socketId} nickname={nickname} onPlay={buraPlay} onThrow={buraThrow} onLeave={leave} onPlayAgain={playAgain} onNextRound={nextRound}/>
          </motion.div>
        )}
        {screen==='108' && room && (
          <motion.div key="108" style={{position:'fixed',inset:0}} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Game108Screen room={room} gs={gs} myHand={myHand} socketId={socketId} nickname={nickname} onPlay={play108} onDraw={draw108} onLeave={leave} onPlayAgain={playAgain}/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}