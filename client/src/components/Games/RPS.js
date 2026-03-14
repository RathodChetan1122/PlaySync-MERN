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
  const [playAgainSent, setPlayAgainSent] = useState(false);
  const [opponentWantsPlay, setOpponentWantsPlay] = useState(false);

  useEffect(() => {
    if (!socket) return;
    socket.emit('game:move', { roomCode, gameType: 'rps', move: { action: 'join' } });

    socket.on('game:rps:state', (s) => {
      setState(s); setChose(false); setMyChoice(null);
      setRoundResult(null); setChampion(null);
      setPlayAgainSent(false); setOpponentWantsPlay(false);
    });
    socket.on('game:rps:chose', () => setChose(true));
    socket.on('game:rps:result', (res) => {
      setRoundResult(res); setChose(false); setMyChoice(null);
    });
    socket.on('game:rps:champion', (res) => setChampion(res));
    socket.on('game:rps:playAgainRequest', () => setOpponentWantsPlay(true));

    return () => {
      ['game:rps:state','game:rps:chose','game:rps:result','game:rps:champion','game:rps:playAgainRequest']
        .forEach(e => socket.off(e));
    };
  }, [socket]); // eslint-disable-line

  const choose = (choice) => {
    if (chose || !state || state.status !== 'playing') return;
    setMyChoice(choice);
    socket.emit('game:move', { roomCode, gameType: 'rps', move: { action: 'choose', choice } });
  };

  const requestPlayAgain = () => {
    setPlayAgainSent(true);
    socket.emit('game:move', { roomCode, gameType: 'rps', move: { action: 'playAgain' } });
  };

  const isWinner = champion && champion.winner === user.username;

  return (
    <div className="game-wrap">
      {/* Scoreboard */}
      {state?.players && (
        <div className="rps-scoreboard">
          {Object.entries(state.players).map(([id, name]) => (
            <div key={id} className="rps-score-card">
              <span className="rps-score-name">{name}{id === user._id ? ' (You)' : ''}</span>
              <span className="rps-score-num">{state.scores?.[id] || 0}</span>
            </div>
          ))}
          {state.round && <div className="rps-round-badge">Round {state.round}</div>}
        </div>
      )}

      {state?.status === 'playing' && !champion ? (
        <>
          <p className="rps-prompt">
            {chose ? '✅ Locked in! Waiting for opponent...' : 'Choose your weapon:'}
          </p>
          <div className="rps-choices">
            {CHOICES.map(c => (
              <button
                key={c.id}
                className={`rps-btn ${myChoice === c.id ? 'rps-selected' : ''} ${chose ? 'rps-locked' : ''}`}
                onClick={() => choose(c.id)}
                disabled={chose}
              >
                <span className="rps-icon">{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          {roundResult && (
            <div className="round-result animate-popIn">
              <div className="round-reveal">
                {Object.entries(roundResult.choices || {}).map(([id, ch]) => (
                  <div key={id} className="reveal-item">
                    <span className="reveal-icon">{CHOICES.find(c => c.id === ch)?.icon}</span>
                    <span className="reveal-name">{roundResult.players?.[id]}</span>
                  </div>
                ))}
              </div>
              <p className="round-winner">
                {roundResult.winner === 'draw' ? '🤝 Draw this round!' : `${roundResult.winner} wins this round!`}
              </p>
            </div>
          )}
        </>
      ) : state && !champion && state.status !== 'playing' ? (
        <div className="game-waiting"><div className="loader" /><p>Waiting for opponent...</p></div>
      ) : null}

      {/* Champion screen */}
      {champion && (
        <div className="result-panel animate-popIn">
          <div className="result-emoji">{isWinner ? '🏆' : '😞'}</div>
          <h3 className="result-title">{isWinner ? 'You Win the Match!' : `${champion.winner} Wins!`}</h3>
          <div className="champion-scores">
            {Object.entries(champion.scores || {}).map(([id, s]) => (
              <div key={id} className="champ-score-row">
                <span>{champion.players?.[id]}</span>
                <span className="champ-score">{s} pts</span>
              </div>
            ))}
          </div>
          <div className="play-again-area">
            {!playAgainSent
              ? <button className="btn btn-primary" onClick={requestPlayAgain}>🔄 Rematch</button>
              : <p className="waiting-text">⏳ Waiting for opponent...</p>
            }
            {opponentWantsPlay && !playAgainSent && (
              <div className="opponent-wants">Opponent wants a rematch!</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
