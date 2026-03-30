import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useCart } from '../../context/CartContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ChatWindow = ({ fullScreen = false }) => {
  const { 
    conversations, 
    activeChat, 
    setActiveChat, 
    messages, 
    sendMessage, 
    fetchMessages, 
    isTyping,
    fetchConversations
  } = useSocket();
  const { user } = useCart();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectConversation = (otherUser) => {
    setActiveChat(otherUser);
    fetchMessages(otherUser._id);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    sendMessage(activeChat._id, inputText);
    setInputText('');
  };

  if (!user) return null;

  const containerClasses = fullScreen 
    ? "flex h-full w-full bg-white overflow-hidden"
    : "flex h-[500px] w-[800px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300";

  return (
    <div className={containerClasses}>
      {/* Sidebar: Interactions/Conversations */}
      <div className="w-1/3 border-r border-gray-100 bg-gray-50 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-white">
          <h3 className="font-bold text-gray-800 text-lg">Tin nhắn</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Chưa có cuộc hội thoại nào
            </div>
          ) : (
            conversations.map((conv) => {
              const otherUser = conv.userDetails;
              const otherUserId = conv._id;
              
              const isActive = activeChat?._id === otherUserId;

              return (
                <div 
                  key={otherUserId}
                  onClick={() => handleSelectConversation({ ...otherUser, _id: otherUserId })}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-white ${isActive ? 'bg-white border-l-4 border-amber-500 shadow-sm' : ''}`}
                >
                  <div className="relative">
                    <img 
                      src={otherUser.avatar ? `http://localhost:5000${otherUser.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`} 
                      alt={otherUser.name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-semibold text-gray-800 truncate text-sm">{otherUser.name}</h4>
                      {conv.lastMessageTime && (
                        <span className="text-[10px] text-gray-400">
                          {format(new Date(conv.lastMessageTime), 'HH:mm', { locale: vi })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.lastMessage || 'Bắt đầu trò chuyện...'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && !isActive && (
                    <div className="bg-amber-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg animate-pulse">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={activeChat.avatar ? `http://localhost:5000${activeChat.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.name)}&background=random`} 
                  alt={activeChat.name} 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-gray-800 leading-tight">{activeChat.name}</h3>
                  <span className="text-[10px] text-green-500 font-medium">Đang hoạt động</span>
                </div>
              </div>
              <button 
                onClick={() => setActiveChat(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
              {messages.map((msg, idx) => {
                const isMe = msg.sender._id === user._id || msg.sender === user._id;

                // Try to parse product card
                let productCard = null;
                try {
                  const parsed = JSON.parse(msg.message);
                  if (parsed?.type === 'product_card') productCard = parsed;
                } catch (_) {}

                return (
                  <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {productCard ? (
                      <a
                        href={`/product/${productCard.productId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`max-w-[70%] rounded-2xl shadow-sm overflow-hidden border text-sm flex flex-col ${isMe ? 'border-amber-200 rounded-br-none' : 'border-gray-200 rounded-bl-none'}`}
                      >
                        {productCard.image && (
                          <img
                            src={`http://localhost:5000${productCard.image}`}
                            alt={productCard.name}
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <div className={`px-3 py-2 ${isMe ? 'bg-amber-50' : 'bg-white'}`}>
                          <p className="font-semibold text-gray-800 text-xs leading-tight line-clamp-2">{productCard.name}</p>
                          <p className="text-amber-600 font-bold text-xs mt-1">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(productCard.price || 0)}
                          </p>
                          <p className="text-[10px] text-amber-500 mt-1">Xem sản phẩm →</p>
                        </div>
                        <div className={`text-[9px] px-3 pb-2 ${isMe ? 'text-amber-400 bg-amber-50' : 'text-gray-400 bg-white'}`}>
                          {format(new Date(msg.createdAt), 'HH:mm', { locale: vi })}
                        </div>
                      </a>
                    ) : (
                      <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-sm ${
                        isMe 
                          ? 'bg-amber-500 text-white rounded-br-none' 
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                      }`}>
                        <p>{msg.message}</p>
                        <div className={`text-[9px] mt-1 ${isMe ? 'text-amber-100' : 'text-gray-400'}`}>
                          {format(new Date(msg.createdAt), 'HH:mm', { locale: vi })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 px-4 py-2 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex items-center gap-3">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 transition-all outline-none"
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed p-2.5 rounded-xl text-white shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/30">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Chào mừng bạn đến với Chat!</h3>
            <p className="text-gray-500 max-w-xs mt-2 text-sm leading-relaxed">
              Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu trò chuyện với shop.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
