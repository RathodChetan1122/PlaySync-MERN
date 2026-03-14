import React, { useState, useEffect } from 'react';
import './Games.css';

export default function WordScramble({ socket, roomCode, user }) {
  const [state, setState] = useState(null);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [correct, setCorrect] = useState(null);
  const [champion, setChampion] = useState(null);
  const [playAgainSent, setPlayAgainSent] = useState(false);
  const [opponentWantsPlay, setOpponentWantsPlay] = useState(false);

  useEffect(() => {
    if (!socket) return;
    socket.emit('game:move', { roomCode, gameType: 'wordscramble', move: { action: 'join' } });

    socket.on('game:wordscramble:state', (s) => {
      setState(s); setGuess(''); setFeedback(null); setCorrect(null);
      setChampion(null); setPlayAgainSent(false); setOpponentWantsPlay(false);
    });
    socket.on('game:wordscramble:correct', (res) => { setCorrect(res); setGuess(''); });
    socket.on('game:wordscramble:wrong', (res) => {
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 1800);
    });
    socket.on('game:wordscramble:champion', (res) => setChampion(res));
    socket.on('game:wordscramble:playAgainRequest', () => setOpponentWantsPlay(true));

    return () => {
      ['game:wordscramble:state','game:wordscramble:correct','game:wordscramble:wrong','game:wordscramble:champion','game:wordscramble:playAgainRequest']
        .forEach(e => socket.off(e));
    };
  }, [socket]); // eslint-disable-line

  const submitGuess = (e) => {
    e.preventDefault();
    if (!guess.trim()) return;
    socket.emit('game:move', { roomCode, gameType: 'wordscramble', move: { action: 'guess', guess } });
  };

  const requestPlayAgain = () => {
    setPlayAgainSent(true);
    socket.emit('game:move', { roomCode, gameType: 'wordscramble', move: { action: 'playAgain' } });
  };

  const isWinner = champion && champion.winner === user.username;

  return (
    <div className="game-wrap">
      {/* Champion screen */}
      {champion && (
        <div className="result-panel animate-popIn">
          <div className="result-emoji">{isWinner ? '🏆' : '😞'}</div>
          <h3 className="result-title">{isWinner ? 'You Win!' : `${champion.winner} Wins!`}</h3>
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
              ? <button className="btn btn-primary" onClick={requestPlayAgain}>🔄 Play Again</button>
              : <p className="waiting-text">⏳ Waiting for opponent...</p>
            }
            {opponentWantsPlay && !playAgainSent && (
              <div className="opponent-wants">Opponent wants to play again!</div>
            )}
          </div>
        </div>
      )}

      {!champion && state?.status === 'playing' && (
        <>
          {/* Round + hint */}
          <div className="ws-meta">
            <span className="ws-round-badge">Round {state.round} / {state.maxRounds}</span>
            <span className="ws-hint">💡 {state.hint}</span>
          </div>

          {/* Scrambled word */}
          <div className="ws-letters">
            {state.scrambled?.split('').map((l, i) => (
              <span key={i} className="ws-letter">{l.toUpperCase()}</span>
            ))}
          </div>

          {/* Scores */}
          <div className="ws-scores">
            {Object.entries(state.players || {}).map(([id, name]) => (
              <div key={id} className="ws-score-item">
                <span>{name}{id === user._id ? ' (You)' : ''}</span>
                <span className="ws-pts">{state.scores?.[id] || 0} pts</span>
              </div>
            ))}
          </div>

          {/* Correct banner */}
          {correct && (
            <div className="ws-correct animate-fadeIn">
              🎉 <strong>{correct.winner}</strong> got it! Word: <strong>{correct.word}</strong>
              <span className="ws-next-hint">Next word in 3s...</span>
            </div>
          )}

          {/* Input */}
          {!correct && (
            <form className="ws-form" onSubmit={submitGuess}>
              <input className="input" placeholder="Type your answer..." value={guess}
                onChange={e => setGuess(e.target.value)} autoFocus autoComplete="off" />
              <button type="submit" className="btn btn-primary">Submit</button>
            </form>
          )}

          {feedback && <p className="ws-feedback">{feedback}</p>}
        </>
      )}

      {!champion && state?.status !== 'playing' && (
        <div className="game-waiting"><div className="loader" /><p>Waiting for players...</p></div>
      )}
    </div>
  );
}
