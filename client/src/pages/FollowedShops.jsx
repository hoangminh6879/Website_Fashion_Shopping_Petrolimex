import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';

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
    <div className="min-h-screen bg-[#FBFBFB] font-sans pb-32 pt-32 md:pt-44">
      <Navbar />
      
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto px-4 mb-16 animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-100 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-amber-500 hover:border-amber-500/50 transition-all duration-300 group shadow-sm"
              >
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </button>
              <span className="text-[10px] font-black uppercase text-amber-500/80 tracking-[0.3em] font-mono">My Network</span>
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter text-gray-900 uppercase leading-none">
              Shop <span className="text-amber-500">Đang Theo Dõi</span>
            </h1>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-3">Giữ kết nối với những thương hiệu bạn yêu thích</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl px-8 py-5 rounded-3xl border border-gray-50 flex items-center gap-4 shadow-xl">
            <span className="text-3xl">🏬</span>
            <div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Đang quan tâm</div>
              <div className="text-xl font-black text-gray-900 leading-none italic">{followedShops.length} <span className="text-xs text-amber-500 not-italic uppercase ml-1">Cửa hàng</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-amber-500/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Phân tích hệ thống mạng lưới...</p>
          </div>
        ) : followedShops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeInUp">
            {followedShops.map(shop => (
              <div 
                key={shop._id} 
                className="group relative bg-white rounded-[3rem] p-8 border border-gray-50 hover:border-amber-500/50 transition-all duration-700 hover:shadow-2xl hover:shadow-gray-200/50 overflow-hidden"
              >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-all duration-700"></div>
                
                <div className="flex items-start gap-6 relative z-10">
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-gray-100 group-hover:border-amber-500 transition-all duration-700 shadow-xl">
                      <img 
                        src={getFullUrl(shop.image) || `https://picsum.photos/seed/${shop._id}/200/200`} 
                        alt={shop.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      />
                    </div>
                    {/* Active dot */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-lg"></div>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-gray-900 uppercase text-lg tracking-tighter italic leading-none">{shop.name}</h4>
                        <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">OFFICIAL</span>
                      </div>
                    </div>
                    
                    <p className="text-[12px] text-gray-400 font-medium line-clamp-2 mb-6 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                      {shop.description || 'Thương hiệu cao cấp cam kết mang đến trải nghiệm thời trang Petrolimex Fashion đẳng cấp nhất.'}
                    </p>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => navigate(`/shop/${shop._id}`)}
                        className="flex-[2] bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-amber-500 hover:text-gray-900 transition-all duration-300 shadow-xl active:scale-95"
                      >
                        Vào Cửa Hàng
                      </button>
                      <button 
                        onClick={() => handleUnfollow(shop._id)}
                        className="flex-1 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 active:scale-95 border border-gray-100"
                        title="Bỏ theo dõi"
                      >
                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 rounded-[4rem] border-2 border-dashed border-gray-100 p-24 text-center animate-fadeIn shadow-inner">
             <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
                <span className="text-6xl grayscale opacity-20 relative z-10 transition-transform group-hover:scale-110 duration-500">🏬</span>
             </div>
             <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4 italic">Danh sách theo dõi trống</h3>
             <p className="text-gray-400 text-sm mb-12 max-w-sm mx-auto font-medium uppercase tracking-widest leading-relaxed">Hãy theo dõi các thương hiệu bạn yêu quý để nhận thông báo sớm nhất về bộ sưu tập mới.</p>
             <button 
                onClick={() => navigate('/')} 
                className="bg-gray-900 text-white font-black uppercase text-[12px] tracking-[0.2em] px-12 py-5 rounded-2xl hover:bg-amber-500 hover:text-gray-900 transition-all duration-300 shadow-2xl shadow-gray-200 active:scale-95"
             >
                KHÁM PHÁ NGAY
             </button>
          </div>
        )}
      </div>

      <div className="mt-20 text-center animate-fadeIn">
         <Link to="/" className="inline-flex items-center gap-3 text-gray-400 hover:text-amber-500 font-bold uppercase text-[10px] tracking-[0.3em] transition-all duration-500 group">
            <svg className="w-4 h-4 transform group-hover:-translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            QUAY LẠI TRUNG TÂM MUA SẮM
         </Link>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 1s ease-out forwards; }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out forwards; }
      `}} />
    </div>
  );
}
