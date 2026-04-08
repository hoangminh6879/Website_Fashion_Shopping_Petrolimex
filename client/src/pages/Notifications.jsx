import React from 'react';
import Navbar from '../components/Navbar';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { enUS } from "date-fns/locale/en-US";
import i18n from '../i18n';
import AutoText from '../components/AutoText';

export default function Notifications() {
  const { notifications, markAllRead } = useNotifications();
  const { t } = useTranslation();
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
    } else if (n.type === 'order') {
      navigate('/order-history');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-10">
      <Navbar />
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900">
            {t('notifications')}
          </h1>
          <button
            onClick={markAllRead}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-widest"
          >
            <AutoText text="Đánh dấu tất cả là đã đọc" />
          </button>
        </div>

        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-lg hover:scale-[1.01] ${n.isRead ? 'bg-white border-gray-100 shadow-sm' : 'bg-amber-50 border-amber-200 shadow-md'}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-lg border ${typeColors[n.type] || typeColors.system}`}>
                    {typeIcons[n.type] || '🔔'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-black uppercase tracking-tight text-sm ${n.isRead ? 'text-gray-700' : 'text-amber-900'}`}>
                        {n.title}
                      </h3>
                      <span className="text-[10px] text-gray-400 font-bold flex-shrink-0 ml-3">
                        {format(new Date(n.createdAt), 'HH:mm - dd/MM/yyyy', { locale: getDateLocale() })}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${n.isRead ? 'text-gray-500' : 'text-amber-800 font-medium'}`}>
                      {n.message}
                    </p>

                    {/* Type Badge + Link */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${typeColors[n.type] || typeColors.system}`}>
                        {n.type === 'order' ? 'Đơn hàng' : n.type === 'shop' ? 'Cửa hàng' : n.type === 'promotion' ? 'Khuyến mãi' : n.type === 'social' ? 'Xã hội' : 'Hệ thống'}
                      </span>
                      <div className="flex items-center gap-2">
                        {(n.link || n.type === 'order') && (
                          <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest transition-all group-hover:translate-x-1">
                            <AutoText text="Xem chi tiết →" />
                          </span>
                        )}
                        {!n.isRead && (
                          <span className="h-1.5 w-1.5 bg-amber-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <span className="text-4xl block mb-4">📭</span>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs"><AutoText text="Không có thông báo nào" /></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
