import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import Swal from 'sweetalert2';

export default function ProductModal({ product: productInfo, isOpen, onClose, productGroupMap = {} }) {
  const { addToCart, userRole } = useCart();
  const navigate = useNavigate();

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

  const displayPrice = selectedProduct?.price > 0
    ? selectedProduct.price
    : (currentVariant ? currentVariant.price : (productVariants.length > 0 ? productVariants[0].price : 0));

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

  const handleAddToCart = async (isBuyNow = false) => {
    if (userRole !== 'user') {
      Swal.fire({
        icon: 'warning',
        title: 'Yêu cầu đăng nhập',
        text: 'Vui lòng đăng nhập với tài khoản Khách hàng để mua sắm.',
        showCancelButton: true,
        confirmButtonText: 'Đăng nhập',
        cancelButtonText: 'Đóng'
      }).then((result) => {
        if (result.isConfirmed) navigate('/login');
      });
      return;
    }

    if (!selectedColor || !selectedSize) {
      Swal.fire('Chú ý', 'Vui lòng chọn đầy đủ màu sắc và kích cỡ', 'warning');
      return;
    }

    if (currentStock <= 0) {
      Swal.fire('Hết hàng', 'Sản phẩm hiện đang tạm hết hàng cho lựa chọn này', 'error');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(selectedProduct, selectedColor, selectedSize, quantity);
      
      if (isBuyNow) {
        navigate('/cart');
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Đã thêm vào giỏ hàng',
          showConfirmButton: false,
          timer: 1500,
          toast: true,
          position: 'top-end'
        });
        onClose();
      }
    } catch (error) {
       Swal.fire('Lỗi', 'Không thể thêm sản phẩm vào giỏ hàng', 'error');
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
                src={selectedProduct.images && selectedProduct.images.length > 0 ? `http://localhost:5000${selectedProduct.images[0].url}` : `https://picsum.photos/seed/${selectedProduct._id}/400/400`}
                alt={selectedProduct.name}
                className="w-full max-w-sm aspect-square object-cover rounded-lg shadow-sm bg-white"
              />
              <div className="mt-4 text-gray-500 text-sm px-4 text-center">
                {selectedProduct.description}
              </div>
            </div>
            
            {/* Right: Details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
              <div className="mb-3 flex items-center gap-2">
                <span className="bg-[#d0011b] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">MALL</span>
                <span className="text-gray-500 text-sm">Cung cấp bởi: <Link to={`/shop/${selectedProduct.shop?._id}`} className="text-amber-600 font-black hover:underline transition-all cursor-pointer">{selectedProduct.shop?.name || 'Shop Của Tôi'}</Link></span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 leading-tight">{selectedProduct.name}</h2>

              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold text-amber-600">
                    {formatPrice(displayPrice)}
                  </span>
                  {!currentVariant && productVariants.length > 0 && (
                    <span className="text-sm text-gray-500 pb-1"> (Chọn loại để xem chi tiết)</span>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="mb-6 flex-1">
                {/* Color */}
                {uniqueColors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-gray-700 font-semibold mb-2 text-sm uppercase">Màu Sắc</h4>
                    <div className="flex flex-wrap gap-2">
                      {uniqueColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 border rounded-md text-sm transition-all ${selectedColor === color ? 'border-amber-500 text-amber-600 bg-amber-50 font-bold shadow-sm' : 'border-gray-200 text-gray-700 hover:border-amber-300'}`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size */}
                {uniqueSizes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-gray-700 font-semibold mb-2 text-sm uppercase">Kích Cỡ</h4>
                    <div className="flex flex-wrap gap-2">
                      {uniqueSizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 border rounded-md text-sm transition-all ${selectedSize === size ? 'border-amber-500 text-amber-600 bg-amber-50 font-bold shadow-sm' : 'border-gray-200 text-gray-700 hover:border-amber-300'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                {currentStock > 0 && (
                  <div className="mt-6 flex items-center gap-4">
                    <h4 className="text-gray-700 font-semibold text-sm uppercase">Số Lượng</h4>
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
                    <span className="text-xs text-gray-400">Tối đa {currentStock}</span>
                  </div>
                )}

                {/* Stock status */}
                <div className="text-sm mt-4 text-gray-600 min-h-[1.5rem] font-medium">
                  {currentStock > 0 ? (
                    <span>Tồn kho: <span className="font-bold text-gray-900">{currentStock}</span> sản phẩm</span>
                  ) : (
                    <span className="text-red-500 font-bold uppercase tracking-tight">Hết hàng</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-auto pt-4 border-t border-gray-100">
                {userRole === 'admin' || userRole === 'seller' ? (
                  <div className="w-full text-center py-3 bg-red-50 text-red-500 font-bold rounded-md border border-red-200">
                    🛒 Tính năng mua sắm chỉ dành cho khách hàng.
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleAddToCart(false)}
                      disabled={addingToCart || currentStock <= 0}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 border-2 border-amber-500 font-bold rounded-md transition-all ${addingToCart || currentStock <= 0 ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' : 'text-amber-600 bg-amber-50/50 hover:bg-amber-100 active:scale-95'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 5.4a1 1 0 00.97 1.25h11.76a1 1 0 00.97-1.25L17 13M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" /></svg>
                      {addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ'}
                    </button>
                    <button
                      onClick={() => handleAddToCart(true)}
                      disabled={addingToCart || currentStock <= 0}
                      className={`flex-1 py-3 font-bold rounded-md transition-all shadow-lg ${addingToCart || currentStock <= 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 hover:from-amber-600 hover:to-amber-700 active:scale-95'}`}
                    >
                      Mua Ngay
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
