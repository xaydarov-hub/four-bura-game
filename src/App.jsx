/**
 * ═══════════════════════════════════════════════════════════════
 *  KARTA O'YINI - FULL PRODUCTION FRONTEND
 *  To'rt Bura & 108 - Real Multiplayer Card Game
 *  React + Vite + Socket.IO + Framer Motion
 *  HAMMASI BITTA App.jsx DA
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

// ─── CONFIG ─────────────────────────────────────────────────────
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

// ─── GLOBAL STYLES (injected into <head>) ───────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-deep:    #030510;
    --bg-mid:     #070d20;
    --bg-card:    #0a1228;
    --neon-cyan:  #00f5ff;
    --neon-gold:  #ffd700;
    --neon-pink:  #ff006e;
    --neon-green: #00ff88;
    --neon-purple:#b800ff;
    --glass-bg:   rgba(10, 18, 40, 0.7);
    --glass-border: rgba(0, 245, 255, 0.15);
    --text-primary: #e8f4ff;
    --text-dim:   #5a7a9a;
    --red-suit:   #ff3355;
    --black-suit: #c8d8f0;
    --font-display: 'Cinzel Decorative', serif;
    --font-ui:    'Orbitron', monospace;
    --font-body:  'Rajdhani', sans-serif;
  }

  html, body, #root {
    width: 100%; height: 100%;
    background: var(--bg-deep);
    color: var(--text-primary);
    font-family: var(--font-body);
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg-deep); }
  ::-webkit-scrollbar-thumb { background: var(--neon-cyan); border-radius: 2px; }

  input, button { font-family: var(--font-body); }

  .neon-text {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor;
  }

  .glass {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-12px); }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 10px var(--neon-cyan); }
    50%       { box-shadow: 0 0 30px var(--neon-cyan), 0 0 60px var(--neon-cyan); }
  }
  @keyframes particle-float {
    0%   { transform: translateY(100vh) rotate(0deg); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(-20px) rotate(720deg); opacity: 0; }
  }
  @keyframes scan-line {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes card-deal {
    0%   { transform: translateY(-100vh) rotate(-15deg); opacity: 0; }
    100% { transform: translateY(0) rotate(0deg); opacity: 1; }
  }
  @keyframes trump-glow {
    0%, 100% { box-shadow: 0 0 15px var(--neon-gold), 0 0 30px var(--neon-gold); }
    50%       { box-shadow: 0 0 30px var(--neon-gold), 0 0 60px var(--neon-gold), 0 0 90px var(--neon-gold); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = GLOBAL_CSS;
  document.head.appendChild(style);
}

// ─── SOCKET SINGLETON ────────────────────────────────────────────
let socketInstance = null;
function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
}

// ─── SUIT SYMBOLS & COLORS ───────────────────────────────────────
const SUIT_SYMBOL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const SUIT_COLOR  = { spades: 'var(--black-suit)', hearts: 'var(--red-suit)', diamonds: 'var(--red-suit)', clubs: 'var(--black-suit)' };
const SUIT_LABEL  = { spades: 'Pik', hearts: 'Qo\'r', diamonds: 'Karo', clubs: 'Treff' };

// ─── SOUND ENGINE ────────────────────────────────────────────────
const AudioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

function playTone(freq, duration, type = 'sine', vol = 0.3) {
  if (!AudioCtx) return;
  try {
    const osc = AudioCtx.createOscillator();
    const gain = AudioCtx.createGain();
    osc.connect(gain); gain.connect(AudioCtx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(vol, AudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, AudioCtx.currentTime + duration);
    osc.start(); osc.stop(AudioCtx.currentTime + duration);
  } catch (e) {}
}

const SFX = {
  cardPlay:  () => { playTone(440, 0.1, 'triangle', 0.2); setTimeout(() => playTone(330, 0.1, 'triangle', 0.15), 60); },
  cardDraw:  () => playTone(300, 0.15, 'sawtooth', 0.15),
  win:       () => { [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f, 0.3, 'sine', 0.25), i*120)); },
  join:      () => playTone(660, 0.2, 'sine', 0.2),
  error:     () => { playTone(200, 0.3, 'sawtooth', 0.3); },
  tick:      () => playTone(880, 0.05, 'square', 0.1),
  shuffle:   () => { for(let i=0;i<8;i++) setTimeout(()=>playTone(200+Math.random()*400,0.08,'sawtooth',0.1),i*40); },
};

// ─── PARTICLES BACKGROUND ────────────────────────────────────────
function ParticlesBG() {
  const particles = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 15,
      color: ['var(--neon-cyan)', 'var(--neon-gold)', 'var(--neon-pink)', 'var(--neon-purple)'][Math.floor(Math.random() * 4)],
      shape: Math.random() > 0.5 ? '50%' : '2px',
    })), []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* Animated gradient orbs */}
      <div style={{
        position: 'absolute', width: '60vw', height: '60vw',
        borderRadius: '50%', top: '-20vw', left: '-20vw',
        background: 'radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)',
        animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: '50vw', height: '50vw',
        borderRadius: '50%', bottom: '-15vw', right: '-15vw',
        background: 'radial-gradient(circle, rgba(184,0,255,0.08) 0%, transparent 70%)',
        animation: 'float 12s ease-in-out infinite reverse',
      }} />
      <div style={{
        position: 'absolute', width: '40vw', height: '40vw',
        borderRadius: '50%', top: '30%', left: '30%',
        background: 'radial-gradient(circle, rgba(255,215,0,0.04) 0%, transparent 70%)',
        animation: 'float 10s ease-in-out infinite 3s',
      }} />
      {/* Scan line */}
      <div style={{
        position: 'absolute', width: '100%', height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.3), transparent)',
        animation: 'scan-line 8s linear infinite',
        pointerEvents: 'none',
      }} />
      {/* Floating particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', bottom: '-10px',
          left: `${p.left}%`,
          width: p.size, height: p.size,
          borderRadius: p.shape,
          background: p.color,
          boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          animation: `particle-float ${p.duration}s linear ${p.delay}s infinite`,
        }} />
      ))}
      {/* Grid lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="var(--neon-cyan)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

// ─── CARD COMPONENT ──────────────────────────────────────────────
function CardUI({ card, onClick, selected, playable, faceDown, small, trump, animDelay = 0 }) {
  const color = card ? SUIT_COLOR[card.suit] : 'white';
  const symbol = card ? SUIT_SYMBOL[card.suit] : '';

  const s = {
    width: small ? 52 : 72,
    height: small ? 76 : 104,
    borderRadius: 8,
    cursor: onClick && playable ? 'pointer' : 'default',
    position: 'relative',
    flexShrink: 0,
    transition: 'transform 0.2s, box-shadow 0.2s',
    animation: `card-deal 0.4s ease ${animDelay}s both`,
  };

  if (faceDown) {
    return (
      <motion.div
        style={{
          ...s,
          background: 'linear-gradient(135deg, #0a1535 0%, #1a2a5e 50%, #0a1535 100%)',
          border: '1px solid rgba(0,245,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        }}
        whileHover={onClick ? { scale: 1.05 } : {}}
      >
        <div style={{
          width: '80%', height: '80%',
          border: '1px solid rgba(0,245,255,0.2)',
          borderRadius: 4,
          backgroundImage: `repeating-linear-gradient(45deg, rgba(0,245,255,0.05) 0px, rgba(0,245,255,0.05) 2px, transparent 2px, transparent 8px)`,
        }} />
      </motion.div>
    );
  }

  if (!card) return null;

  return (
    <motion.div
      onClick={() => onClick && playable && onClick(card)}
      style={{
        ...s,
        background: selected
          ? 'linear-gradient(135deg, #1a3a2a, #0d2a1a)'
          : 'linear-gradient(135deg, #f8f9ff 0%, #e8eeff 100%)',
        border: trump
          ? '2px solid var(--neon-gold)'
          : selected
            ? '2px solid var(--neon-green)'
            : playable
              ? '2px solid rgba(0,245,255,0.6)'
              : '1px solid rgba(0,0,0,0.2)',
        boxShadow: trump
          ? '0 0 15px rgba(255,215,0,0.5), 0 4px 15px rgba(0,0,0,0.4)'
          : selected
            ? '0 0 20px rgba(0,255,136,0.5), 0 -8px 0 0 rgba(0,255,136,0.3)'
            : playable
              ? '0 0 10px rgba(0,245,255,0.3), 0 4px 15px rgba(0,0,0,0.3)'
              : '0 4px 10px rgba(0,0,0,0.3)',
        transform: selected ? 'translateY(-16px)' : undefined,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: small ? '4px 5px' : '6px 8px',
        animation: `card-deal 0.35s cubic-bezier(0.34,1.56,0.64,1) ${animDelay}s both`,
      }}
      whileHover={playable && onClick ? { scale: 1.08, y: selected ? -20 : -8 } : {}}
      whileTap={playable && onClick ? { scale: 0.95 } : {}}
    >
      {/* Top-left */}
      <div style={{ color, lineHeight: 1 }}>
        <div style={{ fontSize: small ? 11 : 14, fontWeight: 900, fontFamily: 'var(--font-ui)' }}>{card.rank}</div>
        <div style={{ fontSize: small ? 10 : 13 }}>{symbol}</div>
      </div>
      {/* Center */}
      <div style={{
        textAlign: 'center', color, fontSize: small ? 20 : 30,
        textShadow: `0 0 8px ${color}40`,
      }}>{symbol}</div>
      {/* Bottom-right (flipped) */}
      <div style={{ color, lineHeight: 1, transform: 'rotate(180deg)', alignSelf: 'flex-end' }}>
        <div style={{ fontSize: small ? 11 : 14, fontWeight: 900, fontFamily: 'var(--font-ui)' }}>{card.rank}</div>
        <div style={{ fontSize: small ? 10 : 13 }}>{symbol}</div>
      </div>
      {trump && (
        <div style={{
          position: 'absolute', top: -8, right: -8,
          background: 'var(--neon-gold)', borderRadius: '50%',
          width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#000', fontWeight: 900, boxShadow: '0 0 10px var(--neon-gold)',
        }}>★</div>
      )}
    </motion.div>
  );
}

// ─── NEON BUTTON ─────────────────────────────────────────────────
function NeonBtn({ children, onClick, color = 'cyan', disabled, small, danger, style: extraStyle }) {
  const colors = {
    cyan:   { base: 'var(--neon-cyan)',  bg: 'rgba(0,245,255,0.08)' },
    gold:   { base: 'var(--neon-gold)',  bg: 'rgba(255,215,0,0.08)' },
    pink:   { base: 'var(--neon-pink)',  bg: 'rgba(255,0,110,0.08)' },
    green:  { base: 'var(--neon-green)', bg: 'rgba(0,255,136,0.08)' },
    purple: { base: 'var(--neon-purple)',bg: 'rgba(184,0,255,0.08)' },
  };
  const c = danger ? colors.pink : colors[color] || colors.cyan;

  return (
    <motion.button
      onClick={!disabled ? onClick : undefined}
      whileHover={!disabled ? { scale: 1.04 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      style={{
        background: disabled ? 'rgba(255,255,255,0.05)' : c.bg,
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.1)' : c.base}`,
        color: disabled ? 'rgba(255,255,255,0.3)' : c.base,
        padding: small ? '8px 16px' : '12px 28px',
        borderRadius: 8,
        fontFamily: 'var(--font-ui)',
        fontSize: small ? 11 : 13,
        fontWeight: 700,
        letterSpacing: '0.08em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textTransform: 'uppercase',
        boxShadow: disabled ? 'none' : `0 0 15px ${c.base}40, inset 0 0 15px ${c.base}10`,
        transition: 'all 0.2s',
        ...extraStyle,
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── NEON INPUT ──────────────────────────────────────────────────
function NeonInput({ value, onChange, placeholder, onKeyDown, autoFocus, maxLength }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      maxLength={maxLength || 20}
      style={{
        background: 'rgba(0,245,255,0.05)',
        border: '1px solid rgba(0,245,255,0.4)',
        borderRadius: 8,
        color: 'var(--neon-cyan)',
        padding: '14px 20px',
        fontSize: 18,
        fontFamily: 'var(--font-ui)',
        letterSpacing: '0.1em',
        outline: 'none',
        width: '100%',
        boxShadow: '0 0 20px rgba(0,245,255,0.15), inset 0 0 10px rgba(0,245,255,0.05)',
        transition: 'all 0.3s',
      }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--neon-cyan)';
        e.target.style.boxShadow = '0 0 30px rgba(0,245,255,0.3), inset 0 0 15px rgba(0,245,255,0.1)';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(0,245,255,0.4)';
        e.target.style.boxShadow = '0 0 20px rgba(0,245,255,0.15), inset 0 0 10px rgba(0,245,255,0.05)';
      }}
    />
  );
}

// ─── TOAST NOTIFICATIONS ─────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
            style={{
              padding: '12px 20px', borderRadius: 8, fontSize: 13,
              fontFamily: 'var(--font-ui)', letterSpacing: '0.05em',
              background: t.type === 'error' ? 'rgba(255,0,110,0.15)' : t.type === 'success' ? 'rgba(0,255,136,0.15)' : 'rgba(0,245,255,0.15)',
              border: `1px solid ${t.type === 'error' ? 'var(--neon-pink)' : t.type === 'success' ? 'var(--neon-green)' : 'var(--neon-cyan)'}`,
              color: t.type === 'error' ? 'var(--neon-pink)' : t.type === 'success' ? 'var(--neon-green)' : 'var(--neon-cyan)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              maxWidth: 280,
            }}
          >{t.msg}</motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── SCREEN: INTRO / LOGIN ────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('intro'); // intro | login

  useEffect(() => {
    const saved = localStorage.getItem('karta_nickname');
    if (saved) setName(saved);
    setTimeout(() => setPhase('login'), 2200);
  }, []);

  function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    setLoading(true);
    localStorage.setItem('karta_nickname', trimmed);
    setTimeout(() => onLogin(trimmed), 500);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', zIndex: 100,
    }}>
      <ParticlesBG />

      <AnimatePresence mode="wait">
        {phase === 'intro' ? (
          <motion.div key="intro"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', zIndex: 1 }}
          >
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              style={{ fontSize: 90, marginBottom: 20 }}
            >🎴</motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 6vw, 52px)',
                color: 'var(--neon-gold)', textShadow: '0 0 20px var(--neon-gold), 0 0 40px var(--neon-gold)',
                letterSpacing: '0.05em',
              }}
            >KARTA O'YINI</motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: '0.3em', marginTop: 8 }}
            >TO'RT BURA • 108 • MULTIPLAYER</motion.p>
          </motion.div>
        ) : (
          <motion.div key="login"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ zIndex: 1, width: '100%', maxWidth: 440, padding: '0 24px' }}
          >
            <div style={{
              background: 'rgba(7,13,32,0.9)',
              border: '1px solid rgba(0,245,255,0.2)',
              borderRadius: 20,
              padding: '48px 40px',
              backdropFilter: 'blur(30px)',
              boxShadow: '0 0 60px rgba(0,245,255,0.08), 0 40px 80px rgba(0,0,0,0.5)',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div style={{ fontSize: 50, marginBottom: 12 }}>🎴</div>
                <h1 style={{
                  fontFamily: 'var(--font-display)', fontSize: 24,
                  color: 'var(--neon-gold)',
                  textShadow: '0 0 15px var(--neon-gold)',
                }}>KARTA O'YINI</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 6, fontFamily: 'var(--font-ui)', letterSpacing: '0.1em' }}>
                  NICKNAME KIRITING
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <NeonInput
                  value={name}
                  onChange={setName}
                  placeholder="Ismingiz..."
                  autoFocus
                  maxLength={20}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>

              <NeonBtn
                color="gold"
                onClick={handleSubmit}
                disabled={name.trim().length < 2 || loading}
                style={{ width: '100%', fontSize: 14, padding: '16px' }}
              >
                {loading ? 'YUKLANMOQDA...' : 'O\'YINGA KIRISH →'}
              </NeonBtn>

              <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 11, marginTop: 20, fontFamily: 'var(--font-ui)' }}>
                ONLINE MULTIPLAYER • O'ZBEKISTON
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SCREEN: MAIN MENU ────────────────────────────────────────────
function MainMenu({ nickname, onSelectGame, onLogout }) {
  const games = [
    {
      id: 'bura',
      icon: '🃏',
      title: "TO'RT BURA",
      subtitle: '2 yoki 4 kishilik',
      desc: 'Klassik O\'zbek karta o\'yini. Kozir urish. 61+ ball g\'alaba.',
      color: 'var(--neon-gold)',
      glow: 'rgba(255,215,0,0.15)',
    },
    {
      id: '108',
      icon: '🔥',
      title: '108',
      subtitle: '2-6 kishilik',
      desc: 'Tez o\'yin. Kartalardan qutuling. Maxsus kartalar bilan raqibga karta bering.',
      color: 'var(--neon-pink)',
      glow: 'rgba(255,0,110,0.15)',
    },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
      <ParticlesBG />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 28px', zIndex: 1,
        borderBottom: '1px solid rgba(0,245,255,0.08)',
        background: 'rgba(3,5,16,0.8)', backdropFilter: 'blur(10px)',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--neon-gold)', textShadow: '0 0 10px var(--neon-gold)' }}>
            KARTA O'YINI
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
            MULTIPLAYER CASINO
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            padding: '8px 16px', borderRadius: 6,
            background: 'rgba(0,245,255,0.08)',
            border: '1px solid rgba(0,245,255,0.2)',
            fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--neon-cyan)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)' }} />
            {nickname}
          </div>
          <NeonBtn small danger onClick={onLogout}>CHIQISH</NeonBtn>
        </div>
      </div>

      {/* Game cards */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', zIndex: 1, gap: 'clamp(16px, 3vw, 40px)',
        flexWrap: 'wrap',
      }}>
        {games.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, type: 'spring', stiffness: 120 }}
            onClick={() => { SFX.join(); onSelectGame(g.id); }}
            whileHover={{ scale: 1.04, y: -8 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: 'clamp(260px, 38vw, 340px)',
              padding: '40px 32px',
              borderRadius: 20,
              background: `radial-gradient(circle at 30% 30%, ${g.glow}, rgba(7,13,32,0.9))`,
              border: `1px solid ${g.color}40`,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 0 40px ${g.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
              animation: `float ${6 + i * 2}s ease-in-out infinite ${i * 1.5}s`,
            }}
          >
            {/* Shine effect */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%)',
              pointerEvents: 'none',
            }} />
            <div style={{ fontSize: 56, marginBottom: 20, textAlign: 'center' }}>{g.icon}</div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 22,
              color: g.color, textShadow: `0 0 15px ${g.color}`,
              textAlign: 'center', marginBottom: 8,
            }}>{g.title}</h2>
            <div style={{
              textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 11,
              color: g.color, opacity: 0.7, letterSpacing: '0.15em', marginBottom: 16,
            }}>{g.subtitle}</div>
            <p style={{ color: 'rgba(200,216,240,0.6)', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>{g.desc}</p>
            <div style={{
              marginTop: 28, padding: '12px', borderRadius: 8, textAlign: 'center',
              background: `${g.color}15`, border: `1px solid ${g.color}30`,
              fontFamily: 'var(--font-ui)', fontSize: 12, color: g.color, letterSpacing: '0.1em',
            }}>
              O'YNASH →
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── SCREEN: GAME SELECT (Bura 2p/4p) ────────────────────────────
function GameSelectScreen({ gameMode, onBack, onCreate, onJoin }) {
  const [tab, setTab] = useState('create'); // create | join
  const [gameType, setGameType] = useState('2p');
  const [deckCount, setDeckCount] = useState(1);
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);

  const isBura = gameMode === 'bura';

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, overflow: 'auto' }}>
      <ParticlesBG />
      <div style={{ zIndex: 1, maxWidth: 500, margin: '0 auto', width: '100%', padding: '24px 20px' }}>
        {/* Back */}
        <NeonBtn small onClick={onBack} style={{ marginBottom: 24 }}>← ORQAGA</NeonBtn>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{isBura ? '🃏' : '🔥'}</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 24,
            color: isBura ? 'var(--neon-gold)' : 'var(--neon-pink)',
            textShadow: `0 0 15px ${isBura ? 'var(--neon-gold)' : 'var(--neon-pink)'}`,
          }}>{isBura ? "TO'RT BURA" : '108'}</h1>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 10, padding: 4,
          border: '1px solid rgba(0,245,255,0.1)',
        }}>
          {['create', 'join'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '12px', borderRadius: 7,
              background: tab === t ? 'rgba(0,245,255,0.12)' : 'transparent',
              border: tab === t ? '1px solid rgba(0,245,255,0.3)' : '1px solid transparent',
              color: tab === t ? 'var(--neon-cyan)' : 'var(--text-dim)',
              fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s',
              textTransform: 'uppercase',
            }}>
              {t === 'create' ? '+ XONA YARATISH' : '→ XONAGA KIRISH'}
            </button>
          ))}
        </div>

        {/* Create form */}
        {tab === 'create' && (
          <motion.div key="create" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass" style={{ borderRadius: 16, padding: '28px 24px' }}>
              {isBura && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '0.15em', marginBottom: 12 }}>
                    O'YINCHILAR SONI
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[['2p', '2 KISHILIK'], ['4p', '4 KISHILIK (2v2)']].map(([val, label]) => (
                      <button key={val} onClick={() => setGameType(val)} style={{
                        flex: 1, padding: '14px 10px',
                        borderRadius: 8,
                        background: gameType === val ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${gameType === val ? 'var(--neon-gold)' : 'rgba(255,255,255,0.08)'}`,
                        color: gameType === val ? 'var(--neon-gold)' : 'var(--text-dim)',
                        fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s',
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
              )}

              {!isBura && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '0.15em', marginBottom: 12 }}>
                    DAST SONI
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[1, 2, 3].map(d => (
                      <button key={d} onClick={() => setDeckCount(d)} style={{
                        flex: 1, padding: '14px 10px',
                        borderRadius: 8,
                        background: deckCount === d ? 'rgba(255,0,110,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${deckCount === d ? 'var(--neon-pink)' : 'rgba(255,255,255,0.08)'}`,
                        color: deckCount === d ? 'var(--neon-pink)' : 'var(--text-dim)',
                        fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}>{d} DAST</button>
                    ))}
                  </div>
                </div>
              )}

              <NeonBtn
                color={isBura ? 'gold' : 'pink'}
                onClick={() => onCreate({ gameMode, gameType, deckCount })}
                style={{ width: '100%', padding: '16px', fontSize: 14 }}
              >
                XONA YARATISH
              </NeonBtn>
            </div>
          </motion.div>
        )}

        {/* Join form */}
        {tab === 'join' && (
          <motion.div key="join" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass" style={{ borderRadius: 16, padding: '28px 24px' }}>
              <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '0.15em', marginBottom: 12 }}>
                XONA KODI (6 raqam)
              </p>
              <div style={{ marginBottom: 20 }}>
                <NeonInput
                  value={roomCode}
                  onChange={v => setRoomCode(v.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && roomCode.length === 6 && onJoin(roomCode)}
                />
              </div>
              <NeonBtn
                color="cyan"
                disabled={roomCode.length !== 6 || joining}
                onClick={() => { setJoining(true); onJoin(roomCode); }}
                style={{ width: '100%', padding: '16px', fontSize: 14 }}
              >
                {joining ? 'KIRILMOQDA...' : 'XONAGA KIRISH →'}
              </NeonBtn>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: LOBBY ────────────────────────────────────────────────
function LobbyScreen({ room, nickname, socketId, onStart, onLeave, onToggleReady, onSendChat, chatMessages, typingUsers }) {
  const [chatText, setChatText] = useState('');
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const isHost = room.host === socketId;
  const isReady = room.readyPlayers?.includes(socketId);
  const canStart = isHost && room.players.length >= room.minPlayers;

  function copyCode() {
    navigator.clipboard.writeText(room.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function sendChat() {
    if (!chatText.trim()) return;
    onSendChat(chatText);
    setChatText('');
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20 }}>
      <ParticlesBG />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1, overflow: 'hidden', maxWidth: 680, margin: '0 auto', width: '100%', padding: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--neon-gold)', textShadow: '0 0 10px var(--neon-gold)' }}>
              {room.gameMode === 'bura' ? "TO'RT BURA" : '108'}
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-ui)' }}>
              {room.players.length}/{room.maxPlayers} O'YINCHI
            </p>
          </div>
          <NeonBtn small danger onClick={onLeave}>CHIQISH</NeonBtn>
        </div>

        {/* Room code */}
        <div className="glass" style={{ borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.2em', marginBottom: 4 }}>XONA KODI</p>
            <div style={{
              fontFamily: 'var(--font-ui)', fontSize: 28, fontWeight: 900,
              color: 'var(--neon-cyan)', letterSpacing: '0.3em',
              textShadow: '0 0 15px var(--neon-cyan)',
            }}>{room.id}</div>
          </div>
          <NeonBtn small color="cyan" onClick={copyCode}>
            {copied ? '✓ NUSXA' : 'NUSXA'}
          </NeonBtn>
        </div>

        {/* Players */}
        <div className="glass" style={{ borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.2em', marginBottom: 12 }}>O'YINCHILAR</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Array.from({ length: room.maxPlayers }).map((_, i) => {
              const p = room.players[i];
              const isMe = p?.id === socketId;
              const isHostP = p?.id === room.host;
              const rdy = room.readyPlayers?.includes(p?.id);
              return (
                <motion.div
                  key={i}
                  initial={p ? { scale: 0.8, opacity: 0 } : {}}
                  animate={p ? { scale: 1, opacity: 1 } : {}}
                  style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: p ? (isMe ? 'rgba(0,245,255,0.08)' : 'rgba(255,255,255,0.04)') : 'rgba(255,255,255,0.02)',
                    border: p ? (isMe ? '1px solid rgba(0,245,255,0.3)' : '1px solid rgba(255,255,255,0.08)') : '1px dashed rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {p ? (
                    <>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: `hsl(${p.nickname.charCodeAt(0) * 7 % 360}, 60%, 30%)`,
                        border: `2px solid hsl(${p.nickname.charCodeAt(0) * 7 % 360}, 80%, 50%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'white',
                        flexShrink: 0,
                      }}>
                        {p.nickname[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, truncate: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {p.nickname} {isMe && <span style={{ color: 'var(--neon-cyan)', fontSize: 10 }}>(sen)</span>}
                        </div>
                        <div style={{ fontSize: 10, color: isHostP ? 'var(--neon-gold)' : rdy ? 'var(--neon-green)' : 'var(--text-dim)', fontFamily: 'var(--font-ui)' }}>
                          {isHostP ? '👑 HOST' : rdy ? '✓ TAYYOR' : 'KUTMOQDA...'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-ui)', width: '100%', textAlign: 'center' }}>
                      <motion.span animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        BO'SH SLOT...
                      </motion.span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Chat */}
        <div className="glass" style={{ borderRadius: 12, padding: '12px', marginBottom: 16, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.2em', marginBottom: 8 }}>CHAT</p>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8, minHeight: 0 }}>
            <AnimatePresence>
              {chatMessages.map(m => (
                <motion.div key={m.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ marginBottom: 6, display: 'flex', gap: 8, alignItems: 'baseline' }}
                >
                  <span style={{ color: 'var(--neon-cyan)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{m.nickname}:</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{m.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {typingUsers.length > 0 && (
              <div style={{ color: 'var(--text-dim)', fontSize: 11, fontStyle: 'italic' }}>
                {typingUsers.join(', ')} yozmoqda...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={chatText}
              onChange={e => { setChatText(e.target.value); }}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Xabar..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(0,245,255,0.15)', borderRadius: 6,
                color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13,
                fontFamily: 'var(--font-body)', outline: 'none',
              }}
            />
            <NeonBtn small onClick={sendChat}>↑</NeonBtn>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          {!isHost && (
            <NeonBtn
              color={isReady ? 'green' : 'cyan'}
              onClick={onToggleReady}
              style={{ flex: 1, padding: '14px' }}
            >
              {isReady ? '✓ TAYYOR' : 'TAYYOR'}
            </NeonBtn>
          )}
          {isHost && (
            <NeonBtn
              color="gold"
              disabled={!canStart}
              onClick={onStart}
              style={{ flex: 1, padding: '14px', fontSize: 14 }}
            >
              {canStart ? '▶ O\'YINNI BOSHLASH' : `KUTISH... (${room.players.length}/${room.minPlayers})`}
            </NeonBtn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BURA GAME SCREEN ─────────────────────────────────────────────
function BuraGame({ room, gameState, myHand, socketId, nickname, onPlayCard, onLeave, onPlayAgain }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const isMyTurn = gameState?.currentPlayer === socketId;
  const trumpSuit = gameState?.trumpSuit;
  const players = room.players;
  const myIdx = players.findIndex(p => p.id === socketId);
  const isTeam = room.gameType === '4p';
  const teams = gameState?.teams;

  // Determine playable cards
  const playableCards = useMemo(() => {
    if (!isMyTurn || !myHand) return new Set();
    const trick = gameState?.currentTrick || [];
    if (trick.length === 0) return new Set(myHand.map(c => c.id));

    const ledSuit = trick[0].card.suit;
    const hasSuit = myHand.some(c => c.suit === ledSuit);
    const hasTrump = myHand.some(c => c.suit === trumpSuit);

    if (hasSuit) {
      return new Set(myHand.filter(c => c.suit === ledSuit || c.suit === trumpSuit).map(c => c.id));
    }
    if (hasTrump) {
      return new Set(myHand.filter(c => c.suit === trumpSuit).map(c => c.id));
    }
    return new Set(myHand.map(c => c.id));
  }, [isMyTurn, myHand, gameState?.currentTrick, trumpSuit]);

  function handleCardClick(card) {
    if (!isMyTurn) return;
    if (selectedCard?.id === card.id) {
      // Play it
      SFX.cardPlay();
      onPlayCard(card.id);
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  }

  if (gameState?.phase === 'roundOver' || gameState?.phase === 'gameOver') {
    return <GameOverScreen gameState={gameState} room={room} socketId={socketId} onPlayAgain={onPlayAgain} onLeave={onLeave} mode="bura" />;
  }

  // Arrange players around table
  // My player at bottom, others arranged top/left/right
  const getPlayerPosition = (idx) => {
    const relIdx = (idx - myIdx + players.length) % players.length;
    if (players.length === 2) {
      return relIdx === 0 ? 'bottom' : 'top';
    }
    // 4 player: bottom, right, top, left
    return ['bottom', 'right', 'top', 'left'][relIdx] || 'top';
  };

  const teamColor = (pid) => {
    if (!teams) return 'var(--neon-cyan)';
    return teams.team1.includes(pid) ? 'var(--neon-cyan)' : 'var(--neon-pink)';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, overflow: 'hidden' }}>
      <ParticlesBG />

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', zIndex: 10,
        background: 'rgba(3,5,16,0.85)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0,245,255,0.08)',
      }}>
        <div style={{ display: 'flex', align: 'center', gap: 12 }}>
          {/* Trump */}
          {trumpSuit && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 6,
              background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
            }}>
              <span style={{ color: SUIT_COLOR[trumpSuit], fontSize: 18 }}>{SUIT_SYMBOL[trumpSuit]}</span>
              <span style={{ color: 'var(--neon-gold)', fontSize: 10, fontFamily: 'var(--font-ui)' }}>KOZIR</span>
            </div>
          )}
          {/* Scores */}
          {isTeam ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(0,245,255,0.08)', fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--neon-cyan)' }}>
                JAMOА 1: {gameState?.teamScores?.team1 || 0}
              </div>
              <div style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(255,0,110,0.08)', fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--neon-pink)' }}>
                JAMOА 2: {gameState?.teamScores?.team2 || 0}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              {players.map(p => (
                <div key={p.id} style={{
                  padding: '4px 10px', borderRadius: 4,
                  background: 'rgba(0,245,255,0.06)', fontFamily: 'var(--font-ui)', fontSize: 11,
                  color: p.id === socketId ? 'var(--neon-cyan)' : 'var(--text-dim)',
                }}>
                  {p.nickname}: {gameState?.scores?.[p.id] || 0}
                </div>
              ))}
            </div>
          )}
        </div>
        <NeonBtn small danger onClick={onLeave}>CHIQISH</NeonBtn>
      </div>

      {/* Table area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Casino table */}
        <div style={{
          width: 'min(85vw, 500px)', height: 'min(45vw, 280px)',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, #1a4a2a 0%, #0d3018 60%, #071a0e 100%)',
          border: '6px solid rgba(255,215,0,0.25)',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,100,30,0.2)',
          position: 'absolute',
        }} />

        {/* Other players around table */}
        {players.map((p, i) => {
          if (p.id === socketId) return null;
          const pos = getPlayerPosition(i);
          const isCurrent = gameState?.currentPlayer === p.id;
          const handSize = gameState?.handSizes?.[p.id] || 0;

          const posStyle = {
            top: { top: 8, left: '50%', transform: 'translateX(-50%)', flexDirection: 'column', alignItems: 'center' },
            left: { left: 8, top: '50%', transform: 'translateY(-50%)', flexDirection: 'column', alignItems: 'center' },
            right: { right: 8, top: '50%', transform: 'translateY(-50%)', flexDirection: 'column', alignItems: 'center' },
          };

          return (
            <div key={p.id} style={{
              position: 'absolute', display: 'flex', gap: 6, zIndex: 5,
              ...posStyle[pos],
            }}>
              {/* Opponent avatar */}
              <div style={{
                padding: '6px 12px', borderRadius: 8, textAlign: 'center',
                background: isCurrent ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isCurrent ? 'var(--neon-green)' : teamColor(p.id) + '40'}`,
                boxShadow: isCurrent ? '0 0 20px rgba(0,255,136,0.3)' : 'none',
              }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-ui)', color: teamColor(p.id), marginBottom: 2 }}>{p.nickname}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>🃏 ×{handSize}</div>
              </div>
              {/* Face-down cards */}
              <div style={{ display: 'flex', gap: -8 }}>
                {Array.from({ length: Math.min(handSize, 5) }).map((_, ci) => (
                  <div key={ci} style={{
                    width: 28, height: 40, borderRadius: 4,
                    background: 'linear-gradient(135deg, #0a1535 0%, #1a2a5e 100%)',
                    border: '1px solid rgba(0,245,255,0.2)',
                    marginLeft: ci > 0 ? -12 : 0, zIndex: ci,
                  }} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Current trick on table */}
        <div style={{ position: 'absolute', display: 'flex', gap: 8, zIndex: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320 }}>
          <AnimatePresence>
            {(gameState?.currentTrick || []).map((t, i) => {
              const player = players.find(p => p.id === t.playerId);
              return (
                <motion.div key={t.card.id}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: (i % 2 === 0 ? -5 : 5) + (Math.random() * 6 - 3) }}
                  style={{ position: 'relative' }}
                >
                  <CardUI card={t.card} small trump={t.card.suit === trumpSuit} />
                  <div style={{
                    position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 9, color: 'var(--text-dim)', whiteSpace: 'nowrap', fontFamily: 'var(--font-ui)',
                  }}>{player?.nickname}</div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Trump card display */}
        {gameState?.trumpCard && gameState?.deckRemaining > 0 && (
          <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}>
            <div style={{ fontSize: 9, color: 'var(--neon-gold)', fontFamily: 'var(--font-ui)', textAlign: 'center', marginBottom: 4 }}>
              KOZIR KARTI
            </div>
            <CardUI card={gameState.trumpCard} small trump />
            <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-ui)', textAlign: 'center', marginTop: 4 }}>
              {gameState.deckRemaining} qoldi
            </div>
          </div>
        )}

        {/* Turn indicator */}
        {isMyTurn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
              padding: '8px 20px', borderRadius: 20,
              background: 'rgba(0,255,136,0.15)', border: '1px solid var(--neon-green)',
              color: 'var(--neon-green)', fontFamily: 'var(--font-ui)', fontSize: 12,
              boxShadow: '0 0 20px rgba(0,255,136,0.3)',
              zIndex: 10,
            }}
          >
            SIZNING NAVBATИНГИZ
          </motion.div>
        )}
      </div>

      {/* My hand */}
      <div style={{
        padding: '12px 8px 20px',
        background: 'rgba(3,5,16,0.85)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(0,245,255,0.08)',
        zIndex: 10,
      }}>
        {/* My info */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{
            fontFamily: 'var(--font-ui)', fontSize: 11,
            color: isMyTurn ? 'var(--neon-green)' : 'var(--text-dim)',
          }}>
            {nickname} {isMyTurn ? '• SIZNING NAVBATINGIZ' : '• KUTMOQDA...'}
          </span>
        </div>

        {/* Hand */}
        <div style={{
          display: 'flex', gap: 4, justifyContent: 'center',
          flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4,
          paddingTop: 20,
        }}>
          <AnimatePresence>
            {(myHand || []).map((card, i) => (
              <div key={card.id} style={{ position: 'relative' }}>
                <CardUI
                  card={card}
                  onClick={handleCardClick}
                  selected={selectedCard?.id === card.id}
                  playable={playableCards.has(card.id) && isMyTurn}
                  trump={card.suit === trumpSuit}
                  animDelay={i * 0.06}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* Play hint */}
        {selectedCard && isMyTurn && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <NeonBtn small color="green" onClick={() => { SFX.cardPlay(); onPlayCard(selectedCard.id); setSelectedCard(null); }}>
              ▶ {selectedCard.rank}{SUIT_SYMBOL[selectedCard.suit]} O'YNASH
            </NeonBtn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 108 GAME SCREEN ──────────────────────────────────────────────
function Game108Screen({ room, gameState, myHand, socketId, nickname, onPlayCard, onDrawCard, onLeave, onPlayAgain }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [suitModal, setSuitModal] = useState(false);
  const isMyTurn = gameState?.currentPlayer === socketId;
  const players = room.players;

  const topCard = gameState?.topCard;
  const pendingDraw = gameState?.pendingDraw || 0;
  const effectiveSuit = gameState?.suitRequest || gameState?.currentSuit;

  // Validate which cards can be played
  const playableCards = useMemo(() => {
    if (!isMyTurn || !myHand) return new Set();
    return new Set(myHand.filter(card => {
      if (pendingDraw > 0) {
        return card.rank === '6' || card.rank === '7' || (card.rank === 'K' && card.suit === 'spades');
      }
      if (card.rank === '8') return card.suit === effectiveSuit;
      return card.suit === effectiveSuit || card.rank === gameState?.currentRank;
    }).map(c => c.id));
  }, [isMyTurn, myHand, pendingDraw, effectiveSuit, gameState?.currentRank]);

  const canDraw = isMyTurn;

  function handleCardClick(card) {
    if (!isMyTurn || !playableCards.has(card.id)) return;
    if (card.rank === 'Q') {
      setSelectedCard(card);
      setSuitModal(true);
    } else {
      SFX.cardPlay();
      onPlayCard(card.id, null);
    }
  }

  function handleSuitSelect(suit) {
    SFX.cardPlay();
    onPlayCard(selectedCard.id, suit);
    setSuitModal(false);
    setSelectedCard(null);
  }

  if (gameState?.phase === 'gameOver') {
    return <GameOverScreen gameState={gameState} room={room} socketId={socketId} onPlayAgain={onPlayAgain} onLeave={onLeave} mode="108" />;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, overflow: 'hidden' }}>
      <ParticlesBG />

      {/* Suit selection modal */}
      <AnimatePresence>
        {suitModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }}
              style={{
                background: 'var(--bg-card)', borderRadius: 16,
                padding: '32px', border: '1px solid rgba(0,245,255,0.3)',
                boxShadow: '0 0 60px rgba(0,245,255,0.15)',
                textAlign: 'center',
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--neon-gold)', marginBottom: 24 }}>
                SUIT TANLANG (QUEEN)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {['spades', 'hearts', 'diamonds', 'clubs'].map(suit => (
                  <motion.button key={suit} onClick={() => handleSuitSelect(suit)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '18px 24px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: `2px solid ${SUIT_COLOR[suit]}`,
                      cursor: 'pointer', color: SUIT_COLOR[suit], fontSize: 28,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}
                  >
                    <span>{SUIT_SYMBOL[suit]}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)' }}>{SUIT_LABEL[suit]}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', zIndex: 10,
        background: 'rgba(3,5,16,0.85)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0,245,255,0.08)',
      }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {players.map(p => {
            const isCurrent = gameState?.currentPlayer === p.id;
            const isMe = p.id === socketId;
            return (
              <div key={p.id} style={{
                padding: '4px 10px', borderRadius: 6,
                background: isCurrent ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isCurrent ? 'var(--neon-green)' : 'rgba(255,255,255,0.08)'}`,
                fontFamily: 'var(--font-ui)', fontSize: 11,
                color: isCurrent ? 'var(--neon-green)' : isMe ? 'var(--neon-cyan)' : 'var(--text-dim)',
              }}>
                {p.nickname} 🃏{gameState?.handSizes?.[p.id] || 0}
              </div>
            );
          })}
        </div>
        <NeonBtn small danger onClick={onLeave}>CHIQISH</NeonBtn>
      </div>

      {/* Game area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>

        {/* Direction */}
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--neon-cyan)',
        }}>
          {gameState?.direction === 1 ? '↻ SOAT YO\'NALISHI' : '↺ TESKARI'}
        </div>

        {/* Pending draw warning */}
        {pendingDraw > 0 && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            style={{
              position: 'absolute', top: 36, left: '50%', transform: 'translateX(-50%)',
              padding: '8px 20px', borderRadius: 20,
              background: 'rgba(255,0,110,0.15)', border: '1px solid var(--neon-pink)',
              color: 'var(--neon-pink)', fontFamily: 'var(--font-ui)', fontSize: 13,
              boxShadow: '0 0 20px rgba(255,0,110,0.3)',
            }}
          >
            ⚠ +{pendingDraw} KARTA
          </motion.div>
        )}

        {/* Deck + Discard */}
        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          {/* Draw pile */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-ui)', marginBottom: 6 }}>
              DAST ({gameState?.drawPileCount || 0})
            </div>
            <motion.div
              whileHover={canDraw ? { scale: 1.05 } : {}}
              whileTap={canDraw ? { scale: 0.95 } : {}}
              onClick={() => { if (canDraw) { SFX.cardDraw(); onDrawCard(); } }}
              style={{ cursor: canDraw ? 'pointer' : 'default' }}
            >
              <CardUI faceDown />
            </motion.div>
            {canDraw && (
              <div style={{ marginTop: 6 }}>
                <NeonBtn small color="cyan" onClick={() => { SFX.cardDraw(); onDrawCard(); }}>
                  {pendingDraw > 0 ? `+${pendingDraw} OLISH` : 'KARTA OLISH'}
                </NeonBtn>
              </div>
            )}
          </div>

          {/* Discard pile */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-ui)', marginBottom: 6 }}>
              TASHLANGAN {gameState?.suitRequest && `(${SUIT_LABEL[gameState.suitRequest]} ZAKAZ)`}
            </div>
            <AnimatePresence mode="wait">
              {topCard && (
                <motion.div key={topCard.id}
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                >
                  <CardUI card={topCard} />
                </motion.div>
              )}
            </AnimatePresence>
            {/* Effective suit indicator */}
            {effectiveSuit && (
              <div style={{
                marginTop: 6, fontFamily: 'var(--font-ui)', fontSize: 18,
                color: SUIT_COLOR[effectiveSuit],
              }}>
                {SUIT_SYMBOL[effectiveSuit]}
              </div>
            )}
          </div>
        </div>

        {/* Turn indicator */}
        {isMyTurn && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 20, padding: '8px 20px', borderRadius: 20,
              background: 'rgba(0,255,136,0.15)', border: '1px solid var(--neon-green)',
              color: 'var(--neon-green)', fontFamily: 'var(--font-ui)', fontSize: 12,
              boxShadow: '0 0 20px rgba(0,255,136,0.3)',
            }}
          >
            SIZNING NAVBATINGIZ
          </motion.div>
        )}
      </div>

      {/* My hand */}
      <div style={{
        padding: '10px 6px 16px',
        background: 'rgba(3,5,16,0.85)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(0,245,255,0.08)',
        zIndex: 10,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 6, fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-dim)' }}>
          {nickname} • {myHand?.length || 0} KARTA
        </div>
        <div style={{
          display: 'flex', gap: 3, justifyContent: 'center',
          flexWrap: 'nowrap', overflowX: 'auto',
          paddingBottom: 4, paddingTop: 16,
        }}>
          {(myHand || []).map((card, i) => (
            <CardUI
              key={card.id}
              card={card}
              onClick={handleCardClick}
              playable={playableCards.has(card.id) && isMyTurn}
              animDelay={i * 0.05}
              small
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── GAME OVER SCREEN ─────────────────────────────────────────────
function GameOverScreen({ gameState, room, socketId, onPlayAgain, onLeave, mode }) {
  const isHost = room.host === socketId;
  const winnerId = gameState?.winner;
  const isTeam = mode === 'bura' && room.gameType === '4p';

  let winnerLabel = '';
  if (mode === 'bura' && isTeam) {
    const myTeam = gameState?.teams?.team1?.includes(socketId) ? 'team1' : 'team2';
    winnerLabel = winnerId === myTeam ? '🎉 SИЗNING JAMOANGI G\'ALABA QILDI!' : '😔 Raqiblar g\'alaba qildi';
  } else if (mode === 'bura') {
    winnerLabel = winnerId === socketId ? '🎉 SIZ G\'ALABA QILDINGIZ!' : '😔 ' + (room.players.find(p => p.id === winnerId)?.nickname || '') + ' g\'alaba qildi';
  } else {
    winnerLabel = winnerId === socketId ? '🎉 SIZ G\'ALABA QILDINGIZ!' : '😔 ' + (gameState?.winnerNickname || '') + ' g\'alaba qildi';
  }

  useEffect(() => {
    if (winnerId === socketId || (isTeam && gameState?.teams?.team1?.includes(socketId) && winnerId === 'team1') || (isTeam && gameState?.teams?.team2?.includes(socketId) && winnerId === 'team2')) {
      SFX.win();
    }
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <ParticlesBG />
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120 }}
        style={{
          background: 'rgba(7,13,32,0.97)', borderRadius: 24,
          padding: '48px 40px', maxWidth: 420, width: '90%',
          border: '1px solid rgba(255,215,0,0.3)',
          boxShadow: '0 0 80px rgba(255,215,0,0.1), 0 40px 80px rgba(0,0,0,0.6)',
          textAlign: 'center', zIndex: 1,
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          {winnerLabel.startsWith('🎉') ? '🏆' : '💀'}
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 22,
          color: winnerLabel.startsWith('🎉') ? 'var(--neon-gold)' : 'var(--neon-pink)',
          textShadow: `0 0 15px ${winnerLabel.startsWith('🎉') ? 'var(--neon-gold)' : 'var(--neon-pink)'}`,
          marginBottom: 8,
        }}>O'YIN TUGADI</h2>
        <p style={{ color: 'var(--text-primary)', fontSize: 15, marginBottom: 32 }}>{winnerLabel}</p>

        {/* Scores */}
        {mode === 'bura' && (
          <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isTeam ? (
              <>
                <ScoreRow label="Jamoa 1" score={gameState?.teamScores?.team1} highlight={winnerId === 'team1'} color="var(--neon-cyan)" />
                <ScoreRow label="Jamoa 2" score={gameState?.teamScores?.team2} highlight={winnerId === 'team2'} color="var(--neon-pink)" />
              </>
            ) : (
              room.players.map(p => (
                <ScoreRow key={p.id} label={p.nickname} score={gameState?.scores?.[p.id]} highlight={p.id === winnerId} color="var(--neon-cyan)" />
              ))
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {isHost && (
            <NeonBtn color="gold" onClick={onPlayAgain}>🔄 QAYTA O'YNASH</NeonBtn>
          )}
          <NeonBtn color="cyan" onClick={onLeave}>← BOSH MENU</NeonBtn>
        </div>
        {!isHost && (
          <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 16, fontFamily: 'var(--font-ui)' }}>
            HOST qayta boshlashini kuting...
          </p>
        )}
      </motion.div>
    </div>
  );
}

function ScoreRow({ label, score, highlight, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 16px', borderRadius: 8,
      background: highlight ? `${color}15` : 'rgba(255,255,255,0.03)',
      border: `1px solid ${highlight ? color : 'rgba(255,255,255,0.06)'}`,
    }}>
      <span style={{ color: highlight ? color : 'var(--text-dim)', fontFamily: 'var(--font-ui)', fontSize: 12 }}>{label}</span>
      <span style={{ color: highlight ? color : 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700 }}>{score || 0}</span>
    </div>
  );
}

// ─── MAIN APP COMPONENT ───────────────────────────────────────────
export default function App() {
  // ── State ──
  const [screen, setScreen] = useState('login');   // login | menu | select | lobby | bura | 108
  const [nickname, setNickname] = useState('');
  const [socketId, setSocketId] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [myHand, setMyHand] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const typingTimeouts = useRef({});
  const toastId = useRef(0);

  // ── Toast helper ──
  const toast = useCallback((msg, type = 'info') => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Socket setup ──
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setSocketId(socket.id);
      // Auto-register if we have nickname
      const saved = localStorage.getItem('karta_nickname');
      if (saved) {
        socket.emit('register', { nickname: saved });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
      toast('Server bilan aloqa uzildi. Qayta ulanmoqda...', 'error');
    });

    socket.on('registered', ({ nickname: n, socketId: sid }) => {
      setNickname(n);
      setSocketId(sid);
    });

    socket.on('error', ({ msg }) => {
      toast(msg, 'error');
      SFX.error();
    });

    socket.on('moveError', ({ msg }) => {
      toast(msg, 'error');
      SFX.error();
    });

    socket.on('joinError', ({ msg }) => {
      toast(msg, 'error');
      SFX.error();
    });

    socket.on('roomCreated', ({ roomId, room: r }) => {
      setRoom(r);
      setChatMessages(r.chat || []);
      setScreen('lobby');
    });

    socket.on('roomJoined', ({ room: r }) => {
      setRoom(r);
      setChatMessages(r.chat || []);
      setScreen('lobby');
    });

    socket.on('roomUpdate', ({ room: r }) => {
      setRoom(r);
    });

    socket.on('playerJoined', ({ nickname: n }) => {
      toast(`${n} xonaga qo'shildi!`, 'success');
      SFX.join();
    });

    socket.on('playerLeft', ({ nickname: n, room: r }) => {
      toast(`${n} chiqdi`, 'info');
      if (r) setRoom(r);
    });

    socket.on('playerReconnected', ({ nickname: n }) => {
      toast(`${n} qaytib keldi`, 'success');
    });

    socket.on('gameStarted', ({ room: r }) => {
      setRoom(r);
      setMyHand([]);
      setGameState(null);
      SFX.shuffle();
    });

    socket.on('dealCards', ({ hand }) => {
      setMyHand(hand);
    });

    socket.on('handUpdate', ({ hand }) => {
      setMyHand(hand);
    });

    socket.on('gameState', (state) => {
      setGameState(state);
      // Switch to game screen
      setScreen(prev => {
        if (prev === 'lobby') {
          return state && room ? room.gameMode : prev;
        }
        return prev;
      });
    });

    socket.on('trickComplete', ({ winner, points }) => {
      // Find winner name
      const winnerPlayer = room?.players?.find(p => p.id === winner);
      if (winnerPlayer) {
        toast(`${winnerPlayer.nickname} trick'ni oldi! +${points} ball`, 'info');
      }
    });

    socket.on('gameOver', (data) => {
      setGameState(prev => ({ ...prev, ...data, phase: 'gameOver', roundOver: true }));
    });

    socket.on('gameCancelled', ({ reason, room: r }) => {
      toast(reason, 'error');
      setRoom(r);
      setGameState(null);
      setMyHand([]);
      setScreen('lobby');
    });

    socket.on('returnToLobby', ({ room: r }) => {
      setRoom(r);
      setGameState(null);
      setMyHand([]);
      setScreen('lobby');
    });

    socket.on('chatMessage', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on('typing', ({ nickname: n }) => {
      setTypingUsers(prev => [...new Set([...prev, n])]);
      clearTimeout(typingTimeouts.current[n]);
      typingTimeouts.current[n] = setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u !== n));
      }, 2000);
    });

    socket.on('reconnected', ({ room: r, gameState: gs }) => {
      setRoom(r);
      if (gs?.hand) setMyHand(gs.hand);
      if (gs?.public) setGameState(gs.public);
      setChatMessages(r.chat || []);
      if (r.status === 'playing') {
        setScreen(r.gameMode);
      } else {
        setScreen('lobby');
      }
      toast('Xonaga qayta ulandi!', 'success');
    });

    socket.connect();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('registered');
      socket.off('error');
      socket.off('moveError');
      socket.off('joinError');
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('roomUpdate');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('playerReconnected');
      socket.off('gameStarted');
      socket.off('dealCards');
      socket.off('handUpdate');
      socket.off('gameState');
      socket.off('trickComplete');
      socket.off('gameOver');
      socket.off('gameCancelled');
      socket.off('returnToLobby');
      socket.off('chatMessage');
      socket.off('typing');
      socket.off('reconnected');
    };
  }, []);

  // ── Game screen sync ──
  useEffect(() => {
    if (gameState && room && screen === 'lobby') {
      setScreen(room.gameMode);
    }
  }, [gameState, room]);

  // ── Handlers ──
  function handleLogin(n) {
    const socket = socketRef.current;
    setNickname(n);
    socket.emit('register', { nickname: n });
    setScreen('menu');
  }

  function handleLogout() {
    localStorage.removeItem('karta_nickname');
    setScreen('login');
    setNickname('');
    setRoom(null);
    setGameState(null);
    setMyHand([]);
  }

  function handleSelectGame(gameId) {
    setSelectedGame(gameId);
    setScreen('select');
  }

  function handleCreateRoom({ gameMode, gameType, deckCount }) {
    socketRef.current.emit('createRoom', { gameMode, gameType, deckCount });
  }

  function handleJoinRoom(roomId) {
    socketRef.current.emit('joinRoom', { roomId: roomId.trim() });
  }

  function handleToggleReady() {
    socketRef.current.emit('toggleReady', { roomId: room?.id });
  }

  function handleStartGame() {
    socketRef.current.emit('startGame', { roomId: room?.id });
  }

  function handleLeave() {
    if (room?.id) {
      socketRef.current.emit('leaveRoom', { roomId: room.id });
    }
    setRoom(null);
    setGameState(null);
    setMyHand([]);
    setChatMessages([]);
    setScreen('menu');
  }

  function handleBuraPlay(cardId) {
    socketRef.current.emit('buraPlayCard', { roomId: room?.id, cardId });
  }

  function handle108Play(cardId, chosenSuit) {
    socketRef.current.emit('108PlayCard', { roomId: room?.id, cardId, chosenSuit });
  }

  function handle108Draw() {
    socketRef.current.emit('108DrawCard', { roomId: room?.id });
  }

  function handlePlayAgain() {
    socketRef.current.emit('playAgain', { roomId: room?.id });
  }

  function handleSendChat(text) {
    socketRef.current.emit('chatMessage', { roomId: room?.id, text });
  }

  function handleTyping() {
    socketRef.current.emit('typing', { roomId: room?.id });
  }

  // ── Render ──
  return (
    <div style={{ width: '100%', height: '100%', position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* Connection indicator */}
      <div style={{
        position: 'fixed', bottom: 12, left: 12, zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 20,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
        border: `1px solid ${connected ? 'rgba(0,255,136,0.3)' : 'rgba(255,0,110,0.3)'}`,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: connected ? 'var(--neon-green)' : 'var(--neon-pink)',
          boxShadow: `0 0 6px ${connected ? 'var(--neon-green)' : 'var(--neon-pink)'}`,
        }} />
        <span style={{ fontSize: 9, fontFamily: 'var(--font-ui)', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
          {connected ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      {/* Toast notifications */}
      <Toast toasts={toasts} />

      {/* Screens */}
      <AnimatePresence mode="wait">
        {screen === 'login' && (
          <motion.div key="login" style={{ position: 'fixed', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginScreen onLogin={handleLogin} />
          </motion.div>
        )}

        {screen === 'menu' && (
          <motion.div key="menu" style={{ position: 'fixed', inset: 0 }}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <MainMenu nickname={nickname} onSelectGame={handleSelectGame} onLogout={handleLogout} />
          </motion.div>
        )}

        {screen === 'select' && (
          <motion.div key="select" style={{ position: 'fixed', inset: 0 }}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <GameSelectScreen
              gameMode={selectedGame}
              onBack={() => setScreen('menu')}
              onCreate={handleCreateRoom}
              onJoin={handleJoinRoom}
            />
          </motion.div>
        )}

        {screen === 'lobby' && room && (
          <motion.div key="lobby" style={{ position: 'fixed', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LobbyScreen
              room={room}
              nickname={nickname}
              socketId={socketId}
              onStart={handleStartGame}
              onLeave={handleLeave}
              onToggleReady={handleToggleReady}
              onSendChat={handleSendChat}
              onTyping={handleTyping}
              chatMessages={chatMessages}
              typingUsers={typingUsers}
            />
          </motion.div>
        )}

        {screen === 'bura' && room && (
          <motion.div key="bura" style={{ position: 'fixed', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BuraGame
              room={room}
              gameState={gameState}
              myHand={myHand}
              socketId={socketId}
              nickname={nickname}
              onPlayCard={handleBuraPlay}
              onLeave={handleLeave}
              onPlayAgain={handlePlayAgain}
            />
          </motion.div>
        )}

        {screen === '108' && room && (
          <motion.div key="108" style={{ position: 'fixed', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Game108Screen
              room={room}
              gameState={gameState}
              myHand={myHand}
              socketId={socketId}
              nickname={nickname}
              onPlayCard={handle108Play}
              onDrawCard={handle108Draw}
              onLeave={handleLeave}
              onPlayAgain={handlePlayAgain}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}