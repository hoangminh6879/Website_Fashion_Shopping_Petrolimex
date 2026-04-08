import React, { useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function ReviewModal({ item, onClose, onSuccess }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append('image', file);
                const res = await api.post('/images/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return res.data.image.url;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            setImages(prev => [...prev, ...uploadedUrls]);
        } catch (err) {
            Swal.fire('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reviews', {
                productId: item.product._id,
                rating,
                comment,
                images
            });
            Swal.fire('Thành công', 'Cảm ơn bạn đã đánh giá sản phẩm! ⭐', 'success');
            onSuccess();
            onClose();
        } catch (err) {
            Swal.fire('Lỗi', err.response?.data?.message || 'Không thể đăng đánh giá.', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" />
            <div 
                className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-modalIn"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-10 py-8 bg-gray-900 text-white flex justify-between items-center overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-2xl rotate-3 shadow-lg shadow-amber-500/20">⭐</div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter italic">Đánh giá <span className="text-amber-500">Sản phẩm</span></h2>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Chia sẻ trải nghiệm của bạn</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all font-bold">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
                    {/* Item Info */}
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                        <img 
                            src={item.product?.images?.[0]?.url?.startsWith('http') ? item.product.images[0].url : `http://localhost:5000${item.product?.images?.[0]?.url || ''}`} 
                            className="w-16 h-16 rounded-xl object-cover" 
                            alt="product"
                        />
                        <div>
                            <h4 className="font-black text-sm uppercase text-gray-900 truncate max-w-xs">{item.product?.name}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Phân loại: {item.color} | {item.size}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Star Rating */}
                        <div className="text-center">
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Chất lượng sản phẩm</p>
                            <div className="flex justify-center gap-3">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`text-4xl transition-all hover:scale-125 ${star <= rating ? 'text-amber-500' : 'text-gray-200'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <p className="mt-4 text-xs font-black uppercase italic text-amber-600">
                                {rating === 5 ? 'Tuyệt vời' : rating === 4 ? 'Rất tốt' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Kém' : 'Tệ'}
                            </p>
                        </div>

                        {/* Comment */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Nhận xét của bạn</label>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Hãy chia sẻ lý do bạn thích sản phẩm này nhé..."
                                className="w-full min-h-[120px] bg-gray-50 border-2 border-transparent focus:border-amber-500/30 focus:bg-white rounded-[2rem] p-6 text-sm font-bold text-gray-700 outline-none transition-all placeholder:text-gray-300 shadow-inner"
                                required
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Hình ảnh sản phẩm (tuỳ chọn)</label>
                            <div className="flex flex-wrap gap-4">
                                {images.map((url, i) => (
                                    <div key={i} className="relative w-20 h-20 group">
                                        <img src={url?.startsWith('http') ? url : `http://localhost:5000${url}`} className="w-full h-full object-cover rounded-2xl border-2 border-gray-100 shadow-sm" alt="review" />
                                        <button 
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >✕</button>
                                    </div>
                                ))}
                                {images.length < 5 && (
                                    <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all text-gray-400 hover:text-amber-500">
                                        <span className="text-2xl font-light">+</span>
                                        <span className="text-[8px] font-black uppercase mt-1">Thêm ảnh</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                            {uploading && <p className="text-[10px] font-bold text-amber-600 animate-pulse uppercase tracking-widest">Đang tải ảnh lên hệ thống...</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full py-6 bg-gray-900 text-white font-black uppercase tracking-[0.4em] rounded-[2rem] hover:bg-amber-500 hover:text-gray-900 transition-all shadow-2xl active:scale-95 text-xs disabled:opacity-50"
                        >
                            Đăng Đánh Giá Ngay
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
