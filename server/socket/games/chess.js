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

const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

const getPseudoLegalMoves = (board, row, col) => {
  const piece = board[row][col];
  if (!piece) return [];
  const { type, color } = piece;
  const enemy = color === 'white' ? 'black' : 'white';
  const moves = [];
  const canMoveTo = (r, c) => inBounds(r, c) && (!board[r][c] || board[r][c].color === enemy);
  const isEmpty   = (r, c) => inBounds(r, c) && !board[r][c];
  const addSliding = (dirs) => {
    for (const [dr, dc] of dirs) {
      let r = row + dr, c = col + dc;
      while (inBounds(r, c)) {
        if (board[r][c]) { if (board[r][c].color === enemy) moves.push([r, c]); break; }
        moves.push([r, c]);
        r += dr; c += dc;
      }
    }
  };
  switch (type) {
    case 'P': {
      const dir = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      if (isEmpty(row + dir, col)) {
        moves.push([row + dir, col]);
        if (row === startRow && isEmpty(row + 2*dir, col)) moves.push([row + 2*dir, col]);
      }
      for (const dc of [-1, 1])
        if (inBounds(row+dir, col+dc) && board[row+dir][col+dc]?.color === enemy)
          moves.push([row+dir, col+dc]);
      break;
    }
    case 'N':
      for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])
        if (canMoveTo(row+dr, col+dc)) moves.push([row+dr, col+dc]);
      break;
    case 'B': addSliding([[-1,-1],[-1,1],[1,-1],[1,1]]); break;
    case 'R': addSliding([[-1,0],[1,0],[0,-1],[0,1]]); break;
    case 'Q': addSliding([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]); break;
    case 'K':
      for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])
        if (canMoveTo(row+dr, col+dc)) moves.push([row+dr, col+dc]);
      break;
  }
  return moves;
};

const cloneBoard = (board) => board.map(row => row.map(cell => cell ? { ...cell } : null));

const applyMove = (board, from, to) => {
  const nb = cloneBoard(board);
  nb[to.row][to.col] = nb[from.row][from.col];
  nb[from.row][from.col] = null;
  const p = nb[to.row][to.col];
  if (p?.type === 'P') {
    if (p.color === 'white' && to.row === 0) p.type = 'Q';
    if (p.color === 'black' && to.row === 7) p.type = 'Q';
  }
  return nb;
};

const findKing = (board, color) => {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.type === 'K' && board[r][c]?.color === color) return [r, c];
  return null;
};

const isInCheck = (board, color) => {
  const king = findKing(board, color);
  if (!king) return false;
  const [kr, kc] = king;
  const enemy = color === 'white' ? 'black' : 'white';
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.color === enemy)
        if (getPseudoLegalMoves(board, r, c).some(([mr,mc]) => mr===kr && mc===kc))
          return true;
  return false;
};

const getLegalMoves = (board, row, col) => {
  const piece = board[row][col];
  if (!piece) return [];
  return getPseudoLegalMoves(board, row, col).filter(([tr,tc]) => {
    const nb = applyMove(board, { row, col }, { row: tr, col: tc });
    return !isInCheck(nb, piece.color);
  });
};

const hasLegalMoves = (board, color) => {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.color === color && getLegalMoves(board, r, c).length > 0)
        return true;
  return false;
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

  const state = chessStates.get(roomCode);
  const { action, from, to } = move;

  if (action === 'join') {
    const takenColors = Object.values(state.players).map(p => p.color);
    const assignColor = !takenColors.includes('white') ? 'white' : 'black';
    if (!state.players[user._id.toString()])
      state.players[user._id.toString()] = { username: user.username, color: assignColor };
    if (Object.keys(state.players).length === 2 && state.status === 'waiting') {
      state.status = 'playing';
      io.to(roomCode).emit('chat:message', {
        senderName: 'System', content: 'Chess match started! White moves first.',
        type: 'system', timestamp: new Date(),
      });
    }
    io.to(roomCode).emit('game:chess:state', {
      board: state.board, players: state.players,
      currentTurn: state.currentTurn, status: state.status,
      history: state.history, inCheck: isInCheck(state.board, state.currentTurn),
    });
    return;
  }

  if (action === 'move') {
    const playerInfo = state.players[user._id.toString()];
    if (!playerInfo) return socket.emit('error', { message: 'You are not in this game' });
    if (state.status !== 'playing') return socket.emit('game:chess:invalid', { message: 'Game is not active' });
    if (playerInfo.color !== state.currentTurn) return socket.emit('game:chess:invalid', { message: "Not your turn!" });

    const piece = state.board[from.row][from.col];
    if (!piece || piece.color !== playerInfo.color)
      return socket.emit('game:chess:invalid', { message: 'Invalid piece selection' });

    // KEY FIX: only allow truly legal moves (king safety enforced)
    const legal = getLegalMoves(state.board, from.row, from.col);
    const isLegal = legal.some(([r,c]) => r === to.row && c === to.col);
    if (!isLegal)
      return socket.emit('game:chess:invalid', { message: 'Illegal move — resolve check first!' });

    state.board = applyMove(state.board, from, to);
    state.history.push({ from, to, piece: { ...piece }, player: user.username });
    state.currentTurn = state.currentTurn === 'white' ? 'black' : 'white';

    const nextColor = state.currentTurn;
    const inCheck   = isInCheck(state.board, nextColor);
    const canMove   = hasLegalMoves(state.board, nextColor);

    if (inCheck && !canMove) {
      io.to(roomCode).emit('game:chess:over', {
        winner: playerInfo.username,
        reason: `Checkmate! ${playerInfo.username} wins!`,
      });
      chessStates.delete(roomCode);
      return;
    }
    if (!inCheck && !canMove) {
      io.to(roomCode).emit('game:chess:over', { winner: null, reason: "Stalemate! It's a draw!" });
      chessStates.delete(roomCode);
      return;
    }

    io.to(roomCode).emit('game:chess:state', {
      board: state.board, players: state.players,
      currentTurn: state.currentTurn, status: state.status,
      history: state.history, lastMove: { from, to }, inCheck,
    });
    return;
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