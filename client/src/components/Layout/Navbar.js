import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { to: '/lobby', label: 'Lobby', icon: '◈' },
    { to: '/leaderboard', label: 'Rankings', icon: '◆' },
    { to: '/profile', label: 'Profile', icon: '◉' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <div className="navbar-brand-icon">🎮</div>
          <span className="navbar-brand-text">PlaySync</span>
        </Link>
        <div className="navbar-links">
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`navbar-link ${location.pathname === l.to ? 'active' : ''}`}>
              <span>{l.icon}</span> {l.label}
            </Link>
          ))}
        </div>
        <div className="navbar-right">
          <div className={`socket-pill ${connected ? 'on' : 'off'}`}>
            <span className="socket-dot" />
            {connected ? 'Live' : 'Offline'}
          </div>
          <span className="nav-username">{user?.username}</span>
          <div className="nav-avatar">
            {user?.avatar ? user.avatar : user?.username?.[0]?.toUpperCase()}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
        </div>
      </div>
    </nav>
  );
}
