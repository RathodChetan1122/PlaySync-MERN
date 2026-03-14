import { useEffect, useState } from 'react';
import './Games.css';

export default function TicTacToe({ socket, roomCode, user }) {
  const [gameState, setGameState] = useState(null);
  const [result, setResult] = useState(null);
  const [myMark, setMyMark] = useState(null);
  const [playAgainSent, setPlayAgainSent] = useState(false);
  const [opponentWantsPlay, setOpponentWantsPlay] = useState(false);

  useEffect(() => {
    if (!socket) return;
    socket.emit('game:move', { roomCode, gameType: 'tictactoe', move: { action: 'ready' } });

    socket.on('game:tictactoe:state', (state) => {
      setGameState(state);
      setResult(null);
      setPlayAgainSent(false);
      setOpponentWantsPlay(false);
      const mark = state.players?.X?.id === user._id ? 'X' : state.players?.O?.id === user._id ? 'O' : null;
      if (mark) setMyMark(mark);
    });

    socket.on('game:tictactoe:result', (res) => setResult(res));

    socket.on('game:tictactoe:playAgainRequest', ({ username }) => {
      setOpponentWantsPlay(true);
    });

    return () => {
      socket.off('game:tictactoe:state');
      socket.off('game:tictactoe:result');
      socket.off('game:tictactoe:playAgainRequest');
    };
  }, [socket]); // eslint-disable-line

  const makeMove = (index) => {
    if (!gameState || gameState.status !== 'playing') return;
    if (gameState.board[index]) return;
    if (gameState.currentPlayer !== myMark) return;
    socket.emit('game:move', { roomCode, gameType: 'tictactoe', move: { action: 'move', index } });
  };

  const requestPlayAgain = () => {
    setPlayAgainSent(true);
    socket.emit('game:move', { roomCode, gameType: 'tictactoe', move: { action: 'playAgain' } });
  };

  const isMyTurn = gameState?.currentPlayer === myMark && gameState?.status === 'playing';
  const isWinner = result && result.winner !== 'draw' && result.players?.[result.winner]?.id === user._id;
 

  return (
    <div className="game-wrap">
      {/* Players bar */}
      {gameState?.players && (
        <div className="ttt-players">
          {['X','O'].map(mark => (
            <div key={mark} className={`ttt-player-card ${gameState.currentPlayer === mark && gameState.status === 'playing' ? 'active' : ''}`}>
              <span className={`ttt-symbol ${mark === 'X' ? 'sym-x' : 'sym-o'}`}>{mark === 'X' ? '✕' : '◯'}</span>
              <span className="ttt-pname">{gameState.players[mark]?.username || 'Waiting...'}</span>
              {gameState.players[mark]?.id === user._id && <span className="you-chip">You</span>}
            </div>
          ))}
          {gameState.status === 'playing' && (
            <div className={`turn-chip ${isMyTurn ? 'my-turn' : ''}`}>
              {isMyTurn ? '⚡ Your turn' : `${gameState.currentPlayer}'s turn`}
            </div>
          )}
        </div>
      )}

      {/* Board */}
      {gameState?.board ? (
        <div className={`ttt-board ${!isMyTurn || gameState.status !== 'playing' ? 'board-locked' : ''}`}>
          {gameState.board.map((cell, i) => (
            <button
              key={i}
              className={`ttt-cell
                ${cell === 'X' ? 'cell-x' : cell === 'O' ? 'cell-o' : 'cell-empty'}
                ${result?.line?.includes(i) ? 'cell-win' : ''}`}
              onClick={() => makeMove(i)}
              disabled={!!cell || !isMyTurn || gameState.status !== 'playing'}
            >
              {cell === 'X' ? '✕' : cell === 'O' ? '◯' : ''}
            </button>
          ))}
        </div>
      ) : (
        <div className="game-waiting"><div className="loader" /><p>Waiting for opponent...</p></div>
      )}

      {/* Result overlay */}
      {result && (
        <div className="result-panel animate-popIn">
          <div className="result-emoji">
            {result.winner === 'draw' ? '🤝' : isWinner ? '🏆' : '😞'}
          </div>
          <h3 className="result-title">
            {result.winner === 'draw' ? "It's a Draw!" : isWinner ? 'You Win!' : `${result.winnerName} Wins!`}
          </h3>
          <p className="result-sub">
            {result.winner === 'draw' ? 'Nobody wins this round' : isWinner ? 'Great game! Stats updated.' : 'Better luck next time!'}
          </p>
          <div className="play-again-area">
            {!playAgainSent ? (
              <button className="btn btn-primary" onClick={requestPlayAgain}>🔄 Play Again</button>
            ) : (
              <p className="waiting-text">⏳ Waiting for opponent...</p>
            )}
            {opponentWantsPlay && !playAgainSent && (
              <div className="opponent-wants">Opponent wants a rematch!</div>
            )}
          </div>
        </div>
      )}

      {/* Waiting for 2nd player */}
      {gameState?.status === 'waiting' && !result && (
        <div className="game-waiting"><div className="loader" /><p>Waiting for opponent to join...</p></div>
      )}
    </div>
  );
}
