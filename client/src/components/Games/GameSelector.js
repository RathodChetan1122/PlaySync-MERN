import React from 'react';
import './GameSelector.css';

const GAMES = [
  { id: 'tictactoe', name: 'Tic Tac Toe', icon: '⭕', desc: '2 players · Classic grid game', players: '2' },
  { id: 'rps', name: 'Rock Paper Scissors', icon: '✊', desc: '2 players · First to 3 wins', players: '2' },
  { id: 'wordscramble', name: 'Word Scramble', icon: '🔤', desc: '2+ players · Unscramble words', players: '2+' },
  { id: 'chess', name: 'Chess', icon: '♟️', desc: '2 players · Strategy board game', players: '2' },
];

export default function GameSelector({ isHost, onStart }) {
  return (
    <div className="game-selector animate-fadeIn">
      <div className="game-selector-header">
        <h3>🎮 Choose a Game</h3>
        {!isHost && <p className="host-note">Waiting for host to start a game...</p>}
      </div>
      <div className="games-grid">
        {GAMES.map(game => (
          <div key={game.id} className={`game-card ${!isHost ? 'disabled' : ''}`}>
            <div className="game-card-icon">{game.icon}</div>
            <div className="game-card-info">
              <h4 className="game-card-name">{game.name}</h4>
              <p className="game-card-desc">{game.desc}</p>
              <span className="game-players-badge">👥 {game.players}</span>
            </div>
            {isHost && (
              <button className="btn btn-primary btn-sm game-start-btn" onClick={() => onStart(game.id)}>
                Start →
              </button>
            )}
          </div>
        ))}
      </div>
      {!isHost && (
        <div className="waiting-animation">
          <div className="waiting-dots">
            <span /><span /><span />
          </div>
          <p>Host is choosing a game</p>
        </div>
      )}
    </div>
  );
}
