import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import ProductModal from '../components/ProductModal';

export default function ShopDetail() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addToCart, userRole } = useCart();

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const [shopRes, prodRes] = await Promise.all([
          api.get(`/shops/${id}`),
          api.get(`/products?shopId=${id}`)
        ]);
        setShop(shopRes.data);
        setProducts(prodRes.data);

        // Check follow status if logged in
        const token = localStorage.getItem('token');
        if (token) {
          const statusRes = await api.get(`/flows/status/${id}`);
          setFollowed(statusRes.data.followed);
        }
      } catch (err) {
        console.error("Error fetching shop details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShopData();
  }, [id]);

  const handleToggleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Vui lòng đăng nhập để theo dõi shop!");
        return;
      }
      const res = await api.post('/flows/toggle', { shopId: id });
      setFollowed(res.data.followed);
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy shop</h2>
        <Link to="/" className="text-amber-600 font-bold hover:underline">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      {/* SHOP HEADER (Premium Look) */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-amber-900/50 pt-10 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
            <div className="w-32 h-32 rounded-full border-4 border-amber-500 overflow-hidden shadow-amber-500/20 shadow-2xl bg-white flex-shrink-0">
              <img src={shop.image ? `http://localhost:5000${shop.image}` : `https://picsum.photos/seed/${shop._id}/200/200`} alt={shop.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight italic mb-2">
                {shop.name}
                <span className="ml-3 inline-block bg-[#d0011b] text-white text-[10px] font-black not-italic px-2 py-0.5 rounded-sm align-middle">MALL</span>
              </h1>
              <p className="text-gray-300 text-sm max-w-2xl leading-relaxed font-medium">
                {shop.description || 'Chưa có mô tả cho cửa hàng này. Petrolimex Fashion Mall tự hào cung cấp các sản phẩm chất lượng cao đến tay người tiêu dùng.'}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-6">
                <div className="flex items-center gap-2">
                   <span className="text-amber-500 font-black">4.9</span>
                   <div className="flex text-yellow-400 text-xs">★★★★★</div>
                   <span className="text-gray-400 text-xs uppercase font-bold tracking-widest">(Đánh giá)</span>
                </div>
                <div className="h-4 w-[1px] bg-gray-700 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                   <span className="text-white font-black">{products.length}</span>
                   <span className="text-gray-400 text-xs uppercase font-bold tracking-widest">Sản phẩm</span>
                </div>
                <div className="h-4 w-[1px] bg-gray-700 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                   <span className="text-white font-black">98%</span>
                   <span className="text-gray-400 text-xs uppercase font-bold tracking-widest">Phản hồi Chat</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
               <button 
                onClick={handleToggleFollow}
                className={`${followed ? 'bg-white/20 text-white border-white/20' : 'bg-amber-500 text-gray-900 border-amber-500'} hover:opacity-90 font-black px-8 py-3 rounded-xl transition-all shadow-xl shadow-amber-500/10 uppercase tracking-widest text-[10px] border`}
               >
                 {followed ? 'Đang Theo Dõi' : '+ Theo Dõi'}
               </button>
               <button className="bg-white/10 hover:bg-white/20 text-white font-black px-8 py-3 rounded-xl transition-all backdrop-blur border border-white/10 uppercase tracking-widest text-[10px]">
                 Chat Ngay
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS NAV */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm mb-8">
         <div className="container mx-auto px-4 flex">
            <button className="px-8 py-4 text-amber-600 font-black uppercase tracking-widest text-[11px] border-b-2 border-amber-600">Tất Cả Sản Phẩm</button>
            <button className="px-8 py-4 text-gray-500 font-black uppercase tracking-widest text-[11px] hover:text-gray-900 transition">Sản Phẩm Mới</button>
            <button className="px-8 py-4 text-gray-500 font-black uppercase tracking-widest text-[11px] hover:text-gray-900 transition">Bán Chạy</button>
         </div>
      </div>

      {/* PRODUCT GRID */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <div 
              key={product._id} 
              className="bg-white rounded-xl border border-gray-100 hover:border-amber-400 hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col relative cursor-pointer"
              onClick={() => {
                setSelectedProduct(product);
                setIsModalOpen(true);
              }}
            >
              <div className="aspect-square relative overflow-hidden bg-gray-50">
                <img 
                  src={product.images && product.images.length > 0 
                    ? (product.images[0].url.startsWith('http') ? product.images[0].url : `http://localhost:5000${product.images[0].url}`) 
                    : `https://picsum.photos/seed/${product._id}/400/400`} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                
                {/* Direct Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setIsModalOpen(true); }}
                    className="w-4/5 bg-amber-500 text-gray-900 font-black py-2 rounded-lg text-[9px] uppercase tracking-widest shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all border border-amber-400 hover:bg-amber-400"
                  >
                    Thêm vào giỏ
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setIsModalOpen(true); }}
                    className="w-4/5 bg-white text-gray-900 font-black py-2 rounded-lg text-[9px] uppercase tracking-widest shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all border border-gray-200 hover:bg-gray-100"
                  >
                    Mua Ngay
                  </button>
                </div>

                <div className="absolute top-0 left-0 p-2 z-30">
                   <span className="bg-[#d0011b] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-sm">MALL</span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col bg-white">
                <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-3 leading-snug group-hover:text-amber-600 transition-colors uppercase tracking-tight">{product.name}</h3>
                <div className="mt-auto">
                    <div className="text-amber-600 font-black text-base">{formatPrice(product.price)}</div>
                    <div className="flex items-center justify-between mt-2">
                       <div className="flex text-yellow-400 text-[10px]">★★★★★</div>
                       <span className="text-[10px] text-gray-400 font-medium">Đã bán {Math.floor(Math.random() * 100) + 1}</span>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <span className="text-4xl grayscale opacity-30 mb-4 block">📦</span>
            <p className="text-gray-400 uppercase font-black text-[10px] tracking-widest">Shop chưa có sản phẩm nào được đăng tải</p>
          </div>
        )}
      </div>

      <div className="mt-16 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-600 font-black uppercase tracking-widest text-[10px] transition-all group">
           <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           Quay lại trang chủ mua sắm
        </Link>
      </div>
      <ProductModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
