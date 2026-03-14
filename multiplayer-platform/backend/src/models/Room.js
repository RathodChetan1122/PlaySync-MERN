import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['public', 'private', 'game'], default: 'public' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    activeGame: { type: String, enum: ['tictactoe', 'connect4', 'chess', null], default: null },
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;