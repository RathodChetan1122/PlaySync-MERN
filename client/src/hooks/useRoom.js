import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Custom hook for room data, members, messages and socket binding.
 */
export function useRoom(code, socket, user) {
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRoom = useCallback(async () => {
    try {
      const res = await axios.get(`/api/rooms/${code}`);
      setRoom(res.data);
      setMembers(res.data.members || []);
      setMessages(res.data.messages || []);
      if (res.data.currentGame?.isActive) {
        setActiveGame(res.data.currentGame.type);
      }
    } catch {
      toast.error('Room not found');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { loadRoom(); }, [loadRoom]);

  useEffect(() => {
    if (!socket || !room) return;

    socket.emit('room:join', { roomCode: code });

    socket.on('room:joined', ({ room: r }) => setMembers(r.members));
    socket.on('room:userJoined', ({ user: u }) => {
      setMembers(prev => [...prev.filter(m => m._id !== u._id), u]);
    });
    socket.on('room:userLeft', ({ userId }) => {
      setMembers(prev => prev.filter(m => m._id !== userId));
    });
    socket.on('chat:message', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('game:started', ({ gameType }) => setActiveGame(gameType));
    socket.on('game:ended', () => setActiveGame(null));

    return () => {
      socket.emit('room:leave', { roomCode: code });
      ['room:joined', 'room:userJoined', 'room:userLeft',
       'chat:message', 'game:started', 'game:ended'].forEach(e => socket.off(e));
    };
  }, [socket, room, code]);

  return { room, members, messages, activeGame, setActiveGame, loading };
}
