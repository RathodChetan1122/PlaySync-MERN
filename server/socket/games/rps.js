const rpsStates = new Map();

const getWinner = (a, b) => {
  if (a === b) return 'draw';
  if ((a === 'rock' && b === 'scissors') || (a === 'scissors' && b === 'paper') || (a === 'paper' && b === 'rock')) return 'a';
  return 'b';
};

const handleRPS = async (io, socket, roomCode, move, user) => {
  if (!rpsStates.has(roomCode)) {
    rpsStates.set(roomCode, { players: {}, choices: {}, scores: {}, round: 1, status: 'waiting' });
  }

  let state = rpsStates.get(roomCode);
  const { action, choice } = move;

  if (action === 'join') {
    const playerKeys = Object.keys(state.players);
    if (playerKeys.length < 2 && !state.players[user._id.toString()]) {
      state.players[user._id.toString()] = user.username;
      state.scores[user._id.toString()] = 0;
      if (Object.keys(state.players).length === 2) {
        state.status = 'playing';
        io.to(roomCode).emit('game:rps:state', state);
        io.to(roomCode).emit('chat:message', {
          senderName: 'System', content: 'Rock Paper Scissors started! Make your choice!', type: 'system', timestamp: new Date()
        });
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
        scores: state.scores,
        players: state.players,
        round: state.round,
      });

      state.choices = {};
      state.round++;

      if (Math.max(...Object.values(state.scores)) >= 3) {
        const champion = Object.entries(state.scores).find(([,s]) => s >= 3);
        io.to(roomCode).emit('game:rps:champion', { winner: state.players[champion[0]] });
        rpsStates.delete(roomCode);
      }
    }
  }
};

module.exports = { handleRPS };
