import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Layout/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ProfilePage.css';

const BASE = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

const AVATARS = [
  '🎮','🕹️','👾','🤖','🦊','🐉','🦁','🐺',
  '🦅','🦋','🌟','⚡','🔥','💎','🎯','🏆',
  '🐸','🦄','🐼','🦈','🎪','🚀','🌈','⚔️',
];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(user?.stats || { wins: 0, losses: 0, gamesPlayed: 0 });

  // Refresh stats on mount
  useEffect(() => {
    axios.get(`${BASE}/api/users/me/stats`)
      .then(res => { setStats(res.data.stats || {}); })
      .catch(() => {});
  }, []);

  // Sync avatar with user
  useEffect(() => {
    if (user?.avatar) setSelectedAvatar(user.avatar);
  }, [user]);

  const saveProfile = async () => {
    if (!selectedAvatar) return toast.error('Please select an avatar');
    setSaving(true);
    try {
      const res = await axios.put(`${BASE}/api/users/profile`, { avatar: selectedAvatar });
      setUser(prev => ({ ...prev, avatar: res.data.avatar }));
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const winRate = stats?.gamesPlayed > 0
    ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  const currentAvatar = selectedAvatar || user?.username?.[0]?.toUpperCase();

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-content">
        <div className="profile-card animate-fadeIn">
          {/* Header */}
          <div className="profile-top">
            <div className="profile-avatar-big">{currentAvatar}</div>
            <div>
              <h2 className="profile-uname">{user?.username}</h2>
              <p className="profile-email">{user?.email}</p>
              <span className={`badge badge-${user?.status || 'online'}`}>
                ● {user?.status || 'online'}
              </span>
            </div>
          </div>

          <div className="divider" />

          {/* Stats */}
          <div className="profile-stats">
            {[
              { label: 'Games', value: stats?.gamesPlayed || 0, color: 'var(--blue)' },
              { label: 'Wins', value: stats?.wins || 0, color: 'var(--green)' },
              { label: 'Losses', value: stats?.losses || 0, color: 'var(--red)' },
              { label: 'Win Rate', value: `${winRate}%`, color: 'var(--yellow)' },
            ].map(s => (
              <div key={s.label} className="pstat">
                <span className="pstat-val" style={{ color: s.color }}>{s.value}</span>
                <span className="pstat-label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="divider" />

          {/* Avatar picker */}
          <div>
            <p className="form-label" style={{ marginBottom: 12 }}>Choose Avatar</p>
            <div className="avatar-grid">
              {AVATARS.map(a => (
                <button
                  key={a}
                  className={`avatar-btn ${selectedAvatar === a ? 'avatar-selected' : ''}`}
                  onClick={() => setSelectedAvatar(a)}
                  title={a}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {selectedAvatar && (
            <div className="avatar-preview">
              <span>Preview:</span>
              <div className="avatar-preview-badge">{selectedAvatar}</div>
              <span className="text-muted" style={{ fontSize: 13 }}>{user?.username}</span>
            </div>
          )}

          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={saveProfile}
            disabled={saving}
            style={{ marginTop: 8 }}
          >
            {saving ? '⏳ Saving...' : '💾 Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
