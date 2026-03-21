import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getCartTotal, getCartCount, clearCart, userRole } = useCart();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || userRole !== 'user') {
      navigate('/login');
    }
  }, [userRole, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* HEADER SECTION */}
      <header className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-amber-900/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between text-white">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-3xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600">
              PETROLIMEX
            </div>
            <div className="text-sm font-light uppercase tracking-widest text-amber-500/80">
              Fashion
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-xl font-bold text-amber-500 border-l-2 border-amber-500 pl-4">Giỏ hàng</div>
            <Link to="/cart" className="relative cursor-pointer hover:text-amber-500 transition p-2 block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 5.4a1 1 0 00.97 1.25h11.76a1 1 0 00.97-1.25L17 13M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
              </svg>
              <span className="absolute top-0 -right-1 bg-amber-500 text-gray-900 border-2 border-gray-900 text-[10px] font-extrabold px-1.5 py-0 rounded-full">
                {getCartCount()}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {(userRole === 'admin' || userRole === 'seller') ? (
          <div className="bg-white p-12 rounded-2xl shadow-xl shadow-gray-200/50 text-center mx-auto max-w-lg w-full mt-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 mx-auto text-red-200 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Tài khoản quản trị</h2>
            <p className="text-gray-500 mb-8">Tính năng giỏ hàng và mua sắm chỉ dành riêng cho tài khoản Khách hàng (User).</p>
            <Link to="/" className="inline-block bg-gray-900 text-white font-black tracking-widest uppercase px-8 py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg">
              Vị trí Của Tôi
            </Link>
          </div>
        ) : cart.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-xl shadow-gray-200/50 text-center mx-auto max-w-lg w-full mt-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 mx-auto text-gray-200 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 5.4a1 1 0 00.97 1.25h11.76a1 1 0 00.97-1.25L17 13M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
            </svg>
            <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Giỏ hàng của bạn đang trống</h2>
            <p className="text-gray-500 mb-8">Hãy chọn thêm các sản phẩm tuyệt vời từ cửa hàng của chúng tôi.</p>
            <Link to="/" className="inline-block bg-amber-500 text-gray-900 font-black tracking-widest uppercase px-8 py-4 rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/30">
              Tiếp Tục Mua Sắm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Danh sách sản phẩm */}
            <div className="flex-1 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hidden md:grid grid-cols-12 gap-4 text-sm font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-6">Sản phẩm</div>
                <div className="col-span-2 text-center">Đơn giá</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-2 text-right">Tổng tiền</div>
              </div>

              {cart.map((item, index) => {
                const imgUrl = item.product.images && item.product.images.length > 0 
                  ? `http://localhost:5000${item.product.images[0].url}`
                  : `https://picsum.photos/seed/${item.product._id}/100/100`;

                return (
                  <div key={`${item.product._id}-${item.color}-${item.size}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative">
                    {/* Nút xóa mobile */}
                    <button 
                      onClick={() => removeFromCart(item.product._id, item.color, item.size)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 md:hidden transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    <div className="col-span-1 md:col-span-6 flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                        <img src={imgUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <Link to={`/product/${item.product._id}`} className="font-bold text-gray-800 hover:text-amber-600 line-clamp-2 transition-colors">
                          {item.product.name}
                        </Link>
                          <p className="text-gray-500 text-sm mt-1">
                            Biến thể: <span className="font-bold text-gray-900">{item.color}</span> / <span className="font-bold text-gray-900">{item.size}</span>
                          </p>
                          
                          {/* Shop Information */}
                          {item.product?.shop && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                               <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                  Cung cấp bởi: {item.product.shop.name}
                               </div>
                               <p className="text-[11px] text-gray-500 flex items-start gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                  {item.product.shop.address || 'Địa chỉ đang cập nhật'}
                               </p>
                            </div>
                          )}
                        </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex md:justify-center items-center">
                      <span className="md:hidden font-bold text-gray-500 mr-2 text-sm">Đơn giá:</span>
                      <span className="font-bold text-gray-700">{formatPrice(item.product.price)}</span>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex md:justify-center items-center">
                      <span className="md:hidden font-bold text-gray-500 mr-2 text-sm">Số lượng:</span>
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-9">
                        <button 
                          onClick={() => updateQuantity(item.product._id, item.color, item.size, item.quantity - 1)}
                          className="w-8 h-full bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors"
                        >-</button>
                        <input 
                          type="text" 
                          value={item.quantity} 
                          readOnly 
                          className="w-10 h-full text-center text-sm font-bold text-gray-800 focus:outline-none"
                        />
                        <button 
                          onClick={() => updateQuantity(item.product._id, item.color, item.size, item.quantity + 1)}
                          className="w-8 h-full bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors"
                        >+</button>
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center">
                      <span className="md:hidden font-bold text-gray-500 text-sm">Tổng phụ:</span>
                      <span className="font-black text-amber-600 text-lg">{formatPrice(item.product.price * item.quantity)}</span>
                      {/* Nút xóa desktop */}
                      <button 
                        onClick={() => removeFromCart(item.product._id, item.color, item.size)}
                        className="hidden md:ml-4 md:block text-gray-300 hover:text-red-500 transition-colors p-1"
                        title="Xóa sản phẩm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between mt-4">
                <Link 
                  to="/" 
                  className="text-sm font-bold text-amber-600 flex items-center gap-1 hover:text-amber-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Tiếp Tục Mua Sắm
                </Link>
                <button 
                  onClick={clearCart}
                  className="text-sm font-bold text-gray-500 flex items-center gap-1 hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa tất cả sản phẩm
                </button>
              </div>
            </div>

            {/* Panel Thanh toán */}
            <div className="w-full lg:w-[350px]">
              <div className="bg-white rounded-xl shadow-xl shadow-gray-200/40 border border-amber-100 p-6 sticky top-24">
                <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-wide border-b pb-4">Tóm tắt đơn hàng</h3>
                
                <div className="space-y-4 mb-6 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Tổng tiền hàng</span>
                    <span className="font-semibold text-gray-900">{formatPrice(getCartTotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span className="font-semibold text-gray-900">Tính khi thanh toán</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900 uppercase">Tổng cộng</span>
                    <span className="text-2xl font-black text-amber-600">{formatPrice(getCartTotal())}</span>
                  </div>
                  <p className="text-right text-xs text-gray-400 mt-1">(Đã bao gồm VAT nếu có)</p>
                </div>

                <button 
                  onClick={() => alert("Chức năng thanh toán đang được phát triển")}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black uppercase tracking-widest py-4 rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-[0.98]"
                >
                  Tiến Hành Đặt Hàng
                </button>
                
                <div className="mt-4 flex justify-between items-center text-xs text-gray-500 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    Bảo mật 100%
                  </span>
                  <span>Hoàn trả 7 ngày</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t-4 border-amber-500 py-6 text-center text-gray-500 text-sm mt-auto">
         <p>© 2026 Petrolimex Fashion. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
