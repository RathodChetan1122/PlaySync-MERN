import { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import api from '../api/axios';

export default function LeaderboardPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/users/leaderboard').then((res) => setUsers(res.data.users));
  }, []);

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.title}>🏆 Leaderboard</h2>
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>#</span>
            <span>Player</span>
            <span>Wins</span>
            <span>Losses</span>
            <span>Draws</span>
          </div>
          {users.map((user, index) => (
            <div key={user._id} style={{ ...styles.tableRow, background: index === 0 ? '#2e2e3e' : 'transparent' }}>
              <span style={styles.rank(index)}>{index + 1}</span>
              <span style={styles.playerName}>{user.username}</span>
              <span style={styles.wins}>{user.stats.wins}</span>
              <span style={styles.losses}>{user.stats.losses}</span>
              <span style={styles.draws}>{user.stats.draws}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#1e1e2e' },
  container: { maxWidth: '700px', margin: '0 auto', padding: '32px 16px' },
  title: { color: '#cdd6f4', fontSize: '28px', marginBottom: '24px' },
  table: { background: '#2e2e3e', borderRadius: '12px', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '50px 1fr 80px 80px 80px', padding: '14px 20px', background: '#45475a', color: '#a6adc8', fontSize: '13px', fontWeight: 600 },
  tableRow: { display: 'grid', gridTemplateColumns: '50px 1fr 80px 80px 80px', padding: '14px 20px', borderBottom: '1px solid #45475a', alignItems: 'center' },
  rank: (i) => ({ color: i === 0 ? '#f9e2af' : i === 1 ? '#cdd6f4' : i === 2 ? '#fab387' : '#a6adc8', fontWeight: 700, fontSize: '16px' }),
  playerName: { color: '#cdd6f4', fontWeight: 600 },
  wins: { color: '#a6e3a1', fontWeight: 600, textAlign: 'center' },
  losses: { color: '#f38ba8', fontWeight: 600, textAlign: 'center' },
  draws: { color: '#a6adc8', textAlign: 'center' },
};