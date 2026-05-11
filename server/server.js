/**
 * ═══════════════════════════════════════════════════════════════
 *  KARTA O'YINI - PRODUCTION BACKEND SERVER
 *  To'rt Bura & 108 - Real Multiplayer Card Game
 *  Node.js + Express + Socket.IO
 *
 *  TUZATILGAN XATOLAR:
 *  - Template literal sintaksis xatolari tuzatildi
 *  - Operator xatolari (|| && ternary) tuzatildi
 *  - sanitizeRoom va buildPublicGameState funksiyalari qo'shildi
 *  - buildGameOverData funksiyasi qo'shildi
 *  - getGameState funksiyasi qo'shildi
 *  - Server PORT konfiguratsiyasi qo'shildi
 *  - Ready system qo'shildi
 *  - Nickname uniqness tekshiruvi qo'shildi
 *  - Room cleanup (30 daqiqadan keyin) qo'shildi
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const PORT = process.env.PORT || 3001;

// ─── IN-MEMORY STATE ────────────────────────────────────────────
const rooms = {};   // roomId -> RoomState
const players = {}; // socketId -> { nickname, roomId }

// ─── CARD DECK UTILITIES ────────────────────────────────────────
const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const BURA_POINTS = { A: 11, '10': 10, K: 4, Q: 3, J: 2, '9': 0, '8': 0, '7': 0, '6': 0 };

function createDeck(count = 1) {
  const deck = [];
  for (let d = 0; d < count; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank, id: `${suit}_${rank}_${d}` });
      }
    }
  }
  return shuffle(deck);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms[code]);
  return code;
}

// ─── SANITIZE HELPERS ───────────────────────────────────────────
// Faqat public ma'lumotlarni yuboradi (private hand yuborilmaydi)
function sanitizeRoom(room) {
  return {
    id: room.id,
    host: room.host,
    gameMode: room.gameMode,
    gameType: room.gameType,
    deckCount: room.deckCount,
    players: room.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
    })),
    maxPlayers: room.maxPlayers,
    minPlayers: room.minPlayers,
    status: room.status,
    chat: room.chat.slice(-50), // Oxirgi 50 ta xabar
    readyPlayers: Array.from(room.readyPlayers || []),
  };
}

// Public game state - hands private saqlanadi
function buildPublicGameState(room) {
  const g = room.game;
  if (!g) return null;

  const base = {
    phase: g.phase,
    currentPlayer: g.currentPlayer,
    currentPlayerIdx: g.currentPlayerIdx,
    winner: g.winner || null,
  };

  if (room.gameMode === 'bura') {
    return {
      ...base,
      trumpSuit: g.trumpSuit,
      trumpCard: g.trumpCard,
      currentTrick: g.currentTrick,
      scores: g.scores,
      teamScores: g.teamScores,
      teams: g.teams,
      trickLeader: g.trickLeader,
      deckRemaining: g.deck.length,
      handSizes: Object.fromEntries(
        room.players.map(p => [p.id, g.hands[p.id]?.length || 0])
      ),
      history: g.history.slice(-5), // Oxirgi 5 ta trick
    };
  }

  if (room.gameMode === '108') {
    const topDiscard = g.discardPile[g.discardPile.length - 1] || null;
    return {
      ...base,
      currentSuit: g.currentSuit,
      currentRank: g.currentRank,
      direction: g.direction,
      pendingDraw: g.pendingDraw,
      suitRequest: g.suitRequest,
      topCard: topDiscard,
      drawPileCount: g.drawPile.length,
      discardCount: g.discardPile.length,
      handSizes: Object.fromEntries(
        room.players.map(p => [p.id, g.hands[p.id]?.length || 0])
      ),
    };
  }

  return base;
}

// O'yinchi o'z hand'ini olish uchun
function getGameState(room, socketId) {
  const g = room.game;
  if (!g) return null;
  return {
    public: buildPublicGameState(room),
    hand: g.hands?.[socketId] || [],
  };
}

// O'yin tugaganda to'liq natija
function buildGameOverData(room) {
  const g = room.game;
  if (!g) return {};

  if (room.gameMode === 'bura') {
    return {
      winner: g.winner,
      scores: g.scores,
      teamScores: g.teamScores,
      teams: g.teams,
      history: g.history,
      players: room.players,
    };
  }

  if (room.gameMode === '108') {
    const winnerId = g.winner;
    const winnerPlayer = room.players.find(p => p.id === winnerId);
    return {
      winner: winnerId,
      winnerNickname: winnerPlayer?.nickname || 'Unknown',
      handSizes: Object.fromEntries(
        room.players.map(p => [p.id, g.hands[p.id]?.length || 0])
      ),
      players: room.players,
    };
  }

  return {};
}

// ─── BURA GAME ENGINE ───────────────────────────────────────────
function initBuraGame(room) {
  const { players: ps, gameType } = room;
  const deck = shuffle(createDeck(1));
  const handSize = 6;
  const hands = {};
  ps.forEach((p, i) => {
    hands[p.id] = deck.slice(i * handSize, (i + 1) * handSize);
  });
  const remaining = deck.slice(ps.length * handSize);
  const trumpCard = remaining[remaining.length - 1];

  room.game = {
    phase: 'playing',
    deck: remaining,
    hands,
    trumpSuit: trumpCard.suit,
    trumpCard,
    currentTrick: [],
    scores: ps.reduce((a, p) => { a[p.id] = 0; return a; }, {}),
    teamScores: gameType === '4p' ? { team1: 0, team2: 0 } : null,
    teams: gameType === '4p' ? {
      team1: [ps[0].id, ps[2].id],
      team2: [ps[1].id, ps[3].id],
    } : null,
    currentPlayerIdx: 0,
    currentPlayer: ps[0].id,
    trickLeader: ps[0].id,
    roundOver: false,
    winner: null,
    history: [],
  };
}

function buraPlayCard(room, socketId, cardId) {
  const g = room.game;
  if (!g || g.phase !== 'playing') return { error: 'Game not in playing phase' };
  if (g.currentPlayer !== socketId) return { error: 'Not your turn' };

  const hand = g.hands[socketId];
  if (!hand) return { error: 'No hand found' };

  const cardIdx = hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return { error: 'Card not in hand' };

  const card = hand[cardIdx];

  // ── Suit validation ──
  if (g.currentTrick.length > 0) {
    const ledSuit = g.currentTrick[0].card.suit;
    const hasSuit = hand.some(c => c.suit === ledSuit);
    const hasTrump = hand.some(c => c.suit === g.trumpSuit);

    if (hasSuit && card.suit !== ledSuit && card.suit !== g.trumpSuit) {
      return { error: 'Must follow led suit or play trump' };
    }
    if (!hasSuit && hasTrump && card.suit !== g.trumpSuit) {
      return { error: 'Must play trump if no led suit' };
    }
  }

  // Kartani qo'ldan olib trick'ga qo'sh
  g.hands[socketId] = hand.filter(c => c.id !== cardId);
  g.currentTrick.push({ playerId: socketId, card });

  const ps = room.players;
  const numPlayers = ps.length;

  // ── Trick to'liq bo'ldi ──
  if (g.currentTrick.length === numPlayers) {
    const winnerId = resolveBuraTrick(g.currentTrick, g.trumpSuit);
    const points = g.currentTrick.reduce((s, t) => s + (BURA_POINTS[t.card.rank] || 0), 0);

    // Balllarni qo'sh
    if (g.teams) {
      const team = g.teams.team1.includes(winnerId) ? 'team1' : 'team2';
      g.teamScores[team] += points;
    } else {
      g.scores[winnerId] = (g.scores[winnerId] || 0) + points;
    }

    g.history.push({ trick: [...g.currentTrick], winner: winnerId, points });
    g.currentTrick = [];

    // 2 kishilik: g'olibga birinchi karta beriladi
    if (numPlayers === 2 && g.deck.length > 0) {
      const winnerIdx = ps.findIndex(p => p.id === winnerId);
      const loserIdx = 1 - winnerIdx;
      if (g.deck.length >= 1) g.hands[ps[winnerIdx].id].push(g.deck.pop());
      if (g.deck.length >= 1) g.hands[ps[loserIdx].id].push(g.deck.pop());
    }

    // O'yin tugadimi?
    const allEmpty = ps.every(p => (g.hands[p.id]?.length || 0) === 0);
    if (allEmpty && g.deck.length === 0) {
      g.phase = 'roundOver';
      g.roundOver = true;

      if (g.teams) {
        g.winner = g.teamScores.team1 >= 61 ? 'team1' : 'team2';
      } else {
        const maxScore = Math.max(...Object.values(g.scores));
        const winners = Object.entries(g.scores)
          .filter(([, v]) => v === maxScore)
          .map(([k]) => k);
        g.winner = winners[0];
      }

      return { trickComplete: true, trickWinner: winnerId, points, gameOver: true };
    }

    // Keyingi lider trick g'olibi
    const nextLeaderIdx = ps.findIndex(p => p.id === winnerId);
    g.currentPlayerIdx = nextLeaderIdx;
    g.currentPlayer = winnerId;
    g.trickLeader = winnerId;

    return { trickComplete: true, trickWinner: winnerId, points };
  }

  // Keyingi o'yinchi navbatiga o'tish
  const curIdx = ps.findIndex(p => p.id === socketId);
  g.currentPlayerIdx = (curIdx + 1) % numPlayers;
  g.currentPlayer = ps[g.currentPlayerIdx].id;
  return { cardPlayed: true };
}

function resolveBuraTrick(trick, trumpSuit) {
  const ledSuit = trick[0].card.suit;
  let winner = trick[0];

  for (let i = 1; i < trick.length; i++) {
    const t = trick[i];
    const w = winner;
    const tIsTrump = t.card.suit === trumpSuit;
    const wIsTrump = w.card.suit === trumpSuit;

    if (tIsTrump && !wIsTrump) { winner = t; continue; }
    if (!tIsTrump && wIsTrump) continue;
    if (t.card.suit === w.card.suit) {
      if (RANKS.indexOf(t.card.rank) > RANKS.indexOf(w.card.rank)) winner = t;
    }
  }

  return winner.playerId;
}

// ─── 108 GAME ENGINE ────────────────────────────────────────────
function init108Game(room, deckCount = 1) {
  const ps = room.players;
  const deck = shuffle(createDeck(deckCount));
  const handSize = 7;
  const hands = {};
  ps.forEach((p, i) => {
    hands[p.id] = deck.slice(i * handSize, (i + 1) * handSize);
  });
  let drawPile = deck.slice(ps.length * handSize);

  // Boshlang'ich karta - special bo'lmasin
  let startIdx = drawPile.findIndex(c =>
    !['6', '7', 'A'].includes(c.rank) &&
    !(c.rank === 'K' && c.suit === 'spades') &&
    c.rank !== 'Q'
  );
  if (startIdx === -1) startIdx = 0;

  const discardPile = [];
  const topCard = drawPile.splice(startIdx, 1)[0];
  discardPile.push(topCard);

  room.game = {
    phase: 'playing',
    hands,
    drawPile,
    discardPile,
    currentSuit: topCard.suit,
    currentRank: topCard.rank,
    currentPlayerIdx: 0,
    currentPlayer: ps[0].id,
    direction: 1,      // 1=soat yo'nalishida, -1=teskari
    pendingDraw: 0,
    suitRequest: null,
    winner: null,
    deckCount,
  };
}

function game108PlayCard(room, socketId, cardId, chosenSuit) {
  const g = room.game;
  if (!g || g.phase !== 'playing') return { error: 'Game not active' };
  if (g.currentPlayer !== socketId) return { error: 'Not your turn' };

  const ps = room.players;
  const hand = g.hands[socketId];
  if (!hand) return { error: 'No hand found' };

  const cardIdx = hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return { error: 'Card not in hand' };

  const card = hand[cardIdx];
  const effectiveSuit = g.suitRequest || g.currentSuit;

  // Harakat validatsiyasi
  const valid = validate108Play(card, effectiveSuit, g.currentRank, g.pendingDraw);
  if (!valid) return { error: 'Invalid move' };

  // Kartani o'yna
  g.hands[socketId] = hand.filter(c => c.id !== cardId);
  g.discardPile.push(card);
  g.currentSuit = card.suit;
  g.currentRank = card.rank;
  g.suitRequest = null;

  // G'alaba tekshiruvi
  if (g.hands[socketId].length === 0) {
    g.phase = 'gameOver';
    g.winner = socketId;
    return { gameOver: true, winner: socketId };
  }

  const numPlayers = ps.length;
  let skipExtra = false;
  let drawAmount = 0;

  // Karta effektlari
  switch (card.rank) {
    case '6':
      g.pendingDraw = (g.pendingDraw || 0) + 1;
      drawAmount = g.pendingDraw;
      skipExtra = true;
      break;

    case '7':
      g.pendingDraw = (g.pendingDraw || 0) + 2;
      drawAmount = g.pendingDraw;
      skipExtra = true;
      break;

    case '8':
      // Oddiy - faqat suit moslik bilan o'ynaladi (validated above)
      g.pendingDraw = 0;
      break;

    case 'Q':
      // Suit tanlash
      if (chosenSuit && SUITS.includes(chosenSuit)) {
        g.suitRequest = chosenSuit;
        g.currentSuit = chosenSuit;
      }
      break;

    case 'K':
      if (card.suit === 'spades') {
        g.pendingDraw = (g.pendingDraw || 0) + 4;
        drawAmount = g.pendingDraw;
        skipExtra = true;
      } else {
        g.pendingDraw = 0;
      }
      break;

    case 'A':
      skipExtra = true;
      g.pendingDraw = 0;
      break;

    default:
      g.pendingDraw = 0;
      break;
  }

  // Navbat almashtirish
  let nextIdx = (g.currentPlayerIdx + g.direction + numPlayers) % numPlayers;

  if (skipExtra) {
    // Keyingi o'yinchi kartalarni oladi (agar pendingDraw bo'lsa)
    const nextPlayer = ps[nextIdx];
    if (drawAmount > 0) {
      for (let i = 0; i < drawAmount; i++) {
        if (g.drawPile.length === 0) reshuffleDiscard(g);
        if (g.drawPile.length > 0) g.hands[nextPlayer.id].push(g.drawPile.pop());
      }
      g.pendingDraw = 0;
    }
    // Skip - undan keyingiga o'tish
    nextIdx = (nextIdx + g.direction + numPlayers) % numPlayers;
  }

  g.currentPlayerIdx = nextIdx;
  g.currentPlayer = ps[nextIdx].id;

  return { cardPlayed: true };
}

function game108DrawCard(room, socketId) {
  const g = room.game;
  if (!g || g.phase !== 'playing') return { error: 'Game not active' };
  if (g.currentPlayer !== socketId) return { error: 'Not your turn' };

  const ps = room.players;
  const numDraw = g.pendingDraw > 0 ? g.pendingDraw : 1;

  for (let i = 0; i < numDraw; i++) {
    if (g.drawPile.length === 0) reshuffleDiscard(g);
    if (g.drawPile.length > 0) g.hands[socketId].push(g.drawPile.pop());
  }
  g.pendingDraw = 0;

  const numPlayers = ps.length;
  g.currentPlayerIdx = (g.currentPlayerIdx + g.direction + numPlayers) % numPlayers;
  g.currentPlayer = ps[g.currentPlayerIdx].id;

  return { drew: numDraw };
}

function reshuffleDiscard(g) {
  if (g.discardPile.length <= 1) return;
  const top = g.discardPile.pop();
  g.drawPile = shuffle([...g.discardPile]);
  g.discardPile = [top];
}

function validate108Play(card, effectiveSuit, currentRank, pendingDraw) {
  // Agar pending draw bo'lsa, faqat stack kartalari o'ynaladi
  if (pendingDraw > 0) {
    if (card.rank === '6' || card.rank === '7') return true;
    if (card.rank === 'K' && card.suit === 'spades') return true;
    return false;
  }
  // 8: faqat shu suit
  if (card.rank === '8') return card.suit === effectiveSuit;
  // Oddiy: suit yoki rank mos kelsin
  return card.suit === effectiveSuit || card.rank === currentRank;
}

// ─── SOCKET.IO HANDLERS ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ── REGISTER NICKNAME ──────────────────────────────────────────
  socket.on('register', ({ nickname }) => {
    if (!nickname || nickname.trim().length < 2) {
      return socket.emit('error', { msg: 'Nickname kamida 2 ta harf bo\'lishi kerak' });
    }
    const trimmed = nickname.trim().slice(0, 20);

    // Nickname uniqueness tekshiruvi
    const taken = Object.values(players).some(p => p.nickname === trimmed && p.socketId !== socket.id);
    if (taken) {
      return socket.emit('error', { msg: 'Bu nickname band. Boshqa nom tanlang.' });
    }

    players[socket.id] = { nickname: trimmed, roomId: null, socketId: socket.id };
    socket.emit('registered', { nickname: trimmed, socketId: socket.id });
    console.log(`[R] ${trimmed} registered (${socket.id})`);
  });

  // ── CREATE ROOM ────────────────────────────────────────────────
  socket.on('createRoom', ({ gameMode, gameType, deckCount }) => {
    const player = players[socket.id];
    if (!player) return socket.emit('error', { msg: 'Avval ro\'yxatdan o\'ting' });

    // Eski roomdan chiqish
    if (player.roomId) {
      handleLeave(socket, player.roomId);
    }

    const roomId = generateRoomCode();
    const maxPlayers = gameMode === 'bura'
      ? (gameType === '4p' ? 4 : 2)
      : 6;
    const minPlayers = gameMode === 'bura'
      ? (gameType === '4p' ? 4 : 2)
      : 2;

    rooms[roomId] = {
      id: roomId,
      host: socket.id,
      gameMode,           // 'bura' | '108'
      gameType,           // '2p' | '4p' (bura)
      deckCount: deckCount || 1,
      players: [{ id: socket.id, nickname: player.nickname }],
      maxPlayers,
      minPlayers,
      status: 'lobby',
      chat: [],
      game: null,
      readyPlayers: new Set(),
      createdAt: Date.now(),
    };

    player.roomId = roomId;
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, room: sanitizeRoom(rooms[roomId]) });
    console.log(`[C] Room ${roomId} created by ${player.nickname} (${gameMode} ${gameType})`);
  });

  // ── JOIN ROOM ──────────────────────────────────────────────────
  socket.on('joinRoom', ({ roomId }) => {
    const player = players[socket.id];
    if (!player) return socket.emit('error', { msg: 'Avval ro\'yxatdan o\'ting' });

    const room = rooms[roomId];
    if (!room) return socket.emit('joinError', { msg: 'Xona topilmadi' });
    if (room.status !== 'lobby') return socket.emit('joinError', { msg: 'O\'yin boshlandi' });
    if (room.players.length >= room.maxPlayers) return socket.emit('joinError', { msg: 'Xona to\'la' });
    if (room.players.find(p => p.id === socket.id)) return socket.emit('joinError', { msg: 'Siz allaqachon bu xondasiz' });

    // Eski roomdan chiqish
    if (player.roomId && player.roomId !== roomId) {
      handleLeave(socket, player.roomId);
    }

    room.players.push({ id: socket.id, nickname: player.nickname });
    player.roomId = roomId;
    socket.join(roomId);

    io.to(roomId).emit('roomUpdate', { room: sanitizeRoom(room) });
    socket.emit('roomJoined', { roomId, room: sanitizeRoom(room) });
    io.to(roomId).emit('playerJoined', { nickname: player.nickname });

    console.log(`[J] ${player.nickname} joined room ${roomId}`);
  });

  // ── RECONNECT ──────────────────────────────────────────────────
  socket.on('reconnectRoom', ({ roomId, nickname }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error', { msg: 'Xona topilmadi' });

    const existingIdx = room.players.findIndex(p => p.nickname === nickname);
    if (existingIdx === -1) return socket.emit('error', { msg: 'O\'yinchi topilmadi' });

    const oldId = room.players[existingIdx].id;
    room.players[existingIdx].id = socket.id;

    if (room.host === oldId) room.host = socket.id;

    // Game state yangilash
    if (room.game) {
      if (room.game.hands?.[oldId]) {
        room.game.hands[socket.id] = room.game.hands[oldId];
        delete room.game.hands[oldId];
      }
      if (room.game.scores?.[oldId] !== undefined) {
        room.game.scores[socket.id] = room.game.scores[oldId];
        delete room.game.scores[oldId];
      }
      if (room.game.currentPlayer === oldId) {
        room.game.currentPlayer = socket.id;
      }
      // Teams yangilash (Bura 4p)
      if (room.game.teams) {
        for (const team of Object.values(room.game.teams)) {
          const idx = team.indexOf(oldId);
          if (idx !== -1) team[idx] = socket.id;
        }
      }
    }

    players[socket.id] = { nickname, roomId, socketId: socket.id };
    socket.join(roomId);
    socket.emit('reconnected', {
      room: sanitizeRoom(room),
      gameState: getGameState(room, socket.id),
    });
    io.to(roomId).emit('playerReconnected', { nickname });
    console.log(`[RC] ${nickname} reconnected to room ${roomId}`);
  });

  // ── READY TOGGLE ───────────────────────────────────────────────
  socket.on('toggleReady', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'lobby') return;

    if (room.readyPlayers.has(socket.id)) {
      room.readyPlayers.delete(socket.id);
    } else {
      room.readyPlayers.add(socket.id);
    }

    io.to(roomId).emit('roomUpdate', { room: sanitizeRoom(room) });
  });

  // ── START GAME ─────────────────────────────────────────────────
  socket.on('startGame', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error', { msg: 'Xona topilmadi' });
    if (room.host !== socket.id) return socket.emit('error', { msg: 'Faqat xona egasi boshlaya oladi' });
    if (room.players.length < room.minPlayers) {
      return socket.emit('error', { msg: `Kamida ${room.minPlayers} ta o'yinchi kerak` });
    }

    room.status = 'playing';
    room.readyPlayers.clear();

    if (room.gameMode === 'bura') initBuraGame(room);
    else init108Game(room, room.deckCount);

    io.to(roomId).emit('gameStarted', { room: sanitizeRoom(room) });

    // Har bir o'yinchiga o'z qo'lini yuborish
    room.players.forEach(p => {
      const playerSocket = io.sockets.sockets.get(p.id);
      if (playerSocket) {
        playerSocket.emit('dealCards', { hand: room.game.hands[p.id] });
      }
    });

    io.to(roomId).emit('gameState', buildPublicGameState(room));
    console.log(`[S] Game started in room ${roomId} (${room.gameMode})`);
  });

  // ── BURA: PLAY CARD ────────────────────────────────────────────
  socket.on('buraPlayCard', ({ roomId, cardId }) => {
    const room = rooms[roomId];
    if (!room || room.gameMode !== 'bura') return;
    if (room.status !== 'playing') return;

    const result = buraPlayCard(room, socket.id, cardId);
    if (result.error) return socket.emit('moveError', { msg: result.error });

    // Public state yangilash
    io.to(roomId).emit('gameState', buildPublicGameState(room));

    // Har o'yinchiga shaxsiy qo'l yuborish
    room.players.forEach(p => {
      const ps = io.sockets.sockets.get(p.id);
      if (ps) ps.emit('handUpdate', { hand: room.game.hands[p.id] });
    });

    if (result.trickComplete) {
      io.to(roomId).emit('trickComplete', {
        winner: result.trickWinner,
        points: result.points,
        trick: room.game.history[room.game.history.length - 1]?.trick || [],
      });
    }

    if (result.gameOver) {
      io.to(roomId).emit('gameOver', buildGameOverData(room));
      room.status = 'finished';
    }
  });

  // ── 108: PLAY CARD ─────────────────────────────────────────────
  socket.on('108PlayCard', ({ roomId, cardId, chosenSuit }) => {
    const room = rooms[roomId];
    if (!room || room.gameMode !== '108') return;
    if (room.status !== 'playing') return;

    const result = game108PlayCard(room, socket.id, cardId, chosenSuit);
    if (result.error) return socket.emit('moveError', { msg: result.error });

    io.to(roomId).emit('gameState', buildPublicGameState(room));

    room.players.forEach(p => {
      const ps = io.sockets.sockets.get(p.id);
      if (ps) ps.emit('handUpdate', { hand: room.game.hands[p.id] });
    });

    if (result.gameOver) {
      io.to(roomId).emit('gameOver', buildGameOverData(room));
      room.status = 'finished';
    }
  });

  // ── 108: DRAW CARD ─────────────────────────────────────────────
  socket.on('108DrawCard', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.gameMode !== '108') return;
    if (room.status !== 'playing') return;

    const result = game108DrawCard(room, socket.id);
    if (result.error) return socket.emit('moveError', { msg: result.error });

    io.to(roomId).emit('gameState', buildPublicGameState(room));

    const ps = io.sockets.sockets.get(socket.id);
    if (ps) ps.emit('handUpdate', { hand: room.game.hands[socket.id] });
  });

  // ── PLAY AGAIN ─────────────────────────────────────────────────
  socket.on('playAgain', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.host !== socket.id) return socket.emit('error', { msg: 'Faqat xona egasi qayta boshlaya oladi' });

    room.status = 'lobby';
    room.game = null;
    room.readyPlayers = new Set();

    io.to(roomId).emit('returnToLobby', { room: sanitizeRoom(room) });
  });

  // ── CHAT ───────────────────────────────────────────────────────
  socket.on('chatMessage', ({ roomId, text }) => {
    const player = players[socket.id];
    if (!player || !text?.trim()) return;

    const msg = {
      id: Date.now() + Math.random(),
      nickname: player.nickname,
      text: text.trim().slice(0, 200),
      time: new Date().toISOString(),
    };

    const room = rooms[roomId];
    if (room) {
      room.chat.push(msg);
      if (room.chat.length > 100) room.chat.shift();
    }

    io.to(roomId).emit('chatMessage', msg);
  });

  // ── TYPING INDICATOR ───────────────────────────────────────────
  socket.on('typing', ({ roomId }) => {
    const player = players[socket.id];
    if (player) {
      socket.to(roomId).emit('typing', { nickname: player.nickname });
    }
  });

  // ── LEAVE ROOM ─────────────────────────────────────────────────
  socket.on('leaveRoom', ({ roomId }) => {
    handleLeave(socket, roomId);
  });

  // ── DISCONNECT ─────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    const player = players[socket.id];
    if (player?.roomId) handleLeave(socket, player.roomId, true);
    delete players[socket.id];
  });

  // ── PING / LATENCY ─────────────────────────────────────────────
  socket.on('ping', () => socket.emit('pong', { time: Date.now() }));
});

// ─── HANDLE LEAVE LOGIC ─────────────────────────────────────────
function handleLeave(socket, roomId, disconnected = false) {
  const room = rooms[roomId];
  if (!room) return;

  const player = players[socket.id];
  const nickname = player?.nickname || 'Unknown';

  room.players = room.players.filter(p => p.id !== socket.id);
  if (player) player.roomId = null;
  socket.leave(roomId);

  // Xona bo'sh bo'lsa o'chirish
  if (room.players.length === 0) {
    delete rooms[roomId];
    console.log(`[X] Room ${roomId} deleted (empty)`);
    return;
  }

  // Hostni o'tkazish
  if (room.host === socket.id) {
    room.host = room.players[0].id;
  }

  io.to(roomId).emit('playerLeft', {
    nickname,
    disconnected,
    room: sanitizeRoom(room),
  });

  // O'yin davomida kishi chiqsa — lobbiga qaytish
  if (room.status === 'playing') {
    room.status = 'lobby';
    room.game = null;
    room.readyPlayers = new Set();
    io.to(roomId).emit('gameCancelled', {
      reason: `${nickname} o'yindan chiqdi`,
      room: sanitizeRoom(room),
    });
  }
}

// ─── ROOM CLEANUP (har 30 daqiqada) ────────────────────────────
setInterval(() => {
  const now = Date.now();
  const THIRTY_MIN = 30 * 60 * 1000;
  let cleaned = 0;
  for (const [roomId, room] of Object.entries(rooms)) {
    if (now - room.createdAt > THIRTY_MIN && room.status === 'finished') {
      delete rooms[roomId];
      cleaned++;
    }
  }
  if (cleaned > 0) console.log(`[GC] Cleaned ${cleaned} finished rooms`);
}, 30 * 60 * 1000);

// ─── HEALTH CHECK ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: Object.keys(rooms).length,
    players: Object.keys(players).length,
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Karta O\'yini Server ishlayapti! 🎴' });
});

// ─── START SERVER ────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   KARTA O'YINI SERVER ISHGA TUSHDI!      ║
║   Port: ${PORT}                              ║
║   To'rt Bura & 108 - Multiplayer         ║
╚══════════════════════════════════════════╝
  `);
});