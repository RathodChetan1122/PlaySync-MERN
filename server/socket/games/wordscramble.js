const wordScrambleStates = new Map();

const WORDS = [
  { word: 'javascript', hint: 'A popular programming language' },
  { word: 'mongodb', hint: 'A NoSQL database' },
  { word: 'socket', hint: 'Used for real-time communication' },
  { word: 'react', hint: 'A UI library by Meta' },
  { word: 'express', hint: 'A Node.js web framework' },
  { word: 'gaming', hint: 'Playing interactive games' },
  { word: 'multiplayer', hint: 'Multiple people playing together' },
  { word: 'keyboard', hint: 'An input device' },
  { word: 'browser', hint: 'Used to access the web' },
  { word: 'frontend', hint: 'The visual part of a website' },
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

const handleWordScramble = async (io, socket, roomCode, move, user) => {
  if (!wordScrambleStates.has(roomCode)) {
    const picked = WORDS[Math.floor(Math.random() * WORDS.length)];
    wordScrambleStates.set(roomCode, {
      word: picked.word,
      scrambled: scramble(picked.word),
      hint: picked.hint,
      scores: {},
      players: {},
      round: 1,
      maxRounds: 5,
      guessed: false,
      status: 'waiting',
    });
  }

  let state = wordScrambleStates.get(roomCode);
  const { action, guess } = move;

  if (action === 'join') {
    state.players[user._id.toString()] = user.username;
    state.scores[user._id.toString()] = 0;
    if (Object.keys(state.players).length >= 2) {
      state.status = 'playing';
    }
    io.to(roomCode).emit('game:wordscramble:state', {
      scrambled: state.scrambled,
      hint: state.hint,
      scores: state.scores,
      players: state.players,
      round: state.round,
      maxRounds: state.maxRounds,
      status: state.status,
    });
    return;
  }

  if (action === 'guess') {
    if (state.guessed) return socket.emit('error', { message: 'Already guessed this round!' });
    if (guess.toLowerCase().trim() === state.word) {
      state.scores[user._id.toString()] = (state.scores[user._id.toString()] || 0) + 10;
      state.guessed = true;

      io.to(roomCode).emit('game:wordscramble:correct', {
        winner: user.username,
        word: state.word,
        scores: state.scores,
        players: state.players,
      });

      io.to(roomCode).emit('chat:message', {
        senderName: 'System',
        content: `🎉 ${user.username} guessed correctly! The word was "${state.word}"`,
        type: 'system',
        timestamp: new Date(),
      });

      if (state.round >= state.maxRounds) {
        const topScore = Math.max(...Object.values(state.scores));
        const champId = Object.entries(state.scores).find(([, s]) => s === topScore)?.[0];
        io.to(roomCode).emit('game:wordscramble:champion', {
          winner: state.players[champId],
          scores: state.scores,
          players: state.players,
        });
        wordScrambleStates.delete(roomCode);
      } else {
        setTimeout(() => {
          const picked = WORDS[Math.floor(Math.random() * WORDS.length)];
          state.word = picked.word;
          state.scrambled = scramble(picked.word);
          state.hint = picked.hint;
          state.guessed = false;
          state.round++;
          io.to(roomCode).emit('game:wordscramble:state', {
            scrambled: state.scrambled,
            hint: state.hint,
            scores: state.scores,
            players: state.players,
            round: state.round,
            maxRounds: state.maxRounds,
            status: state.status,
          });
        }, 3000);
      }
    } else {
      socket.emit('game:wordscramble:wrong', { message: 'Wrong guess, try again!' });
    }
  }
};

module.exports = { handleWordScramble };
