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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative flex flex-col md:flex-row animate-[fadeIn_0.3s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {loading ? (
          <div className="p-20 w-full flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : selectedProduct && (
          <>
            {/* Left: Image */}
            <div className="w-full md:w-1/2 bg-gray-100 flex flex-col items-center justify-center p-8 border-r border-gray-100">
              <img
                src={variantImage ? `http://localhost:5000${variantImage}` : (selectedProduct.images && selectedProduct.images.length > 0 ? `http://localhost:5000${selectedProduct.images[0].url}` : `https://picsum.photos/seed/${selectedProduct._id}/400/400`)}
                alt={selectedProduct.name}
                className="w-full max-w-sm aspect-square object-cover rounded-lg shadow-sm bg-white"
              />
              <div className="mt-6 text-gray-600 text-sm px-6 text-left border-t border-gray-200 pt-6 w-full">
                <h4 className="text-xs font-black uppercase text-gray-400 mb-3 tracking-widest italic">Mô tả sản phẩm</h4>
                <AutoText text={selectedProduct.description} />
              </div>
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
              <div className="mb-3 flex items-center gap-2">
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2 leading-tight"><AutoText text={selectedProduct.name} /></h2>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-amber-500 text-sm">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star}>{selectedProduct.rating >= star ? '★' : '☆'}</span>
                  ))}
                </div>
                {selectedProduct.rating > 0 && (
                  <span className="text-xs font-bold text-gray-400 border-l border-gray-200 pl-2">({selectedProduct.rating.toFixed(1)})</span>
                )}
                <span className="text-xs font-bold text-gray-400 border-l border-gray-200 pl-2 uppercase tracking-tighter"><AutoText text="Đã bán" /> {selectedProduct.sold || 0}</span>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/product/${selectedProduct._id}`);
                  }}
                  className="ml-auto text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
                >
                  <AutoText text="Xem đánh giá" /> →
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-[#d0011b]">
                      {formatPrice(displayPrice)}
                    </span>
                    {originalPrice > displayPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </div>
                  {discountPercentage > 0 && (
                    <span className="bg-[#d0011b] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">
                      -{discountPercentage}% {t('discount')}
                    </span>
                  )}
                  {!currentVariant && productVariants.length > 0 && (
                    <span className="text-xs text-gray-400 ml-auto self-start"> ({t('select_options_price')})</span>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="mb-6 flex-1">
                {/* Color */}
                {uniqueColors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-gray-700 font-semibold mb-2 text-sm uppercase">{t('color')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {uniqueColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 border rounded-md text-sm transition-all ${selectedColor === color ? 'border-amber-500 text-amber-600 bg-amber-50 font-bold shadow-sm' : 'border-gray-200 text-gray-700 hover:border-amber-300'}`}
                        >
                          <AutoText text={color} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size */}
                {uniqueSizes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-gray-700 font-semibold mb-2 text-sm uppercase">{t('size')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {uniqueSizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 border rounded-md text-sm transition-all ${selectedSize === size ? 'border-amber-500 text-amber-600 bg-amber-50 font-bold shadow-sm' : 'border-gray-200 text-gray-700 hover:border-amber-300'}`}
                        >
                          <AutoText text={size} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                {currentStock > 0 && (
                  <div className="mt-6 flex items-center gap-4">
                    <h4 className="text-gray-700 font-semibold text-sm uppercase">{t('quantity')}</h4>
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                      <button
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition border-r border-gray-300"
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
                        className="w-12 text-center text-sm font-bold outline-none [appearance:textfield]"
                      />
                      <button
                        onClick={() => setQuantity(prev => Math.min(currentStock, prev + 1))}
                        className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition border-l border-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">{t('max')} {currentStock}</span>
                  </div>
                )}

                {/* Stock status */}
                <div className="text-sm mt-4 text-gray-600 min-h-[1.5rem] font-medium">
                  {currentStock > 0 ? (
                    <span>{t('stock')}: <span className="font-bold text-gray-900">{currentStock}</span> {t('products')}</span>
                  ) : (
                    <span className="text-red-500 font-bold uppercase tracking-tight">{t('out_of_stock')}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-auto pt-4 border-t border-gray-100">
                {userRole === 'admin' || userRole === 'seller' ? (
                  <div className="w-full text-center py-3 bg-red-50 text-red-500 font-bold rounded-md border border-red-200">
                    🛒 {t('only_for_customers')}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleAddToCart(false)}
                      disabled={addingToCart || currentStock <= 0}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 border-2 border-amber-500 font-bold rounded-md transition-all ${addingToCart || currentStock <= 0 ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' : 'text-amber-600 bg-amber-50/50 hover:bg-amber-100 active:scale-95'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 5.4a1 1 0 00.97 1.25h11.76a1 1 0 00.97-1.25L17 13M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" /></svg>
                      {addingToCart ? t('adding') : t('add_to_cart')}
                    </button>
                    <button
                      onClick={() => handleAddToCart(true)}
                      disabled={addingToCart || currentStock <= 0}
                      className={`flex-1 py-3 font-bold rounded-md transition-all shadow-lg ${addingToCart || currentStock <= 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 hover:from-amber-600 hover:to-amber-700 active:scale-95'}`}
                    >
                      {t('buy_now')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
