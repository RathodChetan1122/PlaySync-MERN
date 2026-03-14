const User = require('../../models/User');
const wordScrambleStates = new Map();

const WORDS = [
  { word: 'javascript', hint: 'A popular programming language' },
  { word: 'mongodb', hint: 'A NoSQL database' },
  { word: 'socket', hint: 'Real-time communication tool' },
  { word: 'react', hint: 'A UI library by Meta' },
  { word: 'express', hint: 'A Node.js web framework' },
  { word: 'gaming', hint: 'Playing interactive games' },
  { word: 'multiplayer', hint: 'Multiple people playing together' },
  { word: 'keyboard', hint: 'An input device' },
  { word: 'browser', hint: 'Used to access the web' },
  { word: 'frontend', hint: 'The visual part of a website' },
  { word: 'backend', hint: 'The server-side of a website' },
  { word: 'database', hint: 'Stores data persistently' },
  { word: 'network', hint: 'Connects computers together' },
  { word: 'interface', hint: 'How users interact with software' },
];

const scramble = (word) => {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join('');
  return result === word ? scramble(word) : result;
};

const getNextWord = (usedWords = []) => {
  const available = WORDS.filter(w => !usedWords.includes(w.word));
  const pool = available.length > 0 ? available : WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
};

const handleWordScramble = async (io, socket, roomCode, move, user) => {
  if (!wordScrambleStates.has(roomCode)) {
    const picked = getNextWord();
    wordScrambleStates.set(roomCode, {
      word: picked.word, scrambled: scramble(picked.word), hint: picked.hint,
      scores: {}, players: {}, round: 1, maxRounds: 5,
      guessed: false, status: 'waiting', usedWords: [picked.word], playAgainVotes: {},
    });
  }

  let state = wordScrambleStates.get(roomCode);
  const { action, guess } = move;

  if (action === 'join') {
    state.players[user._id.toString()] = user.username;
    state.scores[user._id.toString()] = 0;
    if (Object.keys(state.players).length >= 2) state.status = 'playing';
    io.to(roomCode).emit('game:wordscramble:state', {
      scrambled: state.scrambled, hint: state.hint, scores: state.scores,
      players: state.players, round: state.round, maxRounds: state.maxRounds, status: state.status,
    });
    return;
  }

  if (action === 'guess') {
    if (state.guessed) return socket.emit('error', { message: 'Already guessed!' });
    if (guess.toLowerCase().trim() === state.word) {
      state.scores[user._id.toString()] = (state.scores[user._id.toString()] || 0) + 10;
      state.guessed = true;

      io.to(roomCode).emit('game:wordscramble:correct', { winner: user.username, word: state.word, scores: state.scores, players: state.players });
      io.to(roomCode).emit('chat:message', { senderName: 'System', content: `🎉 ${user.username} guessed "${state.word}"!`, type: 'system', timestamp: new Date() });

      if (state.round >= state.maxRounds) {
        const topScore = Math.max(...Object.values(state.scores));
        const champEntry = Object.entries(state.scores).find(([,s]) => s === topScore);
        const champId = champEntry[0];
        const champName = state.players[champId];

        io.to(roomCode).emit('game:wordscramble:champion', { winner: champName, scores: state.scores, players: state.players });
        io.to(roomCode).emit('chat:message', { senderName: 'System', content: `🏆 ${champName} wins Word Scramble!`, type: 'system', timestamp: new Date() });

        try {
          await User.findByIdAndUpdate(champId, { $inc: { 'stats.wins': 1, 'stats.gamesPlayed': 1 } });
          for (const [id] of Object.entries(state.players)) {
            if (id !== champId) await User.findByIdAndUpdate(id, { $inc: { 'stats.losses': 1, 'stats.gamesPlayed': 1 } });
          }
        } catch(e) {}
        state.playAgainVotes = {};
      } else {
        setTimeout(() => {
          const picked = getNextWord(state.usedWords);
          state.word = picked.word; state.scrambled = scramble(picked.word);
          state.hint = picked.hint; state.guessed = false; state.round++;
          state.usedWords.push(picked.word);
          io.to(roomCode).emit('game:wordscramble:state', {
            scrambled: state.scrambled, hint: state.hint, scores: state.scores,
            players: state.players, round: state.round, maxRounds: state.maxRounds, status: state.status,
          });
        }, 3000);
      }
    } else {
      socket.emit('game:wordscramble:wrong', { message: '❌ Wrong guess, try again!' });
    }
  }

  if (action === 'playAgain') {
    if (!state.playAgainVotes) state.playAgainVotes = {};
    state.playAgainVotes[user._id.toString()] = true;
    socket.to(roomCode).emit('game:wordscramble:playAgainRequest', { username: user.username });
    const playerIds = Object.keys(state.players);
    if (playerIds.length >= 2 && playerIds.every(id => state.playAgainVotes[id])) {
      const oldPlayers = { ...state.players };
      const resetScores = {};
      playerIds.forEach(id => resetScores[id] = 0);
      const picked = getNextWord();
      wordScrambleStates.set(roomCode, {
        word: picked.word, scrambled: scramble(picked.word), hint: picked.hint,
        scores: resetScores, players: oldPlayers, round: 1, maxRounds: 5,
        guessed: false, status: 'playing', usedWords: [picked.word], playAgainVotes: {},
      });
      io.to(roomCode).emit('game:wordscramble:state', { ...wordScrambleStates.get(roomCode) });
      io.to(roomCode).emit('chat:message', { senderName: 'System', content: '🔄 New Word Scramble started!', type: 'system', timestamp: new Date() });
    }
  }
};

module.exports = { handleWordScramble };
