import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Navbar from '../components/Navbar';
import AutoText from '../components/AutoText';
import { useTranslation } from 'react-i18next';

export default function ProductDetail() {
  const { addToCart } = useCart();
  const { t } = useTranslation();
  const { toggleWishlist, isInWishlist } = useWishlist() || {};
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', images: [] });
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewImages, setReviewImages] = useState([]);
  const [selectedFullImage, setSelectedFullImage] = useState(null);
  const [isViewingFullImage, setIsViewingFullImage] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(res => {
        const data = res.data;
        setProduct(data);
        if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
        if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(err => console.error("Error fetching user profile:", err));
    }
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/${id}`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploaded = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await api.post('/images/upload', formData);
        uploaded.push(res.data.image.url);
      } catch (err) {
        console.error(err);
      }
    }
    setReviewImages([...reviewImages, ...uploaded]);
  };

  const submitReview = async () => {
    if (!newReview.comment) return alert(t('enter_comment_msg', { defaultValue: 'Vui lòng nhập bình luận!' }));
    try {
      await api.post('/reviews', {
        productId: id,
        rating: newReview.rating,
        comment: newReview.comment,
        images: reviewImages
      });
      alert(t('review_success_msg', { defaultValue: 'Đã đăng đánh giá thành công! ⭐' }));
      setNewReview({ rating: 5, comment: '', images: [] });
      setReviewImages([]);
      setIsReviewing(false);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || t('review_error_msg', { defaultValue: 'Lỗi khi đăng đánh giá' }));
    }
  };


  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Tính toán số lượng tồn kho theo biến thể
  const getSelectedStock = () => {
    if (!product) return 0;

    // 🔥 Ưu tiên dùng `variants` (hệ thống mới)
    if (product.variants?.length > 0) {
      const variant = product.variants.find(v => v.color === selectedColor && v.size === selectedSize);
      return variant ? variant.stock : 0;
    }

    // Hệ thống cũ: stock là mảng trong product
    if (!Array.isArray(product.stock) || product.stock.length === 0) {
      return Number(product.stock) || 0;
    }

    if (!selectedColor || !selectedSize) return product.stock[0] || 0;

    const colorIdx = (product.colors || []).indexOf(selectedColor);
    const sizeIdx = (product.sizes || []).indexOf(selectedSize);

    if (colorIdx === -1 || sizeIdx === -1) return product.stock[0] || 0;

    const index = colorIdx * (product.sizes?.length || 0) + sizeIdx;
    return product.stock[index] || 0;
  };

  // Lấy ảnh của biến thể đang chọn
  const getSelectedVariantImage = () => {
    // 🔥 Ưu tiên dùng `variants` (hệ thống mới)
    if (product?.variants?.length > 0) {
      const variant = product.variants.find(v => v.color === selectedColor && v.size === selectedSize);
      if (variant?.image) return variant.image;
    }

    if (!product || !product.variantImages || product.variantImages.length === 0) return null;
    if (!selectedColor || !selectedSize) return null;

    const colorIdx = (product.colors || []).indexOf(selectedColor);
    const sizeIdx = (product.sizes || []).indexOf(selectedSize);

    if (colorIdx === -1 || sizeIdx === -1) return null;

    const index = colorIdx * (product.sizes?.length || 0) + sizeIdx;
    return product.variantImages[index];
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase font-black text-gray-400">
      <AutoText text="Đang tải sản phẩm..." />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-[#dfc27d] uppercase font-black text-gray-900/40">
      <AutoText text="Không tìm thấy sản phẩm" />
    </div>
  );

  const variantImage = getSelectedVariantImage();
  const mainImageSrc = variantImage
    ? `http://localhost:5000${variantImage}`
    : (product.images?.[activeImage]?.url ? `http://localhost:5000${product.images[activeImage].url}` : "https://placehold.co/800x800?text=No+Image");

  const currentVariant = (product?.variants || []).find(
    v => v.color === selectedColor && v.size === selectedSize
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 pt-32 md:pt-44">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50">

          {/* LEFT: IMAGES */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 group">
              <img
                src={mainImageSrc}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={product.name}
              />
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {product.images.map((img, idx) => (
                  <button
                    key={img._id || idx}
                    onClick={() => {
                      setActiveImage(idx);
                    }}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${activeImage === idx ? 'border-amber-500 scale-95 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={`http://localhost:5000${img.url}`} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: INFO */}
          <div className="flex flex-col gap-8">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-100"><AutoText text="Sản phẩm chính hãng" /></span>
              <h1 className="text-4xl font-black text-gray-900 leading-tight uppercase tracking-tighter">
                <AutoText text={product.name} />
              </h1>
              <p className="text-gray-400 text-sm font-medium italic"><AutoText text="Mã sản phẩm" />: #{product._id?.slice(-8).toUpperCase()}</p>
            </div>

            {product.isFlashSale && new Date(product.flashSaleEndDate) > new Date() && product.flashSaleStock > 0 ? (
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-amber-600 bg-amber-50/50 p-6 rounded-2xl border-l-8 border-amber-500">
                  {formatPrice(product.flashSalePrice || 0)}
                </div>
                <div className="text-xl font-bold text-gray-400 line-through decoration-amber-500/50 decoration-2">
                  {formatPrice(product.price || 0)}
                </div>
                <div className="px-3 py-1 bg-amber-500 text-white font-black text-sm uppercase rounded-lg shadow-md">
                  -{product.flashSaleDiscount}%
                </div>
              </div>
            ) : (
              <div className="text-4xl font-black text-amber-600 bg-amber-50/50 p-6 rounded-2xl border-l-8 border-amber-500">
                {formatPrice(product.price || 0)}
              </div>
            )}

            <div className="space-y-6">
              {/* COLORS */}
              {product.colors?.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest">{t('color')}: <span className="text-gray-900"><AutoText text={selectedColor} /></span></label>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-6 py-3 rounded-xl border-2 font-bold transition-all text-sm uppercase ${selectedColor === color ? 'border-amber-500 bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/20' : 'border-gray-100 hover:border-amber-200 text-gray-500 hover:text-gray-900'}`}
                      >
                        <AutoText text={color} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SIZES */}
              {product.sizes?.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest">{t('size')}: <span className="text-gray-900"><AutoText text={selectedSize} /></span></label>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-8 py-3 rounded-xl border-2 font-black transition-all text-sm uppercase ${selectedSize === size ? 'border-gray-900 bg-gray-900 text-white shadow-xl shadow-gray-200' : 'border-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-900'}`}
                      >
                        <AutoText text={size} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-gray-100 mt-auto flex flex-col gap-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                <span>{t('stock')}: <span className="font-bold text-gray-800">{getSelectedStock()}</span> {t('products')}</span>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    if (!selectedColor || !selectedSize) {
                      alert(t('select_options_msg'));
                      return;
                    }
                    addToCart(product, selectedColor, selectedSize, 1);
                    alert(t('added_to_cart'));
                  }}
                  className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl active:scale-[0.98]"
                >
                  {t('add_to_cart')}
                </button>
                <button
                  onClick={() => navigate('/try-on')}
                  className="flex-1 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  Thử Đồ Ảo
                </button>
                <button
                  onClick={() => toggleWishlist(product._id)}
                  className={`p-5 border-2 rounded-2xl group transition-all ${isInWishlist(product._id) ? 'bg-red-50 border-red-500 shadow-lg shadow-red-200' : 'border-gray-100 hover:bg-red-50 hover:border-red-100'}`}
                >
                  <svg className={`w-6 h-6 ${isInWishlist(product._id) ? 'text-red-500 fill-current' : 'text-gray-400 group-hover:text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="mt-12 bg-white p-12 rounded-3xl shadow-lg shadow-gray-200/50">
          <h2 className="text-xl font-black uppercase tracking-tight mb-8 border-b-2 border-gray-900 inline-block pb-2"><AutoText text="Mô tả sản phẩm" /></h2>
          <div className="prose prose-lg max-w-none text-gray-600 font-medium leading-relaxed">
            <AutoText text={product.description || "Đang cập nhật nội dung cho sản phẩm này..."} />
          </div>
        </div>

        {/* SHOP INFO */}
        <div className="mt-12 bg-gray-900 text-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-amber-500/20 transition-all duration-1000"></div>
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-24 h-24 rounded-full bg-amber-500 flex items-center justify-center text-4xl font-black text-gray-900 shadow-xl shadow-amber-500/20 border-4 border-white/10 uppercase italic">
              {product.shop?.name?.charAt(0) || 'S'}
            </div>
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{product.shop?.name || 'Gian hàng chính hãng'}</h3>
              <div className="flex items-center gap-2 text-amber-500 text-sm font-black uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full w-fit mx-auto md:mx-0 border border-white/5 shadow-inner">
                <span className="text-xl">★</span>
                <span>{product.shop?.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-[10px] text-gray-500 ml-1">Shop Reputation Score</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 relative z-10">
            <button
              onClick={() => navigate(`/shop/${product.shop?._id}`)}
              className="px-10 py-5 bg-white text-gray-900 rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-amber-500 transition-all shadow-xl active:scale-95"
            >
              <AutoText text="Xem Shop" />
            </button>
            <button className="px-10 py-5 bg-gray-800 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-gray-700 transition-all shadow-xl border border-white/5">
              <AutoText text="Chat với Shop" />
            </button>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div className="mt-12 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase tracking-tighter"><AutoText text="Đánh giá từ khách hàng" /> ({reviews.length})</h2>
            {user && !isReviewing && (
              <button
                onClick={() => setIsReviewing(true)}
                className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs hover:bg-amber-500 hover:text-gray-900 transition-all shadow-lg active:scale-95"
              >
                <AutoText text="Viết Đánh Giá" />
              </button>
            )}
          </div>

          {/* REVIEW FORM */}
          {isReviewing && (
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border-2 border-amber-500">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black uppercase italic tracking-tight text-lg"><AutoText text="Đánh giá của bạn" /></h3>
                <button onClick={() => setIsReviewing(false)} className="text-gray-400 hover:text-red-500 uppercase font-black text-[10px] tracking-widest">{t('close')}</button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Rating:</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className={`text-2xl transition-all ${newReview.rating >= star ? 'text-amber-500 scale-125' : 'text-gray-200'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest block"><AutoText text="Bình luận" />:</label>
                  <textarea
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-medium outline-none focus:border-amber-500 transition shadow-inner font-sans"
                    rows="4"
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest block">Hình ảnh thực tế:</label>
                  <div className="flex flex-wrap gap-4">
                    {reviewImages.map((img, idx) => (
                      <div key={idx} className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500 relative group">
                        <img src={`http://localhost:5000${img}`} className="w-full h-full object-cover" alt="" />
                        <button
                          onClick={() => setReviewImages(reviewImages.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-red-500/80 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex font-black text-[10px]"
                        >
                          XÓA
                        </button>
                      </div>
                    ))}
                    <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      <span className="text-[8px] font-black uppercase tracking-widest mt-1"><AutoText text="Thêm ảnh" /></span>
                      <input type="file" className="hidden" multiple accept="image/*" onChange={handleReviewImageUpload} />
                    </label>
                  </div>
                </div>

                <button
                  onClick={submitReview}
                  className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl shadow-gray-200"
                >
                  <AutoText text="GỬI ĐÁNH GIÁ NGAY" />
                </button>
              </div>
            </div>
          )}

          {/* REVIEWS LIST */}
          <div className="space-y-6">
            {reviews.length > 0 ? reviews.map(review => (
              <div key={review._id} className="bg-white p-8 rounded-[2.5rem] shadow-lg shadow-gray-100 border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4 items-center">
                    <img
                      src={review.user?.avatar ? (review.user.avatar.startsWith('http') ? review.user.avatar : `http://localhost:5000${review.user.avatar}`) : `https://ui-avatars.com/api/?name=${review.user?.name}&background=f59e0b&color=fff`}
                      className="w-12 h-12 rounded-full border-2 border-amber-500/20 object-cover"
                      alt=""
                    />
                    <div>
                      <div className="font-black text-gray-900 uppercase tracking-tighter text-sm italic">{review.user?.name}</div>
                      <div className="text-amber-400 text-xs">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>

                <p className="text-gray-600 font-medium leading-relaxed mb-6 italic">"{review.comment}"</p>

                {review.images?.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none mb-6">
                    {review.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedFullImage(`http://localhost:5000${img}`);
                          setIsViewingFullImage(true);
                        }}
                        className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-gray-100 flex-shrink-0 cursor-zoom-in group relative"
                      >
                        <img src={`http://localhost:5000${img}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                      </div>
                    ))}
                  </div>
                )}

                {review.reply && (
                  <div className="mt-4 bg-gray-900 text-white p-6 rounded-3xl relative animate-fadeIn shadow-xl">
                    <div className="absolute -top-3 left-8 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-gray-900"></div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Phản hồi của Shop</span>
                      <span className="text-[9px] font-bold text-gray-500 uppercase">{new Date(review.repliedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed italic opacity-95">"{review.reply}"</p>
                  </div>
                )}
              </div>
            )) : (
              <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100">
                <span className="text-6xl opacity-20 block mb-6">📝</span>
                <p className="font-black uppercase tracking-widest text-gray-300 text-xs"><AutoText text="Chưa có đánh giá nào cho sản phẩm này." /></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {isViewingFullImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fadeIn"
          style={{ transition: 'all 0.3s ease-out' }}
          onClick={() => setIsViewingFullImage(false)}
        >
          <div className="relative max-w-5xl h-full flex items-center justify-center">
            <button
              className="absolute top-4 right-4 text-white hover:text-amber-500 transition-all z-50 p-3 bg-white/10 rounded-full hover:bg-white/20 active:scale-90"
              onClick={() => setIsViewingFullImage(false)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <img
              src={selectedFullImage}
              className="max-h-[90vh] max-w-full object-contain shadow-2xl rounded-2xl animate-zoomIn border-4 border-white/5"
              alt="Full view"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}