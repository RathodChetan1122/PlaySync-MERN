import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    type: { type: String, enum: ['tictactoe', 'connect4', 'chess'], required: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isDraw: { type: Boolean, default: false },
    moves: [
      {
        player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        move: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
    boardState: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Game = mongoose.model('Game', gameSchema);
export default Game;