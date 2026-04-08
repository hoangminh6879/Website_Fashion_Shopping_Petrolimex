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

  const buttonClass = "group relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(245,158,11,0.4)] transition-all duration-500 transform hover:scale-110 hover:-rotate-6 active:scale-90 z-10";
  // Sử dụng viền sáng và animate-pulse thay vì animate-ping để không bị phóng to đè lên nhau và tạo sự đồng bộ mượt mà
  const glowClass = "absolute -inset-1 rounded-full border border-amber-400 shadow-[0_0_15px_5px_rgba(245,158,11,0.5)] animate-pulse opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none";
  const borderClass = "absolute inset-0 rounded-full border-2 border-white/30 group-hover:border-white/50 transition-all duration-300 pointer-events-none";
  const tooltipClass = "absolute right-full mr-5 px-4 py-2 bg-gray-900/90 backdrop-blur-xl text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap border border-white/20 shadow-2xl translate-x-4 group-hover:translate-x-0";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-5">
      {/* Chat Window Container */}
      {isOpen && (
        <div className="mb-2 animate-in fade-in slide-in-from-bottom-10 duration-300">
          <ChatWindow />
        </div>
      )}

      {/* Fashion Battle Button */}
      {cartUser?.role === 'user' && location.pathname !== '/fashion-battle' && (
        <Link 
          to="/fashion-battle"
          className={buttonClass}
          title="Fashion Battle"
        >
          <div className={glowClass}></div>
          <div className={borderClass}></div>
          <span className="text-3xl block duration-1000 z-10 filter drop-shadow-md group-hover:scale-110">⚔️</span>
          
          <div className={tooltipClass}>
             Fashion Battle
            <div className="absolute top-1/2 -translate-y-1/2 left-full border-[6px] border-transparent border-l-gray-900/90"></div>
          </div>
        </Link>
      )}

      {/* Lucky Wheel Button */}
      {cartUser?.role === 'user' && location.pathname !== '/lucky-wheel' && (
        <Link 
          to="/lucky-wheel"
          className={buttonClass}
          title="Vòng quay may mắn"
        >
          <div className={glowClass}></div>
          <div className={borderClass}></div>
          <span className="text-3xl group-hover:animate-spin block duration-1000 z-10 filter drop-shadow-md">🎡</span>
          
          <div className={tooltipClass}>
             Vòng Quay May Mắn
            <div className="absolute top-1/2 -translate-y-1/2 left-full border-[6px] border-transparent border-l-gray-900/90"></div>
          </div>
          
          <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-bounce z-20"></div>
        </Link>
      )}

      {/* Chat Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${buttonClass} ${isOpen ? 'bg-gray-800 from-gray-700 via-gray-800 to-gray-900 rotate-90 shadow-[0_8px_20px_rgba(31,41,55,0.4)]' : ''}`}
      >
        <div className={`${glowClass} ${isOpen ? 'opacity-0' : ''}`}></div>
        <div className={borderClass}></div>
        
        <span className="z-10 block filter drop-shadow-md">
          {isOpen ? (
            <svg className="w-8 h-8 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-8 h-8 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </span>

        {!isOpen && (
          <div className={tooltipClass}>
             Trò chuyện với cửa hàng
            <div className="absolute top-1/2 -translate-y-1/2 left-full border-[6px] border-transparent border-l-gray-900/90"></div>
          </div>
        )}

        {!isOpen && totalUnread > 0 && (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-bounce z-20">
            {totalUnread > 99 ? '99+' : totalUnread}
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatFloating;
