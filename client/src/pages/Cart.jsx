import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, updateVariant, getCartTotal, getCartCount, clearCart, userRole } = useCart();
  const [editingItem, setEditingItem] = React.useState(null); // {productId, color, size}
  const [editForm, setEditForm] = React.useState({ color: '', size: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || (userRole !== 'user' && userRole !== 'guest')) {
      // If userRole is guest, it's fine for now, but usually we want 'user'
      // Based on previous rules, only 'user' role can cart. 
      if (userRole === 'admin' || userRole === 'seller') {
        // Stay on page but show blocked UI
      } else if (!token) {
        navigate('/login');
      }
    }
  }, [userRole, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const getEditStock = () => {
    if (!editingItem || !editingItem.product) return 0;
    const { product } = editingItem;
    const colorIdx = (product.colors || []).indexOf(editForm.color);
    const sizeIdx = (product.sizes || []).indexOf(editForm.size);
    if (colorIdx === -1 || sizeIdx === -1) return 0;
    const index = colorIdx * (product.sizes?.length || 0) + sizeIdx;
    return product.stock[index] || 0;
  };

  const getVariantImage = (item) => {
    const { product, color, size } = item;
    if (!product) return null;

    // 🔥 Check variantImages array (Old system)
    if (product.variantImages && product.variantImages.length > 0) {
      const colorIdx = (product.colors || []).indexOf(color);
      const sizeIdx = (product.sizes || []).indexOf(size);
      if (colorIdx !== -1 && sizeIdx !== -1) {
        const index = colorIdx * (product.sizes?.length || 0) + sizeIdx;
        const vImg = product.variantImages[index];
        if (vImg) {
          return vImg.startsWith('http') ? vImg : `http://localhost:5000${vImg}`;
        }
      }
    }

    // 🔥 Fallback to first image
    if (product.images && product.images.length > 0) {
      const firstImg = product.images[0].url;
      return firstImg.startsWith('http') ? firstImg : `http://localhost:5000${firstImg}`;
    }

    return `https://picsum.photos/seed/${product._id}/200/200`;
  };

  const handleRemove = (productId, color, size) => {
    Swal.fire({
      title: 'Xác nhận xóa?',
      text: "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        removeFromCart(productId, color, size);
        Swal.fire({
          icon: 'success',
          title: 'Đã xóa!',
          timer: 800,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  };

  const handleClearCart = () => {
    Swal.fire({
      title: 'Dọn dẹp giỏ hàng?',
      text: "Tất cả sản phẩm sẽ bị xóa khỏi giỏ hàng của bạn.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#9ca3af',
      cancelButtonColor: '#f59e0b',
      confirmButtonText: 'Xóa tất cả',
      cancelButtonText: 'Giữ lại'
    }).then((result) => {
      if (result.isConfirmed) {
        clearCart();
        Swal.fire({
          icon: 'success',
          title: 'Giỏ hàng đã trống',
          timer: 1000,
          showConfirmButton: false
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col font-sans">
      <Navbar />

      {/* MAIN CONTENT */}
      <main className="flex-1 container mx-auto px-4 py-8 mt-44">
        {(userRole === 'admin' || userRole === 'seller') ? (
          <div className="bg-white p-12 rounded-[2rem] shadow-2xl shadow-gray-200/50 text-center mx-auto max-w-lg w-full mt-8 border border-gray-100">
            <div className="text-6xl mb-6">🚫</div>
            <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight uppercase italic">Tài khoản hạn chế</h2>
            <p className="text-gray-500 mb-8 font-medium">Tính năng mua sắm chỉ dành riêng cho tài khoản Khách hàng.</p>
            <Link to="/" className="inline-block bg-gray-900 text-white font-black tracking-widest uppercase px-10 py-4 rounded-2xl hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl">
              Về Trang Chủ
            </Link>
          </div>
        ) : cart.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] shadow-2xl shadow-gray-200/50 text-center mx-auto max-w-2xl w-full mt-12 border border-gray-100 animate-fadeIn">
            <div className="text-8xl mb-10 opacity-20">🛒</div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase italic">Giỏ hàng đang trống</h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-12">Hãy lấp đầy nó bằng những món đồ thời thượng nhất</p>
            <Link to="/" className="inline-block bg-gradient-to-r from-gray-900 to-black text-amber-500 font-black tracking-widest uppercase px-12 py-5 rounded-3xl hover:from-amber-500 hover:to-amber-500 hover:text-gray-900 transition-all shadow-2xl shadow-gray-300">
              Khám Phá Ngay
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Danh sách sản phẩm */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase">Giỏ <span className="text-amber-500">Hàng</span></h1>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">{getCartCount()} Sản phẩm</span>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 hidden md:grid grid-cols-12 gap-4 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                <div className="col-span-5 pl-4">Thông tin sản phẩm</div>
                <div className="col-span-2 text-center">Đơn giá</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-3 text-right pr-4">Tổng cộng</div>
              </div>

              {cart.map((item) => (
                <div key={`${item.product._id}-${item.color}-${item.size}`} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative hover:shadow-xl hover:shadow-gray-100 transition-all group">
                  {/* Nút xóa mobile */}
                  <button
                    onClick={() => handleRemove(item.product._id, item.color, item.size)}
                    className="absolute top-6 right-6 text-gray-200 hover:text-red-500 md:hidden transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>

                  <div className="col-span-1 md:col-span-5 flex gap-8">
                    <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100 shadow-inner">
                      <img src={getVariantImage(item)} alt={item.product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    <div className="flex flex-col justify-center space-y-3">
                      <Link to={`/product/${item.product._id}`} className="text-xl font-black text-gray-900 hover:text-amber-500 line-clamp-1 transition-colors uppercase tracking-tight">
                        {item.product.name}
                      </Link>
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-wider border border-gray-100">
                          Màu: <span className="text-gray-900">{item.color}</span>
                        </div>
                        <div className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-wider border border-gray-100">
                          Size: <span className="text-gray-900">{item.size}</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingItem({ productId: item.product._id, color: item.color, size: item.size, product: item.product });
                            setEditForm({ color: item.color, size: item.size });
                          }}
                          className="text-amber-500 hover:text-amber-600 text-[9px] font-black uppercase underline tracking-widest ml-1 transition-colors"
                        >
                          Thay đổi
                        </button>
                      </div>

                      {editingItem && editingItem.productId === item.product._id && editingItem.color === item.color && editingItem.size === item.size && (
                        <div className="mt-4 p-6 bg-white rounded-[2rem] border-2 border-amber-500/30 shadow-2xl space-y-4 animate-scaleIn z-10 relative">
                          <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] block">Chọn màu mới</label>
                            <div className="flex flex-wrap gap-2">
                              {item.product.colors?.map(c => (
                                <button
                                  key={c}
                                  onClick={() => setEditForm({ ...editForm, color: c })}
                                  className={`px-4 py-2 text-[10px] font-black rounded-xl border transition-all uppercase tracking-widest ${editForm.color === c ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-amber-300'}`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] block">Chọn size mới</label>
                            <div className="flex flex-wrap gap-2">
                              {item.product.sizes?.map(s => (
                                <button
                                  key={s}
                                  onClick={() => setEditForm({ ...editForm, size: s })}
                                  className={`px-4 py-2 text-[10px] font-black rounded-xl border transition-all uppercase tracking-widest ${editForm.size === s ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-amber-300'}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2 border-t border-gray-50 mt-2">
                            <span className="text-[10px] text-gray-400 font-bold">Tồn kho: <span className={getEditStock() >= item.quantity ? 'text-green-500' : 'text-red-500'}>{getEditStock()}</span></span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingItem(null)}
                                className="px-6 py-2 bg-gray-50 text-gray-400 text-[9px] font-black uppercase rounded-xl border border-gray-100"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await updateVariant(item.product._id, item.color, item.size, editForm.color, editForm.size);
                                    setEditingItem(null);
                                    Swal.fire({ icon: 'success', title: 'Đã cập nhật', timer: 800, toast: true, position: 'top-end', showConfirmButton: false });
                                  } catch (err) {
                                    Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Không thể cập nhật' });
                                  }
                                }}
                                disabled={getEditStock() < item.quantity}
                                className="px-6 py-2 bg-amber-500 text-gray-900 text-[9px] font-black uppercase rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-30"
                              >
                                Xác nhận
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Shop Information */}
                      {item.product?.shop && (
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 pt-2 group/shop">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 text-[9px] font-black uppercase tracking-widest transition-all group-hover/shop:bg-amber-100 w-fit">
                            🏬 {item.product.shop.name}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 flex md:justify-center items-center">
                    <span className="md:hidden font-black text-gray-400 mr-2 text-[10px] uppercase tracking-widest">Đơn giá:</span>
                    <span className="font-bold text-gray-800 text-lg tracking-tight">{formatPrice(item.product.price)}</span>
                  </div>

                  <div className="col-span-1 md:col-span-2 flex md:justify-center items-center">
                    <span className="md:hidden font-black text-gray-400 mr-2 text-[10px] uppercase tracking-widest">Số lượng:</span>
                    <div className="flex items-center bg-gray-100 rounded-2xl p-1 border border-gray-200 h-10 w-32 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product._id, item.color, item.size, item.quantity - 1)}
                        className="w-8 h-8 rounded-xl bg-white text-gray-900 flex items-center justify-center transition-all hover:bg-amber-500 hover:text-white shadow-sm active:scale-95 border border-gray-100 flex-shrink-0"
                      >
                        <span className="text-xl leading-none">−</span>
                      </button>
                      <input
                        type="text"
                        value={item.quantity}
                        readOnly
                        className="w-10 bg-transparent text-center text-sm font-black text-gray-900 outline-none select-none flex-grow"
                      />
                      <button
                        onClick={() => updateQuantity(item.product._id, item.color, item.size, item.quantity + 1)}
                        className="w-8 h-8 rounded-xl bg-white text-gray-900 flex items-center justify-center transition-all hover:bg-amber-500 hover:text-white shadow-sm active:scale-95 border border-gray-100 flex-shrink-0"
                      >
                        <span className="text-xl leading-none">+</span>
                      </button>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-3 flex justify-between md:justify-end items-center pr-4">
                    <span className="md:hidden font-black text-gray-400 text-[10px] uppercase tracking-widest">Giá tạm tính:</span>
                    <div className="text-right flex-1 md:flex-none">
                      <div className="font-black text-amber-500 text-xl tracking-tighter tabular-nums select-none">{formatPrice(item.product.price * item.quantity)}</div>
                    </div>
                    {/* Nút xóa desktop */}
                    <button
                      onClick={() => handleRemove(item.product._id, item.color, item.size)}
                      className="hidden md:flex ml-6 text-gray-200 hover:text-red-500 transition-all p-2 bg-gray-50 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-2xl group/del"
                      title="Xóa sản phẩm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover/del:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-4">
                <Link
                  to="/"
                  className="px-8 py-4 bg-white rounded-2xl border border-gray-100 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-amber-500 hover:border-amber-500 transition-all shadow-sm flex items-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Tiếp Tục Mua Sắm
                </Link>
                <button
                  onClick={handleClearCart}
                  className="px-8 py-4 bg-red-50/50 rounded-2xl border border-red-100 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Dọn dẹp giỏ hàng
                </button>
              </div>
            </div>

            {/* Panel Thanh toán */}
            <div className="w-full lg:w-[400px]">
              <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-10 sticky top-32 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                <h3 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-tighter italic border-b border-gray-50 pb-6 flex items-center justify-between">
                  Tạm Tính <span className="text-amber-500">Đơn Hàng</span>
                </h3>

                <div className="space-y-5 mb-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tổng tiền hàng</span>
                    <span className="font-bold text-gray-900 text-lg tracking-tight">{formatPrice(getCartTotal())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Phí vận chuyển</span>
                    <span className="text-[10px] font-black uppercase text-green-500 tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">Miễn Phí 🚀</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-t border-dashed border-gray-100 mt-6">
                    <span className="font-black text-gray-900 uppercase tracking-tighter text-sm italic">Tổng cộng thanh toán</span>
                    <div className="text-right">
                      <div className="text-3xl font-black text-amber-500 tracking-tighter tabular-nums select-none">{formatPrice(getCartTotal())}</div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">(Đã bao gồm thuế GTGT)</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-gray-900 text-white font-black uppercase tracking-[0.2em] py-6 rounded-[2rem] hover:bg-amber-500 hover:text-gray-900 transition-all shadow-2xl shadow-gray-300 active:scale-95 text-xs"
                >
                  THANH TOÁN NGAY
                </button>


                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-[1.5rem] border border-gray-100 text-center">
                    <div className="text-xl mb-1">🛡️</div>
                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Bảo mật tuyệt đối</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-[1.5rem] border border-gray-100 text-center">
                    <div className="text-xl mb-1">🚚</div>
                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Giao hàng 2h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-10 text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mt-20">
        <p>© 2026 Petrolimex Fashion. Sự lựa chọn của đẳng cấp.</p>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}} />
    </div>
  );
}
