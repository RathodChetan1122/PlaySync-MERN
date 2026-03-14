import React, { useState, useEffect } from 'react';
import './Games.css';

export default function WordScramble({ socket, roomCode, user }) {
  const [state, setState] = useState(null);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [correct, setCorrect] = useState(null);
  const [champion, setChampion] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('game:move', { roomCode, gameType: 'wordscramble', move: { action: 'join' } });

    socket.on('game:wordscramble:state', (s) => { setState(s); setGuess(''); setFeedback(null); setCorrect(null); });
    socket.on('game:wordscramble:correct', (res) => { setCorrect(res); setGuess(''); });
    socket.on('game:wordscramble:wrong', (res) => { setFeedback(res.message); setTimeout(() => setFeedback(null), 1500); });
    socket.on('game:wordscramble:champion', (res) => setChampion(res));

    return () => {
      socket.off('game:wordscramble:state');
      socket.off('game:wordscramble:correct');
      socket.off('game:wordscramble:wrong');
      socket.off('game:wordscramble:champion');
    };
  }, [socket]); // eslint-disable-line

  const submitGuess = (e) => {
    e.preventDefault();
    if (!guess.trim()) return;
    socket.emit('game:move', { roomCode, gameType: 'wordscramble', move: { action: 'guess', guess } });
  };

  if (champion) return (
    <div className="game-container">
      <div className="game-result animate-fadeIn">
        <div className="result-icon">🏆</div>
        <h3>{champion.winner === user.username ? 'You Win! 🎉' : `${champion.winner} Wins!`}</h3>
        <div className="ws-final-scores">
          {Object.entries(champion.scores || {}).map(([id, score]) => (
            <div key={id} className="ws-score-row">
              <span>{champion.players?.[id]}</span>
              <span>{score} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="game-container">
      <div className="ws-wrapper">
        {state?.status === 'playing' ? (
          <>
            {/* Round info */}
            <div className="ws-header">
              <span className="ws-round">Round {state.round}/{state.maxRounds}</span>
              <span className="ws-hint">💡 {state.hint}</span>
            </div>

            {/* Scrambled word */}
            <div className="ws-scrambled">
              {state.scrambled?.split('').map((letter, i) => (
                <span key={i} className="ws-letter">{letter.toUpperCase()}</span>
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

            {/* Correct result banner */}
            {correct && (
              <div className="ws-correct animate-fadeIn">
                🎉 <strong>{correct.winner}</strong> guessed it! Word: <strong>{correct.word}</strong>
              </div>
            )}

            {/* Guess input */}
            {!correct && (
              <form className="ws-form" onSubmit={submitGuess}>
                <input
                  className="input ws-input"
                  placeholder="Type your guess..."
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary">Guess →</button>
              </form>
            )}

            {feedback && <p className="ws-feedback">{feedback}</p>}
          </>
        ) : (
          <div className="waiting-room">
            <div className="loader" />
            <p>Waiting for at least 2 players...</p>
          </div>
        )}
      </div>
    </div>
  );
}
