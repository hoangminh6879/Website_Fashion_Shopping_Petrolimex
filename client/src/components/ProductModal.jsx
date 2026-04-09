import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import Swal from 'sweetalert2';
import AutoText from './AutoText';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';

export default function ProductModal({ product: productInfo, isOpen, onClose, productGroupMap = {} }) {
  const { addToCart, userRole } = useCart();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { openChatWithUser } = useSocket();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productVariants, setProductVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  // User selection states
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && productInfo) {
      fetchProductDetails();
    }
  }, [isOpen, productInfo]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setSelectedColor('');
    setSelectedSize('');
    setProductVariants([]);
    setSelectedProduct(null);
    setQuantity(1);

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
      } else if (mainProduct?.colors?.length > 0 && mainProduct?.sizes?.length > 0) {
        setSelectedColor(mainProduct.colors[0]);
        setSelectedSize(mainProduct.sizes[0]);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentVariant = productVariants.find(v => v.color === selectedColor && v.size === selectedSize);

  const displayPrice = productInfo?.eventPrice > 0
    ? productInfo.eventPrice
    : (selectedProduct?.isFlashSale && selectedProduct?.flashSaleEndDate && new Date(selectedProduct.flashSaleEndDate) > new Date() && selectedProduct?.flashSaleStock > 0
      ? selectedProduct.flashSalePrice
      : (selectedProduct?.price > 0
        ? selectedProduct.price
        : (currentVariant ? currentVariant.price : (productVariants.length > 0 ? productVariants[0].price : 0))));

  const originalPrice = productInfo?.originalPrice || selectedProduct?.price || (currentVariant ? currentVariant.originalPrice : 0);
  const discountPercentage = productInfo?.discountPercentage || (selectedProduct?.isFlashSale && selectedProduct?.flashSaleEndDate && new Date(selectedProduct.flashSaleEndDate) > new Date() && selectedProduct?.flashSaleStock > 0 ? selectedProduct.flashSaleDiscount : 0);

  const uniqueColors = selectedProduct?.colors?.length > 0
    ? selectedProduct.colors
    : [...new Set(productVariants.map(v => v.color))];

  const uniqueSizes = selectedProduct?.sizes?.length > 0
    ? selectedProduct.sizes
    : [...new Set(productVariants.map(v => v.size))];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const getSelectedStock = () => {
    if (!selectedProduct) return 0;
    if (productVariants.length > 0) {
      return currentVariant ? currentVariant.stock : 0;
    }
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

  const currentStock = getSelectedStock();

  const getVariantImage = () => {
    if (!selectedProduct) return null;

    // 🔥 New system: Use individual variant's image
    if (currentVariant?.image) return currentVariant.image;

    // 🔥 Old system: Use variantImages array from product
    if (selectedProduct.variantImages && selectedProduct.variantImages.length > 0) {
      const colorIdx = (selectedProduct.colors || []).indexOf(selectedColor);
      const sizeIdx = (selectedProduct.sizes || []).indexOf(selectedSize);
      if (colorIdx !== -1 && sizeIdx !== -1) {
        const index = colorIdx * (selectedProduct.sizes?.length || 0) + sizeIdx;
        if (selectedProduct.variantImages[index]) return selectedProduct.variantImages[index];
      }
    }

    return null;
  };

  const variantImage = getVariantImage();

  const handleAddToCart = async (isBuyNow = false) => {
    if (userRole !== 'user') {
      Swal.fire({
        icon: 'warning',
        title: t('login_required'),
        text: t('login_required_msg'),
        showCancelButton: true,
        confirmButtonText: t('login'),
        cancelButtonText: t('close')
      }).then((result) => {
        if (result.isConfirmed) navigate('/login');
      });
      return;
    }

    if (!selectedColor || !selectedSize) {
      Swal.fire(t('attention'), t('select_options_msg'), 'warning');
      return;
    }

    if (currentStock <= 0) {
      Swal.fire(t('out_of_stock'), t('out_of_stock_msg'), 'error');
      return;
    }

    setAddingToCart(true);
    try {
      if (isBuyNow) {
        navigate('/checkout', {
          state: {
            buyNowItem: { product: selectedProduct, color: selectedColor, size: selectedSize, quantity }
          }
        });
      } else {
        await addToCart(selectedProduct, selectedColor, selectedSize, quantity);
        Swal.fire({
          icon: 'success',
          title: t('added_to_cart'),
          showConfirmButton: false,
          timer: 1500,
          toast: true,
          position: 'top-end'
        });
        onClose();
      }
    } catch (error) {
      Swal.fire(t('error'), t('add_to_cart_error'), 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden relative flex flex-col md:flex-row">
        {/* Fixed Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 z-[60] bg-white/80 backdrop-blur-md shadow-lg hover:shadow-xl rounded-full p-2.5 transition-all active:scale-95 border border-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {loading ? (
          <div className="p-20 w-full flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : selectedProduct && (
          <>
            {/* Left: Main Image Display */}
            <div className="w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center border-r border-gray-100 overflow-hidden group">
              <div className="relative w-full h-full flex items-center justify-center p-8 md:p-12">
                <img
                  src={variantImage ? (variantImage.startsWith('http') ? variantImage : `http://localhost:5000${variantImage}`) : (selectedProduct.images && selectedProduct.images.length > 0 ? (selectedProduct.images[0].url.startsWith('http') ? selectedProduct.images[0].url : `http://localhost:5000${selectedProduct.images[0].url}`) : `https://picsum.photos/seed/${selectedProduct._id}/400/400`)}
                  alt={selectedProduct.name}
                  className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl bg-white border border-gray-100 transition-transform duration-700 group-hover:scale-105"
                />
                {discountPercentage > 0 && (
                  <div className="absolute top-10 left-10 bg-red-600 text-white font-black px-4 py-2 rounded-2xl shadow-xl text-xs uppercase tracking-widest z-10">
                    -{discountPercentage}%
                  </div>
                )}
              </div>
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-1/2 flex flex-col h-full bg-white relative">
              {/* Product Info Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12">
                <div className="mb-4 flex items-center gap-2">
                  <span className="bg-[#d0011b] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">MALL</span>
                  <span className="text-gray-500 text-sm">{t('provided_by')}: <Link to={`/shop/${selectedProduct.shop?._id}`} className="text-amber-600 font-black hover:underline transition-all cursor-pointer"><AutoText text={selectedProduct.shop?.name || 'Shop Của Tôi'} /></Link></span>
                  <button
                    onClick={() => {
                      onClose();
                      openChatWithUser(selectedProduct.shop?.owner, selectedProduct);
                    }}
                    className="ml-3 flex items-center gap-1 text-[10px] font-black uppercase text-amber-500 hover:text-amber-600 transition-all border border-amber-500/30 px-2 py-0.5 rounded-md bg-amber-50"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Chat
                  </button>
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2 leading-tight tracking-tight"><AutoText text={selectedProduct.name} /></h2>

                <div className="flex items-center gap-2 mb-6">
                  <div className="flex text-amber-400 text-sm">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star}>{selectedProduct.rating >= star ? '★' : '☆'}</span>
                    ))}
                  </div>
                  {selectedProduct.rating > 0 && (
                    <span className="text-xs font-black text-gray-900 border-l border-gray-200 pl-2">({selectedProduct.rating.toFixed(1)})</span>
                  )}
                  <span className="text-xs font-bold text-gray-400 border-l border-gray-200 pl-2 uppercase tracking-widest"><AutoText text="Đã bán" /> {selectedProduct.sold || 0}</span>
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/product/${selectedProduct._id}`);
                    }}
                    className="ml-auto text-xs font-black text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
                  >
                    <AutoText text="Xem đánh giá" /> →
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-[1.5rem] mb-8 border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-4xl font-black text-[#d0011b] tracking-tighter">
                        {formatPrice(displayPrice)}
                      </span>
                      {originalPrice > displayPrice && (
                        <span className="text-sm text-gray-400 line-through font-bold">
                          {formatPrice(originalPrice)}
                        </span>
                      )}
                    </div>
                    {discountPercentage > 0 && (
                      <span className="bg-[#d0011b] text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-lg shadow-red-100 uppercase tracking-widest">
                        -{discountPercentage}% {t('discount')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-8">
                  {/* Color */}
                  {uniqueColors.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">{t('color')}</h4>
                        <span className="text-[10px] font-black text-amber-600 uppercase">{selectedColor || 'Chưa chọn'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {uniqueColors.map(color => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-5 py-2.5 border-2 rounded-xl text-xs transition-all ${selectedColor === color ? 'border-amber-500 text-gray-900 bg-amber-50 font-black shadow-md shadow-amber-100' : 'border-gray-100 text-gray-400 hover:border-amber-200'}`}
                          >
                            <AutoText text={color} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size */}
                  {uniqueSizes.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">{t('size')}</h4>
                        <span className="text-[10px] font-black text-amber-600 uppercase">{selectedSize || 'Chưa chọn'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {uniqueSizes.map(size => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-6 py-2.5 border-2 rounded-xl text-xs transition-all ${selectedSize === size ? 'border-amber-500 text-gray-900 bg-amber-50 font-black shadow-md shadow-amber-100' : 'border-gray-100 text-gray-400 hover:border-amber-200'}`}
                          >
                            <AutoText text={size} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity Selector */}
                  {currentStock > 0 && (
                    <div className="pt-4 pb-4">
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-3">{t('quantity')}</h4>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                          <button
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-gray-100 text-gray-900 font-bold transition-all active:scale-95"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                setQuantity(Math.min(currentStock, Math.max(1, val)));
                              }
                            }}
                            className="w-14 bg-transparent text-center font-black text-gray-900 outline-none"
                          />
                          <button
                            onClick={() => setQuantity(prev => Math.min(currentStock, prev + 1))}
                            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-gray-100 text-gray-900 font-bold transition-all active:scale-95"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-red-900 uppercase">{currentStock} {t('products')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product Description - Moved here for better visibility */}
                  <div className="pt-8 border-t border-gray-50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-0.5 w-6 bg-amber-500 rounded-full"></div>
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">{t('Mô tả')}</h4>
                    </div>
                    <div className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none bg-gray-50/50 p-6 rounded-3xl border border-gray-50">
                      <AutoText text={selectedProduct.description} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Actions Footer */}
              <div className="p-8 md:p-10 bg-white border-t border-gray-50 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                {userRole === 'admin' || userRole === 'seller' ? (
                  <div className="w-full text-center py-4 bg-red-50 text-red-500 font-black rounded-2xl border border-red-100 uppercase tracking-widest text-[10px]">
                    🛒 {t('only_for_customers')}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                          onClose();
                          navigate('/try-on', { state: { productImageUrl: variantImage || (selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images[0].url : null) } });
                        }}
                        className="w-full bg-black text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-gray-900 hover:border-[#D4AF37] px-4 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg flex justify-center items-center gap-2 group"
                    >
                        <span className="text-sm group-hover:scale-110 transition-transform">✨</span> Thử Đồ Bằng Trí Tuệ Nhân Tạo (AI)
                    </button>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleAddToCart(false)}
                        disabled={addingToCart || currentStock <= 0}
                        className={`flex-[1.2] flex items-center justify-center gap-3 py-4 border-2 border-amber-500 font-black rounded-2xl transition-all uppercase tracking-widest text-[10px] ${addingToCart || currentStock <= 0 ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' : 'text-amber-600 bg-amber-50/50 hover:bg-amber-500 hover:text-white active:scale-95 shadow-lg shadow-amber-500/5'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 5.4a1 1 0 00.97 1.25h11.76a1 1 0 00.97-1.25L17 13M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" /></svg>
                        {addingToCart ? t('adding') : t('add_to_cart')}
                      </button>
                      <button
                        onClick={() => handleAddToCart(true)}
                        disabled={addingToCart || currentStock <= 0}
                        className={`flex-1 py-4 font-black rounded-2xl transition-all shadow-xl uppercase tracking-widest text-[10px] ${addingToCart || currentStock <= 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 hover:shadow-amber-500/30 active:scale-95'}`}
                      >
                        {t('buy_now')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
