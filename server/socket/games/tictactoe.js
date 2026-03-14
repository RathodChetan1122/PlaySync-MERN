const User = require('../../models/User');

const gameStates = new Map();

const checkWinner = (board) => {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a,b,c] };
    }
  }
  if (board.every(cell => cell !== null)) return { winner: 'draw' };
  return null;
};

const handleTicTacToe = async (io, socket, roomCode, move, user) => {
  if (!gameStates.has(roomCode)) {
    gameStates.set(roomCode, {
      board: Array(9).fill(null),
      currentPlayer: null,
      players: {},
      status: 'waiting',
      playAgainVotes: {},
    });
  }

  let state = gameStates.get(roomCode);
  const { action, index } = move;

  if (action === 'ready') {
    if (!state.players['X']) {
      state.players['X'] = { id: user._id.toString(), username: user.username };
      state.currentPlayer = 'X';
    } else if (!state.players['O'] && state.players['X'].id !== user._id.toString()) {
      state.players['O'] = { id: user._id.toString(), username: user.username };
      state.status = 'playing';
      io.to(roomCode).emit('game:tictactoe:state', state);
      io.to(roomCode).emit('chat:message', {
        senderName: 'System', content: `⚡ Tic Tac Toe! ${state.players['X'].username} goes first.`, type: 'system', timestamp: new Date()
      });
    }
    return;
  }

  if (action === 'move') {
    const playerMark = state.players['X']?.id === user._id.toString() ? 'X' : 'O';
    if (state.currentPlayer !== playerMark) return socket.emit('error', { message: "Not your turn!" });
    if (state.board[index]) return socket.emit('error', { message: "Cell already taken!" });

    state.board[index] = playerMark;
    const result = checkWinner(state.board);

    if (result) {
      state.status = 'finished';
      io.to(roomCode).emit('game:tictactoe:state', state);

      let winnerName = 'draw';
      if (result.winner !== 'draw') {
        const winnerData = state.players[result.winner];
        winnerName = winnerData.username;
        try {
          await User.findByIdAndUpdate(winnerData.id, { $inc: { 'stats.wins': 1, 'stats.gamesPlayed': 1 } });
          const loserMark = result.winner === 'X' ? 'O' : 'X';
          const loserId = state.players[loserMark]?.id;
          if (loserId) await User.findByIdAndUpdate(loserId, { $inc: { 'stats.losses': 1, 'stats.gamesPlayed': 1 } });
        } catch (e) { console.error('Stats error:', e); }
      } else {
        for (const p of Object.values(state.players)) {
          try { await User.findByIdAndUpdate(p.id, { $inc: { 'stats.gamesPlayed': 1 } }); } catch(e) {}
        }
      }

      io.to(roomCode).emit('game:tictactoe:result', { winner: result.winner, winnerName, line: result.line, players: state.players });
      io.to(roomCode).emit('chat:message', {
        senderName: 'System',
        content: result.winner === 'draw' ? `🤝 It's a draw!` : `🏆 ${winnerName} wins!`,
        type: 'system', timestamp: new Date()
      });
      state.playAgainVotes = {};
    } else {
      state.currentPlayer = playerMark === 'X' ? 'O' : 'X';
      io.to(roomCode).emit('game:tictactoe:state', state);
    }
  }

  if (action === 'playAgain') {
    if (!state.playAgainVotes) state.playAgainVotes = {};
    state.playAgainVotes[user._id.toString()] = true;
    socket.to(roomCode).emit('game:tictactoe:playAgainRequest', { username: user.username });
    const playerIds = Object.values(state.players).map(p => p.id);
    if (playerIds.length === 2 && playerIds.every(id => state.playAgainVotes[id])) {
      const oldPlayers = { ...state.players };
      gameStates.set(roomCode, { board: Array(9).fill(null), currentPlayer: 'X', players: oldPlayers, status: 'playing', playAgainVotes: {} });
      io.to(roomCode).emit('game:tictactoe:state', gameStates.get(roomCode));
      io.to(roomCode).emit('chat:message', { senderName: 'System', content: '🔄 New game started!', type: 'system', timestamp: new Date() });
    }
  }
};

module.exports = { handleTicTacToe };
