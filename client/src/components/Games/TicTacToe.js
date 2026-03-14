import { useEffect, useState } from 'react';
import './Games.css';

export default function TicTacToe({ socket, roomCode, user }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [players, setPlayers] = useState({});
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [status, setStatus] = useState('waiting');
  const [myMark, setMyMark] = useState(null);
  const [result, setResult] = useState(null);
  const [winLine, setWinLine] = useState([]);
  const [playAgainSent, setPlayAgainSent] = useState(false);
  const [opponentWantsPlay, setOpponentWantsPlay] = useState(false);

  const myId = user?._id || user?.id || '';

  useEffect(() => {
    if (!socket) return;

    // Send ready immediately
    socket.emit('game:move', { roomCode, gameType: 'tictactoe', move: { action: 'ready' } });

    socket.on('game:tictactoe:state', (state) => {
      setBoard(state.board || Array(9).fill(null));
      setPlayers(state.players || {});
      setCurrentPlayer(state.currentPlayer);
      setStatus(state.status);
      setResult(null);
      setWinLine([]);
      setPlayAgainSent(false);
      setOpponentWantsPlay(false);

      // Figure out my mark
      const xId = state.players?.X?.id;
      const oId = state.players?.O?.id;
      if (xId && (xId === myId || xId === String(myId))) setMyMark('X');
      else if (oId && (oId === myId || oId === String(myId))) setMyMark('O');
    });

    socket.on('game:tictactoe:result', (res) => {
      setStatus('finished');
      setWinLine(res.line || []);
      setResult(res);
    });

    socket.on('game:tictactoe:playAgainRequest', () => {
      setOpponentWantsPlay(true);
    });

    return () => {
      socket.off('game:tictactoe:state');
      socket.off('game:tictactoe:result');
      socket.off('game:tictactoe:playAgainRequest');
    };
  }, [socket, roomCode]); // eslint-disable-line

  const makeMove = (i) => {
    if (status !== 'playing') return;
    if (board[i]) return;
    if (currentPlayer !== myMark) return;
    socket.emit('game:move', { roomCode, gameType: 'tictactoe', move: { action: 'move', index: i } });
  };

  const requestPlayAgain = () => {
    setPlayAgainSent(true);
    socket.emit('game:move', { roomCode, gameType: 'tictactoe', move: { action: 'playAgain' } });
  };

  const isMyTurn = currentPlayer === myMark && status === 'playing';

  // Determine result display
  const getResultDisplay = () => {
    if (!result) return null;
    if (result.winner === 'draw') return { emoji: '🤝', title: "It's a Draw!", sub: 'Well played by both sides!', isWin: false };
    // winner is the mark (X or O), winnerName is the username
    const winnerName = result.winnerName || players[result.winner]?.username || result.winner;
    const winnerPlayerId = players[result.winner]?.id;
    const iWon = winnerPlayerId === myId || winnerPlayerId === String(myId);
    return {
      emoji: iWon ? '🏆' : '😞',
      title: iWon ? 'You Win! 🎉' : `${winnerName} Wins!`,
      sub: iWon ? 'Outstanding! Stats updated.' : 'Better luck next time!',
      isWin: iWon,
    };
  };

  const resultDisplay = getResultDisplay();

  return (
    <div className="game-wrap">
      {/* Status bar */}
      <div className="ttt-statusbar">
        <div className="ttt-player-pill">
          <span className="sym-x">✕</span>
          <span>{players.X?.username || '...'}</span>
          {players.X?.id === myId && <span className="you-tag">You</span>}
        </div>
        <div className={`ttt-turn-badge ${isMyTurn ? 'your-turn' : ''}`}>
          {status === 'waiting' ? '⏳ Waiting...'
            : status === 'finished' ? '🏁 Game Over'
            : isMyTurn ? '⚡ Your Turn!'
            : `${currentPlayer === 'X' ? players.X?.username : players.O?.username}'s turn`}
        </div>
        <div className="ttt-player-pill">
          <span className="sym-o">◯</span>
          <span>{players.O?.username || '...'}</span>
          {players.O?.id === myId && <span className="you-tag">You</span>}
        </div>
      </div>

      {/* Board */}
      <div className={`ttt-board ${!isMyTurn || status !== 'playing' ? 'board-locked' : ''}`}>
        {board.map((cell, i) => (
          <button
            key={i}
            className={`ttt-cell ${cell === 'X' ? 'cell-x' : cell === 'O' ? 'cell-o' : 'cell-empty'} ${winLine.includes(i) ? 'cell-win' : ''}`}
            onClick={() => makeMove(i)}
            disabled={!!cell || !isMyTurn || status !== 'playing'}
          >
            {cell === 'X' ? '✕' : cell === 'O' ? '◯' : ''}
          </button>
        ))}
      </div>

      {/* Waiting */}
      {status === 'waiting' && (
        <div className="game-waiting">
          <div className="loader" />
          <p>Waiting for opponent to join...</p>
        </div>
      )}

      {/* Result */}
      {resultDisplay && (
        <div className={`result-panel animate-popIn ${resultDisplay.isWin ? 'result-win' : ''}`}>
          <div className="result-emoji">{resultDisplay.emoji}</div>
          <h3 className="result-title">{resultDisplay.title}</h3>
          <p className="result-sub">{resultDisplay.sub}</p>
          <div className="play-again-area">
            {!playAgainSent ? (
              <button className="btn btn-primary" onClick={requestPlayAgain}>🔄 Play Again</button>
            ) : (
              <p className="waiting-text">⏳ Waiting for opponent to accept...</p>
            )}
            {opponentWantsPlay && !playAgainSent && (
              <div className="opponent-wants">🎮 Opponent wants a rematch! Click Play Again to start.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}