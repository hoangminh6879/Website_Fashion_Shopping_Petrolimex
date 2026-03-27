import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import AutoText, { useAutoTranslate } from "./AutoText";
import { useTranslation } from "react-i18next";
import { liveTranslate } from "../i18n";
import api from '../services/api';

export default function Navbar() {
  const { user, handleLogout, getCartCount, userRole } = useCart();
  const { wishlist = [] } = useWishlist() || {};
  const { unreadCount } = useNotifications();
  const { t, i18n } = useTranslation();
  const searchPlaceholder = useAutoTranslate("Tìm kiếm sản phẩm, thương hiệu...");
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filterCat, setFilterCat] = useState('');
  const [filterPrice, setFilterPrice] = useState({ min: '', max: '' });
  const [filterRating, setFilterRating] = useState(0);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(console.error);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.append('search', searchTerm.trim());
    if (filterCat) params.append('category', filterCat);
    if (filterPrice.min) params.append('minPrice', filterPrice.min);
    if (filterPrice.max) params.append('maxPrice', filterPrice.max);
    if (filterRating > 0) params.append('rating', filterRating);
    
    navigate(`/?${params.toString()}`);
    setShowFilter(false);
  };

  const toggleLanguage = () => {
    const isEnglish = i18n.language === 'vi';
    const nextLng = isEnglish ? 'en' : 'vi';
    i18n.changeLanguage(nextLng);
    
    // Phương pháp 2: Gọi trực tiếp từ Google Translate
    setTimeout(() => {
      const gCombo = document.querySelector('.goog-te-combo');
      if (gCombo) {
        gCombo.value = isEnglish ? 'en' : 'vi';
        gCombo.dispatchEvent(new Event('change'));
      } else {
        // Fallback: Nếu widget chưa load kịp, thử lại sau 0.5s
        console.warn("Đang chờ Google Translate tải...");
      }
    }, 300);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 shadow-2xl backdrop-blur-md bg-opacity-95">
      {/* Google Translate Element (Hiển thị để bạn thấy nó đang chạy) */}
      <div className="container mx-auto px-4 py-1 flex justify-end">
        <div id="google_translate_element" className="scale-75 origin-right"></div>
      </div>
      
      {/* Top bar */}
      <div className="border-b border-gray-800/50 py-1.5 bg-black/30">
        <div className="container mx-auto px-4 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <div className="flex gap-6">
            <Link to="/seller/dashboard" className="hover:text-amber-500 transition decoration-amber-500 underline-offset-4">{t('seller_channel')}</Link>
          </div>
          <div className="flex gap-6 items-center">
            <Link to="/notifications" className="flex items-center gap-1 hover:text-amber-500 transition relative">
              <span role="img" aria-label="notification">🔔</span> <AutoText text="Thông báo" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full h-3 w-3 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
            <a href="#" className="flex items-center gap-1 hover:text-amber-500 transition">
              <span role="img" aria-label="support">❓</span> <AutoText text="Hỗ trợ" />
            </a>
            <div className="h-4 w-px bg-gray-700/50 mx-1"></div>
            <button 
              onClick={toggleLanguage} 
              className="group flex items-center gap-1.5 hover:text-white transition-all bg-white/5 px-2.5 py-1 rounded-full border border-white/10 hover:border-amber-500/50"
              title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            >
              {i18n.language === 'vi' ? (
                <>
                  <img src="https://flagcdn.com/w20/vn.png" className="w-4 h-auto shadow-sm" alt="VN Flag" />
                  <span className="text-[9px] font-black text-gray-300 group-hover:text-amber-500 transition">VN</span>
                </>
              ) : (
                <>
                  <img src="https://flagcdn.com/w20/us.png" className="w-4 h-auto shadow-sm" alt="US Flag" />
                  <span className="text-[9px] font-black text-gray-300 group-hover:text-amber-500 transition">EN</span>
                </>
              )}
            </button>
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 hover:text-amber-500 transition py-1">
                  <img
                    src={user && user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`) : `https://ui-avatars.com/api/?name=${user?.name || 'Guest'}&background=f59e0b&color=fff`}
                    className="w-5 h-5 rounded-full border border-amber-500/50 object-cover"
                    alt="avatar"
                  />
                  <span className="font-bold text-gray-200">{user.name}</span>
                </button>
                <div className="absolute right-0 top-full pt-1 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60]">
                  <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-1.5 text-gray-800 overflow-hidden mt-1">
                    <Link to="/profile" className="block px-4 py-2 hover:bg-amber-50 hover:text-amber-600 transition text-[11px] font-black uppercase tracking-widest">Tài khoản</Link>
                    <Link to="/order-history" className="block px-4 py-2 hover:bg-amber-50 hover:text-amber-600 transition text-[11px] font-black uppercase tracking-widest border-t border-gray-50">Lịch sử giao dịch</Link>
                    {user.role !== 'admin' && (
                      <Link to="/followed-shops" className="block px-4 py-2 hover:bg-amber-50 hover:text-amber-600 transition text-[11px] font-black uppercase tracking-widest border-t border-gray-50">{t('followed_shops')}</Link>
                    )}
                    {user.role === 'seller' && (
                      <Link to="/seller/dashboard" className="block px-4 py-2 hover:bg-amber-50 hover:text-amber-600 transition text-[11px] font-black uppercase tracking-widest border-t border-gray-50 text-amber-600">{t('manage_shop')}</Link>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin/dashboard" className="block px-4 py-2 hover:bg-amber-50 hover:text-amber-600 transition text-[11px] font-black uppercase tracking-widest border-t border-gray-50 text-amber-600">Quản lý Website</Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left block px-4 py-2 hover:bg-red-50 hover:text-red-600 transition text-[11px] font-black uppercase tracking-widest border-t border-gray-50 uppercase tracking-widest">{t('logout')}</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/register" className="font-bold hover:text-amber-500 transition">{t('register')}</Link>
                <div className="h-4 w-px bg-gray-600"></div>
                <Link to="/login" className="font-bold hover:text-amber-500 transition">{t('login')}</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 text-white">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="text-3xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600 group-hover:brightness-125 transition-all">
            PETROLIMEX
          </div>
          <div className="text-sm font-light uppercase tracking-widest text-amber-500/80 group-hover:text-amber-400 transition-all">
            Fashion
          </div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 w-full max-w-4xl relative flex flex-col pt-1">
          <form onSubmit={handleSearch} className="flex w-full relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-4 pr-32 rounded-lg bg-white border-2 border-transparent focus:border-[#D4AF37] focus:outline-none text-sm font-medium transition-all text-gray-900 shadow-sm"
              placeholder={searchPlaceholder}
            />
            {/* Filter Toggle Button */}
            <button 
              type="button" 
              onClick={() => setShowFilter(!showFilter)} 
              className="absolute right-14 top-1 bottom-1 px-4 text-gray-500 hover:text-[#D4AF37] border-l border-gray-200 transition-colors bg-white flex items-center justify-center cursor-pointer z-10"
              title="Bộ lọc nâng cao"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
            {/* Search Submit Button */}
            <button type="submit" className="absolute right-1 top-1 bottom-1 px-4 bg-[#D4AF37] hover:bg-[#B8860B] transition rounded-md text-black flex items-center justify-center z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
            
            {/* Dropdown Filter */}
            {showFilter && (
              <div className="absolute top-14 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 p-5 z-50 text-gray-800 animate-[fadeInUp_0.2s_ease-out]">
                <h3 className="font-bold text-sm uppercase tracking-widest text-[#D4AF37] mb-4 border-b pb-2">Bộ Lọc Tìm Kiếm</h3>
                
                {/* Categories */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Danh Mục</label>
                  <select 
                    value={filterCat} 
                    onChange={e => setFilterCat(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                
                {/* Price Range */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Khoảng Giá (VNĐ)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Từ" value={filterPrice.min} onChange={e => setFilterPrice({...filterPrice, min: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <span className="text-gray-400">-</span>
                    <input type="number" placeholder="Đến" value={filterPrice.max} onChange={e => setFilterPrice({...filterPrice, max: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                </div>
                
                {/* Rating */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Đánh Giá</label>
                  <select 
                    value={filterRating} 
                    onChange={e => setFilterRating(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value={0}>Tất cả đánh giá</option>
                    <option value={5}>Từ 5 Sao</option>
                    <option value={4}>Từ 4 Sao</option>
                    <option value={3}>Từ 3 Sao</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setFilterCat(''); setFilterPrice({min:'', max:''}); setFilterRating(0); }} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 transition">Làm Mới</button>
                  <button type="button" onClick={handleSearch} className="flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg text-sm font-bold hover:bg-[#B8860B] transition shadow-md shadow-[#D4AF37]/20">Áp dụng</button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Wishlist & Cart Icons */}
        {userRole === 'user' && (
          <div className="flex items-center gap-4">
            <Link to="/wishlist" className="relative cursor-pointer hover:text-red-500 transition p-2 block group/icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlist && wishlist.length > 0 && (
                <span className="absolute top-0 -right-1 bg-red-500 text-white border-2 border-gray-900 text-[10px] font-extrabold px-1.5 py-0 rounded-full group-hover/icon:scale-110 transition-transform">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative cursor-pointer hover:text-amber-500 transition p-2 block group/icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 5.4a1 1 0 00.97 1.25h11.76a1 1 0 00.97-1.25L17 13M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
              </svg>
              <span className="absolute top-0 -right-1 bg-amber-500 text-gray-900 border-2 border-gray-900 text-[10px] font-extrabold px-1.5 py-0 rounded-full group-hover/icon:scale-110 transition-transform">
                {getCartCount()}
              </span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
