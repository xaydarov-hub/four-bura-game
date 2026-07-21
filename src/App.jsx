/**
 * ═══════════════════════════════════════════════════════════════
 *  KARTA O'YINI — ULTRA PREMIUM FRONTEND (FIXED)
 * ═══════════════════════════════════════════════════════════════
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  startTransition,
  useDeferredValue,
  memo,
  useReducer,
  useLayoutEffect,
} from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { createPortal } from 'react-dom';

// ─── ENVIRONMENT CONFIGURATION ───────────────────────────────────

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEVELOPMENT = import.meta.env.DEV;

// ─── GLOBAL STYLES (CRITICAL CSS) ───────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }

  :root {
    /* Colors */
    --deep:      #020408;
    --mid:       #060c16;
    --surface:   #0b1425;
    --surface2:  #0f1e38;
    --surface3:  #132040;
    --gold:      #f5c842;
    --gold2:     #ffaa00;
    --gold3:     #e6b422;
    --cyan:      #00e5ff;
    --cyan2:     #00b8d4;
    --pink:      #ff2d6e;
    --pink2:     #d9205a;
    --green:     #00ff94;
    --green2:    #00cc7a;
    --purple:    #a855f7;
    --purple2:   #8b35e8;
    --red:       #ff3b5c;
    --blue:      #4488ff;
    --text:      #dde8ff;
    --text2:     #a8c0e8;
    --dim:       #4a6080;
    --dimmer:    #2a3a50;
    --darkest:   #020408;
    --card-w:    #f0f5ff;
    --card-s:    #e4ecff;
    --card-b:    #d0d8ea;
    
    /* Typography */
    --font-d:    'Cinzel Decorative', serif;
    --font-ui:   'Orbitron', monospace;
    --font-b:    'Rajdhani', sans-serif;
    
    /* Shadows */
    --shadow-sm:  0 2px 8px rgba(0,0,0,0.3);
    --shadow-md:  0 4px 20px rgba(0,0,0,0.4);
    --shadow-lg:  0 8px 40px rgba(0,0,0,0.5);
    --shadow-xl:  0 16px 60px rgba(0,0,0,0.6);
    --shadow-2xl: 0 24px 80px rgba(0,0,0,0.7);
    
    /* Transitions */
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-bounce: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  html, body, #root {
    width: 100%;
    height: 100%;
    background: var(--deep);
    color: var(--text);
    font-family: var(--font-b);
    overflow: hidden;
    user-select: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: var(--deep); }
  ::-webkit-scrollbar-thumb { 
    background: var(--cyan); 
    border-radius: 2px;
    transition: background var(--transition-fast);
  }
  ::-webkit-scrollbar-thumb:hover { background: var(--cyan2); }

  :focus-visible {
    outline: 2px solid var(--cyan);
    outline-offset: 2px;
  }

  input, button {
    font-family: var(--font-b);
  }

  @keyframes bg-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes float-y {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes float-x {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-10px); }
  }
  
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.4; filter: blur(20px); }
    50% { opacity: 0.8; filter: blur(30px); }
  }
  
  @keyframes spin-slow {
    to { transform: rotate(360deg); }
  }
  
  @keyframes deal-in {
    from { 
      transform: translateY(-60px) rotate(-12deg) scale(0.7); 
      opacity: 0; 
    }
    to { 
      transform: translateY(0) rotate(0deg) scale(1); 
      opacity: 1; 
    }
  }
  
  @keyframes deal-out {
    from { 
      transform: translateY(0) rotate(0deg) scale(1); 
      opacity: 1; 
    }
    to { 
      transform: translateY(60px) rotate(12deg) scale(0.7); 
      opacity: 0; 
    }
  }
  
  @keyframes particle-rise {
    0% { transform: translateY(0) scale(1); opacity: 0.8; }
    100% { transform: translateY(-120px) scale(0); opacity: 0; }
  }
  
  @keyframes scan {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(110vh); }
  }
  
  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 200%; }
  }
  
  @keyframes shimmer-reverse {
    0% { right: -100%; }
    100% { right: 200%; }
  }
  
  @keyframes bounce-in {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    15% { transform: translateX(-8px) rotate(-2deg); }
    30% { transform: translateX(8px) rotate(2deg); }
    45% { transform: translateX(-6px) rotate(-1deg); }
    60% { transform: translateX(6px) rotate(1deg); }
    80% { transform: translateX(-3px); }
  }
  
  @keyframes winner-flash {
    0%, 100% { box-shadow: 0 0 20px var(--gold), 0 0 40px rgba(245,200,66,0.3); }
    50% { box-shadow: 0 0 60px var(--gold), 0 0 100px var(--gold2), 0 0 140px rgba(245,200,66,0.2); }
  }
  
  @keyframes loser-flash {
    0%, 100% { box-shadow: 0 0 20px var(--pink), 0 0 40px rgba(255,45,110,0.3); }
    50% { box-shadow: 0 0 60px var(--pink), 0 0 100px var(--pink2), 0 0 140px rgba(255,45,110,0.2); }
  }
  
  @keyframes confetti-fall {
    0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  
  @keyframes card-slide-in {
    from { transform: translateX(40px) scale(0.9); opacity: 0; }
    to { transform: translateX(0) scale(1); opacity: 1; }
  }

  @keyframes card-slide-out {
    from { transform: translateX(0) scale(1); opacity: 1; }
    to { transform: translateX(-40px) scale(0.9); opacity: 0; }
  }

  @keyframes glow-rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes text-reveal {
    from { clip-path: inset(0 100% 0 0); }
    to { clip-path: inset(0 0 0 0); }
  }

  .glass {
    background: rgba(11, 20, 37, 0.75);
    backdrop-filter: blur(24px) saturate(1.2);
    -webkit-backdrop-filter: blur(24px) saturate(1.2);
    border: 1px solid rgba(0, 229, 255, 0.12);
  }
  
  .glass-light {
    background: rgba(15, 30, 56, 0.6);
    backdrop-filter: blur(16px) saturate(1.1);
    -webkit-backdrop-filter: blur(16px) saturate(1.1);
    border: 1px solid rgba(255, 255, 255, 0.07);
  }
  
  .glass-dark {
    background: rgba(2, 4, 8, 0.8);
    backdrop-filter: blur(20px) saturate(1.1);
    -webkit-backdrop-filter: blur(20px) saturate(1.1);
    border: 1px solid rgba(0, 229, 255, 0.06);
  }
  
  .neon-cyan { text-shadow: 0 0 10px var(--cyan), 0 0 30px var(--cyan), 0 0 60px rgba(0,229,255,0.3); }
  .neon-gold { text-shadow: 0 0 10px var(--gold), 0 0 30px var(--gold), 0 0 60px rgba(245,200,66,0.3); }
  .neon-pink { text-shadow: 0 0 10px var(--pink), 0 0 30px var(--pink), 0 0 60px rgba(255,45,110,0.3); }
  .neon-green { text-shadow: 0 0 10px var(--green), 0 0 30px var(--green), 0 0 60px rgba(0,255,148,0.3); }

  .shimmer-line {
    position: absolute;
    top: 0;
    width: 30%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
    animation: shimmer 3s infinite;
    pointer-events: none;
  }
  
  .shimmer-line-reverse {
    position: absolute;
    top: 0;
    width: 30%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
    animation: shimmer-reverse 3s infinite;
    pointer-events: none;
  }

  .scan-line {
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent);
    animation: scan 8s linear infinite;
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
let socketListeners = new Map();

function getSocketInstance() {
  if (!socketInstance) {
    socketInstance = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      forceNew: false,
    });
  }
  return socketInstance;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────

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
const CARD_BACK_PATTERN = 'repeating-linear-gradient(45deg, rgba(0,229,255,.04) 0px, rgba(0,229,255,.04) 3px, transparent 3px, transparent 9px)';

const PENALTY_RULES = Object.freeze([
  { min: 61, max: 120, penalty: 0, label: '0 shtraf', color: 'var(--green)' },
  { min: 32, max: 60, penalty: 2, label: '2 shtraf', color: 'var(--cyan)' },
  { min: 1, max: 31, penalty: 4, label: '4 shtraf', color: 'var(--gold)' },
  { min: 0, max: 0, penalty: 6, label: '6 shtraf', color: 'var(--red)' },
]);

const POSITION_STYLES = Object.freeze({
  bottom: { position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', flexDirection: 'column' },
  top: { position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', flexDirection: 'column-reverse' },
  left: { position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', flexDirection: 'row' },
  right: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', flexDirection: 'row-reverse' },
});

// ─── AUDIO ENGINE ──────────────────────────────────────────────────

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.gainNode = null;
    this.isMuted = false;
    this.volume = 0.8;
    this.activeSounds = new Set();
    this._init();
  }

  _init() {
    if (typeof window === 'undefined') return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.ctx.destination);
      this.isInitialized = true;
    } catch (e) {
      console.warn('[AudioEngine] Failed to initialize:', e);
    }
  }

  _ensureReady() {
    if (!this.isInitialized) {
      this._init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.isInitialized && this.ctx;
  }

  _createOscillator(frequency, duration, type = 'sine', volume = 0.25) {
    if (!this._ensureReady() || this.isMuted) return null;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.gainNode);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
      return { osc, gain };
    } catch (e) {
      return null;
    }
  }

  _playTone(frequency, duration, type = 'sine', volume = 0.25) {
    const sound = this._createOscillator(frequency, duration, type, volume);
    if (sound) {
      this.activeSounds.add(sound);
      setTimeout(() => this.activeSounds.delete(sound), duration * 1000 + 50);
    }
  }

  _playSequence(frequencies, durations, type = 'sine', volume = 0.2) {
    frequencies.forEach((freq, i) => {
      const dur = Array.isArray(durations) ? durations[i] || 0.1 : 0.1;
      setTimeout(() => this._playTone(freq, dur, type, volume), i * 75);
    });
  }

  playShuffle() {
    this._playSequence([220, 280, 340, 400, 460], [0.06, 0.06, 0.06, 0.06, 0.08], 'triangle', 0.15);
  }

  playDeal() {
    this._playSequence([280, 320, 360, 400], [0.06, 0.06, 0.06, 0.08], 'triangle', 0.18);
  }

  playCardPlay() {
    this._playTone(440, 0.08, 'triangle', 0.2);
    setTimeout(() => this._playTone(550, 0.06, 'triangle', 0.15), 50);
  }

  playCardThrow() {
    this._playTone(220, 0.15, 'sawtooth', 0.2);
  }

  playCardDraw() {
    this._playTone(300, 0.12, 'sawtooth', 0.15);
  }

  playWin() {
    this._playSequence([523, 659, 784, 1047, 1319, 1568], [0.15, 0.15, 0.15, 0.15, 0.2, 0.25], 'sine', 0.25);
    setTimeout(() => {
      this._playSequence([1568, 1319, 1047, 784, 659, 523], [0.08, 0.08, 0.08, 0.08, 0.1, 0.15], 'sine', 0.15);
    }, 1000);
  }

  playLose() {
    this._playSequence([400, 350, 300, 250], [0.15, 0.15, 0.15, 0.2], 'sawtooth', 0.2);
  }

  playNotification() {
    this._playTone(880, 0.05, 'sine', 0.15);
    setTimeout(() => this._playTone(1100, 0.05, 'sine', 0.12), 100);
    setTimeout(() => this._playTone(1320, 0.08, 'sine', 0.1), 200);
  }

  playCountdown() {
    this._playTone(660, 0.06, 'square', 0.12);
  }

  playTurn() {
    this._playTone(500, 0.06, 'sine', 0.18);
    setTimeout(() => this._playTone(600, 0.06, 'sine', 0.15), 80);
  }

  playButtonClick() {
    this._playTone(800, 0.04, 'square', 0.12);
  }

  playError() {
    this._playTone(180, 0.3, 'sawtooth', 0.25);
    setTimeout(() => this._playTone(150, 0.2, 'sawtooth', 0.2), 200);
  }

  playJoin() {
    this._playTone(660, 0.12, 'sine', 0.2);
    setTimeout(() => this._playTone(880, 0.1, 'sine', 0.15), 120);
  }

  playLeave() {
    this._playTone(440, 0.1, 'sine', 0.15);
    setTimeout(() => this._playTone(330, 0.12, 'sine', 0.12), 100);
  }

  playVictory() {
    this._playSequence([523, 659, 784, 1047, 1319, 1568, 1760, 1976], [0.1, 0.1, 0.1, 0.1, 0.12, 0.12, 0.15, 0.2], 'sine', 0.2);
  }

  playCombination() {
    this._playSequence([440, 554, 659, 880, 1109, 1319], [0.08, 0.08, 0.08, 0.08, 0.1, 0.15], 'sine', 0.22);
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  dispose() {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
    }
    this.activeSounds.clear();
  }
}

const audioEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
const SFX = audioEngine || {
  playShuffle: () => {},
  playDeal: () => {},
  playCardPlay: () => {},
  playCardThrow: () => {},
  playCardDraw: () => {},
  playWin: () => {},
  playLose: () => {},
  playNotification: () => {},
  playCountdown: () => {},
  playTurn: () => {},
  playButtonClick: () => {},
  playError: () => {},
  playJoin: () => {},
  playLeave: () => {},
  playVictory: () => {},
  playCombination: () => {},
  setVolume: () => {},
  toggleMute: () => false,
  dispose: () => {},
};

// ─── USE REDUCER ──────────────────────────────────────────────────

const APP_INITIAL_STATE = {
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
  connectionAttempts: 0,
};

function appReducer(state, action) {
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
    case 'INCREMENT_CONNECTION_ATTEMPTS':
      return { ...state, connectionAttempts: state.connectionAttempts + 1 };
    case 'RESET_CONNECTION_ATTEMPTS':
      return { ...state, connectionAttempts: 0 };
    case 'RESET_GAME':
      return {
        ...state,
        room: null,
        gameState: null,
        myHand: [],
        chats: [],
        typingUsers: [],
      };
    case 'RESET_ALL':
      return {
        ...APP_INITIAL_STATE,
        nickname: state.nickname,
      };
    default:
      return state;
  }
}

// ─── TOAST CONTAINER ──────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 380,
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ x: 60, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 60, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              fontSize: 12,
              fontFamily: 'var(--font-ui)',
              letterSpacing: '0.05em',
              pointerEvents: 'auto',
              background:
                toast.type === 'error'
                  ? 'rgba(255,45,110,0.15)'
                  : toast.type === 'success'
                  ? 'rgba(0,255,148,0.12)'
                  : 'rgba(0,229,255,0.12)',
              border: `1px solid ${
                toast.type === 'error'
                  ? 'var(--pink)'
                  : toast.type === 'success'
                  ? 'var(--green)'
                  : 'var(--cyan)'
              }`,
              color:
                toast.type === 'error'
                  ? 'var(--pink)'
                  : toast.type === 'success'
                  ? 'var(--green)'
                  : 'var(--cyan)',
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>
              {toast.type === 'error'
                ? '⚠️'
                : toast.type === 'success'
                ? '✅'
                : 'ℹ️'}
            </span>
            <span style={{ flex: 1 }}>{toast.msg}</span>
            <button
              onClick={() => onRemove(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: 14,
                opacity: 0.6,
                padding: 4,
              }}
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

// ─── BACKGROUND COMPONENT ─────────────────────────────────────────

const Background = memo(function Background({ variant = 'default' }) {
  const orbs = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: 150 + Math.random() * 350,
        color: [
          'rgba(0,229,255,0.04)',
          'rgba(168,85,247,0.05)',
          'rgba(245,200,66,0.04)',
          'rgba(255,45,110,0.04)',
          'rgba(0,255,148,0.03)',
          'rgba(68,136,255,0.04)',
        ][i % 6],
        duration: 10 + Math.random() * 12,
        delay: Math.random() * 6,
        size2: 100 + Math.random() * 200,
      })),
    []
  );

  const bgGradient = useMemo(
    () =>
      variant === 'game'
        ? 'radial-gradient(ellipse at 30% 20%, #041a10 0%, #020408 60%)'
        : 'radial-gradient(ellipse at 20% 10%, #050d1a 0%, #020408 60%)',
    [variant]
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgGradient,
        }}
      />

      {orbs.map((orb) => (
        <div
          key={orb.id}
          style={{
            position: 'absolute',
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
            animation: `float-y ${orb.duration}s ease-in-out ${orb.delay}s infinite`,
            willChange: 'transform',
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '2px',
          background:
            'linear-gradient(90deg, transparent, rgba(0,229,255,0.12), transparent)',
          animation: 'scan 12s linear infinite',
          willChange: 'transform',
        }}
      />

      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.02,
        }}
      >
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00e5ff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
    </div>
  );
});

Background.displayName = 'Background';

// ─── CARD COMPONENT ───────────────────────────────────────────────

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
  glow = false,
  className = '',
  style = {},
}) {
  const [isHovered, setIsHovered] = useState(false);

  const width = small ? 50 : 68;
  const height = small ? 72 : 100;

  const cardColor = card ? SUIT_CLR[card.suit] : '#fff';
  const cardSymbol = card ? SUIT_SYM[card.suit] : '';
  const cardRank = card?.rank || '';

  const handleClick = useCallback(() => {
    if (playable && onClick) {
      SFX.playButtonClick();
      onClick(card);
    }
  }, [playable, onClick, card]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  if (faceDown) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: animDelay, type: 'spring', stiffness: 300, damping: 25 }}
        whileHover={playable ? { scale: 1.05, y: -6 } : {}}
        whileTap={playable ? { scale: 0.95 } : {}}
        style={{
          width,
          height,
          borderRadius: 8,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #0a1a3a 0%, #152040 50%, #0a1220 100%)',
          border: '1px solid rgba(0,229,255,0.2)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: playable ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }}
      >
        <div
          style={{
            width: '80%',
            height: '80%',
            border: '1px solid rgba(0,229,255,0.1)',
            borderRadius: 4,
            backgroundImage: CARD_BACK_PATTERN,
          }}
        />
        <div className="shimmer-line" />
      </motion.div>
    );
  }

  if (!card) return null;

  const isPlayable = playable && !!onClick;

  return (
    <motion.div
      role="button"
      tabIndex={isPlayable ? 0 : -1}
      aria-label={`${cardRank} ${cardSymbol}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      whileHover={
        isPlayable && !selected
          ? { scale: 1.08, y: -8, transition: { type: 'spring', stiffness: 400, damping: 25 } }
          : {}
      }
      whileTap={isPlayable ? { scale: 0.92 } : {}}
      style={{
        width,
        height,
        borderRadius: 8,
        flexShrink: 0,
        background: selected
          ? 'linear-gradient(145deg, #1a3a26, #0d2418)'
          : 'linear-gradient(145deg, #f4f8ff 0%, #e4ecff 100%)',
        border: trump
          ? '2px solid var(--gold)'
          : selected
          ? '2.5px solid var(--green)'
          : isPlayable
          ? '2px solid rgba(0,229,255,0.6)'
          : '1px solid rgba(180,200,240,0.2)',
        boxShadow: trump
          ? '0 0 20px rgba(245,200,66,0.4), var(--shadow-md)'
          : selected
          ? '0 0 25px rgba(0,255,148,0.5), 0 -12px 0 0 rgba(0,255,148,0.15)'
          : isPlayable
          ? `0 0 15px rgba(0,229,255,0.3), var(--shadow-md)`
          : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: small ? '4px 5px' : '6px 8px',
        cursor: isPlayable ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        willChange: 'transform, box-shadow',
        ...style,
      }}
    >
      <div style={{ color: cardColor, lineHeight: 1 }}>
        <div
          style={{
            fontSize: small ? 11 : 14,
            fontWeight: 900,
            fontFamily: 'var(--font-ui)',
            letterSpacing: '-0.02em',
          }}
        >
          {cardRank}
        </div>
        <div style={{ fontSize: small ? 10 : 13 }}>{cardSymbol}</div>
      </div>

      <div
        style={{
          textAlign: 'center',
          color: cardColor,
          fontSize: small ? 18 : 28,
          textShadow: `0 0 8px ${cardColor}40`,
          lineHeight: 1,
        }}
      >
        {cardSymbol}
      </div>

      <div
        style={{
          color: cardColor,
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
            letterSpacing: '-0.02em',
          }}
        >
          {cardRank}
        </div>
        <div style={{ fontSize: small ? 10 : 13 }}>{cardSymbol}</div>
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
            background: `linear-gradient(90deg, transparent, var(--cyan), transparent)`,
            borderRadius: '0 0 8px 8px',
            opacity: isHovered ? 1 : 0.4,
            transition: 'opacity 0.2s',
          }}
        />
      )}

      {glow && (
        <div
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 10,
            background: 'radial-gradient(circle at center, rgba(0,229,255,0.15), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.div>
  );
});

Card.displayName = 'Card';

// ─── BUTTON COMPONENT ─────────────────────────────────────────────

const Button = memo(function Button({
  children,
  onClick,
  color = 'cyan',
  disabled = false,
  small = false,
  full = false,
  loading = false,
  style = {},
  className = '',
  type = 'button',
  icon = null,
}) {
  const colorMap = useMemo(
    () => ({
      cyan: { color: 'var(--cyan)', bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.4)', glow: 'rgba(0,229,255,0.2)' },
      gold: { color: 'var(--gold)', bg: 'rgba(245,200,66,0.08)', border: 'rgba(245,200,66,0.4)', glow: 'rgba(245,200,66,0.2)' },
      pink: { color: 'var(--pink)', bg: 'rgba(255,45,110,0.08)', border: 'rgba(255,45,110,0.4)', glow: 'rgba(255,45,110,0.2)' },
      green: { color: 'var(--green)', bg: 'rgba(0,255,148,0.08)', border: 'rgba(0,255,148,0.4)', glow: 'rgba(0,255,148,0.2)' },
      purple: { color: 'var(--purple)', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.4)', glow: 'rgba(168,85,247,0.2)' },
      red: { color: 'var(--red)', bg: 'rgba(255,59,92,0.08)', border: 'rgba(255,59,92,0.4)', glow: 'rgba(255,59,92,0.2)' },
    }),
    []
  );

  const colors = colorMap[color] || colorMap.cyan;

  const handleClick = useCallback(
    (e) => {
      if (!disabled && !loading && onClick) {
        SFX.playButtonClick();
        onClick(e);
      }
    },
    [disabled, loading, onClick]
  );

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.96 } : {}}
      style={{
        background: disabled || loading ? 'rgba(255,255,255,0.04)' : colors.bg,
        border: `1px solid ${disabled || loading ? 'rgba(255,255,255,0.08)' : colors.border}`,
        color: disabled || loading ? 'rgba(255,255,255,0.25)' : colors.color,
        padding: small ? '8px 16px' : '12px 24px',
        borderRadius: 8,
        fontFamily: 'var(--font-ui)',
        fontSize: small ? 10 : 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        boxShadow: disabled || loading ? 'none' : `0 0 20px ${colors.glow}, inset 0 0 20px ${colors.glow}30`,
        transition: 'all 0.2s ease',
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
        <span style={{ display: 'inline-block', animation: 'spin-slow 1s linear infinite' }}>⏳</span>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

// ─── INPUT COMPONENT ──────────────────────────────────────────────

const Input = memo(function Input({
  value,
  onChange,
  placeholder = '',
  onKeyDown,
  autoFocus = false,
  maxLength = 20,
  disabled = false,
  type = 'text',
  className = '',
  style = {},
  label = '',
  error = '',
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [autoFocus]);

  const handleChange = useCallback((e) => {
    if (onChange) onChange(e.target.value);
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    if (onKeyDown) onKeyDown(e);
  }, [onKeyDown]);

  return (
    <div style={{ width: '100%', ...style }}>
      {label && (
        <label style={{
          display: 'block',
          color: 'var(--dim)',
          fontFamily: 'var(--font-ui)',
          fontSize: 10,
          letterSpacing: '0.15em',
          marginBottom: 6,
          textTransform: 'uppercase',
        }}>
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        style={{
          background: 'rgba(0,229,255,0.05)',
          border: error ? '1px solid var(--pink)' : '1px solid rgba(0,229,255,0.3)',
          borderRadius: 8,
          color: disabled ? 'var(--dim)' : 'var(--cyan)',
          padding: '12px 16px',
          fontSize: 15,
          fontFamily: 'var(--font-b)',
          letterSpacing: '0.04em',
          outline: 'none',
          width: '100%',
          boxShadow: error ? '0 0 20px rgba(255,45,110,0.15)' : '0 0 20px rgba(0,229,255,0.08)',
          transition: 'all 0.3s ease',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.5 : 1,
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.borderColor = 'var(--cyan)';
            e.target.style.boxShadow = '0 0 30px rgba(0,229,255,0.2)';
          }
        }}
        onBlur={(e) => {
          if (!disabled) {
            e.target.style.borderColor = error ? 'var(--pink)' : 'rgba(0,229,255,0.3)';
            e.target.style.boxShadow = error ? '0 0 20px rgba(255,45,110,0.15)' : '0 0 20px rgba(0,229,255,0.08)';
          }
        }}
      />
      {error && (
        <p style={{ color: 'var(--pink)', fontSize: 11, marginTop: 4, fontFamily: 'var(--font-b)' }}>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// ─── SCREEN: LOGIN ────────────────────────────────────────────────

const LoginScreen = memo(function LoginScreen({ onLogin }) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedNickname = localStorage.getItem('karta_nick');
    if (savedNickname) setNickname(savedNickname);
    const timer = setTimeout(() => setIsReady(true), 1600);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = nickname.trim();
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
  }, [nickname, onLogin]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleSubmit();
  }, [handleSubmit]);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <Background />
      <AnimatePresence mode="wait">
        {!isReady ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            style={{ textAlign: 'center', zIndex: 1 }}
          >
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
              style={{ fontSize: 88, marginBottom: 20 }}
            >
              🎴
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontFamily: 'var(--font-d)',
                fontSize: 'clamp(28px, 6vw, 52px)',
                color: 'var(--gold)',
                textShadow: '0 0 30px var(--gold), 0 0 60px rgba(245,200,66,0.2)',
                letterSpacing: '0.04em',
              }}
            >
              KARTA O'YINI
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{
                color: 'var(--cyan)',
                fontFamily: 'var(--font-ui)',
                fontSize: 10,
                letterSpacing: '0.3em',
                marginTop: 8,
                textShadow: '0 0 20px rgba(0,229,255,0.3)',
              }}
            >
              TO'RT BURA • 108 • ONLINE MULTIPLAYER
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ zIndex: 1, width: '100%', maxWidth: 420, padding: '0 20px' }}
          >
            <div className="glass" style={{
              borderRadius: 20,
              padding: '44px 36px',
              boxShadow: 'var(--shadow-2xl), 0 0 80px rgba(0,229,255,0.05)',
              border: '1px solid rgba(0,229,255,0.08)',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: 52, marginBottom: 14 }}
                >
                  🎴
                </motion.div>
                <h1 style={{
                  fontFamily: 'var(--font-d)',
                  fontSize: 22,
                  color: 'var(--gold)',
                  textShadow: '0 0 20px var(--gold)',
                }}>
                  KARTA O'YINI
                </h1>
                <p style={{
                  color: 'var(--dim)',
                  fontSize: 11,
                  marginTop: 8,
                  fontFamily: 'var(--font-ui)',
                  letterSpacing: '0.15em',
                }}>
                  NICKNAME KIRITING
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <Input
                  value={nickname}
                  onChange={setNickname}
                  placeholder="Ismingiz..."
                  autoFocus
                  onKeyDown={handleKeyDown}
                  maxLength={16}
                  error={error}
                />
              </div>

              <Button
                color="gold"
                onClick={handleSubmit}
                disabled={nickname.trim().length < 2 || loading}
                full
                loading={loading}
                style={{ padding: '14px', fontSize: 13 }}
              >
                {loading ? 'YUKLANMOQDA...' : "O'YINGA KIRISH →"}
              </Button>

              <p style={{
                textAlign: 'center',
                color: 'var(--dimmer)',
                fontSize: 10,
                marginTop: 18,
                fontFamily: 'var(--font-ui)',
                letterSpacing: '0.05em',
              }}>
                O'ZBEKISTON • ONLINE KARTA O'YINI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

LoginScreen.displayName = 'LoginScreen';

// ─── SCREEN: MENU ─────────────────────────────────────────────────

const MenuScreen = memo(function MenuScreen({ nickname, onSelectGame, onLogout }) {
  const games = useMemo(() => [
    {
      id: 'bura',
      icon: '🃏',
      title: "TO'RT BURA",
      subtitle: '2 yoki 4 kishilik',
      description: "Oʻzbek klassik kozel oʻyini. Kartalar bilan trick yutib, 61+ ball yigʻing. 12 jarima = yutqazding!",
      rules: ['Tuz=11, 10=10, Shoh=4, Dama=3, Valet=2', 'Kozir istalgan kartani uradi', 'Jarima: 61+=0, 32-60=2, 1-31=4, 0=6 shtraf'],
      color: 'var(--gold)',
      glow: 'rgba(245,200,66,0.12)',
    },
    {
      id: '108',
      icon: '🔥',
      title: '108',
      subtitle: '2-6 kishilik',
      description: "Kartalardan qutuling! Maxsus kartalar bilan raqibga karta bering yoki uning navbatini o'tkazib yuboring.",
      rules: ['6=+2 karta, 7=+1 karta, K♠=+4 karta', 'Dama=suit o\'zgartirish, 8=skip, Valet=burilish', 'Birinchi kartasiz qolgan g\'alaba!'],
      color: 'var(--pink)',
      glow: 'rgba(255,45,110,0.12)',
    },
  ], []);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
      <Background />

      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        zIndex: 1,
        background: 'rgba(2,4,8,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,229,255,0.06)',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 16, color: 'var(--gold)', textShadow: '0 0 15px var(--gold)' }}>
            KARTA O'YINI
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)', letterSpacing: '0.2em' }}>
            ONLINE MULTIPLAYER
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
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
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
            {nickname}
          </div>
          <Button small color="red" onClick={onLogout}>CHIQISH</Button>
        </div>
      </header>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        zIndex: 1,
        gap: 'clamp(16px, 3vw, 40px)',
        flexWrap: 'wrap',
        alignContent: 'center',
      }}>
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12, type: 'spring', stiffness: 120 }}
            onClick={() => { SFX.playJoin(); onSelectGame(game.id); }}
            whileHover={{ scale: 1.03, y: -8 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: 'clamp(260px, 38vw, 360px)',
              padding: '36px 30px',
              borderRadius: 20,
              background: `radial-gradient(circle at 25% 25%, ${game.glow}, rgba(11,20,37,0.9))`,
              border: `1px solid ${game.color}35`,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 0 60px ${game.glow}, var(--shadow-xl)`,
              animation: `float-y ${7 + index * 2}s ease-in-out ${index * 1.5}s infinite`,
            }}
          >
            <div className="shimmer-line" />
            <div style={{ fontSize: 56, marginBottom: 18, textAlign: 'center', animation: `float-y 4s ease-in-out ${index * 0.5}s infinite` }}>
              {game.icon}
            </div>
            <h2 style={{
              fontFamily: 'var(--font-d)',
              fontSize: 20,
              color: game.color,
              textShadow: `0 0 20px ${game.color}`,
              textAlign: 'center',
              marginBottom: 6,
            }}>
              {game.title}
            </h2>
            <div style={{
              textAlign: 'center',
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              color: game.color,
              opacity: 0.7,
              letterSpacing: '0.15em',
              marginBottom: 14,
            }}>
              {game.subtitle}
            </div>
            <p style={{ color: 'rgba(180,210,255,0.55)', fontSize: 12.5, textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
              {game.description}
            </p>
            <div style={{ borderTop: `1px solid ${game.color}20`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {game.rules.map((rule, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: game.color, fontSize: 10, flexShrink: 0, marginTop: 1 }}>▸</span>
                  <span style={{ color: 'var(--dim)', fontSize: 11, lineHeight: 1.4 }}>{rule}</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 22,
              padding: '11px',
              borderRadius: 8,
              textAlign: 'center',
              background: `${game.color}12`,
              border: `1px solid ${game.color}25`,
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              color: game.color,
              letterSpacing: '0.1em',
            }}>
              O'YNASH →
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

MenuScreen.displayName = 'MenuScreen';

// ─── SCREEN: SELECT GAME ─────────────────────────────────────────

const SelectScreen = memo(function SelectScreen({ gameMode, onBack, onCreate, onJoin }) {
  const [tab, setTab] = useState('create');
  const [gameType, setGameType] = useState('2p');
  const [deckCount, setDeckCount] = useState(1);
  const [roomCode, setRoomCode] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const isBura = gameMode === 'bura';

  const handleCreate = useCallback(() => {
    setIsBusy(true);
    onCreate({ gameMode, gameType, deckCount });
  }, [gameMode, gameType, deckCount, onCreate]);

  const handleJoin = useCallback(() => {
    if (roomCode.length === 6) {
      setIsBusy(true);
      onJoin(roomCode);
    }
  }, [roomCode, onJoin]);

  const handleCodeChange = useCallback((value) => {
    setRoomCode(value.replace(/\D/g, '').slice(0, 6));
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && roomCode.length === 6) {
      handleJoin();
    }
  }, [roomCode, handleJoin]);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, overflowY: 'auto' }}>
      <Background />
      <div style={{ zIndex: 1, maxWidth: 500, margin: '0 auto', width: '100%', padding: '20px 18px' }}>
        <Button small onClick={onBack} style={{ marginBottom: 22 }}>← ORQAGA</Button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 46, marginBottom: 10 }}>{isBura ? '🃏' : '🔥'}</div>
          <h1 style={{
            fontFamily: 'var(--font-d)',
            fontSize: 22,
            color: isBura ? 'var(--gold)' : 'var(--pink)',
            textShadow: `0 0 20px ${isBura ? 'var(--gold)' : 'var(--pink)'}`,
          }}>
            {isBura ? "TO'RT BURA" : '108'}
          </h1>
        </div>

        <div style={{
          display: 'flex',
          gap: 3,
          marginBottom: 22,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 9,
          padding: 3,
          border: '1px solid rgba(0,229,255,0.06)',
        }}>
          {[['create', '+ XONA YARATISH'], ['join', '→ XONAGA KIRISH']].map(([tabId, label]) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 7,
                background: tab === tabId ? 'rgba(0,229,255,0.1)' : 'transparent',
                border: tab === tabId ? '1px solid rgba(0,229,255,0.25)' : '1px solid transparent',
                color: tab === tabId ? 'var(--cyan)' : 'var(--dim)',
                fontFamily: 'var(--font-ui)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'create' ? (
            <motion.div key="create" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass" style={{ borderRadius: 16, padding: '26px 22px' }}>
                {isBura && (
                  <div style={{ marginBottom: 22 }}>
                    <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.15em', marginBottom: 10 }}>
                      O'YINCHILAR SONI
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[['2p', '2 KISHILIK'], ['4p', '4 KISHILIK (2v2)']].map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => setGameType(value)}
                          style={{
                            flex: 1,
                            padding: '13px 8px',
                            borderRadius: 8,
                            background: gameType === value ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${gameType === value ? 'var(--gold)' : 'rgba(255,255,255,0.06)'}`,
                            color: gameType === value ? 'var(--gold)' : 'var(--dim)',
                            fontFamily: 'var(--font-ui)',
                            fontSize: 10.5,
                            fontWeight: 700,
                            letterSpacing: '0.07em',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!isBura && (
                  <div style={{ marginBottom: 22 }}>
                    <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.15em', marginBottom: 10 }}>
                      DAST SONI
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3].map((count) => (
                        <button
                          key={count}
                          onClick={() => setDeckCount(count)}
                          style={{
                            flex: 1,
                            padding: '13px 8px',
                            borderRadius: 8,
                            background: deckCount === count ? 'rgba(255,45,110,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${deckCount === count ? 'var(--pink)' : 'rgba(255,255,255,0.06)'}`,
                            color: deckCount === count ? 'var(--pink)' : 'var(--dim)',
                            fontFamily: 'var(--font-ui)',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {count} DAST
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button color={isBura ? 'gold' : 'pink'} onClick={handleCreate} full loading={isBusy} style={{ padding: '14px', fontSize: 13 }}>
                  XONA YARATISH
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="join" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass" style={{ borderRadius: 16, padding: '26px 22px' }}>
                <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.15em', marginBottom: 10 }}>
                  XONA KODI (6 RAQAM)
                </p>
                <div style={{ marginBottom: 18 }}>
                  <Input
                    value={roomCode}
                    onChange={handleCodeChange}
                    placeholder="123456"
                    maxLength={6}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                </div>
                <Button
                  color="cyan"
                  disabled={roomCode.length !== 6 || isBusy}
                  onClick={handleJoin}
                  full
                  loading={isBusy}
                  style={{ padding: '14px', fontSize: 13 }}
                >
                  {isBusy ? 'KIRILMOQDA...' : 'XONAGA KIRISH →'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

SelectScreen.displayName = 'SelectScreen';

// ─── SCREEN: LOBBY ────────────────────────────────────────────────

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
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const chatContainerRef = useRef(null);

  const isHost = room.host === socketId;
  const isReady = room.readyPlayers?.includes(socketId) || false;
  const canStart = isHost && room.players.length >= room.minPlayers;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chats]);

  const handleCopyCode = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(room.id).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [room.id]);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (trimmed) {
      onSendChat(trimmed);
      setMessage('');
    }
  }, [message, onSendChat]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const avatarColor = useCallback((name) => `hsl(${name.charCodeAt(0) * 13 % 360}, 55%, 28%)`, []);
  const avatarBorder = useCallback((name) => `hsl(${name.charCodeAt(0) * 13 % 360}, 75%, 50%)`, []);

  const playersList = useMemo(() => {
    const list = [];
    for (let i = 0; i < room.maxPlayers; i++) {
      list.push(room.players[i] || null);
    }
    return list;
  }, [room.players, room.maxPlayers]);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20 }}>
      <Background />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1,
        overflow: 'hidden',
        maxWidth: 680,
        margin: '0 auto',
        width: '100%',
        padding: '14px 16px',
      }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 16, color: 'var(--gold)', textShadow: '0 0 12px var(--gold)' }}>
              {room.gameMode === 'bura' ? "TO'RT BURA" : '108'} — LOBBY
            </h2>
            <p style={{ color: 'var(--dim)', fontSize: 10, fontFamily: 'var(--font-ui)' }}>
              {room.players.length}/{room.maxPlayers} O'YINCHI • {room.gameMode === 'bura'
                ? room.gameType === '4p' ? '4 KISHILIK 2v2' : '2 KISHILIK'
                : `${room.deckCount} DAST`}
            </p>
          </div>
          <Button small color="red" onClick={onLeave}>CHIQISH</Button>
        </header>

        <div className="glass" style={{ borderRadius: 12, padding: '14px 18px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '0.2em', marginBottom: 3 }}>XONA KODI</p>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 26, fontWeight: 900, color: 'var(--cyan)', letterSpacing: '0.3em', textShadow: '0 0 20px var(--cyan)' }}>
              {room.id}
            </div>
          </div>
          <Button small color="cyan" onClick={handleCopyCode}>{copied ? '✓ NUSXA' : 'NUSXA OLISH'}</Button>
        </div>

        <div className="glass" style={{ borderRadius: 12, padding: '14px', marginBottom: 12 }}>
          <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '0.2em', marginBottom: 10 }}>O'YINCHILAR</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {playersList.map((player, index) => {
              const isMe = player?.id === socketId;
              const isHostPlayer = player?.id === room.host;
              const isReadyPlayer = room.readyPlayers?.includes(player?.id);

              return (
                <motion.div
                  key={index}
                  initial={player ? { scale: 0.85, opacity: 0 } : {}}
                  animate={player ? { scale: 1, opacity: 1 } : {}}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: player ? (isMe ? 'rgba(0,229,255,0.07)' : 'rgba(255,255,255,0.03)') : 'rgba(255,255,255,0.015)',
                    border: player ? (isMe ? '1px solid rgba(0,229,255,0.2)' : '1px solid rgba(255,255,255,0.06)') : '1px dashed rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {player ? (
                    <>
                      <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: avatarColor(player.nickname),
                        border: `2px solid ${avatarBorder(player.nickname)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                      }}>
                        {player.nickname[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {player.nickname} {isMe && <span style={{ color: 'var(--cyan)', fontSize: 9 }}>(sen)</span>}
                        </div>
                        <div style={{ fontSize: 9.5, fontFamily: 'var(--font-ui)', color: isHostPlayer ? 'var(--gold)' : isReadyPlayer ? 'var(--green)' : 'var(--dim)' }}>
                          {isHostPlayer ? '👑 HOST' : isReadyPlayer ? '✓ TAYYOR' : 'kutmoqda...'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <motion.div
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{ color: 'var(--dimmer)', fontSize: 11, fontFamily: 'var(--font-ui)', width: '100%', textAlign: 'center' }}
                    >
                      BO'SH SLOT...
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="glass" style={{ borderRadius: 12, padding: '12px', marginBottom: 12, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '0.2em', marginBottom: 8 }}>CHAT</p>
          <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', marginBottom: 8, minHeight: 0, paddingRight: 4 }}>
            {chats.map((chat) => (
              <div key={chat.id} style={{ marginBottom: 5, display: 'flex', gap: 7, alignItems: 'baseline' }}>
                <span style={{ color: 'var(--cyan)', fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}>{chat.nickname}:</span>
                <span style={{ color: 'var(--text)', fontSize: 12.5 }}>{chat.text}</span>
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
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Xabar yozing..."
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
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(0,229,255,0.3)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(0,229,255,0.12)'; }}
            />
            <Button small onClick={handleSend}>↑</Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {!isHost && (
            <Button color={isReady ? 'green' : 'cyan'} onClick={onToggleReady} full style={{ padding: '12px' }}>
              {isReady ? '✓ TAYYOR' : 'TAYYOR'}
            </Button>
          )}
          {isHost && (
            <Button color="gold" disabled={!canStart} onClick={onStart} full style={{ padding: '12px', fontSize: 13 }}>
              {canStart ? '▶ BOSHLASH' : `KUTISH... (${room.players.length}/${room.minPlayers})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

LobbyScreen.displayName = 'LobbyScreen';

// ─── BURA: ROUND OVER SCREEN ─────────────────────────────────────

const BuraRoundOver = memo(function BuraRoundOver({ gameState, room, socketId, onNextRound, onLeave }) {
  const players = room.players;
  const summary = gameState?.roundSummary || {};
  const isHost = room.host === socketId;

  useEffect(() => { SFX.playNotification(); }, []);

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
          boxShadow: 'var(--shadow-2xl), 0 0 80px rgba(0,229,255,0.05)',
          textAlign: 'center',
          zIndex: 1,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 14 }}>📊</div>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 20, color: 'var(--cyan)', textShadow: '0 0 20px var(--cyan)', marginBottom: 6 }}>
          RAUND YAKUNLANDI
        </h2>
        <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 10, marginBottom: 24 }}>
          RAUND #{gameState?.roundNumber || 1}
        </p>

        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)', marginBottom: 8, letterSpacing: '0.1em' }}>JARIMA QOIDASI</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {PENALTY_RULES.map((rule) => (
              <div key={rule.min} style={{ padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 9, fontFamily: 'var(--font-ui)', color: rule.color }}>
                {rule.min}-{rule.max}: {rule.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 26 }}>
          {players.map((player) => {
            const stats = summary[player.id] || {};
            const penalty = gameState?.penalties?.[player.id] || 0;
            return (
              <div key={player.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text)' }}>
                    {player.nickname}
                    {player.id === socketId && <span style={{ color: 'var(--cyan)', fontSize: 9, marginLeft: 4 }}>(sen)</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)', marginTop: 2 }}>
                    Jami jarima: <span style={{ color: penalty >= 9 ? 'var(--red)' : 'var(--text)' }}>{penalty}</span>/12
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{stats.points || 0} ball</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: stats.penalty === 0 ? 'var(--green)' : stats.penalty === 6 ? 'var(--red)' : 'var(--pink)' }}>
                    +{stats.penalty || 0} shtraf
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {isHost && <Button color="gold" onClick={onNextRound}>▶ KEYINGI RAUND</Button>}
          <Button color="cyan" onClick={onLeave}>← MENU</Button>
        </div>
        {!isHost && <p style={{ color: 'var(--dim)', fontSize: 10, marginTop: 14, fontFamily: 'var(--font-ui)' }}>Host keyingi raundni boshlashini kuting...</p>}
      </motion.div>
    </div>
  );
});

BuraRoundOver.displayName = 'BuraRoundOver';

// ─── BURA: GAME OVER SCREEN ──────────────────────────────────────

const BuraGameOver = memo(function BuraGameOver({ gameState, room, socketId, onPlayAgain, onLeave }) {
  const players = room.players;
  const winner = gameState?.winner;
  const isTeam = room.gameType === '4p';

  const iWon = useMemo(() => {
    if (isTeam) {
      const myTeam = gameState?.teams?.team1?.includes(socketId) ? 'team1' : 'team2';
      return winner === myTeam;
    }
    return winner === socketId;
  }, [isTeam, winner, socketId, gameState]);

  useEffect(() => {
    if (iWon) { SFX.playVictory(); SFX.playWin(); } else { SFX.playLose(); }
  }, [iWon]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => (gameState?.penalties?.[a.id] || 0) - (gameState?.penalties?.[b.id] || 0));
  }, [players, gameState]);

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
          boxShadow: `var(--shadow-2xl), 0 0 100px ${iWon ? 'rgba(245,200,66,0.08)' : 'rgba(255,45,110,0.06)'}`,
          textAlign: 'center',
          zIndex: 1,
          animation: iWon ? 'winner-flash 2s infinite' : 'loser-flash 2s infinite',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>{iWon ? '🏆' : '💀'}</div>
        <h2 style={{
          fontFamily: 'var(--font-d)',
          fontSize: 22,
          color: iWon ? 'var(--gold)' : 'var(--pink)',
          textShadow: `0 0 30px ${iWon ? 'var(--gold)' : 'var(--pink)'}`,
          marginBottom: 8,
        }}>
          {iWon ? "G'ALABA!" : "YUTQAZDINGIZ"}
        </h2>
        <p style={{ color: 'var(--dim)', fontSize: 13, marginBottom: 28 }}>
          {isTeam
            ? iWon ? 'Sizning jamoangiz g\'alaba qildi!' : 'Raqib jamoa g\'alaba qildi'
            : iWon ? 'Tabriklaymiz! Siz eng kam jarima yigʻdingiz!' : `${gameState?.winnerNickname || players.find((p) => p.id === winner)?.nickname} gʻalaba qildi!`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {sortedPlayers.map((player, rank) => {
            const penalty = gameState?.penalties?.[player.id] || 0;
            const isLoser = penalty >= 12;
            return (
              <div key={player.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: 10,
                background: rank === 0 ? 'rgba(245,200,66,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${rank === 0 ? 'rgba(245,200,66,0.3)' : isLoser ? 'rgba(255,45,110,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: rank === 0 ? 'var(--gold)' : isLoser ? 'var(--red)' : 'var(--dim)' }}>
                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : '💀'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: rank === 0 ? 'var(--gold)' : 'var(--text)' }}>{player.nickname}</span>
                  {player.id === socketId && <span style={{ fontSize: 9, color: 'var(--cyan)' }}>(sen)</span>}
                </div>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700, color: isLoser ? 'var(--red)' : rank === 0 ? 'var(--gold)' : 'var(--text)' }}>
                  {penalty} shtraf
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {room.host === socketId && <Button color="gold" onClick={onPlayAgain}>🔄 QAYTA O'YNASH</Button>}
          <Button color="cyan" onClick={onLeave}>← BOSH MENU</Button>
        </div>
        {room.host !== socketId && <p style={{ color: 'var(--dim)', fontSize: 10, marginTop: 14, fontFamily: 'var(--font-ui)' }}>Host qayta boshlashini kuting...</p>}
      </motion.div>
    </div>
  );
});

BuraGameOver.displayName = 'BuraGameOver';

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
  const [selectedCard, setSelectedCard] = useState(null);
  const [shakeCardId, setShakeCardId] = useState(null);

  const players = room.players;
  const myIndex = players.findIndex((p) => p.id === socketId);
  const trumpSuit = gameState?.trumpSuit;
  const isAttacker = gameState?.attackerId === socketId;
  const isDefender = gameState?.defenderId === socketId;
  const isMyTurn = gameState?.currentPlayer === socketId;
  const isPhase2 = gameState?.phase2;

  const playableCardIds = useMemo(() => {
    if (!myHand || !gameState || !isMyTurn) return new Set();

    if (isPhase2 === 'attacking' && isAttacker) {
      return new Set(myHand.map((card) => card.id));
    }

    if (isPhase2 === 'defending' && isDefender) {
      const lastAttack = gameState.attackCards?.[gameState.attackCards.length - 1];
      if (!lastAttack) return new Set();

      return new Set(
        myHand
          .filter((card) => {
            if (card.suit === lastAttack.suit) {
              return RANK_ORDER.indexOf(card.rank) > RANK_ORDER.indexOf(lastAttack.rank);
            }
            if (card.suit === trumpSuit && lastAttack.suit !== trumpSuit) {
              return true;
            }
            return false;
          })
          .map((card) => card.id)
      );
    }

    return new Set();
  }, [myHand, gameState, isMyTurn, isAttacker, isDefender, isPhase2, trumpSuit]);

  const handleCardClick = useCallback((card) => {
    if (!playableCardIds.has(card.id)) {
      setShakeCardId(card.id);
      SFX.playError();
      setTimeout(() => setShakeCardId(null), 500);
      return;
    }

    if (selectedCard?.id === card.id) {
      SFX.playCardPlay();
      onPlayCard(card.id);
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  }, [playableCardIds, selectedCard, onPlayCard]);

  const handleThrowClick = useCallback(() => {
    SFX.playCardThrow();
    onThrow();
    setSelectedCard(null);
  }, [onThrow]);

  if (gameState?.phase === 'roundOver') {
    return <BuraRoundOver gameState={gameState} room={room} socketId={socketId} onNextRound={onNextRound} onLeave={onLeave} />;
  }

  if (gameState?.phase === 'gameOver') {
    return <BuraGameOver gameState={gameState} room={room} socketId={socketId} onPlayAgain={onPlayAgain} onLeave={onLeave} />;
  }

  const getPosition = useCallback((index) => {
    const relative = (index - myIndex + players.length) % players.length;
    if (players.length === 2) return relative === 0 ? 'bottom' : 'top';
    return ['bottom', 'right', 'top', 'left'][relative] || 'top';
  }, [myIndex, players.length]);

  const renderPenaltyBar = useCallback((penalty) => {
    return Array.from({ length: 12 }, (_, i) => (
      <div key={i} style={{
        width: 8,
        height: 8,
        borderRadius: 2,
        background: i < penalty ? 'var(--red)' : 'rgba(255,255,255,0.08)',
        border: i < penalty ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.05)',
      }} />
    ));
  }, []);

  const myPenalty = gameState?.penalties?.[socketId] || 0;
  const myScore = gameState?.scores?.[socketId] || 0;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, overflow: 'hidden' }}>
      <Background variant="game" />

      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        zIndex: 10,
        background: 'rgba(2,4,8,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,229,255,0.06)',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {trumpSuit && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(245,200,66,0.1)',
              border: '1px solid rgba(245,200,66,0.25)',
            }}>
              <span style={{ color: SUIT_CLR[trumpSuit], fontSize: 18 }}>{SUIT_SYM[trumpSuit]}</span>
              <span style={{ color: 'var(--gold)', fontSize: 9, fontFamily: 'var(--font-ui)' }}>KOZIR</span>
            </div>
          )}
          {gameState?.deckRemaining > 0 && (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--dim)' }}>🃏 {gameState.deckRemaining}</div>
          )}
          {gameState?.teams ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ padding: '4px 8px', borderRadius: 4, background: 'rgba(0,229,255,0.07)', fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--cyan)' }}>
                JAMOA 1: {gameState.teamScores?.team1 || 0}pts
              </div>
              <div style={{ padding: '4px 8px', borderRadius: 4, background: 'rgba(255,45,110,0.07)', fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--pink)' }}>
                JAMOA 2: {gameState.teamScores?.team2 || 0}pts
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {players.map((player) => (
                <div key={player.id} style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: player.id === socketId ? 'rgba(0,229,255,0.07)' : 'rgba(255,255,255,0.03)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 10,
                  color: player.id === socketId ? 'var(--cyan)' : 'var(--dim)',
                }}>
                  {player.nickname.slice(0, 8)}: {gameState?.scores?.[player.id] || 0}pt
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)' }}>JARIMA:</span>
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', maxWidth: 120 }}>{renderPenaltyBar(myPenalty)}</div>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: myPenalty >= 9 ? 'var(--red)' : 'var(--dim)' }}>
              {myPenalty}/12
            </span>
          </div>
          <Button small color="red" onClick={onLeave}>✕</Button>
        </div>
      </header>

      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{
          width: 'min(80vw, 480px)',
          height: 'min(42vw, 260px)',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, #1d5c35 0%, #0e3a1e 55%, #071811 100%)',
          border: '5px solid rgba(255,215,0,0.15)',
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,80,30,0.15), inset 0 0 40px rgba(0,100,40,0.1)',
          position: 'absolute',
        }} />

        {players.map((player, index) => {
          if (player.id === socketId) return null;
          const position = getPosition(index);
          const isCurrent = gameState?.currentPlayer === player.id;
          const isAtt = gameState?.attackerId === player.id;
          const isDef = gameState?.defenderId === player.id;
          const handSize = gameState?.handSizes?.[player.id] || 0;
          const penalty = gameState?.penalties?.[player.id] || 0;

          const style = POSITION_STYLES[position] || POSITION_STYLES.bottom;

          return (
            <div key={player.id} style={{ display: 'flex', gap: 6, zIndex: 5, ...style }}>
              <div style={{
                padding: '6px 12px',
                borderRadius: 8,
                textAlign: 'center',
                background: isCurrent ? 'rgba(0,255,148,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isCurrent ? 'var(--green)' : isAtt ? 'rgba(255,200,66,0.3)' : isDef ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: isCurrent ? '0 0 20px rgba(0,255,148,0.2)' : 'none',
                minWidth: 80,
              }}>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--font-ui)', color: isCurrent ? 'var(--green)' : 'var(--text)', marginBottom: 2 }}>
                  {player.nickname}
                  {isAtt && <span style={{ color: 'var(--gold)', fontSize: 8 }}> ⚔</span>}
                  {isDef && <span style={{ color: 'var(--cyan)', fontSize: 8 }}> 🛡</span>}
                </div>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: 'var(--dim)' }}>🃏×{handSize}</span>
                  <span style={{ fontSize: 9, color: penalty >= 9 ? 'var(--red)' : 'var(--dim)' }}>⚡{penalty}</span>
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                {Array.from({ length: Math.min(handSize, 6) }).map((_, ci) => (
                  <div key={ci} style={{
                    width: 24,
                    height: 36,
                    borderRadius: 4,
                    marginLeft: ci > 0 ? -10 : 0,
                    zIndex: ci,
                    background: 'linear-gradient(135deg, #0a1a3a, #152040)',
                    border: '1px solid rgba(0,229,255,0.15)',
                  }} />
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ position: 'absolute', display: 'flex', gap: 8, zIndex: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
            <AnimatePresence>
              {(gameState?.attackCards || []).map((card, index) => {
                const defended = gameState?.defendCards?.[index];
                return (
                  <motion.div
                    key={card.id}
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: index % 2 === 0 ? -6 : 6 }}
                    exit={{ scale: 0, rotate: 15 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    style={{ position: 'relative' }}
                  >
                    <Card card={card} small trump={card.suit === trumpSuit} />
                    {defended && (
                      <motion.div
                        initial={{ scale: 0, rotate: 0 }}
                        animate={{ scale: 1, rotate: 12 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                        style={{ position: 'absolute', top: -4, left: 4, zIndex: 1 }}
                      >
                        <Card card={defended} small trump={defended.suit === trumpSuit} />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {gameState?.trumpCard && gameState?.deckRemaining > 0 && (
          <div style={{ position: 'absolute', right: '4%', top: '50%', transform: 'translateY(-50%)', zIndex: 5, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--gold)', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>KOZIR KARTI</div>
            <Card card={gameState.trumpCard} small trump />
            <div style={{ fontSize: 9, color: 'var(--dim)', fontFamily: 'var(--font-ui)', marginTop: 3 }}>{gameState.deckRemaining} karta</div>
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
                  textShadow: `0 0 20px ${isAttacker ? 'var(--gold)' : 'var(--cyan)'}`,
                }}
              >
                {isAttacker ? '⚔ HUJUM QILING' : '🛡 HIMOYA QILING'}
              </motion.div>
            ) : gameState?.currentPlayer && (
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
                {players.find((p) => p.id === gameState.currentPlayer)?.nickname} o'ynamoqda...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ position: 'absolute', left: '2%', top: '50%', transform: 'translateY(-50%)', zIndex: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(BURA_POINTS).filter(([_, value]) => value > 0).map(([rank, points]) => (
            <div key={rank} style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)', fontWeight: 700 }}>{rank}</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8, color: 'var(--dimmer)' }}>=</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, color: 'var(--gold)' }}>{points}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(2,4,8,0.92)', backdropFilter: 'blur(14px)', borderTop: '1px solid rgba(0,229,255,0.06)', padding: '10px 8px 18px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: isMyTurn ? (isAttacker ? 'var(--gold)' : 'var(--cyan)') : 'var(--dim)' }}>
            {nickname}{isAttacker ? ' • ⚔ HUJUMCHI' : isDefender ? ' • 🛡 HIMOYACHI' : ''}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)' }}>
            BALL: <span style={{ color: 'var(--text)' }}>{myScore}</span>
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: myPenalty >= 9 ? 'var(--red)' : 'var(--dim)' }}>
            JARIMA: <span style={{ color: myPenalty >= 9 ? 'var(--red)' : 'var(--text)' }}>{myPenalty}</span>/12
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'nowrap', overflowX: 'auto', paddingTop: 18, paddingBottom: 4 }}>
          <AnimatePresence>
            {(myHand || []).map((card, index) => (
              <Card
                key={card.id}
                card={card}
                onClick={handleCardClick}
                selected={selectedCard?.id === card.id}
                playable={playableCardIds.has(card.id) && isMyTurn}
                trump={card.suit === trumpSuit}
                animDelay={index * 0.05}
                shake={shakeCardId === card.id}
              />
            ))}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
          {selectedCard && isMyTurn && playableCardIds.has(selectedCard.id) && (
            <Button
              small
              color={isAttacker ? 'gold' : 'cyan'}
              onClick={() => { SFX.playCardPlay(); onPlayCard(selectedCard.id); setSelectedCard(null); }}
            >
              ▶ {selectedCard.rank}{SUIT_SYM[selectedCard.suit]} O'YNASH
            </Button>
          )}
          {isDefender && isMyTurn && isPhase2 === 'defending' && (gameState?.attackCards || []).length > 0 && (
            <Button small color="red" onClick={handleThrowClick}>✕ TASHLAB YUBORISH</Button>
          )}
        </div>
      </div>
    </div>
  );
});

BuraScreen.displayName = 'BuraScreen';

// ─── 108 GAME SCREEN ─────────────────────────────────────────────

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
  const [selectedCard, setSelectedCard] = useState(null);
  const [showSuitModal, setShowSuitModal] = useState(false);

  const isMyTurn = gameState?.currentPlayer === socketId;
  const topCard = gameState?.topCard;
  const pendingDraw = gameState?.pendingDraw || 0;
  const effectiveSuit = gameState?.suitRequest || gameState?.currentSuit;

  const playableCardIds = useMemo(() => {
    if (!isMyTurn || !myHand || !gameState) return new Set();

    return new Set(
      myHand
        .filter((card) => {
          if (pendingDraw > 0) {
            return card.rank === '6' || card.rank === '7' || (card.rank === 'K' && card.suit === 'spades');
          }
          if (card.rank === '8') {
            return card.suit === effectiveSuit;
          }
          return card.suit === effectiveSuit || card.rank === gameState.currentRank;
        })
        .map((card) => card.id)
    );
  }, [isMyTurn, myHand, gameState, pendingDraw, effectiveSuit]);

  const handleCardClick = useCallback((card) => {
    if (!isMyTurn || !playableCardIds.has(card.id)) {
      SFX.playError();
      return;
    }

    if (card.rank === 'Q') {
      setSelectedCard(card);
      setShowSuitModal(true);
    } else {
      SFX.playCardPlay();
      onPlayCard(card.id, null);
    }
  }, [isMyTurn, playableCardIds, onPlayCard]);

  const handleSuitSelect = useCallback((suit) => {
    if (selectedCard) {
      SFX.playCardPlay();
      onPlayCard(selectedCard.id, suit);
      setShowSuitModal(false);
      setSelectedCard(null);
    }
  }, [selectedCard, onPlayCard]);

  const handleDrawClick = useCallback(() => {
    SFX.playCardDraw();
    onDrawCard();
  }, [onDrawCard]);

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
            boxShadow: 'var(--shadow-2xl)',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>{iWon ? '🏆' : '💀'}</div>
          <h2 style={{
            fontFamily: 'var(--font-d)',
            fontSize: 22,
            color: iWon ? 'var(--green)' : 'var(--pink)',
            textShadow: `0 0 20px ${iWon ? 'var(--green)' : 'var(--pink)'}`,
            marginBottom: 8,
          }}>
            {iWon ? "G'ALABA!" : "YUTQAZDINGIZ"}
          </h2>
          <p style={{ color: 'var(--dim)', marginBottom: 28 }}>
            {gameState.winnerNickname} barcha kartasidan qutulib gʻalaba qildi!
          </p>
          <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {room.players.map((player) => (
              <div key={player.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: player.id === gameState.winner ? 'var(--green)' : 'var(--text)' }}>
                  {player.nickname}
                </span>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--dim)' }}>
                  🃏 {gameState.handSizes?.[player.id] || 0} qoldi
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {room.host === socketId && <Button color="green" onClick={onPlayAgain}>🔄 QAYTA</Button>}
            <Button color="cyan" onClick={onLeave}>← MENU</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, overflow: 'hidden' }}>
      <Background variant="game" />

      <AnimatePresence>
        {showSuitModal && (
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
              <h3 style={{ fontFamily: 'var(--font-d)', fontSize: 16, color: 'var(--gold)', marginBottom: 20 }}>SUIT TANLANG (QUEEN)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {SUIT_ORDER.map((suit) => (
                  <motion.button
                    key={suit}
                    onClick={() => handleSuitSelect(suit)}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: `2px solid ${SUIT_CLR[suit]}`,
                      cursor: 'pointer',
                      color: SUIT_CLR[suit],
                      fontSize: 26,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{SUIT_SYM[suit]}</span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-ui)' }}>{SUIT_LBL[suit]}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header style={{
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
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {room.players.map((player) => {
            const isCurrent = gameState?.currentPlayer === player.id;
            return (
              <div key={player.id} style={{
                padding: '4px 9px',
                borderRadius: 5,
                background: isCurrent ? 'rgba(0,255,148,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isCurrent ? 'var(--green)' : 'rgba(255,255,255,0.06)'}`,
                fontFamily: 'var(--font-ui)',
                fontSize: 10,
                color: isCurrent ? 'var(--green)' : player.id === socketId ? 'var(--cyan)' : 'var(--dim)',
              }}>
                {player.nickname.slice(0, 8)} 🃏{gameState?.handSizes?.[player.id] || 0}
              </div>
            );
          })}
        </div>
        <Button small color="red" onClick={onLeave}>✕</Button>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--cyan)' }}>
          {gameState?.direction === 1 ? '↻ Soat yo\'nalishi' : '↺ Teskari yo\'nalish'}
        </div>

        {pendingDraw > 0 && (
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
            ⚠ +{pendingDraw} KARTA OLISH KERAK
          </motion.div>
        )}

        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--dim)', fontFamily: 'var(--font-ui)', marginBottom: 6 }}>
              DAST ({gameState?.drawPileCount || 0})
            </div>
            <motion.div
              whileHover={isMyTurn ? { scale: 1.06 } : {}}
              whileTap={isMyTurn ? { scale: 0.94 } : {}}
              onClick={isMyTurn ? handleDrawClick : undefined}
              style={{ cursor: isMyTurn ? 'pointer' : 'default' }}
            >
              <Card faceDown />
            </motion.div>
            {isMyTurn && (
              <div style={{ marginTop: 8 }}>
                <Button small color="cyan" onClick={handleDrawClick}>
                  {pendingDraw > 0 ? `+${pendingDraw} KARTA AL` : 'KARTA OLISH'}
                </Button>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--dim)', fontFamily: 'var(--font-ui)', marginBottom: 6 }}>
              TASHLANGAN {gameState?.suitRequest && `(${SUIT_LBL[gameState.suitRequest]} ZAKAZ)`}
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
            {effectiveSuit && (
              <div style={{ marginTop: 6, fontSize: 22, color: SUIT_CLR[effectiveSuit] }}>
                {SUIT_SYM[effectiveSuit]}
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

      <div style={{ background: 'rgba(2,4,8,0.92)', backdropFilter: 'blur(14px)', borderTop: '1px solid rgba(0,229,255,0.06)', padding: '10px 6px 16px', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: 6, fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)' }}>
          {nickname} • {myHand?.length || 0} karta
        </div>
        <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'nowrap', overflowX: 'auto', paddingTop: 14, paddingBottom: 4 }}>
          {(myHand || []).map((card, index) => (
            <Card
              key={card.id}
              card={card}
              onClick={handleCardClick}
              playable={playableCardIds.has(card.id) && isMyTurn}
              animDelay={index * 0.04}
              small
            />
          ))}
        </div>
      </div>
    </div>
  );
});

Game108Screen.displayName = 'Game108Screen';

// ─── MAIN APP ─────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(appReducer, APP_INITIAL_STATE);
  const socketRef = useRef(null);
  const typingTimeoutsRef = useRef({});

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

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    dispatch({ type: 'ADD_TOAST', payload: { id, msg: message, type } });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  useEffect(() => {
    const socket = getSocketInstance();
    socketRef.current = socket;

    const handleConnect = () => {
      dispatch({ type: 'SET_ONLINE', payload: true });
      dispatch({ type: 'SET_CONNECTING', payload: false });
      dispatch({ type: 'RESET_CONNECTION_ATTEMPTS' });
      dispatch({ type: 'SET_SOCKET_ID', payload: socket.id });
      const saved = localStorage.getItem('karta_nick');
      if (saved) {
        socket.emit('register', { nickname: saved });
      }
    };

    const handleDisconnect = (reason) => {
      dispatch({ type: 'SET_ONLINE', payload: false });
      if (reason === 'io client disconnect') return;
      addToast('Ulanish uzildi. Qayta ulanmoqda...', 'error');
      dispatch({ type: 'INCREMENT_CONNECTION_ATTEMPTS' });
    };

    const handleConnectError = () => {
      dispatch({ type: 'SET_CONNECTING', payload: true });
    };

    const handleReconnectAttempt = () => {
      dispatch({ type: 'SET_CONNECTING', payload: true });
    };

    const handleReconnectFailed = () => {
      dispatch({ type: 'SET_CONNECTING', payload: false });
      addToast('Serverga ulanish amalga oshmadi. Iltimos, keyinroq qayta urinib koʻring.', 'error');
    };

    const onRegistered = ({ nickname: nick }) => {
      dispatch({ type: 'SET_NICKNAME', payload: nick });
      if (screen === 'login') {
        dispatch({ type: 'SET_SCREEN', payload: 'menu' });
      }
    };

    const onError = ({ msg }) => {
      addToast(msg, 'error');
      SFX.playError();
    };

    const onRoomCreated = ({ room: newRoom }) => {
      dispatch({ type: 'SET_ROOM', payload: newRoom });
      dispatch({ type: 'SET_CHATS', payload: newRoom.chat || [] });
      dispatch({ type: 'SET_SCREEN', payload: 'lobby' });
      SFX.playJoin();
    };

    const onRoomJoined = ({ room: newRoom }) => {
      dispatch({ type: 'SET_ROOM', payload: newRoom });
      dispatch({ type: 'SET_CHATS', payload: newRoom.chat || [] });
      dispatch({ type: 'SET_SCREEN', payload: 'lobby' });
      SFX.playJoin();
    };

    const onRoomUpdate = ({ room: updatedRoom }) => {
      dispatch({ type: 'SET_ROOM', payload: updatedRoom });
    };

    const onPlayerJoined = ({ nickname: nick }) => {
      addToast(`${nick} qoʻshildi!`, 'success');
      SFX.playJoin();
    };

    const onPlayerLeft = ({ nickname: nick, room: updatedRoom }) => {
      addToast(`${nick} chiqdi`, 'info');
      if (updatedRoom) {
        dispatch({ type: 'SET_ROOM', payload: updatedRoom });
      }
      SFX.playLeave();
    };

    const onGameStarted = ({ room: updatedRoom }) => {
      dispatch({ type: 'SET_ROOM', payload: updatedRoom });
      dispatch({ type: 'SET_MY_HAND', payload: [] });
      dispatch({ type: 'SET_GAME_STATE', payload: null });
      SFX.playDeal();
      SFX.playShuffle();
    };

    const onDealCards = ({ hand }) => {
      dispatch({ type: 'SET_MY_HAND', payload: hand });
      SFX.playDeal();
    };

    const onHandUpdate = ({ hand }) => {
      dispatch({ type: 'SET_MY_HAND', payload: hand });
    };

    const onGameState = (state) => {
      dispatch({ type: 'SET_GAME_STATE', payload: state });
      if (screen === 'lobby' && state) {
        const gameMode = room?.gameMode || selectedGame;
        if (gameMode === 'bura' || gameMode === '108') {
          dispatch({ type: 'SET_SCREEN', payload: gameMode });
        }
      }
      if (state?.phase === 'roundOver') {
        SFX.playNotification();
      }
      if (state?.phase === 'gameOver') {
        if (state.winner === socketId) {
          SFX.playVictory();
        } else {
          SFX.playLose();
        }
      }
    };

    const onRoundOver = (state) => {
      dispatch({ type: 'SET_GAME_STATE', payload: state });
    };

    const onGameOver = (state) => {
      dispatch({ type: 'SET_GAME_STATE', payload: { ...gameState, ...state, phase: 'gameOver' } });
    };

    const onGameCancelled = ({ reason, room: updatedRoom }) => {
      addToast(reason, 'error');
      if (updatedRoom) {
        dispatch({ type: 'SET_ROOM', payload: updatedRoom });
      }
      dispatch({ type: 'SET_GAME_STATE', payload: null });
      dispatch({ type: 'SET_MY_HAND', payload: [] });
      dispatch({ type: 'SET_SCREEN', payload: 'lobby' });
    };

    const onReturnToLobby = ({ room: updatedRoom }) => {
      dispatch({ type: 'SET_ROOM', payload: updatedRoom });
      dispatch({ type: 'SET_GAME_STATE', payload: null });
      dispatch({ type: 'SET_MY_HAND', payload: [] });
      dispatch({ type: 'SET_SCREEN', payload: 'lobby' });
    };

    const onChatMessage = (message) => {
      dispatch({ type: 'ADD_CHAT', payload: message });
    };

    const onTyping = ({ nickname: nick }) => {
      dispatch({ type: 'SET_TYPING_USERS', payload: [...new Set([...typingUsers, nick])] });
      clearTimeout(typingTimeoutsRef.current[nick]);
      typingTimeoutsRef.current[nick] = setTimeout(() => {
        dispatch({ type: 'SET_TYPING_USERS', payload: typingUsers.filter((u) => u !== nick) });
      }, 2000);
    };

    const onReconnected = ({ room: updatedRoom, gameState: restoredState }) => {
      dispatch({ type: 'SET_ROOM', payload: updatedRoom });
      if (restoredState?.hand) {
        dispatch({ type: 'SET_MY_HAND', payload: restoredState.hand });
      }
      if (restoredState?.public) {
        dispatch({ type: 'SET_GAME_STATE', payload: restoredState.public });
      }
      dispatch({ type: 'SET_CHATS', payload: updatedRoom.chat || [] });
      const targetScreen = updatedRoom.status === 'playing' ? updatedRoom.gameMode : 'lobby';
      dispatch({ type: 'SET_SCREEN', payload: targetScreen });
      addToast('Xonaga qayta ulandi!', 'success');
      SFX.playNotification();
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect_failed', handleReconnectFailed);
    socket.on('registered', onRegistered);
    socket.on('error', onError);
    socket.on('moveError', onError);
    socket.on('joinError', onError);
    socket.on('roomCreated', onRoomCreated);
    socket.on('roomJoined', onRoomJoined);
    socket.on('roomUpdate', onRoomUpdate);
    socket.on('playerJoined', onPlayerJoined);
    socket.on('playerLeft', onPlayerLeft);
    socket.on('gameStarted', onGameStarted);
    socket.on('dealCards', onDealCards);
    socket.on('handUpdate', onHandUpdate);
    socket.on('gameState', onGameState);
    socket.on('roundOver', onRoundOver);
    socket.on('gameOver', onGameOver);
    socket.on('gameCancelled', onGameCancelled);
    socket.on('returnToLobby', onReturnToLobby);
    socket.on('chatMessage', onChatMessage);
    socket.on('typing', onTyping);
    socket.on('reconnected', onReconnected);

    socket.connect();
    dispatch({ type: 'SET_CONNECTING', payload: true });

    return () => {
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect_failed', handleReconnectFailed);
      socket.off('registered', onRegistered);
      socket.off('error', onError);
      socket.off('moveError', onError);
      socket.off('joinError', onError);
      socket.off('roomCreated', onRoomCreated);
      socket.off('roomJoined', onRoomJoined);
      socket.off('roomUpdate', onRoomUpdate);
      socket.off('playerJoined', onPlayerJoined);
      socket.off('playerLeft', onPlayerLeft);
      socket.off('gameStarted', onGameStarted);
      socket.off('dealCards', onDealCards);
      socket.off('handUpdate', onHandUpdate);
      socket.off('gameState', onGameState);
      socket.off('roundOver', onRoundOver);
      socket.off('gameOver', onGameOver);
      socket.off('gameCancelled', onGameCancelled);
      socket.off('returnToLobby', onReturnToLobby);
      socket.off('chatMessage', onChatMessage);
      socket.off('typing', onTyping);
      socket.off('reconnected', onReconnected);
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  const handleLogin = useCallback((nick) => {
    dispatch({ type: 'SET_NICKNAME', payload: nick });
    if (socketRef.current) {
      socketRef.current.emit('register', { nickname: nick });
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

  const handleSelectGame = useCallback((gameId) => {
    dispatch({ type: 'SET_SELECTED_GAME', payload: gameId });
    dispatch({ type: 'SET_SCREEN', payload: 'select' });
  }, []);

  const handleCreateRoom = useCallback(({ gameMode, gameType, deckCount }) => {
    if (socketRef.current) {
      socketRef.current.emit('createRoom', { gameMode, gameType, deckCount });
    }
  }, []);

  const handleJoinRoom = useCallback((roomId) => {
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

  const handleSendChat = useCallback((text) => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('chatMessage', { roomId: room.id, text });
    }
  }, [room]);

  const handleBuraPlay = useCallback((cardId) => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('buraPlayCard', { roomId: room.id, cardId });
    }
  }, [room]);

  const handleBuraThrow = useCallback(() => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('buraThrow', { roomId: room.id });
    }
  }, [room]);

  const handle108Play = useCallback((cardId, chosenSuit) => {
    if (socketRef.current && room?.id) {
      socketRef.current.emit('108PlayCard', { roomId: room.id, cardId, chosenSuit });
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

  return (
    <div style={{ width: '100%', height: '100%', position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <div style={{
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
      }}>
        <div style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isOnline ? 'var(--green)' : 'var(--pink)',
          boxShadow: `0 0 8px ${isOnline ? 'var(--green)' : 'var(--pink)'}`,
        }} />
        <span style={{
          fontSize: 8.5,
          fontFamily: 'var(--font-ui)',
          color: isOnline ? 'var(--dim)' : 'var(--pink)',
          letterSpacing: '0.1em',
        }}>
          {isOnline ? 'ONLINE' : isConnecting ? 'ULANMOQDA...' : 'OFFLINE'}
        </span>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <AnimatePresence mode="wait">
        {screen === 'login' && (
          <motion.div key="login" style={{ position: 'fixed', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginScreen onLogin={handleLogin} />
          </motion.div>
        )}

        {screen === 'menu' && (
          <motion.div key="menu" style={{ position: 'fixed', inset: 0 }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <MenuScreen nickname={nickname} onSelectGame={handleSelectGame} onLogout={handleLogout} />
          </motion.div>
        )}

        {screen === 'select' && (
          <motion.div key="select" style={{ position: 'fixed', inset: 0 }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <SelectScreen gameMode={selectedGame} onBack={() => dispatch({ type: 'SET_SCREEN', payload: 'menu' })} onCreate={handleCreateRoom} onJoin={handleJoinRoom} />
          </motion.div>
        )}

        {screen === 'lobby' && room && (
          <motion.div key="lobby" style={{ position: 'fixed', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
          <motion.div key="bura" style={{ position: 'fixed', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
          <motion.div key="108" style={{ position: 'fixed', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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