/**
 * ═══════════════════════════════════════════════════════════════
 *  KARTA O'YINI — ULTRA PREMIUM FRONTEND + GAME ENGINE
 *  To'rt Bura (Kozel) + 108 — Real Multiplayer
 *  React + Socket.IO + Framer Motion
 *  PRODUCTION READY — ALL GAME RULES IMPLEMENTED
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
  @keyframes bura-flash {
    0%,100% { box-shadow:0 0 30px var(--gold), 0 0 60px var(--gold2); transform:scale(1); }
    50%      { box-shadow:0 0 60px var(--gold), 0 0 120px var(--gold2), 0 0 200px rgba(245,200,66,0.3); transform:scale(1.05); }
  }
  @keyframes moskva-flash {
    0%,100% { box-shadow:0 0 30px var(--purple), 0 0 60px var(--blue); transform:scale(1); }
    50%      { box-shadow:0 0 60px var(--purple), 0 0 120px var(--blue); transform:scale(1.05); }
  }
  @keyframes molodka-flash {
    0%,100% { box-shadow:0 0 30px var(--green), 0 0 60px var(--cyan); transform:scale(1); }
    50%      { box-shadow:0 0 60px var(--green), 0 0 120px var(--cyan); transform:scale(1.05); }
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
    _socket = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  }
  return _socket;
}

// ─── CONSTANTS ───────────────────────────────────────────────────
const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS = ['6', '7', '8', '9', 'J', 'Q', 'K', '10', 'A'];

const SUIT_SYM   = { spades:'♠', hearts:'♥', diamonds:'♦', clubs:'♣' };
const SUIT_CLR   = { spades:'#b8cce8', hearts:'#ff3b5c', diamonds:'#ff3b5c', clubs:'#b8cce8' };
const SUIT_LBL   = { spades:'Pik', hearts:'Qoʻr', diamonds:'Karo', clubs:'Treff' };

// Bura points
const BURA_PTS   = { A:11, '10':10, K:4, Q:3, J:2, 9:0, 8:0, 7:0, 6:0 };
const RANK_ORDER_BURA = ['A', '10', 'K', 'Q', 'J', '9', '8', '7', '6'];
const RANK_INDEX_BURA = RANK_ORDER_BURA.reduce((acc, r, i) => { acc[r] = i; return acc; }, {});

// 108 ranks
const RANK_ORDER_108 = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_INDEX_108 = RANK_ORDER_108.reduce((acc, r, i) => { acc[r] = i; return acc; }, {});

// ─── DETERMINISTIC SEEDED RANDOM ──────────────────────────────
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ─── DECK MANAGER ──────────────────────────────────────────────
function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}_${suit}`,
        rank,
        suit,
        points: BURA_PTS[rank] || 0,
      });
    }
  }
  return deck;
}

function shuffleDeck(deck, seed = Date.now()) {
  const rng = mulberry32(seed);
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function dealCards(deck, numPlayers, cardsPerPlayer = 4) {
  const hands = Array.from({ length: numPlayers }, () => []);
  const remaining = [...deck];
  for (let round = 0; round < cardsPerPlayer; round++) {
    for (let p = 0; p < numPlayers; p++) {
      if (remaining.length > 0) {
        hands[p].push(remaining.shift());
      }
    }
  }
  return { hands, remaining };
}

// ─── BURA GAME ENGINE ──────────────────────────────────────────
class BuraGameEngine {
  constructor(roomId, players, gameType = '2p') {
    this.roomId = roomId;
    this.players = players;
    this.gameType = gameType; // '2p' or '4p'
    this.isTeam = gameType === '4p';
    this.playerIds = players.map(p => p.id);
    this.numPlayers = players.length;

    // State
    this.roundNumber = 0;
    this.deck = [];
    this.trumpSuit = null;
    this.trumpCard = null;
    this.hands = {};
    this.handSizes = {};
    this.scores = {};
    this.penalties = {};
    this.teamScores = { team1: 0, team2: 0 };
    this.attackCards = [];
    this.defendCards = [];
    this.currentPlayer = null;
    this.attackerId = null;
    this.defenderId = null;
    this.phase = 'waiting'; // 'waiting', 'attacking', 'defending', 'roundOver', 'gameOver'
    this.phase2 = null; // 'attacking', 'defending' for phase2
    this.deckRemaining = 0;
    this.roundSummary = {};
    this.winner = null;
    this.winnerNickname = null;
    this.teams = null;

    // Initialize
    this.initializeRound();
  }

  initializeRound() {
    this.roundNumber++;
    this.attackCards = [];
    this.defendCards = [];
    this.phase = 'attacking';
    this.phase2 = 'attacking';
    this.roundSummary = {};

    // Create and shuffle deck
    const deck = createDeck();
    const seed = Date.now() + this.roundNumber * 1000 + this.roomId.length;
    this.deck = shuffleDeck(deck, seed);

    // Determine trump
    const trumpIndex = Math.floor(mulberry32(seed + 999)() * this.deck.length);
    this.trumpCard = this.deck.splice(trumpIndex, 1)[0];
    this.trumpSuit = this.trumpCard.suit;
    this.deckRemaining = this.deck.length;

    // Deal cards - 4 cards each
    const { hands, remaining } = dealCards(this.deck, this.numPlayers, 4);
    this.deck = remaining;
    this.deckRemaining = this.deck.length;

    this.hands = {};
    this.handSizes = {};
    this.scores = {};
    this.penalties = {};

    this.playerIds.forEach((id, idx) => {
      this.hands[id] = hands[idx] || [];
      this.handSizes[id] = this.hands[id].length;
      this.scores[id] = 0;
      this.penalties[id] = this.penalties[id] || 0;
    });

    // Set first attacker - left of dealer (player 0)
    this.attackerId = this.playerIds[0];
    this.defenderId = this.playerIds[1 % this.numPlayers];
    this.currentPlayer = this.attackerId;

    // Setup teams for 4p
    if (this.isTeam) {
      this.teams = {
        team1: [this.playerIds[0], this.playerIds[2]],
        team2: [this.playerIds[1], this.playerIds[3]],
      };
    }

    this.phase = 'attacking';
    this.phase2 = 'attacking';
  }

  // ─── PLAY CARD ─────────────────────────────────────────────────
  playCard(playerId, cardId) {
    if (this.phase === 'roundOver' || this.phase === 'gameOver') {
      return { error: 'Round or game already over' };
    }
    if (this.currentPlayer !== playerId) {
      return { error: 'Not your turn' };
    }

    const hand = this.hands[playerId];
    if (!hand) return { error: 'Player not found' };

    const cardIndex = hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { error: 'Card not in hand' };

    const card = hand[cardIndex];

    // VALIDATE MOVE
    const validation = this.validateMove(playerId, card);
    if (!validation.valid) {
      return { error: validation.error };
    }

    // Remove card from hand
    hand.splice(cardIndex, 1);

    if (this.phase2 === 'attacking') {
      // Attacker plays card
      this.attackCards.push(card);
      this.phase2 = 'defending';
      this.currentPlayer = this.defenderId;

      // Check for BURA, MOSKVA, MOLODKA
      const special = this.checkSpecialCombinations(playerId);
      if (special) {
        return { success: true, special, attackCards: this.attackCards };
      }

      return { success: true, attackCards: this.attackCards };
    } else if (this.phase2 === 'defending') {
      // Defender plays card
      const attackIndex = this.defendCards.length;
      if (attackIndex >= this.attackCards.length) {
        return { error: 'No attack card to defend' };
      }

      const attackCard = this.attackCards[attackIndex];
      const canDefend = this.canDefend(card, attackCard, this.trumpSuit);

      if (!canDefend) {
        // Put card back
        hand.push(card);
        return { error: 'Cannot defend with this card' };
      }

      this.defendCards.push(card);

      // Check if all attacks are defended
      if (this.defendCards.length === this.attackCards.length) {
        // All defended - attacker loses, defender wins trick
        this.resolveTrick('defender');
      } else {
        // Continue defending
        this.currentPlayer = this.defenderId;
      }

      return { success: true, attackCards: this.attackCards, defendCards: this.defendCards };
    }

    return { error: 'Invalid phase' };
  }

  // ─── THROW ─────────────────────────────────────────────────────
  throwCards(playerId) {
    if (this.phase === 'roundOver' || this.phase === 'gameOver') {
      return { error: 'Round or game already over' };
    }
    if (this.currentPlayer !== playerId) {
      return { error: 'Not your turn' };
    }
    if (this.phase2 !== 'defending') {
      return { error: 'Cannot throw while attacking' };
    }
    if (this.defenderId !== playerId) {
      return { error: 'Only defender can throw' };
    }

    // Defender throws - attacker wins
    this.resolveTrick('attacker');
    return { success: true };
  }

  // ─── VALIDATE MOVE ────────────────────────────────────────────
  validateMove(playerId, card) {
    if (this.phase === 'attacking' && this.phase2 === 'attacking') {
      // Attacker can play any card
      if (this.attackerId !== playerId) {
        return { valid: false, error: 'Only attacker can play' };
      }
      return { valid: true };
    }

    if (this.phase === 'attacking' && this.phase2 === 'defending') {
      if (this.defenderId !== playerId) {
        return { valid: false, error: 'Only defender can defend' };
      }

      const attackIndex = this.defendCards.length;
      if (attackIndex >= this.attackCards.length) {
        return { valid: false, error: 'No attack to defend' };
      }

      const attackCard = this.attackCards[attackIndex];
      if (!this.canDefend(card, attackCard, this.trumpSuit)) {
        return { valid: false, error: 'Cannot defend with this card' };
      }

      return { valid: true };
    }

    return { valid: false, error: 'Invalid phase' };
  }

  // ─── CAN DEFEND ───────────────────────────────────────────────
  canDefend(card, attackCard, trumpSuit) {
    // Same suit and higher rank
    if (card.suit === attackCard.suit) {
      return RANK_INDEX_BURA[card.rank] < RANK_INDEX_BURA[attackCard.rank];
    }
    // Trump beats non-trump
    if (card.suit === trumpSuit && attackCard.suit !== trumpSuit) {
      return true;
    }
    return false;
  }

  // ─── RESOLVE TRICK ─────────────────────────────────────────────
  resolveTrick(winner) {
    const allCards = [...this.attackCards, ...this.defendCards];
    const points = allCards.reduce((sum, c) => sum + (c.points || 0), 0);

    if (winner === 'attacker') {
      // Attacker gets all cards
      const attackerHand = this.hands[this.attackerId];
      allCards.forEach(c => attackerHand.push(c));
      this.scores[this.attackerId] = (this.scores[this.attackerId] || 0) + points;

      // Next round starts with attacker
      this.currentPlayer = this.attackerId;
    } else {
      // Defender gets all cards
      const defenderHand = this.hands[this.defenderId];
      allCards.forEach(c => defenderHand.push(c));
      this.scores[this.defenderId] = (this.scores[this.defenderId] || 0) + points;

      // Next round starts with defender
      this.currentPlayer = this.defenderId;
    }

    // Clear attack/defend cards
    this.attackCards = [];
    this.defendCards = [];

    // Check if round is over (no cards left in deck and all hands empty except maybe some)
    this.deckRemaining = this.deck.length;

    // Check if hands are empty
    const allHandsEmpty = this.playerIds.every(id => this.hands[id].length === 0);

    if (this.deckRemaining === 0 && allHandsEmpty) {
      this.endRound();
    } else {
      // Deal cards to get back to 4
      this.dealToHands();

      // Determine next attacker/defender
      this.phase = 'attacking';
      this.phase2 = 'attacking';
      const currentIdx = this.playerIds.indexOf(this.currentPlayer);
      this.attackerId = this.currentPlayer;
      this.defenderId = this.playerIds[(currentIdx + 1) % this.numPlayers];
      this.currentPlayer = this.attackerId;
    }
  }

  // ─── DEAL TO HANDS ─────────────────────────────────────────────
  dealToHands() {
    // Deal until everyone has 4 cards or deck is empty
    let dealt = 0;
    while (this.deck.length > 0 && dealt < 100) { // safety
      for (const id of this.playerIds) {
        if (this.deck.length === 0) break;
        if (this.hands[id].length < 4) {
          this.hands[id].push(this.deck.shift());
          this.deckRemaining = this.deck.length;
        }
      }
      dealt++;
    }
    // Update hand sizes
    this.playerIds.forEach(id => {
      this.handSizes[id] = this.hands[id].length;
    });
  }

  // ─── SPECIAL COMBINATIONS ─────────────────────────────────────
  checkSpecialCombinations(playerId) {
    const hand = this.hands[playerId];
    if (!hand || hand.length === 0) return null;

    // BURA: 4 trump cards
    const trumps = hand.filter(c => c.suit === this.trumpSuit);
    if (trumps.length === 4) {
      return { type: 'bura', color: 'gold', message: '🔥 BURA! 4 ta kozir!' };
    }

    // MOSKVA: 4 Aces
    const aces = hand.filter(c => c.rank === 'A');
    if (aces.length === 4) {
      return { type: 'moskva', color: 'purple', message: '🏛️ MOSKVA! 4 ta Tuz!' };
    }

    // MOLODKA: 4 same suit (non-trump)
    for (const suit of SUITS) {
      if (suit === this.trumpSuit) continue;
      const sameSuit = hand.filter(c => c.suit === suit);
      if (sameSuit.length === 4) {
        return { type: 'molodka', color: 'green', message: '🌿 MOLODKA! 4 ta bir xil mast!' };
      }
    }

    return null;
  }

  // ─── END ROUND ─────────────────────────────────────────────────
  endRound() {
    this.phase = 'roundOver';

    // Calculate penalties
    const totalPoints = this.playerIds.reduce((sum, id) => sum + (this.scores[id] || 0), 0);

    this.playerIds.forEach(id => {
      const score = this.scores[id] || 0;
      let penalty = 0;

      if (score >= 61) penalty = 0;
      else if (score >= 32) penalty = 2;
      else if (score >= 1) penalty = 4;
      else penalty = 6; // KOZEL - 0 points

      this.penalties[id] = (this.penalties[id] || 0) + penalty;
      this.roundSummary[id] = { points: score, penalty };

      // Check if player lost (12+ penalties)
      if (this.penalties[id] >= 12) {
        this.phase = 'gameOver';
        this.winner = this.playerIds.find(pid => this.penalties[pid] < 12) || this.playerIds[0];
        this.winnerNickname = `Player ${this.winner}`;
        return;
      }
    });

    // Check if all players have 12+ penalties
    const allLost = this.playerIds.every(id => this.penalties[id] >= 12);
    if (allLost && this.phase !== 'gameOver') {
      this.phase = 'gameOver';
      // Find player with least penalties
      let minPen = Infinity;
      let winnerId = this.playerIds[0];
      this.playerIds.forEach(id => {
        if (this.penalties[id] < minPen) {
          minPen = this.penalties[id];
          winnerId = id;
        }
      });
      this.winner = winnerId;
      this.winnerNickname = `Player ${winnerId}`;
    }
  }

  // ─── NEXT ROUND ───────────────────────────────────────────────
  nextRound() {
    if (this.phase === 'gameOver') return { error: 'Game is over' };
    this.initializeRound();
    return { success: true };
  }

  // ─── GET PUBLIC STATE ─────────────────────────────────────────
  getPublicState(playerId) {
    return {
      roundNumber: this.roundNumber,
      trumpSuit: this.trumpSuit,
      trumpCard: this.trumpCard,
      attackCards: this.attackCards,
      defendCards: this.defendCards,
      currentPlayer: this.currentPlayer,
      attackerId: this.attackerId,
      defenderId: this.defenderId,
      phase: this.phase,
      phase2: this.phase2,
      deckRemaining: this.deckRemaining,
      scores: this.scores,
      penalties: this.penalties,
      handSizes: this.handSizes,
      teamScores: this.teamScores,
      teams: this.teams,
      roundSummary: this.roundSummary,
      winner: this.winner,
      winnerNickname: this.winnerNickname,
      isTeam: this.isTeam,
      // Player-specific
      hand: this.hands[playerId] || [],
    };
  }
}

// ─── 108 GAME ENGINE ────────────────────────────────────────────
class Game108Engine {
  constructor(roomId, players, deckCount = 1) {
    this.roomId = roomId;
    this.players = players;
    this.playerIds = players.map(p => p.id);
    this.numPlayers = players.length;
    this.deckCount = deckCount;

    // State
    this.deck = [];
    this.discardPile = [];
    this.hands = {};
    this.handSizes = {};
    this.currentPlayer = null;
    this.direction = 1; // 1 = clockwise, -1 = counter-clockwise
    this.currentSuit = null;
    this.currentRank = null;
    this.topCard = null;
    this.pendingDraw = 0;
    this.phase = 'playing';
    this.winner = null;
    this.winnerNickname = null;

    this.initializeGame();
  }

  initializeGame() {
    // Create deck(s)
    let deck = [];
    for (let d = 0; d < this.deckCount; d++) {
      deck = deck.concat(createDeck());
    }
    this.deck = shuffleDeck(deck, Date.now() + this.roomId.length);

    // Deal 7 cards each
    const cardsPerPlayer = 7;
    const { hands, remaining } = dealCards(this.deck, this.numPlayers, cardsPerPlayer);
    this.deck = remaining;

    this.hands = {};
    this.handSizes = {};
    this.playerIds.forEach((id, idx) => {
      this.hands[id] = hands[idx] || [];
      this.handSizes[id] = this.hands[id].length;
    });

    // Set initial top card (must not be special)
    let topCard = null;
    for (let i = 0; i < this.deck.length; i++) {
      const card = this.deck[i];
      // Skip special cards for initial top
      const special = ['6', '7', '8', 'J', 'Q', 'K', 'A'];
      if (!special.includes(card.rank) || (card.rank === 'K' && card.suit !== 'spades')) {
        topCard = this.deck.splice(i, 1)[0];
        break;
      }
    }

    if (!topCard) {
      // If all cards are special, take first card
      topCard = this.deck.shift();
    }

    this.discardPile = [topCard];
    this.topCard = topCard;
    this.currentSuit = topCard.suit;
    this.currentRank = topCard.rank;

    // First player - random
    const startIdx = Math.floor(mulberry32(Date.now())() * this.numPlayers);
    this.currentPlayer = this.playerIds[startIdx];
    this.direction = 1;
    this.phase = 'playing';
    this.pendingDraw = 0;
    this.winner = null;
  }

  // ─── PLAY CARD ─────────────────────────────────────────────────
  playCard(playerId, cardId, chosenSuit = null) {
    if (this.phase === 'gameOver') {
      return { error: 'Game is over' };
    }
    if (this.currentPlayer !== playerId) {
      return { error: 'Not your turn' };
    }

    const hand = this.hands[playerId];
    if (!hand) return { error: 'Player not found' };

    const cardIndex = hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { error: 'Card not in hand' };

    const card = hand[cardIndex];

    // Validate move
    const validation = this.validateMove108(playerId, card);
    if (!validation.valid) {
      return { error: validation.error };
    }

    // Remove card from hand
    hand.splice(cardIndex, 1);
    this.handSizes[playerId] = hand.length;

    // Check win condition
    if (hand.length === 0) {
      this.phase = 'gameOver';
      this.winner = playerId;
      this.winnerNickname = `Player ${playerId}`;
      return { success: true, gameOver: true, winner: playerId };
    }

    // Apply card effects
    this.applyCardEffect108(card, playerId, chosenSuit);

    // Add to discard pile
    this.discardPile.push(card);
    this.topCard = card;
    this.currentSuit = chosenSuit || card.suit;
    this.currentRank = card.rank;

    // Next player
    this.nextPlayer108();

    return { success: true };
  }

  // ─── VALIDATE MOVE 108 ────────────────────────────────────────
  validateMove108(playerId, card) {
    if (this.pendingDraw > 0) {
      // Must play 6, 7, or King of Spades to pass draw
      if (card.rank === '6' || card.rank === '7' || (card.rank === 'K' && card.suit === 'spades')) {
        return { valid: true };
      }
      return { valid: false, error: `Must play 6, 7, or ♠K to pass +${this.pendingDraw} draw` };
    }

    // 8 rule: must close with 8, same suit, or any Queen
    if (this.currentRank === '8') {
      if (card.rank === '8' || card.suit === this.currentSuit || card.rank === 'Q') {
        return { valid: true };
      }
      return { valid: false, error: 'Must close 8 with 8, same suit, or Queen' };
    }

    // Normal rule: same suit or same rank
    if (card.suit === this.currentSuit || card.rank === this.currentRank) {
      return { valid: true };
    }

    // Queen can be played anytime
    if (card.rank === 'Q') {
      return { valid: true };
    }

    return { valid: false, error: 'Card must match suit or rank' };
  }

  // ─── APPLY CARD EFFECT 108 ────────────────────────────────────
  applyCardEffect108(card, playerId, chosenSuit) {
    const nextIdx = this.getNextPlayerIndex(this.currentPlayer);

    switch (card.rank) {
      case '6':
        // +2 cards to next player
        this.pendingDraw += 2;
        break;
      case '7':
        // +1 card to next player
        this.pendingDraw += 1;
        break;
      case 'K':
        if (card.suit === 'spades') {
          // King of Spades: +5 cards
          this.pendingDraw += 5;
        }
        break;
      case 'A':
        // Skip next player's turn
        this.currentPlayer = this.playerIds[nextIdx];
        break;
      case 'J':
        // Reverse direction
        this.direction *= -1;
        break;
      case 'Q':
        // Queen: choose suit
        if (chosenSuit) {
          this.currentSuit = chosenSuit;
        }
        break;
      case '8':
        // 8: chain continues - next player must close
        // No immediate effect, just changes current card
        break;
    }

    // If pending draw, apply to next player
    if (this.pendingDraw > 0) {
      const targetIdx = this.getNextPlayerIndex(this.currentPlayer);
      const targetId = this.playerIds[targetIdx];
      // Draw will be applied when player tries to play
    }
  }

  // ─── DRAW CARD ─────────────────────────────────────────────────
  drawCard(playerId) {
    if (this.phase === 'gameOver') {
      return { error: 'Game is over' };
    }
    if (this.currentPlayer !== playerId) {
      return { error: 'Not your turn' };
    }

    const hand = this.hands[playerId];

    // If pending draw, draw that many
    let drawCount = this.pendingDraw > 0 ? this.pendingDraw : 1;
    this.pendingDraw = 0;

    for (let i = 0; i < drawCount; i++) {
      if (this.deck.length === 0) {
        // Reshuffle discard pile
        if (this.discardPile.length > 1) {
          const top = this.discardPile.pop();
          this.deck = shuffleDeck(this.discardPile);
          this.discardPile = [top];
        } else {
          break;
        }
      }
      if (this.deck.length > 0) {
        hand.push(this.deck.shift());
      }
    }

    this.handSizes[playerId] = hand.length;

    // Next player
    this.nextPlayer108();

    return { success: true };
  }

  // ─── NEXT PLAYER ──────────────────────────────────────────────  nextPlayer108() {
    const idx = this.playerIds.indexOf(this.currentPlayer);
    let nextIdx = (idx + this.direction + this.numPlayers) % this.numPlayers;
    this.currentPlayer = this.playerIds[nextIdx];

    // Check if current player has pending draw
    if (this.pendingDraw > 0) {
      // Player must draw
    }
  }

  getNextPlayerIndex(playerId) {
    const idx = this.playerIds.indexOf(playerId);
    return (idx + this.direction + this.numPlayers) % this.numPlayers;
  }

  // ─── GET PUBLIC STATE ─────────────────────────────────────────
  getPublicState(playerId) {
    return {
      currentPlayer: this.currentPlayer,
      direction: this.direction,
      currentSuit: this.currentSuit,
      currentRank: this.currentRank,
      topCard: this.topCard,
      pendingDraw: this.pendingDraw,
      phase: this.phase,
      handSizes: this.handSizes,
      drawPileCount: this.deck.length,
      discardCount: this.discardPile.length,
      winner: this.winner,
      winnerNickname: this.winnerNickname,
      // Player-specific
      hand: this.hands[playerId] || [],
    };
  }
}

// ─── AUDIO ENGINE ────────────────────────────────────────────────
const AC = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

function tone(f, d, t = 'sine', v = 0.25) {
  if (!AC) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain();
    o.connect(g);
    g.connect(AC.destination);
    o.frequency.value = f;
    o.type = t;
    g.gain.setValueAtTime(v, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + d);
    o.start();
    o.stop(AC.currentTime + d);
  } catch (e) {}
}

const SFX = {
  deal: () => {
    for (let i = 0; i < 4; i++) setTimeout(() => tone(280 + i * 40, 0.08, 'triangle', 0.18), i * 70);
  },
  play: () => {
    tone(440, 0.08, 'triangle', 0.2);
    setTimeout(() => tone(550, 0.08, 'triangle', 0.15), 50);
  },
  draw: () => tone(300, 0.15, 'sawtooth', 0.15),
  win: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'sine', 0.25), i * 100));
  },
  error: () => { tone(180, 0.3, 'sawtooth', 0.3); },
  join: () => tone(660, 0.2, 'sine', 0.2),
  throw_: () => { tone(220, 0.2, 'sawtooth', 0.2); },
  tick: () => tone(880, 0.04, 'square', 0.12),
  reveal: () => {
    tone(700, 0.12, 'sine', 0.2);
    setTimeout(() => tone(900, 0.12, 'sine', 0.18), 80);
  },
  bura: () => {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'sine', 0.3), i * 80));
  },
  moskva: () => {
    [440, 523, 659, 784, 988, 1175].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'sine', 0.25), i * 90));
  },
  molodka: () => {
    [330, 392, 523, 659, 784, 988].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'sine', 0.25), i * 70));
  },
};

// ─── BACKGROUND ──────────────────────────────────────────────────
function BG({ variant = 'default' }) {
  const orbs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 200 + Math.random() * 300,
    color: ['rgba(0,229,255,0.04)', 'rgba(168,85,247,0.05)', 'rgba(245,200,66,0.04)', 'rgba(255,45,110,0.04)'][i % 4],
    dur: 8 + Math.random() * 10,
    delay: Math.random() * 5,
  })), []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: variant === 'game'
          ? 'radial-gradient(ellipse at 30% 20%, #041a10 0%, #020408 60%)'
          : 'radial-gradient(ellipse at 20% 10%, #050d1a 0%, #020408 60%)',
      }} />
      {orbs.map(o => (
        <div key={o.id} style={{
          position: 'absolute',
          left: `${o.x}%`,
          top: `${o.y}%`,
          width: o.size,
          height: o.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
          transform: 'translate(-50%,-50%)',
          animation: `float-y ${o.dur}s ease-in-out ${o.delay}s infinite`,
        }} />
      ))}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '2px',
        background: 'linear-gradient(90deg,transparent,rgba(0,229,255,0.2),transparent)',
        animation: 'scan 10s linear infinite',
      }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
        <defs>
          <pattern id="g" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00e5ff" strokeWidth=".5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>
    </div>
  );
}

// ─── CARD COMPONENT ──────────────────────────────────────────────
function Card({ card, onClick, selected, playable, faceDown, small, trump, animDelay = 0, shake: doShake = false }) {
  const w = small ? 50 : 68;
  const h = small ? 72 : 100;
  const color = card ? SUIT_CLR[card.suit] : '#fff';
  const sym = card ? SUIT_SYM[card.suit] : '';

  if (faceDown) {
    return (
      <motion.div
        whileHover={onClick ? { scale: 1.05, y: -4 } : {}}
        onClick={onClick}
        style={{
          width: w,
          height: h,
          borderRadius: 8,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #0a1a3a 0%, #152040 50%, #0a1220 100%)',
          border: '1px solid rgba(0,229,255,0.25)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          width: '80%',
          height: '80%',
          border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: 4,
          backgroundImage: `repeating-linear-gradient(45deg,rgba(0,229,255,.04) 0,rgba(0,229,255,.04) 2px,transparent 2px,transparent 9px)`,
        }} />
        <div className="shimmer-line" />
      </motion.div>
    );
  }

  if (!card) return null;

  const isPlayable = playable && !!onClick;

  return (
    <motion.div
      onClick={() => isPlayable && onClick(card)}
      animate={doShake ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : {}}
      transition={doShake ? { duration: 0.4 } : {}}
      whileHover={isPlayable ? { scale: 1.1, y: selected ? -22 : -10 } : selected ? {} : {}}
      whileTap={isPlayable ? { scale: 0.93 } : {}}
      style={{
        width: w,
        height: h,
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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: small ? '4px 5px' : '6px 8px',
        cursor: isPlayable ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        animation: `deal-in .35s cubic-bezier(0.34,1.4,0.64,1) ${animDelay}s both`,
        transition: 'box-shadow .2s, border .2s',
      }}
    >
      <div style={{ color, lineHeight: 1 }}>
        <div style={{ fontSize: small ? 11 : 14, fontWeight: 900, fontFamily: 'var(--font-ui)', letterSpacing: '-0.02em' }}>{card.rank}</div>
        <div style={{ fontSize: small ? 10 : 13 }}>{sym}</div>
      </div>
      <div style={{ textAlign: 'center', color, fontSize: small ? 18 : 28, textShadow: `0 0 6px ${color}50`, lineHeight: 1 }}>{sym}</div>
      <div style={{ color, lineHeight: 1, transform: 'rotate(180deg)', alignSelf: 'flex-end' }}>
        <div style={{ fontSize: small ? 11 : 14, fontWeight: 900, fontFamily: 'var(--font-ui)', letterSpacing: '-0.02em' }}>{card.rank}</div>
        <div style={{ fontSize: small ? 10 : 13 }}>{sym}</div>
      </div>
      {trump && (
        <div style={{
          position: 'absolute',
          top: -7,
          right: -7,
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
          boxShadow: '0 0 8px var(--gold)',
        }}>★</div>
      )}
      {isPlayable && !selected && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg,transparent,var(--cyan),transparent)',
          borderRadius: '0 0 8px 8px',
        }} />
      )}
    </motion.div>
  );
}

// ─── UI COMPONENTS ────────────────────────────────────────────────
function Btn({ children, onClick, color = 'cyan', disabled, small, full, style: sx }) {
  const map = {
    cyan: { c: 'var(--cyan)', bg: 'rgba(0,229,255,0.08)', b: 'rgba(0,229,255,0.5)' },
    gold: { c: 'var(--gold)', bg: 'rgba(245,200,66,0.08)', b: 'rgba(245,200,66,0.5)' },
    pink: { c: 'var(--pink)', bg: 'rgba(255,45,110,0.08)', b: 'rgba(255,45,110,0.5)' },
    green: { c: 'var(--green)', bg: 'rgba(0,255,148,0.08)', b: 'rgba(0,255,148,0.5)' },
    purple: { c: 'var(--purple)', bg: 'rgba(168,85,247,0.08)', b: 'rgba(168,85,247,0.5)' },
    red: { c: 'var(--red)', bg: 'rgba(255,59,92,0.08)', b: 'rgba(255,59,92,0.5)' },
  };
  const clr = map[color] || map.cyan;
  return (
    <motion.button
      onClick={!disabled ? onClick : undefined}
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      style={{
        background: disabled ? 'rgba(255,255,255,.04)' : clr.bg,
        border: `1px solid ${disabled ? 'rgba(255,255,255,.08)' : clr.b}`,
        color: disabled ? 'rgba(255,255,255,.25)' : clr.c,
        padding: small ? '7px 14px' : '11px 22px',
        borderRadius: 8,
        fontFamily: 'var(--font-ui)',
        fontSize: small ? 10 : 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 0 12px ${clr.b}50, inset 0 0 12px ${clr.b}10`,
        transition: 'all .2s',
        width: full ? '100%' : undefined,
        position: 'relative',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {!disabled && <div className="shimmer-line" />}
      {children}
    </motion.button>
  );
}

function Input({ value, onChange, placeholder, onKeyDown, autoFocus, maxLength }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      maxLength={maxLength || 20}
      style={{
        background: 'rgba(0,229,255,0.05)',
        border: '1px solid rgba(0,229,255,0.35)',
        borderRadius: 8,
        color: 'var(--cyan)',
        padding: '13px 18px',
        fontSize: 17,
        fontFamily: 'var(--font-ui)',
        letterSpacing: '.08em',
        outline: 'none',
        width: '100%',
        boxShadow: '0 0 20px rgba(0,229,255,0.1), inset 0 0 10px rgba(0,229,255,0.04)',
        transition: 'all .3s',
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
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300 }}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            style={{
              padding: '11px 18px',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'var(--font-ui)',
              letterSpacing: '.05em',
              background: t.type === 'error' ? 'rgba(255,45,110,.15)' : t.type === 'success' ? 'rgba(0,255,148,.12)' : 'rgba(0,229,255,.12)',
              border: `1px solid ${t.type === 'error' ? 'var(--pink)' : t.type === 'success' ? 'var(--green)' : 'var(--cyan)'}`,
              color: t.type === 'error' ? 'var(--pink)' : t.type === 'success' ? 'var(--green)' : 'var(--cyan)',
              boxShadow: '0 4px 20px rgba(0,0,0,.4)',
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
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <BG />
      <AnimatePresence mode="wait">
        {!ready ? (
          <motion.div key="intro"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            style={{ textAlign: 'center', zIndex: 1 }}
          >
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
              style={{ fontSize: 88, marginBottom: 20 }}
            >🎴</motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(26px,6vw,48px)', color: 'var(--gold)', textShadow: '0 0 20px var(--gold)', letterSpacing: '.04em' }}
            >KARTA O'YINI</motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ color: 'var(--cyan)', fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '.3em', marginTop: 8 }}
            >TO'RT BURA • 108 • ONLINE MULTIPLAYER</motion.p>
          </motion.div>
        ) : (
          <motion.div key="form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ zIndex: 1, width: '100%', maxWidth: 420, padding: '0 20px' }}
          >
            <div className="glass" style={{ borderRadius: 20, padding: '44px 36px', boxShadow: '0 0 60px rgba(0,229,255,0.07), 0 40px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <motion.div
                  animate={{ animation: 'float-y 4s ease-in-out infinite' }}
                  style={{ fontSize: 52, marginBottom: 14 }}
                >🎴</motion.div>
                <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 22, color: 'var(--gold)', textShadow: '0 0 12px var(--gold)' }}>
                  KARTA O'YINI
                </h1>
                <p style={{ color: 'var(--dim)', fontSize: 11, marginTop: 8, fontFamily: 'var(--font-ui)', letterSpacing: '.15em' }}>
                  NICKNAME KIRITING
                </p>
              </div>
              <div style={{ marginBottom: 20 }}>
                <Input value={name} onChange={setName} placeholder="Ismingiz..." autoFocus onKeyDown={e => e.key === 'Enter' && submit()} />
              </div>
              <Btn color="gold" onClick={submit} disabled={name.trim().length < 2 || loading} full sx={{ padding: '15px', fontSize: 13 }}>
                {loading ? 'YUKLANMOQDA...' : "O'YINGA KIRISH →"}
              </Btn>
              <p style={{ textAlign: 'center', color: 'var(--dimmer)', fontSize: 10, marginTop: 18, fontFamily: 'var(--font-ui)' }}>
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
      id: 'bura',
      icon: '🃏',
      title: "TO'RT BURA",
      sub: '2 yoki 4 kishilik',
      desc: 'Oʻzbek klassik kozel oʻyini. Kartalar bilan trick yutib, 61+ ball yigʻing. 12 jarima = yutqazding!',
      rules: ['Tuz=11, 10=10, Shoh=4, Dama=3, Valet=2', 'Kozir istalgan kartani uradi', 'Jarima: 61+=0, 32-60=2, 1-31=4, 0=6 shtraf'],
      color: 'var(--gold)',
      glow: 'rgba(245,200,66,0.12)',
    },
    {
      id: '108',
      icon: '🔥',
      title: '108',
      sub: '2-6 kishilik',
      desc: 'Kartalardan qutuling! Maxsus kartalar bilan raqibga karta bering yoki uning navbatini o\'tkazib yuboring.',
      rules: ['6=+2 karta, 7=+1 karta, Ks=+5 karta', 'Dama=suit o\'zgartirish, 8=skip, Valet=burilish', 'Birinchi kartasiz qolgan g\'alaba!'],
      color: 'var(--pink)',
      glow: 'rgba(255,45,110,0.12)',
    },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
      <BG />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        zIndex: 1,
        background: 'rgba(2,4,8,0.7)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,229,255,0.07)',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 16, color: 'var(--gold)', textShadow: '0 0 10px var(--gold)' }}>KARTA O'YINI</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)', letterSpacing: '.2em' }}>ONLINE MULTIPLAYER</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: '7px 14px',
            borderRadius: 6,
            background: 'rgba(0,229,255,0.07)',
            border: '1px solid rgba(0,229,255,0.2)',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            color: 'var(--cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
            {nickname}
          </div>
          <Btn small color="red" onClick={onLogout}>CHIQISH</Btn>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        zIndex: 1,
        gap: 'clamp(16px,3vw,40px)',
        flexWrap: 'wrap',
      }}>
        {games.map((g, i) => (
          <motion.div key={g.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, type: 'spring', stiffness: 100 }}
            onClick={() => { SFX.join();
              onSelect(g.id); }}
            whileHover={{ scale: 1.03, y: -8 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: 'clamp(260px,38vw,360px)',
              padding: '36px 30px',
              borderRadius: 20,
              background: `radial-gradient(circle at 25% 25%, ${g.glow}, rgba(11,20,37,0.9))`,
              border: `1px solid ${g.color}35`,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 0 50px ${g.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
              animation: `float-y ${7 + i * 2}s ease-in-out ${i * 1.5}s infinite`,
            }}
          >
            <div className="shimmer-line" />
            <div style={{ fontSize: 56, marginBottom: 18, textAlign: 'center', animation: `float-y 4s ease-in-out ${i * 0.5}s infinite` }}>{g.icon}</div>
            <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 20, color: g.color, textShadow: `0 0 12px ${g.color}`, textAlign: 'center', marginBottom: 6 }}>
              {g.title}
            </h2>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 10, color: g.color, opacity: 0.7, letterSpacing: '.15em', marginBottom: 14 }}>
              {g.sub}
            </div>
            <p style={{ color: 'rgba(180,210,255,0.55)', fontSize: 12.5, textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>{g.desc}</p>
            <div style={{ borderTop: `1px solid ${g.color}20`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {g.rules.map((r, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: g.color, fontSize: 10, flexShrink: 0, marginTop: 1 }}>▸</span>
                  <span style={{ color: 'var(--dim)', fontSize: 11, lineHeight: 1.4 }}>{r}</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 22,
              padding: '11px',
              borderRadius: 8,
              textAlign: 'center',
              background: `${g.color}12`,
              border: `1px solid ${g.color}25`,
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              color: g.color,
              letterSpacing: '.1em',
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
  const [tab, setTab] = useState('create');
  const [type, setType] = useState('2p');
  const [decks, setDecks] = useState(1);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const isBura = gameMode === 'bura';

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, overflowY: 'auto' }}>
      <BG />
      <div style={{ zIndex: 1, maxWidth: 500, margin: '0 auto', width: '100%', padding: '20px 18px' }}>
        <Btn small onClick={onBack} style={{ marginBottom: 22 }}>← ORQAGA</Btn>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 46, marginBottom: 10 }}>{isBura ? '🃏' : '🔥'}</div>
          <h1 style={{
            fontFamily: 'var(--font-d)',
            fontSize: 22,
            color: isBura ? 'var(--gold)' : 'var(--pink)',
            textShadow: `0 0 12px ${isBura ? 'var(--gold)' : 'var(--pink)'}`,
          }}>{isBura ? "TO'RT BURA" : '108'}</h1>
        </div>

        <div style={{ display: 'flex', gap: 3, marginBottom: 22, background: 'rgba(255,255,255,.02)', borderRadius: 9, padding: 3, border: '1px solid rgba(0,229,255,.09)' }}>
          {[['create', '+ XONA YARATISH'], ['join', '→ XONAGA KIRISH']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1,
              padding: '11px',
              borderRadius: 7,
              background: tab === t ? 'rgba(0,229,255,0.1)' : 'transparent',
              border: tab === t ? '1px solid rgba(0,229,255,0.3)' : '1px solid transparent',
              color: tab === t ? 'var(--cyan)' : 'var(--dim)',
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.08em',
              cursor: 'pointer',
              transition: 'all .2s',
              textTransform: 'uppercase',
            }}>{l}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'create' ? (
            <motion.div key="cr" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass" style={{ borderRadius: 16, padding: '26px 22px' }}>
                {isBura && (
                  <div style={{ marginBottom: 22 }}>
                    <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '.15em', marginBottom: 10 }}>O'YINCHILAR SONI</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[['2p', '2 KISHILIK'], ['4p', '4 KISHILIK (2v2)']].map(([v, l]) => (
                        <button key={v} onClick={() => setType(v)} style={{
                          flex: 1,
                          padding: '13px 8px',
                          borderRadius: 8,
                          background: type === v ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${type === v ? 'var(--gold)' : 'rgba(255,255,255,0.07)'}`,
                          color: type === v ? 'var(--gold)' : 'var(--dim)',
                          fontFamily: 'var(--font-ui)',
                          fontSize: 10.5,
                          fontWeight: 700,
                          letterSpacing: '.07em',
                          cursor: 'pointer',
                          transition: 'all .2s',
                        }}>{l}</button>
                      ))}
                    </div>
                  </div>
                )}
                {!isBura && (
                  <div style={{ marginBottom: 22 }}>
                    <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '.15em', marginBottom: 10 }}>DAST SONI</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3].map(d => (
                        <button key={d} onClick={() => setDecks(d)} style={{
                          flex: 1,
                          padding: '13px 8px',
                          borderRadius: 8,
                          background: decks === d ? 'rgba(255,45,110,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${decks === d ? 'var(--pink)' : 'rgba(255,255,255,0.07)'}`,
                          color: decks === d ? 'var(--pink)' : 'var(--dim)',
                          fontFamily: 'var(--font-ui)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all .2s',
                        }}>{d} DAST</button>
                      ))}
                    </div>
                  </div>
                )}
                <Btn color={isBura ? 'gold' : 'pink'} onClick={() => onCreate({ gameMode, gameType: type, deckCount: decks })} full sx={{ padding: '15px', fontSize: 13 }}>
                  XONA YARATISH
                </Btn>
              </div>
            </motion.div>
          ) : (
            <motion.div key="jo" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass" style={{ borderRadius: 16, padding: '26px 22px' }}>
                <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '.15em', marginBottom: 10 }}>XONA KODI (6 raqam)</p>
                <div style={{ marginBottom: 18 }}>
                  <Input value={code} onChange={v => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="123456" maxLength={6} onKeyDown={e => e.key === 'Enter' && code.length === 6 && onJoin(code)} />
                </div>
                <Btn color="cyan" disabled={code.length !== 6 || busy} onClick={() => { setBusy(true);
                  onJoin(code); }} full sx={{ padding: '15px', fontSize: 13 }}>
                  {busy ? 'KIRILMOQDA...' : 'XONAGA KIRISH →'}
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
  const isHost = room.host === socketId;
  const isReady = room.readyPlayers?.includes(socketId);
  const canStart = isHost && room.players.length >= room.minPlayers;

  useEffect(() => { chatRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chats]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(room.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [room.id]);

  const send = useCallback(() => {
    if (!msg.trim()) return;
    onSendChat(msg.trim());
    setMsg('');
  }, [msg, onSendChat]);

  const avatarColor = useCallback((nick) => `hsl(${nick.charCodeAt(0) * 13 % 360},55%,28%)`, []);
  const avatarBorder = useCallback((nick) => `hsl(${nick.charCodeAt(0) * 13 % 360},75%,50%)`, []);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20 }}>
      <BG />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1, overflow: 'hidden', maxWidth: 680, margin: '0 auto', width: '100%', padding: '14px 16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 16, color: 'var(--gold)', textShadow: '0 0 8px var(--gold)' }}>
              {room.gameMode === 'bura' ? "TO'RT BURA" : '108'} — LOBBY
            </h2>
            <p style={{ color: 'var(--dim)', fontSize: 10, fontFamily: 'var(--font-ui)' }}>
              {room.players.length}/{room.maxPlayers} O'YINCHI • {room.gameMode === 'bura' ? `${room.gameType === '4p' ? '4 KISHILIK 2v2' : '2 KISHILIK'}` : `${room.deckCount} DAST`}
            </p>
          </div>
          <Btn small color="red" onClick={onLeave}>CHIQISH</Btn>
        </div>

        <div className="glass" style={{ borderRadius: 12, padding: '14px 18px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.2em', marginBottom: 3 }}>XONA KODI</p>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 26, fontWeight: 900, color: 'var(--cyan)', letterSpacing: '.3em', textShadow: '0 0 12px var(--cyan)' }}>
              {room.id}
            </div>
          </div>
          <Btn small color="cyan" onClick={copyCode}>{copied ? '✓ NUSXA' : 'NUSXA OLISH'}</Btn>
        </div>

        <div className="glass" style={{ borderRadius: 12, padding: '14px', marginBottom: 12 }}>
          <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.2em', marginBottom: 10 }}>O'YINCHILAR</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Array.from({ length: room.maxPlayers }).map((_, i) => {
              const p = room.players[i];
              const isMe = p?.id === socketId;
              const isHostP = p?.id === room.host;
              const rdy = room.readyPlayers?.includes(p?.id);
              return (
                <motion.div key={i}
                  initial={p ? { scale: 0.85, opacity: 0 } : {}}
                  animate={p ? { scale: 1, opacity: 1 } : {}}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: p ? (isMe ? 'rgba(0,229,255,0.07)' : 'rgba(255,255,255,0.03)') : 'rgba(255,255,255,0.015)',
                    border: p ? (isMe ? '1px solid rgba(0,229,255,0.25)' : '1px solid rgba(255,255,255,0.07)') : '1px dashed rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {p ? (
                    <>
                      <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: avatarColor(p.nickname),
                        border: `2px solid ${avatarBorder(p.nickname)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                      }}>{p.nickname[0].toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.nickname} {isMe && <span style={{ color: 'var(--cyan)', fontSize: 9 }}>(sen)</span>}
                        </div>
                        <div style={{ fontSize: 9.5, fontFamily: 'var(--font-ui)', color: isHostP ? 'var(--gold)' : rdy ? 'var(--green)' : 'var(--dim)' }}>
                          {isHostP ? '👑 HOST' : rdy ? '✓ TAYYOR' : 'kutmoqda...'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{ color: 'var(--dimmer)', fontSize: 11, fontFamily: 'var(--font-ui)', width: '100%', textAlign: 'center' }}
                    >BO'SH SLOT...</motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="glass" style={{ borderRadius: 12, padding: '12px', marginBottom: 12, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.2em', marginBottom: 8 }}>CHAT</p>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8, minHeight: 0 }}>
            {chats.map(m => (
              <div key={m.id} style={{ marginBottom: 5, display: 'flex', gap: 7, alignItems: 'baseline' }}>
                <span style={{ color: 'var(--cyan)', fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}>{m.nickname}:</span>
                <span style={{ color: 'var(--text)', fontSize: 12.5 }}>{m.text}</span>
              </div>
            ))}
            {typingUsers.length > 0 && (
              <div style={{ color: 'var(--dim)', fontSize: 10.5, fontStyle: 'italic' }}>
                {typingUsers.join(', ')} yozmoqda...
              </div>
            )}
            <div ref={chatRef} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Xabar..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(0,229,255,0.13)',
                borderRadius: 6,
                color: 'var(--text)',
                padding: '8px 12px',
                fontSize: 12.5,
                fontFamily: 'var(--font-b)',
                outline: 'none',
              }}
            />
            <Btn small onClick={send}>↑</Btn>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {!isHost && (
            <Btn color={isReady ? 'green' : 'cyan'} onClick={onToggleReady} full sx={{ padding: '13px' }}>
              {isReady ? '✓ TAYYOR' : 'TAYYOR'}
            </Btn>
          )}
          {isHost && (
            <Btn color="gold" disabled={!canStart} onClick={onStart} full sx={{ padding: '13px', fontSize: 13 }}>
              {canStart ? '▶ BOSHLASH' : `KUTISH... (${room.players.length}/${room.minPlayers})`}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BURA SPECIAL ANIMATION ──────────────────────────────────────
function BuraSpecial({ type, message, onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const styles = {
    bura: {
      animation: 'bura-flash 0.8s ease-in-out infinite',
      borderColor: 'var(--gold)',
      boxShadow: '0 0 60px rgba(245,200,66,0.5), 0 0 120px rgba(245,200,66,0.2)',
      color: 'var(--gold)',
    },
    moskva: {
      animation: 'moskva-flash 0.8s ease-in-out infinite',
      borderColor: 'var(--purple)',
      boxShadow: '0 0 60px rgba(168,85,247,0.5), 0 0 120px rgba(68,136,255,0.2)',
      color: 'var(--purple)',
    },
    molodka: {
      animation: 'molodka-flash 0.8s ease-in-out infinite',
      borderColor: 'var(--green)',
      boxShadow: '0 0 60px rgba(0,255,148,0.5), 0 0 120px rgba(0,229,255,0.2)',
      color: 'var(--green)',
    },
  };

  const style = styles[type] || styles.bura;

  useEffect(() => {
    if (type === 'bura') SFX.bura();
    else if (type === 'moskva') SFX.moskva();
    else if (type === 'molodka') SFX.molodka();
  }, [type]);

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: -50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 1.3, opacity: 0, y: -80 }}
      transition={{ type: 'spring', stiffness: 200 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        padding: '50px 70px',
        borderRadius: 30,
        background: 'rgba(8,16,34,0.95)',
        border: `3px solid ${style.borderColor}`,
        boxShadow: style.boxShadow,
        textAlign: 'center',
        maxWidth: 500,
      }}>
        <div style={{
          fontSize: 80,
          marginBottom: 16,
          animation: 'float-y 1.5s ease-in-out infinite',
        }}>
          {type === 'bura' ? '🔥' : type === 'moskva' ? '🏛️' : '🌿'}
        </div>
        <h2 style={{
          fontFamily: 'var(--font-d)',
          fontSize: 32,
          color: style.color,
          textShadow: `0 0 20px ${style.color}`,
          marginBottom: 8,
        }}>
          {type === 'bura' ? 'BURA!' : type === 'moskva' ? 'MOSKVA!' : 'MOLODKA!'}
        </h2>
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 14,
          color: 'var(--text)',
          opacity: 0.8,
          letterSpacing: '.1em',
        }}>
          {message}
        </p>
      </div>
    </motion.div>
  );
}

// ─── BURA GAME SCREEN ─────────────────────────────────────────────
function BuraScreen({ room, gs, myHand, socketId, nickname, onPlay, onThrow, onLeave, onPlayAgain, onNextRound }) {
  const [selected, setSelected] = useState(null);
  const [shakeCard, setShakeCard] = useState(null);
  const [special, setSpecial] = useState(null);
  const players = room.players;
  const myIdx = players.findIndex(p => p.id === socketId);
  const trump = gs?.trumpSuit;
  const phase2 = gs?.phase2;
  const isAttacker = gs?.attackerId === socketId;
  const isDefender = gs?.defenderId === socketId;
  const isMyTurn = gs?.currentPlayer === socketId;

  const playable = useMemo(() => {
    if (!myHand || !gs) return new Set();
    if (!isMyTurn) return new Set();

    if (phase2 === 'attacking' && isAttacker) {
      return new Set(myHand.map(c => c.id));
    }
    if (phase2 === 'defending' && isDefender) {
      const lastAttack = gs.attackCards?.[gs.attackCards.length - 1];
      if (!lastAttack) return new Set();
      return new Set(myHand.filter(c => {
        if (c.suit === lastAttack.suit) {
          return RANK_INDEX_BURA[c.rank] < RANK_INDEX_BURA[lastAttack.rank];
        }
        if (c.suit === trump && lastAttack.suit !== trump) return true;
        return false;
      }).map(c => c.id));
    }
    return new Set();
  }, [myHand, gs, isMyTurn, isAttacker, isDefender, phase2, trump]);

  const handleCardClick = useCallback((card) => {
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
  }, [playable, selected, onPlay]);

  const handleThrowClick = useCallback(() => {
    SFX.throw_();
    onThrow();
    setSelected(null);
  }, [onThrow]);

  const penaltyBars = useMemo(() => {
    const pen = gs?.penalties?.[socketId] || 0;
    const bars = [];
    for (let i = 0; i < 12; i++) {
      bars.push(
        <div key={i} style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: i < pen ? 'var(--red)' : 'rgba(255,255,255,0.08)',
          border: i < pen ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.05)',
        }} />
      );
    }
    return bars;
  }, [gs, socketId]);

  const getPosition = useCallback((idx) => {
    const rel = (idx - myIdx + players.length) % players.length;
    if (players.length === 2) return rel === 0 ? 'bottom' : 'top';
    return ['bottom', 'right', 'top', 'left'][rel] || 'top';
  }, [myIdx, players.length]);

  // Handle special combo from server
  useEffect(() => {
    if (gs?.special) {
      setSpecial(gs.special);
      setTimeout(() => setSpecial(null), 3000);
    }
  }, [gs?.special]);

  if (gs?.phase === 'roundOver') {
    return <BuraRoundOver gs={gs} room={room} socketId={socketId} onNext={onNextRound} onLeave={onLeave} />;
  }
  if (gs?.phase === 'gameOver') {
    return <BuraGameOver gs={gs} room={room} socketId={socketId} onPlayAgain={onPlayAgain} onLeave={onLeave} />;
  }

  const myPenalty = gs?.penalties?.[socketId] || 0;
  const myScore = gs?.scores?.[socketId] || 0;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, overflow: 'hidden' }}>
      <BG variant="game" />

      <AnimatePresence>
        {special && (
          <BuraSpecial
            type={special.type}
            message={special.message}
            onComplete={() => setSpecial(null)}
          />
        )}
      </AnimatePresence>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        zIndex: 10,
        background: 'rgba(2,4,8,0.82)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,229,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {trump && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 6,
              background: 'rgba(245,200,66,0.1)',
              border: '1px solid rgba(245,200,66,0.3)',
            }}>
              <span style={{ color: SUIT_CLR[trump], fontSize: 18 }}>{SUIT_SYM[trump]}</span>
              <span style={{ color: 'var(--gold)', fontSize: 9, fontFamily: 'var(--font-ui)' }}>KOZIR</span>
            </div>
          )}
          {gs?.deckRemaining > 0 && (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--dim)' }}>
              🃏 {gs.deckRemaining}
            </div>
          )}
          {gs?.teams ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <div style={{ padding: '4px 8px', borderRadius: 4, background: 'rgba(0,229,255,0.07)', fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--cyan)' }}>
                JAMOA 1: {gs.teamScores?.team1 || 0}pts
              </div>
              <div style={{ padding: '4px 8px', borderRadius: 4, background: 'rgba(255,45,110,0.07)', fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--pink)' }}>
                JAMOA 2: {gs.teamScores?.team2 || 0}pts
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {players.map(p => (
                <div key={p.id} style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  background: p.id === socketId ? 'rgba(0,229,255,0.07)' : 'rgba(255,255,255,0.03)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 10,
                  color: p.id === socketId ? 'var(--cyan)' : 'var(--dim)',
                }}>
                  {p.nickname.slice(0, 8)}: {gs?.scores?.[p.id] || 0}pt
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)' }}>JARIMA:</span>
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', maxWidth: 120 }}>{penaltyBars}</div>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: myPenalty >= 9 ? 'var(--red)' : 'var(--dim)' }}>
              {myPenalty}/12
            </span>
          </div>
          <Btn small color="red" onClick={onLeave}>✕</Btn>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

        <div style={{
          width: 'min(80vw,480px)',
          height: 'min(42vw,260px)',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, #1d5c35 0%, #0e3a1e 55%, #071811 100%)',
          border: '5px solid rgba(255,215,0,0.2)',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,80,30,0.15), inset 0 0 30px rgba(0,100,40,0.15)',
          position: 'absolute',
        }} />

        {players.map((p, i) => {
          if (p.id === socketId) return null;
          const pos = getPosition(i);
          const isCurrent = gs?.currentPlayer === p.id;
          const isAtt = gs?.attackerId === p.id;
          const isDef = gs?.defenderId === p.id;
          const hSize = gs?.handSizes?.[p.id] || 0;
          const pPen = gs?.penalties?.[p.id] || 0;

          const posStyles = {
            top: { position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', flexDirection: 'column', alignItems: 'center' },
            left: { position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', flexDirection: 'column', alignItems: 'center' },
            right: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', flexDirection: 'column', alignItems: 'center' },
          };

          return (
            <div key={p.id} style={{ display: 'flex', gap: 6, zIndex: 5, ...posStyles[pos] }}>
              <div style={{
                padding: '6px 12px',
                borderRadius: 8,
                textAlign: 'center',
                background: isCurrent ? 'rgba(0,255,148,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isCurrent ? 'var(--green)' : isAtt ? 'rgba(255,200,66,0.3)' : isDef ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: isCurrent ? '0 0 15px rgba(0,255,148,0.25)' : 'none',
                minWidth: 90,
              }}>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--font-ui)', color: isCurrent ? 'var(--green)' : 'var(--text)', marginBottom: 2 }}>
                  {p.nickname}
                  {isAtt && <span style={{ color: 'var(--gold)', fontSize: 8 }}> ⚔</span>}
                  {isDef && <span style={{ color: 'var(--cyan)', fontSize: 8 }}> 🛡</span>}
                </div>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: 'var(--dim)' }}>🃏×{hSize}</span>
                  <span style={{ fontSize: 9, color: pPen >= 9 ? 'var(--red)' : 'var(--dim)' }}>⚡{pPen}</span>
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                {Array.from({ length: Math.min(hSize, 6) }).map((_, ci) => (
                  <div key={ci} style={{
                    width: 24,
                    height: 36,
                    borderRadius: 4,
                    marginLeft: ci > 0 ? -10 : 0,
                    zIndex: ci,
                    background: 'linear-gradient(135deg,#0a1a3a,#152040)',
                    border: '1px solid rgba(0,229,255,0.2)',
                  }} />
                ))}
              </div>
            </div>
          );
        })}

        <div style={{
          position: 'absolute',
          display: 'flex',
          gap: 8,
          zIndex: 6,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 320,
        }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
            <AnimatePresence>
              {(gs?.attackCards || []).map((c, i) => {
                const defended = gs?.defendCards?.[i];
                return (
                  <motion.div key={c.id} initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: (i % 2 === 0 ? -6 : 6) }}
                    style={{ position: 'relative' }}
                  >
                    <Card card={c} small trump={c.suit === trump} />
                    {defended && (
                      <motion.div initial={{ scale: 0, rotate: 0 }} animate={{ scale: 1, rotate: 12 }}
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

        {gs?.trumpCard && gs?.deckRemaining > 0 && (
          <div style={{ position: 'absolute', right: '4%', top: '50%', transform: 'translateY(-50%)', zIndex: 5, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--gold)', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>KOZIR KARTI</div>
            <Card card={gs.trumpCard} small trump />
            <div style={{ fontSize: 9, color: 'var(--dim)', fontFamily: 'var(--font-ui)', marginTop: 3 }}>{gs.deckRemaining} karta</div>
          </div>
        )}

        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <AnimatePresence>
            {isMyTurn && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  padding: '7px 18px',
                  borderRadius: 20,
                  background: isAttacker ? 'rgba(245,200,66,0.15)' : 'rgba(0,229,255,0.12)',
                  border: `1px solid ${isAttacker ? 'var(--gold)' : 'var(--cyan)'}`,
                  color: isAttacker ? 'var(--gold)' : 'var(--cyan)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 11,
                  boxShadow: `0 0 18px ${isAttacker ? 'rgba(245,200,66,0.3)' : 'rgba(0,229,255,0.25)'}`,
                }}
              >
                {isAttacker ? '⚔ HUJUM QILING' : '🛡 HIMOYA QILING'}
              </motion.div>
            )}
            {!isMyTurn && gs?.currentPlayer && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--dim)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 10,
                }}
              >
                {players.find(p => p.id === gs.currentPlayer)?.nickname} o'ynamoqda...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{
          position: 'absolute',
          left: '2%',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}>
          {[['A', '11'], ['10', '10'], ['K', '4'], ['Q', '3'], ['J', '2']].map(([r, v]) => (
            <div key={r} style={{
              display: 'flex',
              gap: 4,
              alignItems: 'center',
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.03)',
            }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)', fontWeight: 700 }}>{r}</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8, color: 'var(--dimmer)' }}>=</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, color: 'var(--gold)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: 'rgba(2,4,8,0.88)',
        backdropFilter: 'blur(14px)',
        borderTop: '1px solid rgba(0,229,255,0.07)',
        padding: '10px 8px 18px',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            color: isMyTurn ? (isAttacker ? 'var(--gold)' : 'var(--cyan)') : 'var(--dim)',
          }}>
            {nickname}
            {isAttacker ? ' • ⚔ HUJUMCHI' : isDefender ? ' • 🛡 HIMOYACHI' : ''}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)' }}>
            BALL: <span style={{ color: 'var(--text)' }}>{myScore}</span>
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: myPenalty >= 9 ? 'var(--red)' : 'var(--dim)' }}>
            JARIMA: <span style={{ color: myPenalty >= 9 ? 'var(--red)' : 'var(--text)' }}>{myPenalty}</span>/12
          </span>
        </div>

        <div style={{
          display: 'flex',
          gap: 4,
          justifyContent: 'center',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          paddingTop: 18,
          paddingBottom: 4,
        }}>
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
                shake={shakeCard === c.id}
              />
            ))}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
          {selected && isMyTurn && playable.has(selected.id) && (
            <Btn small color={isAttacker ? 'gold' : 'cyan'} onClick={() => { SFX.play();
              onPlay(selected.id);
              setSelected(null); }}>
              ▶ {selected.rank}{SUIT_SYM[selected.suit]} O'YNASH
            </Btn>
          )}
          {isDefender && isMyTurn && phase2 === 'defending' && (gs?.attackCards || []).length > 0 && (
            <Btn small color="red" onClick={handleThrowClick}>
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
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <BG />
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 120 }}
        style={{
          background: 'rgba(8,16,34,0.97)',
          borderRadius: 22,
          padding: '40px 36px',
          maxWidth: 440,
          width: '90%',
          border: '1px solid rgba(0,229,255,0.2)',
          boxShadow: '0 0 60px rgba(0,229,255,0.08), 0 40px 80px rgba(0,0,0,0.6)',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 14 }}>📊</div>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 20, color: 'var(--cyan)', textShadow: '0 0 12px var(--cyan)', marginBottom: 6 }}>
          RAUND YAKUNLANDI
        </h2>
        <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-ui)', fontSize: 10, marginBottom: 24 }}>
          RAUND #{gs?.roundNumber || 1}
        </p>

        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)', marginBottom: 8, letterSpacing: '.1em' }}>JARIMA QOIDASI</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['61-120', '0 shtraf', 'green'], ['32-60', '2 shtraf', 'cyan'], ['1-31', '4 shtraf', 'gold'], ['0', '6 shtraf', 'red']].map(([r, l, c]) => (
              <div key={r} style={{ padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`, fontSize: 9, fontFamily: 'var(--font-ui)', color: `var(--${c})` }}>
                {r}: {l}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 26 }}>
          {players.map(p => {
            const s = summary[p.id] || {};
            return (
              <div key={p.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text)' }}>{p.nickname}</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)', marginTop: 2 }}>
                    Jami jarima: <span style={{ color: (gs?.penalties?.[p.id] || 0) >= 9 ? 'var(--red)' : 'var(--text)' }}>{gs?.penalties?.[p.id] || 0}</span>/12
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{s.points || 0} ball</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: s.penalty === 0 ? 'var(--green)' : s.penalty === 6 ? 'var(--red)' : 'var(--pink)' }}>
                    +{s.penalty || 0} shtraf
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {isHost && <Btn color="gold" onClick={onNext}>▶ KEYINGI RAUND</Btn>}
          <Btn color="cyan" onClick={onLeave}>← MENU</Btn>
        </div>
        {!isHost && (
          <p style={{ color: 'var(--dim)', fontSize: 10, marginTop: 14, fontFamily: 'var(--font-ui)' }}>
            Host keyingi raundni boshlashini kuting...
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ─── BURA GAME OVER ──────────────────────────────────────────────
function BuraGameOver({ gs, room, socketId, onPlayAgain, onLeave }) {
  const isHost = room.host === socketId;
  const players = room.players;
  const winner = gs?.winner;
  const isTeam = room.gameType === '4p';

  let iWon = false;
  if (isTeam) {
    const myTeam = gs?.teams?.team1?.includes(socketId) ? 'team1' : 'team2';
    iWon = winner === myTeam;
  } else {
    iWon = winner === socketId;
  }

  useEffect(() => { if (iWon) SFX.win();
    else SFX.error(); }, [iWon]);

  const sorted = useMemo(() => [...players].sort((a, b) => (gs?.penalties?.[a.id] || 0) - (gs?.penalties?.[b.id] || 0)), [players, gs]);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <BG />
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 100 }}
        style={{
          background: 'rgba(8,16,34,0.97)',
          borderRadius: 22,
          padding: '44px 38px',
          maxWidth: 440,
          width: '90%',
          border: `1px solid ${iWon ? 'rgba(245,200,66,0.35)' : 'rgba(255,45,110,0.25)'}`,
          boxShadow: `0 0 80px ${iWon ? 'rgba(245,200,66,0.1)' : 'rgba(255,45,110,0.07)'}, 0 40px 80px rgba(0,0,0,0.7)`,
          textAlign: 'center',
          zIndex: 1,
          animation: iWon ? 'winner-flash 2s infinite' : undefined,
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>{iWon ? '🏆' : '💀'}</div>
        <h2 style={{
          fontFamily: 'var(--font-d)',
          fontSize: 22,
          color: iWon ? 'var(--gold)' : 'var(--pink)',
          textShadow: `0 0 15px ${iWon ? 'var(--gold)' : 'var(--pink)'}`,
          marginBottom: 8,
        }}>
          {iWon ? "G'ALABA!" : "YUTQAZDINGIZ"}
        </h2>
        <p style={{ color: 'var(--dim)', fontSize: 13, marginBottom: 28 }}>
          {isTeam ?
            (iWon ? 'Sizning jamoangiz g\'alaba qildi!' : 'Raqib jamoa g\'alaba qildi') :
            (iWon ? 'Tabriklaymiz! Siz eng kam jarima yigʻdingiz!' : `${gs?.winnerNickname || players.find(p => p.id === winner)?.nickname} gʻalaba qildi!`)}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {sorted.map((p, rank) => {
            const pen = gs?.penalties?.[p.id] || 0;
            const isLoser = pen >= 12;
            return (
              <div key={p.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: 10,
                background: rank === 0 ? 'rgba(245,200,66,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${rank === 0 ? 'rgba(245,200,66,0.3)' : isLoser ? 'rgba(255,45,110,0.3)' : 'rgba(255,255,255,0.07)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: rank === 0 ? 'var(--gold)' : isLoser ? 'var(--red)' : 'var(--dim)' }}>
                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : '💀'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: rank === 0 ? 'var(--gold)' : 'var(--text)' }}>{p.nickname}</span>
                  {p.id === socketId && <span style={{ fontSize: 9, color: 'var(--cyan)' }}>(sen)</span>}
                </div>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700, color: isLoser ? 'var(--red)' : rank === 0 ? 'var(--gold)' : 'var(--text)' }}>
                  {pen} shtraf
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {isHost && <Btn color="gold" onClick={onPlayAgain}>🔄 QAYTA O'YNASH</Btn>}
          <Btn color="cyan" onClick={onLeave}>← BOSH MENU</Btn>
        </div>
        {!isHost && <p style={{ color: 'var(--dim)', fontSize: 10, marginTop: 14, fontFamily: 'var(--font-ui)' }}>Host qayta boshlashini kuting...</p>}
      </motion.div>
    </div>
  );
}

// ─── 108 GAME SCREEN ──────────────────────────────────────────────
function Game108Screen({ room, gs, myHand, socketId, nickname, onPlay, onDraw, onLeave, onPlayAgain }) {
  const [selected, setSelected] = useState(null);
  const [suitModal, setSuitModal] = useState(false);
  const players = room.players;
  const isMyTurn = gs?.currentPlayer === socketId;
  const topCard = gs?.topCard;
  const pending = gs?.pendingDraw || 0;
  const effSuit = gs?.suitRequest || gs?.currentSuit;

  const playable = useMemo(() => {
    if (!isMyTurn || !myHand || !gs) return new Set();
    return new Set(myHand.filter(c => {
      if (pending > 0) return c.rank === '6' || c.rank === '7' || (c.rank === 'K' && c.suit === 'spades');
      if (c.rank === '8') return c.suit === effSuit;
      return c.suit === effSuit || c.rank === gs.currentRank;
    }).map(c => c.id));
  }, [isMyTurn, myHand, pending, effSuit, gs]);

  const handleCardClick = useCallback((c) => {
    if (!isMyTurn || !playable.has(c.id)) return;
    if (c.rank === 'Q') { setSelected(c);
      setSuitModal(true); } else { SFX.play();
      onPlay(c.id, null); }
  }, [isMyTurn, playable, onPlay]);

  const handleSuitSelect = useCallback((suit) => {
    SFX.play();
    if (selected) {
      onPlay(selected.id, suit);
      setSuitModal(false);
      setSelected(null);
    }
  }, [selected, onPlay]);

  if (gs?.phase === 'gameOver') {
    const iWon = gs.winner === socketId;
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <BG />
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 120 }}
          style={{ background: 'rgba(8,16,34,0.97)', borderRadius: 22, padding: '44px 38px', maxWidth: 400, width: '90%', border: `1px solid ${iWon ? 'rgba(0,255,148,0.35)' : 'rgba(255,45,110,0.25)'}`, boxShadow: '0 40px 80px rgba(0,0,0,0.7)', textAlign: 'center', zIndex: 1 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{iWon ? '🏆' : '💀'}</div>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 22, color: iWon ? 'var(--green)' : 'var(--pink)', textShadow: `0 0 14px ${iWon ? 'var(--green)' : 'var(--pink)'}`, marginBottom: 8 }}>
            {iWon ? 'G\'ALABA!' : 'YUTQAZDINGIZ'}
          </h2>
          <p style={{ color: 'var(--dim)', marginBottom: 28 }}>
            {gs.winnerNickname} barcha kartasidan qutulib gʻalaba qildi!
          </p>
          <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: p.id === gs.winner ? 'var(--green)' : 'var(--text)' }}>{p.nickname}</span>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--dim)' }}>🃏 {gs.handSizes?.[p.id] || 0} qoldi</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {room.host === socketId && <Btn color="green" onClick={onPlayAgain}>🔄 QAYTA</Btn>}
            <Btn color="cyan" onClick={onLeave}>← MENU</Btn>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 20, overflow: 'hidden' }}>
      <BG variant="game" />

      <AnimatePresence>
        {suitModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div initial={{ scale: 0.8, y: 24 }} animate={{ scale: 1, y: 0 }}
              style={{ background: 'var(--surface)', borderRadius: 16, padding: '30px', border: '1px solid rgba(0,229,255,0.25)', textAlign: 'center' }}
            >
              <h3 style={{ fontFamily: 'var(--font-d)', fontSize: 16, color: 'var(--gold)', marginBottom: 20 }}>SUIT TANLANG (QUEEN)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {['spades', 'hearts', 'diamonds', 'clubs'].map(s => (
                  <motion.button key={s} onClick={() => handleSuitSelect(s)}
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', zIndex: 10, background: 'rgba(2,4,8,0.82)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,229,255,0.07)' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {players.map(p => {
            const isCurrent = gs?.currentPlayer === p.id;
            return (
              <div key={p.id} style={{
                padding: '4px 9px',
                borderRadius: 5,
                background: isCurrent ? 'rgba(0,255,148,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isCurrent ? 'var(--green)' : 'rgba(255,255,255,0.07)'}`,
                fontFamily: 'var(--font-ui)',
                fontSize: 10,
                color: isCurrent ? 'var(--green)' : p.id === socketId ? 'var(--cyan)' : 'var(--dim)',
              }}>
                {p.nickname.slice(0, 8)} 🃏{gs?.handSizes?.[p.id] || 0}
              </div>
            );
          })}
        </div>
        <Btn small color="red" onClick={onLeave}>✕</Btn>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 12, fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--cyan)' }}>
          {gs?.direction === 1 ? '↻ Soat yo\'nalishi' : '↺ Teskari yo\'nalish'}
        </div>
        {pending > 0 && (
          <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}
            style={{
              marginBottom: 12,
              padding: '7px 18px',
              borderRadius: 20,
              background: 'rgba(255,45,110,0.15)',
              border: '1px solid var(--pink)',
              color: 'var(--pink)',
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              boxShadow: '0 0 18px rgba(255,45,110,0.3)',
            }}
          >⚠ +{pending} KARTA OLISH KERAK</motion.div>
        )}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--dim)', fontFamily: 'var(--font-ui)', marginBottom: 6 }}>
              DAST ({gs?.drawPileCount || 0})
            </div>
            <motion.div whileHover={isMyTurn ? { scale: 1.06 } : {}} whileTap={isMyTurn ? { scale: 0.94 } : {}} onClick={isMyTurn ? () => { SFX.draw();
              onDraw(); } : undefined} style={{ cursor: isMyTurn ? 'pointer' : 'default' }}>
              <Card faceDown />
            </motion.div>
            {isMyTurn && (
              <div style={{ marginTop: 8 }}>
                <Btn small color="cyan" onClick={() => { SFX.draw();
                  onDraw(); }}>
                  {pending > 0 ? `+${pending} KARTA AL` : 'KARTA OLISH'}
                </Btn>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--dim)', fontFamily: 'var(--font-ui)', marginBottom: 6 }}>
              TASHLANGAN {gs?.suitRequest ? `(${SUIT_LBL[gs.suitRequest]} ZAKAZ)` : ''}
            </div>
            <AnimatePresence mode="wait">
              {topCard && (
                <motion.div key={topCard.id} initial={{ scale: 0.8, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.8 }}>
                  <Card card={topCard} />
                </motion.div>
              )}
            </AnimatePresence>
            {effSuit && (
              <div style={{ marginTop: 6, fontSize: 22, color: SUIT_CLR[effSuit] }}>{SUIT_SYM[effSuit]}</div>
            )}
          </div>
        </div>
        {isMyTurn && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 18, padding: '7px 18px', borderRadius: 20, background: 'rgba(0,255,148,0.12)', border: '1px solid var(--green)', color: 'var(--green)', fontFamily: 'var(--font-ui)', fontSize: 11, boxShadow: '0 0 16px rgba(0,255,148,0.25)' }}>
            SIZNING NAVBATINGIZ
          </motion.div>
        )}
      </div>

      <div style={{ background: 'rgba(2,4,8,0.88)', backdropFilter: 'blur(14px)', borderTop: '1px solid rgba(0,229,255,0.07)', padding: '10px 6px 16px', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: 6, fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--dim)' }}>
          {nickname} • {myHand?.length || 0} karta
        </div>
        <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'nowrap', overflowX: 'auto', paddingTop: 14, paddingBottom: 4 }}>
          {(myHand || []).map((c, i) => (
            <Card key={c.id} card={c} onClick={handleCardClick} playable={playable.has(c.id) && isMyTurn} animDelay={i * 0.04} small />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────
const SOCKET_EVENTS = [
  'connect', 'disconnect', 'registered', 'error', 'moveError', 'joinError',
  'roomCreated', 'roomJoined', 'roomUpdate', 'playerJoined', 'playerLeft',
  'gameStarted', 'dealCards', 'handUpdate', 'gameState', 'roundOver', 'gameOver',
  'gameCancelled', 'returnToLobby', 'chatMessage', 'typing', 'reconnected'
];

export default function App() {
  const [screen, setScreen] = useState('login');
  const [nickname, setNickname] = useState('');
  const [socketId, setSocketId] = useState('');
  const [selGame, setSelGame] = useState('');
  const [room, setRoom] = useState(null);
  const [gs, setGs] = useState(null);
  const [myHand, setMyHand] = useState([]);
  const [chats, setChats] = useState([]);
  const [typing, setTyping] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [online, setOnline] = useState(false);

  const sockRef = useRef(null);
  const tTyping = useRef({});
  const toastId = useRef(0);
  const roomRef = useRef(null);

  const toast = useCallback((msg, type = 'info') => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    sockRef.current = socket;

    const onConnect = () => {
      setOnline(true);
      setSocketId(socket.id);
      const saved = localStorage.getItem('karta_nick');
      if (saved) socket.emit('register', { nickname: saved });
    };

    const onDisconnect = () => {
      setOnline(false);
      toast('Ulanish uzildi. Qayta ulanmoqda...', 'error');
    };

    const onRegistered = ({ nickname: n }) => { setNickname(n); };

    const onError = ({ msg }) => { toast(msg, 'error');
      SFX.error(); };
    const onMoveError = ({ msg }) => { toast(msg, 'error');
      SFX.error(); };
    const onJoinError = ({ msg }) => { toast(msg, 'error');
      SFX.error(); };

    const onRoomCreated = ({ room: r }) => {
      setRoom(r);
      setChats(r.chat || []);
      setScreen('lobby');
    };
    const onRoomJoined = ({ room: r }) => {
      setRoom(r);
      setChats(r.chat || []);
      setScreen('lobby');
    };
    const onRoomUpdate = ({ room: r }) => setRoom(r);
    const onPlayerJoined = ({ nickname: n }) => { toast(`${n} qoʻshildi!`, 'success');
      SFX.join(); };
    const onPlayerLeft = ({ nickname: n, room: r }) => {
      toast(`${n} chiqdi`, 'info');
      if (r) setRoom(r);
    };

    const onGameStarted = ({ room: r }) => {
      setRoom(r);
      setMyHand([]);
      setGs(null);
      SFX.deal();
    };
    const onDealCards = ({ hand }) => { setMyHand(hand);
      SFX.deal(); };
    const onHandUpdate = ({ hand }) => setMyHand(hand);

    const onGameState = (state) => {
      setGs(state);
      setScreen(prev => {
        if (prev === 'lobby' && state) return roomRef.current?.gameMode || prev;
        return prev;
      });
    };

    const onRoundOver = (state) => { setGs(state); };
    const onGameOver = (state) => { setGs(prev => ({ ...prev, ...state, phase: 'gameOver' })); };

    const onGameCancelled = ({ reason, room: r }) => {
      toast(reason, 'error');
      if (r) setRoom(r);
      setGs(null);
      setMyHand([]);
      setScreen('lobby');
    };

    const onReturnToLobby = ({ room: r }) => {
      setRoom(r);
      setGs(null);
      setMyHand([]);
      setScreen('lobby');
    };

    const onChatMessage = (m) => setChats(p => [...p, m]);

    const onTyping = ({ nickname: n }) => {
      setTyping(p => [...new Set([...p, n])]);
      clearTimeout(tTyping.current[n]);
      tTyping.current[n] = setTimeout(() => setTyping(p => p.filter(u => u !== n)), 2000);
    };

    const onReconnected = ({ room: r, gameState: gs2 }) => {
      setRoom(r);
      if (gs2?.hand) setMyHand(gs2.hand);
      if (gs2?.public) setGs(gs2.public);
      setChats(r.chat || []);
      setScreen(r.status === 'playing' ? r.gameMode : 'lobby');
      toast('Xonaga qayta ulandi!', 'success');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('registered', onRegistered);
    socket.on('error', onError);
    socket.on('moveError', onMoveError);
    socket.on('joinError', onJoinError);
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

    return () => {
      SOCKET_EVENTS.forEach(ev => socket.off(ev));
      Object.values(tTyping.current).forEach(t => clearTimeout(t));
    };
  }, [toast]);

  useEffect(() => { roomRef.current = room; }, [room]);

  useEffect(() => {
    if (gs && room && screen === 'lobby') setScreen(room.gameMode);
  }, [gs, room, screen]);

  const login = useCallback((n) => {
    setNickname(n);
    sockRef.current.emit('register', { nickname: n });
    setScreen('menu');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('karta_nick');
    setNickname('');
    setRoom(null);
    setGs(null);
    setMyHand([]);
    setScreen('login');
  }, []);

  const createRoom = useCallback(({ gameMode, gameType, deckCount }) => {
    sockRef.current.emit('createRoom', { gameMode, gameType, deckCount });
  }, []);

  const joinRoom = useCallback((roomId) => {
    sockRef.current.emit('joinRoom', { roomId: roomId.trim() });
  }, []);

  const leave = useCallback(() => {
    if (room?.id) sockRef.current.emit('leaveRoom', { roomId: room.id });
    setRoom(null);
    setGs(null);
    setMyHand([]);
    setChats([]);
    setScreen('menu');
  }, [room]);

  const sendChat = useCallback((text) => {
    sockRef.current.emit('chatMessage', { roomId: room?.id, text });
  }, [room]);

  const buraPlay = useCallback((cardId) => {
    sockRef.current.emit('buraPlayCard', { roomId: room?.id, cardId });
  }, [room]);

  const buraThrow = useCallback(() => {
    sockRef.current.emit('buraThrow', { roomId: room?.id });
  }, [room]);

  const play108 = useCallback((cardId, suit) => {
    sockRef.current.emit('108PlayCard', { roomId: room?.id, cardId, chosenSuit: suit });
  }, [room]);

  const draw108 = useCallback(() => {
    sockRef.current.emit('108DrawCard', { roomId: room?.id });
  }, [room]);

  const playAgain = useCallback(() => {
    sockRef.current.emit('playAgain', { roomId: room?.id });
  }, [room]);

  const nextRound = useCallback(() => {
    sockRef.current.emit('playAgain', { roomId: room?.id });
  }, [room]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'fixed',
        bottom: 10,
        left: 10,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 9px',
        borderRadius: 20,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${online ? 'rgba(0,255,148,0.25)' : 'rgba(255,45,110,0.25)'}`,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: online ? 'var(--green)' : 'var(--pink)', boxShadow: `0 0 5px ${online ? 'var(--green)' : 'var(--pink)'}` }} />
        <span style={{ fontSize: 8.5, fontFamily: 'var(--font-ui)', color: 'var(--dim)', letterSpacing: '.1em' }}>
          {online ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <Toast toasts={toasts} />

      <AnimatePresence mode="wait">
        {screen === 'login' && (
          <motion.div key="login" style={{ position: 'fixed', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginScreen onLogin={login} />
          </motion.div>
        )}
        {screen === 'menu' && (
          <motion.div key="menu" style={{ position: 'fixed', inset: 0 }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <MenuScreen nickname={nickname} onSelect={id => { setSelGame(id);
              setScreen('select'); }} onLogout={logout} />
          </motion.div>
        )}
        {screen === 'select' && (
          <motion.div key="sel" style={{ position: 'fixed', inset: 0 }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <SelectScreen gameMode={selGame} onBack={() => setScreen('menu')} onCreate={createRoom} onJoin={joinRoom} />
          </motion.div>
        )}
        {screen === 'lobby' && room && (
          <motion.div key="lobby" style={{ position: 'fixed', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LobbyScreen room={room} nickname={nickname} socketId={socketId} onStart={() => sockRef.current.emit('startGame', { roomId: room.id })} onLeave={leave} onToggleReady={() => sockRef.current.emit('toggleReady', { roomId: room.id })} onSendChat={sendChat} chats={chats} typingUsers={typing} />
          </motion.div>
        )}
        {screen === 'bura' && room && (
          <motion.div key="bura" style={{ position: 'fixed', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BuraScreen room={room} gs={gs} myHand={myHand} socketId={socketId} nickname={nickname} onPlay={buraPlay} onThrow={buraThrow} onLeave={leave} onPlayAgain={playAgain} onNextRound={nextRound} />
          </motion.div>
        )}
        {screen === '108' && room && (
          <motion.div key="108" style={{ position: 'fixed', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Game108Screen room={room} gs={gs} myHand={myHand} socketId={socketId} nickname={nickname} onPlay={play108} onDraw={draw108} onLeave={leave} onPlayAgain={playAgain} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}