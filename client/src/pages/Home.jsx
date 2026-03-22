import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductModal from '../components/ProductModal';
import Navbar from '../components/Navbar';

export default function Home() {
  const { addToCart, getCartCount, userRole } = useCart() || {};
  const { toggleWishlist, isInWishlist, wishlist = [] } = useWishlist() || {};
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productGroupMap, setProductGroupMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [timeLeft, setTimeLeft] = useState({});
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products')
        ]);
        setCategories(catRes.data);

        const prods = prodRes.data;
        const unique = [];
        const groupMap = {};
        prods.forEach(p => {
          if (!groupMap[p.name]) {
            groupMap[p.name] = [];
            unique.push(p);
          }
          groupMap[p.name].push(p._id);
        });
        setProducts(unique);
        setProductGroupMap(groupMap);

        const now = new Date();
        const flashSales = prods.filter(p => 
          p.isFlashSale && 
          p.flashSaleEndDate && 
          new Date(p.flashSaleEndDate) > now &&
          p.flashSaleStock > 0
        );
        setFlashSaleProducts(flashSales);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(err => {
          console.error("Error fetching user profile:", err);
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
          }
        });
    }
  }, []);

  useEffect(() => {
    if (flashSaleProducts.length === 0) return;
    const timer = setInterval(() => {
      const now = new Date();
      const endDates = flashSaleProducts.map(p => new Date(p.flashSaleEndDate));
      const nearestEnd = new Date(Math.min(...endDates));
      const distance = nearestEnd - now;
      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        hours: Math.floor((distance / (1000 * 60 * 60))),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [flashSaleProducts]);

  const openProductModal = (productInfo) => {
    setSelectedProduct(productInfo);
    setIsModalOpen(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10 relative">
      <Navbar />

      {/* BANNER SECTION */}
      <section className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-2/3 h-64 md:h-80 bg-gradient-to-br from-gray-900 to-black rounded-lg relative overflow-hidden shadow-md">
          <div className="absolute inset-x-0 bottom-0 top-0 opacity-40 mix-blend-overlay bg-gradient-to-tr from-[#D4AF37] to-black"></div>
          <div className="absolute inset-y-0 left-0 p-8 flex flex-col justify-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">Mùa Lễ Hội <br /><span className="text-[#D4AF37] drop-shadow-lg">Giảm Giá Lên Đến 50%</span></h2>
            <p className="text-gray-300 mb-6 drop-shadow-md">Trải nghiệm những thiết kế sang trọng nhất</p>
            <button className="bg-[#D4AF37] hover:bg-white text-gray-900 font-bold px-6 py-2.5 rounded-sm w-max transition shadow-lg shadow-[#D4AF37]/20">
              Khám Phá Ngay
            </button>
          </div>
        </div>

        <div className="w-full lg:w-1/3 flex flex-row lg:flex-col gap-4">
          <div className="flex-1 lg:h-1/2 bg-gray-800 rounded-lg overflow-hidden relative shadow-sm group border border-gray-200/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-700 opacity-80 transition group-hover:scale-105 duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
              <span className="text-[#D4AF37] font-bold text-sm bg-black/40 w-max px-2 py-0.5 rounded">🎫 Voucher Mới</span>
              <span className="text-white text-lg font-semibold mt-1">Deal Thời Trang Nam</span>
            </div>
          </div>
          <div className="flex-1 lg:h-1/2 bg-gray-800 rounded-lg overflow-hidden relative shadow-sm group border border-gray-200/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-700 opacity-60 transition group-hover:scale-105 duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
              <span className="text-[#D4AF37] font-bold text-sm bg-black/40 w-max px-2 py-0.5 rounded">🚚 Giao Siêu Tốc</span>
              <span className="text-white text-lg font-semibold mt-1">Dành cho đơn từ 0Đ</span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="container mx-auto px-4 mt-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <h2 className="uppercase text-gray-800 font-bold tracking-wide text-lg flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#D4AF37] rounded-full inline-block"></span>
              Danh Mục Sản Phẩm
            </h2>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-6 border-l border-t border-gray-100">
            {categories.map((cat) => (
              <a href="#" key={cat._id} className="flex flex-col items-center gap-3 p-5 border-r border-b border-gray-100 hover:bg-gray-50 transition-all duration-300 group">
                <div className="w-[85px] h-[85px] rounded-full overflow-hidden bg-gray-50 border-2 border-transparent group-hover:border-[#D4AF37] p-0.5 transition-all">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img src={cat.image ? `http://localhost:5000${cat.image}` : `https://picsum.photos/seed/${cat._id}/150/150`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={cat.name} />
                  </div>
                </div>
                <span className="text-sm text-gray-700 text-center group-hover:text-[#D4AF37] font-medium line-clamp-2 leading-tight h-10">{cat.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FLASH SALE SECTION */}
      {flashSaleProducts.length > 0 && (
        <section className="container mx-auto px-4 mt-8">
          <div className="bg-white rounded-xl shadow-lg border border-[#D4AF37]/20 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-black via-gray-900 to-black flex items-center justify-between text-white border-b border-[#D4AF37]/30">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl italic font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#D4AF37] to-[#8B7355]">Flash Sale</span>
                    <span className="text-2xl animate-pulse text-[#D4AF37]">⚡</span>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <div className="bg-[#D4AF37] text-black px-2 py-1 rounded font-black text-sm">{String(timeLeft.hours || 0).padStart(2, '0')}</div>
                    <span className="font-bold text-[#D4AF37]">:</span>
                    <div className="bg-[#D4AF37] text-black px-2 py-1 rounded font-black text-sm">{String(timeLeft.minutes || 0).padStart(2, '0')}</div>
                    <span className="font-bold text-[#D4AF37]">:</span>
                    <div className="bg-[#D4AF37] text-black px-2 py-1 rounded font-black text-sm">{String(timeLeft.seconds || 0).padStart(2, '0')}</div>
                  </div>
               </div>
               <Link to="/flash-sale" className="text-[#D4AF37] text-xs font-bold hover:text-white transition flex items-center gap-1 uppercase tracking-widest">
                 XEM TẤT CẢ
               </Link>
            </div>
            
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 bg-white">
              {flashSaleProducts.slice(0, 6).map(p => (
                <div key={p._id} onClick={() => openProductModal(p)} className="group relative flex flex-col cursor-pointer border border-transparent hover:border-[#D4AF37]/30 transition-all p-2 rounded-lg">
                  <div className="aspect-square relative overflow-hidden rounded-md shadow-sm border border-gray-100">
                    <img src={p.images?.[0]?.url ? `http://localhost:5000${p.images[0].url}` : `https://picsum.photos/seed/${p._id}/300/300`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[10px] font-black px-2 py-1 rounded-bl-md z-10">
                      <span>-{p.discountPercentage}%</span>
                    </div>
                  </div>
                  <div className="mt-3 text-center space-y-1">
                    <div className="text-[#D4AF37] font-black text-lg">{formatPrice(p.flashSalePrice)}</div>
                    <div className="text-[10px] text-gray-400 line-through">{formatPrice(p.price)}</div>
                    <div className="w-full h-3.5 bg-gray-100 rounded-full relative overflow-hidden mt-2 border border-gray-200 shadow-inner">
                      <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#8B7355] transition-all duration-1000" style={{ width: `${Math.min(100, (p.sold / (p.flashSaleStock + p.sold)) * 100 || 20)}%` }}></div>
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black italic text-gray-900 uppercase tracking-tighter">Đang cháy hàng 🔥</span>
                    </div>
                    <div className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest mt-1">Còn lại: {p.flashSaleStock}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TOP RATED SECTION */}
      <section className="container mx-auto px-4 mt-12 mb-8">
        <div className="flex items-center justify-between mb-8">
           <div className="flex flex-col">
             <h2 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase leading-none">
                Sản phẩm <span className="text-[#D4AF37]">Đánh Giá Cao</span>
             </h2>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2">Được hàng nghìn khách hàng tin dùng</p>
           </div>
           <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#D4AF37] transition-colors border-b-2 border-transparent hover:border-[#D4AF37] pb-1">Xem tất cả</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.filter(p => p.rating && p.rating >= 4.0).sort((a,b) => (b.rating)-(a.rating)).slice(0, 6).map(product => (
            <div key={product._id} onClick={() => openProductModal(product)} className="group bg-white rounded-sm shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col h-full cursor-pointer">
              <div className="w-full aspect-square bg-gray-50 overflow-hidden relative">
                <img src={product.images && product.images.length > 0 ? (product.images[0].url.startsWith('http') ? product.images[0].url : `http://localhost:5000${product.images[0].url}`) : `https://picsum.photos/seed/${product._id}/400/400`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                <div className="absolute top-1 left-1 bg-black/80 text-[#D4AF37] px-2 py-0.5 rounded-sm text-[9px] font-black flex items-center gap-1 z-30">
                  <span>★</span> {product.rating ? product.rating.toFixed(1) : 'Chưa có'}
                </div>
                <div className="absolute inset-x-0 bottom-0 top-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
                  <button onClick={(e) => { e.stopPropagation(); openProductModal(product); }} className="w-4/5 bg-[#D4AF37] text-gray-900 font-bold py-2 rounded-lg text-[10px] uppercase transition-all hover:bg-white active:scale-95">XEM CHI TIẾT</button>
                </div>
              </div>
              <div className="p-2.5 flex-1 flex flex-col">
                <h3 className="text-[12px] text-gray-800 line-clamp-2 leading-tight mb-2 font-medium group-hover:text-[#D4AF37] uppercase italic">{product.name}</h3>
                <div className="mt-auto">
                    <div className="text-[#D4AF37] font-black text-sm">{formatPrice(product.price)}</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-[10px] text-yellow-400">
                        {product.rating ? '★'.repeat(Math.round(product.rating)) : '☆'.repeat(5)}
                      </div>
                      <span className="text-[9px] text-gray-400 uppercase font-bold">Đã bán {product.sold || 0}</span>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCT FEED */}
      <section className="container mx-auto px-4 mt-8 pb-12">
        <div className="bg-white rounded-t-xl overflow-hidden shadow-sm flex items-center border-b-2 border-[#D4AF37] mb-4 sticky top-16 z-40">
          <div className="bg-white text-[#D4AF37] text-center font-bold px-8 py-4 uppercase tracking-wide border-b-4 border-[#D4AF37]">
            Gợi Ý Hôm Nay
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4">
          {products.length > 0 ? products.map((product) => (
            <div key={product._id} onClick={() => openProductModal(product)} className="group bg-white rounded-sm shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col h-full cursor-pointer">
              <div className="w-full aspect-square bg-gray-50 overflow-hidden relative">
                <img src={product.images && product.images.length > 0 ? (product.images[0].url.startsWith('http') ? product.images[0].url : `http://localhost:5000${product.images[0].url}`) : `https://picsum.photos/seed/${product._id}/400/400`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product._id); }} className="absolute top-2 right-2 z-30 p-2 rounded-full bg-white/80 backdrop-blur shadow-sm hover:scale-110 transition-all">
                  <svg className={`w-4 h-4 transition-colors ${isInWishlist(product._id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </button>
                <div className="absolute inset-x-0 bottom-0 top-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
                  <button onClick={(e) => { e.stopPropagation(); openProductModal(product); }} className="w-4/5 bg-[#D4AF37] text-gray-900 font-bold py-2 rounded-lg text-[10px] uppercase hover:bg-white active:scale-95">Thêm vào giỏ</button>
                  <button onClick={(e) => { e.stopPropagation(); openProductModal(product); }} className="w-4/5 bg-white text-gray-900 font-bold py-2 rounded-lg text-[10px] uppercase hover:bg-gray-100 active:scale-95">Mua Ngay</button>
                </div>
              </div>
              <div className="p-2.5 flex-1 flex flex-col">
                <h3 className="text-[12.5px] text-gray-800 line-clamp-2 leading-tight mb-2 font-medium group-hover:text-[#D4AF37]">{product.name}</h3>
                <div className="mt-auto">
                    <div className="text-[#D4AF37] font-black text-sm">{formatPrice(product.price)}</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-[10px] text-yellow-400">
                        {product.rating ? '★'.repeat(Math.round(product.rating)) : '☆'.repeat(5)}
                      </div>
                      <span className="text-[11px] text-gray-600 font-medium">Đã bán {product.sold || 0}</span>
                    </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full p-8 text-center text-gray-500">Đang cập nhật sản phẩm...</div>
          )}
        </div>
        {products.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-32 rounded-sm shadow-sm border border-gray-200 hover:border-[#D4AF37] transition duration-300 text-sm z-10 relative overflow-hidden group">
              <span className="relative z-10 block transition-transform group-hover:scale-105">Xem Thêm</span>
            </button>
          </div>
        )}
      </section>

      <footer className="bg-white border-t-4 border-[#D4AF37] text-sm mt-auto pt-10 pb-6 text-gray-600">
        <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-gray-900 font-bold mb-4 uppercase text-xs">Chăm Sóc Khách Hàng</h4>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#" className="hover:text-[#D4AF37]">Trung Tâm Trợ Giúp</a></li>
              <li><a href="#" className="hover:text-[#D4AF37]">PETROLIMEX Fashion Blog</a></li>
              <li><a href="#" className="hover:text-[#D4AF37]">Hướng Dẫn Mua Hàng</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold mb-4 uppercase text-xs">Về PETROLIMEX Fashion</h4>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#" className="hover:text-[#D4AF37]">Giới Thiệu</a></li>
              <li><a href="#" className="hover:text-[#D4AF37]">Tuyển Dụng</a></li>
              <li><a href="#" className="hover:text-[#D4AF37]">Điều Khoản</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold mb-4 uppercase text-xs">Thanh Toán</h4>
            <div className="flex gap-2 text-md flex-wrap font-bold">
              <span className="border rounded px-2 py-1 text-blue-800">VISA</span>
              <span className="border rounded px-2 py-1 text-orange-600">JCB</span>
              <span className="border rounded px-2 py-1 text-sky-500">ATM</span>
            </div>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold mb-4 uppercase text-xs">Theo Dõi Chúng Tôi</h4>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#" className="hover:text-[#D4AF37]">📘 Facebook</a></li>
              <li><a href="#" className="hover:text-[#D4AF37]">📸 Instagram</a></li>
              <li><a href="#" className="hover:text-[#D4AF37]">💼 LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 text-center border-t border-gray-200 pt-6 text-gray-500">
          <p>© 2026 Petrolimex Fashion. All Rights Reserved.</p>
        </div>
      </footer>

      <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} productGroupMap={productGroupMap} />
    </div>
  );
}
