import { Server } from 'socket.io';
import ChatMessage from '../models/ChatMessage.model.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Change to specific URL in production
      methods: ["GET", "POST"]
    }
  });

  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('setup', (user) => {
      if (user && user._id) {
        socket.join(user._id);
        onlineUsers.set(user._id, socket.id);
        console.log(`User ${user._id} setup and joined room`);
        socket.emit('connected');
      }
    });

    socket.on('join chat', (room) => {
      socket.join(room);
      console.log('User joined room:', room);
    });

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

    socket.on('new message', async (data) => {
      const { sender, receiver, message, shopId } = data;
      
      try {
        // Save to DB
        const newMessage = await ChatMessage.create({
          sender,
          receiver,
          message,
          shopId,
          read: false
        });

        const populatedMessage = await ChatMessage.findById(newMessage._id)
          .populate('sender', 'name avatar')
          .populate('receiver', 'name avatar');

        // Emit to receiver
        socket.in(receiver).emit('message received', populatedMessage);
        
        // Also emit back to sender (for multi-device sync)
        socket.emit('message sent', populatedMessage);
      } catch (error) {
        console.error('Error handling new message:', error);
      }
    });

    socket.on('disconnect', () => {
      // Find and remove from onlineUsers
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      console.log('User disconnected');
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
