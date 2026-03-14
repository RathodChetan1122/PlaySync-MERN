const Room = require('../../models/Room');

const gameStates = new Map(); // roomCode -> gameState

const checkWinner = (board) => {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6],         // diags
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
        senderName: 'System', content: 'Tic Tac Toe started! X goes first.', type: 'system', timestamp: new Date()
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
      io.to(roomCode).emit('game:tictactoe:result', result);
      gameStates.delete(roomCode);
    } else {
      state.currentPlayer = playerMark === 'X' ? 'O' : 'X';
      io.to(roomCode).emit('game:tictactoe:state', state);
    }
  }

  if (action === 'reset') {
    gameStates.set(roomCode, {
      board: Array(9).fill(null),
      currentPlayer: 'X',
      players: state.players,
      status: 'playing',
    });
    io.to(roomCode).emit('game:tictactoe:state', gameStates.get(roomCode));
  }
};

module.exports = { handleTicTacToe };
