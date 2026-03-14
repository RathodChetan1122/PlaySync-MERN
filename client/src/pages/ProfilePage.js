import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Layout/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ProfilePage.css';

const BASE = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

const AVATARS = [
  '🎮', '🕹️', '👾', '🤖', '🦊', '🐉', '🦁', '🐺',
  '🦅', '🦋', '🌟', '⚡', '🔥', '💎', '🎯', '🏆',
];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${BASE}/api/users/profile`, { avatar: selectedAvatar });
      setUser(res.data);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const winRate = user?.stats?.gamesPlayed > 0
    ? Math.round((user.stats.wins / user.stats.gamesPlayed) * 100)
    : 0;

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-content">
        <div className="profile-card card animate-fadeIn">
          {/* Header */}
          <div className="profile-header">
            <div className="profile-big-avatar">
              {selectedAvatar || user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="profile-identity">
              <h2 className="profile-username">{user?.username}</h2>
              <p className="profile-email">{user?.email}</p>
              <span className={`badge badge-${user?.status || 'online'}`}>{user?.status || 'online'}</span>
            </div>
          </div>

          <div className="divider" />

          {/* Stats */}
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">{user?.stats?.gamesPlayed || 0}</span>
              <span className="profile-stat-label">Games Played</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value" style={{ color: 'var(--accent-green)' }}>{user?.stats?.wins || 0}</span>
              <span className="profile-stat-label">Wins</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value" style={{ color: 'var(--accent-red)' }}>{user?.stats?.losses || 0}</span>
              <span className="profile-stat-label">Losses</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value" style={{ color: 'var(--accent-yellow)' }}>{winRate}%</span>
              <span className="profile-stat-label">Win Rate</span>
            </div>
          </div>

          <div className="divider" />

          {/* Avatar picker */}
          <div>
            <h3 className="profile-section-title">Choose Avatar</h3>
            <div className="avatar-grid">
              {AVATARS.map(a => (
                <button
                  key={a}
                  className={`avatar-option ${selectedAvatar === a ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={saveProfile}
            disabled={saving}
            style={{ marginTop: 16, width: '100%' }}
          >
            {saving ? 'Saving...' : '💾 Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
