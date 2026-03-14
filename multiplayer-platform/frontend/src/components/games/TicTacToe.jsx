import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export default function TicTacToe({ gameId: initialGameId, players: initialPlayers, roomId }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState(0);
  const [gameOver, setGameOver] = useState(null);
  const [gameId, setGameId] = useState(initialGameId);
  const [players, setPlayers] = useState(initialPlayers);
  const [rematchState, setRematchState] = useState(null); // 'requested' | 'received' | null
  const [rematchFrom, setRematchFrom] = useState('');

  const myIndex = players.findIndex((p) => p._id === user._id);

  useEffect(() => {
    if (!socket) return;

    const onMoveMade = ({ state }) => {
      setBoard(state.board);
      setCurrentTurn(state.nextTurn);
    };

    const onGameOver = ({ winner, isDraw, resigned, winnerUsername }) => {
      if (resigned) {
        setGameOver(`${resigned} resigned — ${winnerUsername || 'Opponent'} wins! 🏆`);
      } else if (isDraw) {
        setGameOver("It's a Draw! 🤝");
      } else {
        setGameOver(`${winner} wins! 🎉`);
      }
      setRematchState(null);
    };

    const onRematchRequested = ({ from }) => {
      setRematchState('received');
      setRematchFrom(from);
    };

    const onRematchStarted = ({ gameId: newGameId, players: newPlayers, state }) => {
      setGameId(newGameId);
      setPlayers(newPlayers);
      setBoard(state.board);
      setCurrentTurn(state.currentTurn);
      setGameOver(null);
      setRematchState(null);
      setRematchFrom('');
    };

    const onRematchDeclined = () => {
      setRematchState(null);
    };

    const onInvalidMove = ({ reason }) => {
      console.warn('Invalid move:', reason);
    };

    socket.on('move_made', onMoveMade);
    socket.on('game_over', onGameOver);
    socket.on('rematch_requested', onRematchRequested);
    socket.on('rematch_started', onRematchStarted);
    socket.on('rematch_declined', onRematchDeclined);
    socket.on('invalid_move', onInvalidMove);

    return () => {
      socket.off('move_made', onMoveMade);
      socket.off('game_over', onGameOver);
      socket.off('rematch_requested', onRematchRequested);
      socket.off('rematch_started', onRematchStarted);
      socket.off('rematch_declined', onRematchDeclined);
      socket.off('invalid_move', onInvalidMove);
    };
  }, [socket]);

  const handleCellClick = (index) => {
    if (board[index] || gameOver || currentTurn !== myIndex) return;
    socket?.emit('make_move', { gameId, move: { index } });
  };

  const handleResign = () => {
    if (gameOver) return;
    socket?.emit('resign_game', { gameId });
  };

  const handleRequestRematch = () => {
    setRematchState('requested');
    socket?.emit('request_rematch', { gameId });
  };

  const handleAcceptRematch = () => {
    socket?.emit('accept_rematch', { gameId, roomId, gameType: 'tictactoe' });
  };

  const handleDeclineRematch = () => {
    socket?.emit('decline_rematch', { gameId });
    setRematchState(null);
  };

  const isMyTurn = currentTurn === myIndex;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.status}>
          {gameOver ? gameOver : isMyTurn ? '✅ Your Turn' : "⏳ Opponent's Turn"}
        </h3>

        <div style={styles.board}>
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              style={{
                ...styles.cell,
                cursor: isMyTurn && !cell && !gameOver ? 'pointer' : 'default',
                animation: !cell && isMyTurn && !gameOver ? 'pulse 2s infinite' : 'none',
              }}
            >
              <span style={{
                color: cell === 'X' ? '#6366f1' : '#f38ba8',
                fontSize: '36px',
                fontWeight: 700,
              }}>
                {cell}
              </span>
            </button>
          ))}
        </div>

        <div style={styles.players}>
          {players.map((p, i) => (
            <div key={p._id} style={{
              ...styles.playerTag,
              background: currentTurn === i && !gameOver ? '#45475a' : 'transparent',
            }}>
              <span style={{ color: i === 0 ? '#6366f1' : '#f38ba8', fontWeight: 700 }}>
                {i === 0 ? 'X' : 'O'}
              </span>
              <span style={styles.playerName}>{p.username}</span>
              {currentTurn === i && !gameOver && <span style={styles.turnDot} />}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={styles.actions}>
          {!gameOver && (
            <button onClick={handleResign} style={styles.resignBtn}>
              🏳️ Resign
            </button>
          )}

          {gameOver && !rematchState && (
            <button onClick={handleRequestRematch} style={styles.rematchBtn}>
              🔄 Play Again
            </button>
          )}

          {rematchState === 'requested' && (
            <div style={styles.rematchNotice}>
              <span style={styles.spinner}>⏳</span> Waiting for opponent to accept...
            </div>
          )}

          {rematchState === 'received' && (
            <div style={styles.rematchPrompt}>
              <p style={styles.rematchText}>{rematchFrom} wants a rematch!</p>
              <div style={styles.rematchBtnRow}>
                <button onClick={handleAcceptRematch} style={styles.acceptBtn}>
                  ✅ Accept
                </button>
                <button onClick={handleDeclineRematch} style={styles.declineBtn}>
                  ❌ Decline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', padding: '24px' },
  card: { background: '#2e2e3e', borderRadius: '16px', padding: '32px', textAlign: 'center' },
  status: { color: '#cdd6f4', marginBottom: '24px', fontSize: '18px' },
  board: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: '8px',
    margin: '0 auto 24px', width: 'fit-content',
  },
  cell: {
    width: '100px', height: '100px', background: '#1e1e2e',
    border: '2px solid #45475a', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'border-color 0.2s, transform 0.15s',
  },
  players: { display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px' },
  playerTag: {
    display: 'flex', alignItems: 'center', gap: '8px',
    color: '#cdd6f4', fontSize: '14px', fontWeight: 600,
    padding: '6px 14px', borderRadius: '8px', transition: 'background 0.2s',
  },
  playerName: { color: '#cdd6f4' },
  turnDot: { width: '8px', height: '8px', background: '#a6e3a1', borderRadius: '50%' },
  actions: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  resignBtn: {
    padding: '10px 24px', background: 'transparent', border: '1px solid #f38ba8',
    color: '#f38ba8', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
    fontSize: '14px', transition: 'background 0.2s',
  },
  rematchBtn: {
    padding: '12px 32px', background: '#a6e3a1', color: '#1e1e2e',
    border: 'none', borderRadius: '10px', cursor: 'pointer',
    fontWeight: 700, fontSize: '16px', transition: 'transform 0.15s',
  },
  rematchNotice: {
    color: '#a6adc8', fontSize: '14px', display: 'flex',
    alignItems: 'center', gap: '8px',
  },
  spinner: { fontSize: '18px' },
  rematchPrompt: {
    background: '#1e1e2e', borderRadius: '12px', padding: '16px 24px',
    border: '1px solid #6366f1',
  },
  rematchText: { color: '#cdd6f4', fontSize: '15px', margin: '0 0 12px', fontWeight: 600 },
  rematchBtnRow: { display: 'flex', gap: '12px', justifyContent: 'center' },
  acceptBtn: {
    padding: '8px 20px', background: '#a6e3a1', color: '#1e1e2e',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
  },
  declineBtn: {
    padding: '8px 20px', background: 'transparent', border: '1px solid #f38ba8',
    color: '#f38ba8', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
  },
};