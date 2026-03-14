import React, { useState, useEffect } from 'react';
import './Games.css';

const CHOICES = [
  { id: 'rock', icon: '🪨', label: 'Rock' },
  { id: 'paper', icon: '📄', label: 'Paper' },
  { id: 'scissors', icon: '✂️', label: 'Scissors' },
];

export default function RPS({ socket, roomCode, user }) {
  const [state, setState] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [champion, setChampion] = useState(null);
  const [chose, setChose] = useState(false);
  const [myChoice, setMyChoice] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('game:move', { roomCode, gameType: 'rps', move: { action: 'join' } });

    socket.on('game:rps:state', (s) => { setState(s); setChose(false); setMyChoice(null); setRoundResult(null); });
    socket.on('game:rps:chose', () => setChose(true));
    socket.on('game:rps:result', (res) => { setRoundResult(res); setChose(false); });
    socket.on('game:rps:champion', (res) => setChampion(res));

    return () => {
      socket.off('game:rps:state');
      socket.off('game:rps:chose');
      socket.off('game:rps:result');
      socket.off('game:rps:champion');
    };
  }, [socket]); // eslint-disable-line

  const choose = (choice) => {
    if (chose || !state || state.status !== 'playing') return;
    setMyChoice(choice);
    socket.emit('game:move', { roomCode, gameType: 'rps', move: { action: 'choose', choice } });
  };

  if (champion) return (
    <div className="game-container">
      <div className="game-result animate-fadeIn">
        <div className="result-icon">🏆</div>
        <h3>{champion.winner === user.username ? 'You Win! 🎉' : `${champion.winner} Wins!`}</h3>
        <p>Game over — best of 3 rounds!</p>
      </div>
    </div>
  );

  return (
    <div className="game-container">
      <div className="rps-wrapper">
        {/* Scoreboard */}
        {state?.scores && (
          <div className="rps-scores">
            {Object.entries(state.players || {}).map(([id, name]) => (
              <div key={id} className="rps-score-item">
                <span className="rps-player-name">{name}{id === user._id ? ' (You)' : ''}</span>
                <span className="rps-score">{state.scores[id] || 0}</span>
              </div>
            ))}
            {state.round && <div className="rps-round">Round {state.round}</div>}
          </div>
        )}

        {/* Choices */}
        {state?.status === 'playing' ? (
          <>
            <p className="rps-prompt">{chose ? '✅ Choice locked! Waiting for opponent...' : 'Make your choice!'}</p>
            <div className="rps-choices">
              {CHOICES.map(c => (
                <button
                  key={c.id}
                  className={`rps-choice-btn ${myChoice === c.id ? 'selected' : ''} ${chose ? 'locked' : ''}`}
                  onClick={() => choose(c.id)}
                  disabled={chose}
                >
                  <span className="rps-icon">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="waiting-room">
            <div className="loader" />
            <p>Waiting for opponent to join...</p>
          </div>
        )}

        {/* Round Result */}
        {roundResult && (
          <div className="rps-round-result animate-fadeIn">
            <div className="rps-reveal">
              {Object.entries(roundResult.choices || {}).map(([id, choice]) => (
                <div key={id} className="rps-reveal-item">
                  <span className="rps-reveal-icon">{CHOICES.find(c => c.id === choice)?.icon}</span>
                  <span>{roundResult.players?.[id]}</span>
                </div>
              ))}
            </div>
            <div className="rps-winner">
              {roundResult.winner === 'draw' ? '🤝 Draw!' : `🏆 ${roundResult.winner} wins this round!`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
