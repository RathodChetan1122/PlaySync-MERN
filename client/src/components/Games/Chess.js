import React, { useState, useEffect, useCallback } from 'react';
import './Games.css';

const PIECE_SYMBOLS = {
  white: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  black: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
};

// Client-side legal move calculator (mirrors server logic)
const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

const getPseudoMoves = (board, row, col) => {
  const piece = board[row][col];
  if (!piece) return [];
  const { type, color } = piece;
  const enemy = color === 'white' ? 'black' : 'white';
  const moves = [];
  const canMoveTo = (r, c) => inBounds(r, c) && (!board[r][c] || board[r][c].color === enemy);
  const isEmpty = (r, c) => inBounds(r, c) && !board[r][c];
  const addSliding = (dirs) => {
    for (const [dr, dc] of dirs) {
      let r = row + dr, c = col + dc;
      while (inBounds(r, c)) {
        if (board[r][c]) { if (board[r][c].color === enemy) moves.push([r, c]); break; }
        moves.push([r, c]); r += dr; c += dc;
      }
    }
  };
  switch (type) {
    case 'P': {
      const dir = color === 'white' ? -1 : 1, startRow = color === 'white' ? 6 : 1;
      if (isEmpty(row + dir, col)) {
        moves.push([row + dir, col]);
        if (row === startRow && isEmpty(row + 2 * dir, col)) moves.push([row + 2 * dir, col]);
      }
      for (const dc of [-1, 1])
        if (inBounds(row + dir, col + dc) && board[row + dir][col + dc]?.color === enemy)
          moves.push([row + dir, col + dc]);
      break;
    }
    case 'N':
      for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]])
        if (canMoveTo(row + dr, col + dc)) moves.push([row + dr, col + dc]);
      break;
    case 'B': addSliding([[-1, -1], [-1, 1], [1, -1], [1, 1]]); break;
    case 'R': addSliding([[-1, 0], [1, 0], [0, -1], [0, 1]]); break;
    case 'Q': addSliding([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]); break;
    case 'K':
      for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]])
        if (canMoveTo(row + dr, col + dc)) moves.push([row + dr, col + dc]);
      break;
    default: break;
  }
  return moves;
};

const applyMoveClient = (board, from, to) => {
  const nb = board.map(r => r.map(c => c ? { ...c } : null));
  nb[to[0]][to[1]] = nb[from[0]][from[1]];
  nb[from[0]][from[1]] = null;
  const p = nb[to[0]][to[1]];
  if (p?.type === 'P') {
    if (p.color === 'white' && to[0] === 0) p.type = 'Q';
    if (p.color === 'black' && to[0] === 7) p.type = 'Q';
  }
  return nb;
};

const findKingClient = (board, color) => {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
    if (board[r][c]?.type === 'K' && board[r][c]?.color === color) return [r, c];
  return null;
};

const isInCheckClient = (board, color) => {
  const king = findKingClient(board, color);
  if (!king) return false;
  const [kr, kc] = king;
  const enemy = color === 'white' ? 'black' : 'white';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
    if (board[r][c]?.color === enemy)
      if (getPseudoMoves(board, r, c).some(([mr, mc]) => mr === kr && mc === kc)) return true;
  return false;
};

const getLegalMovesClient = (board, row, col) => {
  const piece = board[row][col];
  if (!piece) return [];
  return getPseudoMoves(board, row, col).filter(([tr, tc]) => {
    const nb = applyMoveClient(board, [row, col], [tr, tc]);
    return !isInCheckClient(nb, piece.color);
  });
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Chess({ socket, roomCode, user }) {
  const [state, setState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameOver, setGameOver] = useState(null);
  const [myColor, setMyColor] = useState(null);
  const [flash, setFlash] = useState(null); // error flash message

  useEffect(() => {
    if (!socket) return;
    socket.emit('game:move', { roomCode, gameType: 'chess', move: { action: 'join' } });

    socket.on('game:chess:state', (s) => {
      setState(s);
      const me = s.players?.[user._id];
      if (me) setMyColor(me.color);
      setSelected(null);
      setValidMoves([]);
    });
    socket.on('game:chess:over', (res) => setGameOver(res));

    // Show flash on illegal move
    socket.on('game:chess:invalid', ({ message }) => {
      setFlash(message);
      setSelected(null);
      setValidMoves([]);
      setTimeout(() => setFlash(null), 2500);
    });

    return () => {
      socket.off('game:chess:state');
      socket.off('game:chess:over');
      socket.off('game:chess:invalid');
    };
  }, [socket]); // eslint-disable

  const handleCellClick = useCallback((row, col) => {
    if (!state || state.status !== 'playing') return;
    if (state.currentTurn !== myColor) return;

    const piece = state.board[row][col];

    if (selected) {
      // Clicking the same square → deselect
      if (selected.row === row && selected.col === col) {
        setSelected(null); setValidMoves([]); return;
      }
      // Clicking another own piece → re-select it
      if (piece && piece.color === myColor) {
        const moves = getLegalMovesClient(state.board, row, col);
        setSelected({ row, col });
        setValidMoves(moves);
        return;
      }
      // Attempt move (server will validate)
      socket.emit('game:move', {
        roomCode, gameType: 'chess',
        move: { action: 'move', from: selected, to: { row, col } }
      });
      setSelected(null); setValidMoves([]);
    } else {
      if (piece && piece.color === myColor) {
        const moves = getLegalMovesClient(state.board, row, col);
        setSelected({ row, col });
        setValidMoves(moves);
      }
    }
  }, [state, selected, myColor, socket, roomCode]);

  const resign = () => socket.emit('game:move', { roomCode, gameType: 'chess', move: { action: 'resign' } });

  const isMyTurn = state?.currentTurn === myColor;

  if (gameOver) return (
    <div className="game-container">
      <div className="game-result animate-fadeIn">
        <div className="result-icon">♟️</div>
        <h3>
          {gameOver.winner === null
            ? "It's a Draw! 🤝"
            : gameOver.winner === user.username
              ? 'You Win! 🎉'
              : `${gameOver.winner} Wins!`}
        </h3>
        <p>{gameOver.reason}</p>
      </div>
    </div>
  );

  return (
    <div className="game-container">
      <div className="chess-wrapper">

        {/* Flash error */}
        {flash && (
          <div style={{
            background: '#ef4444', color: '#fff', padding: '8px 14px',
            borderRadius: 8, marginBottom: 8, textAlign: 'center', fontWeight: 600, fontSize: 13
          }}>
            ⚠️ {flash}
          </div>
        )}

        {/* Status bar */}
        <div className="game-status-bar">
          {myColor
            ? <span>You play <strong style={{ color: myColor === 'white' ? '#f1f5f9' : '#94a3b8' }}>{myColor}</strong></span>
            : <span>Joining...</span>}
          {state?.status === 'playing' && (
            <span className={`turn-indicator ${isMyTurn ? 'your-turn' : ''}`}>
              {isMyTurn ? '⚡ Your turn!' : `${state.currentTurn}'s turn`}
            </span>
          )}
          {/* Check indicator */}
          {state?.inCheck && (
            <span style={{
              background: '#ef4444', color: '#fff', padding: '3px 10px',
              borderRadius: 20, fontWeight: 700, fontSize: 12, marginLeft: 8
            }}>
              ♚ CHECK!
            </span>
          )}
        </div>

        {/* Players */}
        {state?.players && (
          <div className="chess-players">
            {Object.entries(state.players).map(([id, p]) => (
              <div key={id} className={`chess-player ${p.color}-player ${state.currentTurn === p.color ? 'active' : ''}`}>
                <span>{p.color === 'white' ? '♔' : '♚'}</span>
                <span>{p.username}</span>
                {id === user._id && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(You)</span>}
              </div>
            ))}
          </div>
        )}

        {state?.board ? (
          <>
            <div className={`chess-board ${myColor === 'black' ? 'flipped' : ''}`}>
              {state.board.map((row, ri) =>
                row.map((cell, ci) => {
                  const isLight = (ri + ci) % 2 === 0;
                  const isSelected = selected?.row === ri && selected?.col === ci;
                  const isValid = validMoves.some(([r, c]) => r === ri && c === ci);
                  const isCapture = isValid && !!cell;
                  const isLastFrom = state.lastMove?.from?.row === ri && state.lastMove?.from?.col === ci;
                  const isLastTo = state.lastMove?.to?.row === ri && state.lastMove?.to?.col === ci;

                  // Highlight king in check
                  const isKingInCheck = state.inCheck
                    && cell?.type === 'K'
                    && cell?.color === state.currentTurn;

                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={[
                        'chess-cell',
                        isLight ? 'light' : 'dark',
                        isSelected ? 'selected' : '',
                        isLastFrom || isLastTo ? 'last-move' : '',
                        isKingInCheck ? 'king-in-check' : '',
                      ].join(' ')}
                      style={isValid ? {
                        position: 'relative',
                        outline: isCapture ? '3px solid #ef4444' : 'none',
                      } : {}}
                      onClick={() => handleCellClick(ri, ci)}
                    >
                      {/* Valid move dot */}
                      {isValid && !isCapture && (
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%',
                          transform: 'translate(-50%,-50%)',
                          width: 18, height: 18, borderRadius: '50%',
                          background: 'rgba(99,102,241,0.7)', zIndex: 2, pointerEvents: 'none'
                        }} />
                      )}
                      {cell && (
                        <span className={`chess-piece ${cell.color}`}>
                          {PIECE_SYMBOLS[cell.color][cell.type]}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <button className="btn btn-danger btn-sm" onClick={resign}>🏳️ Resign</button>
            </div>
          </>
        ) : (
          <div className="waiting-room"><div className="loader" /><p>Waiting for opponent...</p></div>
        )}
      </div>
    </div>
  );
}