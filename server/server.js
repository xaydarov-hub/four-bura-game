/**
 * ═══════════════════════════════════════════════════════════════
 *  KARTA O'YINI - PRODUCTION BACKEND SERVER
 *  To'rt Bura & 108 - Real Multiplayer Card Game
 *  Node.js + Express + Socket.IO
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

// ─── IN-MEMORY STATE ────────────────────────────────────────────
const rooms = {}; // roomId -> RoomState
const players = {}; // socketId -> { nickname, roomId, roomGame }

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
  do { code = Math.floor(100000 + Math.random() * 900000).toString(); }
  while (rooms[code]);
  return code;
}

// ─── BURA GAME ENGINE ───────────────────────────────────────────
function initBuraGame(room) {
  const { players: ps, gameType } = room;
  const deck = shuffle(createDeck(1));
  const handSize = 6;
  const hands = {};
  ps.forEach((p, i) => { hands[p.id] = deck.slice(i * handSize, (i + 1) * handSize); });
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
  const cardIdx = hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return { error: 'Card not in hand' };

  const card = hand[cardIdx];

  // Validate: must follow suit if possible (for trick)
  if (g.currentTrick.length > 0) {
    const ledSuit = g.currentTrick[0].card.suit;
    const hasSuit = hand.some(c => c.suit === ledSuit);
    if (hasSuit && card.suit !== ledSuit && card.suit !== g.trumpSuit) {
      // Check if they have trump
      const hasTrump = hand.some(c => c.suit === g.trumpSuit);
      if (!hasTrump) return { error: 'Must follow led suit' };
    }
  }

  // Remove card from hand
  g.hands[socketId] = hand.filter(c => c.id !== cardId);
  g.currentTrick.push({ playerId: socketId, card });

  const ps = room.players;
  const numPlayers = ps.length;

  // Check if trick complete
  if (g.currentTrick.length === numPlayers) {
    // Determine trick winner
    const winnerId = resolveBuraTrick(g.currentTrick, g.trumpSuit);
    const points = g.currentTrick.reduce((s, t) => s + (BURA_POINTS[t.card.rank] || 0), 0);

    // Add points
    if (g.teams) {
      const team = g.teams.team1.includes(winnerId) ? 'team1' : 'team2';
      g.teamScores[team] += points;
    } else {
      g.scores[winnerId] = (g.scores[winnerId] || 0) + points;
    }

    g.history.push({ trick: [...g.currentTrick], winner: winnerId, points });
    g.currentTrick = [];

    // Deal more cards if deck has cards (2-player deals 1 each)
    if (numPlayers === 2 && g.deck.length > 0) {
      const winnerIdx = ps.findIndex(p => p.id === winnerId);
      const loserIdx = 1 - winnerIdx;
      if (g.deck.length >= 1) g.hands[ps[winnerIdx].id].push(g.deck.pop());
      if (g.deck.length >= 1) g.hands[ps[loserIdx].id].push(g.deck.pop());
    }

    // Check round end
    const allEmpty = ps.every(p => g.hands[p.id].length === 0);
    if (allEmpty && g.deck.length === 0) {
      g.phase = 'roundOver';
      g.roundOver = true;
      // Determine winner
      if (g.teams) {
        g.winner = g.teamScores.team1 >= 61 ? 'team1' : 'team2';
      } else {
        const maxScore = Math.max(...Object.values(g.scores));
        const winnersArr = Object.entries(g.scores).filter(([, v]) => v === maxScore).map(([k]) => k);
        g.winner = winnersArr[0];
      }
      return { trickComplete: true, trickWinner: winnerId, points, gameOver: true };
    }

    // Next leader is trick winner
    const nextLeaderIdx = ps.findIndex(p => p.id === winnerId);
    g.currentPlayerIdx = nextLeaderIdx;
    g.currentPlayer = winnerId;
    g.trickLeader = winnerId;

    return { trickComplete: true, trickWinner: winnerId, points };
  } else {
    // Next player
    const curIdx = ps.findIndex(p => p.id === socketId);
    g.currentPlayerIdx = (curIdx + 1) % numPlayers;
    g.currentPlayer = ps[g.currentPlayerIdx].id;
    return { cardPlayed: true };
  }
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
const GAME_108_RANK_ORDER = ['6','7','8','9','10','J','Q','K','A'];

function init108Game(room, deckCount = 1) {
  const ps = room.players;
  const deck = shuffle(createDeck(deckCount));
  const handSize = 7;
  const hands = {};
  ps.forEach((p, i) => { hands[p.id] = deck.slice(i * handSize, (i + 1) * handSize); });
  let drawPile = deck.slice(ps.length * handSize);
  let discardPile = [];

  // Find first non-special card for discard
  let startIdx = drawPile.findIndex(c => !['6','7','8','A'].includes(c.rank) && !(c.rank === 'K' && c.suit === 'spades'));
  if (startIdx === -1) startIdx = 0;
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
    direction: 1, // 1=clockwise, -1=counter
    pendingDraw: 0,
    skipNext: false,
    suitRequest: null,
    winner: null,
    phase: 'playing',
    deckCount,
  };
}

function game108PlayCard(room, socketId, cardId, chosenSuit) {
  const g = room.game;
  if (!g || g.phase !== 'playing') return { error: 'Game not active' };
  if (g.currentPlayer !== socketId) return { error: 'Not your turn' };

  const ps = room.players;
  const hand = g.hands[socketId];
  const cardIdx = hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return { error: 'Card not in hand' };

  const card = hand[cardIdx];
  const topCard = g.discardPile[g.discardPile.length - 1];
  const effectiveSuit = g.suitRequest || g.currentSuit;

  // Validate play
  const valid = validate108Play(card, effectiveSuit, g.currentRank, g.pendingDraw);
  if (!valid) return { error: 'Invalid move' };

  // Play card
  g.hands[socketId] = hand.filter(c => c.id !== cardId);
  g.discardPile.push(card);
  g.currentSuit = card.suit;
  g.currentRank = card.rank;
  g.suitRequest = null;

  // Check win
  if (g.hands[socketId].length === 0) {
    g.phase = 'gameOver';
    g.winner = socketId;
    return { gameOver: true, winner: socketId };
  }

  let skipExtra = false;
  let drawAmount = 0;

  // Apply card effects
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
      // Must match suit - already validated
      g.pendingDraw = 0;
      break;
    case 'Q':
      // Suit request
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
      }
      break;
    case 'A':
      skipExtra = true;
      g.pendingDraw = 0;
      break;
    default:
      g.pendingDraw = 0;
  }

  // Advance turn
  const numPlayers = ps.length;
  let nextIdx = (g.currentPlayerIdx + g.direction + numPlayers) % numPlayers;

  if (skipExtra) {
    // Next player draws if pending, then skip
    const nextPlayer = ps[nextIdx];
    if (drawAmount > 0) {
      for (let i = 0; i < drawAmount; i++) {
        if (g.drawPile.length === 0) reshuffleDiscard(g);
        if (g.drawPile.length > 0) g.hands[nextPlayer.id].push(g.drawPile.pop());
      }
      g.pendingDraw = 0;
    }
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
  g.drawPile = shuffle(g.discardPile);
  g.discardPile = [top];
}

function validate108Play(card, effectiveSuit, currentRank, pendingDraw) {
  // If pending draw, only 6/7/King of spades can stack
  if (pendingDraw > 0) {
    if (card.rank === '6' || card.rank === '7') return true;
    if (card.rank === 'K' && card.suit === 'spades') return true;
    return false;
  }
  // 8 matches any suit with same suit
  if (card.rank === '8') return card.suit === effectiveSuit;
  // Normal: match suit or rank
  return card.suit === effectiveSuit || card.rank === currentRank;
}

// ─── SOCKET.IO HANDLERS ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ── REGISTER NICKNAME ──
  socket.on('register', ({ nickname }) => {
    if (!nickname || nickname.trim().length < 2) {
      socket.emit('error', { msg: 'Nickname must be 2+ chars' });
      return;
    }
    players[socket.id] = { nickname: nickname.trim(), roomId: null };
    socket.emit('registered', { nickname: nickname.trim(), socketId: socket.id });
    console.log(`[R] ${nickname} registered (${socket.id})`);
  });

  // ── CREATE ROOM ──
  socket.on('createRoom', ({ gameMode, gameType, deckCount }) => {
    const player = players[socket.id];
    if (!player) return socket.emit('error', { msg: 'Register first' });

    const roomId = generateRoomCode();
    rooms[roomId] = {
      id: roomId,
      host: socket.id,
      gameMode, // 'bura' | '108'
      gameType, // '2p' | '4p' (bura) | '2-6' (108)
      deckCount: deckCount || 1,
      players: [{ id: socket.id, nickname: player.nickname }],
      maxPlayers: gameMode === 'bura' ? (gameType === '4p' ? 4 : 2) : 6,
      minPlayers: gameMode === 'bura' ? (gameType === '4p' ? 4 : 2) : 2,
      status: 'lobby',
      chat: [],
      game: null,
      readyPlayers: new Set(),
    };

    player.roomId = roomId;
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, room: sanitizeRoom(rooms[roomId]) });
    console.log(`[C] Room ${roomId} created by ${player.nickname} (${gameMode} ${gameType})`);
  });

  // ── JOIN ROOM ──
  socket.on('joinRoom', ({ roomId }) => {
    const player = players[socket.id];
    if (!player) return socket.emit('error', { msg: 'Register first' });

    const room = rooms[roomId];
    if (!room) return socket.emit('joinError', { msg: 'Room not found' });
    if (room.status !== 'lobby') return socket.emit('joinError', { msg: 'Game already started' });
    if (room.players.length >= room.maxPlayers) return socket.emit('joinError', { msg: 'Room is full' });
    if (room.players.find(p => p.id === socket.id)) return socket.emit('joinError', { msg: 'Already in room' });

    room.players.push({ id: socket.id, nickname: player.nickname });
    player.roomId = roomId;
    socket.join(roomId);

    io.to(roomId).emit('roomUpdate', { room: sanitizeRoom(room) });
    socket.emit('roomJoined', { roomId, room: sanitizeRoom(room) });

    // Play join sound cue
    io.to(roomId).emit('playerJoined', { nickname: player.nickname });
    console.log(`[J] ${player.nickname} joined room ${roomId}`);
  });

  // ── RECONNECT ──
  socket.on('reconnectRoom', ({ roomId, nickname }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error', { msg: 'Room gone' });

    const existingIdx = room.players.findIndex(p => p.nickname === nickname);
    if (existingIdx === -1) return socket.emit('error', { msg: 'Player not found' });

    // Update socket id
    const oldId = room.players[existingIdx].id;
    room.players[existingIdx].id = socket.id;
    if (room.host === oldId) room.host = socket.id;
    if (room.game) {
      if (room.game.hands && room.game.hands[oldId]) {
        room.game.hands[socket.id] = room.game.hands[oldId];
        delete room.game.hands[oldId];
      }
      if (room.game.scores && room.game.scores[oldId] !== undefined) {
        room.game.scores[socket.id] = room.game.scores[oldId];
        delete room.game.scores[oldId];
      }
      if (room.game.currentPlayer === oldId) room.game.currentPlayer = socket.id;
    }

    players[socket.id] = { nickname, roomId };
    socket.join(roomId);
    socket.emit('reconnected', { room: sanitizeRoom(room), gameState: getGameState(room, socket.id) });
    io.to(roomId).emit('playerReconnected', { nickname });
  });

  // ── START GAME ──
  socket.on('startGame', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error', { msg: 'Room not found' });
    if (room.host !== socket.id) return socket.emit('error', { msg: 'Only host can start' });
    if (room.players.length < room.minPlayers) return socket.emit('error', { msg: `Need ${room.minPlayers} players` });

    room.status = 'playing';
    if (room.gameMode === 'bura') initBuraGame(room);
    else init108Game(room, room.deckCount);

    io.to(roomId).emit('gameStarted', { room: sanitizeRoom(room) });
    // Send each player their private hand
    room.players.forEach(p => {
      const playerSocket = io.sockets.sockets.get(p.id);
      if (playerSocket) {
        playerSocket.emit('dealCards', { hand: room.game.hands[p.id] });
      }
    });
    io.to(roomId).emit('gameState', buildPublicGameState(room));
    console.log(`[S] Game started in room ${roomId}`);
  });

  // ── BURA: PLAY CARD ──
  socket.on('buraPlayCard', ({ roomId, cardId }) => {
    const room = rooms[roomId];
    if (!room || room.gameMode !== 'bura') return;

    const result = buraPlayCard(room, socket.id, cardId);
    if (result.error) return socket.emit('moveError', { msg: result.error });

    // Broadcast updated state
    io.to(roomId).emit('gameState', buildPublicGameState(room));
    // Send updated hands
    room.players.forEach(p => {
      const ps = io.sockets.sockets.get(p.id);
      if (ps) ps.emit('handUpdate', { hand: room.game.hands[p.id] });
    });

    if (result.trickComplete) {
      io.to(roomId).emit('trickComplete', {
        winner: result.trickWinner,
        points: result.points,
        trick: room.game.history[room.game.history.length - 1]?.trick,
      });
    }
    if (result.gameOver) {
      io.to(roomId).emit('gameOver', buildGameOverData(room));
    }
  });

  // ── 108: PLAY CARD ──
  socket.on('108PlayCard', ({ roomId, cardId, chosenSuit }) => {
    const room = rooms[roomId];
    if (!room || room.gameMode !== '108') return;

    const result = game108PlayCard(room, socket.id, cardId, chosenSuit);
    if (result.error) return socket.emit('moveError', { msg: result.error });

    io.to(roomId).emit('gameState', buildPublicGameState(room));
    room.players.forEach(p => {
      const ps = io.sockets.sockets.get(p.id);
      if (ps) ps.emit('handUpdate', { hand: room.game.hands[p.id] });
    });

    if (result.gameOver) {
      io.to(roomId).emit('gameOver', buildGameOverData(room));
    }
  });

  // ── 108: DRAW CARD ──
  socket.on('108DrawCard', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.gameMode !== '108') return;

    const result = game108DrawCard(room, socket.id);
    if (result.error) return socket.emit('moveError', { msg: result.error });

    io.to(roomId).emit('gameState', buildPublicGameState(room));
    const ps = io.sockets.sockets.get(socket.id);
    if (ps) ps.emit('handUpdate', { hand: room.game.hands[socket.id] });
  });

  // ── CHAT ──
  socket.on('chatMessage', ({ roomId, text }) => {
    const player = players[socket.id];
    if (!player || !text?.trim()) return;
    const msg = { id: Date.now(), nickname: player.nickname, text: text.trim().slice(0, 200), time: new Date().toISOString() };
    const room = rooms[roomId];
    if (room) { room.chat.push(msg); if (room.chat.length > 100) room.chat.shift(); }
    io.to(roomId).emit('chatMessage', msg);
  });

  // ── TYPING ──
  socket.on('typing', ({ roomId }) => {
    const player = players[socket.id];
    if (player) socket.to(roomId).emit('typing', { nickname: player.nickname });
  });

  // ── LEAVE ROOM ──
  socket.on('leaveRoom', ({ roomId }) => handleLeave(socket, roomId));

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    const player = players[socket.id];
    if (player?.roomId) handleLeave(socket, player.roomId, true);
    delete players[socket.id];
  });

  // ── PING ──
  socket.on('ping', () => socket.emit('pong', { time: Date.now() }));
});

function handleLeave(socket, roomId, disconnected = false) {
  const room = rooms[roomId];
  if (!room) return;

  const player = players[socket.id];
  room.players = room.players.filter(p => p.id !== socket.id);
  if (player) player.roomId = null;
  socket.leave(roomId);

  if (room.players.length === 0) {
    delete rooms[roomId];
    console.log(`[X] Room ${roomId} deleted`);
    return;
  }

  // Transfer host
  if (room.host === socket.id) room.host = room.players[0].id;

  io.to(roomId).emit('playerLeft', {
    nickname: player?.nickname,
    disconnected,
    room: sanitizeRoom(room),
  });

  // If game was in progress, pause/end it
  if (room.status === 'playing') {
    room.status = 'lobby';
    room.game = null;
    io.to(roomId).emit('gamePaused', { reason: `${player?.nickname} left the game` });
  }
}

function sanitizeRoom(room) {
  return {
    id: room.id,
    host: room.host,
    gameMode: room.gameMode,
    gameType: room.gameType,
    players: room.players.map(p => ({ id: p.id, nickname: p.nickname })),
    maxPlayers: room.maxPlayers,
    minPlayers: room.minPlayers,
    status: room.status,
    chat: room.chat.slice(-20),
  };
}

function buildPublicGameState(room) {
  const g = room.game;
  if (!g) return null;
  const base = {
    phase: g.phase,
    currentPlayer: g.currentPlayer,
    gameMode: room.gameMode,
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
      handCounts: Object.fromEntries(Object.entries(g.hands).map(([k, v]) => [k, v.length])),
      deckCount: g.deck?.length || 0,
      trickLeader: g.trickLeader,
    };
  } else {
    return {
      ...base,
      topCard: g.discardPile[g.discardPile.length - 1],
      currentSuit: g.suitRequest || g.currentSuit,
      currentRank: g.currentRank,
      direction: g.direction,
      pendingDraw: g.pendingDraw,
      deckCount: g.drawPile?.length || 0,
      suitRequest: g.suitRequest,
      handCounts: Object.fromEntries(Object.entries(g.hands).map(([k, v]) => [k, v.length])),
    };
  }
}

function getGameState(room, playerId) {
  const gs = buildPublicGameState(room);
  if (gs && room.game?.hands?.[playerId]) {
    gs.myHand = room.game.hands[playerId];
  }
  return gs;
}

function buildGameOverData(room) {
  const g = room.game;
  return {
    winner: g.winner,
    scores: g.scores,
    teamScores: g.teamScores,
    teams: g.teams,
    players: room.players,
  };
}

// ─── HEALTH CHECK ───────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', rooms: Object.keys(rooms).length, players: Object.keys(players).length }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`\n🎴 Karta O'yini Server running on port ${PORT}\n`));