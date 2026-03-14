export class TicTacToe {
  constructor() {
    this.board = Array(9).fill(null);
    this.currentTurn = 0;
  }

  makeMove(index, playerIndex) {
    if (this.board[index] !== null) return { valid: false, reason: 'Cell already taken' };
    if (this.currentTurn !== playerIndex) return { valid: false, reason: 'Not your turn' };

    this.board[index] = playerIndex === 0 ? 'X' : 'O';
    this.currentTurn = playerIndex === 0 ? 1 : 0;

    const winner = this.checkWinner();
    const isDraw = !winner && this.board.every((cell) => cell !== null);

    return { valid: true, board: this.board, winner, isDraw, nextTurn: this.currentTurn };
  }

  checkWinner() {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6],
    ];
    for (const [a, b, c] of lines) {
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return this.board[a];
      }
    }
    return null;
  }

  getState() {
    return { board: this.board, currentTurn: this.currentTurn };
  }
}