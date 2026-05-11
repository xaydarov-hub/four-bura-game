/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TO'RT BURA & 108 — PRODUCTION MULTIPLAYER CARD GAME
 *  Full frontend: React + Vite + Socket.IO + Framer Motion
 *  ALL components, logic, styles, animations — single file
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { io } from "socket.io-client";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
const SUITS = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
const SUIT_COLORS = { spades: "#e2e8f0", hearts: "#f87171", diamonds: "#fb923c", clubs: "#a3e635" };
const SUIT_NAMES_UZ = { spades: "Qarg'a", hearts: "Qo'ngir", diamonds: "Ko'k", clubs: "Barg" };

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-deep: #020408;
      --bg-mid:  #060c14;
      --bg-card: #0a1628;
      --neon-gold: #f5c842;
      --neon-cyan: #00e5ff;
      --neon-purple: #c84bff;
      --neon-green: #39ff14;
      --neon-red: #ff3860;
      --glass-bg: rgba(10,22,40,0.7);
      --glass-border: rgba(245,200,66,0.18);
      --text-main: #e8eaf0;
      --text-dim: #6b7a99;
      --felt-green: #0d3b1e;
      --felt-border: #1a5c30;
      --font-display: 'Cinzel Decorative', serif;
      --font-ui: 'Rajdhani', sans-serif;
      --font-body: 'Exo 2', sans-serif;
      --shadow-neon-gold: 0 0 20px rgba(245,200,66,0.5), 0 0 60px rgba(245,200,66,0.2);
      --shadow-neon-cyan: 0 0 20px rgba(0,229,255,0.5), 0 0 60px rgba(0,229,255,0.2);
      --r-sm: 8px; --r-md: 16px; --r-lg: 24px; --r-xl: 32px;
    }

    html, body, #root {
      width: 100%; height: 100%; overflow: hidden;
      background: var(--bg-deep);
      color: var(--text-main);
      font-family: var(--font-body);
      -webkit-font-smoothing: antialiased;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--neon-gold); border-radius: 2px; }

    /* PARTICLES */
    .particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
    .particle {
      position: absolute;
      border-radius: 50%;
      animation: floatUp linear infinite;
      opacity: 0;
    }
    @keyframes floatUp {
      0%   { transform: translateY(100vh) scale(0); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 0.6; }
      100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
    }

    /* ORB GLOWS */
    .orb {
      position: fixed; border-radius: 50%; filter: blur(80px);
      pointer-events: none; z-index: 0; animation: orbDrift ease-in-out infinite alternate;
    }
    @keyframes orbDrift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(30px,20px) scale(1.1); }
    }

    /* GLASS PANEL */
    .glass {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
    }

    /* NEON GLOW TEXT */
    .neon-gold { color: var(--neon-gold); text-shadow: 0 0 10px rgba(245,200,66,0.8), 0 0 30px rgba(245,200,66,0.4); }
    .neon-cyan  { color: var(--neon-cyan);  text-shadow: 0 0 10px rgba(0,229,255,0.8), 0 0 30px rgba(0,229,255,0.4); }
    .neon-purple{ color: var(--neon-purple);text-shadow: 0 0 10px rgba(200,75,255,0.8), 0 0 30px rgba(200,75,255,0.4); }

    /* PREMIUM BUTTON */
    .btn-neon {
      font-family: var(--font-ui);
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      cursor: pointer;
      border: none;
      outline: none;
      border-radius: var(--r-sm);
      transition: all 0.2s ease;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-neon:active { transform: scale(0.96); }

    .btn-gold {
      background: linear-gradient(135deg, #f5c842 0%, #d4941a 50%, #f5c842 100%);
      color: #0a0800;
      box-shadow: 0 4px 20px rgba(245,200,66,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
    }
    .btn-gold:hover { box-shadow: 0 6px 30px rgba(245,200,66,0.7), inset 0 1px 0 rgba(255,255,255,0.3); }

    .btn-cyan {
      background: linear-gradient(135deg, #00e5ff 0%, #0097a7 50%, #00e5ff 100%);
      color: #001a1f;
      box-shadow: 0 4px 20px rgba(0,229,255,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
    }
    .btn-cyan:hover { box-shadow: 0 6px 30px rgba(0,229,255,0.7), inset 0 1px 0 rgba(255,255,255,0.3); }

    .btn-ghost {
      background: transparent;
      color: var(--text-dim);
      border: 1px solid rgba(107,122,153,0.3);
    }
    .btn-ghost:hover { border-color: var(--neon-gold); color: var(--neon-gold); }

    .btn-danger {
      background: linear-gradient(135deg, #ff3860, #c0143c);
      color: white;
      box-shadow: 0 4px 20px rgba(255,56,96,0.4);
    }

    /* NEON INPUT */
    .input-neon {
      background: rgba(0,0,0,0.4);
      border: 1.5px solid rgba(245,200,66,0.3);
      border-radius: var(--r-sm);
      color: var(--text-main);
      font-family: var(--font-ui);
      font-size: 18px;
      font-weight: 500;
      letter-spacing: 1px;
      outline: none;
      transition: all 0.3s ease;
    }
    .input-neon:focus {
      border-color: var(--neon-gold);
      box-shadow: 0 0 20px rgba(245,200,66,0.3), inset 0 0 10px rgba(245,200,66,0.05);
    }
    .input-neon::placeholder { color: var(--text-dim); }

    /* CARD STYLES */
    .card-wrapper {
      position: relative;
      cursor: pointer;
      transform-origin: bottom center;
      transition: transform 0.2s ease, filter 0.2s ease;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .card-wrapper:hover { transform: translateY(-14px) scale(1.08); }
    .card-wrapper.selected { transform: translateY(-20px) scale(1.1); filter: drop-shadow(0 0 12px var(--neon-gold)); }
    .card-wrapper.playable { cursor: pointer; }
    .card-wrapper.not-playable { cursor: not-allowed; opacity: 0.6; }
    .card-wrapper.trump-card { filter: drop-shadow(0 0 8px var(--neon-gold)) drop-shadow(0 0 16px rgba(245,200,66,0.4)); }

    /* CASINO TABLE FELT */
    .felt-table {
      background:
        radial-gradient(ellipse at center, #0f4a24 0%, #0a3319 40%, #061a0e 100%);
      border: 3px solid var(--felt-border);
      box-shadow:
        inset 0 0 60px rgba(0,0,0,0.8),
        inset 0 0 20px rgba(0,100,40,0.3),
        0 0 40px rgba(0,0,0,0.8);
      position: relative;
      overflow: hidden;
    }
    .felt-table::before {
      content: '';
      position: absolute; inset: 0;
      background: repeating-linear-gradient(
        0deg, transparent, transparent 2px,
        rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px
      );
      pointer-events: none;
    }
    .felt-table::after {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%);
      pointer-events: none;
    }

    /* LOBBY PLAYER SLOT */
    .player-slot {
      background: linear-gradient(135deg, rgba(10,22,40,0.8), rgba(5,12,25,0.9));
      border: 1px solid rgba(245,200,66,0.15);
      border-radius: var(--r-md);
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.3s ease;
    }
    .player-slot.occupied { border-color: rgba(245,200,66,0.35); background: linear-gradient(135deg, rgba(15,30,55,0.9), rgba(8,18,38,0.95)); }
    .player-slot.empty { border-style: dashed; opacity: 0.5; }
    .player-slot.host-slot { border-color: rgba(245,200,66,0.6); box-shadow: 0 0 15px rgba(245,200,66,0.15); }

    /* AVATAR */
    .avatar {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700;
      font-family: var(--font-ui);
      flex-shrink: 0;
    }

    /* TOAST */
    .toast-container {
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      display: flex; flex-direction: column; gap: 8px; z-index: 9999;
      pointer-events: none; width: min(340px, 90vw);
    }

    /* SCORE BOARD */
    .score-badge {
      background: linear-gradient(135deg, rgba(15,30,55,0.95), rgba(8,18,38,0.98));
      border: 1px solid var(--glass-border);
      border-radius: var(--r-md);
      padding: 12px 18px;
      backdrop-filter: blur(20px);
    }

    /* TRUMP INDICATOR */
    .trump-indicator {
      animation: trumpPulse 2s ease-in-out infinite;
    }
    @keyframes trumpPulse {
      0%, 100% { box-shadow: 0 0 10px rgba(245,200,66,0.4); }
      50%       { box-shadow: 0 0 25px rgba(245,200,66,0.8), 0 0 50px rgba(245,200,66,0.3); }
    }

    /* CURRENT PLAYER GLOW */
    .my-turn-glow {
      animation: turnPulse 1.5s ease-in-out infinite;
    }
    @keyframes turnPulse {
      0%, 100% { box-shadow: 0 0 15px rgba(0,229,255,0.4); }
      50%       { box-shadow: 0 0 40px rgba(0,229,255,0.9), 0 0 80px rgba(0,229,255,0.3); }
    }

    /* CHAT SCROLL */
    .chat-messages { overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(245,200,66,0.3) transparent; }

    /* ROOM CODE */
    .room-code {
      font-family: var(--font-display);
      font-size: clamp(28px, 6vw, 48px);
      letter-spacing: 10px;
      color: var(--neon-gold);
      text-shadow: var(--shadow-neon-gold);
    }

    /* MOBILE */
    @media (max-width: 640px) {
      .card-wrapper:hover { transform: translateY(-8px) scale(1.05); }
      .player-slot { padding: 10px 14px; }
    }

    /* GAME OVERLAY */
    .game-overlay {
      position: fixed; inset: 0; z-index: 100;
      background: radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.97) 100%);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(10px);
    }

    /* WIN EXPLOSION */
    @keyframes winShine {
      0%   { transform: scale(0.5) rotate(-10deg); opacity: 0; }
      50%  { transform: scale(1.1) rotate(3deg); }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    .win-card { animation: winShine 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }

    /* SCAN LINE EFFECT */
    .scanlines::after {
      content: ''; position: absolute; inset: 0;
      background: repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px);
      pointer-events: none;
    }

    /* 108 Direction arrow */
    @keyframes directionPulse {
      0%, 100% { opacity: 0.7; transform: scale(1); }
      50%       { opacity: 1;   transform: scale(1.2); }
    }
    .direction-arrow { animation: directionPulse 1s ease-in-out infinite; }

    /* Pending Draw Badge */
    .pending-draw-badge {
      background: linear-gradient(135deg, #ff3860, #c0143c);
      border-radius: 999px;
      padding: 4px 12px;
      font-family: var(--font-ui);
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 1px;
      animation: badgePulse 0.8s ease-in-out infinite;
    }
    @keyframes badgePulse {
      0%, 100% { box-shadow: 0 0 8px rgba(255,56,96,0.5); }
      50%       { box-shadow: 0 0 20px rgba(255,56,96,0.9); }
    }

    /* SUIT REQUEST MODAL */
    .suit-btn {
      width: 80px; height: 80px;
      border-radius: var(--r-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 36px; cursor: pointer;
      border: 2px solid transparent;
      background: rgba(10,22,40,0.8);
      transition: all 0.2s ease;
    }
    .suit-btn:hover {
      transform: scale(1.15);
      border-color: var(--neon-gold);
      box-shadow: 0 0 20px rgba(245,200,66,0.4);
    }

    /* INTRO ANIMATION */
    @keyframes introReveal {
      0%   { clip-path: inset(0 100% 0 0); }
      100% { clip-path: inset(0 0% 0 0); }
    }
    .intro-text { animation: introReveal 0.8s cubic-bezier(0.77,0,0.18,1) forwards; }

    /* SHIMMER */
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    .shimmer {
      background: linear-gradient(90deg, transparent 0%, rgba(245,200,66,0.3) 50%, transparent 100%);
      background-size: 200% 100%;
      animation: shimmer 2s linear infinite;
    }
  `}</style>
);

// ─── AUDIO ENGINE ──────────────────────────────────────────────────────────
const AudioEngine = {
  ctx: null,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  },
  playTone(freq, dur, type = 'sine', vol = 0.15) {
    if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.connect(g); g.connect(this.ctx.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.start(); o.stop(this.ctx.currentTime + dur);
    } catch {}
  },
  cardPlay()  { this.playTone(440, 0.08, 'triangle', 0.1); setTimeout(() => this.playTone(660, 0.06, 'triangle', 0.08), 40); },
  cardDraw()  { this.playTone(330, 0.12, 'sine', 0.08); },
  win()       { [523,659,784,1047].forEach((f,i) => setTimeout(() => this.playTone(f, 0.3, 'sine', 0.2), i*80)); },
  error()     { this.playTone(150, 0.15, 'sawtooth', 0.12); },
  join()      { [440,550,660].forEach((f,i) => setTimeout(() => this.playTone(f, 0.15, 'sine', 0.15), i*60)); },
  tick()      { this.playTone(880, 0.04, 'square', 0.05); },
};

// ─── UTILITY HOOKS ────────────────────────────────────────────────────────
function useSocket(serverUrl) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = s;
    s.on('connect',    () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    return () => { s.disconnect(); };
  }, [serverUrl]);

  return { socket: socketRef.current, connected };
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'info', dur = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), dur);
  }, []);
  return { toasts, show };
}

// ─── PARTICLES BACKGROUND ──────────────────────────────────────────────────
function ParticlesBg() {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: `${2 + Math.random() * 6}px`,
    duration: `${8 + Math.random() * 18}s`,
    delay: `${-Math.random() * 20}s`,
    color: ['#f5c842','#00e5ff','#c84bff','#39ff14'][i % 4],
    opacity: 0.3 + Math.random() * 0.5,
  })), []);

  return (
    <div className="particles">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left, width: p.size, height: p.size,
          background: p.color, animationDuration: p.duration,
          animationDelay: p.delay, opacity: p.opacity,
        }} />
      ))}
      <div className="orb" style={{ width:400, height:400, left:'5%', top:'10%', background:'rgba(200,75,255,0.08)', animationDuration:'12s' }} />
      <div className="orb" style={{ width:300, height:300, right:'8%', top:'30%', background:'rgba(0,229,255,0.07)', animationDuration:'15s', animationDelay:'-5s' }} />
      <div className="orb" style={{ width:250, height:250, left:'40%', bottom:'10%', background:'rgba(245,200,66,0.07)', animationDuration:'18s', animationDelay:'-8s' }} />
    </div>
  );
}

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  const colors = { info:'var(--neon-cyan)', success:'var(--neon-green)', error:'var(--neon-red)', warn:'var(--neon-gold)' };
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity:0, y:-20, scale:0.9 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-10, scale:0.95 }}
            style={{
              background: 'rgba(10,22,40,0.95)',
              border: `1px solid ${colors[t.type]||colors.info}`,
              borderRadius: 'var(--r-sm)',
              padding: '12px 18px',
              fontSize: 14,
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
              letterSpacing: '0.5px',
              color: colors[t.type] || colors.info,
              boxShadow: `0 0 20px ${colors[t.type]||colors.info}33`,
              backdropFilter: 'blur(20px)',
            }}
          >{t.msg}</motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── PLAYING CARD COMPONENT ────────────────────────────────────────────────
function PlayingCard({ card, selected, playable, isTrump, onClick, style = {}, size = 'md', faceDown = false }) {
  const sizes = {
    xs: { w:38, h:54, font:9, suitFont:14 },
    sm: { w:52, h:72, font:11, suitFont:18 },
    md: { w:70, h:98, font:14, suitFont:28 },
    lg: { w:85, h:118, font:17, suitFont:34 },
  };
  const s = sizes[size] || sizes.md;
  const suitColor = card ? SUIT_COLORS[card.suit] : '#fff';
  const suitSym = card ? SUITS[card.suit] : '';
  const isRed = card && (card.suit === 'hearts' || card.suit === 'diamonds');

  return (
    <div
      className={`card-wrapper${selected?' selected':''}${playable?' playable':playable===false?' not-playable':''}${isTrump?' trump-card':''}`}
      onClick={onClick}
      style={{ width:s.w, height:s.h, ...style }}
    >
      {faceDown ? (
        // Card Back
        <svg width={s.w} height={s.h} viewBox={`0 0 ${s.w} ${s.h}`}>
          <defs>
            <linearGradient id="backGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a0a3a" />
              <stop offset="50%" stopColor="#0d1a4a" />
              <stop offset="100%" stopColor="#1a0a3a" />
            </linearGradient>
            <pattern id="backPat" patternUnits="userSpaceOnUse" width="10" height="10">
              <rect width="10" height="10" fill="url(#backGrad)" />
              <path d="M0,5 L5,0 L10,5 L5,10 Z" fill="none" stroke="rgba(245,200,66,0.15)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect rx="6" ry="6" width={s.w} height={s.h} fill="url(#backPat)" />
          <rect rx="4" ry="4" x="3" y="3" width={s.w-6} height={s.h-6} fill="none" stroke="rgba(245,200,66,0.35)" strokeWidth="1" />
          <text x={s.w/2} y={s.h/2+4} textAnchor="middle" fontSize={s.suitFont*0.8} fill="rgba(245,200,66,0.6)">🎴</text>
        </svg>
      ) : card ? (
        // Card Face
        <svg width={s.w} height={s.h} viewBox={`0 0 ${s.w} ${s.h}`}>
          <defs>
            <linearGradient id={`cardFace_${card.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f0f4ff" />
            </linearGradient>
            {isTrump && <filter id="trumpGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="1 0.8 0 0 0.2  0.8 0.7 0 0 0.1  0 0 0 0 0  0 0 0 0.8 0" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>}
          </defs>
          <rect rx="6" ry="6" width={s.w} height={s.h} fill={`url(#cardFace_${card.id})`} />
          <rect rx="5" ry="5" x="1.5" y="1.5" width={s.w-3} height={s.h-3} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
          {/* Top rank/suit */}
          <text x="5" y={s.font+3} fontSize={s.font} fontWeight="800" fontFamily="var(--font-ui)" fill={isRed?'#cc2222':'#111111'}>{card.rank}</text>
          <text x="5" y={s.font+s.font-1} fontSize={s.font-2} fontFamily="Arial" fill={suitColor==='#e2e8f0'?'#111111':suitColor}>{suitSym}</text>
          {/* Center suit */}
          <text x={s.w/2} y={s.h/2+(s.suitFont*0.4)} textAnchor="middle" fontSize={s.suitFont} fontFamily="Arial" fill={isRed?'#cc2222':'#111111'} filter={isTrump?`url(#trumpGlow)`:undefined}>{suitSym}</text>
          {/* Bottom rank/suit (rotated) */}
          <g transform={`rotate(180, ${s.w/2}, ${s.h/2})`}>
            <text x="5" y={s.font+3} fontSize={s.font} fontWeight="800" fontFamily="var(--font-ui)" fill={isRed?'#cc2222':'#111111'}>{card.rank}</text>
            <text x="5" y={s.font+s.font-1} fontSize={s.font-2} fontFamily="Arial" fill={suitColor==='#e2e8f0'?'#111111':suitColor}>{suitSym}</text>
          </g>
          {/* Trump glow border */}
          {isTrump && <rect rx="6" ry="6" width={s.w} height={s.h} fill="none" stroke="rgba(245,200,66,0.6)" strokeWidth="2" />}
        </svg>
      ) : null}
    </div>
  );
}

// ─── AVATAR COMPONENT ─────────────────────────────────────────────────────
function Avatar({ nickname, size = 44, isHost = false, isMe = false }) {
  const colors = ['#f5c842','#00e5ff','#c84bff','#39ff14','#ff6b35','#ff3860'];
  const color = colors[nickname?.charCodeAt(0) % colors.length] || colors[0];
  const letter = nickname?.[0]?.toUpperCase() || '?';
  return (
    <div className="avatar" style={{
      width: size, height: size, fontSize: size * 0.42,
      background: `radial-gradient(circle, ${color}22, ${color}11)`,
      border: `2px solid ${isMe ? 'var(--neon-cyan)' : color}66`,
      color,
      boxShadow: isMe ? `0 0 12px ${color}44` : undefined,
      position: 'relative',
    }}>
      {letter}
      {isHost && <span style={{ position:'absolute', top:-4, right:-4, fontSize:12 }}>👑</span>}
    </div>
  );
}

// ─── INTRO SCREEN ──────────────────────────────────────────────────────────
function IntroScreen({ onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2200);
    const t4 = setTimeout(() => onDone(), 3000);
    return () => [t1,t2,t3,t4].forEach(clearTimeout);
  }, [onDone]);

  return (
    <motion.div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'radial-gradient(ellipse at center, #0d0d1a 0%, #020408 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20,
    }} exit={{ opacity:0 }} transition={{ duration:0.6 }}>
      <ParticlesBg />

      <AnimatePresence>
        {phase >= 1 && (
          <motion.div key="logo"
            initial={{ scale:0, rotate:-20, opacity:0 }}
            animate={{ scale:1, rotate:0, opacity:1 }}
            transition={{ type:'spring', stiffness:200, damping:15 }}
            style={{ fontSize:80, filter:'drop-shadow(0 0 30px rgba(245,200,66,0.8))' }}
          >🎴</motion.div>
        )}
        {phase >= 2 && (
          <motion.h1 key="title"
            initial={{ opacity:0, y:30 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}
            style={{
              fontFamily:'var(--font-display)', fontSize:'clamp(22px,6vw,42px)',
              color:'var(--neon-gold)', textAlign:'center', lineHeight:1.2,
              textShadow:'var(--shadow-neon-gold)', zIndex:1,
            }}
          >TO'RT BURA<br/><span style={{ fontSize:'0.55em', color:'var(--neon-cyan)', textShadow:'var(--shadow-neon-cyan)' }}>& 108</span></motion.h1>
        )}
        {phase >= 3 && (
          <motion.p key="sub"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            style={{ fontFamily:'var(--font-ui)', color:'var(--text-dim)', letterSpacing:3, fontSize:13, textTransform:'uppercase' }}
          >Online Multiplayer • O'zbekiston</motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200); }, []);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) { setError("Kamida 2 ta harf kiriting"); return; }
    if (trimmed.length > 18) { setError("18 ta harfdan kam bo'lsin"); return; }
    setLoading(true);
    AudioEngine.init();
    setTimeout(() => {
      localStorage.setItem('karta_nickname', trimmed);
      onLogin(trimmed);
    }, 400);
  };

  return (
    <motion.div style={{
      position:'fixed', inset:0, zIndex:100,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20,
    }}
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
    >
      <ParticlesBg />
      <motion.div className="glass scanlines"
        initial={{ scale:0.85, opacity:0, y:30 }}
        animate={{ scale:1, opacity:1, y:0 }}
        transition={{ type:'spring', stiffness:150, damping:20, delay:0.1 }}
        style={{
          width:'100%', maxWidth:460,
          borderRadius:'var(--r-xl)',
          padding:'clamp(28px,6vw,52px)',
          border:'1px solid rgba(245,200,66,0.25)',
          boxShadow:'0 0 60px rgba(245,200,66,0.12), 0 20px 80px rgba(0,0,0,0.6)',
          position:'relative', overflow:'hidden', zIndex:1,
        }}
      >
        <div className="shimmer" style={{ position:'absolute', inset:0, borderRadius:'var(--r-xl)', pointerEvents:'none', opacity:0.4 }} />

        <div style={{ textAlign:'center', marginBottom:36 }}>
          <motion.div style={{ fontSize:52, marginBottom:12 }}
            animate={{ rotateY:[0,360] }}
            transition={{ duration:4, repeat:Infinity, ease:'linear' }}
          >🎴</motion.div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(18px,4vw,26px)', marginBottom:8 }} className="neon-gold">
            Xush Kelibsiz
          </h2>
          <p style={{ color:'var(--text-dim)', fontFamily:'var(--font-ui)', fontSize:14, letterSpacing:1 }}>
            O'yinchi ismingizni kiriting
          </p>
        </div>

        <div style={{ marginBottom:24, position:'relative' }}>
          <input
            ref={inputRef}
            className="input-neon"
            style={{ width:'100%', padding:'16px 20px' }}
            placeholder="Nicknamingiz..."
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            maxLength={18}
            autoComplete="off"
            spellCheck="false"
          />
          {name.length > 0 && (
            <motion.div
              initial={{ opacity:0, scale:0 }}
              animate={{ opacity:1, scale:1 }}
              style={{
                position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                width:8, height:8, borderRadius:'50%',
                background: name.trim().length >= 2 ? 'var(--neon-green)' : 'var(--neon-red)',
                boxShadow: name.trim().length >= 2 ? '0 0 8px var(--neon-green)' : '0 0 8px var(--neon-red)',
              }}
            />
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity:0, y:-8 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              style={{ color:'var(--neon-red)', fontFamily:'var(--font-ui)', fontSize:13, marginBottom:16, textAlign:'center' }}
            >{error}</motion.p>
          )}
        </AnimatePresence>

        <motion.button
          className="btn-neon btn-gold"
          style={{ width:'100%', padding:'16px', fontSize:16 }}
          onClick={handleSubmit}
          disabled={loading}
          whileTap={{ scale:0.97 }}
        >
          {loading ? (
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <motion.span animate={{ rotate:360 }} transition={{ duration:0.6, repeat:Infinity, ease:'linear' }}>⟳</motion.span>
              Kirilmoqda...
            </span>
          ) : '→ O\'YINGA KIRISH'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN MENU ─────────────────────────────────────────────────────────────
function MainMenu({ nickname, onSelectGame, onChangeName, connected }) {
  return (
    <motion.div style={{
      position:'fixed', inset:0, zIndex:50,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:20, gap:32,
    }}
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
    >
      <ParticlesBg />

      {/* Header */}
      <div style={{ textAlign:'center', zIndex:1 }}>
        <motion.h1
          initial={{ y:-30, opacity:0 }}
          animate={{ y:0, opacity:1 }}
          transition={{ delay:0.1, type:'spring' }}
          style={{ fontFamily:'var(--font-display)', fontSize:'clamp(20px,5vw,38px)', lineHeight:1.3 }}
          className="neon-gold"
        >TO'RT BURA & 108</motion.h1>
        <motion.p
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:0.3 }}
          style={{ color:'var(--text-dim)', fontFamily:'var(--font-ui)', fontSize:13, letterSpacing:2, marginTop:6, textTransform:'uppercase' }}
        >
          Salom, <span style={{ color:'var(--neon-cyan)' }}>{nickname}</span>
          {' '}·{' '}
          <span style={{ color: connected ? 'var(--neon-green)' : 'var(--neon-red)', fontSize:11 }}>
            {connected ? '● ONLINE' : '● ULANMOQDA...'}
          </span>
        </motion.p>
      </div>

      {/* Game Cards */}
      <div style={{ display:'flex', gap:'clamp(16px,4vw,32px)', flexWrap:'wrap', justifyContent:'center', zIndex:1 }}>
        <GameCard
          emoji="🎴"
          title="TO'RT BURA"
          subtitle="Ko'zli karta o'yini"
          description="36 ta karta · Ko'zi bilan o'ynang · 2 yoki 4 kishi"
          color="var(--neon-gold)"
          delay={0.2}
          onClick={() => onSelectGame('bura')}
        />
        <GameCard
          emoji="🔥"
          title="108"
          subtitle="Uno uslubidagi o'yin"
          description="36 ta karta · Maxsus effektlar · 2-6 kishi"
          color="var(--neon-purple)"
          delay={0.35}
          onClick={() => onSelectGame('108')}
        />
      </div>

      <motion.button
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        transition={{ delay:0.5 }}
        className="btn-neon btn-ghost"
        style={{ padding:'10px 24px', fontSize:13, zIndex:1 }}
        onClick={onChangeName}
      >✏ Ismni o'zgartirish</motion.button>
    </motion.div>
  );
}

function GameCard({ emoji, title, subtitle, description, color, delay, onClick }) {
  return (
    <motion.div
      initial={{ y:40, opacity:0, scale:0.9 }}
      animate={{ y:0, opacity:1, scale:1 }}
      transition={{ delay, type:'spring', stiffness:150, damping:18 }}
      whileHover={{ y:-8, scale:1.03 }}
      whileTap={{ scale:0.97 }}
      onClick={onClick}
      style={{
        width:'clamp(200px,42vw,280px)',
        background:'linear-gradient(135deg, rgba(10,22,40,0.9), rgba(5,12,25,0.95))',
        border:`1.5px solid ${color}44`,
        borderRadius:'var(--r-xl)',
        padding:'clamp(20px,4vw,32px)',
        cursor:'pointer',
        position:'relative',
        overflow:'hidden',
        boxShadow:`0 8px 40px ${color}18, inset 0 1px 0 ${color}22`,
        backdropFilter:'blur(20px)',
        userSelect:'none',
      }}
    >
      {/* Shine effect */}
      <div style={{
        position:'absolute', inset:0, borderRadius:'var(--r-xl)',
        background:`radial-gradient(ellipse at 30% 30%, ${color}11, transparent 70%)`,
        pointerEvents:'none',
      }} />
      <motion.div
        animate={{ opacity:[0.3,0.8,0.3] }}
        transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
        style={{
          position:'absolute', top:0, left:0, right:0, height:'1px',
          background:`linear-gradient(90deg, transparent, ${color}88, transparent)`,
        }}
      />

      <div style={{ fontSize:48, marginBottom:16, filter:`drop-shadow(0 0 15px ${color}88)` }}>{emoji}</div>
      <h3 style={{
        fontFamily:'var(--font-display)', fontSize:'clamp(14px,3vw,20px)',
        color, marginBottom:6,
        textShadow:`0 0 15px ${color}66`,
      }}>{title}</h3>
      <p style={{ fontFamily:'var(--font-ui)', fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:8, fontWeight:600 }}>{subtitle}</p>
      <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-dim)', lineHeight:1.5 }}>{description}</p>

      <motion.div
        style={{
          marginTop:20, padding:'10px 16px', borderRadius:'var(--r-sm)',
          background:`${color}18`, border:`1px solid ${color}33`,
          fontFamily:'var(--font-ui)', fontSize:13, fontWeight:700,
          color, letterSpacing:1, textAlign:'center', textTransform:'uppercase',
        }}
        whileHover={{ background:`${color}28` }}
      >O'YNASH →</motion.div>
    </motion.div>
  );
}

// ─── GAME MODE SELECT ──────────────────────────────────────────────────────
function GameModeSelect({ gameMode, onSelectMode, onBack }) {
  const isBura = gameMode === 'bura';
  return (
    <motion.div style={{
      position:'fixed', inset:0, zIndex:60,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:20, gap:24,
    }}
      initial={{ opacity:0, x:60 }}
      animate={{ opacity:1, x:0 }}
      exit={{ opacity:0, x:-60 }}
    >
      <ParticlesBg />
      <div style={{ zIndex:1, textAlign:'center', maxWidth:500, width:'100%' }}>
        <motion.button className="btn-neon btn-ghost" style={{ padding:'8px 20px', fontSize:13, marginBottom:28 }} onClick={onBack}
          whileTap={{ scale:0.97 }}>← Orqaga</motion.button>

        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(18px,4vw,28px)', marginBottom:8 }}
          className={isBura ? 'neon-gold' : 'neon-purple'}>
          {isBura ? "🎴 TO'RT BURA" : "🔥 108"}
        </h2>
        <p style={{ color:'var(--text-dim)', fontFamily:'var(--font-ui)', fontSize:13, marginBottom:32, letterSpacing:1 }}>
          O'yin turini tanlang
        </p>

        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
          {isBura ? (
            <>
              <ModeCard icon="👥" title="2 Kishilik" sub="Tête-à-tête duel" color="var(--neon-cyan)" onClick={() => onSelectMode('2p')} />
              <ModeCard icon="👥👥" title="4 Kishilik" sub="2v2 Jamoa" color="var(--neon-gold)" onClick={() => onSelectMode('4p')} />
            </>
          ) : (
            <ModeCard icon="🃏" title="2-6 Kishi" sub="1 · 2 · 3 dastali" color="var(--neon-purple)" onClick={() => onSelectMode('multi')} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ModeCard({ icon, title, sub, color, onClick }) {
  return (
    <motion.div
      whileHover={{ scale:1.04, y:-6 }}
      whileTap={{ scale:0.97 }}
      onClick={onClick}
      style={{
        width:'clamp(160px,38vw,210px)', padding:'28px 20px',
        background:'linear-gradient(135deg, rgba(10,22,40,0.9), rgba(5,12,25,0.95))',
        border:`1.5px solid ${color}44`, borderRadius:'var(--r-xl)',
        cursor:'pointer', textAlign:'center',
        boxShadow:`0 6px 30px ${color}15`,
      }}
    >
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <h3 style={{ fontFamily:'var(--font-ui)', fontSize:18, fontWeight:700, color, marginBottom:6 }}>{title}</h3>
      <p style={{ color:'var(--text-dim)', fontSize:12, fontFamily:'var(--font-body)' }}>{sub}</p>
    </motion.div>
  );
}

// ─── ROOM SCREEN ───────────────────────────────────────────────────────────
function RoomScreen({ gameMode, gameType, socket, nickname, onBack, onEnterLobby, toast }) {
  const [view, setView] = useState('menu'); // 'menu'|'create'|'join'
  const [joinCode, setJoinCode] = useState('');
  const [deckCount, setDeckCount] = useState(1);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const onCreated = ({ roomId, room }) => { setCreating(false); onEnterLobby(roomId, room, true); };
    const onJoined  = ({ roomId, room }) => { setJoining(false);  onEnterLobby(roomId, room, false); };
    const onJoinErr = ({ msg }) => { setJoining(false); toast(msg, 'error'); };
    const onErr     = ({ msg }) => { setCreating(false); setJoining(false); toast(msg, 'error'); };

    socket.on('roomCreated', onCreated);
    socket.on('roomJoined', onJoined);
    socket.on('joinError', onJoinErr);
    socket.on('error', onErr);
    return () => { socket.off('roomCreated',onCreated); socket.off('roomJoined',onJoined); socket.off('joinError',onJoinErr); socket.off('error',onErr); };
  }, [socket]);

  const handleCreate = () => {
    if (!socket) return;
    setCreating(true);
    socket.emit('createRoom', { gameMode, gameType, deckCount });
  };

  const handleJoin = () => {
    const code = joinCode.trim();
    if (code.length !== 6) { toast("6 raqamli kod kiriting", 'warn'); return; }
    if (!socket) return;
    setJoining(true);
    socket.emit('joinRoom', { roomId: code });
  };

  const color = gameMode === 'bura' ? 'var(--neon-gold)' : 'var(--neon-purple)';

  return (
    <motion.div style={{
      position:'fixed', inset:0, zIndex:65,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:20,
    }}
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      exit={{ opacity:0 }}
    >
      <ParticlesBg />
      <div style={{ zIndex:1, width:'100%', maxWidth:440 }}>
        <motion.button className="btn-neon btn-ghost" style={{ padding:'8px 20px', fontSize:13, marginBottom:28 }} onClick={onBack}
          whileTap={{ scale:0.97 }}>← Orqaga</motion.button>

        <AnimatePresence mode="wait">
          {view === 'menu' && (
            <motion.div key="menu" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(16px,4vw,24px)', color, marginBottom:8, textAlign:'center' }}>
                {gameMode === 'bura' ? "TO'RT BURA" : "108"} — {gameType === '4p' ? '4 Kishi' : gameType === '2p' ? '2 Kishi' : '2-6 Kishi'}
              </h2>
              <p style={{ color:'var(--text-dim)', textAlign:'center', marginBottom:32, fontFamily:'var(--font-ui)', fontSize:13, letterSpacing:1 }}>
                Qanday qilasiz?
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <motion.button className="btn-neon btn-gold" style={{ padding:'18px', fontSize:16 }}
                  onClick={() => setView('create')} whileTap={{ scale:0.97 }}>
                  🏠 Xona yaratish
                </motion.button>
                <motion.button className="btn-neon btn-cyan" style={{ padding:'18px', fontSize:16 }}
                  onClick={() => setView('join')} whileTap={{ scale:0.97 }}>
                  🔑 Xonaga qo'shilish
                </motion.button>
              </div>
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div key="create" initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-40 }}>
              <div className="glass" style={{ borderRadius:'var(--r-xl)', padding:'clamp(24px,5vw,40px)', border:`1px solid ${color}33` }}>
                <h3 style={{ fontFamily:'var(--font-ui)', fontSize:20, fontWeight:700, color, marginBottom:24, textAlign:'center', letterSpacing:2, textTransform:'uppercase' }}>
                  Xona Yaratish
                </h3>

                {gameMode === '108' && (
                  <div style={{ marginBottom:24 }}>
                    <p style={{ color:'var(--text-dim)', fontFamily:'var(--font-ui)', fontSize:13, marginBottom:12, letterSpacing:1 }}>DASTA SONI:</p>
                    <div style={{ display:'flex', gap:10 }}>
                      {[1,2,3].map(n => (
                        <motion.button key={n} whileTap={{ scale:0.95 }}
                          style={{
                            flex:1, padding:'12px', borderRadius:'var(--r-sm)', cursor:'pointer', border:'none',
                            background: deckCount === n ? 'linear-gradient(135deg, var(--neon-purple), #8b00cc)' : 'rgba(10,22,40,0.8)',
                            border: `1.5px solid ${deckCount===n?'var(--neon-purple)':'rgba(200,75,255,0.2)'}`,
                            color: deckCount === n ? 'white' : 'var(--text-dim)',
                            fontFamily:'var(--font-ui)', fontWeight:700, fontSize:16,
                            transition:'all 0.2s',
                          }}
                          onClick={() => setDeckCount(n)}
                        >{n}</motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <motion.button className="btn-neon btn-gold" style={{ width:'100%', padding:'16px', fontSize:16 }}
                  onClick={handleCreate} disabled={creating} whileTap={{ scale:0.97 }}>
                  {creating ? '⟳ Yaratilmoqda...' : '🚀 Xona Yaratish'}
                </motion.button>
                <button className="btn-neon btn-ghost" style={{ width:'100%', padding:'12px', fontSize:14, marginTop:10 }}
                  onClick={() => setView('menu')}>Bekor qilish</button>
              </div>
            </motion.div>
          )}

          {view === 'join' && (
            <motion.div key="join" initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-40 }}>
              <div className="glass" style={{ borderRadius:'var(--r-xl)', padding:'clamp(24px,5vw,40px)', border:`1px solid ${color}33` }}>
                <h3 style={{ fontFamily:'var(--font-ui)', fontSize:20, fontWeight:700, color, marginBottom:24, textAlign:'center', letterSpacing:2, textTransform:'uppercase' }}>
                  Xonaga Qo'shilish
                </h3>
                <input
                  className="input-neon"
                  style={{ width:'100%', padding:'16px 20px', textAlign:'center', fontSize:28, letterSpacing:8, marginBottom:16 }}
                  placeholder="000000"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  maxLength={6}
                  inputMode="numeric"
                />
                <motion.button className="btn-neon btn-cyan" style={{ width:'100%', padding:'16px', fontSize:16 }}
                  onClick={handleJoin} disabled={joining} whileTap={{ scale:0.97 }}>
                  {joining ? '⟳ Qo\'shilmoqda...' : '🔑 Qo\'shilish'}
                </motion.button>
                <button className="btn-neon btn-ghost" style={{ width:'100%', padding:'12px', fontSize:14, marginTop:10 }}
                  onClick={() => setView('menu')}>Bekor qilish</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── LOBBY SCREEN ─────────────────────────────────────────────────────────
function LobbyScreen({ room, roomId, socket, nickname, isHost, onGameStart, onLeave, toast }) {
  const [chat, setChat] = useState(room?.chat || []);
  const [typingUsers, setTypingUsers] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(room);
  const chatEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  const color = currentRoom?.gameMode === 'bura' ? 'var(--neon-gold)' : 'var(--neon-purple)';
  const mySocketId = socket?.id;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chat]);

  useEffect(() => {
    if (!socket) return;
    const onUpdate     = ({ room: r }) => { setCurrentRoom(r); AudioEngine.join(); };
    const onJoined     = ({ nickname: n }) => toast(`${n} qo'shildi!`, 'success');
    const onLeft       = ({ nickname: n, room: r }) => { setCurrentRoom(r); toast(`${n} chiqib ketdi`, 'warn'); };
    const onChat       = (msg) => { setChat(c => [...c.slice(-49), msg]); AudioEngine.tick(); };
    const onTyping     = ({ nickname: n }) => {
      setTypingUsers(u => [...new Set([...u, n])]);
      setTimeout(() => setTypingUsers(u => u.filter(x => x !== n)), 2000);
    };
    const onGameStart  = () => { onGameStart(); };

    socket.on('roomUpdate', onUpdate);
    socket.on('playerJoined', onJoined);
    socket.on('playerLeft', onLeft);
    socket.on('chatMessage', onChat);
    socket.on('typing', onTyping);
    socket.on('gameStarted', onGameStart);
    return () => {
      socket.off('roomUpdate',onUpdate); socket.off('playerJoined',onJoined);
      socket.off('playerLeft',onLeft); socket.off('chatMessage',onChat);
      socket.off('typing',onTyping); socket.off('gameStarted',onGameStart);
    };
  }, [socket]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit('chatMessage', { roomId, text: chatInput });
    setChatInput('');
  };

  const handleTyping = () => {
    socket.emit('typing', { roomId });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {}, 1500);
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(roomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("Kod nusxalandi!", 'success');
  };

  const handleStart = () => {
    if (currentRoom.players.length < currentRoom.minPlayers) {
      toast(`Kamida ${currentRoom.minPlayers} ta o'yinchi kerak!`, 'warn');
      return;
    }
    socket.emit('startGame', { roomId });
  };

  const slots = Array.from({ length: currentRoom?.maxPlayers || 2 });

  return (
    <motion.div style={{
      position:'fixed', inset:0, zIndex:70,
      background:'var(--bg-deep)',
      display:'flex', flexDirection:'column',
      padding:'clamp(12px,3vw,24px)', gap:16,
      overflowY:'auto',
    }}
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
    >
      <ParticlesBg />
      <div style={{ position:'relative', zIndex:1, maxWidth:700, width:'100%', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <button className="btn-neon btn-ghost" style={{ padding:'8px 16px', fontSize:13 }} onClick={onLeave}>← Chiqish</button>
          <h2 style={{ fontFamily:'var(--font-ui)', fontSize:16, fontWeight:700, color, letterSpacing:2, textTransform:'uppercase' }}>
            {currentRoom?.gameMode === 'bura' ? "TO'RT BURA" : "108"} LOBBY
          </h2>
          <div style={{ width:80 }} />
        </div>

        {/* Room Code */}
        <motion.div className="glass" style={{
          borderRadius:'var(--r-xl)', padding:'clamp(16px,4vw,28px)',
          border:`1px solid ${color}33`, textAlign:'center', marginBottom:16,
        }}>
          <p style={{ color:'var(--text-dim)', fontFamily:'var(--font-ui)', fontSize:11, letterSpacing:3, textTransform:'uppercase', marginBottom:8 }}>
            Xona Kodi
          </p>
          <div className="room-code" style={{ marginBottom:12 }}>{roomId}</div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <motion.button className="btn-neon btn-gold" style={{ padding:'10px 20px', fontSize:13 }}
              onClick={copyCode} whileTap={{ scale:0.95 }}>
              {copied ? '✓ Nusxalandi' : '📋 Nusxalash'}
            </motion.button>
          </div>
        </motion.div>

        {/* Players */}
        <div className="glass" style={{
          borderRadius:'var(--r-xl)', padding:'clamp(16px,4vw,24px)',
          border:`1px solid ${color}33`, marginBottom:16,
        }}>
          <p style={{ color:'var(--text-dim)', fontFamily:'var(--font-ui)', fontSize:11, letterSpacing:3, textTransform:'uppercase', marginBottom:14 }}>
            O'YINCHILAR ({currentRoom?.players?.length || 0}/{currentRoom?.maxPlayers || 2})
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {slots.map((_, i) => {
              const p = currentRoom?.players?.[i];
              const isMe = p?.id === mySocketId;
              const isH = p?.id === currentRoom?.host;
              return (
                <motion.div key={i}
                  initial={{ opacity:0, x:-20 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`player-slot ${p ? 'occupied' : 'empty'}${isH ? ' host-slot' : ''}`}
                >
                  {p ? (
                    <>
                      <Avatar nickname={p.nickname} isHost={isH} isMe={isMe} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:'var(--font-ui)', fontSize:16, fontWeight:700, color: isMe ? 'var(--neon-cyan)' : 'var(--text-main)', display:'flex', alignItems:'center', gap:8 }}>
                          {p.nickname}
                          {isMe && <span style={{ fontSize:11, color:'var(--neon-cyan)', opacity:0.8 }}>(Siz)</span>}
                        </div>
                        <div style={{ fontSize:12, color: isH ? 'var(--neon-gold)' : 'var(--text-dim)', fontFamily:'var(--font-ui)' }}>
                          {isH ? '👑 Host' : '● Online'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ width:44, height:44, borderRadius:'50%', border:'2px dashed rgba(107,122,153,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, opacity:0.3 }}>?</div>
                      <div style={{ fontFamily:'var(--font-ui)', color:'var(--text-dim)', fontSize:14 }}>
                        Kutilmoqda...
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Chat */}
        <div className="glass" style={{
          borderRadius:'var(--r-xl)', padding:'clamp(14px,3vw,20px)',
          border:'1px solid rgba(245,200,66,0.15)', marginBottom:16,
        }}>
          <p style={{ color:'var(--text-dim)', fontFamily:'var(--font-ui)', fontSize:11, letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>
            CHAT
          </p>
          <div className="chat-messages" style={{ height:140, marginBottom:10 }}>
            {chat.length === 0 && (
              <p style={{ color:'var(--text-dim)', fontFamily:'var(--font-body)', fontSize:13, textAlign:'center', paddingTop:20 }}>
                Hali xabar yo'q...
              </p>
            )}
            {chat.map(m => (
              <div key={m.id} style={{ marginBottom:8, fontFamily:'var(--font-body)', fontSize:14 }}>
                <span style={{ color: m.nickname === nickname ? 'var(--neon-cyan)' : 'var(--neon-gold)', fontWeight:700, fontFamily:'var(--font-ui)' }}>{m.nickname}: </span>
                <span style={{ color:'var(--text-main)' }}>{m.text}</span>
              </div>
            ))}
            {typingUsers.length > 0 && (
              <motion.div animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:1, repeat:Infinity }}
                style={{ color:'var(--text-dim)', fontFamily:'var(--font-body)', fontSize:12, fontStyle:'italic' }}>
                {typingUsers.join(', ')} yozmoqda...
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input className="input-neon" style={{ flex:1, padding:'10px 14px', fontSize:14 }}
              placeholder="Xabar yozing..."
              value={chatInput}
              onChange={e => { setChatInput(e.target.value); handleTyping(); }}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              maxLength={200}
            />
            <motion.button className="btn-neon btn-cyan" style={{ padding:'10px 16px', fontSize:14 }}
              onClick={sendChat} whileTap={{ scale:0.95 }}>→</motion.button>
          </div>
        </div>

        {/* Start button */}
        {isHost && (
          <motion.button
            className="btn-neon btn-gold"
            style={{ width:'100%', padding:'18px', fontSize:18, borderRadius:'var(--r-lg)' }}
            onClick={handleStart}
            whileTap={{ scale:0.97 }}
            animate={{ boxShadow: ['0 4px 20px rgba(245,200,66,0.4)', '0 6px 35px rgba(245,200,66,0.7)', '0 4px 20px rgba(245,200,66,0.4)'] }}
            transition={{ duration:2, repeat:Infinity }}
          >
            🚀 O'YINNI BOSHLASH ({currentRoom?.players?.length || 0}/{currentRoom?.minPlayers || 2})
          </motion.button>
        )}
        {!isHost && (
          <div style={{ textAlign:'center', color:'var(--text-dim)', fontFamily:'var(--font-ui)', fontSize:14, padding:16 }}>
            ⏳ Host o'yinni boshlaguncha kuting...
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── BURA GAME SCREEN ─────────────────────────────────────────────────────
function BuraGameScreen({ socket, roomId, room, nickname, onGameOver, onLeave, toast }) {
  const [gameState, setGameState]     = useState(null);
  const [myHand, setMyHand]           = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [lastTrick, setLastTrick]     = useState(null);
  const [showTrick, setShowTrick]     = useState(false);
  const [ping, setPing]               = useState(null);
  const pingRef = useRef(null);

  const myId = socket?.id;
  const isMyTurn = gameState?.currentPlayer === myId;

  useEffect(() => {
    if (!socket) return;
    socket.emit('ping');
    pingRef.current = setInterval(() => {
      const t = Date.now();
      socket.emit('ping');
      socket.once('pong', () => setPing(Date.now() - t));
    }, 5000);

    const onGameState = (gs) => setGameState(gs);
    const onDeal      = ({ hand }) => setMyHand(hand);
    const onHandUpd   = ({ hand }) => setMyHand(hand);
    const onTrick     = (data) => {
      setLastTrick(data);
      setShowTrick(true);
      setTimeout(() => setShowTrick(false), 2200);
    };
    const onOver      = (data) => { AudioEngine.win(); onGameOver(data); };
    const onPaused    = ({ reason }) => toast(reason, 'warn');
    const onMoveErr   = ({ msg }) => { AudioEngine.error(); toast(msg, 'error'); };

    socket.on('gameState', onGameState);
    socket.on('dealCards', onDeal);
    socket.on('handUpdate', onHandUpd);
    socket.on('trickComplete', onTrick);
    socket.on('gameOver', onOver);
    socket.on('gamePaused', onPaused);
    socket.on('moveError', onMoveErr);

    return () => {
      socket.off('gameState',onGameState); socket.off('dealCards',onDeal);
      socket.off('handUpdate',onHandUpd); socket.off('trickComplete',onTrick);
      socket.off('gameOver',onOver); socket.off('gamePaused',onPaused);
      socket.off('moveError',onMoveErr);
      clearInterval(pingRef.current);
    };
  }, [socket]);

  const handleCardClick = (card) => {
    if (!isMyTurn) { toast("Sizning navbatingiz emas!", 'warn'); return; }
    if (selectedCard?.id === card.id) {
      // Double tap = play
      socket.emit('buraPlayCard', { roomId, cardId: card.id });
      AudioEngine.cardPlay();
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const handlePlaySelected = () => {
    if (!selectedCard || !isMyTurn) return;
    socket.emit('buraPlayCard', { roomId, cardId: selectedCard.id });
    AudioEngine.cardPlay();
    setSelectedCard(null);
  };

  const players = room?.players || [];
  const myIdx = players.findIndex(p => p.id === myId);

  // Position players around table
  const playerPositions = useMemo(() => {
    const count = players.length;
    if (count === 2) return [
      { label:'bottom', rotate:0 },
      { label:'top', rotate:180 },
    ];
    return [
      { label:'bottom', rotate:0 },
      { label:'right', rotate:270 },
      { label:'top', rotate:180 },
      { label:'left', rotate:90 },
    ];
  }, [players.length]);

  return (
    <div style={{ position:'fixed', inset:0, background:'var(--bg-deep)', overflow:'hidden' }}>
      <ParticlesBg />

      {/* Status bar */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:20,
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'8px 16px',
        background:'rgba(2,4,8,0.8)', backdropFilter:'blur(10px)',
        borderBottom:'1px solid rgba(245,200,66,0.1)',
      }}>
        <button className="btn-neon btn-ghost" style={{ padding:'6px 12px', fontSize:12 }} onClick={onLeave}>✕</button>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          {gameState?.trumpSuit && (
            <div className="trump-indicator score-badge" style={{ display:'flex', gap:6, alignItems:'center' }}>
              <span style={{ fontSize:11, color:'var(--text-dim)', fontFamily:'var(--font-ui)', letterSpacing:1 }}>KO'Z:</span>
              <span style={{ fontSize:20, color: SUIT_COLORS[gameState.trumpSuit] }}>{SUITS[gameState.trumpSuit]}</span>
            </div>
          )}
          {gameState?.teamScores && (
            <div className="score-badge">
              <span style={{ fontFamily:'var(--font-ui)', fontSize:13, color:'var(--neon-cyan)' }}>
                T1: {gameState.teamScores.team1} · T2: {gameState.teamScores.team2}
              </span>
            </div>
          )}
          {gameState?.scores && !gameState.teamScores && (
            <div className="score-badge">
              <span style={{ fontFamily:'var(--font-ui)', fontSize:13, color:'var(--neon-gold)' }}>
                {players.map(p => `${p.nickname.slice(0,6)}: ${gameState.scores[p.id]||0}`).join(' · ')}
              </span>
            </div>
          )}
          {ping && <span style={{ fontSize:11, color: ping<100?'var(--neon-green)':ping<300?'var(--neon-gold)':'var(--neon-red)', fontFamily:'var(--font-ui)' }}>{ping}ms</span>}
        </div>
        <div style={{ fontSize:12, color:'var(--text-dim)', fontFamily:'var(--font-ui)' }}>
          🃏 {gameState?.deckCount || 0}
        </div>
      </div>

      {/* Casino Table */}
      <div className="felt-table" style={{
        position:'absolute',
        top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        width:'min(90vw, 580px)',
        height:'min(70vw, 440px)',
        borderRadius:'50%',
        zIndex:5,
      }}>
        {/* Current trick in center */}
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          display:'flex', gap:8, alignItems:'center', justifyContent:'center',
          zIndex:10,
        }}>
          <AnimatePresence>
            {gameState?.currentTrick?.map((t, i) => (
              <motion.div key={t.card.id}
                initial={{ scale:0, rotate: -20 + i * 10, y:-30 }}
                animate={{ scale:1, rotate: -8 + i * 8, y:0 }}
                style={{ position:'relative' }}
              >
                <PlayingCard card={t.card} size="md" isTrump={t.card.suit === gameState?.trumpSuit} />
                <div style={{
                  position:'absolute', bottom:-20, left:'50%', transform:'translateX(-50%)',
                  fontSize:10, color:'var(--text-dim)', fontFamily:'var(--font-ui)',
                  whiteSpace:'nowrap',
                }}>
                  {players.find(p => p.id === t.playerId)?.nickname?.slice(0,8)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Trump card (deck) */}
        {gameState?.trumpCard && gameState?.deckCount > 0 && (
          <div style={{ position:'absolute', right:20, bottom:20, zIndex:8 }}>
            <div style={{ position:'relative' }}>
              <PlayingCard card={null} faceDown size="sm" style={{ position:'absolute', top:0, left:3 }} />
              <PlayingCard card={gameState.trumpCard} size="sm" isTrump style={{ transform:'rotate(90deg)', marginTop:10 }} />
              <div style={{ position:'absolute', top:-18, left:'50%', transform:'translateX(-50%)',
                fontSize:11, color:'var(--neon-gold)', fontFamily:'var(--font-ui)', whiteSpace:'nowrap' }}>
                {gameState.deckCount} 🃏
              </div>
            </div>
          </div>
        )}

        {/* Opponent hand counts */}
        {players.map((p, idx) => {
          if (p.id === myId) return null;
          const count = gameState?.handCounts?.[p.id] || 0;
          const isActive = gameState?.currentPlayer === p.id;
          return (
            <div key={p.id} style={{
              position:'absolute',
              ...(idx === 0 ? { top:12, left:'50%', transform:'translateX(-50%)' } :
                 idx === 1 ? { right:12, top:'50%', transform:'translateY(-50%)' } :
                 idx === 2 ? { bottom:12, left:'50%', transform:'translateX(-50%)' } :
                             { left:12, top:'50%', transform:'translateY(-50%)' }),
              zIndex:8,
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            }}>
              <div style={{ position:'relative' }}>
                <Avatar nickname={p.nickname} size={36} isMe={false} />
                {isActive && (
                  <motion.div
                    animate={{ opacity:[0,1,0], scale:[0.8,1.2,0.8] }}
                    transition={{ duration:0.8, repeat:Infinity }}
                    style={{
                      position:'absolute', top:-4, right:-4,
                      width:12, height:12, borderRadius:'50%',
                      background:'var(--neon-cyan)',
                      boxShadow:'0 0 8px var(--neon-cyan)',
                    }}
                  />
                )}
              </div>
              <span style={{ fontFamily:'var(--font-ui)', fontSize:12, color: isActive?'var(--neon-cyan)':'var(--text-dim)' }}>
                {p.nickname.slice(0,8)} ({count})
              </span>
              <div style={{ display:'flex', gap:2 }}>
                {Array.from({length:Math.min(count,7)}).map((_,ci) => (
                  <PlayingCard key={ci} card={null} faceDown size="xs" style={{ transform:'rotate(5deg)' }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* My hand at bottom */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:20,
        padding:'clamp(8px,2vw,14px) 8px',
        background:'linear-gradient(to top, rgba(2,4,8,0.95), rgba(2,4,8,0.7), transparent)',
      }}>
        {/* Current player indicator */}
        <div style={{ textAlign:'center', marginBottom:8 }}>
          {isMyTurn ? (
            <motion.div className="my-turn-glow"
              style={{
                display:'inline-block', padding:'6px 20px', borderRadius:'999px',
                background:'rgba(0,229,255,0.1)', border:'1px solid var(--neon-cyan)',
                fontFamily:'var(--font-ui)', fontSize:13, fontWeight:700, color:'var(--neon-cyan)',
                letterSpacing:1,
              }}
              animate={{ scale:[1,1.03,1] }}
              transition={{ duration:1, repeat:Infinity }}
            >⚡ SIZNING NAVBATINGIZ</motion.div>
          ) : (
            <div style={{ fontFamily:'var(--font-ui)', fontSize:12, color:'var(--text-dim)', letterSpacing:1 }}>
              {players.find(p=>p.id===gameState?.currentPlayer)?.nickname}'ning navbati...
            </div>
          )}
        </div>

        {/* Hand */}
        <div style={{
          display:'flex', justifyContent:'center', alignItems:'flex-end',
          gap: myHand.length > 8 ? '-8px' : '4px',
          overflowX:'auto', padding:'0 12px 8px',
        }}>
          {myHand.map((card, i) => (
            <motion.div key={card.id}
              initial={{ y:80, rotate:10, opacity:0 }}
              animate={{ y:0, rotate: (i - myHand.length/2) * 2, opacity:1 }}
              transition={{ delay: i * 0.05, type:'spring', stiffness:200, damping:18 }}
              style={{ marginLeft: myHand.length > 6 ? -8 : 0 }}
            >
              <PlayingCard
                card={card}
                selected={selectedCard?.id === card.id}
                playable={isMyTurn}
                isTrump={card.suit === gameState?.trumpSuit}
                onClick={() => handleCardClick(card)}
                size={window.innerWidth < 480 ? 'sm' : 'md'}
              />
            </motion.div>
          ))}
        </div>

        {/* Play button */}
        <AnimatePresence>
          {selectedCard && isMyTurn && (
            <motion.div
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:20 }}
              style={{ display:'flex', justifyContent:'center', gap:12, marginTop:8 }}
            >
              <motion.button className="btn-neon btn-gold" style={{ padding:'12px 32px', fontSize:15 }}
                onClick={handlePlaySelected} whileTap={{ scale:0.97 }}>
                ▶ TASHLASH
              </motion.button>
              <button className="btn-neon btn-ghost" style={{ padding:'12px 20px', fontSize:15 }}
                onClick={() => setSelectedCard(null)}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trick result popup */}
      <AnimatePresence>
        {showTrick && lastTrick && (
          <motion.div
            initial={{ opacity:0, scale:0.8, y:-30 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.9, y:-20 }}
            style={{
              position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)',
              zIndex:50, background:'rgba(10,22,40,0.95)',
              border:'1px solid var(--neon-gold)',
              borderRadius:'var(--r-lg)', padding:'16px 28px',
              textAlign:'center', backdropFilter:'blur(20px)',
              boxShadow:'0 0 30px rgba(245,200,66,0.4)',
            }}
          >
            <p style={{ fontFamily:'var(--font-ui)', fontSize:13, color:'var(--text-dim)', marginBottom:4 }}>HIYLA OLDI</p>
            <p style={{ fontFamily:'var(--font-ui)', fontSize:18, fontWeight:700, color:'var(--neon-gold)' }}>
              {players.find(p=>p.id===lastTrick.winner)?.nickname}
            </p>
            <p style={{ fontFamily:'var(--font-ui)', fontSize:14, color:'var(--neon-cyan)', marginTop:4 }}>
              +{lastTrick.points} ochko
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 108 GAME SCREEN ──────────────────────────────────────────────────────
function Game108Screen({ socket, roomId, room, nickname, onGameOver, onLeave, toast }) {
  const [gameState, setGameState]   = useState(null);
  const [myHand, setMyHand]         = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [pendingQCard, setPendingQCard] = useState(null);

  const myId = socket?.id;
  const isMyTurn = gameState?.currentPlayer === myId;
  const players = room?.players || [];

  useEffect(() => {
    if (!socket) return;
    const onGS  = (gs) => setGameState(gs);
    const onDeal= ({ hand }) => setMyHand(hand);
    const onHand= ({ hand }) => setMyHand(hand);
    const onOver= (data) => { AudioEngine.win(); onGameOver(data); };
    const onPause=({ reason }) => toast(reason, 'warn');
    const onErr = ({ msg }) => { AudioEngine.error(); toast(msg, 'error'); };

    socket.on('gameState', onGS);
    socket.on('dealCards', onDeal);
    socket.on('handUpdate', onHand);
    socket.on('gameOver', onOver);
    socket.on('gamePaused', onPause);
    socket.on('moveError', onErr);
    return () => {
      socket.off('gameState',onGS); socket.off('dealCards',onDeal);
      socket.off('handUpdate',onHand); socket.off('gameOver',onOver);
      socket.off('gamePaused',onPause); socket.off('moveError',onErr);
    };
  }, [socket]);

  const canPlayCard = (card) => {
    if (!isMyTurn || !gameState) return false;
    const { currentSuit, currentRank, pendingDraw } = gameState;
    if (pendingDraw > 0) {
      return card.rank === '6' || card.rank === '7' || (card.rank === 'K' && card.suit === 'spades');
    }
    if (card.rank === '8') return card.suit === currentSuit;
    return card.suit === currentSuit || card.rank === currentRank;
  };

  const handleCardClick = (card) => {
    if (!isMyTurn) { toast("Sizning navbatingiz emas!", 'warn'); return; }
    if (!canPlayCard(card)) { toast("Bu kartani tashlash mumkin emas!", 'warn'); AudioEngine.error(); return; }

    if (card.rank === 'Q') {
      setPendingQCard(card);
      setShowSuitPicker(true);
      return;
    }
    socket.emit('108PlayCard', { roomId, cardId: card.id });
    AudioEngine.cardPlay();
    setSelectedCard(null);
  };

  const handleSuitPick = (suit) => {
    socket.emit('108PlayCard', { roomId, cardId: pendingQCard.id, chosenSuit: suit });
    AudioEngine.cardPlay();
    setShowSuitPicker(false);
    setPendingQCard(null);
  };

  const handleDraw = () => {
    if (!isMyTurn) return;
    socket.emit('108DrawCard', { roomId });
    AudioEngine.cardDraw();
  };

  const topCard = gameState?.topCard;
  const effectiveSuit = gameState?.suitRequest || gameState?.currentSuit;

  return (
    <div style={{ position:'fixed', inset:0, background:'var(--bg-deep)', overflow:'hidden' }}>
      <ParticlesBg />

      {/* Status bar */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:20,
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'8px 16px',
        background:'rgba(2,4,8,0.8)', backdropFilter:'blur(10px)',
        borderBottom:'1px solid rgba(200,75,255,0.15)',
      }}>
        <button className="btn-neon btn-ghost" style={{ padding:'6px 12px', fontSize:12 }} onClick={onLeave}>✕</button>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {/* Direction */}
          <span className="direction-arrow" style={{ fontSize:18, color:'var(--neon-purple)' }}>
            {gameState?.direction === 1 ? '↻' : '↺'}
          </span>
          {/* Deck count */}
          <span style={{ fontFamily:'var(--font-ui)', fontSize:12, color:'var(--text-dim)' }}>🃏{gameState?.deckCount||0}</span>
          {/* Pending draw */}
          {gameState?.pendingDraw > 0 && (
            <div className="pending-draw-badge">+{gameState.pendingDraw} OLISH</div>
          )}
        </div>
        <div style={{ fontSize:12, color:'var(--text-dim)', fontFamily:'var(--font-ui)' }}>108</div>
      </div>

      {/* Main game area */}
      <div style={{
        position:'absolute', top:52, left:0, right:0, bottom:0,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:16, padding:16,
      }}>
        {/* Other players */}
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center', zIndex:10 }}>
          {players.map(p => {
            if (p.id === myId) return null;
            const count = gameState?.handCounts?.[p.id] || 0;
            const isActive = gameState?.currentPlayer === p.id;
            return (
              <motion.div key={p.id}
                animate={isActive ? { scale:[1,1.05,1] } : {}}
                transition={{ duration:0.8, repeat:Infinity }}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                  padding:'10px 16px',
                  background: isActive ? 'rgba(200,75,255,0.1)' : 'rgba(10,22,40,0.6)',
                  border: `1px solid ${isActive ? 'var(--neon-purple)' : 'rgba(200,75,255,0.15)'}`,
                  borderRadius:'var(--r-md)',
                  boxShadow: isActive ? '0 0 20px rgba(200,75,255,0.4)' : 'none',
                  transition:'all 0.3s',
                }}
              >
                <Avatar nickname={p.nickname} size={36} />
                <span style={{ fontFamily:'var(--font-ui)', fontSize:12, color: isActive?'var(--neon-purple)':'var(--text-dim)', fontWeight: isActive?700:400 }}>
                  {p.nickname.slice(0,8)}
                </span>
                <span style={{ fontFamily:'var(--font-ui)', fontSize:13, color:'var(--neon-gold)', fontWeight:700 }}>{count} 🃏</span>
              </motion.div>
            );
          })}
        </div>

        {/* Center: Draw pile + Discard pile */}
        <div style={{ display:'flex', gap:40, alignItems:'center', justifyContent:'center' }}>
          {/* Draw pile */}
          <motion.div
            onClick={isMyTurn ? handleDraw : undefined}
            whileHover={isMyTurn ? { scale:1.08 } : {}}
            whileTap={isMyTurn ? { scale:0.95 } : {}}
            style={{
              cursor: isMyTurn ? 'pointer' : 'default',
              position:'relative',
              filter: isMyTurn ? 'drop-shadow(0 0 12px rgba(200,75,255,0.7))' : 'none',
            }}
          >
            <PlayingCard card={null} faceDown size="lg" />
            {gameState?.pendingDraw > 0 && isMyTurn && (
              <div className="pending-draw-badge" style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap' }}>
                +{gameState.pendingDraw}
              </div>
            )}
            {isMyTurn && (
              <div style={{ textAlign:'center', marginTop:8, fontFamily:'var(--font-ui)', fontSize:12, color:'var(--neon-purple)', letterSpacing:1 }}>
                OLISH
              </div>
            )}
          </motion.div>

          {/* Discard pile / top card */}
          <div style={{ position:'relative' }}>
            {topCard && (
              <motion.div
                key={topCard.id}
                initial={{ scale:1.3, rotate:-15 }}
                animate={{ scale:1, rotate:0 }}
                transition={{ type:'spring', stiffness:300, damping:20 }}
              >
                <PlayingCard card={topCard} size="lg" />
              </motion.div>
            )}
            {/* Suit request indicator */}
            {gameState?.suitRequest && (
              <motion.div
                initial={{ scale:0 }}
                animate={{ scale:1 }}
                style={{
                  position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)',
                  background:'rgba(200,75,255,0.2)', border:'1px solid var(--neon-purple)',
                  borderRadius:'999px', padding:'3px 10px',
                  fontFamily:'var(--font-ui)', fontSize:12, color:'var(--neon-purple)',
                  whiteSpace:'nowrap',
                }}
              >
                {SUITS[gameState.suitRequest]} {SUIT_NAMES_UZ[gameState.suitRequest]}
              </motion.div>
            )}
          </div>
        </div>

        {/* Turn indicator */}
        <div style={{ textAlign:'center' }}>
          {isMyTurn ? (
            <motion.div
              animate={{ scale:[1,1.04,1] }}
              transition={{ duration:1, repeat:Infinity }}
              style={{
                display:'inline-block', padding:'8px 24px', borderRadius:'999px',
                background:'rgba(200,75,255,0.12)', border:'1px solid var(--neon-purple)',
                fontFamily:'var(--font-ui)', fontSize:13, fontWeight:700, color:'var(--neon-purple)',
                letterSpacing:1, boxShadow:'0 0 20px rgba(200,75,255,0.4)',
              }}
            >⚡ SIZNING NAVBATINGIZ</motion.div>
          ) : (
            <div style={{ fontFamily:'var(--font-ui)', fontSize:12, color:'var(--text-dim)' }}>
              {players.find(p=>p.id===gameState?.currentPlayer)?.nickname}'ning navbati...
            </div>
          )}
        </div>

        {/* My hand */}
        <div style={{
          display:'flex', justifyContent:'center', alignItems:'flex-end',
          gap:4, flexWrap:'wrap', maxWidth:'100vw', padding:'0 8px',
        }}>
          {myHand.map((card, i) => {
            const playable = canPlayCard(card);
            return (
              <motion.div key={card.id}
                initial={{ y:60, opacity:0 }}
                animate={{ y:0, opacity:1 }}
                transition={{ delay: i * 0.04, type:'spring' }}
              >
                <PlayingCard
                  card={card}
                  selected={selectedCard?.id === card.id}
                  playable={isMyTurn ? playable : undefined}
                  onClick={() => handleCardClick(card)}
                  size={window.innerWidth < 480 ? 'sm' : 'md'}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Suit Picker Modal */}
      <AnimatePresence>
        {showSuitPicker && (
          <motion.div className="game-overlay"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
          >
            <motion.div className="glass"
              initial={{ scale:0.8, opacity:0 }}
              animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.8, opacity:0 }}
              style={{
                borderRadius:'var(--r-xl)', padding:'32px 40px',
                border:'1px solid var(--neon-purple)',
                boxShadow:'0 0 40px rgba(200,75,255,0.4)',
                textAlign:'center',
              }}
            >
              <h3 style={{ fontFamily:'var(--font-ui)', fontSize:18, fontWeight:700, color:'var(--neon-purple)', marginBottom:24, letterSpacing:2 }}>
                🃏 SUIT TANLANG
              </h3>
              <div style={{ display:'flex', gap:16, justifyContent:'center' }}>
                {SUITS && Object.entries(SUITS).map(([suit, sym]) => (
                  <motion.div key={suit} className="suit-btn"
                    whileHover={{ scale:1.12 }}
                    whileTap={{ scale:0.95 }}
                    onClick={() => handleSuitPick(suit)}
                    style={{ color: SUIT_COLORS[suit] }}
                  >{sym}</motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── GAME OVER SCREEN ─────────────────────────────────────────────────────
function GameOverScreen({ data, players, gameMode, nickname, myId, onPlayAgain, onMainMenu }) {
  const isWinner = data?.winner === myId ||
    (data?.teams?.team1?.includes(myId) && data?.winner === 'team1') ||
    (data?.teams?.team2?.includes(myId) && data?.winner === 'team2');

  const winnerName = data?.teams
    ? (data.winner === 'team1' ? 'Jamoat 1' : 'Jamoat 2')
    : players?.find(p => p.id === data?.winner)?.nickname || 'Noma\'lum';

  return (
    <motion.div className="game-overlay" style={{ zIndex:200 }}
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
    >
      <motion.div className="glass"
        initial={{ scale:0.6, opacity:0, rotate:-5 }}
        animate={{ scale:1, opacity:1, rotate:0 }}
        transition={{ type:'spring', stiffness:200, damping:18 }}
        style={{
          borderRadius:'var(--r-xl)', padding:'clamp(28px,6vw,52px)',
          border:`2px solid ${isWinner?'var(--neon-gold)':'rgba(107,122,153,0.4)'}`,
          boxShadow: isWinner ? '0 0 60px rgba(245,200,66,0.4)' : '0 0 40px rgba(0,0,0,0.8)',
          textAlign:'center', maxWidth:420, width:'90%',
          position:'relative', overflow:'hidden',
        }}
      >
        {isWinner && (
          <motion.div
            style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, rgba(245,200,66,0.08), transparent 70%)' }}
            animate={{ opacity:[0.5,1,0.5] }}
            transition={{ duration:2, repeat:Infinity }}
          />
        )}

        <motion.div
          className="win-card"
          style={{ fontSize:64, marginBottom:16 }}
        >{isWinner ? '🏆' : '😔'}</motion.div>

        <h2 style={{
          fontFamily:'var(--font-display)', fontSize:'clamp(18px,5vw,28px)',
          color: isWinner ? 'var(--neon-gold)' : 'var(--text-dim)',
          marginBottom:8,
          textShadow: isWinner ? 'var(--shadow-neon-gold)' : 'none',
        }}>
          {isWinner ? "G'ALABA!" : "YUTQAZDINGIZ"}
        </h2>

        <p style={{ fontFamily:'var(--font-ui)', color:'var(--text-dim)', marginBottom:24, fontSize:15 }}>
          G'olib: <span style={{ color:'var(--neon-gold)', fontWeight:700 }}>{winnerName}</span>
        </p>

        {/* Scores */}
        {data?.scores && !data.teamScores && (
          <div style={{ marginBottom:28, background:'rgba(0,0,0,0.3)', borderRadius:'var(--r-md)', padding:'16px' }}>
            {players?.map(p => (
              <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontFamily:'var(--font-ui)', fontSize:14, color: p.id===myId?'var(--neon-cyan)':'var(--text-main)' }}>{p.nickname}</span>
                <span style={{ fontFamily:'var(--font-ui)', fontSize:14, color:'var(--neon-gold)', fontWeight:700 }}>{data.scores[p.id]||0}</span>
              </div>
            ))}
          </div>
        )}
        {data?.teamScores && (
          <div style={{ marginBottom:28, background:'rgba(0,0,0,0.3)', borderRadius:'var(--r-md)', padding:'16px', display:'flex', gap:20, justifyContent:'center' }}>
            <div><div style={{ color:'var(--neon-cyan)', fontFamily:'var(--font-ui)', fontSize:13 }}>JAMOA 1</div><div style={{ color:'var(--neon-gold)', fontSize:24, fontWeight:700, fontFamily:'var(--font-ui)' }}>{data.teamScores.team1}</div></div>
            <div style={{ color:'var(--text-dim)', fontFamily:'var(--font-ui)', fontSize:20, alignSelf:'center' }}>:</div>
            <div><div style={{ color:'var(--neon-purple)', fontFamily:'var(--font-ui)', fontSize:13 }}>JAMOA 2</div><div style={{ color:'var(--neon-gold)', fontSize:24, fontWeight:700, fontFamily:'var(--font-ui)' }}>{data.teamScores.team2}</div></div>
          </div>
        )}

        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <motion.button className="btn-neon btn-gold" style={{ padding:'14px 28px', fontSize:15 }}
            onClick={onPlayAgain} whileTap={{ scale:0.97 }}>🔄 Qayta o'ynash</motion.button>
          <motion.button className="btn-neon btn-ghost" style={{ padding:'14px 24px', fontSize:15 }}
            onClick={onMainMenu} whileTap={{ scale:0.97 }}>🏠 Menyu</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── DISCONNECTED OVERLAY ─────────────────────────────────────────────────
function DisconnectedOverlay({ connected }) {
  if (connected) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity:0, y:-40 }}
        animate={{ opacity:1, y:0 }}
        exit={{ opacity:0, y:-40 }}
        style={{
          position:'fixed', top:16, left:'50%', transform:'translateX(-50%)',
          background:'rgba(255,56,96,0.15)', border:'1px solid var(--neon-red)',
          borderRadius:'var(--r-sm)', padding:'10px 24px',
          fontFamily:'var(--font-ui)', fontSize:13, color:'var(--neon-red)',
          zIndex:9998, backdropFilter:'blur(10px)',
        }}
      >
        🔴 Serverga ulanishda xatolik... qayta ulanmoqda
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  // ── State ──
  const [screen, setScreen]         = useState('intro');   // intro|login|menu|modeSelect|roomSelect|lobby|buraGame|108Game|gameOver
  const [nickname, setNickname]     = useState('');
  const [gameMode, setGameMode]     = useState(null);       // 'bura'|'108'
  const [gameType, setGameType]     = useState(null);       // '2p'|'4p'|'multi'
  const [roomId, setRoomId]         = useState(null);
  const [room, setRoom]             = useState(null);
  const [isHost, setIsHost]         = useState(false);
  const [gameOverData, setGameOverData] = useState(null);

  const { toasts, show: showToast } = useToast();
  const socketRef = useRef(null);
  const [connected, setConnected]   = useState(false);

  // ── Socket init ──
  useEffect(() => {
    const s = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });
    socketRef.current = s;
    s.on('connect',    () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    return () => s.disconnect();
  }, []);

  // ── Auto-login ──
  useEffect(() => {
    if (screen !== 'login') return;
    const saved = localStorage.getItem('karta_nickname');
    if (saved) { handleLogin(saved); }
  }, [screen]);

  const socket = socketRef.current;

  // ── Handlers ──
  const handleIntroEnd = () => {
    const saved = localStorage.getItem('karta_nickname');
    setScreen(saved ? 'menu' : 'login');
    if (saved) setNickname(saved);
  };

  const handleLogin = (name) => {
    setNickname(name);
    // Register with socket when connected
    const doRegister = () => socket?.emit('register', { nickname: name });
    if (socket?.connected) doRegister();
    else socket?.once('connect', doRegister);
    setScreen('menu');
  };

  // Re-register on reconnect
  useEffect(() => {
    if (!socket || !nickname) return;
    const onConnect = () => socket.emit('register', { nickname });
    socket.on('connect', onConnect);
    return () => socket.off('connect', onConnect);
  }, [socket, nickname]);

  const handleSelectGame = (mode) => {
    setGameMode(mode);
    setScreen('modeSelect');
  };

  const handleSelectMode = (type) => {
    setGameType(type);
    setScreen('roomSelect');
  };

  const handleEnterLobby = (rid, r, hosting) => {
    setRoomId(rid);
    setRoom(r);
    setIsHost(hosting);
    setScreen('lobby');
    AudioEngine.join();
  };

  const handleGameStart = () => {
    if (gameMode === 'bura') setScreen('buraGame');
    else setScreen('108Game');
  };

  const handleLeaveRoom = () => {
    if (socket && roomId) socket.emit('leaveRoom', { roomId });
    setRoomId(null);
    setRoom(null);
    setIsHost(false);
    setScreen('menu');
  };

  const handleGameOver = (data) => {
    setGameOverData(data);
    setScreen('gameOver');
  };

  const handlePlayAgain = () => {
    if (socket && roomId) {
      socket.emit('leaveRoom', { roomId });
    }
    setRoomId(null);
    setRoom(null);
    setIsHost(false);
    setScreen('roomSelect');
  };

  const handleMainMenu = () => {
    if (socket && roomId) socket.emit('leaveRoom', { roomId });
    setRoomId(null);
    setRoom(null);
    setIsHost(false);
    setGameMode(null);
    setGameType(null);
    setGameOverData(null);
    setScreen('menu');
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ width:'100vw', height:'100vh', position:'relative', overflow:'hidden' }}>

        <ToastContainer toasts={toasts} />
        <DisconnectedOverlay connected={connected} />

        <AnimatePresence mode="wait">
          {/* INTRO */}
          {screen === 'intro' && (
            <motion.div key="intro" style={{ position:'fixed', inset:0, zIndex:999 }}>
              <IntroScreen onDone={handleIntroEnd} />
            </motion.div>
          )}

          {/* LOGIN */}
          {screen === 'login' && (
            <motion.div key="login">
              <LoginScreen onLogin={handleLogin} />
            </motion.div>
          )}

          {/* MENU */}
          {screen === 'menu' && (
            <motion.div key="menu">
              <MainMenu
                nickname={nickname}
                connected={connected}
                onSelectGame={handleSelectGame}
                onChangeName={() => { localStorage.removeItem('karta_nickname'); setScreen('login'); }}
              />
            </motion.div>
          )}

          {/* MODE SELECT */}
          {screen === 'modeSelect' && (
            <motion.div key="modeSelect">
              <GameModeSelect
                gameMode={gameMode}
                onSelectMode={handleSelectMode}
                onBack={() => setScreen('menu')}
              />
            </motion.div>
          )}

          {/* ROOM SELECT */}
          {screen === 'roomSelect' && (
            <motion.div key="roomSelect">
              <RoomScreen
                gameMode={gameMode}
                gameType={gameType}
                socket={socket}
                nickname={nickname}
                onBack={() => setScreen('modeSelect')}
                onEnterLobby={handleEnterLobby}
                toast={showToast}
              />
            </motion.div>
          )}

          {/* LOBBY */}
          {screen === 'lobby' && room && (
            <motion.div key="lobby">
              <LobbyScreen
                room={room}
                roomId={roomId}
                socket={socket}
                nickname={nickname}
                isHost={isHost}
                onGameStart={handleGameStart}
                onLeave={handleLeaveRoom}
                toast={showToast}
              />
            </motion.div>
          )}

          {/* BURA GAME */}
          {screen === 'buraGame' && (
            <motion.div key="buraGame" style={{ position:'fixed', inset:0 }}>
              <BuraGameScreen
                socket={socket}
                roomId={roomId}
                room={room}
                nickname={nickname}
                onGameOver={handleGameOver}
                onLeave={handleLeaveRoom}
                toast={showToast}
              />
            </motion.div>
          )}

          {/* 108 GAME */}
          {screen === '108Game' && (
            <motion.div key="108Game" style={{ position:'fixed', inset:0 }}>
              <Game108Screen
                socket={socket}
                roomId={roomId}
                room={room}
                nickname={nickname}
                onGameOver={handleGameOver}
                onLeave={handleLeaveRoom}
                toast={showToast}
              />
            </motion.div>
          )}

          {/* GAME OVER */}
          {screen === 'gameOver' && (
            <motion.div key="gameOver">
              <GameOverScreen
                data={gameOverData}
                players={room?.players}
                gameMode={gameMode}
                nickname={nickname}
                myId={socket?.id}
                onPlayAgain={handlePlayAgain}
                onMainMenu={handleMainMenu}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}