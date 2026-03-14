import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/rooms'), api.get('/users')])
      .then(([roomsRes, usersRes]) => {
        setRooms(roomsRes.data.rooms);
        setUsers(usersRes.data.users);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const createRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const res = await api.post('/rooms', { name: newRoomName });
      setRooms([...rooms, res.data.room]);
      setNewRoomName('');
      toast.success('Room created!');
    } catch {
      toast.error('Failed to create room');
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await api.post(`/users/${userId}/friend-request`);
      toast.success('Friend request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>👤 Your Profile</h3>
            <p style={styles.username}>{user?.username}</p>
            <div style={styles.stats}>
              <div style={styles.stat}><span style={styles.statNum}>{user?.stats?.wins}</span><span>Wins</span></div>
              <div style={styles.stat}><span style={styles.statNum}>{user?.stats?.losses}</span><span>Losses</span></div>
              <div style={styles.stat}><span style={styles.statNum}>{user?.stats?.draws}</span><span>Draws</span></div>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>👥 Players</h3>
            {users.slice(0, 8).map((u) => (
              <div key={u._id} style={styles.userRow}>
                <span style={styles.statusDot(onlineUsers.includes(u._id))} />
                <span style={styles.playerName}>{u.username}</span>
                <button onClick={() => sendFriendRequest(u._id)} style={styles.addBtn}>+</button>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.main}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🏠 Create Room</h3>
            <form onSubmit={createRoom} style={styles.createForm}>
              <input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name..."
                style={styles.input}
              />
              <button type="submit" style={styles.createBtn}>Create</button>
            </form>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🚀 Public Rooms</h3>
            {rooms.length === 0 && <p style={styles.empty}>No rooms yet. Create one!</p>}
            <div style={styles.roomGrid}>
              {rooms.map((room) => (
                <div key={room._id} style={styles.roomCard}>
                  <h4 style={styles.roomName}>{room.name}</h4>
                  <p style={styles.roomMeta}>{room.members?.length || 0} members</p>
                  <button
                    onClick={() => navigate(`/room/${room._id}`)}
                    style={styles.joinBtn}
                  >
                    Join Room
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#1e1e2e' },
  container: { display: 'flex', gap: '24px', padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  sidebar: { width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { background: '#2e2e3e', borderRadius: '12px', padding: '20px' },
  cardTitle: { color: '#cdd6f4', margin: '0 0 16px', fontSize: '16px', fontWeight: 700 },
  username: { color: '#6366f1', fontWeight: 700, fontSize: '18px', margin: '0 0 12px' },
  stats: { display: 'flex', gap: '12px' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, background: '#1e1e2e', borderRadius: '8px', padding: '10px', color: '#a6adc8', fontSize: '12px', gap: '4px' },
  statNum: { color: '#cdd6f4', fontWeight: 700, fontSize: '20px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #45475a' },
  statusDot: (online) => ({ width: '8px', height: '8px', borderRadius: '50%', background: online ? '#a6e3a1' : '#6c7086', flexShrink: 0 }),
  playerName: { flex: 1, color: '#cdd6f4', fontSize: '14px' },
  addBtn: { background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', fontSize: '16px' },
  createForm: { display: 'flex', gap: '10px' },
  input: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #45475a', background: '#1e1e2e', color: '#cdd6f4', fontSize: '14px' },
  createBtn: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
  roomGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '8px' },
  roomCard: { background: '#1e1e2e', borderRadius: '10px', padding: '16px' },
  roomName: { color: '#cdd6f4', margin: '0 0 6px', fontSize: '15px' },
  roomMeta: { color: '#a6adc8', fontSize: '12px', margin: '0 0 12px' },
  joinBtn: { width: '100%', padding: '8px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
  empty: { color: '#a6adc8', fontSize: '14px' },
  loading: { color: '#cdd6f4', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1e1e2e' },
};