const User = require('../../models/User');
const rpsStates = new Map();

const getWinner = (a, b) => {
  if (a === b) return 'draw';
  if ((a==='rock'&&b==='scissors')||(a==='scissors'&&b==='paper')||(a==='paper'&&b==='rock')) return 'a';
  return 'b';
};

const handleRPS = async (io, socket, roomCode, move, user) => {
  if (!rpsStates.has(roomCode)) {
    rpsStates.set(roomCode, { players: {}, choices: {}, scores: {}, round: 1, status: 'waiting', playAgainVotes: {} });
  }

  let state = rpsStates.get(roomCode);
  const { action, choice } = move;

  if (action === 'join') {
    if (Object.keys(state.players).length < 2 && !state.players[user._id.toString()]) {
      state.players[user._id.toString()] = user.username;
      state.scores[user._id.toString()] = 0;
      if (Object.keys(state.players).length === 2) {
        state.status = 'playing';
        io.to(roomCode).emit('game:rps:state', state);
        io.to(roomCode).emit('chat:message', { senderName: 'System', content: '✊ Rock Paper Scissors — First to 3 wins!', type: 'system', timestamp: new Date() });
      }
    }
    return;
  }

  if (action === 'choose') {
    state.choices[user._id.toString()] = choice;
    socket.emit('game:rps:chose', { message: 'Choice locked in!' });

    const playerIds = Object.keys(state.players);
    if (Object.keys(state.choices).length === 2) {
      const [aId, bId] = playerIds;
      const result = getWinner(state.choices[aId], state.choices[bId]);
      let winnerId = null;
      if (result === 'a') { state.scores[aId]++; winnerId = aId; }
      else if (result === 'b') { state.scores[bId]++; winnerId = bId; }

      io.to(roomCode).emit('game:rps:result', {
        choices: state.choices,
        winner: winnerId ? state.players[winnerId] : 'draw',
        winnerId,
        scores: state.scores,
        players: state.players,
        round: state.round,
      });

      state.choices = {};
      state.round++;

      const maxScore = Math.max(...Object.values(state.scores));
      if (maxScore >= 3) {
        const championEntry = Object.entries(state.scores).find(([,s]) => s >= 3);
        const championId = championEntry[0];
        const championName = state.players[championId];

        io.to(roomCode).emit('game:rps:champion', { winner: championName, scores: state.scores, players: state.players });
        io.to(roomCode).emit('chat:message', { senderName: 'System', content: `🏆 ${championName} wins the match!`, type: 'system', timestamp: new Date() });

        try {
          await User.findByIdAndUpdate(championId, { $inc: { 'stats.wins': 1, 'stats.gamesPlayed': 1 } });
          const loserId = playerIds.find(id => id !== championId);
          if (loserId) await User.findByIdAndUpdate(loserId, { $inc: { 'stats.losses': 1, 'stats.gamesPlayed': 1 } });
        } catch(e) { console.error('Stats error:', e); }

        state.playAgainVotes = {};
      }
    }
  }

  if (action === 'playAgain') {
    if (!state.playAgainVotes) state.playAgainVotes = {};
    state.playAgainVotes[user._id.toString()] = true;
    socket.to(roomCode).emit('game:rps:playAgainRequest', { username: user.username });
    const playerIds = Object.keys(state.players);
    if (playerIds.length === 2 && playerIds.every(id => state.playAgainVotes[id])) {
      const oldPlayers = { ...state.players };
      const resetScores = {};
      playerIds.forEach(id => resetScores[id] = 0);
      rpsStates.set(roomCode, { players: oldPlayers, choices: {}, scores: resetScores, round: 1, status: 'playing', playAgainVotes: {} });
      io.to(roomCode).emit('game:rps:state', rpsStates.get(roomCode));
      io.to(roomCode).emit('chat:message', { senderName: 'System', content: '🔄 Rematch started!', type: 'system', timestamp: new Date() });
    }
  }
};

module.exports = { handleRPS };