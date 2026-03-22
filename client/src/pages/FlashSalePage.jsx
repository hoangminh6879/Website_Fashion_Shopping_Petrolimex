import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function FlashSalePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const res = await api.get('/products');
        const now = new Date();
        const flashSales = res.data.filter(p => 
          p.isFlashSale && 
          p.flashSaleEndDate && 
          new Date(p.flashSaleEndDate) > now
        );
        setProducts(flashSales);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlashSales();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-3xl p-12 text-center shadow-2xl border border-amber-500/30 mb-12 relative overflow-hidden group">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
           <div className="relative z-10">
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 uppercase mb-4 drop-shadow-2xl">
                 Flash <span className="text-white">Sale</span> ⚡
              </h1>
              <p className="text-amber-500/80 font-black uppercase tracking-[0.5em] text-xs">Cơ hội cuối cùng để sở hữu những ưu đãi độc quyền</p>
           </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
             <div className="inline-block w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 font-black uppercase text-gray-400 text-[10px] tracking-widest">Đang săn tìm deal hời cho bạn...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <div 
                key={product._id} 
                onClick={() => navigate(`/product/${product._id}`)}
                className="bg-white rounded-[2.5rem] p-6 shadow-2xl shadow-gray-200 border border-gray-100 hover:border-amber-500/30 transition-all duration-500 group cursor-pointer relative"
              >
                <div className="absolute top-4 left-4 z-20 bg-amber-500 text-gray-900 font-black px-4 py-1.5 rounded-full text-[10px] uppercase shadow-lg border border-amber-400">
                  -{product.flashSaleDiscount}%
                </div>
                <div className="aspect-[3/4] rounded-[2rem] overflow-hidden relative mb-6 shadow-xl">
                  <img src={product.images?.[0]?.url ? `http://localhost:5000${product.images[0].url}` : `https://picsum.photos/seed/${product._id}/400/500`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                </div>
                <h3 className="font-black text-gray-900 line-clamp-1 uppercase text-xs tracking-tight mb-3 group-hover:text-amber-600 transition-colors">
                  {product.name}
                </h3>
                <div className="flex justify-between items-end">
                   <div>
                     <p className="text-[10px] text-gray-400 line-through decoration-amber-500/50">{formatPrice(product.price)}</p>
                     <p className="text-gray-900 font-black text-lg italic">{formatPrice(product.flashSalePrice)}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-black uppercase text-amber-600 mb-1">Chỉ còn {product.flashSaleStock} SP</p>
                     <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: '60%' }}></div>
                     </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[3rem] shadow-xl border border-gray-100">
             <span className="text-7xl mb-6 block grayscale group-hover:grayscale-0 transition-all">🌙</span>
             <h2 className="text-2xl font-black uppercase italic text-gray-900">Hiện tại không có Flash Sale nào</h2>
             <p className="text-gray-400 text-xs mt-2 uppercase font-bold tracking-widest">Hãy quay lại sau nhé!</p>
          </div>
        )}
      </div>
    </div>
  );
}
