import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ChatWindow from './ChatWindow';
import { useSocket } from '../../context/SocketContext';
import { useCart } from '../../context/CartContext';

const ChatFloating = () => {
  const { conversations, user, isOpen, setIsOpen } = useSocket();
  const { user: cartUser } = useCart();
  const location = useLocation();

  // Don't show for guests or if user logic isn't ready
  if (!cartUser || cartUser === 'guest') return null;

  // Don't show floating chat in seller dashboard
  if (location.pathname.startsWith('/seller')) return null;

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Chat Window Container */}
      {isOpen && (
        <div className="mb-4 animate-in fade-in slide-in-from-bottom-10 duration-300">
          <ChatWindow />
        </div>
      )}

      {/* Lucky Wheel Button - Hidden on Lucky Wheel page */}
      {cartUser?.role === 'user' && location.pathname !== '/lucky-wheel' && (
        <Link 
          to="/lucky-wheel"
          className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(245,158,11,0.4)] transition-all duration-500 transform hover:scale-115 hover:-rotate-12 active:scale-90"
          title="Vòng quay may mắn"
        >
          {/* Pulsing Outer Glow */}
          <div className="absolute inset-0 rounded-full bg-amber-500 opacity-20 animate-ping group-hover:animate-none"></div>
          <div className="absolute inset-0 rounded-full border-2 border-white/30 group-hover:border-white/50 transition-all duration-300"></div>

          <span className="text-3xl group-hover:animate-spin block duration-1000 z-10 filter drop-shadow-md">🎡</span>
          
          {/* Premium Tooltip */}
          <div className="absolute right-full mr-5 px-4 py-2 bg-gray-900/90 backdrop-blur-xl text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap border border-white/20 shadow-2xl translate-x-4 group-hover:translate-x-0">
             Vòng Quay May Mắn
            <div className="absolute top-1/2 -translate-y-1/2 left-full border-[6px] border-transparent border-l-gray-900/90"></div>
          </div>
          
          {/* Notification Glow Dot */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse z-20"></div>
        </Link>
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
