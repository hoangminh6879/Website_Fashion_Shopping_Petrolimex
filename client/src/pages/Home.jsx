import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  // Sample data to mimic a Shopee-like store
  const categories = [
    { name: 'Thời Trang Nam', icon: '👕' },
    { name: 'Thời Trang Nữ', icon: '👗' },
    { name: 'Đồng Hồ', icon: '⌚' },
    { name: 'Giày Dép', icon: '👟' },
    { name: 'Túi Xách', icon: '👜' },
    { name: 'Phụ Kiện', icon: '💍' },
    { name: 'Mỹ Phẩm', icon: '💄' },
    { name: 'Nước Hoa', icon: '✨' },
  ];

  const products = Array(12).fill(null).map((_, idx) => ({
    id: idx,
    title: `Sản phẩm thời trang cao cấp kiểu dáng mới ${idx + 1}`,
    price: `${(Math.random() * 5 + 1).toFixed(1)}00.000₫`,
    sold: Math.floor(Math.random() * 500) + 10,
    image: `https://picsum.photos/seed/${idx + 100}/300/300`, // Random placeholder images
  }));

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      {/* HEADER SECTION (Black & Gold) */}
      <header className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-amber-900/50 sticky top-0 z-50">
        {/* Top Navbar */}
        <div className="container mx-auto px-4 py-1 flex justify-between items-center text-xs text-gray-300">
          <div className="flex gap-4">
            <a href="#" className="hover:text-amber-500 transition">Kênh Người Bán</a>
            <a href="#" className="hover:text-amber-500 transition">Tải ứng dụng</a>
            <a href="#" className="hover:text-amber-500 transition">Kết nối</a>
          </div>
          <div className="flex gap-4 items-center">
            <a href="#" className="flex items-center gap-1 hover:text-amber-500 transition">
              <span role="img" aria-label="notification">🔔</span> Thông Báo
            </a>
            <a href="#" className="flex items-center gap-1 hover:text-amber-500 transition">
              <span role="img" aria-label="support">❓</span> Hỗ Trợ
            </a>
            <Link to="/register" className="font-bold hover:text-amber-500 transition">Đăng Ký</Link>
            <div className="h-4 w-px bg-gray-600"></div>
            <Link to="/login" className="font-bold hover:text-amber-500 transition">Đăng Nhập</Link>
          </div>
        </div>

        {/* Main Header */}
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 text-white">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-3xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600">
              PETROLIMEX
            </div>
            <div className="text-sm font-light uppercase tracking-widest text-amber-500/80">
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

          {/* Cart Icon */}
          <div className="relative cursor-pointer hover:text-amber-500 transition p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 5.4a1 1 0 00.97 1.25h11.76a1 1 0 00.97-1.25L17 13M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
            </svg>
            <span className="absolute top-0 -right-1 bg-amber-500 text-gray-900 border-2 border-gray-900 text-[10px] font-extrabold px-1.5 py-0 rounded-full">
              3
            </span>
          </div>
        </div>
      </header>

      {/* BANNER SECTION */}
      <section className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-4">
        {/* Main Banner */}
        <div className="w-full lg:w-2/3 h-64 md:h-80 bg-gradient-to-br from-gray-900 to-black rounded-lg relative overflow-hidden shadow-md">
          <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-gradient-to-tr from-amber-600 to-black"></div>
          <div className="absolute inset-y-0 left-0 p-8 flex flex-col justify-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">Mùa Lễ Hội <br/><span className="text-amber-500 drop-shadow-lg">Giảm Giá Lên Đến 50%</span></h2>
            <p className="text-gray-300 mb-6 drop-shadow-md">Trải nghiệm những thiết kế sang trọng nhất</p>
            <button className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-6 py-2.5 rounded-sm w-max transition shadow-lg shadow-amber-500/20">
              Khám Phá Ngay
            </button>
          </div>
        </div>
        
        {/* Extra Banners */}
        <div className="w-full lg:w-1/3 flex flex-row lg:flex-col gap-4">
          <div className="flex-1 lg:h-1/2 bg-gray-800 rounded-lg overflow-hidden relative shadow-sm group border border-gray-200/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-700 opacity-80 transition group-hover:scale-105 duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
              <span className="text-amber-500 font-bold text-sm bg-black/40 w-max px-2 py-0.5 rounded">🎫 Voucher Mới</span>
              <span className="text-white text-lg font-semibold mt-1">Deal Thời Trang Nam</span>
            </div>
          </div>
          <div className="flex-1 lg:h-1/2 bg-gray-800 rounded-lg overflow-hidden relative shadow-sm group border border-gray-200/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-900 to-gray-900 opacity-60 transition group-hover:scale-105 duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
              <span className="text-amber-500 font-bold text-sm bg-black/40 w-max px-2 py-0.5 rounded">🚚 Giao Siêu Tốc</span>
              <span className="text-white text-lg font-semibold mt-1">Dành cho đơn từ 0Đ</span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="container mx-auto px-4 mt-8">
        <div className="bg-white rounded-sm shadow-sm">
          <div className="p-4 border-b border-gray-100 uppercase text-gray-500 font-semibold tracking-wide">
            Danh Mục
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-8 p-4 gap-4 text-center">
            {categories.map((cat, index) => (
              <a href="#" key={index} className="flex flex-col items-center gap-2 hover:transform hover:-translate-y-1 transition duration-300 group">
                <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-3xl group-hover:border-amber-500 group-hover:shadow-md transition">
                  {cat.icon}
                </div>
                <span className="text-sm text-gray-700 group-hover:text-amber-600 font-medium">{cat.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FLASH SALE / HOT DEALS */}
      <section className="container mx-auto px-4 mt-8">
        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h2 className="text-2xl font-black italic tracking-wider text-amber-500 drop-shadow-sm flex items-center gap-2">
                FLA<span className="text-gray-900">SH</span> SALE
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </h2>
              <div className="flex items-center gap-1">
                <span className="bg-gray-900 text-white px-2 py-1 rounded text-sm font-bold">02</span>
                <span className="font-bold text-gray-400">:</span>
                <span className="bg-gray-900 text-white px-2 py-1 rounded text-sm font-bold">14</span>
                <span className="font-bold text-gray-400">:</span>
                <span className="bg-gray-900 text-white px-2 py-1 rounded text-sm font-bold">59</span>
              </div>
            </div>
            <a href="#" className="text-sm flex items-center text-amber-600 hover:text-amber-700 hover:underline">
               Xem tất cả &gt;
            </a>
          </div>
          {/* Sale items slice */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 p-4 gap-4">
            {products.slice(0, 6).map((product) => (
              <div key={`flash-${product.id}`} className="flex flex-col relative group cursor-pointer hover:-translate-y-1 transition">
                <div className="relative overflow-hidden aspect-square mb-2 bg-gray-100">
                  <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Flash Sale Item" />
                  <div className="absolute top-0 right-0 bg-yellow-400/90 text-yellow-900 text-xs font-bold px-2 py-1 flex flex-col items-center">
                    <span className="text-[10px] leading-tight text-yellow-800">Giảm</span>
                    <span>40%</span>
                  </div>
                </div>
                <div className="text-center font-bold text-amber-600 text-lg">{product.price}</div>
                <div className="mt-1 w-full bg-amber-200/50 rounded-full h-4 relative overflow-hidden text-[10px] text-white font-bold flex items-center justify-center">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-amber-600" style={{width: '60%'}}></div>
                  <span className="relative z-10 drop-shadow-md">ĐÃ BÁN {product.sold}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT FEED (Gợi Ý Hôm Nay) */}
      <section className="container mx-auto px-4 mt-8 pb-12">
        <h2 className="text-lg font-bold bg-white text-amber-500 border-b-4 border-amber-500 inline-block px-8 py-4 mb-4 uppercase tracking-wide shadow-sm">
          Gợi Ý Hôm Nay
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {products.map((product) => (
            <div key={product.id} className="bg-white border-2 border-transparent hover:border-amber-500 hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col">
              <div className="w-full aspect-square bg-gray-100 overflow-hidden relative">
                <img src={product.image} alt="Product" className="w-full h-full object-cover" />
                {/* Find similar overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-4">
                  <button className="bg-amber-500 text-white font-semibold py-1.5 px-4 rounded text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all border border-amber-400">Từ Tương Tự</button>
                </div>
              </div>
              <div className="p-2 flex-1 flex flex-col">
                <h3 className="text-[13px] text-gray-800 line-clamp-2 leading-snug mb-2 font-medium">
                  {product.title}
                </h3>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-amber-500 font-semibold">{product.price}</span>
                  <span className="text-[11px] text-gray-500">Đã bán {product.sold}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button className="bg-white border hover:bg-gray-50 border-gray-300 text-gray-600 font-medium py-2.5 px-20 border-b-2 rounded-sm shadow-sm transition">
            Xem Thêm
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t-4 border-amber-500 text-sm mt-auto pt-10 pb-6 text-gray-600">
        <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-gray-900 font-bold mb-4 uppercase text-xs">Chăm Sóc Khách Hàng</h4>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#" className="hover:text-amber-500 transition">Trung Tâm Trợ Giúp</a></li>
              <li><a href="#" className="hover:text-amber-500 transition">Petrolimex Fashion Blog</a></li>
              <li><a href="#" className="hover:text-amber-500 transition">Shopee Mall</a></li>
              <li><a href="#" className="hover:text-amber-500 transition">Hướng Dẫn Mua Hàng</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold mb-4 uppercase text-xs">Về Petrolimex Fashion</h4>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#" className="hover:text-amber-500 transition">Giới Thiệu</a></li>
              <li><a href="#" className="hover:text-amber-500 transition">Tuyển Dụng</a></li>
              <li><a href="#" className="hover:text-amber-500 transition">Điều Khoản</a></li>
              <li><a href="#" className="hover:text-amber-500 transition">Chính Sách Bảo Mật</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold mb-4 uppercase text-xs">Thanh Toán</h4>
            <div className="flex gap-2 text-md flex-wrap">
              <span className="border rounded px-2 py-1 text-blue-800 font-bold shadow-sm">VISA</span>
              <span className="border rounded px-2 py-1 text-orange-600 font-bold shadow-sm">JCB</span>
              <span className="border rounded px-2 py-1 text-sky-500 font-bold shadow-sm">ATM</span>
            </div>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold mb-4 uppercase text-xs">Theo Dõi Chúng Tôi Trên</h4>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#" className="hover:text-amber-500 transition flex items-center gap-2"><span role="img" aria-label="fb">📘</span> Facebook</a></li>
              <li><a href="#" className="hover:text-amber-500 transition flex items-center gap-2"><span role="img" aria-label="ig">📸</span> Instagram</a></li>
              <li><a href="#" className="hover:text-amber-500 transition flex items-center gap-2"><span role="img" aria-label="in">💼</span> LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 text-center border-t border-gray-200 pt-6 text-gray-500">
          <p>© 2026 Petrolimex Fashion. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
