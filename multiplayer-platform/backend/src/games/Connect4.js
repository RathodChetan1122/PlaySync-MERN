export class Connect4 {
  constructor() {
    this.rows = 6;
    this.cols = 7;
    this.board = Array(6).fill(null).map(() => Array(7).fill(null));
    this.currentTurn = 0;
  }

  makeMove(col, playerIndex) {
    if (this.currentTurn !== playerIndex) return { valid: false, reason: 'Not your turn' };

    let row = -1;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (!this.board[r][col]) { row = r; break; }
    }

    if (row === -1) return { valid: false, reason: 'Column is full' };

    this.board[row][col] = playerIndex === 0 ? 'R' : 'Y';
    this.currentTurn = playerIndex === 0 ? 1 : 0;

    const winner = this.checkWinner();
    const isDraw = !winner && this.board[0].every((cell) => cell !== null);

    return { valid: true, board: this.board, winner, isDraw, nextTurn: this.currentTurn };
  }

  checkWinner() {
    const b = this.board;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = b[r][c];
        if (!cell) continue;
        if (c + 3 < this.cols && cell === b[r][c+1] && cell === b[r][c+2] && cell === b[r][c+3]) return cell;
        if (r + 3 < this.rows && cell === b[r+1][c] && cell === b[r+2][c] && cell === b[r+3][c]) return cell;
        if (r + 3 < this.rows && c + 3 < this.cols && cell === b[r+1][c+1] && cell === b[r+2][c+2] && cell === b[r+3][c+3]) return cell;
        if (r + 3 < this.rows && c - 3 >= 0 && cell === b[r+1][c-1] && cell === b[r+2][c-2] && cell === b[r+3][c-3]) return cell;
      }
    }
    return null;
  }

  getState() {
    return { board: this.board, currentTurn: this.currentTurn };
  }
}