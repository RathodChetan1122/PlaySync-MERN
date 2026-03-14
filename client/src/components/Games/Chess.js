import React, { useState, useEffect } from 'react';
import './Games.css';

const PIECE_SYMBOLS = {
  white: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  black: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
};

export default function Chess({ socket, roomCode, user }){
  const [state, setState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [myColor, setMyColor] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('game:move', { roomCode, gameType: 'chess', move: { action: 'join' } });

    socket.on('game:chess:state', (s) => {
      setState(s);
      const me = s.players?.[user._id];
      if (me) setMyColor(me.color);
      setSelected(null);
    });

    socket.on('game:chess:over', (res) => setGameOver(res));

    return () => {
      socket.off('game:chess:state');
      socket.off('game:chess:over');
    };
  }, [socket]); // eslint-disable-line

  const handleCellClick = (row, col) => {
    if (!state || state.status !== 'playing') return;
    if (state.currentTurn !== myColor) return;

    const piece = state.board[row][col];

    if (selected) {
      if (selected.row === row && selected.col === col) { setSelected(null); return; }
      // Move
      socket.emit('game:move', {
        roomCode, gameType: 'chess',
        move: { action: 'move', from: selected, to: { row, col } }
      });
      setSelected(null);
    } else {
      if (piece && piece.color === myColor) setSelected({ row, col });
    }
  };

  const resign = () => {
    socket.emit('game:move', { roomCode, gameType: 'chess', move: { action: 'resign' } });
  };

  const isMyTurn = state?.currentTurn === myColor;

  if (gameOver) return (
    <div className="game-container">
      <div className="game-result animate-fadeIn">
        <div className="result-icon">♟️</div>
        <h3>{gameOver.winner === user.username ? 'You Win! 🎉' : `${gameOver.winner} Wins!`}</h3>
        <p>{gameOver.reason}</p>
      </div>
    </div>
  );

  return (
    <div className="game-container">
      <div className="chess-wrapper">
        {/* Status bar */}
        <div className="game-status-bar">
          {myColor ? (
            <span>You play <strong style={{ color: myColor === 'white' ? '#f1f5f9' : '#94a3b8' }}>{myColor}</strong></span>
          ) : <span>Joining...</span>}
          {state?.status === 'playing' && (
            <span className={`turn-indicator ${isMyTurn ? 'your-turn' : ''}`}>
              {isMyTurn ? '⚡ Your turn!' : `${state.currentTurn}'s turn`}
            </span>
          )}
        </div>

        {/* Players */}
        {state?.players && (
          <div className="chess-players">
            {Object.entries(state.players).map(([id, p]) => (
              <div key={id} className={`chess-player ${state.currentTurn === p.color ? 'active' : ''}`}>
                <span>{p.color === 'white' ? '♔' : '♚'}</span>
                <span>{p.username}</span>
                {id === user._id && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(You)</span>}
              </div>
            ))}
          </div>
        )}

        {state?.board ? (
          <>
            {/* Board */}
            <div className={`chess-board ${myColor === 'black' ? 'flipped' : ''}`}>
              {state.board.map((row, ri) =>
                row.map((cell, ci) => {
                  const isLight = (ri + ci) % 2 === 0;
                  const isSelected = selected?.row === ri && selected?.col === ci;
                  const isLastFrom = state.lastMove?.from?.row === ri && state.lastMove?.from?.col === ci;
                  const isLastTo = state.lastMove?.to?.row === ri && state.lastMove?.to?.col === ci;
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={`chess-cell ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isLastFrom || isLastTo ? 'last-move' : ''}`}
                      onClick={() => handleCellClick(ri, ci)}
                    >
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
