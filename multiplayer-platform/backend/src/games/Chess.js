export class Chess {
  constructor() {
    this.currentTurn = 0;
    this.moves = [];
  }

  makeMove(from, to, playerIndex) {
    if (this.currentTurn !== playerIndex) return { valid: false, reason: 'Not your turn' };

    this.moves.push({ from, to, player: playerIndex });
    this.currentTurn = playerIndex === 0 ? 1 : 0;

    return { valid: true, from, to, nextTurn: this.currentTurn };
  }

  getState() {
    return { moves: this.moves, currentTurn: this.currentTurn };
  }
}