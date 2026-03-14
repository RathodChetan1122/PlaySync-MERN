import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Layout/Navbar';
import ChatPanel from '../components/Chat/ChatPanel';
import MembersList from '../components/Rooms/MembersList';
import GameSelector from '../components/Games/GameSelector';
import TicTacToe from '../components/Games/TicTacToe';
import RPS from '../components/Games/RPS';
import WordScramble from '../components/Games/WordScramble';
import Chess from '../components/Games/Chess';
import axios from 'axios';
import toast from 'react-hot-toast';
import './RoomPage.css';

export default function RoomPage() {
  const { code } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(true);

  const isHost = room?.host?._id === user?._id || room?.host === user?._id;

  useEffect(() => {
    loadRoom();
  }, [code]); // eslint-disable-line

  useEffect(() => {
    if (!socket || !room) return;

    socket.emit('room:join', { roomCode: code });

    socket.on('room:joined', ({ room: r }) => {
      setMembers(r.members);
    });

    socket.on('room:userJoined', ({ user: u }) => {
      setMembers(prev => [...prev.filter(m => m._id !== u._id), u]);
      toast.success(`${u.username} joined`);
    });

    socket.on('room:userLeft', ({ userId, username }) => {
      setMembers(prev => prev.filter(m => m._id !== userId));
      toast(`${username} left the room`, { icon: '👋' });
    });

    socket.on('chat:message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('game:started', ({ gameType }) => {
      setActiveGame(gameType);
      toast.success(`${gameType.toUpperCase()} game started!`);
    });

    socket.on('game:ended', () => {
      setActiveGame(null);
    });

    socket.on('error', ({ message }) => toast.error(message));

    return () => {
      socket.emit('room:leave', { roomCode: code });
      socket.off('room:joined');
      socket.off('room:userJoined');
      socket.off('room:userLeft');
      socket.off('chat:message');
      socket.off('game:started');
      socket.off('game:ended');
      socket.off('error');
    };
  }, [socket, room, code]); // eslint-disable-line

  const loadRoom = async () => {
    try {
      const res = await axios.get(`/api/rooms/${code}`);
      setRoom(res.data);
      setMembers(res.data.members);
      setMessages(res.data.messages || []);
      if (res.data.currentGame?.isActive) setActiveGame(res.data.currentGame.type);
    } catch {
      toast.error('Room not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      await axios.delete(`/api/rooms/${room._id}/leave`);
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    }
  };

  const startGame = (gameType) => {
    socket.emit('game:start', { roomCode: code, gameType });
  };

  const endGame = () => {
    socket.emit('game:end', { roomCode: code });
    setActiveGame(null);
  };

  if (loading) return <div className="page-loader"><div className="loader" /></div>;

  const renderGame = () => {
    const props = { socket, roomCode: code, user, onEnd: endGame, isHost };
    switch (activeGame) {
      case 'tictactoe': return <TicTacToe {...props} />;
      case 'rps': return <RPS {...props} />;
      case 'wordscramble': return <WordScramble {...props} />;
      case 'chess': return <Chess {...props} />;
      default: return null;
    }
  };

  return (
    <div className="room-page">
      <Navbar />
      <div className="room-layout">
        {/* Left: Members */}
        <aside className="room-sidebar">
          <div className="room-info card">
            <div className="room-name">{room?.name}</div>
            <div className="room-code-display">#{code}</div>
            <button className="btn btn-danger btn-sm" onClick={handleLeave} style={{ width: '100%', marginTop: 8 }}>
              🚪 Leave Room
            </button>
          </div>
          <MembersList members={members} hostId={room?.host?._id || room?.host} currentUserId={user?._id} />
        </aside>

        {/* Center: Game Area */}
        <main className="room-main">
          {activeGame ? (
            <div className="game-area animate-fadeIn">
              <div className="game-header">
                <h3 className="game-title">🎮 {activeGame.toUpperCase()}</h3>
                {isHost && <button className="btn btn-danger btn-sm" onClick={endGame}>End Game</button>}
              </div>
              {renderGame()}
            </div>
          ) : (
            <GameSelector isHost={isHost} onStart={startGame} />
          )}
        </main>

        {/* Right: Chat */}
        <aside className="room-chat-sidebar">
          <ChatPanel messages={messages} socket={socket} roomCode={code} user={user} />
        </aside>
      </div>
    </div>
  );
}
