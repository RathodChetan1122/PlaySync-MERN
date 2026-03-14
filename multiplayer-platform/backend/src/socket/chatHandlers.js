import Message from '../models/Message.js';

const chatHandlers = (io, socket) => {
  socket.on('join_room', ({ roomId }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user_joined', {
      userId: socket.user._id,
      username: socket.user.username,
    });
  });

  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user_left', {
      userId: socket.user._id,
      username: socket.user.username,
    });
  });

  socket.on('send_message', async ({ roomId, content }) => {
    try {
      const message = await Message.create({
        room: roomId,
        sender: socket.user._id,
        content,
      });

      const populated = await message.populate('sender', 'username avatar');
      io.to(roomId).emit('receive_message', populated);
    } catch (err) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing_start', ({ roomId }) => {
    socket.to(roomId).emit('user_typing', { username: socket.user.username });
  });

  socket.on('typing_stop', ({ roomId }) => {
    socket.to(roomId).emit('user_stop_typing', { username: socket.user.username });
  });
};

export default chatHandlers;