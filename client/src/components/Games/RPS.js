import { useEffect, useState } from 'react';
import './Games.css';

const CHOICES = [
  { id: 'rock', icon: '🪨', label: 'Rock' },
  { id: 'paper', icon: '📄', label: 'Paper' },
  { id: 'scissors', icon: '✂️', label: 'Scissors' },
];

export default function RPS({ socket, roomCode, user }) {
  const [players, setPlayers] = useState({});
  const [scores, setScores] = useState({});
  const [round, setRound] = useState(1);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [chose, setChose] = useState(false);
  const [myChoice, setMyChoice] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [champion, setChampion] = useState(null);
  const [playAgainSent, setPlayAgainSent] = useState(false);
  const [opponentWantsPlay, setOpponentWantsPlay] = useState(false);

  const myId = user?._id || user?.id || '';

  useEffect(() => {
    if (!socket) return;
    socket.emit('game:move', { roomCode, gameType: 'rps', move: { action: 'join' } });

    socket.on('game:rps:state', (s) => {
      setPlayers(s.players || {});
      setScores(s.scores || {});
      setRound(s.round || 1);
      setGameStatus(s.status);
      setChose(false); setMyChoice(null);
      setRoundResult(null); setChampion(null);
      setPlayAgainSent(false); setOpponentWantsPlay(false);
    });
    socket.on('game:rps:chose', () => setChose(true));
    socket.on('game:rps:result', (res) => {
      setRoundResult(res);
      setScores(res.scores || {});
      setRound(r => r + 1);
      setChose(false); setMyChoice(null);
      setTimeout(() => setRoundResult(null), 3000);
    });
    socket.on('game:rps:champion', (res) => setChampion(res));
    socket.on('game:rps:playAgainRequest', () => setOpponentWantsPlay(true));

    return () => {
      ['game:rps:state','game:rps:chose','game:rps:result','game:rps:champion','game:rps:playAgainRequest']
        .forEach(e => socket.off(e));
    };
  }, [socket, roomCode]); // eslint-disable-line

  const choose = (choice) => {
    if (chose || gameStatus !== 'playing') return;
    setMyChoice(choice);
    socket.emit('game:move', { roomCode, gameType: 'rps', move: { action: 'choose', choice } });
  };

  const requestPlayAgain = () => {
    setPlayAgainSent(true);
    socket.emit('game:move', { roomCode, gameType: 'rps', move: { action: 'playAgain' } });
  };

  const myName = players[myId];
  const iWonChampion = champion && champion.winner === myName;

  return (
    <div className="game-wrap">
      {/* Scoreboard */}
      {Object.keys(players).length > 0 && (
        <div className="rps-scoreboard">
          {Object.entries(players).map(([id, name]) => (
            <div key={id} className="rps-score-card">
              <span className="rps-score-name">{name} {id === myId ? '(You)' : ''}</span>
              <span className="rps-score-num">{scores[id] || 0}</span>
            </div>
          ))}
          <div className="rps-round-badge">Round {round} / 5</div>
        </div>
      )}

      {/* Waiting */}
      {gameStatus !== 'playing' && !champion && (
        <div className="game-waiting"><div className="loader" /><p>Waiting for opponent...</p></div>
      )}

      {/* Game area */}
      {gameStatus === 'playing' && !champion && (
        <>
          <p className="rps-prompt">
            {chose ? '✅ Choice locked! Waiting for opponent...' : '👇 Choose your move:'}
          </p>
          <div className="rps-choices">
            {CHOICES.map(c => (
              <button key={c.id}
                className={`rps-btn ${myChoice === c.id ? 'rps-selected' : ''} ${chose ? 'rps-locked' : ''}`}
                onClick={() => choose(c.id)} disabled={chose}>
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
                    <span className="reveal-name">{players[id]} {id === myId ? '(You)' : ''}</span>
                  </div>
                ))}
              </div>
              <p className="round-winner">
                {roundResult.winner === 'draw' ? '🤝 Draw this round!'
                  : roundResult.winner === myName ? '🎉 You win this round!'
                  : `${roundResult.winner} wins this round!`}
              </p>
            </div>
          )}
        </>
      )}

      {/* Champion */}
      {champion && (
        <div className={`result-panel animate-popIn ${iWonChampion ? 'result-win' : ''}`}>
          <div className="result-emoji">{iWonChampion ? '🏆' : '😞'}</div>
          <h3 className="result-title">{iWonChampion ? 'You Win the Match! 🎉' : `${champion.winner} Wins the Match!`}</h3>
          <p className="result-sub">{iWonChampion ? 'Stats updated!' : 'Better luck next time!'}</p>
          <div className="champion-scores">
            {Object.entries(champion.scores || {}).map(([id, s]) => (
              <div key={id} className="champ-score-row">
                <span>{champion.players?.[id]} {id === myId ? '(You)' : ''}</span>
                <span className="champ-score">{s} pts</span>
              </div>
            ))}
          </div>
          <div className="play-again-area">
            {!playAgainSent
              ? <button className="btn btn-primary" onClick={requestPlayAgain}>🔄 Rematch</button>
              : <p className="waiting-text">⏳ Waiting for opponent to accept...</p>}
            {opponentWantsPlay && !playAgainSent && (
              <div className="opponent-wants">🎮 Opponent wants a rematch! Click Rematch to start.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}