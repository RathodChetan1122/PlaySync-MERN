const chessStates = new Map();

const initBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  const order = ['R','N','B','Q','K','B','N','R'];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: order[c], color: 'black' };
    board[1][c] = { type: 'P', color: 'black' };
    board[6][c] = { type: 'P', color: 'white' };
    board[7][c] = { type: order[c], color: 'white' };
  }
  return board;
};

const handleChess = async (io, socket, roomCode, move, user) => {
  if (!chessStates.has(roomCode)) {
    chessStates.set(roomCode, {
      board: initBoard(),
      players: {},
      currentTurn: 'white',
      status: 'waiting',
      history: [],
    });
  }

  let state = chessStates.get(roomCode);
  const { action, from, to } = move;

  if (action === 'join') {
    const colors = Object.values(state.players).map(p => p.color);
    const assignColor = !colors.includes('white') ? 'white' : 'black';
    if (!state.players[user._id.toString()]) {
      state.players[user._id.toString()] = { username: user.username, color: assignColor };
    }
    if (Object.keys(state.players).length === 2) {
      state.status = 'playing';
      io.to(roomCode).emit('chat:message', {
        senderName: 'System',
        content: 'Chess match started! White moves first.',
        type: 'system',
        timestamp: new Date(),
      });
    }
    io.to(roomCode).emit('game:chess:state', {
      board: state.board,
      players: state.players,
      currentTurn: state.currentTurn,
      status: state.status,
      history: state.history,
    });
    return;
  }

  if (action === 'move') {
    const playerInfo = state.players[user._id.toString()];
    if (!playerInfo) return socket.emit('error', { message: 'You are not in this game' });
    if (playerInfo.color !== state.currentTurn) return socket.emit('error', { message: "Not your turn!" });

    const piece = state.board[from.row][from.col];
    if (!piece || piece.color !== playerInfo.color) return socket.emit('error', { message: 'Invalid piece selection' });

    // Basic move - client handles full chess rules validation display
    state.history.push({ from, to, piece, player: user.username });
    state.board[to.row][to.col] = piece;
    state.board[from.row][from.col] = null;
    state.currentTurn = state.currentTurn === 'white' ? 'black' : 'white';

    // Pawn promotion
    if (piece.type === 'P') {
      if (piece.color === 'white' && to.row === 0) state.board[to.row][to.col].type = 'Q';
      if (piece.color === 'black' && to.row === 7) state.board[to.row][to.col].type = 'Q';
    }

    io.to(roomCode).emit('game:chess:state', {
      board: state.board,
      players: state.players,
      currentTurn: state.currentTurn,
      status: state.status,
      history: state.history,
      lastMove: { from, to },
    });
  }

  if (action === 'resign') {
    const playerInfo = state.players[user._id.toString()];
    const winner = Object.entries(state.players).find(([id]) => id !== user._id.toString());
    io.to(roomCode).emit('game:chess:over', {
      winner: winner ? winner[1].username : 'Unknown',
      reason: `${user.username} resigned`,
    });
    chessStates.delete(roomCode);
  }
};

module.exports = { handleChess };
