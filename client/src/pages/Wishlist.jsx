import React, { useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import ProductModal from '../components/ProductModal';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import AutoText from '../components/AutoText';
import { useTranslation } from 'react-i18next';

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { userRole } = useCart();
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getFlashSalePrice = (product) => {
    if (!product) return 0;
    let price = product.price;
    if (product.isFlashSale && product.flashSaleEndDate && new Date(product.flashSaleEndDate) > new Date() && product.flashSaleStock > 0) {
      price = product.flashSalePrice || price;
    }
    return price;
  };

  const handleOpenModal = (product) => {
    if (userRole !== 'user') {
      Swal.fire({
        icon: 'warning',
        title: t('login_required'),
        text: t('login_required_msg'),
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] font-sans pb-32 pt-32 md:pt-44 overflow-hidden relative">
      <Navbar />

      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vh] bg-amber-500/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[40vw] h-[40vh] bg-blue-500/5 blur-[100px] rounded-full translate-x-1/3 translate-y-1/3"></div>

      <main className="container mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 animate-fadeIn">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-amber-500/50"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">Private Collection</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase text-gray-900 leading-none">
              Danh Mục <span className="text-amber-500">Yêu Thích</span>
            </h1>
            <p className="text-[11px] font-bold uppercase text-gray-400 tracking-[0.3em] mt-4 leading-relaxed max-w-lg">
              Nơi lưu trữ những kiệt tác thời trang bạn đã chọn lọc cho riêng mình
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl px-10 py-6 rounded-[2rem] border border-gray-100 shadow-xl flex items-center gap-5 group">
            <div className="relative">
              <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-500">🖤</span>
              {wishlist?.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping"></span>}
            </div>
            <div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Hiện có trong ví</div>
              <div className="text-2xl font-black text-gray-900 leading-none italic">
                {wishlist?.length || 0} <span className="text-xs text-amber-500 not-italic uppercase ml-1">Sản phẩm</span>
              </div>
            </div>
          </div>
        </div>

        {!wishlist || wishlist.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm p-24 rounded-[4rem] text-center mx-auto max-w-3xl border border-gray-100 shadow-inner relative overflow-hidden group animate-fadeInUp">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="relative z-10">
              <div className="text-8xl mb-10 grayscale opacity-10 group-hover:opacity-30 transition-all duration-1000 group-hover:scale-110">🖤</div>
              <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight uppercase italic leading-none">Danh sách đang bỏ trống</h2>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-12 max-w-md mx-auto leading-relaxed">Hãy khởi đầu hành trình phong cách của bạn bằng cách chọn những sản phẩm ấn tượng nhất</p>
              <Link to="/" className="inline-block bg-gray-900 text-white font-black tracking-widest uppercase px-14 py-6 rounded-2xl hover:bg-amber-500 hover:text-gray-900 transition-all duration-300 shadow-2xl shadow-gray-200 active:scale-95">
                TRẢI NGHIỆM BỘ SƯU TẬP
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-10 animate-fadeInUp">
            {wishlist.map((product) => (
              <div
                key={product._id}
                className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 hover:border-amber-500/30 transition-all duration-700 flex flex-col h-full hover:shadow-2xl hover:shadow-gray-200/50"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                  <img
                    src={product.images && product.images[0] ? (product.images[0].url.startsWith('http') ? product.images[0].url : `http://localhost:5000${product.images[0].url}`) : `https://picsum.photos/seed/${product._id}/400/500`}
                    alt={product.name}
                    className="w-full h-full object-cover grayscale-[0.2] transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0"
                  />
                  
                  {/* Subtle overlay gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                  {/* Top corner actions */}
                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={() => removeFromWishlist(product._id)}
                      className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg"
                      title="Xóa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {/* Flash Sale Badge */}
                  {product.isFlashSale && new Date(product.flashSaleEndDate) > new Date() && product.flashSaleStock > 0 && (
                    <div className="absolute top-4 left-4 z-20 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-sm shadow-xl tracking-tighter italic">
                      LIMITED SALE -{product.flashSaleDiscount}%
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-1 relative z-10 bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] font-black uppercase text-amber-500/80 tracking-widest border-b border-amber-500/30 pb-0.5">
                      {product.category?.name || 'PRIVATE EDITION'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-amber-500 text-[10px] animate-pulse">★</span>
                      <span className="text-[10px] font-black text-gray-400 italic">4.9</span>
                    </div>
                  </div>

                  <Link
                    to={`/product/${product._id}`}
                    className="text-lg font-black text-gray-900 group-hover:text-amber-500 transition-all duration-500 uppercase tracking-tighter leading-tight line-clamp-2 mb-2 italic"
                  >
                    {product.name}
                  </Link>

                  <p className="text-[10px] text-gray-400 font-medium line-clamp-1 mb-6">
                    {product.description || 'Chế tác tinh xảo từ hệ thống Petrolimex Fashion...'}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex flex-col">
                    <div className="flex items-end gap-3 mb-6">
                      <div className="text-2xl font-black text-gray-900 tracking-tighter italic leading-none">
                        {formatPrice(getFlashSalePrice(product))}
                      </div>
                      {product.isFlashSale && new Date(product.flashSaleEndDate) > new Date() && product.flashSaleStock > 0 && (
                        <div className="text-xs text-gray-300 line-through font-bold mb-0.5">
                          {formatPrice(product.price)}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to={`/product/${product._id}`}
                        className="flex items-center justify-center py-3 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-gray-100 hover:text-gray-900 transition-all duration-300 border border-gray-100"
                      >
                        CHI TIẾT
                      </Link>
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-gray-900 transition-all duration-300 shadow-xl shadow-gray-200"
                      >
                        MUA NGAY
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product Modal Overlay */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />

      {/* Luxury Scrollbar Styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 1.2s ease-out forwards; }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out forwards; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f9f9f9; }
        ::-webkit-scrollbar-thumb { background: #e2e2e2; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}} />
    </div>
  );
}
