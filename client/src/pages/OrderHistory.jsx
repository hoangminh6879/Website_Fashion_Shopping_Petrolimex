import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/my-orders');
            setOrders(res.data);
        } catch (err) {
            console.error("Error fetching orders:", err);
            // If unauthorized, the interceptor will handle it, but we can also check here
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBFBFB] font-sans pb-20">
            <Navbar />

            <main className="container mx-auto px-4 py-12 mt-44">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-gray-100 pb-10">
                        <div>
                            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                                Lịch Sử <span className="text-amber-500">Giao Dịch</span>
                            </h1>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em] mt-3 ml-1 opacity-80">
                                Quản lý & Theo dõi mọi đơn hàng của bạn
                            </p>
                        </div>
                        <button
                            onClick={fetchOrders}
                            className="group flex items-center gap-3 px-8 py-4 bg-white border border-gray-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl shadow-gray-200/50"
                        >
                            <span className="text-lg group-active:rotate-180 transition-transform duration-500">🔄</span>
                            Làm mới danh sách
                        </button>
                    </div>

                    <div className="space-y-8">
                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center space-y-6">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-xs">⚡</div>
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Đang truy xuất dữ liệu từ hệ thống...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="py-32 text-center bg-white rounded-[4rem] border border-gray-100 shadow-2xl shadow-gray-200/50">
                                <div className="text-9xl mb-10 opacity-10 filter grayscale">📦</div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4 italic">Giỏ đồ của bạn đang chờ!</h3>
                                <p className="text-gray-400 font-bold text-sm max-w-sm mx-auto mb-10 leading-relaxed">Bạn chưa thực hiện giao dịch nào trên Petrolimex Fashion. Hãy bắt đầu hành trình phong cách của bạn ngay hôm nay.</p>
                                <Link to="/" className="inline-block bg-gray-900 text-amber-500 px-12 py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 hover:text-gray-900 transition-all scale-100 hover:scale-105 active:scale-95 shadow-2xl shadow-gray-200">
                                    KHÁM PHÁ BỘ SƯU TẬP MỚI
                                </Link>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order._id} className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl shadow-gray-200/30 hover:shadow-gray-200/60 transition-all duration-500 overflow-hidden group">
                                    {/* Order Header */}
                                    <div className="p-8 md:p-10 bg-gray-50/50 border-b border-gray-50 flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
                                        <div className="flex gap-6 items-center">
                                            <div className="w-14 h-14 bg-white rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner border border-gray-100">
                                                🧾
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">ID ĐƠN HÀNG</p>
                                                <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight">#{order._id.slice(-8)}</h4>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-10 items-center">
                                            <div className="text-left md:text-right">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">THỜI GIAN ĐẶT</p>
                                                <p className="text-sm font-black text-gray-900 italic">{new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">TRẠNG THÁI</p>
                                                <span className={`inline-block px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        order.status === 'shipping' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {order.status === 'pending' ? 'Đang xử lý' :
                                                        order.status === 'confirmed' ? 'Đã xác nhận' :
                                                            order.status === 'shipping' ? 'Đang bàn giao' :
                                                                order.status === 'delivered' ? 'Giao thành công' : 'Đã hủy bỏ'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Content */}
                                    <div className="p-10 space-y-8">
                                        <div className="space-y-6">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex gap-8 items-center bg-gray-50/20 p-4 rounded-3xl border border-transparent hover:border-gray-100 transition-all">
                                                    <div className="w-24 h-24 rounded-[2rem] bg-white border border-gray-100 overflow-hidden flex-shrink-0 shadow-sm relative">
                                                        <img
                                                            src={item.product?.images?.[0]?.url
                                                                ? (item.product.images[0].url.startsWith('http') ? item.product.images[0].url : `http://localhost:5000${item.product.images[0].url}`)
                                                                : `https://picsum.photos/seed/${idx}/200/200`}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                            alt={item.product?.name}
                                                        />
                                                        <div className="absolute bottom-1 right-1 bg-gray-900 text-white text-[8px] font-black px-2 py-0.5 rounded-full">
                                                            x{item.quantity}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="text-sm font-black uppercase text-gray-900 tracking-tight mb-2 truncate">{item.product?.name || 'Sản phẩm không khả dụng'}</h5>
                                                        <div className="flex gap-3">
                                                            <span className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-400">Màu: {item.color}</span>
                                                            <span className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-400">Size: {item.size}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">THÀNH TIỀN</p>
                                                        <p className="text-lg font-black text-gray-900 tracking-tighter tabular-nums">{(item.product?.price * item.quantity || 0).toLocaleString()} đ</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-10 border-t border-dashed border-gray-100 flex flex-col md:flex-row justify-between gap-10">
                                            <div className="max-w-md space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">📍</span>
                                                    <h6 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Thông tin nhận hàng</h6>
                                                </div>
                                                <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-50">
                                                    <p className="text-xs font-bold text-gray-700 leading-relaxed italic">{order.address}</p>
                                                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100/50">
                                                        <p className="text-[10px] font-black text-gray-400">📞 {order.phone || 'N/A'}</p>
                                                        <div className="w-1 h-1 rounded-full bg-gray-200"></div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.paymentMethod}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end justify-end space-y-4">
                                                <div className="text-right">
                                                    {order.discountAmount > 0 && (
                                                        <div className="text-right mb-2">
                                                            <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] mb-1">ĐÃ GIẢM: -{order.discountAmount.toLocaleString()} đ</p>
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">TỔNG CỘNG THANH TOÁN</p>
                                                    <div className="text-4xl font-black text-amber-500 tracking-tighter italic tabular-nums">
                                                        {(order.totalPrice || 0).toLocaleString()} đ
                                                    </div>
                                                </div>
                                                {order.status === 'pending' && (
                                                    <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest bg-amber-50 px-4 py-2 rounded-full border border-amber-100 flex items-center gap-2">
                                                        <span className="animate-pulse">●</span> Đơn hàng đang được bộ phận vận chuyển chuẩn bị
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <footer className="mt-20 py-20 border-t border-gray-50 text-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">PETROLIMEX FASHION • HÀNH TRÌNH PHONG CÁCH</p>
            </footer>
        </div>
    );
}
