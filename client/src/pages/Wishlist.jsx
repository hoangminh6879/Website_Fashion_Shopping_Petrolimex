import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Wishlist() {
  const { wishlist = [], toggleWishlist, loading } = useWishlist() || {};
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="flex items-center justify-between mb-8">
           <div className="flex flex-col">
             <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 uppercase leading-none">
                Sản Phẩm <span className="text-red-500">Yêu Thích</span> ❤️
             </h1>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2">Nơi lưu giữ những món đồ bạn muốn sở hữu</p>
           </div>
        </div>

        {loading ? (
          <div className="py-20 text-center font-black uppercase text-gray-400 tracking-widest animate-pulse">
             Đang tải danh sách...
          </div>
        ) : wishlist.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {wishlist.map(product => (
              <div 
                key={product._id} 
                onClick={() => navigate(`/product/${product._id}`)}
                className="group bg-white rounded-2xl shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-red-100 transition-all duration-500 flex flex-col h-full cursor-pointer relative top-0 hover:-top-2 border border-gray-100"
              >
                <div className="w-full aspect-[3/4] rounded-t-2xl overflow-hidden relative">
                  <img 
                    src={product.images?.[0]?.url ? `http://localhost:5000${product.images[0].url}` : `https://picsum.photos/seed/${product._id}/400/500`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt="" 
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(product._id); }}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-red-500 shadow-md hover:scale-110 active:scale-95 transition-all"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  </button>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-xs font-black text-gray-900 line-clamp-2 uppercase tracking-tight mb-3 group-hover:text-red-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="mt-auto">
                    <div className="text-red-600 font-black text-sm italic">{formatPrice(product.price)}</div>
                    <button className="w-full mt-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-gray-900 transition-all shadow-lg active:scale-95">
                      Xem Chi Tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-32 text-center shadow-2xl shadow-gray-200 border border-gray-100 mt-10">
            <div className="text-8xl mb-10 opacity-20">💔</div>
            <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter mb-4">Danh sách trống</h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest max-w-xs mx-auto mb-10">Hãy tìm những sản phẩm tuyệt vời và nhấn nút ❤️ để lưu lại tại đây nhé!</p>
            <button 
              onClick={() => navigate('/')}
              className="px-12 py-5 bg-gradient-to-r from-gray-900 to-black text-amber-500 rounded-3xl font-black uppercase tracking-[0.2em] hover:from-amber-500 hover:to-amber-500 hover:text-gray-900 transition-all shadow-2xl shadow-gray-200 active:scale-95"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
