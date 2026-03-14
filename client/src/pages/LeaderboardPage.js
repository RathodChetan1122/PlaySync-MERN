import React, { useState, useEffect } from 'react';
import Navbar from '../components/Layout/Navbar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './LeaderboardPage.css';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/users/leaderboard')
      .then(res => setPlayers(res.data))
      .finally(() => setLoading(false));
  }, []);

  const rankIcon = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  return (
    <div className="lb-page">
      <Navbar />
      <div className="lb-content">
        <div className="lb-header animate-fadeIn">
          <h2>🏆 Leaderboard</h2>
          <p>Top players ranked by wins</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loader" /></div>
        ) : (
          <div className="lb-table animate-fadeIn">
            <div className="lb-table-header">
              <span>Rank</span>
              <span>Player</span>
              <span>Games</span>
              <span>Wins</span>
              <span>Win Rate</span>
            </div>
            {players.map((p, i) => {
              const winRate = p.stats.gamesPlayed > 0
                ? Math.round((p.stats.wins / p.stats.gamesPlayed) * 100)
                : 0;
              const isMe = p._id === user?._id;
              return (
                <div key={p._id} className={`lb-row ${i < 3 ? 'top-three' : ''} ${isMe ? 'is-me' : ''}`}>
                  <span className="lb-rank">{rankIcon(i)}</span>
                  <div className="lb-player">
                    <div className="lb-avatar">
                      {p.avatar ? <img src={p.avatar} alt="" /> : p.username[0].toUpperCase()}
                    </div>
                    <span className="lb-username">{p.username}{isMe && <span className="you-tag"> (You)</span>}</span>
                  </div>
                  <span className="lb-stat">{p.stats.gamesPlayed}</span>
                  <span className="lb-stat lb-wins">{p.stats.wins}</span>
                  <div className="lb-winrate">
                    <div className="winrate-bar">
                      <div className="winrate-fill" style={{ width: `${winRate}%` }} />
                    </div>
                    <span>{winRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
