import React, { useState, useEffect } from 'react';
import './Games.css';

export default function TicTacToe({ socket, roomCode, user }) {
  const [gameState, setGameState] = useState(null);
  const [result, setResult] = useState(null);
  const [myMark, setMyMark] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('game:tictactoe:state', (state) => {
      setGameState(state);
      const mark = state.players?.X?.id === user._id ? 'X' : state.players?.O?.id === user._id ? 'O' : null;
      if (mark) setMyMark(mark);
    });

    socket.on('game:tictactoe:result', (res) => setResult(res));

    // Auto-join
    socket.emit('game:move', { roomCode, gameType: 'tictactoe', move: { action: 'ready' } });

    return () => {
      socket.off('game:tictactoe:state');
      socket.off('game:tictactoe:result');
    };
  }, [socket]); // eslint-disable-line

  const makeMove = (index) => {
    if (!gameState || gameState.status !== 'playing') return;
    if (gameState.board[index]) return;
    if (gameState.currentPlayer !== myMark) return;
    socket.emit('game:move', { roomCode, gameType: 'tictactoe', move: { action: 'move', index } });
  };

  const resetGame = () => {
    setResult(null);
    socket.emit('game:move', { roomCode, gameType: 'tictactoe', move: { action: 'reset' } });
  };

  const isMyTurn = gameState?.currentPlayer === myMark && gameState?.status === 'playing';

  return (
    <div className="game-container">
      <div className="ttt-wrapper">
        {/* Status */}
        <div className="game-status-bar">
          {myMark ? (
            <span>You are <strong className={myMark === 'X' ? 'text-x' : 'text-o'}>{myMark}</strong></span>
          ) : (
            <span className="text-muted">Waiting for opponent...</span>
          )}
          {gameState?.status === 'playing' && (
            <span className={`turn-indicator ${isMyTurn ? 'your-turn' : ''}`}>
              {isMyTurn ? '⚡ Your turn!' : `Waiting for ${gameState?.currentPlayer}...`}
            </span>
          )}
        </div>

        {/* Players */}
        {gameState?.players && (
          <div className="ttt-players">
            <div className={`ttt-player ${gameState.currentPlayer === 'X' ? 'active' : ''}`}>
              <span className="ttt-mark text-x">✕</span>
              <span>{gameState.players.X?.username || 'Waiting...'}</span>
            </div>
            <span className="ttt-vs">VS</span>
            <div className={`ttt-player ${gameState.currentPlayer === 'O' ? 'active' : ''}`}>
              <span className="ttt-mark text-o">◯</span>
              <span>{gameState.players.O?.username || 'Waiting...'}</span>
            </div>
          </div>
        )}

        {/* Board */}
        {gameState?.board ? (
          <div className={`ttt-board ${!isMyTurn || gameState.status !== 'playing' ? 'disabled' : ''}`}>
            {gameState.board.map((cell, i) => (
              <button
                key={i}
                className={`ttt-cell ${cell ? `filled ${cell === 'X' ? 'cell-x' : 'cell-o'}` : 'empty'} ${result?.line?.includes(i) ? 'winning' : ''}`}
                onClick={() => makeMove(i)}
                disabled={!!cell || !isMyTurn || gameState.status !== 'playing'}
              >
                {cell === 'X' ? '✕' : cell === 'O' ? '◯' : ''}
              </button>
            ))}
          </div>
        ) : (
          <div className="waiting-room">
            <div className="loader" />
            <p>Waiting for another player to join...</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="game-result animate-fadeIn">
            <div className="result-icon">{result.winner === 'draw' ? '🤝' : '🏆'}</div>
            <h3>{result.winner === 'draw' ? "It's a Draw!" : `${result.winner} Wins!`}</h3>
            <button className="btn btn-primary" onClick={resetGame}>🔄 Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}
