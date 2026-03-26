import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import Swal from 'sweetalert2';


export default function Checkout() {
    const navigate = useNavigate();
    const { cart, getCartTotal, clearCart, user } = useCart();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        paymentMethod: 'COD'
    });

    // 🔥 Tự động lấy thông tin từ Profile truyền ra
    React.useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                phone: user.phone || '',
                address: user.address || ''
            }));
        }
    }, [user]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;

        setLoading(true);
        try {
            const response = await api.post('/orders', {
                items: cart,
                totalPrice: getCartTotal(),
                address: formData.address,
                phone: formData.phone,
                paymentMethod: formData.paymentMethod
            });

            await Swal.fire({
                icon: 'success',
                title: 'Đặt hàng thành công!',
                text: 'Cảm ơn bạn đã mua sắm tại Petrolimex Fashion.',
                confirmButtonColor: '#111827',
                confirmButtonText: 'Xem đơn hàng của tôi'
            });

            clearCart();
            navigate('/profile'); // Redirect to profile to see orders
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi đặt hàng',
                text: error.response?.data?.message || 'Vui lòng thử lại sau.'
            });
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center font-sans px-4">
                <Navbar />
                <div className="bg-white p-20 rounded-[3rem] shadow-2xl shadow-gray-200/50 text-center max-w-2xl w-full border border-gray-100 italic">
                    <div className="text-8xl mb-10 opacity-20">📦</div>
                    <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tighter">Giỏ hàng trống!</h2>
                    <Link to="/" className="inline-block bg-gray-900 text-amber-500 font-black tracking-widest uppercase px-12 py-5 rounded-3xl hover:bg-amber-500 hover:text-gray-900 transition-all">
                        Quay lại mua sắm
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FBFBFB] flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 mt-44">
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* LEFT: Checkout Form */}
                    <div className="flex-1 space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <Link to="/cart" className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </Link>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Thanh <span className="text-amber-500">Toán</span></h1>
                        </div>

                        <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-10 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>

                            <h3 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-widest border-b border-gray-50 pb-6">Thông Tin Giao Hàng</h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Họ và Tên</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Nhập tên người nhận..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-6 py-4 outline-none focus:border-amber-500/50 focus:bg-white transition-all font-bold text-gray-900 shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Số Điện Thoại</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Nhập số điện thoại..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-6 py-4 outline-none focus:border-amber-500/50 focus:bg-white transition-all font-bold text-gray-900 shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Địa Chỉ Nhận Hàng</label>
                                    <textarea
                                        name="address"
                                        required
                                        rows="3"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] px-6 py-4 outline-none focus:border-amber-500/50 focus:bg-white transition-all font-bold text-gray-900 shadow-inner resize-none"
                                    ></textarea>
                                </div>

                                <div className="pt-6 border-t border-gray-50">
                                    <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-widest">Phương Thức Thanh Toán</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${formData.paymentMethod === 'COD' ? 'border-amber-500 bg-amber-50/50 shadow-lg' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="COD"
                                                checked={formData.paymentMethod === 'COD'}
                                                onChange={handleChange}
                                                className="w-5 h-5 accent-amber-500"
                                            />
                                            <div className="flex-1">
                                                <p className="font-black text-xs uppercase tracking-widest text-gray-900">COD (Tiền mặt)</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Thanh toán khi nhận hàng</p>
                                            </div>
                                            <span className="text-2xl">💵</span>
                                        </label>

                                        <label className="flex items-center gap-4 p-6 rounded-[2rem] border-2 border-gray-50 bg-gray-50 opacity-50 cursor-not-allowed">
                                            <input type="radio" disabled className="w-5 h-5" />
                                            <div className="flex-1">
                                                <p className="font-black text-xs uppercase tracking-widest text-gray-900">Chuyển khoản / Ví</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Đang bảo trì 🛠️</p>
                                            </div>
                                            <span className="text-2xl">💳</span>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gray-900 text-white font-black uppercase tracking-[0.3em] py-7 rounded-[2rem] hover:bg-amber-500 hover:text-gray-900 transition-all shadow-2xl shadow-gray-200 active:scale-95 disabled:opacity-50 mt-4 text-xs"
                                >
                                    {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐẶT HÀNG'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT: Order Summary */}
                    <div className="w-full lg:w-[450px]">
                        <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-10 lg:sticky lg:top-32 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                            <h3 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-tighter italic border-b border-gray-50 pb-6 flex items-center justify-between">
                                Tóm Tắt <span className="text-amber-500">Đơn Hàng</span>
                            </h3>

                            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-6 mb-8">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center group">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 shadow-sm">
                                            <img
                                                src={item.product?.images?.[0]?.url
                                                    ? (item.product.images[0].url.startsWith('http') ? item.product.images[0].url : `http://localhost:5000${item.product.images[0].url}`)
                                                    : `https://picsum.photos/seed/${item.product?._id}/100/100`}
                                                alt={item.product?.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-xs text-gray-900 uppercase truncate tracking-tight">{item.product?.name}</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.color} | {item.size}</span>
                                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">x{item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-sm text-gray-900 tracking-tighter">{formatPrice(item.product?.price * item.quantity)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 pt-6 border-t border-dashed border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tạm tính</span>
                                    <span className="font-bold text-gray-900 tracking-tight">{formatPrice(getCartTotal())}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Phí vận chuyển</span>
                                    <span className="text-[10px] font-black uppercase text-green-500 tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">Miễn Phí</span>
                                </div>
                                <div className="flex justify-between items-center py-6 border-t border-gray-50 mt-2">
                                    <span className="font-black text-gray-900 uppercase tracking-tighter text-lg italic">Tổng cộng</span>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-amber-500 tracking-tighter italic">{formatPrice(getCartTotal())}</div>
                                        <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">Bao gồm thuế GTGT</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 bg-gray-900 rounded-[2rem] p-6 text-center shadow-xl shadow-gray-200">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2">Cam Kết Petrolimex</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed">Sản phẩm chính hãng 100% - Đổi trả trong 7 ngày - Hỗ trợ tận tâm 24/7</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-gray-100 py-10 text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mt-20">
                <p>© 2026 Petrolimex Fashion. Quyền được mặc đẹp.</p>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            `}} />
        </div>
    );
}
