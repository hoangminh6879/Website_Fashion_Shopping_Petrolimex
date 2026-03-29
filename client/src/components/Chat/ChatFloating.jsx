import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { useSocket } from '../../context/SocketContext';
import { useCart } from '../../context/CartContext';

const ChatFloating = () => {
  const { conversations, user, isOpen, setIsOpen } = useSocket();
  const { user: cartUser } = useCart();

  // Don't show for guests or if user logic isn't ready
  if (!cartUser || cartUser === 'guest') return null;

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Chat Window Container */}
      {isOpen && (
        <div className="mb-2 transition-all duration-300 transform origin-bottom-right">
          <ChatWindow />
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${
          isOpen 
            ? 'bg-gray-800 rotate-90 text-white' 
            : 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white'
        }`}
      >
        {isOpen ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}

        {!isOpen && totalUnread > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-bounce">
            {totalUnread > 99 ? '99+' : totalUnread}
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatFloating;
