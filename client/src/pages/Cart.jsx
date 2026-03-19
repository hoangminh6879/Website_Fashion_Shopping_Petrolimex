import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import cartService from "../services/cartService";
import api from "../services/api";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Lấy thông tin user để check role
    api.get('/auth/me')
      .then(res => {
        if (res.data.role !== 'user') {
          alert("Chỉ tài khoản khách hàng mới có quyền truy cập giỏ hàng.");
          navigate('/');
        } else {
          setUser(res.data);
          fetchCart();
        }
      })
      .catch(err => {
        console.error(err);
        navigate('/login');
      });
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cartService.getCart();
      if (data?.success) {
        setCart(data.cart);
      } else {
        setError(data?.message || "Không thể tải giỏ hàng");
      }
    } catch (err) {
      setError(typeof err === "string" ? err : "Lỗi hệ thống. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await cartService.updateCartItem(cartItemId, newQuantity);
      fetchCart();
    } catch (err) {
      alert(typeof err === "string" ? err : "Lỗi cập nhật số lượng");
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    if (!window.confirm("Bạn có chắc muốn gỡ sản phẩm này khỏi giỏ hàng?")) return;
    try {
      await cartService.removeFromCart(cartItemId);
      fetchCart();
    } catch (err) {
      alert("Lỗi xóa sản phẩm");
    }
  };

  if (loading) return <div className="text-center mt-20 text-gray-500 font-bold">Đang tải giỏ hàng...</div>;
  
  if (error) return (
    <div className="text-center mt-20 px-4">
      <p className="text-red-500 font-bold mb-4">{error}</p>
      <Link to="/" className="text-amber-600 hover:underline">Quay về trang chủ</Link>
    </div>
  );

  const items = cart?.items || [];
  const totalPrice = cart?.totalPrice || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       {/* Simple Navigation for Cart Page */}
       <header className="bg-gray-900 py-4 shadow-lg">
          <div className="container mx-auto px-4 flex justify-between items-center">
             <Link to="/" className="text-2xl font-black text-amber-500 tracking-tighter uppercase italic">PETROLIMEX</Link>
             <Link to="/" className="text-gray-300 hover:text-white text-sm">Tiếp tục mua sắm</Link>
          </div>
       </header>
<div className="container mx-auto px-4 py-8 max-w-5xl flex-grow">
          <h1 className="text-3xl font-black mb-8 text-gray-900 uppercase">Giỏ hàng của bạn</h1>

          {items.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-xl text-center border border-gray-100">
              <p className="text-xl text-gray-400 mb-8 font-medium">Giỏ hàng của bạn hiện đang trống.</p>
              <Link
                to="/"
                className="inline-block bg-amber-500 text-gray-900 px-10 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-amber-400 transition transform active:scale-95 shadow-lg shadow-amber-500/20"
              >
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Items List */}
              <div className="lg:w-2/3 space-y-4">
                {items.map((item) => (
                  <div key={item._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition">
                    <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-50">
                      {item.product?.images?.[0]?.url ? (
                        <img 
                          src={`http://localhost:5000${item.product.images[0].url}`} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">No Image</div>
                      )}
                    </div>
                    <div className="flex-grow flex flex-col">
                       <Link to={`/product/${item.product?._id}`} className="font-bold text-gray-900 hover:text-amber-600 line-clamp-1">
                          {item.product?.name || "Sản phẩm"}
                       </Link>
                       <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-tighter">
                          {item.color} / {item.size}
                       </p>
                       <div className="mt-auto flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className="flex items-center border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
                                <button onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-200 transition">-</button>
                                <span className="px-3 font-bold text-sm min-w-[30px] text-center">{item.quantity}</span>
                                <button onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-200 transition">+</button>
</div>
                             <button onClick={() => handleRemoveItem(item._id)} className="text-xs text-red-400 hover:text-red-600 font-bold uppercase tracking-tighter">Xóa</button>
                          </div>
                          <span className="font-black text-amber-600">{(item.price * item.quantity).toLocaleString()}đ</span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="lg:w-1/3">
                 <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 sticky top-24">
                    <h2 className="font-black uppercase tracking-tight text-gray-900 border-b pb-4 mb-4">Tổng kết</h2>
                    <div className="space-y-3 mb-6">
                       <div className="flex justify-between text-gray-500 font-medium">
                          <span>Tạm tính</span>
                          <span>{totalPrice.toLocaleString()}đ</span>
                       </div>
                       <div className="flex justify-between text-gray-500 font-medium">
                          <span>Vận chuyển</span>
                          <span className="text-green-500">Miễn phí</span>
                       </div>
                       <div className="flex justify-between pt-4 border-t">
                          <span className="font-black text-gray-900 uppercase">Tổng tiền</span>
                          <span className="font-black text-2xl text-amber-600">{totalPrice.toLocaleString()}đ</span>
                       </div>
                    </div>
                    <button className="w-full py-4 bg-gray-900 text-amber-500 font-black uppercase tracking-widest rounded-xl hover:bg-black transition shadow-lg active:scale-95">
                       Thanh toán
                    </button>
                 </div>
              </div>
            </div>
          )}
       </div>
    </div>
  );
};

export default Cart;
