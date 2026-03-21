import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function Home() {
  const { addToCart, getCartCount, userRole } = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productGroupMap, setProductGroupMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productVariants, setProductVariants] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // User selection states
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.reload();
  };

  const openProductModal = async (productInfo) => {
    setIsModalOpen(true);
    setLoadingModal(true);
    setSelectedColor('');
    setSelectedSize('');
    setProductVariants([]);
    setSelectedProduct(null);

    try {
      const idsToFetch = productGroupMap[productInfo.name] || [productInfo._id];
      const promises = idsToFetch.map(id => api.get(`/products/${id}`));
      const responses = await Promise.all(promises);

      let allVariants = [];
      let mainProduct = null;
      responses.forEach(res => {
        const prodData = res.data.product || res.data;
        if (!mainProduct) mainProduct = prodData;

        const vars = res.data.variants || [];
        if (vars.length > 0) {
          allVariants = [...allVariants, ...vars];
        }
      });

      const uniqueVariants = [];
      const seenVariant = new Set();
      allVariants.forEach(v => {
        const key = `${v.color}-${v.size}`;
        if (!seenVariant.has(key)) {
          seenVariant.add(key);
          uniqueVariants.push(v);
        }
      });

      setSelectedProduct(mainProduct);
      setProductVariants(uniqueVariants);

      if (uniqueVariants.length > 0) {
        setSelectedColor(uniqueVariants[0].color);
        setSelectedSize(uniqueVariants[0].size);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoadingModal(false);
    }
  };

  const currentVariant = productVariants.find(v => v.color === selectedColor && v.size === selectedSize);

  const displayPrice = selectedProduct?.price > 0
    ? selectedProduct.price
    : (currentVariant ? currentVariant.price : (productVariants.length > 0 ? productVariants[0].price : 0));

  const uniqueColors = selectedProduct?.colors?.length > 0
    ? selectedProduct.colors
    : [...new Set(productVariants.map(v => v.color))];

  const uniqueSizes = selectedProduct?.sizes?.length > 0
    ? selectedProduct.sizes
    : [...new Set(productVariants.map(v => v.size))];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  // Tính toán số lượng tồn kho theo biến thể
  const getSelectedStock = () => {
    if (!selectedProduct) return 0;
    
    // Nếu có productVariants (hệ thống cũ)
    if (productVariants.length > 0) {
      if (currentVariant) return currentVariant.stock;
      return productVariants[0].stock;
    }

    // Hệ thống mới: stock là mảng trong product
    if (!Array.isArray(selectedProduct.stock) || selectedProduct.stock.length === 0) {
      return Number(selectedProduct.stock) || 0;
    }

    if (!selectedColor || !selectedSize) return selectedProduct.stock[0] || 0;
    
    const colorIdx = (selectedProduct.colors || []).indexOf(selectedColor);
    const sizeIdx = (selectedProduct.sizes || []).indexOf(selectedSize);
    
    if (colorIdx === -1 || sizeIdx === -1) return selectedProduct.stock[0] || 0;
    
    const index = colorIdx * (selectedProduct.sizes?.length || 0) + sizeIdx;
    return selectedProduct.stock[index] || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10 relative">
      {/* HEADER SECTION (Black & Gold) */}
      <header className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-amber-900/50 sticky top-0 z-50">
        {/* Top Navbar */}
        <div className="container mx-auto px-4 py-1 flex justify-between items-center text-xs text-gray-300">
          <div className="flex gap-4">
            <Link to={user ? (user.role === 'seller' ? "/seller/dashboard" : "/profile") : "/login"} className="hover:text-amber-500 transition">Kênh Người Bán</Link>
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
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 hover:text-amber-500 transition py-1">
                  <img 
                    src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`) : `https://ui-avatars.com/api/?name=${user.name}&background=f59e0b&color=fff`} 
                    className="w-5 h-5 rounded-full border border-amber-500/50 object-cover" 
                    alt="avatar" 
                  />
                  <span className="font-bold">{user.name}</span>
                </button>
                <div className="absolute right-0 top-full pt-1 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60]">
                  <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-1.5 text-gray-800 overflow-hidden mt-1">
                    <Link to="/profile" className="block px-4 py-2 hover:bg-amber-50 hover:text-amber-600 transition text-[11px] font-black uppercase tracking-widest">Tài khoản</Link>
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
          {userRole === 'user' && (
            <Link to="/cart" className="relative cursor-pointer hover:text-amber-500 transition p-2 block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 5.4a1 1 0 00.97 1.25h11.76a1 1 0 00.97-1.25L17 13M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
              </svg>
              <span className="absolute top-0 -right-1 bg-amber-500 text-gray-900 border-2 border-gray-900 text-[10px] font-extrabold px-1.5 py-0 rounded-full">
                {getCartCount()}
              </span>
            </Link>
          )}
        </div>
      </header>

      {/* BANNER SECTION */}
      <section className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-4">
        {/* Main Banner */}
        <div className="w-full lg:w-2/3 h-64 md:h-80 bg-gradient-to-br from-gray-900 to-black rounded-lg relative overflow-hidden shadow-md">
          <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-gradient-to-tr from-amber-600 to-black"></div>
          <div className="absolute inset-y-0 left-0 p-8 flex flex-col justify-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">Mùa Lễ Hội <br /><span className="text-amber-500 drop-shadow-lg">Giảm Giá Lên Đến 50%</span></h2>
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <h2 className="uppercase text-gray-800 font-bold tracking-wide text-lg flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full inline-block"></span>
              Danh Mục Sản Phẩm
            </h2>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-6 border-l border-t border-gray-100">
            {categories.length > 0 ? categories.map((cat) => (
              <a href="#" key={cat._id} className="flex flex-col items-center gap-3 p-5 border-r border-b border-gray-100 hover:bg-gray-50 hover:shadow-[inset_0_0_10px_rgba(0,0,0,0.02)] transition-all duration-300 group">
                <div className="w-[85px] h-[85px] rounded-full overflow-hidden bg-gray-50 border-2 border-transparent group-hover:border-amber-400 p-0.5 transition-all duration-300 group-hover:shadow-md transform group-hover:-translate-y-1">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img src={`https://picsum.photos/seed/${cat._id}/150/150`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={cat.name} />
                  </div>
                </div>
                <span className="text-sm text-gray-700 text-center group-hover:text-amber-600 font-medium line-clamp-2 leading-tight h-10">{cat.name}</span>
              </a>
            )) : (
              <div className="col-span-full p-8 text-center text-gray-500">Đang cập nhật danh mục...</div>
            )}
          </div>
        </div>
      </section>

      {/* PRODUCT FEED (Gợi Ý Hôm Nay) */}
      <section className="container mx-auto px-4 mt-8 pb-12">
        <div className="bg-white rounded-t-xl overflow-hidden shadow-sm flex items-center border-b-2 border-amber-500 mb-4 sticky top-16 z-40">
          <div className="bg-white text-amber-500 text-center font-bold px-8 py-4 uppercase tracking-wide flex-1 md:flex-none border-b-4 border-amber-500">
            Gợi Ý Hôm Nay
          </div>
          <div className="hidden md:block flex-1 border-b-4 border-transparent"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4">
          {products.length > 0 ? products.map((product) => (
            <div key={product._id} onClick={() => openProductModal(product)} className="bg-white rounded-lg border border-gray-100 hover:border-amber-400 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 group cursor-pointer flex flex-col overflow-hidden relative">
              <div className="w-full aspect-square bg-gray-50 overflow-hidden relative">
                <img src={product.images && product.images.length > 0 ? `http://localhost:5000${product.images[0].url}` : `https://picsum.photos/seed/${product._id}/400/400`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                {/* Find similar overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-3 z-20">
                  <button className="bg-amber-500 text-gray-900 font-semibold py-1.5 px-6 rounded-full text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all border border-amber-400 hover:bg-amber-400">Chọn Loại</button>
                </div>

                {/* Badges top */}
                <div className="absolute top-0 left-0 flex flex-col gap-1 w-full p-0 z-30">
                  <div className="flex justify-between w-full relative">
                    <div className="flex flex-col gap-1 items-start relative left-[-2px] mt-2">
                      <div className="bg-gradient-to-r from-[#d0011b] to-[#f53d2d] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-r-sm shadow-sm relative after:content-[''] after:absolute after:-bottom-[3px] after:left-0 after:border-t-[#960011] after:border-r-transparent after:border-l-transparent after:border-b-transparent after:border-t-[3px] after:border-r-[3px] flex items-center gap-0.5">
                        MALL
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Overlay image banner (Freeship/Hoàn xu imitation) */}
                <div className="absolute bottom-0 left-0 w-full h-5 z-10 flex">
                  <div className="h-full px-2 text-[10px] font-bold text-white flex items-center bg-gradient-to-r from-orange-500 to-amber-500 rounded-tr-xl shadow-sm">
                    Freeship Xtra
                  </div>
                </div>
              </div>

              <div className="p-2.5 flex-1 flex flex-col z-10 bg-white">
                <h3 className="text-[12.5px] text-gray-800 line-clamp-2 leading-[1.35] mb-2 font-medium group-hover:text-amber-600 transition-colors">
                  {product.name}
                </h3>

                <div className="flex items-center gap-1 mb-2 mt-auto">
                  <span className="text-[10px] border border-amber-500 text-amber-500 px-1 rounded-sm leading-tight">Hoàn Xu</span>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline text-amber-600">
                    <span className="text-sm font-bold">Tùy Chọn</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-0.5 text-[10px] text-yellow-400">
                    {'★'.repeat(Math.round(product.rating || 5))}
                    {'★'.repeat(5 - Math.round(product.rating || 5)).replace(/★/g, '☆')}
                    <span className="text-[10px] text-gray-500 ml-0.5">({product.rating || 5})</span>
                  </div>
                  <span className="text-[11px] text-gray-600">Đã bán {Math.floor(Math.random() * 500) + 10}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full p-8 text-center text-gray-500">Đang cập nhật sản phẩm...</div>
          )}
        </div>

        {products.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-32 rounded-sm shadow-sm border border-gray-200 hover:border-gray-300 transition duration-300 text-sm z-10 relative overflow-hidden group">
              <span className="relative z-10 block transition-transform group-hover:scale-105">Xem Thêm</span>
            </button>
          </div>
        )}
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

      {/* QUICK VIEW & ADD TO CART MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative flex flex-col md:flex-row animate-[fadeIn_0.3s_ease-out]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {loadingModal ? (
              <div className="p-20 w-full flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
              </div>
            ) : selectedProduct && (
              <>
                {/* Left: Image */}
                <div className="w-full md:w-1/2 bg-gray-100 flex flex-col items-center justify-center p-8 border-r border-gray-100">
                  <img
                    src={selectedProduct.images && selectedProduct.images.length > 0 ? `http://localhost:5000${selectedProduct.images[0].url}` : `https://picsum.photos/seed/${selectedProduct._id}/400/400`}
                    alt={selectedProduct.name}
                    className="w-full max-w-sm aspect-square object-cover rounded-lg shadow-sm bg-white"
                  />
                  <div className="mt-4 text-gray-500 text-sm px-4 text-center">
                    {selectedProduct.description}
                  </div>
                </div>
                {/* Right: Details */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="bg-[#d0011b] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">MALL</span>
                    <span className="text-gray-500 text-sm">Cung cấp bởi: <span className="text-amber-600 font-semibold">{selectedProduct.shop?.name || 'Shop Của Tôi'}</span></span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 leading-tight">{selectedProduct.name}</h2>

                  <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
                    <div className="flex items-end gap-3">
                      <span className="text-3xl font-bold text-amber-600">
                        {formatPrice(displayPrice)}
                      </span>
                      {!currentVariant && productVariants.length > 0 && (
                        <span className="text-sm text-gray-500 pb-1"> (Chọn loại để xem chi tiết)</span>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="mb-6 flex-1">
                    {/* Color */}
                    {uniqueColors.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-gray-700 font-semibold mb-2 text-sm uppercase">Màu Sắc</h4>
                        <div className="flex flex-wrap gap-2">
                          {uniqueColors.map(color => (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`px-4 py-2 border rounded-md text-sm transition-all ${selectedColor === color ? 'border-amber-500 text-amber-600 bg-amber-50 font-bold shadow-sm' : 'border-gray-200 text-gray-700 hover:border-amber-300'}`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Size */}
                    {uniqueSizes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-gray-700 font-semibold mb-2 text-sm uppercase">Kích Cỡ</h4>
                        <div className="flex flex-wrap gap-2">
                          {uniqueSizes.map(size => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`px-4 py-2 border rounded-md text-sm transition-all ${selectedSize === size ? 'border-amber-500 text-amber-600 bg-amber-50 font-bold shadow-sm' : 'border-gray-200 text-gray-700 hover:border-amber-300'}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stock status */}
                    <div className="text-sm mt-4 text-gray-600 min-h-[1.5rem] font-medium">
                      <span>Tồn kho: <span className="font-bold text-gray-900">{getSelectedStock()}</span> sản phẩm</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 mt-auto pt-4 border-t border-gray-100">
                    {userRole === 'admin' || userRole === 'seller' ? (
                      <div className="w-full text-center py-3 bg-red-50 text-red-500 font-bold rounded-md border border-red-200">
                        🛒 Tính năng mua sắm chỉ dành cho khách hàng.
                      </div>
                    ) : (
                      <>
                        <button
                          className="flex-1 border-2 border-amber-500 bg-amber-50 text-amber-600 flex items-center justify-center gap-2 font-bold py-3 rounded-md hover:bg-amber-100 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={uniqueColors.length > 0 && uniqueSizes.length > 0 && (!selectedColor || !selectedSize)}
                          onClick={() => {
                            addToCart(selectedProduct, selectedColor, selectedSize, 1);
                            alert('Đã thêm vào giỏ hàng!');
                            setIsModalOpen(false);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 5.4a1 1 0 00.97 1.25h11.76a1 1 0 00.97-1.25L17 13M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" /></svg>
                          Thêm Vào Giỏ
                        </button>
                        <button
                          className="flex-1 bg-amber-500 text-white font-bold py-3 rounded-md hover:bg-amber-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={uniqueColors.length > 0 && uniqueSizes.length > 0 && (!selectedColor || !selectedSize)}
                          onClick={() => alert('Tiến hành thanh toán...')}
                        >
                          Mua Ngay
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
