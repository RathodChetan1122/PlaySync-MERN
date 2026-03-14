import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import './LobbyPage.css';

export default function LobbyPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get('/api/rooms');
      setRooms(res.data);
    } catch { toast.error('Failed to fetch rooms'); }
    finally { setLoading(false); }
  };

  const joinRoom = async (code) => {
    try {
      await axios.post('/api/rooms/join', { code });
      navigate(`/room/${code}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to join'); }
  };

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  return (
    <div className="lobby-page">
      <Navbar />
      <div className="lobby-content">
        <div className="lobby-header animate-fadeIn">
          <h2>🌐 Game Lobby</h2>
          <p className="lobby-subtitle">Find a public room and jump in</p>
        </div>

        <div className="lobby-toolbar animate-fadeIn">
          <div className="filter-tabs">
            {['all', 'idle', 'playing'].map(f => (
              <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? '🎮 All' : f === 'idle' ? '⏳ Waiting' : '🔴 Playing'}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchRooms}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loader" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="icon">🎮</span>
            <p>No rooms found. Create one from the dashboard!</p>
          </div>
        ) : (
          <div className="lobby-grid animate-fadeIn">
            {filtered.map(room => (
              <div key={room._id} className="lobby-room-card">
                <div className="lobby-room-top">
                  <h4 className="lobby-room-name">{room.name}</h4>
                  <span className={`badge ${room.status === 'playing' ? 'badge-in-game' : 'badge-online'}`}>
                    {room.status === 'playing' ? '🎮 Playing' : '⏳ Waiting'}
                  </span>
                </div>
                <div className="lobby-room-meta">
                  <span>👑 {room.host?.username}</span>
                  <span>👥 {room.members.length}/{room.maxMembers}</span>
                  <span className="room-code-tag">#{room.code}</span>
                </div>
                <div className="lobby-members-preview">
                  {room.members.slice(0, 5).map(m => (
                    <div key={m._id} className="lobby-member-dot" title={m.username}>
                      {m.username?.[0]?.toUpperCase()}
                    </div>
                  ))}
                  {room.members.length > 5 && <span className="more-members">+{room.members.length - 5}</span>}
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => joinRoom(room.code)}
                  disabled={room.members.length >= room.maxMembers}
                  style={{ width: '100%' }}
                >
                  {room.members.length >= room.maxMembers ? '🚫 Room Full' : 'Join Room →'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
