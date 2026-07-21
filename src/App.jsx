/**
 * ═══════════════════════════════════════════════════════════════
 *  KARTA O'YINI — ULTRA PREMIUM FRONTEND (FINAL FIXED)
 *  To'rt Bura (Kozel) + 108 — Real Multiplayer
 * ═══════════════════════════════════════════════════════════════
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
  useReducer,
} from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

// ─── ENVIRONMENT ───────────────────────────────────────────────────

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// ─── GLOBAL STYLES ────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }

  :root {
    --deep: #020408;
    --mid: #060c16;
    --surface: #0b1425;
    --surface2: #0f1e38;
    --gold: #f5c842;
    --gold2: #ffaa00;
    --cyan: #00e5ff;
    --cyan2: #00b8d4;
    --pink: #ff2d6e;
    --green: #00ff94;
    --purple: #a855f7;
    --red: #ff3b5c;
    --blue: #4488ff;
    --text: #dde8ff;
    --dim: #4a6080;
    --dimmer: #2a3a50;
    --font-d: 'Cinzel Decorative', serif;
    --font-ui: 'Orbitron', monospace;
    --font-b: 'Rajdhani', sans-serif;
  }

  html, body, #root {
    width: 100%;
    height: 100%;
    background: var(--deep);
    color: var(--text);
    font-family: var(--font-b);
    overflow: hidden;
    user-select: none;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--deep); }
  ::-webkit-scrollbar-thumb { background: var(--cyan); border-radius: 2px; }

  .glass {
    background: rgba(11, 20, 37, 0.75);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(0, 229, 255, 0.12);
  }

  @keyframes float-y {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 200%; }
  }

  @keyframes spin-slow {
    to { transform: rotate(360deg); }
  }

  @keyframes scan {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(110vh); }
  }

  @keyframes winner-flash {
    0%, 100% { box-shadow: 0 0 20px var(--gold), 0 0 40px rgba(245,200,66,0.3); }
    50% { box-shadow: 0 0 60px var(--gold), 0 0 100px var(--gold2); }
  }

  .shimmer-line {
    position: absolute;
    top: 0;
    width: 30%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
    animation: shimmer 3s infinite;
    pointer-events: none;
  }
`;

if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = GLOBAL_STYLES;
  styleElement.id = 'global-styles';
  document.head.appendChild(styleElement);
}

// ─── SOCKET SINGLETON ─────────────────────────────────────────────

let socketInstance = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
}

// ─── CONSTANTS ─────────────────────────────────────────────────────

const SUIT_SYM = Object.freeze({
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
});

const SUIT_CLR = Object.freeze({
  spades: '#b8cce8',
  hearts: '#ff3b5c',
  diamonds: '#ff3b5c',
  clubs: '#b8cce8',
});

const SUIT_LBL = Object.freeze({
  spades: 'Pik',
  hearts: 'Qoʻr',
  diamonds: 'Karo',
  clubs: 'Treff',
});

const SUIT_ORDER = Object.freeze(['spades', 'hearts', 'diamonds', 'clubs']);
const RANK_ORDER = Object.freeze(['6', '7', '8', '9', 'J', 'Q', 'K', '10', 'A']);
const BURA_POINTS = Object.freeze({ A: 11, '10': 10, K: 4, Q: 3, J: 2, 9: 0, 8: 0, 7: 0, 6: 0 });

// ─── AUDIO ENGINE ──────────────────────────────────────────────────

const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

function playTone(freq, dur, type = 'sine', vol = 0.2) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

const SFX = {
  playDeal: () => {
    [280, 320, 360, 400].forEach((f, i) => setTimeout(() => playTone(f, 0.06, 'triangle', 0.18), i * 70));
  },
  playCardPlay: () => {
    playTone(440, 0.08, 'triangle', 0.2);
    setTimeout(() => playTone(550, 0.06, 'triangle', 0.15), 50);
  },
  playCardThrow: () => playTone(220, 0.15, 'sawtooth', 0.2),
  playWin: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'sine', 0.2), i * 100));
  },
  playLose: () => {
    [400, 350, 300, 250].forEach((f, i) => setTimeout(() => playTone(f, 0.15, 'sawtooth', 0.18), i * 120));
  },
  playError: () => playTone(180, 0.3, 'sawtooth', 0.25),
  playJoin: () => {
    playTone(660, 0.12, 'sine', 0.2);
    setTimeout(() => playTone(880, 0.1, 'sine', 0.15), 120);
  },
  playButtonClick: () => playTone(800, 0.04, 'square', 0.12),
  playNotification: () => {
    playTone(880, 0.05, 'sine', 0.15);
    setTimeout(() => playTone(1100, 0.05, 'sine', 0.12), 100);
    setTimeout(() => playTone(1320, 0.08, 'sine', 0.1), 200);
  },
};

// ─── REDUCER ───────────────────────────────────────────────────────

const INITIAL_STATE = {
  screen: 'login',
  nickname: '',
  socketId: '',
  selectedGame: '',
  room: null,
  gameState: null,
  myHand: [],
  chats: [],
  typingUsers: [],
  toasts: [],
  isOnline: false,
  isConnecting: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };
    case 'SET_NICKNAME':
      return { ...state, nickname: action.payload };
    case 'SET_SOCKET_ID':
      return { ...state, socketId: action.payload };
    case 'SET_SELECTED_GAME':
      return { ...state, selectedGame: action.payload };
    case 'SET_ROOM':
      return { ...state, room: action.payload };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'SET_MY_HAND':
      return { ...state, myHand: action.payload };
    case 'SET_CHATS':
      return { ...state, chats: action.payload };
    case 'ADD_CHAT':
      return { ...state, chats: [...state.chats, action.payload] };
    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload };
    case 'RESET_GAME':
      return { ...state, room: null, gameState: null, myHand: [], chats: [], typingUsers: [] };
    case 'RESET_ALL':
      return { ...INITIAL_STATE, nickname: state.nickname };
    default:
      return state;
  }
}

// ─── TOAST CONTAINER ──────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }) {
  return createPortal(
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380 }}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              fontSize: 12,
              fontFamily: 'var(--font-ui)',
              background: t.type === 'error' ? 'rgba(255,45,110,0.15)' : 'rgba(0,229,255,0.12)',
              border: `1px solid ${t.type === 'error' ? 'var(--pink)' : 'var(--cyan)'}`,
              color: t.type === 'error' ? 'var(--pink)' : 'var(--cyan)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>{t.type === 'error' ? '⚠️' : 'ℹ️'}</span>
            <span style={{ flex: 1 }}>{t.msg}</span>
            <button
              onClick={() => onRemove(t.id)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 14 }}
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

// ─── BACKGROUND ───────────────────────────────────────────────────

const Background = memo(function Background() {
  const orbs = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: 150 + Math.random() * 300,
        color: ['rgba(0,229,255,0.04)', 'rgba(168,85,247,0.05)', 'rgba(245,200,66,0.04)', 'rgba(255,45,110,0.04)'][i % 4],
        dur: 8 + Math.random() * 10,
        delay: Math.random() * 5,
      })),
    []
  );

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 20% 10%, #050d1a 0%, #020408 60%)',
        }}
      />
      {orbs.map(o => (
        <div
          key={o.id}
          style={{
            position: 'absolute',
            left: `${o.x}%`,
            top: `${o.y}%`,
            width: o.size,
            height: o.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
            animation: `float-y ${o.dur}s ease-in-out ${o.delay}s infinite`,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.12), transparent)',
          animation: 'scan 10s linear infinite',
        }}
      />
    </div>
  );
});

// ─── CARD ─────────────────────────────────────────────────────────

const Card = memo(function Card({
  card,
  onClick,
  selected = false,
  playable = false,
  faceDown = false,
  small = false,
  trump = false,
  animDelay = 0,
  shake = false,
}) {
  const w = small ? 50 : 68;
  const h = small ? 72 : 100;

  if (faceDown) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: animDelay, type: 'spring', stiffness: 300 }}
        style={{
          width: w,
          height: h,
          borderRadius: 8,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #0a1a3a, #152040)',
          border: '1px solid rgba(0,229,255,0.2)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '80%',
            height: '80%',
            border: '1px solid rgba(0,229,255,0.1)',
            borderRadius: 4,
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(0,229,255,.04) 0, rgba(0,229,255,.04) 3px, transparent 3px, transparent 9px)',
          }}
        />
        <div className="shimmer-line" />
      </motion.div>
    );
  }

  if (!card) return null;

  const color = SUIT_CLR[card.suit];
  const sym = SUIT_SYM[card.suit];
  const isPlayable = playable && !!onClick;

  return (
    <motion.div
      onClick={() => isPlayable && onClick(card)}
      initial={{ scale: 0.7, opacity: 0, y: -20 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: selected ? -16 : 0,
        rotate: shake ? [0, -3, 3, -2, 2, 0] : 0,
      }}
      transition={{
        delay: animDelay,
        type: 'spring',
        stiffness: 350,
        damping: 28,
        rotate: { duration: 0.4 },
      }}
      whileHover={isPlayable && !selected ? { scale: 1.08, y: -8 } : {}}
      whileTap={isPlayable ? { scale: 0.92 } : {}}
      style={{
        width: w,
        height: h,
        borderRadius: 8,
        flexShrink: 0,
        background: selected
          ? 'linear-gradient(145deg, #1a3a26, #0d2418)'
          : 'linear-gradient(145deg, #f4f8ff, #e4ecff)',
        border: trump
          ? '2px solid var(--gold)'
          : selected
          ? '2.5px solid var(--green)'
          : isPlayable
          ? '2px solid rgba(0,229,255,0.6)'
          : '1px solid rgba(180,200,240,0.2)',
        boxShadow: trump
          ? '0 0 20px rgba(245,200,66,0.4), 0 4px 16px rgba(0,0,0,0.4)'
          : selected
          ? '0 0 25px rgba(0,255,148,0.5), 0 -12px 0 0 rgba(0,255,148,0.15)'
          : isPlayable
          ? '0 0 15px rgba(0,229,255,0.3), 0 4px 16px rgba(0,0,0,0.4)'
          : '0 3px 10px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: small ? '4px 5px' : '6px 8px',
        cursor: isPlayable ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ color, lineHeight: 1 }}>
        <div
          style={{
            fontSize: small ? 11 : 14,
            fontWeight: 900,
            fontFamily: 'var(--font-ui)',
          }}
        >
          {card.rank}
        </div>
        <div style={{ fontSize: small ? 10 : 13 }}>{sym}</div>
      </div>
      <div
        style={{
          textAlign: 'center',
          color,
          fontSize: small ? 18 : 28,
          textShadow: `0 0 8px ${color}40`,
          lineHeight: 1,
        }}
      >
        {sym}
      </div>
      <div
        style={{
          color,
          lineHeight: 1,
          transform: 'rotate(180deg)',
          alignSelf: 'flex-end',
        }}
      >
        <div
          style={{
            fontSize: small ? 11 : 14,
            fontWeight: 900,
            fontFamily: 'var(--font-ui)',
          }}
        >
          {card.rank}
        </div>
        <div style={{ fontSize: small ? 10 : 13 }}>{sym}</div>
      </div>
      {trump && (
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            color: '#000',
            fontWeight: 900,
            boxShadow: '0 0 12px var(--gold)',
          }}
        >
          ★
        </div>
      )}
      {isPlayable && !selected && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
            borderRadius: '0 0 8px 8px',
          }}
        />
      )}
    </motion.div>
  );
});

// ─── BUTTON ────────────────────────────────────────────────────────

const Button = memo(function Button({
  children,
  onClick,
  color = 'cyan',
  disabled = false,
  small = false,
  full = false,
  loading = false,
  style = {},
}) {
  const colors = {
    cyan: { c: 'var(--cyan)', bg: 'rgba(0,229,255,0.08)', b: 'rgba(0,229,255,0.4)' },
    gold: { c: 'var(--gold)', bg: 'rgba(245,200,66,0.08)', b: 'rgba(245,200,66,0.4)' },
    pink: { c: 'var(--pink)', bg: 'rgba(255,45,110,0.08)', b: 'rgba(255,45,110,0.4)' },
    green: { c: 'var(--green)', bg: 'rgba(0,255,148,0.08)', b: 'rgba(0,255,148,0.4)' },
    red: { c: 'var(--red)', bg: 'rgba(255,59,92,0.08)', b: 'rgba(255,59,92,0.4)' },
  };
  const clr = colors[color] || colors.cyan;

  const handleClick = e => {
    if (!disabled && !loading && onClick) {
      SFX.playButtonClick();
      onClick(e);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.96 } : {}}
      style={{
        background: disabled || loading ? 'rgba(255,255,255,0.04)' : clr.bg,
        border: `1px solid ${disabled || loading ? 'rgba(255,255,255,0.08)' : clr.b}`,
        color: disabled || loading ? 'rgba(255,255,255,0.25)' : clr.c,
        padding: small ? '8px 16px' : '12px 24px',
        borderRadius: 8,
        fontFamily: 'var(--font-ui)',
        fontSize: small ? 10 : 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        boxShadow: disabled || loading ? 'none' : `0 0 20px ${clr.b}50, inset 0 0 20px ${clr.b}10`,
        width: full ? '100%' : 'auto',
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}
    >
      {!disabled && !loading && <div className="shimmer-line" />}
      {loading ? (
        <span style={{ animation: 'spin-slow 1s linear infinite' }}>⏳</span>
      ) : (
        children
      )}
    </motion.button>
  );
});

// ─── INPUT ────────────────────────────────────────────────────────

const Input = memo(function Input({
  value,
  onChange,
  placeholder,
  onKeyDown,
  autoFocus,
  maxLength,
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (autoFocus && ref.current) setTimeout(() => ref.current.focus(), 100);
  }, [autoFocus]);

  return (
    <input
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      maxLength={maxLength || 20}
      style={{
        background: 'rgba(0,229,255,0.05)',
        border: '1px solid rgba(0,229,255,0.3)',
        borderRadius: 8,
        color: 'var(--cyan)',
        padding: '12px 16px',
        fontSize: 15,
        fontFamily: 'var(--font-b)',
        letterSpacing: '0.04em',
        outline: 'none',
        width: '100%',
        boxShadow: '0 0 20px rgba(0,229,255,0.08)',
        transition: 'all 0.3s ease',
      }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--cyan)';
        e.target.style.boxShadow = '0 0 30px rgba(0,229,255,0.2)';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(0,229,255,0.3)';
        e.target.style.boxShadow = '0 0 20px rgba(0,229,255,0.08)';
      }}
    />
  );
});

// ─── LOGIN SCREEN ─────────────────────────────────────────────────

const LoginScreen = memo(function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('karta_nick');
    if (saved) setName(saved);
    setTimeout(() => setReady(true), 1500);
  }, []);

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Nickname 2 ta harfdan kam boʻlmasligi kerak');
      return;
    }
    if (trimmed.length > 16) {
      setError('Nickname 16 ta harfdan oshmasligi kerak');
      return;
    }
    setError('');
    setLoading(true);
    localStorage.setItem('karta_nick', trimmed);
    SFX.playJoin();
    setTimeout(() => onLogin(trimmed), 400);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <Background />
      <AnimatePresence mode="wait">
        {!ready ? (
          <motion.div key="intro" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 1.4 }}
              style={{ fontSize: 88, textAlign: 'center' }}
            >
              🎴
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontFamily: 'var(--font-d)',
                fontSize: 'clamp(28px, 6vw, 48px)',
                color: 'var(--gold)',
                textShadow: '0 0 30px var(--gold)',
                textAlign: 'center',
              }}
            >
              KARTA O'YINI
            </motion.h1>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: 420, padding: '0 20px', zIndex: 1 }}
          >
            <div
              className="glass"
              style={{
                borderRadius: 20,
                padding: '44px 36px',
                boxShadow: '0 0 80px rgba(0,229,255,0.05), 0 40px 80px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🎴</div>
                <h1
                  style={{
                    fontFamily: 'var(--font-d)',
                    fontSize: 22,
                    color: 'var(--gold)',
                    textShadow: '0 0 20px var(--gold)',
                  }}
                >
                  KARTA O'YINI
                </h1>
                <p
                  style={{
                    color: 'var(--dim)',
                    fontSize: 11,
                    marginTop: 8,
                    fontFamily: 'var(--font-ui)',
                    letterSpacing: '0.15em',
                  }}
                >
                  NICKNAME KIRITING
                </p>
              </div>
              <div style={{ marginBottom: 20 }}>
                <Input
                  value={name}
                  onChange={setName}
                  placeholder="Ismingiz..."
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
                {error && <p style={{ color: 'var(--pink)', fontSize: 11, marginTop: 6 }}>{error}</p>}
              </div>
              <Button
                color="gold"
                onClick={submit}
                disabled={name.trim().length < 2 || loading}
                full
                loading={loading}
                style={{ padding: '14px', fontSize: 13 }}
              >
                {loading ? 'YUKLANMOQDA...' : "O'YINGA KIRISH →"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── MENU SCREEN ──────────────────────────────────────────────────

const MenuScreen = memo(function MenuScreen({ nickname, onSelectGame, onLogout }) {
  const games = [
    {
      id: 'bura',
      icon: '🃏',
      title: "TO'RT BURA",
      sub: '2 yoki 4 kishilik',
      color: 'var(--gold)',
      glow: 'rgba(245,200,66,0.12)',
    },
    {
      id: '108',
      icon: '🔥',
      title: '108',
      sub: '2-6 kishilik',
      color: 'var(--pink)',
      glow: 'rgba(255,45,110,0.12)',
    },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
      <Background />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          zIndex: 1,
          background: 'rgba(2,4,8,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,229,255,0.06)',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-d)',
              fontSize: 16,
              color: 'var(--gold)',
              textShadow: '0 0 15px var(--gold)',
            }}
          >
            KARTA O'YINI
          </div>
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 9,
              color: 'var(--dim)',
              letterSpacing: '0.2em',
            }}
          >
            ONLINE MULTIPLAYER
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              background: 'rgba(0,229,255,0.07)',
              border: '1px solid rgba(0,229,255,0.15)',
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              color: 'var(--cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--green)',
                boxShadow: '0 0 8px var(--green)',
              }}
            />
            {nickname}
          </div>
          <Button small color="red" onClick={onLogout}>
            CHIQISH
          </Button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px 20px',
          zIndex: 1,
          gap: 'clamp(16px, 3vw, 40px)',
          flexWrap: 'wrap',
        }}
      >
        {games.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 120 }}
            onClick={() => {
              SFX.playJoin();
              onSelectGame(g.id);
            }}
            whileHover={{ scale: 1.03, y: -8 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: 'clamp(260px, 38vw, 360px)',
              padding: '36px 30px',
              borderRadius: 20,
              background: `radial-gradient(circle at 25% 25%, ${g.glow}, rgba(11,20,37,0.9))`,
              border: `1px solid ${g.color}35`,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 0 60px ${g.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
            }}
          >
            <div className="shimmer-line" />
            <div style={{ fontSize: 56, marginBottom: 18, textAlign: 'center' }}>{g.icon}</div>
            <h2
              style={{
                fontFamily: 'var(--font-d)',
                fontSize: 20,
                color: g.color,
                textShadow: `0 0 20px ${g.color}`,
                textAlign: 'center',
                marginBottom: 6,
              }}
            >
              {g.title}
            </h2>
            <div
              style={{
                textAlign: 'center',
                fontFamily: 'var(--font-ui)',
                fontSize: 10,
                color: g.color,
                opacity: 0.7,
                letterSpacing: '0.15em',
                marginBottom: 14,
              }}
            >
              {g.sub}
            </div>
            <div
              style={{
                marginTop: 22,
                padding: '11px',
                borderRadius: 8,
                textAlign: 'center',
                background: `${g.color}12`,
                border: `1px solid ${g.color}25`,
                fontFamily: 'var(--font-ui)',
                fontSize: 11,
                color: g.color,
                letterSpacing: '0.1em',
              }}
            >
              O'YNASH →
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

// ─── SELECT SCREEN ────────────────────────────────────────────────

const SelectScreen = memo(function SelectScreen({
  gameMode,
  onBack,
  onCreate,
  onJoin,
}) {
  const [tab, setTab] = useState('create');
  const [type, setType] = useState('2p');
  const [decks, setDecks] = useState(1);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const isBura = gameMode === 'bura';

  const handleCreate = () => {
    setBusy(true);
    onCreate({ gameMode, gameType: type, deckCount: decks });
  };

  const handleJoin = () => {
    if (code.length === 6) {
      setBusy(true);
      onJoin(code);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, overflowY: 'auto' }}>
      <Background />
      <div style={{ zIndex: 1, maxWidth: 500, margin: '0 auto', width: '100%', padding: '20px 18px' }}>
        <Button small onClick={onBack} style={{ marginBottom: 22 }}>
          ← ORQAGA
        </Button>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 46, marginBottom: 10 }}>{isBura ? '🃏' : '🔥'}</div>
          <h1
            style={{
              fontFamily: 'var(--font-d)',
              fontSize: 22,
              color: isBura ? 'var(--gold)' : 'var(--pink)',
              textShadow: `0 0 20px ${isBura ? 'var(--gold)' : 'var(--pink)'}`,
            }}
          >
            {isBura ? "TO'RT BURA" : '108'}
          </h1>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 3,
            marginBottom: 22,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 9,
            padding: 3,
            border: '1px solid rgba(0,229,255,0.06)',
          }}
        >
          {[
            ['create', '+ XONA YARATISH'],
            ['join', '→ XONAGA KIRISH'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 7,
                background: tab === id ? 'rgba(0,229,255,0.1)' : 'transparent',
                border: tab === id ? '1px solid rgba(0,229,255,0.25)' : '1px solid transparent',
                color: tab === id ? 'var(--cyan)' : 'var(--dim)',
                fontFamily: 'var(--font-ui)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'create' ? (
            <motion.div key="cr" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass" style={{ borderRadius: 16, padding: '26px 22px' }}>
                {isBura && (
                  <div style={{ marginBottom: 22 }}>
                    <p
                      style={{
                        color: 'var(--dim)',
                        fontFamily: 'var(--font-ui)',
                        fontSize: 10,
                        letterSpacing: '0.15em',
                        marginBottom: 10,
                      }}
                    >
                      O'YINCHILAR SONI
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        ['2p', '2 KISHILIK'],
                        ['4p', '4 KISHILIK (2v2)'],
                      ].map(([v, l]) => (
                        <button
                          key={v}
                          onClick={() => setType(v)}
                          style={{
                            flex: 1,
                            padding: '13px 8px',
                            borderRadius: 8,
                            background: type === v ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${type === v ? 'var(--gold)' : 'rgba(255,255,255,0.06)'}`,
                            color: type === v ? 'var(--gold)' : 'var(--dim)',
                            fontFamily: 'var(--font-ui)',
                            fontSize: 10.5,
                            fontWeight: 700,
                            letterSpacing: '0.07em',
                            cursor: 'pointer',
                          }}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!isBura && (
                  <div style={{ marginBottom: 22 }}>
                    <p
                      style={{
                        color: 'var(--dim)',
                        fontFamily: 'var(--font-ui)',
                        fontSize: 10,
                        letterSpacing: '0.15em',
                        marginBottom: 10,
                      }}
                    >
                      DAST SONI
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3].map(d => (
                        <button
                          key={d}
                          onClick={() => setDecks(d)}
                          style={{
                            flex: 1,
                            padding: '13px 8px',
                            borderRadius: 8,
                            background: decks === d ? 'rgba(255,45,110,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${decks === d ? 'var(--pink)' : 'rgba(255,255,255,0.06)'}`,
                            color: decks === d ? 'var(--pink)' : 'var(--dim)',
                            fontFamily: 'var(--font-ui)',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {d} DAST
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  color={isBura ? 'gold' : 'pink'}
                  onClick={handleCreate}
                  full
                  loading={busy}
                  style={{ padding: '14px', fontSize: 13 }}
                >
                  XONA YARATISH
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="jo" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass" style={{ borderRadius: 16, padding: '26px 22px' }}>
                <p
                  style={{
                    color: 'var(--dim)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 10,
                    letterSpacing: '0.15em',
                    marginBottom: 10,
                  }}
                >
                  XONA KODI (6 RAQAM)
                </p>
                <div style={{ marginBottom: 18 }}>
                  <Input
                    value={code}
                    onChange={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    onKeyDown={e => e.key === 'Enter' && code.length === 6 && handleJoin()}
                    autoFocus
                  />
                </div>
                <Button
                  color="cyan"
                  disabled={code.length !== 6 || busy}
                  onClick={handleJoin}
                  full
                  loading={busy}
                  style={{ padding: '14px', fontSize: 13 }}
                >
                  {busy ? 'KIRILMOQDA...' : 'XONAGA KIRISH →'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ─── LOBBY SCREEN ─────────────────────────────────────────────────

const LobbyScreen = memo(function LobbyScreen({
  room,
  nickname,
  socketId,
  onStart,
  onLeave,
  onToggleReady,
  onSendChat,
  chats,
  typingUsers,
}) {
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const chatRef = useRef(null);
  const isHost = room.host === socketId;
  const isReady = room.readyPlayers?.includes(socketId) || false;
  const canStart = isHost && room.players.length >= room.minPlayers;

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chats]);

  const copyCode = () => {
    navigator.clipboard?.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const send = () => {
    if (msg.trim()) {
      onSendChat(msg.trim());
      setMsg('');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20 }}>
      <Background />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          overflow: 'hidden',
          maxWidth: 680,
          margin: '0 auto',
          width: '100%',
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-d)',
                fontSize: 16,
                color: 'var(--gold)',
                textShadow: '0 0 12px var(--gold)',
              }}
            >
              {room.gameMode === 'bura' ? "TO'RT BURA" : '108'} — LOBBY
            </h2>
            <p style={{ color: 'var(--dim)', fontSize: 10, fontFamily: 'var(--font-ui)' }}>
              {room.players.length}/{room.maxPlayers} O'YINCHI •{' '}
              {room.gameMode === 'bura'
                ? room.gameType === '4p'
                  ? '4 KISHILIK 2v2'
                  : '2 KISHILIK'
                : `${room.deckCount} DAST`}
            </p>
          </div>
          <Button small color="red" onClick={onLeave}>
            CHIQISH
          </Button>
        </div>

        <div
          className="glass"
          style={{
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                color: 'var(--dim)',
                fontFamily: 'var(--font-ui)',
                fontSize: 9,
                letterSpacing: '0.2em',
                marginBottom: 3,
              }}
            >
              XONA KODI
            </p>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 26,
                fontWeight: 900,
                color: 'var(--cyan)',
                letterSpacing: '0.3em',
                textShadow: '0 0 20px var(--cyan)',
              }}
            >
              {room.id}
            </div>
          </div>
          <Button small color="cyan" onClick={copyCode}>
            {copied ? '✓ NUSXA' : 'NUSXA OLISH'}
          </Button>
        </div>

        <div className="glass" style={{ borderRadius: 12, padding: '14px', marginBottom: 12 }}>
          <p
            style={{
              color: 'var(--dim)',
              fontFamily: 'var(--font-ui)',
              fontSize: 9,
              letterSpacing: '0.2em',
              marginBottom: 10,
            }}
          >
            O'YINCHILAR
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Array.from({ length: room.maxPlayers }).map((_, i) => {
              const p = room.players[i];
              const isMe = p?.id === socketId;
              const isHostP = p?.id === room.host;
              const rdy = room.readyPlayers?.includes(p?.id);
              return (
                <motion.div
                  key={i}
                  initial={p ? { scale: 0.85, opacity: 0 } : {}}
                  animate={p ? { scale: 1, opacity: 1 } : {}}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: p
                      ? isMe
                        ? 'rgba(0,229,255,0.07)'
                        : 'rgba(255,255,255,0.03)'
                      : 'rgba(255,255,255,0.015)',
                    border: p
                      ? isMe
                        ? '1px solid rgba(0,229,255,0.2)'
                        : '1px solid rgba(255,255,255,0.06)'
                      : '1px dashed rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {p ? (
                    <>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: `hsl(${p.nickname.charCodeAt(0) * 13 % 360}, 55%, 28%)`,
                          border: `2px solid hsl(${p.nickname.charCodeAt(0) * 13 % 360}, 75%, 50%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#fff',
                          flexShrink: 0,
                        }}
                      >
                        {p.nickname[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {p.nickname}{' '}
                          {isMe && <span style={{ color: 'var(--cyan)', fontSize: 9 }}>(sen)</span>}
                        </div>
                        <div
                          style={{
                            fontSize: 9.5,
                            fontFamily: 'var(--font-ui)',
                            color: isHostP ? 'var(--gold)' : rdy ? 'var(--green)' : 'var(--dim)',
                          }}
                        >
                          {isHostP ? '👑 HOST' : rdy ? '✓ TAYYOR' : 'kutmoqda...'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <motion.div
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{
                        color: 'var(--dimmer)',
                        fontSize: 11,
                        fontFamily: 'var(--font-ui)',
                        width: '100%',
                        textAlign: 'center',
                      }}
                    >
                      BO'SH SLOT...
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div
          className="glass"
          style={{
            borderRadius: 12,
            padding: '12px',
            marginBottom: 12,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <p
            style={{
              color: 'var(--dim)',
              fontFamily: 'var(--font-ui)',
              fontSize: 9,
              letterSpacing: '0.2em',
              marginBottom: 8,
            }}
          >
            CHAT
          </p>
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', marginBottom: 8, minHeight: 0 }}>
            {chats.map(m => (
              <div key={m.id} style={{ marginBottom: 5, display: 'flex', gap: 7, alignItems: 'baseline' }}>
                <span
                  style={{
                    color: 'var(--cyan)',
                    fontSize: 11.5,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {m.nickname}:
                </span>
                <span style={{ color: 'var(--text)', fontSize: 12.5 }}>{m.text}</span>
              </div>
            ))}
            {typingUsers.length > 0 && (
              <div style={{ color: 'var(--dim)', fontSize: 10.5, fontStyle: 'italic' }}>
                {typingUsers.join(', ')} yozmoqda...
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Xabar..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(0,229,255,0.12)',
                borderRadius: 6,
                color: 'var(--text)',
                padding: '8px 12px',
                fontSize: 12.5,
                fontFamily: 'var(--font-b)',
                outline: 'none',
              }}
            />
            <Button small onClick={send}>
              ↑
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {!isHost && (
            <Button
              color={isReady ? 'green' : 'cyan'}
              onClick={onToggleReady}
              full
              style={{ padding: '12px' }}
            >
              {isReady ? '✓ TAYYOR' : 'TAYYOR'}
            </Button>
          )}
          {isHost && (
            <Button
              color="gold"
              disabled={!canStart}
              onClick={onStart}
              full
              style={{ padding: '12px', fontSize: 13 }}
            >
              {canStart ? '▶ BOSHLASH' : `KUTISH... (${room.players.length}/${room.minPlayers})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── BURA ROUND OVER ──────────────────────────────────────────────

const BuraRoundOver = memo(function BuraRoundOver({
  gameState,
  room,
  socketId,
  onNextRound,
  onLeave,
}) {
  useEffect(() => {
    SFX.playNotification();
  }, []);

  const players = room.players;
  const summary = gameState?.roundSummary || {};
  const isHost = room.host === socketId;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <Background />
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120 }}
        style={{
          background: 'rgba(8,16,34,0.97)',
          borderRadius: 22,
          padding: '40px 36px',
          maxWidth: 440,
          width: '90%',
          border: '1px solid rgba(0,229,255,0.15)',
          boxShadow: '0 0 80px rgba(0,229,255,0.05), 0 40px 80px rgba(0,0,0,0.6)',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 14 }}>📊</div>
        <h2
          style={{
            fontFamily: 'var(--font-d)',
            fontSize: 20,
            color: 'var(--cyan)',
            textShadow: '0 0 20px var(--cyan)',
            marginBottom: 6,
          }}
        >
          RAUND YAKUNLANDI
        </h2>
        <p
          style={{
            color: 'var(--dim)',
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            marginBottom: 24,
          }}
        >
          RAUND #{gameState?.roundNumber || 1}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 26 }}>
          {players.map(p => {
            const s = summary[p.id] || {};
            const pen = gameState?.penalties?.[p.id] || 0;
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text)' }}>
                    {p.nickname}
                    {p.id === socketId && (
                      <span style={{ color: 'var(--cyan)', fontSize: 9, marginLeft: 4 }}>(sen)</span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 9,
                      color: 'var(--dim)',
                      marginTop: 2,
                    }}
                  >
                    Jami jarima:{' '}
                    <span style={{ color: pen >= 9 ? 'var(--red)' : 'var(--text)' }}>{pen}</span>/12
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--gold)',
                    }}
                  >
                    {s.points || 0} ball
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 11,
                      color:
                        s.penalty === 0
                          ? 'var(--green)'
                          : s.penalty === 6
                          ? 'var(--red)'
                          : 'var(--pink)',
                    }}
                  >
                    +{s.penalty || 0} shtraf
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {isHost && (
            <Button color="gold" onClick={onNextRound}>
              ▶ KEYINGI RAUND
            </Button>
          )}
          <Button color="cyan" onClick={onLeave}>
            ← MENU
          </Button>
        </div>
        {!isHost && (
          <p
            style={{
              color: 'var(--dim)',
              fontSize: 10,
              marginTop: 14,
              fontFamily: 'var(--font-ui)',
            }}
          >
            Host keyingi raundni boshlashini kuting...
          </p>
        )}
      </motion.div>
    </div>
  );
});

// ─── BURA GAME OVER ───────────────────────────────────────────────

const BuraGameOver = memo(function BuraGameOver({
  gameState,
  room,
  socketId,
  onPlayAgain,
  onLeave,
}) {
  const players = room.players;
  const winner = gameState?.winner;
  const isTeam = room.gameType === '4p';
  const iWon = isTeam
    ? (gameState?.teams?.team1?.includes(socketId) ? 'team1' : 'team2') === winner
    : winner === socketId;

  useEffect(() => {
    if (iWon) SFX.playWin();
    else SFX.playLose();
  }, [iWon]);

  const sorted = [...players].sort(
    (a, b) => (gameState?.penalties?.[a.id] || 0) - (gameState?.penalties?.[b.id] || 0)
  );

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <Background />
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
        style={{
          background: 'rgba(8,16,34,0.97)',
          borderRadius: 22,
          padding: '44px 38px',
          maxWidth: 440,
          width: '90%',
          border: `1px solid ${iWon ? 'rgba(245,200,66,0.35)' : 'rgba(255,45,110,0.25)'}`,
          boxShadow: `0 0 100px ${iWon ? 'rgba(245,200,66,0.08)' : 'rgba(255,45,110,0.06)'}, 0 40px 80px rgba(0,0,0,0.6)`,
          textAlign: 'center',
          zIndex: 1,
          animation: iWon ? 'winner-flash 2s infinite' : undefined,
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>{iWon ? '🏆' : '💀'}</div>
        <h2
          style={{
            fontFamily: 'var(--font-d)',
            fontSize: 22,
            color: iWon ? 'var(--gold)' : 'var(--pink)',
            textShadow: `0 0 30px ${iWon ? 'var(--gold)' : 'var(--pink)'}`,
            marginBottom: 8,
          }}
        >
          {iWon ? "G'ALABA!" : "YUTQAZDINGIZ"}
        </h2>
        <p style={{ color: 'var(--dim)', fontSize: 13, marginBottom: 28 }}>
          {isTeam
            ? iWon
              ? 'Sizning jamoangiz g\'alaba qildi!'
              : 'Raqib jamoa g\'alaba qildi'
            : iWon
            ? 'Tabriklaymiz! Siz eng kam jarima yigʻdingiz!'
            : `${gameState?.winnerNickname || players.find(p => p.id === winner)?.nickname} gʻalaba qildi!`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {sorted.map((p, rank) => {
            const pen = gameState?.penalties?.[p.id] || 0;
            const isLoser = pen >= 12;
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: rank === 0 ? 'rgba(245,200,66,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${
                    rank === 0
                      ? 'rgba(245,200,66,0.3)'
                      : isLoser
                      ? 'rgba(255,45,110,0.3)'
                      : 'rgba(255,255,255,0.06)'
                  }`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 14,
                      color:
                        rank === 0
                          ? 'var(--gold)'
                          : isLoser
                          ? 'var(--red)'
                          : 'var(--dim)',
                    }}
                  >
                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : '💀'}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 12,
                      color: rank === 0 ? 'var(--gold)' : 'var(--text)',
                    }}
                  >
                    {p.nickname}
                  </span>
                  {p.id === socketId && (
                    <span style={{ fontSize: 9, color: 'var(--cyan)' }}>(sen)</span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: isLoser
                      ? 'var(--red)'
                      : rank === 0
                      ? 'var(--gold)'
                      : 'var(--text)',
                  }}
                >
                  {pen} shtraf
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {room.host === socketId && (
            <Button color="gold" onClick={onPlayAgain}>
              🔄 QAYTA O'YNASH
            </Button>
          )}
          <Button color="cyan" onClick={onLeave}>
            ← BOSH MENU
          </Button>
        </div>
        {room.host !== socketId && (
          <p
            style={{
              color: 'var(--dim)',
              fontSize: 10,
              marginTop: 14,
              fontFamily: 'var(--font-ui)',
            }}
          >
            Host qayta boshlashini kuting...
          </p>
        )}
      </motion.div>
    </div>
  );
});

// ─── BURA GAME SCREEN ─────────────────────────────────────────────

const BuraScreen = memo(function BuraScreen({
  room,
  gameState,
  myHand,
  socketId,
  nickname,
  onPlayCard,
  onThrow,
  onLeave,
  onPlayAgain,
  onNextRound,
}) {
  const [selected, setSelected] = useState(null);
  const [shakeId, setShakeId] = useState(null);

  const players = room.players;
  const myIdx = players.findIndex(p => p.id === socketId);
  const trump = gameState?.trumpSuit;
  const isAttacker = gameState?.attackerId === socketId;
  const isDefender = gameState?.defenderId === socketId;
  const isMyTurn = gameState?.currentPlayer === socketId;
  const phase2 = gameState?.phase2;

  const playable = useMemo(() => {
    if (!myHand || !gameState || !isMyTurn) return new Set();
    if (phase2 === 'attacking' && isAttacker) return new Set(myHand.map(c => c.id));
    if (phase2 === 'defending' && isDefender) {
      const last = gameState.attackCards?.[gameState.attackCards.length - 1];
      if (!last) return new Set();
      return new Set(
        myHand
          .filter(c => {
            if (c.suit === last.suit) {
              return RANK_ORDER.indexOf(c.rank) > RANK_ORDER.indexOf(last.rank);
            }
            if (c.suit === trump && last.suit !== trump) return true;
            return false;
          })
          .map(c => c.id)
      );
    }
    return new Set();
  }, [myHand, gameState, isMyTurn, isAttacker, isDefender, phase2, trump]);

  const handleCardClick = card => {
    if (!playable.has(card.id)) {
      setShakeId(card.id);
      SFX.playError();
      setTimeout(() => setShakeId(null), 500);
      return;
    }
    if (selected?.id === card.id) {
      SFX.playCardPlay();
      onPlayCard(card.id);
      setSelected(null);
    } else {
      setSelected(card);
    }
  };

  const handleThrow = () => {
    SFX.playCardThrow();
    onThrow();
    setSelected(null);
  };

  if (gameState?.phase === 'roundOver') {
    return (
      <BuraRoundOver
        gameState={gameState}
        room={room}
        socketId={socketId}
        onNextRound={onNextRound}
        onLeave={onLeave}
      />
    );
  }

  if (gameState?.phase === 'gameOver') {
    return (
      <BuraGameOver
        gameState={gameState}
        room={room}
        socketId={socketId}
        onPlayAgain={onPlayAgain}
        onLeave={onLeave}
      />
    );
  }

  const getPos = idx => {
    const rel = (idx - myIdx + players.length) % players.length;
    if (players.length === 2) return rel === 0 ? 'bottom' : 'top';
    return ['bottom', 'right', 'top', 'left'][rel] || 'top';
  };

  const myPenalty = gameState?.penalties?.[socketId] || 0;
  const myScore = gameState?.scores?.[socketId] || 0;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, overflow: 'hidden' }}>
      <Background />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          zIndex: 10,
          background: 'rgba(2,4,8,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,229,255,0.06)',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {trump && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(245,200,66,0.1)',
                border: '1px solid rgba(245,200,66,0.25)',
              }}
            >
              <span style={{ color: SUIT_CLR[trump], fontSize: 18 }}>{SUIT_SYM[trump]}</span>
              <span style={{ color: 'var(--gold)', fontSize: 9, fontFamily: 'var(--font-ui)' }}>KOZIR</span>
            </div>
          )}
          {gameState?.deckRemaining > 0 && (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--dim)' }}>
              🃏 {gameState.deckRemaining}
            </div>
          )}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {players.map(p => (
              <div
                key={p.id}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: p.id === socketId ? 'rgba(0,229,255,0.07)' : 'rgba(255,255,255,0.03)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 10,
                  color: p.id === socketId ? 'var(--cyan)' : 'var(--dim)',
                }}
              >
                {p.nickname.slice(0, 8)}: {gameState?.scores?.[p.id] || 0}pt
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)' }}>JARIMA:</span>
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', maxWidth: 120 }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: i < myPenalty ? 'var(--red)' : 'rgba(255,255,255,0.08)',
                    border: i < myPenalty ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.05)',
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 10,
                color: myPenalty >= 9 ? 'var(--red)' : 'var(--dim)',
              }}
            >
              {myPenalty}/12
            </span>
          </div>
          <Button small color="red" onClick={onLeave}>
            ✕
          </Button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 'min(80vw, 480px)',
            height: 'min(42vw, 260px)',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at center, #1d5c35 0%, #0e3a1e 55%, #071811 100%)',
            border: '5px solid rgba(255,215,0,0.15)',
            boxShadow:
              'inset 0 0 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,80,30,0.15), inset 0 0 40px rgba(0,100,40,0.1)',
            position: 'absolute',
          }}
        />

        {players.map((p, i) => {
          if (p.id === socketId) return null;
          const pos = getPos(i);
          const isCurrent = gameState?.currentPlayer === p.id;
          const hSize = gameState?.handSizes?.[p.id] || 0;
          const pPen = gameState?.penalties?.[p.id] || 0;
          const style =
            {
              bottom: { position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)' },
              top: { position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)' },
              left: { position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' },
              right: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' },
            }[pos] || style.bottom;

          return (
            <div key={p.id} style={{ display: 'flex', gap: 6, zIndex: 5, ...style }}>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  textAlign: 'center',
                  background: isCurrent ? 'rgba(0,255,148,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isCurrent ? 'var(--green)' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: isCurrent ? '0 0 20px rgba(0,255,148,0.2)' : 'none',
                  minWidth: 80,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    fontFamily: 'var(--font-ui)',
                    color: isCurrent ? 'var(--green)' : 'var(--text)',
                    marginBottom: 2,
                  }}
                >
                  {p.nickname}
                </div>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: 'var(--dim)' }}>🃏×{hSize}</span>
                  <span style={{ fontSize: 9, color: pPen >= 9 ? 'var(--red)' : 'var(--dim)' }}>
                    ⚡{pPen}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                {Array.from({ length: Math.min(hSize, 6) }).map((_, ci) => (
                  <div
                    key={ci}
                    style={{
                      width: 24,
                      height: 36,
                      borderRadius: 4,
                      marginLeft: ci > 0 ? -10 : 0,
                      zIndex: ci,
                      background: 'linear-gradient(135deg,#0a1a3a,#152040)',
                      border: '1px solid rgba(0,229,255,0.15)',
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ position: 'absolute', display: 'flex', gap: 8, zIndex: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
            <AnimatePresence>
              {(gameState?.attackCards || []).map((c, i) => {
                const defended = gameState?.defendCards?.[i];
                return (
                  <motion.div
                    key={c.id}
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: i % 2 === 0 ? -6 : 6 }}
                    exit={{ scale: 0, rotate: 15 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    style={{ position: 'relative' }}
                  >
                    <Card card={c} small trump={c.suit === trump} />
                    {defended && (
                      <motion.div
                        initial={{ scale: 0, rotate: 0 }}
                        animate={{ scale: 1, rotate: 12 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                        style={{ position: 'absolute', top: -4, left: 4, zIndex: 1 }}
                      >
                        <Card card={defended} small trump={defended.suit === trump} />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {gameState?.trumpCard && gameState?.deckRemaining > 0 && (
          <div
            style={{
              position: 'absolute',
              right: '4%',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 5,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: 'var(--gold)',
                fontFamily: 'var(--font-ui)',
                marginBottom: 4,
              }}
            >
              KOZIR KARTI
            </div>
            <Card card={gameState.trumpCard} small trump />
            <div
              style={{
                fontSize: 9,
                color: 'var(--dim)',
                fontFamily: 'var(--font-ui)',
                marginTop: 3,
              }}
            >
              {gameState.deckRemaining} karta
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <AnimatePresence>
            {isMyTurn ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  padding: '7px 18px',
                  borderRadius: 20,
                  background: isAttacker ? 'rgba(245,200,66,0.15)' : 'rgba(0,229,255,0.12)',
                  border: `1px solid ${isAttacker ? 'var(--gold)' : 'var(--cyan)'}`,
                  color: isAttacker ? 'var(--gold)' : 'var(--cyan)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 11,
                  boxShadow: `0 0 25px ${isAttacker ? 'rgba(245,200,66,0.25)' : 'rgba(0,229,255,0.2)'}`,
                }}
              >
                {isAttacker ? '⚔ HUJUM QILING' : '🛡 HIMOYA QILING'}
              </motion.div>
            ) : (
              gameState?.currentPlayer && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'var(--dim)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 10,
                  }}
                >
                  {players.find(p => p.id === gameState.currentPlayer)?.nickname} o'ynamoqda...
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        <div
          style={{
            position: 'absolute',
            left: '2%',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {Object.entries(BURA_POINTS)
            .filter(([_, v]) => v > 0)
            .map(([r, v]) => (
              <div
                key={r}
                style={{
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 9,
                    color: 'var(--dim)',
                    fontWeight: 700,
                  }}
                >
                  {r}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 8,
                    color: 'var(--dimmer)',
                  }}
                >
                  =
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 8.5,
                    color: 'var(--gold)',
                  }}
                >
                  {v}
                </span>
              </div>
            ))}
        </div>
      </div>

      <div
        style={{
          background: 'rgba(2,4,8,0.92)',
          backdropFilter: 'blur(14px)',
          borderTop: '1px solid rgba(0,229,255,0.06)',
          padding: '10px 8px 18px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              color: isMyTurn ? (isAttacker ? 'var(--gold)' : 'var(--cyan)') : 'var(--dim)',
            }}
          >
            {nickname}
            {isAttacker ? ' • ⚔ HUJUMCHI' : isDefender ? ' • 🛡 HIMOYACHI' : ''}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)' }}>
            BALL: <span style={{ color: 'var(--text)' }}>{myScore}</span>
          </span>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 9,
              color: myPenalty >= 9 ? 'var(--red)' : 'var(--dim)',
            }}
          >
            JARIMA:{' '}
            <span style={{ color: myPenalty >= 9 ? 'var(--red)' : 'var(--text)' }}>
              {myPenalty}
            </span>
            /12
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 4,
            justifyContent: 'center',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            paddingTop: 18,
            paddingBottom: 4,
          }}
        >
          <AnimatePresence>
            {(myHand || []).map((c, i) => (
              <Card
                key={c.id}
                card={c}
                onClick={handleCardClick}
                selected={selected?.id === c.id}
                playable={playable.has(c.id) && isMyTurn}
                trump={c.suit === trump}
                animDelay={i * 0.05}
                shake={shakeId === c.id}
              />
            ))}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
          {selected && isMyTurn && playable.has(selected.id) && (
            <Button
              small
              color={isAttacker ? 'gold' : 'cyan'}
              onClick={() => {
                SFX.playCardPlay();
                onPlayCard(selected.id);
                setSelected(null);
              }}
            >
              ▶ {selected.rank}
              {SUIT_SYM[selected.suit]} O'YNASH
            </Button>
          )}
          {isDefender &&
            isMyTurn &&
            phase2 === 'defending' &&
            (gameState?.attackCards || []).length > 0 && (
              <Button small color="red" onClick={handleThrow}>
                ✕ TASHLAB YUBORISH
              </Button>
            )}
        </div>
      </div>
    </div>
  );
});

// ─── 108 GAME SCREEN ──────────────────────────────────────────────

const Game108Screen = memo(function Game108Screen({
  room,
  gameState,
  myHand,
  socketId,
  nickname,
  onPlayCard,
  onDrawCard,
  onLeave,
  onPlayAgain,
}) {
  const [selected, setSelected] = useState(null);
  const [suitModal, setSuitModal] = useState(false);

  const isMyTurn = gameState?.currentPlayer === socketId;
  const topCard = gameState?.topCard;
  const pending = gameState?.pendingDraw || 0;
  const effSuit = gameState?.suitRequest || gameState?.currentSuit;

  const playable = useMemo(() => {
    if (!isMyTurn || !myHand || !gameState) return new Set();
    return new Set(
      myHand
        .filter(c => {
          if (pending > 0) return c.rank === '6' || c.rank === '7' || (c.rank === 'K' && c.suit === 'spades');
          if (c.rank === '8') return c.suit === effSuit;
          return c.suit === effSuit || c.rank === gameState.currentRank;
        })
        .map(c => c.id)
    );
  }, [isMyTurn, myHand, pending, effSuit, gameState]);

  const handleCardClick = c => {
    if (!isMyTurn || !playable.has(c.id)) {
      SFX.playError();
      return;
    }
    if (c.rank === 'Q') {
      setSelected(c);
      setSuitModal(true);
    } else {
      SFX.playCardPlay();
      onPlayCard(c.id, null);
    }
  };

  const handleSuitSelect = suit => {
    if (selected) {
      SFX.playCardPlay();
      onPlayCard(selected.id, suit);
      setSuitModal(false);
      setSelected(null);
    }
  };

  if (gameState?.phase === 'gameOver') {
    const iWon = gameState.winner === socketId;
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <Background />
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120 }}
          style={{
            background: 'rgba(8,16,34,0.97)',
            borderRadius: 22,
            padding: '44px 38px',
            maxWidth: 400,
            width: '90%',
            border: `1px solid ${iWon ? 'rgba(0,255,148,0.35)' : 'rgba(255,45,110,0.25)'}`,
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>{iWon ? '🏆' : '💀'}</div>
          <h2
            style={{
              fontFamily: 'var(--font-d)',
              fontSize: 22,
              color: iWon ? 'var(--green)' : 'var(--pink)',
              textShadow: `0 0 20px ${iWon ? 'var(--green)' : 'var(--pink)'}`,
              marginBottom: 8,
            }}
          >
            {iWon ? "G'ALABA!" : "YUTQAZDINGIZ"}
          </h2>
          <p style={{ color: 'var(--dim)', marginBottom: 28 }}>
            {gameState.winnerNickname} barcha kartasidan qutulib gʻalaba qildi!
          </p>
          <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {room.players.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 12,
                    color: p.id === gameState.winner ? 'var(--green)' : 'var(--text)',
                  }}
                >
                  {p.nickname}
                </span>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--dim)' }}>
                  🃏 {gameState.handSizes?.[p.id] || 0} qoldi
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {room.host === socketId && (
              <Button color="green" onClick={onPlayAgain}>
                🔄 QAYTA
              </Button>
            )}
            <Button color="cyan" onClick={onLeave}>
              ← MENU
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, overflow: 'hidden' }}>
      <Background />

      <AnimatePresence>
        {suitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              style={{
                background: 'var(--surface)',
                borderRadius: 16,
                padding: '30px',
                border: '1px solid rgba(0,229,255,0.2)',
                textAlign: 'center',
                maxWidth: 340,
                width: '90%',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-d)',
                  fontSize: 16,
                  color: 'var(--gold)',
                  marginBottom: 20,
                }}
              >
                SUIT TANLANG (QUEEN)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {SUIT_ORDER.map(s => (
                  <motion.button
                    key={s}
                    onClick={() => handleSuitSelect(s)}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: `2px solid ${SUIT_CLR[s]}`,
                      cursor: 'pointer',
                      color: SUIT_CLR[s],
                      fontSize: 26,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{SUIT_SYM[s]}</span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-ui)' }}>{SUIT_LBL[s]}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          zIndex: 10,
          background: 'rgba(2,4,8,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,229,255,0.06)',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {room.players.map(p => {
            const isCurrent = gameState?.currentPlayer === p.id;
            return (
              <div
                key={p.id}
                style={{
                  padding: '4px 9px',
                  borderRadius: 5,
                  background: isCurrent ? 'rgba(0,255,148,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isCurrent ? 'var(--green)' : 'rgba(255,255,255,0.06)'}`,
                  fontFamily: 'var(--font-ui)',
                  fontSize: 10,
                  color: isCurrent ? 'var(--green)' : p.id === socketId ? 'var(--cyan)' : 'var(--dim)',
                }}
              >
                {p.nickname.slice(0, 8)} 🃏{gameState?.handSizes?.[p.id] || 0}
              </div>
            );
          })}
        </div>
        <Button small color="red" onClick={onLeave}>
          ✕
        </Button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          gap: 12,
        }}
      >
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--cyan)' }}>
          {gameState?.direction === 1 ? '↻ Soat yo\'nalishi' : '↺ Teskari yo\'nalish'}
        </div>

        {pending > 0 && (
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 0.7 }}
            style={{
              padding: '7px 18px',
              borderRadius: 20,
              background: 'rgba(255,45,110,0.15)',
              border: '1px solid var(--pink)',
              color: 'var(--pink)',
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              boxShadow: '0 0 25px rgba(255,45,110,0.2)',
            }}
          >
            ⚠ +{pending} KARTA OLISH KERAK
          </motion.div>
        )}

        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 9,
                color: 'var(--dim)',
                fontFamily: 'var(--font-ui)',
                marginBottom: 6,
              }}
            >
              DAST ({gameState?.drawPileCount || 0})
            </div>
            <motion.div
              whileHover={isMyTurn ? { scale: 1.06 } : {}}
              whileTap={isMyTurn ? { scale: 0.94 } : {}}
              onClick={isMyTurn ? () => { SFX.playCardDraw(); onDrawCard(); } : undefined}
              style={{ cursor: isMyTurn ? 'pointer' : 'default' }}
            >
              <Card faceDown />
            </motion.div>
            {isMyTurn && (
              <div style={{ marginTop: 8 }}>
                <Button
                  small
                  color="cyan"
                  onClick={() => { SFX.playCardDraw(); onDrawCard(); }}
                >
                  {pending > 0 ? `+${pending} KARTA AL` : 'KARTA OLISH'}
                </Button>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 9,
                color: 'var(--dim)',
                fontFamily: 'var(--font-ui)',
                marginBottom: 6,
              }}
            >
              TASHLANGAN{' '}
              {gameState?.suitRequest && `(${SUIT_LBL[gameState.suitRequest]} ZAKAZ)`}
            </div>
            <AnimatePresence mode="wait">
              {topCard && (
                <motion.div
                  key={topCard.id}
                  initial={{ scale: 0.8, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card card={topCard} />
                </motion.div>
              )}
            </AnimatePresence>
            {effSuit && (
              <div style={{ marginTop: 6, fontSize: 22, color: SUIT_CLR[effSuit] }}>
                {SUIT_SYM[effSuit]}
              </div>
            )}
          </div>
        </div>

        {isMyTurn && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '7px 18px',
              borderRadius: 20,
              background: 'rgba(0,255,148,0.1)',
              border: '1px solid var(--green)',
              color: 'var(--green)',
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              boxShadow: '0 0 20px rgba(0,255,148,0.15)',
            }}
          >
            SIZNING NAVBATINGIZ
          </motion.div>
        )}
      </div>

      <div
        style={{
          background: 'rgba(2,4,8,0.92)',
          backdropFilter: 'blur(14px)',
          borderTop: '1px solid rgba(0,229,255,0.06)',
          padding: '10px 6px 16px',
          zIndex: 10,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: 6,
            fontFamily: 'var(--font-ui)',
            fontSize: 9,
            color: 'var(--dim)',
          }}
        >
          {nickname} • {myHand?.length || 0} karta
        </div>
        <div
          style={{
            display: 'flex',
            gap: 3,
            justifyContent: 'center',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            paddingTop: 14,
            paddingBottom: 4,
          }}
        >
          {(myHand || []).map((c, i) => (
            <Card
              key={c.id}
              card={c}
              onClick={handleCardClick}
              playable={playable.has(c.id) && isMyTurn}
              animDelay={i * 0.04}
              small
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// ─── MAIN APP ──────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const socketRef = useRef(null);
  const typingRef = useRef({});

  const {
    screen,
    nickname,
    socketId,
    selectedGame,
    room,
    gameState,
    myHand,
    chats,
    typingUsers,
    toasts,
    isOnline,
    isConnecting,
  } = state;

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    dispatch({ type: 'ADD_TOAST', payload: { id, msg, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4000);
  }, []);

  const removeToast = useCallback(id => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  // ─── Socket Setup ──────────────────────────────────────────────

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // Connect handler
    socket.on('connect', () => {
      dispatch({ type: 'SET_ONLINE', payload: true });
      dispatch({ type: 'SET_CONNECTING', payload: false });
      dispatch({ type: 'SET_SOCKET_ID', payload: socket.id });
      const saved = localStorage.getItem('karta_nick');
      if (saved) {
        socket.emit('register', { nickname: saved });
      }
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_ONLINE', payload: false });
      addToast('Ulanish uzildi. Qayta ulanmoqda...', 'error');
    });

    socket.on('registered', ({ nickname: n }) => {
      dispatch({ type: 'SET_NICKNAME', payload: n });
      if (screen === 'login') {
        dispatch({ type: 'SET_SCREEN', payload: 'menu' });
      }
    });

    socket.on('error', ({ msg }) => {
      addToast(msg, 'error');
      SFX.playError();
    });

    socket.on('moveError', ({ msg }) => {
      addToast(msg, 'error');
      SFX.playError();
    });

    socket.on('joinError', ({ msg }) => {
      addToast(msg, 'error');
      SFX.playError();
    });

    socket.on('roomCreated', ({ room: r }) => {
      dispatch({ type: 'SET_ROOM', payload: r });
      dispatch({ type: 'SET_CHATS', payload: r.chat || [] });
      dispatch({ type: 'SET_SCREEN', payload: 'lobby' });
      SFX.playJoin();
    });

    socket.on('roomJoined', ({ room: r }) => {
      dispatch({ type: 'SET_ROOM', payload: r });
      dispatch({ type: 'SET_CHATS', payload: r.chat || [] });
      dispatch({ type: 'SET_SCREEN', payload: 'lobby' });
      SFX.playJoin();
    });

    socket.on('roomUpdate', ({ room: r }) => {
      dispatch({ type: 'SET_ROOM', payload: r });
    });

    socket.on('playerJoined', ({ nickname: n }) => {
      addToast(`${n} qoʻshildi!`, 'success');
      SFX.playJoin();
    });

    socket.on('playerLeft', ({ nickname: n, room: r }) => {
      addToast(`${n} chiqdi`, 'info');
      if (r) dispatch({ type: 'SET_ROOM', payload: r });
      SFX.playLose();
    });

    socket.on('gameStarted', ({ room: r }) => {
      dispatch({ type: 'SET_ROOM', payload: r });
      dispatch({ type: 'SET_MY_HAND', payload: [] });
      dispatch({ type: 'SET_GAME_STATE', payload: null });
      SFX.playDeal();
    });

    socket.on('dealCards', ({ hand }) => {
      dispatch({ type: 'SET_MY_HAND', payload: hand });
      SFX.playDeal();
    });

    socket.on('handUpdate', ({ hand }) => {
      dispatch({ type: 'SET_MY_HAND', payload: hand });
    });

    socket.on('gameState', state => {
      dispatch({ type: 'SET_GAME_STATE', payload: state });
      if (screen === 'lobby' && state) {
        const mode = room?.gameMode || selectedGame;
        if (mode === 'bura' || mode === '108') {
          dispatch({ type: 'SET_SCREEN', payload: mode });
        }
      }
      if (state?.phase === 'roundOver') SFX.playNotification();
      if (state?.phase === 'gameOver') {
        if (state.winner === socketId) SFX.playWin();
        else SFX.playLose();
      }
    });

    socket.on('roundOver', state => {
      dispatch({ type: 'SET_GAME_STATE', payload: state });
    });

    socket.on('gameOver', state => {
      dispatch({ type: 'SET_GAME_STATE', payload: { ...gameState, ...state, phase: 'gameOver' } });
    });

    socket.on('gameCancelled', ({ reason, room: r }) => {
      addToast(reason, 'error');
      if (r) dispatch({ type: 'SET_ROOM', payload: r });
      dispatch({ type: 'SET_GAME_STATE', payload: null });
      dispatch({ type: 'SET_MY_HAND', payload: [] });
      dispatch({ type: 'SET_SCREEN', payload: 'lobby' });
    });

    socket.on('returnToLobby', ({ room: r }) => {
      dispatch({ type: 'SET_ROOM', payload: r });
      dispatch({ type: 'SET_GAME_STATE', payload: null });
      dispatch({ type: 'SET_MY_HAND', payload: [] });
      dispatch({ type: 'SET_SCREEN', payload: 'lobby' });
    });

    socket.on('chatMessage', m => {
      dispatch({ type: 'ADD_CHAT', payload: m });
    });

    socket.on('typing', ({ nickname: n }) => {
      dispatch({ type: 'SET_TYPING_USERS', payload: [...new Set([...typingUsers, n])] });
      clearTimeout(typingRef.current[n]);
      typingRef.current[n] = setTimeout(() => {
        dispatch({ type: 'SET_TYPING_USERS', payload: typingUsers.filter(u => u !== n) });
      }, 2000);
    });

    socket.on('reconnected', ({ room: r, gameState: gs }) => {
      dispatch({ type: 'SET_ROOM', payload: r });
      if (gs?.hand) dispatch({ type: 'SET_MY_HAND', payload: gs.hand });
      if (gs?.public) dispatch({ type: 'SET_GAME_STATE', payload: gs.public });
      dispatch({ type: 'SET_CHATS', payload: r.chat || [] });
      const target = r.status === 'playing' ? r.gameMode : 'lobby';
      dispatch({ type: 'SET_SCREEN', payload: target });
      addToast('Xonaga qayta ulandi!', 'success');
      SFX.playNotification();
    });

    socket.connect();
    dispatch({ type: 'SET_CONNECTING', payload: true });

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
      socket.off('gameStarted');
      socket.off('dealCards');
      socket.off('handUpdate');
      socket.off('gameState');
      socket.off('roundOver');
      socket.off('gameOver');
      socket.off('gameCancelled');
      socket.off('returnToLobby');
      socket.off('chatMessage');
      socket.off('typing');
      socket.off('reconnected');
      if (socket.connected) socket.disconnect();
    };
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────

  const handleLogin = useCallback(n => {
    dispatch({ type: 'SET_NICKNAME', payload: n });
    if (socketRef.current) {
      socketRef.current.emit('register', { nickname: n });
    }
    dispatch({ type: 'SET_SCREEN', payload: 'menu' });
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('karta_nick');
    dispatch({ type: 'RESET_ALL' });
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, []);

  const handleSelectGame = useCallback(id => {
    dispatch({ type: 'SET_SELECTED_GAME', payload: id });
    dispatch({ type: 'SET_SCREEN', payload: 'select' });
  }, []);

  const handleCreateRoom = useCallback(({ gameMode, gameType, deckCount }) => {
    if (socketRef.current) {
      socketRef.current.emit('createRoom', { gameMode, gameType, deckCount });
    }
  }, []);

  const handleJoinRoom = useCallback(roomId => {
    if (socketRef.current) {
      socketRef.current.emit('joinRoom', { roomId: roomId.trim() });
    }
  }, []);

  const handleLeaveRoom = useCallback(() => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('leaveRoom', { roomId: room.id });
    }
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_SCREEN', payload: 'menu' });
  }, [room]);

  const handleStartGame = useCallback(() => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('startGame', { roomId: room.id });
    }
  }, [room]);

  const handleToggleReady = useCallback(() => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('toggleReady', { roomId: room.id });
    }
  }, [room]);

  const handleSendChat = useCallback(text => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('chatMessage', { roomId: room.id, text });
    }
  }, [room]);

  const handleBuraPlay = useCallback(cardId => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('buraPlayCard', { roomId: room.id, cardId });
    }
  }, [room]);

  const handleBuraThrow = useCallback(() => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('buraThrow', { roomId: room.id });
    }
  }, [room]);

  const handle108Play = useCallback((cardId, suit) => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('108PlayCard', { roomId: room.id, cardId, chosenSuit: suit });
    }
  }, [room]);

  const handle108Draw = useCallback(() => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('108DrawCard', { roomId: room.id });
    }
  }, [room]);

  const handlePlayAgain = useCallback(() => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('playAgain', { roomId: room.id });
    }
  }, [room]);

  const handleNextRound = useCallback(() => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('playAgain', { roomId: room.id });
    }
  }, [room]);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div style={{ width: '100%', height: '100%', position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'fixed',
          bottom: 12,
          left: 12,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 20,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${isOnline ? 'rgba(0,255,148,0.25)' : 'rgba(255,45,110,0.25)'}`,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isOnline ? 'var(--green)' : 'var(--pink)',
            boxShadow: `0 0 8px ${isOnline ? 'var(--green)' : 'var(--pink)'}`,
          }}
        />
        <span
          style={{
            fontSize: 8.5,
            fontFamily: 'var(--font-ui)',
            color: isOnline ? 'var(--dim)' : 'var(--pink)',
            letterSpacing: '0.1em',
          }}
        >
          {isOnline ? 'ONLINE' : isConnecting ? 'ULANMOQDA...' : 'OFFLINE'}
        </span>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <AnimatePresence mode="wait">
        {screen === 'login' && (
          <motion.div
            key="login"
            style={{ position: 'fixed', inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoginScreen onLogin={handleLogin} />
          </motion.div>
        )}

        {screen === 'menu' && (
          <motion.div
            key="menu"
            style={{ position: 'fixed', inset: 0 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <MenuScreen
              nickname={nickname}
              onSelectGame={handleSelectGame}
              onLogout={handleLogout}
            />
          </motion.div>
        )}

        {screen === 'select' && (
          <motion.div
            key="select"
            style={{ position: 'fixed', inset: 0 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <SelectScreen
              gameMode={selectedGame}
              onBack={() => dispatch({ type: 'SET_SCREEN', payload: 'menu' })}
              onCreate={handleCreateRoom}
              onJoin={handleJoinRoom}
            />
          </motion.div>
        )}

        {screen === 'lobby' && room && (
          <motion.div
            key="lobby"
            style={{ position: 'fixed', inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LobbyScreen
              room={room}
              nickname={nickname}
              socketId={socketId}
              onStart={handleStartGame}
              onLeave={handleLeaveRoom}
              onToggleReady={handleToggleReady}
              onSendChat={handleSendChat}
              chats={chats}
              typingUsers={typingUsers}
            />
          </motion.div>
        )}

        {screen === 'bura' && room && (
          <motion.div
            key="bura"
            style={{ position: 'fixed', inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BuraScreen
              room={room}
              gameState={gameState}
              myHand={myHand}
              socketId={socketId}
              nickname={nickname}
              onPlayCard={handleBuraPlay}
              onThrow={handleBuraThrow}
              onLeave={handleLeaveRoom}
              onPlayAgain={handlePlayAgain}
              onNextRound={handleNextRound}
            />
          </motion.div>
        )}

        {screen === '108' && room && (
          <motion.div
            key="108"
            style={{ position: 'fixed', inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Game108Screen
              room={room}
              gameState={gameState}
              myHand={myHand}
              socketId={socketId}
              nickname={nickname}
              onPlayCard={handle108Play}
              onDrawCard={handle108Draw}
              onLeave={handleLeaveRoom}
              onPlayAgain={handlePlayAgain}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}