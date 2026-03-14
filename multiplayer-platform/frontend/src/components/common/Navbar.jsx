import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out!');
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>🎮 GameChat</Link>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Dashboard</Link>
        <Link to="/leaderboard" style={styles.link}>Leaderboard</Link>
        <span style={styles.online}>🟢 {onlineUsers.length} online</span>
        <span style={styles.username}>{user?.username}</span>
        <button onClick={handleLogout} style={styles.button}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0 24px', height: '60px', background: '#1e1e2e',
    borderBottom: '1px solid #2e2e3e', position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { color: '#6366f1', fontWeight: 800, fontSize: '20px', textDecoration: 'none' },
  links: { display: 'flex', alignItems: 'center', gap: '20px' },
  link: { color: '#cdd6f4', textDecoration: 'none', fontSize: '14px' },
  online: { color: '#a6e3a1', fontSize: '13px' },
  username: { color: '#cdd6f4', fontWeight: 600, fontSize: '14px' },
  button: {
    padding: '6px 16px', background: '#f38ba8', color: '#1e1e2e',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
  },
};