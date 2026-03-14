const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'system', 'game'], default: 'text' },
  timestamp: { type: Date, default: Date.now },
});

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  code: { type: String, required: true, unique: true, uppercase: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxMembers: { type: Number, default: 8 },
  isPrivate: { type: Boolean, default: false },
  password: { type: String, default: '' },
  messages: [messageSchema],
  currentGame: {
    type: { type: String, enum: ['tictactoe', 'rps', 'wordscramble', 'chess', null], default: null },
    state: { type: mongoose.Schema.Types.Mixed, default: null },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: false },
  },
  status: { type: String, enum: ['waiting', 'playing', 'idle'], default: 'idle' },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
