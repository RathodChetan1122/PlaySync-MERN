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

  const handleLogout = () => { logout(); toast.success('Logged out!'); navigate('/login'); };

  const links = [
    { to: '/dashboard', label: '🏠 Dashboard' },
    { to: '/lobby', label: '🎮 Lobby' },
    { to: '/leaderboard', label: '🏆 Leaderboard' },
    { to: '/profile', label: '👤 Profile' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <span>🎮</span>
          <span className="navbar-brand-text">PlaySync</span>
        </Link>

        <div className="navbar-links">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`navbar-link ${location.pathname === l.to ? 'active' : ''}`}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="navbar-right">
          <div className={`socket-indicator ${connected ? 'connected' : 'disconnected'}`}>
            <span className="socket-dot" />
            {connected ? 'Live' : 'Offline'}
          </div>
          <div className="navbar-user">
            <div className="navbar-avatar">
              {user?.avatar ? <img src={user.avatar} alt="" /> : user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="navbar-username">{user?.username}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
