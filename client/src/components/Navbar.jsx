import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function Navbar() {
  const { user, handleLogout, getCartCount, userRole } = useCart();
  const { wishlist = [] } = useWishlist() || {};
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 shadow-2xl backdrop-blur-md bg-opacity-95">
      {/* Top bar */}
      <div className="border-b border-gray-800/50 py-1.5 bg-black/30">
        <div className="container mx-auto px-4 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <div className="flex gap-6">
            <Link to="/seller/dashboard" className="hover:text-amber-500 transition decoration-amber-500 underline-offset-4">Kênh Người Bán</Link>
            <a href="#" className="hover:text-amber-500 transition">Tải Ứng Dụng</a>
            <div className="flex gap-3">
              <span>Kết nối:</span>
              <a href="#" className="hover:text-amber-500 transition">📘</a>
              <a href="#" className="hover:text-amber-500 transition">📸</a>
            </div>
          </div>
          <div className="flex gap-6 items-center">
            <a href="#" className="flex items-center gap-1 hover:text-amber-500 transition">
              <span role="img" aria-label="notification">🔔</span> Thông Báo
            </a>
            <a href="#" className="flex items-center gap-1 hover:text-amber-500 transition">
              <span role="img" aria-label="support">❓</span> Hỗ Trợ
            </a>
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
                    {user.role !== 'admin' && (
                      <Link to="/followed-shops" className="block px-4 py-2 hover:bg-amber-50 hover:text-amber-600 transition text-[11px] font-black uppercase tracking-widest border-t border-gray-50">Shop Đang Theo Dõi</Link>
                    )}
                    {user.role === 'seller' && (
                      <Link to="/seller/dashboard" className="block px-4 py-2 hover:bg-amber-50 hover:text-amber-600 transition text-[11px] font-black uppercase tracking-widest border-t border-gray-50 text-amber-600">Quản lý Shop</Link>
                    )}
                    {user.role === 'admin' && (
                       <Link to="/admin/dashboard" className="block px-4 py-2 hover:bg-amber-50 hover:text-amber-600 transition text-[11px] font-black uppercase tracking-widest border-t border-gray-50 text-amber-600">Quản lý Website</Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left block px-4 py-2 hover:bg-red-50 hover:text-red-600 transition text-[11px] font-black uppercase tracking-widest border-t border-gray-50">Đăng xuất</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/register" className="font-bold hover:text-amber-500 transition">Đăng Ký</Link>
                <div className="h-4 w-px bg-gray-600"></div>
                <Link to="/login" className="font-bold hover:text-amber-500 transition">Đăng Nhập</Link>
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
        <div className="flex-1 w-full max-w-4xl relative flex flex-col">
          <div className="flex w-full">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              className="w-full bg-white text-gray-900 rounded-l-md px-4 py-2.5 outline-none ring-2 ring-transparent focus:ring-amber-500 shadow-inner"
            />
            <button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-6 rounded-r-md transition flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          <div className="mt-2 text-xs flex gap-3 text-gray-400 overflow-x-auto whitespace-nowrap">
            <a href="#" className="hover:text-amber-500 transition">Váy Nữ</a>
            <a href="#" className="hover:text-amber-500 transition">Áo Thun Mới</a>
            <a href="#" className="hover:text-amber-500 transition">Giày Sneaker</a>
            <a href="#" className="hover:text-amber-500 transition">Túi Đeo Chéo</a>
            <a href="#" className="hover:text-amber-500 transition">Mũ Lưỡi Trai</a>
          </div>
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
