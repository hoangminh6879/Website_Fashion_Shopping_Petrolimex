import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function FollowedShops() {
  const [followedShops, setFollowedShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFollowedShops();
  }, []);

  const fetchFollowedShops = async () => {
    try {
      setLoading(true);
      const res = await api.get('/flows/my-followed');
      setFollowedShops(res.data);
    } catch (err) {
      console.error("Error fetching followed shops:", err);
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (shopId) => {
    const result = await Swal.fire({
      title: 'Bỏ theo dõi?',
      text: "Bạn sẽ không nhận được thông báo mới từ shop này nữa.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await api.post('/flows/toggle', { shopId });
        setFollowedShops(prev => prev.filter(s => s._id !== shopId));
        Swal.fire('Thành công', 'Đã bỏ theo dõi shop', 'success');
      } catch (err) {
        console.error("Error unfollowing:", err);
      }
    }
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 pt-32 md:pt-44">
      {/* HEADER BAR */}
      <div className="bg-white border-b border-gray-100 sticky top-36 md:top-44 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-amber-500 transition font-black uppercase text-[10px] tracking-widest">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            QUAY LẠI
          </button>
          <div className="text-xl font-black italic tracking-tighter text-gray-900">
            SHOP <span className="text-amber-500">ĐANG THEO DÕI</span>
          </div>
          <div className="w-24"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Đang tải danh sách...</p>
          </div>
        ) : followedShops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {followedShops.map(shop => (
              <div 
                key={shop._id} 
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/30 flex items-center gap-5 group hover:border-amber-500 transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-50 flex-shrink-0 shadow-inner">
                  <img 
                    src={getFullUrl(shop.image) || `https://picsum.photos/seed/${shop._id}/150/150`} 
                    alt={shop.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-gray-900 truncate uppercase text-sm tracking-tight">{shop.name}</h4>
                    <span className="bg-[#d0011b] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm">MALL</span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{shop.description || 'Hệ thống Mall Petrolimex Fashion tự hào cung cấp sản phẩm chất lượng.'}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/shop/${shop._id}`)}
                      className="flex-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-xl hover:bg-amber-500 hover:text-gray-900 transition-all shadow-lg active:scale-95"
                    >
                      Ghé Ngay
                    </button>
                    <button 
                      onClick={() => handleUnfollow(shop._id)}
                      className="px-4 py-2 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95"
                    >
                      Bỏ Theo Dõi
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-20 rounded-[40px] border border-dashed border-gray-200 text-center shadow-inner">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl grayscale opacity-20">🛒</span>
             </div>
             <h3 className="text-xl font-black text-gray-900 mb-2">Bạn chưa theo dõi shop nào</h3>
             <p className="text-gray-400 text-sm mb-8">Theo dõi shop để cập nhật những ưu đãi và sản phẩm mới nhất!</p>
             <button 
                onClick={() => navigate('/')} 
                className="bg-amber-500 text-gray-900 font-black uppercase text-[11px] tracking-[0.2em] px-10 py-4 rounded-2xl hover:bg-amber-600 transition shadow-xl shadow-amber-500/20 active:scale-95"
             >
                KHÁM PHÁ NGAY
             </button>
          </div>
        )}
      </div>

      <div className="mt-10 text-center">
         <Link to="/" className="text-gray-400 hover:text-amber-500 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition group">
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            QUAY LẠI TRANG CHỦ MUA SẮM
         </Link>
      </div>
    </div>
  );
}
