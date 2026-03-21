import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { addToCart } = useCart();
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
  }, [id]);


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
      Đang tải sản phẩm...
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase font-black text-gray-400">
      Không tìm thấy sản phẩm
    </div>
  );

  const variantImage = getSelectedVariantImage();
  const mainImageSrc = variantImage
    ? `http://localhost:5000${variantImage}`
    : (product.images?.[activeImage]?.url ? `http://localhost:5000${product.images[activeImage].url}` : "https://via.placeholder.com/800");

  const currentVariant = (product?.variants || []).find(
    v => v.color === selectedColor && v.size === selectedSize
  );

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-20">
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
                      // Khi chọn ảnh khác từ gallery, ta có thể muốn giữ ảnh đó thay vì ảnh biến thể
                      // Nhưng yêu cầu của user là: "khi chọn combo nào thì hiện ảnh combo đó"
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Sản phẩm chính hãng</span>
              <h1 className="text-4xl font-black text-gray-900 leading-tight uppercase tracking-tighter">
                {product.name}
              </h1>
              <p className="text-gray-400 text-sm font-medium italic">Mã sản phẩm: #{product._id?.slice(-8).toUpperCase()}</p>
            </div>

            <div className="text-4xl font-black text-amber-600 bg-amber-50/50 p-6 rounded-2xl border-l-8 border-amber-500">
              {formatPrice(product.price || 0)}
            </div>

            <div className="space-y-6">
              {/* COLORS */}
              {product.colors?.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Màu sắc: <span className="text-gray-900">{selectedColor}</span></label>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-6 py-3 rounded-xl border-2 font-bold transition-all text-sm uppercase ${selectedColor === color ? 'border-amber-500 bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/20' : 'border-gray-100 hover:border-amber-200 text-gray-500 hover:text-gray-900'}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SIZES */}
              {product.sizes?.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Kích cỡ: <span className="text-gray-900">{selectedSize}</span></label>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-8 py-3 rounded-xl border-2 font-black transition-all text-sm uppercase ${selectedSize === size ? 'border-gray-900 bg-gray-900 text-white shadow-xl shadow-gray-200' : 'border-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-900'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-gray-100 mt-auto flex flex-col gap-4">
               <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                  <span>Tồn kho: <span className="font-bold text-gray-800">{getSelectedStock()}</span> sản phẩm</span>
               </div>
               <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (!selectedColor || !selectedSize) {
                        alert("Vui lòng chọn màu sắc và kích cỡ!");
                        return;
                      }
                      addToCart(product, selectedColor, selectedSize, 1);
                      alert('Đã thêm vào giỏ hàng!');
                    }}
                    className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl active:scale-[0.98]"
                  >
                    THÊM VÀO GIỎ HÀNG
                  </button>
                  <button className="p-5 border-2 border-gray-100 rounded-2xl hover:bg-red-50 hover:border-red-100 group transition-all">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="mt-12 bg-white p-12 rounded-3xl shadow-lg shadow-gray-200/50">
          <h2 className="text-xl font-black uppercase tracking-tight mb-8 border-b-2 border-gray-900 inline-block pb-2">Mô tả sản phẩm</h2>
          <div className="prose prose-lg max-w-none text-gray-600 font-medium leading-relaxed">
            {product.description || "Đang cập nhật nội dung cho sản phẩm này..."}
          </div>
        </div>
      </div>
    </div>
  );
}