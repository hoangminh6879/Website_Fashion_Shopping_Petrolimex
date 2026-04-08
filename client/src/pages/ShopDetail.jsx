import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import ProductModal from '../components/ProductModal';
import AutoText from '../components/AutoText';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';

export default function ShopDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addToCart, userRole } = useCart();
  const [activeTab, setActiveTab] = useState('all');
  const [shopReviews, setShopReviews] = useState([]);
  const { openChatWithUser } = useSocket();

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const [shopRes, prodRes, reviewRes, topRatedRes] = await Promise.all([
          api.get(`/shops/${id}`),
          api.get(`/products?shopId=${id}`),
          api.get(`/reviews/shop/${id}`),
          api.get(`/products/top-rated?shopId=${id}&limit=6`)
        ]);
        setShop(shopRes.data);
        setProducts(prodRes.data);
        setShopReviews(reviewRes.data);
        setRecommendedProducts(topRatedRes.data);

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
        <h2 className="text-2xl font-bold text-gray-800 mb-2"><AutoText text="Không tìm thấy shop" /></h2>
        <Link to="/" className="text-amber-600 font-bold hover:underline"><AutoText text="Quay lại trang chủ" /></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10 pt-32 md:pt-44">
      <Navbar />
      {/* SHOP HEADER (Premium Look) */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-amber-900/50 pt-10 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
            <div className="w-32 h-32 rounded-full border-4 border-amber-500 overflow-hidden shadow-amber-500/20 shadow-2xl bg-white flex-shrink-0">
              <img src={shop.image ? `http://localhost:5000${shop.image}` : `https://picsum.photos/seed/${shop._id}/200/200`} alt={shop.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight italic mb-2">
                <AutoText text={shop.name} />
                <span className="ml-3 inline-block bg-[#d0011b] text-white text-[10px] font-black not-italic px-2 py-0.5 rounded-sm align-middle">MALL</span>
              </h1>
              <p className="text-gray-300 text-sm max-w-2xl leading-relaxed font-medium">
                <AutoText text={shop.description || 'Chưa có mô tả cho cửa hàng này. Petrolimex Fashion Mall tự hào cung cấp các sản phẩm chất lượng cao đến tay người tiêu dùng.'} />
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-6">
                <div className="flex items-center gap-2">
                   <span className="text-amber-500 font-black">{shop.rating?.toFixed(1) || '0.0'}</span>
                   <div className="flex text-yellow-400 text-xs">
                     {[1, 2, 3, 4, 5].map((s) => (
                       <span key={s} className={s <= Math.round(shop.rating || 0) ? 'opacity-100' : 'opacity-20'}>★</span>
                     ))}
                   </div>
                   <span className="text-gray-400 text-xs uppercase font-bold tracking-widest">({shopReviews.length} <AutoText text="Đánh giá" />)</span>
                </div>
                <div className="h-4 w-[1px] bg-gray-700 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                   <span className="text-white font-black">{products.length}</span>
                   <span className="text-gray-400 text-xs uppercase font-bold tracking-widest"><AutoText text="Sản phẩm" /></span>
                </div>
                <div className="h-4 w-[1px] bg-gray-700 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                   <span className="text-white font-black">98%</span>
                   <span className="text-gray-400 text-xs uppercase font-bold tracking-widest"><AutoText text="Phản hồi Chat" /></span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
               <button 
                onClick={handleToggleFollow}
                className={`${followed ? 'bg-white/20 text-white border-white/20' : 'bg-amber-500 text-gray-900 border-amber-500'} hover:opacity-90 font-black px-8 py-3 rounded-xl transition-all shadow-xl shadow-amber-500/10 uppercase tracking-widest text-[10px] border`}
               >
                 <AutoText text={followed ? 'Đang Theo Dõi' : '+ Theo Dõi'} />
               </button>
               <button 
                 onClick={() => openChatWithUser(shop.owner)}
                 className="bg-white/10 hover:bg-white/20 text-white font-black px-8 py-3 rounded-xl transition-all backdrop-blur border border-white/10 uppercase tracking-widest text-[10px]"
               >
                 <AutoText text="Chat Ngay" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS NAV */}
      <div className="bg-white border-b border-gray-200 shadow-sm mb-8">
         <div className="container mx-auto px-4 flex">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-8 py-4 font-black uppercase tracking-widest text-[11px] border-b-2 transition-all ${activeTab === 'all' ? 'text-amber-600 border-amber-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
            >
              <AutoText text="Tất Cả Sản Phẩm" />
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`px-8 py-4 font-black uppercase tracking-widest text-[11px] border-b-2 transition-all ${activeTab === 'reviews' ? 'text-amber-600 border-amber-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
            >
              <AutoText text="Đánh giá Shop" /> ({shopReviews.length})
            </button>
         </div>
      </div>

      {/* CONTENT AREA */}
      <div className="container mx-auto px-4">
        {activeTab === 'all' ? (
          <>
            {recommendedProducts.length > 0 && (
              <div className="mb-12 animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white not-italic shadow-lg shadow-amber-500/20">★</span>
                      <AutoText text="Đề xuất sản phẩm đánh giá cao" />
                   </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {recommendedProducts.map((product) => (
                    <div 
                      key={`rec-${product._id}`} 
                      className="bg-white rounded-xl border-2 border-amber-100 hover:border-amber-400 hover:shadow-2xl transition-all duration-500 group overflow-hidden flex flex-col relative cursor-pointer transform hover:-translate-y-1"
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
                        <div className="absolute top-0 right-0 p-2 z-30">
                           <span className="bg-amber-500 text-gray-900 text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-md flex items-center gap-1">
                             <span className="animate-pulse">🔥</span> {product.rating?.toFixed(1) || '0.0'}
                           </span>
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                           <span className="bg-white text-gray-900 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all">Xem Chi Tiết</span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col bg-amber-50/30">
                        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-3 leading-snug group-hover:text-amber-600 transition-colors uppercase tracking-tight"><AutoText text={product.name} /></h3>
                        <div className="mt-auto">
                            <div className="text-amber-600 font-black text-base">{formatPrice(product.price)}</div>
                            <div className="flex items-center justify-between mt-2">
                               <div className="flex text-amber-400 text-[10px]">
                                 {'★'.repeat(Math.round(product.rating || 0))}
                               </div>
                               <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight italic opacity-70"><AutoText text="Bán chạy" /></span>
                            </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter italic flex items-center gap-3">
                   <span className="w-8 h-1 bg-gray-300 rounded-full"></span>
                   <AutoText text="Tất cả sản phẩm" />
                </h2>
            </div>
            
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
                        {t('add_to_cart')}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setIsModalOpen(true); }}
                        className="w-4/5 bg-white text-gray-900 font-black py-2 rounded-lg text-[9px] uppercase tracking-widest shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all border border-gray-200 hover:bg-gray-100"
                      >
                        {t('buy_now')}
                      </button>
                    </div>

                    <div className="absolute top-0 left-0 p-2 z-30">
                       <span className="bg-[#d0011b] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-sm">MALL</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col bg-white">
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-3 leading-snug group-hover:text-amber-600 transition-colors uppercase tracking-tight"><AutoText text={product.name} /></h3>
                    <div className="mt-auto">
                        <div className="text-amber-600 font-black text-base">{formatPrice(product.price)}</div>
                        <div className="flex items-center justify-between mt-2">
                           <div className="flex text-yellow-400 text-[10px]">
                              {'★'.repeat(Math.round(product.rating || 0))}
                           </div>
                           <span className="text-[10px] text-gray-400 font-medium"><AutoText text="Đã bán" /> {Math.floor(Math.random() * 100) + 1}</span>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            {products.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <span className="text-4xl grayscale opacity-30 mb-4 block">📦</span>
                <p className="text-gray-400 uppercase font-black text-[10px] tracking-widest"><AutoText text="Shop chưa có sản phẩm nào được đăng tải" /></p>
              </div>
            )}
          </div>
        </>
      ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {shopReviews.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <span className="text-4xl grayscale opacity-30 mb-4 block">⭐</span>
                <p className="text-gray-400 uppercase font-black text-[10px] tracking-widest"><AutoText text="Cửa hàng chưa có đánh giá nào từ khách hàng" /></p>
              </div>
            ) : (
              shopReviews.map((review) => (
                <div key={review._id} className="bg-white rounded-[2rem] p-8 border border-gray-50 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 italic flex items-center justify-center font-bold text-gray-400 border border-gray-200">
                        {review.user?.avatar ? <img src={review.user.avatar} className="w-full h-full object-cover" /> : review.user?.name?.[0] || '?'}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-gray-900 uppercase tracking-tight group-hover:text-amber-600 transition-all">{review.user?.name || 'Khách hàng'}</h4>
                        <div className="flex text-yellow-400 text-[10px] mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={s <= review.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-xs italic font-medium leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                    "{review.comment || 'Khách hàng không để lại bình luận.'}"
                  </p>
                  
                  {review.reply && (
                    <div className="ml-12 bg-amber-50 p-6 rounded-2xl border border-amber-100 relative shadow-inner">
                      <div className="absolute top-0 left-6 transform -translate-y-1/2 w-4 h-4 bg-amber-50 border-l border-t border-amber-100 rotate-45" />
                      <p className="text-[9px] font-black uppercase text-amber-700 tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Phản hồi từ Chủ Shop
                      </p>
                      <p className="text-amber-900/80 text-[11px] font-bold italic">
                        {review.reply}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="mt-16 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-600 font-black uppercase tracking-widest text-[10px] transition-all group">
           <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           <AutoText text="Quay lại trang chủ mua sắm" />
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
