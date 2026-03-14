import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import chatHandlers from './chatHandlers.js';
import gameHandlers from './gameHandlers.js';

const onlineUsers = new Map();

const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    onlineUsers.set(socket.user._id.toString(), socket.id);
    await User.findByIdAndUpdate(socket.user._id, { status: 'online' });
    io.emit('online_users', Array.from(onlineUsers.keys()));

    chatHandlers(io, socket);
    gameHandlers(io, socket);

    socket.on('disconnect', async () => {
      onlineUsers.delete(socket.user._id.toString());
      await User.findByIdAndUpdate(socket.user._id, { status: 'offline' });
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
};

export default initializeSocket;