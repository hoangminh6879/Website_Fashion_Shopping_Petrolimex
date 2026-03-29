import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductModal from '../components/ProductModal';
import Navbar from '../components/Navbar';
import AutoText from "../components/AutoText";
import { useTranslation } from 'react-i18next';
import { liveTranslate } from '../i18n';
import { translateContent } from '../services/translate';

export default function Home() {
  const { addToCart, getCartCount, userRole } = useCart() || {};
  const { toggleWishlist, isInWishlist, wishlist = [] } = useWishlist() || {};
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productGroupMap, setProductGroupMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get("search") || "";
  const categoryParam = queryParams.get("category") || "";
  const minPriceParam = queryParams.get("minPrice") ? Number(queryParams.get("minPrice")) : null;
  const maxPriceParam = queryParams.get("maxPrice") ? Number(queryParams.get("maxPrice")) : null;
  const ratingParam = queryParams.get("rating") ? Number(queryParams.get("rating")) : 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [filterPrice, setFilterPrice] = useState({ min: minPriceParam, max: maxPriceParam });
  const [selectedRating, setSelectedRating] = useState(ratingParam);
  const [filterPromotion, setFilterPromotion] = useState({ flashSale: false, event: false });
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    setSelectedCategory(categoryParam);
    setFilterPrice({ min: minPriceParam, max: maxPriceParam });
    setSelectedRating(ratingParam);
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let finalSearch = searchTerm;

        const [catRes, prodRes, eventRes] = await Promise.all([
          api.get('/categories'),
          api.get(`/products?search=${finalSearch}&category=${selectedCategory || ""}&sort=${sort}`),
          api.get('/events/ongoing')
        ]);
        setCategories(catRes.data);
        setOngoingEvents(eventRes.data);

        const prods = prodRes.data;
        const unique = [];
        const groupMap = {};
        
        // Lọc ở frontend để đảm bảo tính năng tìm kiếm hoạt động chính xác
        const finalProds = prods.filter(p => 
          p.name.toLowerCase().includes(finalSearch.toLowerCase()) ||
          p.description.toLowerCase().includes(finalSearch.toLowerCase())
        );

        finalProds.forEach(p => {
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
  }, [searchTerm, selectedCategory, sort, i18n.language]);

  useEffect(() => {
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

  useEffect(() => {
    if (ongoingEvents.length <= 1) return;
    const slideTimer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % ongoingEvents.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [ongoingEvents]);

  const openProductModal = (productInfo) => {
    setSelectedProduct(productInfo);
    setIsModalOpen(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const getFlashSalePrice = (product) => {
    if (!product) return 0;
    let price = product.price;
    if (product.isFlashSale && product.flashSaleEndDate && new Date(product.flashSaleEndDate) > new Date() && product.flashSaleStock > 0) {
       price = product.flashSalePrice || price;
    }
    return price;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  const currentList = products;
  
  const filteredProducts = currentList.filter(p => {
    const matchesCat = selectedCategory ? (p.category === selectedCategory || p.category?._id === selectedCategory) : true;
    const matchesMinPrice = filterPrice.min ? getFlashSalePrice(p) >= filterPrice.min : true;
    const matchesMaxPrice = filterPrice.max ? getFlashSalePrice(p) <= filterPrice.max : true;
    const matchesRating = selectedRating > 0 ? (p.rating && Math.round(p.rating) >= selectedRating) : true;
    
    // Evaluate Khuyen Mai
    const isFlashSaleActive = p.isFlashSale && p.flashSaleEndDate && new Date(p.flashSaleEndDate) > new Date() && p.flashSaleStock > 0;
    const matchesFlashSale = filterPromotion.flashSale ? isFlashSaleActive : true;
    const matchesEvent = filterPromotion.event ? Boolean(p.event || p.eventPrice || (p.events && p.events.length > 0)) : true; // Assuming typical event schema mappings

    return matchesCat && matchesMinPrice && matchesMaxPrice && matchesRating && matchesFlashSale && matchesEvent;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch(sort) {
      case 'price_asc': return getFlashSalePrice(a) - getFlashSalePrice(b);
      case 'price_desc': return getFlashSalePrice(b) - getFlashSalePrice(a);
      case 'rating_asc': return (a.rating || 0) - (b.rating || 0);
      case 'rating_desc': return (b.rating || 0) - (a.rating || 0);
      case 'newest':
      default:
         return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10 relative pt-40 md:pt-48">
      <Navbar />

      {/* BANNER SECTION (DYNAMIC CAROUSEL) */}
      <section className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-2/3 h-[250px] md:h-[400px] bg-gray-900 rounded-2xl relative overflow-hidden shadow-2xl border border-gray-800">
          {ongoingEvents.length > 0 ? (
            <div className="relative w-full h-full group">
              {ongoingEvents.map((ev, idx) => (
                <div 
                  key={ev._id} 
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}
                >
                  <img 
                    src={ev.thumbnailImage ? (ev.thumbnailImage.startsWith('http') ? ev.thumbnailImage : `http://localhost:5000${ev.thumbnailImage}`) : `https://picsum.photos/seed/${ev._id}/1200/600`} 
                    className={`w-full h-full object-cover transition-transform duration-[10000ms] ${idx === currentSlide ? 'scale-110' : 'scale-100'}`}
                    alt={ev.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16">
                    <div className="flex items-center gap-3 mb-4 animate-fadeInLeft">
                      <span className="text-3xl bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-xl">{ev.eventType?.icon || '🎉'}</span>
                      <span className="text-white font-black uppercase tracking-[0.4em] text-[11px] brightness-150 drop-shadow-md">{ev.eventType?.label}</span>
                    </div>
                    <h2 className="text-4xl md:text-7xl font-black text-white mb-4 uppercase italic tracking-tighter leading-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] animate-fadeInUp">
                      <AutoText text={ev.name} />
                    </h2>
                    <p className="text-gray-200 mb-8 drop-shadow-lg max-w-xl text-sm md:text-base font-medium line-clamp-2 opacity-90 animate-fadeInUp delay-100"><AutoText text={ev.description} /></p>
                    <button 
                      onClick={() => navigate(`/event/${ev._id}`)}
                      className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-white hover:to-gray-100 text-gray-900 font-black px-10 py-4 rounded-2xl w-max transition-all shadow-2xl shadow-[#D4AF37]/40 uppercase tracking-[0.2em] text-[11px] active:scale-95 animate-fadeInUp delay-200 group/btn flex items-center gap-2"
                    >
                      <AutoText text="Khám Phá Ngay" />
                      <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Carousel Indicators */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-30 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                {ongoingEvents.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 transition-all duration-500 rounded-full ${idx === currentSlide ? 'w-10 bg-[#D4AF37] shadow-[0_0_15px_#D4AF37]' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <button onClick={() => setCurrentSlide(prev => (prev - 1 + ongoingEvents.length) % ongoingEvents.length)} className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/10 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-[#D4AF37] hover:text-gray-900 z-30 shadow-2xl hover:scale-110 active:scale-95 text-xl">←</button>
              <button onClick={() => setCurrentSlide(prev => (prev + 1) % ongoingEvents.length)} className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/10 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-[#D4AF37] hover:text-gray-900 z-30 shadow-2xl hover:scale-110 active:scale-95 text-xl">→</button>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-lg relative overflow-hidden shadow-md flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter"><AutoText text="Chào mừng đến với" /> <span className="text-[#D4AF37]">Petrolimex Fashion</span></h2>
                <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-[10px]"><AutoText text="Đang cập nhật các sự kiện hot nhất..." /></p>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-1/3 flex flex-row lg:flex-col gap-4">
          <div 
            onClick={() => navigate('/flash-sale')}
            className="flex-1 lg:h-1/2 bg-gray-800 rounded-2xl overflow-hidden relative shadow-xl group border border-gray-200/10 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-700 opacity-80 transition group-hover:scale-105 duration-500"></div>
            <img src="https://picsum.photos/seed/flash/600/300" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-6 flex flex-col justify-end">
              <span className="text-[#D4AF37] font-black text-[10px] bg-black/60 w-max px-3 py-1 rounded-full uppercase tracking-widest border border-[#D4AF37]/30 mb-2">⚡ <AutoText text="Flash Sale" /></span>
              <h3 className="text-white text-xl font-black uppercase italic leading-tight"><AutoText text="Deal Thời Trang Nam" /> <br /> <span className="text-[#D4AF37]"><AutoText text="Săn Ngay 0Đ" /></span></h3>
            </div>
          </div>
          <div className="flex-1 lg:h-1/2 bg-gray-800 rounded-2xl overflow-hidden relative shadow-xl group border border-gray-200/10 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-700 opacity-60 transition group-hover:scale-105 duration-500"></div>
            <img src="https://picsum.photos/seed/shipping/600/300" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-6 flex flex-col justify-end">
              <span className="text-[#D4AF37] font-black text-[10px] bg-black/60 w-max px-3 py-1 rounded-full uppercase tracking-widest border border-[#D4AF37]/30 mb-2">🚚 <AutoText text="Giao Siêu Tốc" /></span>
              <h3 className="text-white text-xl font-black uppercase italic leading-tight"><AutoText text="Miễn phí vận chuyển" /> <br /> <span className="text-[#D4AF37]"><AutoText text="Toàn quốc" /></span></h3>
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
              <AutoText text="Danh Mục Sản Phẩm" />
            </h2>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-6 border-l border-t border-gray-100">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`flex flex-col items-center gap-3 p-5 border-r border-b border-gray-100 transition-all duration-300 group ${!selectedCategory ? 'bg-gray-50 border-b-2 border-b-[#D4AF37]' : 'hover:bg-gray-50'}`}
            >
              <div className={`w-[85px] h-[85px] rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 transition-all ${!selectedCategory ? 'border-[#D4AF37]' : 'border-transparent group-hover:border-[#D4AF37]'}`}>
                <span className="text-2xl">🛍️</span>
              </div>
              <span className={`text-sm text-center font-bold uppercase tracking-tighter transition-colors ${!selectedCategory ? 'text-[#D4AF37]' : 'text-gray-700 group-hover:text-[#D4AF37]'}`}><AutoText text="Tất Cả" /></span>
            </button>
            {categories.map((cat) => (
              <button 
                key={cat._id} 
                onClick={() => setSelectedCategory(cat._id)}
                className={`flex flex-col items-center gap-3 p-5 border-r border-b border-gray-100 transition-all duration-300 group ${selectedCategory === cat._id ? 'bg-gray-50 border-b-2 border-b-[#D4AF37]' : 'hover:bg-gray-50'}`}
              >
                <div className={`w-[85px] h-[85px] rounded-full overflow-hidden bg-gray-50 border-2 transition-all ${selectedCategory === cat._id ? 'border-[#D4AF37]' : 'border-transparent group-hover:border-[#D4AF37]'} p-0.5`}>
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img src={cat.image ? `http://localhost:5000${cat.image}` : `https://picsum.photos/seed/${cat._id}/150/150`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={cat.name} />
                  </div>
                </div>
                <span className={`text-sm text-center font-medium line-clamp-2 leading-tight h-10 transition-colors ${selectedCategory === cat._id ? 'text-[#D4AF37]' : 'text-gray-700 group-hover:text-[#D4AF37]'}`}><AutoText text={cat.name} /></span>
              </button>
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
                 <AutoText text="XEM TẤT CẢ" />
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
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black italic text-gray-900 uppercase tracking-tighter"><AutoText text="Đang cháy hàng 🔥" /></span>
                    </div>
                    <div className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest mt-1"><AutoText text="Còn lại" />: {p.flashSaleStock}</div>
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
                <AutoText text="Sản phẩm" /> <span className="text-[#D4AF37]"><AutoText text="Đánh Giá Cao" /></span>
             </h2>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2"><AutoText text="Được hàng nghìn khách hàng tin dùng" /></p>
           </div>
           <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#D4AF37] transition-colors border-b-2 border-transparent hover:border-[#D4AF37] pb-1"><AutoText text="XEM TẤT CẢ" /></button>
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
                  <button onClick={(e) => { e.stopPropagation(); openProductModal(product); }} className="w-4/5 bg-[#D4AF37] text-gray-900 font-bold py-2 rounded-lg text-[10px] uppercase transition-all hover:bg-white active:scale-95"><AutoText text="XEM CHI TIẾT" /></button>
                </div>
              </div>
              <div className="p-2.5 flex-1 flex flex-col">
                <h3 className="text-[12px] text-gray-800 line-clamp-2 leading-tight mb-2 font-medium group-hover:text-[#D4AF37] uppercase italic"><AutoText text={product.name} /></h3>
                <div className="mt-auto">
                    <div className="flex items-center gap-2">
                        <div className="text-[#D4AF37] font-black text-sm">{formatPrice(getFlashSalePrice(product))}</div>
                        {product.isFlashSale && new Date(product.flashSaleEndDate) > new Date() && product.flashSaleStock > 0 && (
                          <div className="text-[9px] text-gray-400 line-through">{formatPrice(product.price)}</div>
                        )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-1">
                        <div className="flex text-[10px] text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star}>{product.rating >= star ? '★' : '☆'}</span>
                          ))}
                        </div>
                        {product.rating > 0 && (
                          <span className="text-[10px] font-bold text-gray-400">({product.rating.toFixed(1)})</span>
                        )}
                      </div>
                      <span className="text-[9px] text-gray-400 uppercase font-bold"><AutoText text="Đã bán" /> {product.sold || 0}</span>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCT FEED */}
      <section className="container mx-auto px-4 mt-8 pb-12 w-full">
        <div className="w-full">
          <div className="bg-white rounded-xl shadow-sm border border-[#D4AF37]/30 mb-6 sticky top-20 z-40 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h2 className="text-[#D4AF37] text-lg font-black uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#D4AF37] rounded-full inline-block"></span>
              <AutoText text={searchTerm ? `Kết quả tìm kiếm: ${searchTerm}` : "Gợi ý cho bạn"} />
            </h2>
            
            <div className="flex items-center gap-3">
               <span className="text-sm text-gray-500 font-bold whitespace-nowrap uppercase tracking-widest hidden md:inline"><AutoText text="Sắp xếp" />:</span>
               <select 
                  value={sort} 
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-[13px] font-bold rounded-lg px-4 py-2 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-gray-700 min-w-[180px] shadow-sm cursor-pointer"
               >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                  <option value="rating_asc">Đánh giá: Thấp đến Cao</option>
                  <option value="rating_desc">Đánh giá: Cao đến Thấp</option>
               </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          {sortedProducts.length > 0 ? sortedProducts.map((product) => (
            <div key={product._id} onClick={() => openProductModal(product)} className="group bg-white rounded-sm shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col h-full cursor-pointer">
              <div className="w-full aspect-square bg-gray-50 overflow-hidden relative">
                <img src={product.images && product.images.length > 0 ? (product.images[0].url.startsWith('http') ? product.images[0].url : `http://localhost:5000${product.images[0].url}`) : `https://picsum.photos/seed/${product._id}/400/400`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product._id); }} className="absolute top-2 right-2 z-30 p-2 rounded-full bg-white/80 backdrop-blur shadow-sm hover:scale-110 transition-all">
                  <svg className={`w-4 h-4 transition-colors ${isInWishlist(product._id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </button>
                {product.isFlashSale && new Date(product.flashSaleEndDate) > new Date() && product.flashSaleStock > 0 && (
                  <div className="absolute top-2 left-2 z-30 bg-[#D4AF37] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm shadow-sm">
                    -{product.flashSaleDiscount}%
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 top-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
                  <button onClick={(e) => { e.stopPropagation(); openProductModal(product); }} className="w-4/5 bg-[#D4AF37] text-gray-900 font-bold py-2 rounded-lg text-[10px] uppercase hover:bg-white active:scale-95"><AutoText text="THÊM VÀO GIỎ" /></button>
                  <button onClick={(e) => { e.stopPropagation(); openProductModal(product); }} className="w-4/5 bg-white text-gray-900 font-bold py-2 rounded-lg text-[10px] uppercase hover:bg-gray-100 active:scale-95"><AutoText text="MUA NGAY" /></button>
                </div>
              </div>
              <div className="p-2.5 flex-1 flex flex-col">
                <h3 className="text-[12.5px] text-gray-800 line-clamp-2 leading-tight mb-2 font-medium group-hover:text-[#D4AF37]"><AutoText text={product.name} /></h3>
                <div className="mt-auto">
                    <div className="flex items-center gap-2">
                        <div className="text-[#D4AF37] font-black text-sm">{formatPrice(getFlashSalePrice(product))}</div>
                        {product.isFlashSale && new Date(product.flashSaleEndDate) > new Date() && product.flashSaleStock > 0 && (
                          <div className="text-[9px] text-gray-400 line-through">{formatPrice(product.price)}</div>
                        )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-1">
                        <div className="flex text-[10px] text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star}>{product.rating >= star ? '★' : '☆'}</span>
                          ))}
                        </div>
                        {product.rating > 0 && (
                          <span className="text-[10px] font-bold text-gray-400">({product.rating.toFixed(1)})</span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-600 font-medium"><AutoText text="Đã bán" /> {product.sold || 0}</span>
                    </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full p-8 text-center text-gray-500"><AutoText text="Không tìm thấy sản phẩm nào..." /></div>
          )}
          </div>
          {sortedProducts.length > 0 && (
            <div className="mt-10 flex justify-center">
              <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-32 rounded-sm shadow-sm border border-gray-200 hover:border-[#D4AF37] transition duration-300 text-sm z-10 relative overflow-hidden group">
                <span className="relative z-10 block transition-transform group-hover:scale-105">{t('see_all')}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="bg-white border-t-4 border-[#D4AF37] text-sm mt-auto pt-10 pb-6 text-gray-600">
        <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-gray-900 font-bold mb-4 uppercase text-xs"><AutoText text="Chăm Sóc Khách Hàng" /></h4>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#" className="hover:text-[#D4AF37]"><AutoText text="Trung Tâm Trợ Giúp" /></a></li>
              <li><a href="#" className="hover:text-[#D4AF37]">PETROLIMEX Fashion Blog</a></li>
              <li><a href="#" className="hover:text-[#D4AF37]"><AutoText text="Hướng Dẫn Mua Hàng" /></a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold mb-4 uppercase text-xs"><AutoText text="Về PETROLIMEX Fashion" /></h4>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#" className="hover:text-[#D4AF37]"><AutoText text="Giới Thiệu" /></a></li>
              <li><a href="#" className="hover:text-[#D4AF37]"><AutoText text="Tuyển Dụng" /></a></li>
              <li><a href="#" className="hover:text-[#D4AF37]"><AutoText text="Điều Khoản" /></a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold mb-4 uppercase text-xs"><AutoText text="Thanh Toán" /></h4>
            <div className="flex gap-2 text-md flex-wrap font-bold">
              <span className="border rounded px-2 py-1 text-blue-800">VISA</span>
              <span className="border rounded px-2 py-1 text-orange-600">JCB</span>
              <span className="border rounded px-2 py-1 text-sky-500">ATM</span>
            </div>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold mb-4 uppercase text-xs"><AutoText text="Theo Dõi Chúng Tôi" /></h4>
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
