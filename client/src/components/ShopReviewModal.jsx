import React, { useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function ShopReviewModal({ shop, onClose, onSuccess }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/reviews/shop', {
                shopId: shop._id,
                rating,
                comment
            });
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Cảm ơn bạn đã đóng góp ý kiến về dịch vụ của shop.',
                confirmButtonColor: '#F59E0B'
            });
            onSuccess();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: err.response?.data?.message || 'Không thể gửi đánh giá lúc này.',
                confirmButtonColor: '#F59E0B'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-modalIn">
                {/* Header */}
                <div className="bg-amber-500 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 transition-all font-bold">✕</button>
                    <h2 className="text-3xl font-black italic uppercase italic tracking-tighter">Đánh giá <span className="opacity-70">Dịch vụ</span></h2>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-2">{shop.name}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Rating Section */}
                    <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Bạn thấy dịch vụ của shop thế nào?</p>
                        <div className="flex justify-center gap-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`text-4xl transition-all hover:scale-125 ${star <= rating ? 'grayscale-0' : 'grayscale'}`}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>
                        <p className="mt-4 font-black italic text-amber-500 uppercase tracking-tighter text-sm">
                            {rating === 5 ? 'Tuyệt vời!' : rating === 4 ? 'Rất hài lòng' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Không tốt' : 'Rất tệ'}
                        </p>
                    </div>

                    {/* Comment Field */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Chia sẻ trải nghiệm của bạn (Không bắt buộc)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Dịch vụ shop rất tốt, giao hàng nhanh, tư vấn nhiệt tình..."
                            className="w-full h-32 px-6 py-4 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white outline-none transition-all resize-none text-sm font-bold text-gray-700 placeholder:text-gray-300"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 rounded-2xl bg-gray-900 text-amber-500 font-black uppercase tracking-[0.3em] text-[11px] shadow-xl shadow-gray-200 transition-all active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-500 hover:text-gray-900'}`}
                    >
                        {loading ? 'Đang gửi...' : 'Gửi đánh giá ngay'}
                    </button>
                    
                    <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest opacity-60 italic leading-relaxed">
                        Đánh giá của bạn sẽ giúp cộng đồng mua sắm<br/>có trải nghiệm tốt hơn tại Petrolimex Fashion.
                    </p>
                </form>
            </div>
        </div>
    );
}
