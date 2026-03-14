import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Layout/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', isPrivate: false, password: '', maxMembers: 8 });
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get('/api/rooms');
      setRooms(res.data);
    } catch (err) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return toast.error('Room name required');
    setCreating(true);
    try {
      const res = await axios.post('/api/rooms', createForm);
      toast.success('Room created!');
      navigate(`/room/${res.data.code}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return toast.error('Room code required');
    try {
      const res = await axios.post('/api/rooms/join', { code: joinCode, password: joinPassword });
      toast.success(`Joined ${res.data.name}!`);
      navigate(`/room/${res.data.code}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join room');
    }
  };

  const quickJoin = async (code) => {
    try {
      await axios.post('/api/rooms/join', { code });
      navigate(`/room/${code}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join');
    }
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        {/* Hero */}
        <div className="dashboard-hero animate-fadeIn">
          <div className="hero-text">
            <h2 className="hero-greeting">Welcome back, <span className="text-gradient">{user?.username}</span> 👋</h2>
            <p className="hero-sub">Ready to play? Create a room or join your friends.</p>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-value">{user?.stats?.wins || 0}</span>
              <span className="stat-label">Wins</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{user?.stats?.gamesPlayed || 0}</span>
              <span className="stat-label">Games</span>
            </div>
            <div className="stat-card">
              <span className={`stat-value ${connected ? 'text-green' : 'text-red'}`}>{connected ? 'Live' : 'Offline'}</span>
              <span className="stat-label">Status</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="action-bar animate-fadeIn">
          <button className="btn btn-primary btn-lg" onClick={() => { setShowCreate(true); setShowJoin(false); }}>
            ➕ Create Room
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => { setShowJoin(true); setShowCreate(false); }}>
            🔑 Join with Code
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/lobby')}>
            🌐 Browse Lobby
          </button>
        </div>

        {/* Create Room Modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal animate-fadeIn" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Create Room</h3>
              <form onSubmit={createRoom}>
                <div className="form-group">
                  <label className="form-label">Room Name</label>
                  <input className="input" placeholder="My Awesome Room" value={createForm.name}
                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Members</label>
                  <select className="input" value={createForm.maxMembers}
                    onChange={e => setCreateForm(p => ({ ...p, maxMembers: +e.target.value }))}>
                    {[2, 4, 6, 8].map(n => <option key={n} value={n}>{n} players</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label checkbox-label">
                    <input type="checkbox" checked={createForm.isPrivate}
                      onChange={e => setCreateForm(p => ({ ...p, isPrivate: e.target.checked }))} />
                    Private Room
                  </label>
                </div>
                {createForm.isPrivate && (
                  <div className="form-group">
                    <label className="form-label">Room Password</label>
                    <input className="input" type="password" placeholder="Room password"
                      value={createForm.password}
                      onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                )}
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Creating...' : '🚀 Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Room Modal */}
        {showJoin && (
          <div className="modal-overlay" onClick={() => setShowJoin(false)}>
            <div className="modal animate-fadeIn" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Join Room</h3>
              <form onSubmit={joinRoom}>
                <div className="form-group">
                  <label className="form-label">Room Code</label>
                  <input className="input" placeholder="ABC123" style={{ textTransform: 'uppercase', letterSpacing: 4 }}
                    value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password (if private)</label>
                  <input className="input" type="password" placeholder="Leave blank if public"
                    value={joinPassword} onChange={e => setJoinPassword(e.target.value)} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowJoin(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">🔑 Join</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Active Rooms */}
        <div className="rooms-section animate-fadeIn">
          <div className="section-header">
            <h3 className="section-title">🌐 Public Rooms</h3>
            <button className="btn btn-secondary btn-sm" onClick={fetchRooms}>↻ Refresh</button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="loader" /></div>
          ) : rooms.length === 0 ? (
            <div className="empty-state">
              <span className="icon">🎮</span>
              <p>No public rooms yet. Be the first to create one!</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map(room => (
                <div key={room._id} className="room-card">
                  <div className="room-card-header">
                    <h4 className="room-card-name">{room.name}</h4>
                    <span className={`badge ${room.status === 'playing' ? 'badge-in-game' : 'badge-online'}`}>
                      {room.status === 'playing' ? '🎮 Playing' : '⏳ Waiting'}
                    </span>
                  </div>
                  <div className="room-card-info">
                    <span>👥 {room.members.length}/{room.maxMembers}</span>
                    <span className="room-code">#{room.code}</span>
                  </div>
                  <div className="room-card-host">Host: {room.host?.username}</div>
                  <button className="btn btn-primary btn-sm room-join-btn"
                    onClick={() => quickJoin(room.code)}
                    disabled={room.members.length >= room.maxMembers}>
                    {room.members.length >= room.maxMembers ? 'Full' : 'Join Room →'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
