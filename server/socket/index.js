const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const { handleTicTacToe } = require('./games/tictactoe');
const { handleRPS } = require('./games/rps');
const { handleWordScramble } = require('./games/wordscramble');
const { handleChess } = require('./games/chess');

const connectedUsers = new Map(); // socketId -> { userId, username, roomId }

module.exports = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'playsync_secret');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const { user } = socket;
    console.log(`⚡ ${user.username} connected [${socket.id}]`);

    connectedUsers.set(socket.id, { userId: user._id.toString(), username: user.username, roomId: null });

    // Update user status
    await User.findByIdAndUpdate(user._id, { status: 'online' });
    io.emit('user:statusChange', { userId: user._id, status: 'online' });

    // ─── ROOM EVENTS ───────────────────────────────────────────
    socket.on('room:join', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode }).populate('members host', 'username avatar status');
        if (!room) return socket.emit('error', { message: 'Room not found' });

        socket.join(roomCode);
        const userData = connectedUsers.get(socket.id);
        if (userData) userData.roomId = roomCode;

        socket.to(roomCode).emit('room:userJoined', {
          user: { _id: user._id, username: user.username, avatar: user.avatar },
        });

        // System message
        const sysMsg = { sender: null, senderName: 'System', content: `${user.username} joined the room`, type: 'system', timestamp: new Date() };
        io.to(roomCode).emit('chat:message', sysMsg);

        socket.emit('room:joined', { room });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('room:leave', async ({ roomCode }) => {
      socket.leave(roomCode);
      const userData = connectedUsers.get(socket.id);
      if (userData) userData.roomId = null;

      socket.to(roomCode).emit('room:userLeft', { userId: user._id, username: user.username });
      const sysMsg = { sender: null, senderName: 'System', content: `${user.username} left the room`, type: 'system', timestamp: new Date() };
      io.to(roomCode).emit('chat:message', sysMsg);
    });

    // ─── CHAT EVENTS ───────────────────────────────────────────
    socket.on('chat:send', async ({ roomCode, content }) => {
      if (!content || !content.trim()) return;

      const message = {
        sender: user._id,
        senderName: user.username,
        content: content.trim(),
        type: 'text',
        timestamp: new Date(),
      };

      try {
        await Room.findOneAndUpdate(
          { code: roomCode },
          { $push: { messages: message } }
        );
        io.to(roomCode).emit('chat:message', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('chat:typing', ({ roomCode, isTyping }) => {
      socket.to(roomCode).emit('chat:typing', { userId: user._id, username: user.username, isTyping });
    });

    // ─── GAME EVENTS ───────────────────────────────────────────
    socket.on('game:start', async ({ roomCode, gameType }) => {
      try {
        const room = await Room.findOne({ code: roomCode });
        if (!room) return socket.emit('error', { message: 'Room not found' });
        if (room.host.toString() !== user._id.toString()) {
          return socket.emit('error', { message: 'Only the host can start a game' });
        }

        room.currentGame = { type: gameType, state: null, players: room.members, isActive: true };
        room.status = 'playing';
        await room.save();

        io.to(roomCode).emit('game:started', { gameType });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('game:move', async (data) => {
      const { roomCode, gameType, move } = data;
      switch (gameType) {
        case 'tictactoe': await handleTicTacToe(io, socket, roomCode, move, user); break;
        case 'rps': await handleRPS(io, socket, roomCode, move, user); break;
        case 'wordscramble': await handleWordScramble(io, socket, roomCode, move, user); break;
        case 'chess': await handleChess(io, socket, roomCode, move, user); break;
      }
    });

    socket.on('game:end', async ({ roomCode }) => {
      try {
        await Room.findOneAndUpdate({ code: roomCode }, {
          'currentGame.isActive': false,
          'currentGame.type': null,
          status: 'idle',
        });
        io.to(roomCode).emit('game:ended', {});
      } catch (err) { }
    });

    // ─── DISCONNECT ────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`💤 ${user.username} disconnected`);
      const userData = connectedUsers.get(socket.id);
      if (userData?.roomId) {
        socket.to(userData.roomId).emit('room:userLeft', { userId: user._id, username: user.username });
      }
      connectedUsers.delete(socket.id);
      await User.findByIdAndUpdate(user._id, { status: 'offline' });
      io.emit('user:statusChange', { userId: user._id, status: 'offline' });
    });
  });
};
