import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import TicTacToe from '../components/games/TicTacToe';
import Connect4 from '../components/games/Connect4';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function GameRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [gameId, setGameId] = useState(null);
  const [joinGameId, setJoinGameId] = useState('');
  const [gameType, setGameType] = useState(null);
  const [players, setPlayers] = useState([]);
  const [waiting, setWaiting] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const onGameCreated = ({ gameId }) => {
      setGameId(gameId);
      setWaiting(true);
    };

    const onGameStarted = ({ gameId, gameType: type, players }) => {
      setGameId(gameId);
      setGameType(type);
      setPlayers(players);
      setWaiting(false);
      setGameStarted(true);
    };

    const onRematchStarted = ({ gameId: newGameId, gameType: type, players: newPlayers }) => {
      setGameId(newGameId);
      setGameType(type);
      setPlayers(newPlayers);
      setGameStarted(true);
    };

    socket.on('game_created', onGameCreated);
    socket.on('game_started', onGameStarted);
    socket.on('rematch_started', onRematchStarted);

    return () => {
      socket.off('game_created', onGameCreated);
      socket.off('game_started', onGameStarted);
      socket.off('rematch_started', onRematchStarted);
    };
  }, [socket]);

  const createGame = (type) => {
    setGameType(type);
    socket?.emit('create_game', { roomId: id, gameType: type });
  };

  const joinGame = () => {
    if (!joinGameId.trim()) return;
    // Don't hardcode gameType — it will come from game_started event
    socket?.emit('join_game', { gameId: joinGameId.trim() });
  };

  const handleCopyGameId = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId);
      toast.success('Game ID copied to clipboard!');
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <button onClick={() => navigate(`/room/${id}`)} style={styles.backBtn}>
          ← Back to Chat
        </button>

        {!gameType && !gameStarted && (
          <div style={styles.card}>
            <h2 style={styles.title}>🎮 Start or Join a Game</h2>

            <h3 style={styles.sectionTitle}>Create New Game</h3>
            <div style={styles.gameGrid}>
              <button onClick={() => createGame('tictactoe')} style={styles.gameOption}>
                <span style={styles.gameIcon}>⭕</span>
                <span>Tic Tac Toe</span>
              </button>
              <button onClick={() => createGame('connect4')} style={styles.gameOption}>
                <span style={styles.gameIcon}>🔴</span>
                <span>Connect 4</span>
              </button>
              <button onClick={() => createGame('chess')} style={styles.gameOption}>
                <span style={styles.gameIcon}>♟️</span>
                <span>Chess</span>
              </button>
            </div>

            <div style={styles.divider}>
              <span style={styles.dividerText}>OR JOIN EXISTING</span>
            </div>

            <div style={styles.joinRow}>
              <input
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                placeholder="Paste Game ID here..."
                style={styles.input}
              />
              <button onClick={joinGame} style={styles.joinBtn}>
                Join Game
              </button>
            </div>
          </div>
        )}

        {waiting && !gameStarted && (
          <div style={styles.card}>
            <div style={styles.waitingIcon}>⏳</div>
            <h3 style={styles.waitingTitle}>Waiting for opponent...</h3>
            <p style={styles.gameIdLabel}>Share this Game ID with your friend:</p>
            <div style={styles.gameIdBox}>
              <code style={styles.gameIdText}>{gameId}</code>
              <button onClick={handleCopyGameId} style={styles.copyBtn}>
                📋 Copy
              </button>
            </div>
            <p style={styles.hint}>Your friend should click "Start Game" → paste this ID → click "Join Game"</p>
          </div>
        )}

        {gameStarted && gameType === 'tictactoe' && (
          <TicTacToe gameId={gameId} players={players} roomId={id} />
        )}

        {gameStarted && gameType === 'connect4' && (
          <Connect4 gameId={gameId} players={players} roomId={id} />
        )}

        {gameStarted && gameType === 'chess' && (
          <div style={styles.card}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>♟️</div>
            <h3 style={{ color: '#cdd6f4', marginBottom: '8px' }}>Chess — Coming Soon!</h3>
            <p style={{ color: '#a6adc8', fontSize: '14px' }}>
              We're working on a full chess experience. Stay tuned!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#1e1e2e' },
  container: { maxWidth: '800px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  backBtn: { background: 'none', border: '1px solid #45475a', color: '#cdd6f4', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-start', fontSize: '14px' },
  card: { background: '#2e2e3e', borderRadius: '16px', padding: '36px', textAlign: 'center' },
  title: { color: '#cdd6f4', marginBottom: '28px', fontSize: '22px' },
  sectionTitle: { color: '#a6adc8', fontSize: '14px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' },
  gameGrid: { display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' },
  gameOption: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px 28px', background: '#1e1e2e', border: '2px solid #45475a', borderRadius: '12px', cursor: 'pointer', color: '#cdd6f4', fontSize: '14px', fontWeight: 600, transition: 'border-color 0.2s' },
  gameIcon: { fontSize: '36px' },
  divider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0 20px' },
  dividerText: { color: '#45475a', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' },
  joinRow: { display: 'flex', gap: '10px', justifyContent: 'center' },
  input: { flex: 1, maxWidth: '400px', padding: '12px', borderRadius: '8px', border: '1px solid #45475a', background: '#1e1e2e', color: '#cdd6f4', fontSize: '14px' },
  joinBtn: { padding: '12px 24px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' },
  waitingIcon: { fontSize: '48px', marginBottom: '12px' },
  waitingTitle: { color: '#cdd6f4', fontSize: '20px', marginBottom: '16px' },
  gameIdLabel: { color: '#a6adc8', fontSize: '14px', marginBottom: '12px' },
  gameIdBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#1e1e2e', borderRadius: '10px', padding: '14px 20px', marginBottom: '16px' },
  gameIdText: { color: '#6366f1', fontSize: '15px', fontWeight: 700, wordBreak: 'break-all' },
  copyBtn: { background: '#45475a', border: 'none', color: '#cdd6f4', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  hint: { color: '#6c7086', fontSize: '13px', fontStyle: 'italic' },
};