import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useCart } from './CartContext';
import api from '../services/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, isInitialized } = useCart();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Global toggle for ChatFloating

  // Initialize socket
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (isInitialized && user && userId) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.emit('setup', { ...user, _id: userId });
      newSocket.on('connected', () => console.log('Socket connected'));

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isInitialized, user]);

  // Fetch initial conversations
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (user && userId) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (otherUserId) => {
    if (!otherUserId) return;
    try {
      const res = await api.get(`/chat/${otherUserId}`);
      setMessages(res.data);
      // Mark as read
      await api.put(`/chat/read/${otherUserId}`);
      // Refresh conversations list to update unread count
      fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const openChatWithUser = async (otherUserOrId, productInfo = null) => {
    if (!otherUserOrId) return;
    
    let receiverId;
    if (typeof otherUserOrId === 'string') {
      receiverId = otherUserOrId;
      try {
        const res = await api.get(`/users/profile/${otherUserOrId}`);
        setActiveChat(res.data);
      } catch (err) {
        // ignore, still open chat
      }
    } else {
      receiverId = otherUserOrId._id;
      setActiveChat(otherUserOrId);
    }

    await fetchMessages(receiverId);
    setIsOpen(true);

    // Send product card as a message right away
    if (productInfo) {
      const senderId = user?._id || user?.id;
      const productMessage = JSON.stringify({
        type: 'product_card',
        productId: productInfo._id,
        name: productInfo.name,
        price: productInfo.price,
        image: productInfo.images?.[0]?.url || null,
      });
      socket?.emit('new message', {
        sender: senderId,
        receiver: receiverId,
        message: productMessage,
      });
    }
  };

  const sendMessage = (receiverId, message, shopId = null) => {
    if (socket && user) {
      const senderId = user._id || user.id;
      const messageData = {
        sender: senderId,
        receiver: receiverId,
        message,
        shopId
      };
      socket.emit('new message', messageData);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('message received', (newMessage) => {
      if (activeChat && (newMessage.sender._id === activeChat._id || newMessage.sender === activeChat._id)) {
        setMessages((prev) => [...prev, newMessage]);
        // Mark as read if we are in the chat
        api.put(`/chat/read/${newMessage.sender._id || newMessage.sender}`);
      } else {
        // Update unread count in conversations
        fetchConversations();
      }
    });

    socket.on('message sent', (newMessage) => {
       // Sync across tabs/devices or just update UI
       if (activeChat && (newMessage.receiver._id === activeChat._id || newMessage.receiver === activeChat._id)) {
         setMessages((prev) => [...prev, newMessage]);
       }
       fetchConversations();
    });

    socket.on('typing', () => setIsTyping(true));
    socket.on('stop typing', () => setIsTyping(false));

    return () => {
      socket.off('message received');
      socket.off('message sent');
      socket.off('typing');
      socket.off('stop typing');
    };
  }, [socket, activeChat]);

  return (
    <SocketContext.Provider value={{
      socket,
      conversations,
      activeChat,
      setActiveChat,
      messages,
      setMessages,
      sendMessage,
      fetchMessages,
      isTyping,
      fetchConversations,
      isOpen,
      setIsOpen,
      openChatWithUser
    }}>
      {children}
    </SocketContext.Provider>
  );
};
