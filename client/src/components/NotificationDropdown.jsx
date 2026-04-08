import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { enUS } from "date-fns/locale/en-US";
import { useTranslation } from "react-i18next";
import AutoText from './AutoText';

export default function NotificationDropdown({ onClose }) {
  const { notifications, markAllRead } = useNotifications();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();

  const getDateLocale = () => (i18n.language === 'vi' ? vi : enUS);

  const typeIcons = {
    order: '📦',
    shop: '🏪',
    promotion: '🔥',
    system: '⚙️',
    social: '📸'
  };

  const typeColors = {
    order: 'bg-blue-50 border-blue-200 text-blue-700',
    shop: 'bg-green-50 border-green-200 text-green-700',
    promotion: 'bg-red-50 border-red-200 text-red-700',
    system: 'bg-gray-50 border-gray-200 text-gray-700',
    social: 'bg-amber-50 border-amber-200 text-amber-700'
  };

  const handleClick = (n) => {
    if (n.link) {
      navigate(n.link);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-[fadeInUp_0.2s_ease-out]">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
          <span>🔔</span> <AutoText text="Thông báo" />
        </h3>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            markAllRead();
          }}
          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 uppercase tracking-widest transition-colors"
        >
          <AutoText text="Đọc tất cả" />
        </button>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n._id} 
              onClick={() => handleClick(n)}
              className={`p-4 border-b border-gray-50 last:border-0 transition-all cursor-pointer hover:bg-amber-50/30 flex gap-3 ${!n.isRead ? 'bg-amber-50/50' : 'bg-white'}`}
            >
              {/* Icon */}
              <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-lg border ${typeColors[n.type] || typeColors.system}`}>
                {typeIcons[n.type] || '🔔'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className={`text-[11px] font-black uppercase tracking-tight text-gray-900 truncate pr-2 ${!n.isRead ? 'text-amber-900' : 'text-gray-700'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[9px] text-gray-400 font-bold flex-shrink-0">
                    {format(new Date(n.createdAt), 'HH:mm dd/MM', { locale: getDateLocale() })}
                  </span>
                </div>
                <p className={`text-[11px] leading-tight line-clamp-2 ${!n.isRead ? 'text-amber-800 font-medium' : 'text-gray-500'}`}>
                  {n.message}
                </p>
                <div className="mt-2 flex items-center justify-between">
                   <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${typeColors[n.type] || typeColors.system}`}>
                    {n.type === 'order' ? 'Đơn hàng' : n.type === 'shop' ? 'Cửa hàng' : n.type === 'promotion' ? 'Khuyến mãi' : n.type === 'social' ? 'Xã hội' : 'Hệ thống'}
                  </span>
                  {!n.isRead && (
                    <span className="h-1.5 w-1.5 bg-amber-500 rounded-full"></span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 px-6">
            <span className="text-3xl block mb-2 opacity-50">📭</span>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]"><AutoText text="Không có thông báo nào" /></p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div 
        onClick={() => {
          navigate('/notifications');
          onClose();
        }}
        className="p-3 bg-gray-50 border-t border-gray-100 text-center cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 block">
          <AutoText text="Xem tất cả thông báo" />
        </span>
      </div>
    </div>
  );
}
