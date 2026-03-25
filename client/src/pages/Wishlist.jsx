import React, { useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import ProductModal from '../components/ProductModal';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { userRole } = useCart();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const handleOpenModal = (product) => {
    if (userRole !== 'user') {
      Swal.fire({
        icon: 'warning',
        title: 'Yêu cầu đăng nhập',
        text: 'Vui lòng đăng nhập với tài khoản Khách hàng để mua sắm.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] font-sans pb-20">
      <Navbar />

      <main className="container mx-auto px-4 py-12 mt-44">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
           <div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase text-gray-900">Danh Mục <span className="text-amber-500">Yêu Thích</span></h1>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mt-2">Nơi lưu giữ những niềm đam mê thời trang của bạn</p>
           </div>
           <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-500">
              Tổng số: <span className="text-amber-600 ml-1">{wishlist?.length || 0}</span> Sản phẩm
           </div>
        </div>

        {!wishlist || wishlist.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] shadow-2xl shadow-gray-200/50 text-center mx-auto max-w-2xl border border-gray-100 animate-fadeIn">
            <div className="text-8xl mb-8 opacity-20 grayscale">🖤</div>
            <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight uppercase italic">Chưa có sản phẩm yêu thích</h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-10">Hãy duyệt qua bộ sưu tập của chúng tôi để tìm thấy phong cách riêng của bạn</p>
            <Link to="/" className="inline-block bg-gray-900 text-white font-black tracking-widest uppercase px-12 py-5 rounded-3xl hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl">
               KHÁM PHÁ CỬA HÀNG
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {wishlist.map((product) => (
              <div 
                key={product._id} 
                className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100 relative group hover:shadow-2xl hover:shadow-gray-200 transition-all duration-500 flex flex-col h-full"
              >
                {/* Image */}
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                  <img 
                    src={product.images && product.images.length > 0 ? `http://localhost:5000${product.images[0].url}` : `https://picsum.photos/seed/${product._id}/400/500`} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  
                  {/* Overlay buttons */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center pointer-events-none">
                     <div className="pointer-events-auto flex gap-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                         <button 
                           onClick={() => removeFromWishlist(product._id)}
                           className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-500 shadow-xl hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                           title="Xóa khỏi yêu thích"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                         </button>
                     </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{product.category?.name || 'Fashion'}</span>
                     <div className="flex gap-0.5">
                        <span className="text-amber-400 text-[10px]">★</span>
                        <span className="text-[9px] font-bold text-gray-400">4.9</span>
                     </div>
                  </div>
                  
                  <Link to={`/product/${product._id}`} className="text-[13px] font-black text-gray-900 group-hover:text-amber-500 transition-colors uppercase tracking-tight line-clamp-2 mb-1 h-8 overflow-hidden">
                    {product.name}
                  </Link>
                  
                  <p className="text-[9px] text-gray-400 font-medium line-clamp-1 mb-3 h-3 overflow-hidden">
                    {product.description || 'Sản phẩm cao cấp'}
                  </p>

                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                     <div className="text-lg font-black text-gray-900 tracking-tighter italic">
                        {formatPrice(product.price)}
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                     <Link 
                       to={`/product/${product._id}`}
                       className="flex-1 text-center py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                     >
                        CHI TIẾT
                     </Link>
                     <button 
                       onClick={() => handleOpenModal(product)}
                       className="flex-[1.5] py-2.5 bg-gray-900 text-amber-500 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl shadow-gray-200"
                     >
                        MUA NGAY 🛒
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product Modal */}
      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
      `}} />
    </div>
  );
}
