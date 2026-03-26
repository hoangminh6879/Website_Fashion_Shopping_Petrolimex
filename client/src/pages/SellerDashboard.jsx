import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingShop, setLoadingShop] = useState(true);

  // Product Form State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]); // List of Image objects {_id, url}
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', colors: '', sizes: '', category: '', stock: [], variantImages: [] });

  // Stock Modal States
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockEditingProduct, setStockEditingProduct] = useState(null);
  const [tempStocks, setTempStocks] = useState([]);
  const [tempVariantImages, setTempVariantImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [couponTypes, setCouponTypes] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', couponType: '', expiryDate: '', quantity: '' });
  const [shopForm, setShopForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    fanpage: ''
  });
  const [isUpdatingShop, setIsUpdatingShop] = useState(false);
  const [isSavingStock, setIsSavingStock] = useState(false);

  // Flash Sale States
  const [isFlashSaleModalOpen, setIsFlashSaleModalOpen] = useState(false);
  const [flashSaleEditingProduct, setFlashSaleEditingProduct] = useState(null);
  const [flashSaleDiscount, setFlashSaleDiscount] = useState(0);
  const [flashSaleEndDate, setFlashSaleEndDate] = useState('');
  const [flashSaleStockQty, setFlashSaleStockQty] = useState(0);
  const [flashSaleSubTab, setFlashSaleSubTab] = useState('active'); // 'active' or 'join'

  // Event States
  const [events, setEvents] = useState([]);
  const [myProductEvents, setMyProductEvents] = useState([]);
  const [eventSubTab, setEventSubTab] = useState('list');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [isRegisteringEvent, setIsRegisteringEvent] = useState(false);
  const [registerForm, setRegisterForm] = useState({ eventId: '', productIds: [] });
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopRes, catsRes, couponTypesRes] = await Promise.allSettled([
          api.get('/shops/my-shop'),
          api.get('/categories'),
          api.get('/coupon-types')
        ]);
        if (catsRes.status === 'fulfilled') {
          setCategories(catsRes.value.data);
        }
        if (shopRes.status === 'fulfilled') {
          setShop(shopRes.value.data);
          setShopForm({
            name: shopRes.value.data.name || '',
            description: shopRes.value.data.description || '',
            address: shopRes.value.data.address || '',
            phone: shopRes.value.data.phone || '',
            fanpage: shopRes.value.data.fanpage || ''
          });
        }
        if (couponTypesRes.status === 'fulfilled') {
          setCouponTypes(couponTypesRes.value.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoadingShop(false);
      }
    };
    fetchData();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'coupons') {
      fetchCoupons();
    }
    if (activeTab === 'events') {
      fetchEvents();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    Swal.fire({
      icon: "success",
      title: "Đã đăng xuất",
      text: "Hẹn gặp lại bạn!",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      navigate("/login");
    });
  };

  const fetchEvents = async () => {
    try {
      const [evRes, myPeRes] = await Promise.allSettled([
        api.get('/events'),
        api.get('/product-events/my')
      ]);
      if (evRes.status === 'fulfilled') setEvents(Array.isArray(evRes.value.data) ? evRes.value.data : []);
      if (myPeRes.status === 'fulfilled') setMyProductEvents(Array.isArray(myPeRes.value.data) ? myPeRes.value.data : []);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const handleRegisterProductToEvent = async (e) => {
    if (e) e.preventDefault();
    if (!registerForm.eventId) return Swal.fire('Chú ý', 'Vui lòng chọn sự kiện', 'warning');
    if (!registerForm.productIds || registerForm.productIds.length === 0) return Swal.fire('Chú ý', 'Vui lòng chọn ít nhất một sản phẩm', 'warning');

    setIsRegisteringEvent(true);
    try {
      const res = await api.post('/product-events', {
        eventId: registerForm.eventId,
        productIds: registerForm.productIds
      });

      const data = res.data;
      const msg = [
        data.success?.length ? `✅ Đăng ký thành công: ${data.success.map(p => p.name).join(', ')}` : '',
        data.skipped?.length ? `⚠️ Bỏ qua (đã tham gia): ${data.skipped.map(p => p.name).join(', ')}` : '',
        data.errors?.length ? `❌ Lỗi: ${data.errors.map(p => p.reason).join('; ')}` : '',
      ].filter(Boolean).join('\n');

      Swal.fire({ icon: 'success', title: 'Hoàn tất!', text: msg || 'Đã gửi yêu cầu đăng ký.', confirmButtonColor: '#f59e0b' });

      setRegisterForm({ eventId: '', productIds: [] });
      setIsRegisterModalOpen(false);
      setEventSubTab('my');
      fetchEvents();
    } catch (err) {
      Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi đăng ký', 'error');
    } finally {
      setIsRegisteringEvent(false);
    }
  };

  const toggleProductSelection = (productId) => {
    setRegisterForm(prev => {
      const isSelected = prev.productIds.includes(productId);
      const newIds = isSelected
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId];
      return { ...prev, productIds: newIds };
    });
  };

  const selectAllProducts = () => {
    const allIds = products.map(p => p._id);
    setRegisterForm(prev => ({ ...prev, productIds: allIds }));
  };

  const deselectAllProducts = () => {
    setRegisterForm(prev => ({ ...prev, productIds: [] }));
  };

  const handleWithdrawProductEvent = async (id) => {
    const result = await Swal.fire({ title: 'Rút đăng ký?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy' });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/product-events/${id}`);
      Swal.fire('Thành công', 'Đã rút đăng ký', 'success');
      fetchEvents();
    } catch (err) { Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi', 'error'); }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch only seller's products
      const res = await api.get('/products/seller-products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post('/coupons', newCoupon);
      Swal.fire('Thành công', 'Đã tạo coupon mới', 'success');
      setShowCouponModal(false);
      setNewCoupon({ code: '', discount: '', couponType: '', expiryDate: '', quantity: '' });
      fetchCoupons();
    } catch (err) {
      Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi tạo coupon', 'error');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (confirm('Chắc chắn xóa coupon này?')) {
      try {
        await api.delete(`/coupons/${id}`);
        Swal.fire('Thành công', 'Đã xóa coupon', 'success');
        fetchCoupons();
      } catch (err) {
        Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi xóa coupon', 'error');
      }
    }
  };

  const handleEditClick = (product) => {
    try {
      console.log("Editing product:", product);
      if (!product) throw new Error("Không tìm thấy thông tin sản phẩm");

      setEditingProductId(product._id);
      setIsAddingProduct(true);
      setUploadedImages(product.images || []);

      // Sanitization
      const colorsStr = Array.isArray(product.colors) ? product.colors.join(', ') : (typeof product.colors === 'string' ? product.colors : '');
      const sizesStr = Array.isArray(product.sizes) ? product.sizes.join(', ') : (typeof product.sizes === 'string' ? product.sizes : '');
      const categoryId = product.category?._id || (typeof product.category === 'string' ? product.category : '');

      setNewProduct({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        colors: colorsStr,
        sizes: sizesStr,
        category: categoryId,
        stock: Array.isArray(product.stock) ? product.stock : [],
        variantImages: Array.isArray(product.variantImages) ? product.variantImages : []
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Error in handleEditClick:", err);
      Swal.fire({
        icon: 'error',
        title: 'Không thể mở trình chỉnh sửa',
        text: 'Dữ liệu sản phẩm này có lỗi. Hãy thử tải lại trang.'
      });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    // Optional: if editing, we can link it immediately, but better link it on product save
    // if (editingProductId) formData.append('productId', editingProductId);

    try {
      const res = await api.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newImg = res.data.image;
      // Ensure we have a local copy of the image and its URL
      setUploadedImages(prev => [...prev, newImg]);
    } catch (err) {
      console.error("Upload failed:", err);
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Upload ảnh thất bại' });
    }
  };

  const removeImage = async (imgId) => {
    try {
      await api.delete(`/images/${imgId}`);
      setUploadedImages(prev => prev.filter(img => img._id !== imgId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert('Xóa ảnh thất bại');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        colors: newProduct.colors.split(',').map(c => c.trim()).filter(c => c),
        sizes: newProduct.sizes.split(',').map(s => s.trim()).filter(s => s),
        images: uploadedImages.map(img => img._id),
        category: newProduct.category || null,
        stock: editingProductId ? newProduct.stock : [],
        variantImages: editingProductId ? newProduct.variantImages : []
      };

      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, payload);
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Cập nhật sản phẩm thành công!' });
      } else {
        await api.post('/products', payload);
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Thêm sản phẩm thành công!' });
      }

      setIsAddingProduct(false);
      setEditingProductId(null);
      setUploadedImages([]);
      setNewProduct({ name: '', description: '', price: '', colors: '', sizes: '', category: '', stock: [], variantImages: [] });
      fetchProducts();
    } catch (err) {
      console.error("Product save error:", err);
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Có lỗi xảy ra' });
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Điều này sẽ xóa tất cả hình ảnh liên quan.')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error(err);
        alert('Xóa thất bại');
      }
    }
  };

  const handleUpdateShop = async (e) => {
    e.preventDefault();
    setIsUpdatingShop(true);
    try {
      let res;
      if (!shop) {
        res = await api.post('/shops', shopForm);
        Swal.fire({
          icon: 'success', title: 'Thành công!', text: 'Đã gửi yêu cầu đăng ký shop, chờ Admin duyệt!', confirmButtonColor: '#f59e0b'
        });
      } else {
        res = await api.put('/shops/my-shop', shopForm);
        Swal.fire({
          icon: 'success', title: 'Thành công!', text: 'Cập nhật thông tin shop thành công!', confirmButtonColor: '#f59e0b'
        });
      }
      setShop(res.data);
    } catch (err) {
      console.error("Error updating shop:", err);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: err.response?.data?.message || 'Không thể lưu thông tin shop!',
        confirmButtonColor: '#f59e0b'
      });
    } finally {
      setIsUpdatingShop(false);
    }
  };

  const openStockModal = (product) => {
    setStockEditingProduct(product);
    const colors = product.colors || [];
    const sizes = product.sizes || [];
    const currentStock = product.stock || [];
    const currentVariantImages = product.variantImages || [];

    const items = [];
    const vImages = [];
    let idx = 0;
    colors.forEach(color => {
      sizes.forEach(size => {
        items.push({ color, size, value: currentStock[idx] || 0 });
        vImages.push(currentVariantImages[idx] || '');
        idx++;
      });
    });
    setTempStocks(items);
    setTempVariantImages(vImages);
    setIsStockModalOpen(true);
  };

  const saveStock = async () => {
    console.log("saveStock function called");
    if (isSavingStock) {
      console.log("Already saving stock, ignoring click...");
      return;
    }

    if (!stockEditingProduct || !stockEditingProduct._id) {
      console.error("No product selected for stock editing!");
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không xác định được sản phẩm!' });
      return;
    }

    console.log("Start saveStock with:", {
      productId: stockEditingProduct._id,
      stockCount: tempStocks.length,
      imageCount: tempVariantImages.length
    });

    setIsSavingStock(true);

    try {
      Swal.fire({
        title: 'Đang lưu...',
        text: 'Vui lòng chờ trong giây lát',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const stockArray = tempStocks.map(s => Number(s.value));
      const payload = {
        stock: stockArray,
        variantImages: tempVariantImages
      };

      console.log("Sending PUT request to:", `/products/${stockEditingProduct._id}`, "with payload:", payload);

      const res = await api.put(`/products/${stockEditingProduct._id}`, payload);

      console.log("Save stock SUCCESS:", res.data);

      await Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Đã cập nhật số lượng và ảnh biến thể thành công!',
        timer: 2000,
        showConfirmButton: false
      });

      setIsStockModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Save stock FAILURE:", err);
      Swal.fire({
        icon: 'error',
        title: 'Cập nhật thất bại!',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi lưu biến thể. Vui lòng kiểm tra lại kết nối mạng.'
      });
    } finally {
      setIsSavingStock(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  if (loadingShop) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-800">

          {shop && <div className="text-xs text-gray-400 mt-1 italic">Shop: {shop.name}</div>}
        </div>
        <div className="flex-1 overflow-y-auto mt-4">
          <ul className="space-y-2 px-4">
            <li>
              <button
                onClick={() => setActiveTab('products')}
                className={`w-full text-left px-4 py-3 rounded-md transition ${activeTab === 'products' ? 'bg-amber-500 text-gray-900 font-bold' : 'hover:bg-gray-800'}`}
              >
                📦 Quản lý Sản phẩm
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-4 py-3 rounded-md transition ${activeTab === 'orders' ? 'bg-amber-500 text-gray-900 font-bold' : 'hover:bg-gray-800'}`}
              >
                🛒 Quản lý Đơn hàng
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-4 py-3 rounded-md transition ${activeTab === 'settings' ? 'bg-amber-500 text-gray-900 font-bold' : 'hover:bg-gray-800'}`}
              >
                ⚙️ Thiết lập Shop
              </button>
            </li>
            <li>
              <button
                onClick={() => { setActiveTab('coupons'); }}
                className={`w-full text-left px-4 py-3 rounded-md transition ${activeTab === 'coupons' ? 'bg-amber-500 text-gray-900 font-bold' : 'hover:bg-gray-800'}`}
              >
                🧧 Quản lý Mã Giảm Giá
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('flash-sale')}
                className={`w-full text-left px-4 py-3 rounded-md transition ${activeTab === 'flash-sale' ? 'bg-amber-500 text-gray-900 font-bold' : 'hover:bg-gray-800'}`}
              >
                ⚡ Quản lý Flash Sale
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('events')}
                className={`w-full text-left px-4 py-3 rounded-md transition ${activeTab === 'events' ? 'bg-amber-500 text-gray-900 font-bold' : 'hover:bg-gray-800'}`}
              >
                🎪 Sự Kiện
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
          <h1 className="text-xl font-bold text-gray-800">
            {activeTab === 'products' && 'Quản lý Sản phẩm'}
            {activeTab === 'orders' && 'Quản lý Đơn hàng'}
            {activeTab === 'settings' && 'Thiết lập Shop'}
            {activeTab === 'coupons' && 'Quản lý Mã Giảm Giá'}
            {activeTab === 'flash-sale' && 'Quản lý Flash Sale'}
            {activeTab === 'events' && 'Sự Kiện Khuyến Mãi'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-gray-900">
                {shop?.name?.charAt(0) || 'S'}
              </div>
              <span className="text-sm font-medium text-gray-700">{shop?.name || 'Shop Của Tôi'}</span>
            </div>
            <Link to="/" className="text-sm text-amber-600 font-bold hover:underline">Trở về Trang chủ</Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all border border-red-100"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {!shop && activeTab !== 'settings' && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
              <p className="text-amber-700">Bạn cần thiết lập thông tin Shop trước khi đăng sản phẩm.</p>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              {isAddingProduct ? (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h2 className="text-lg font-bold mb-4">{editingProductId ? 'Chỉnh sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h2>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                        <input required type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
                        <input required type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc (cách nhau dấu phẩy)</label>
                        <input type="text" placeholder="Đỏ, Xanh, Đen" value={newProduct.colors} onChange={e => setNewProduct({ ...newProduct, colors: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kích cỡ (cách nhau dấu phẩy)</label>
                        <input type="text" placeholder="S, M, L, XL" value={newProduct.sizes} onChange={e => setNewProduct({ ...newProduct, sizes: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                        <select
                          value={newProduct.category || ''}
                          onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-amber-500 bg-white"
                        >
                          <option value="">-- Chọn danh mục --</option>
                          {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh chính ({uploadedImages.length})</label>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-md cursor-pointer hover:bg-amber-100 transition font-bold text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            TẢI ẢNH LÊN
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                          </label>
                        </div>
                      </div>
                    </div>

                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 pt-2">
                        {uploadedImages.map((img, idx) => {
                          const imgUrl = img.url ? (img.url.startsWith('http') ? img.url : `http://localhost:5000${img.url}`) : '';
                          return (
                            <div key={img._id || idx} className="relative aspect-square rounded-md overflow-hidden border border-gray-200 group">
                              <img src={imgUrl} alt="Uploaded" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(img._id)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                      <textarea rows="4" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-amber-500"></textarea>
                    </div>
                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                      <button type="button" onClick={() => { setIsAddingProduct(false); setEditingProductId(null); setUploadedImages([]); }} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition">Hủy</button>
                      <button type="submit" className="px-6 py-2 bg-amber-500 text-white rounded-md font-bold hover:bg-amber-600 transition shadow-sm">
                        {editingProductId ? 'Cập nhật Sản Phẩm' : 'Lưu Sản Phẩm'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-700">Tất cả sản phẩm</h2>
                    {shop?.status === 'active' ? (
                      <button onClick={() => setIsAddingProduct(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md font-medium text-sm transition shadow-sm flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Thêm Sản Phẩm Mới
                      </button>
                    ) : (
                      <span className="text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full text-xs border border-amber-200">
                        {shop ? 'Shop đang chờ duyệt' : 'Chưa tạo shop'}
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <div className="p-10 text-center text-gray-500 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                            <th className="p-4 font-semibold">Tên Sản Phẩm</th>
                            <th className="p-4 font-semibold">Giá</th>
                            <th className="p-4 font-semibold">Tồn Kho</th>
                            <th className="p-4 font-semibold">Màu sắc</th>
                            <th className="p-4 font-semibold">Kích cỡ</th>
                            <th className="p-4 font-semibold text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.length > 0 ? products.map(p => (
                            <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                              <td className="p-4 flex items-center gap-3">
                                <img
                                  src={p.images?.[0]?.url
                                    ? (p.images[0].url.startsWith('http') ? p.images[0].url : `http://localhost:5000${p.images[0].url}`)
                                    : `https://picsum.photos/seed/${p._id}/50/50`
                                  }
                                  alt={p.name}
                                  className="w-12 h-12 rounded object-cover border border-gray-200"
                                />
                                <div>
                                  <div className="font-medium text-gray-800 line-clamp-1">{p.name}</div>
                                  <div className="text-xs text-gray-500">Đã bán: {p.sold || 0}</div>
                                </div>
                              </td>
                              <td className="p-4 text-amber-600 font-bold">{formatPrice(p.price || 0)}</td>
                              <td className="p-4 font-bold text-gray-700">
                                {Array.isArray(p.stock) ? p.stock.reduce((sum, val) => sum + val, 0) : (Number(p.stock) || 0)}
                              </td>
                              <td className="p-4 text-sm text-gray-600 font-medium">{p.colors?.join(', ') || '-'}</td>
                              <td className="p-4 text-sm text-gray-600 font-medium">{p.sizes?.join(', ') || '-'}</td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {shop?.status === 'active' ? (
                                    <>
                                      <button
                                        onClick={() => openStockModal(p)}
                                        className="bg-amber-50 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition border border-amber-200"
                                      >
                                        Nhập số lượng
                                      </button>
                                      <button
                                        onClick={() => handleEditClick(p)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                        title="Sửa"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProduct(p._id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                        title="Xóa"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-xs text-gray-400">Chỉ xem</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-gray-500">Chưa có sản phẩm nào. Hãy thêm sản phẩm mới!</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: Quản lý Flash Sale */}
          {activeTab === 'flash-sale' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-2">
                    <span className="text-[#D4AF37]">⚡</span> Flash Sale
                  </h2>
                  <div className="flex gap-4 mt-2">
                    <button
                      onClick={() => setFlashSaleSubTab('active')}
                      className={`text-[10px] font-black uppercase tracking-[0.2em] pb-1 border-b-2 transition-all ${flashSaleSubTab === 'active' ? 'border-[#D4AF37] text-gray-900' : 'border-transparent text-gray-400'}`}
                    >
                      Đang chạy
                    </button>
                    <button
                      onClick={() => setFlashSaleSubTab('join')}
                      className={`text-[10px] font-black uppercase tracking-[0.2em] pb-1 border-b-2 transition-all ${flashSaleSubTab === 'join' ? 'border-[#D4AF37] text-gray-900' : 'border-transparent text-gray-400'}`}
                    >
                      Tham gia mới
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                        <th className="p-6">Sản phẩm</th>
                        <th className="p-6">Giá gốc</th>
                        <th className="p-6">Kho FS / Tổng</th>
                        <th className="p-6 text-center">% Giảm</th>
                        <th className="p-6">Giá Flash Sale</th>
                        <th className="p-6 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {products
                        .filter(p => flashSaleSubTab === 'active' ? p.isFlashSale : !p.isFlashSale)
                        .map(p => (
                          <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-6">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.images?.[0]?.url ? (p.images[0].url.startsWith('http') ? p.images[0].url : `http://localhost:5000${p.images[0].url}`) : `https://picsum.photos/seed/${p._id}/50/50`}
                                  className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm"
                                  alt=""
                                />
                                <div className="font-bold text-gray-800 line-clamp-1">{p.name}</div>
                              </div>
                            </td>
                            <td className="p-6 font-medium text-gray-400 line-through text-sm">{formatPrice(p.price)}</td>
                            <td className="p-6">
                              <div className="font-black text-gray-900">{p.flashSaleStock || 0}</div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase">Tồn: {Array.isArray(p.stock) ? p.stock.reduce((a, b) => a + b, 0) : (p.stock || 0)}</div>
                            </td>
                            <td className="p-6 text-center">
                              <span className="px-2 py-1 bg-red-50 text-red-600 rounded font-black text-xs">-{p.discountPercentage || 0}%</span>
                            </td>
                            <td className="p-6 font-black text-[#D4AF37] text-lg">
                              {p.flashSalePrice ? formatPrice(p.flashSalePrice) : formatPrice(p.price)}
                            </td>
                            <td className="p-6 text-right">
                              <div className="flex justify-end gap-2">
                                {flashSaleSubTab === 'active' && (
                                  <button
                                    onClick={async () => {
                                      const result = await Swal.fire({
                                        title: 'Hủy Flash Sale?',
                                        text: "Bạn có chắc chắn muốn dừng Flash Sale cho sản phẩm này không?",
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#d33',
                                        cancelButtonColor: '#3085d6',
                                        confirmButtonText: 'Đồng ý, hủy!',
                                        cancelButtonText: 'Không'
                                      });
                                      if (result.isConfirmed) {
                                        try {
                                          await api.put(`/products/${p._id}/flash-sale`, { isFlashSale: false });
                                          Swal.fire('Thành công', 'Đã hủy Flash Sale', 'success');
                                          fetchProducts();
                                        } catch (err) {
                                          Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi', 'error');
                                        }
                                      }
                                    }}
                                    className="px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all border border-red-100"
                                  >
                                    HỦY SALE
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setFlashSaleEditingProduct(p);
                                    setFlashSaleDiscount(p.discountPercentage || 0);
                                    setFlashSaleEndDate(p.flashSaleEndDate ? new Date(p.flashSaleEndDate).toISOString().slice(0, 16) : '');
                                    setFlashSaleStockQty(p.flashSaleStock || 0);
                                    setIsFlashSaleModalOpen(true);
                                  }}
                                  className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#D4AF37] hover:text-gray-900 transition-all shadow-lg shadow-gray-200"
                                >
                                  {flashSaleSubTab === 'active' ? 'SỬA' : 'THAM GIA'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {products.filter(p => flashSaleSubTab === 'active' ? p.isFlashSale : !p.isFlashSale).length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-20 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-4xl grayscale opacity-30">⚡</span>
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Không có sản phẩm nào</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              <span className="text-4xl mb-4 block">📦</span>
              <h2 className="text-xl font-bold text-gray-700 mb-2">Chưa có đơn hàng nào</h2>
              <p>Khách hàng chưa đặt mua sản phẩm nào của bạn.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Form thiết lập shop */}
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-xl font-black italic tracking-tighter text-gray-900 leading-none">
                      {shop ? 'THIẾT LẬP ' : 'TẠO '} <span className="text-amber-500">CỬA HÀNG</span>
                    </h2>
                    {shop && (
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Trạng thái: {shop.status === 'active' ? 'Đã duyệt' : 'Đang chờ duyệt'}
                      </p>
                    )}
                  </div>
                </div>

                <form onSubmit={handleUpdateShop} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block leading-none">Tên cửa hàng</label>
                      <input
                        type="text"
                        value={shopForm.name}
                        onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-amber-500 focus:bg-white transition outline-none shadow-inner"
                        placeholder="Ví dụ: Fashion Shop"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block leading-none">Số điện thoại</label>
                      <input
                        type="text"
                        value={shopForm.phone}
                        onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-amber-500 focus:bg-white transition outline-none shadow-inner"
                        placeholder="0123 456 789"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block leading-none">Địa chỉ</label>
                    <input
                      type="text"
                      value={shopForm.address}
                      onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-amber-500 focus:bg-white transition outline-none shadow-inner"
                      placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/Thành phố"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block leading-none">Fanpage URL</label>
                    <input
                      type="text"
                      value={shopForm.fanpage}
                      onChange={(e) => setShopForm({ ...shopForm, fanpage: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-amber-500 focus:bg-white transition outline-none shadow-inner"
                      placeholder="https://facebook.com/yourshop"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block leading-none">Mô tả cửa hàng</label>
                    <textarea
                      rows="4"
                      value={shopForm.description}
                      onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-amber-500 focus:bg-white transition outline-none shadow-inner"
                      placeholder="Giới thiệu về cửa hàng của bạn..."
                    ></textarea>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isUpdatingShop}
                      className="w-full bg-gray-900 text-white font-black uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-amber-500 hover:text-gray-900 transition shadow-xl shadow-gray-200 hover:shadow-amber-500/30 text-[10px] transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingShop ? 'ĐANG LƯU...' : (shop ? 'LƯU THÔNG TIN CỬA HÀNG' : 'GỬI YÊU CẦU TẠO CỬA HÀNG')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Bảng sản phẩm Read-only bên dưới nếu đã có shop */}
              {shop && (
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
                  <h2 className="text-xl font-black text-gray-900 mb-6">SẢN PHẨM CỦA CỬA HÀNG</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                          <th className="p-4 font-semibold">Tên Sản Phẩm</th>
                          <th className="p-4 font-semibold">Giá</th>
                          <th className="p-4 font-semibold">Tồn Kho</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.length > 0 ? products.map(p => (
                          <tr key={p._id} className="border-b border-gray-100">
                            <td className="p-4 flex items-center gap-3">
                              <img
                                src={p.images?.[0]?.url ? (p.images[0].url.startsWith('http') ? p.images[0].url : `http://localhost:5000${p.images[0].url}`) : `https://picsum.photos/seed/${p._id}/50/50`}
                                className="w-10 h-10 rounded object-cover border border-gray-200"
                              />
                              <div className="font-medium text-gray-800 line-clamp-1">{p.name}</div>
                            </td>
                            <td className="p-4 text-amber-600 font-bold">{formatPrice(p.price || 0)}</td>
                            <td className="p-4 font-bold text-gray-700">
                              {Array.isArray(p.stock) ? p.stock.reduce((sum, val) => sum + val, 0) : (Number(p.stock) || 0)}
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="3" className="p-8 text-center text-gray-500">Shop chưa đăng sản phẩm nào.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Quản lý Mã Giảm Giá */}
          {activeTab === 'coupons' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">Quản lý Mã Giảm Giá</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Tạo và quản lý các chương trình ưu đãi của Shop</p>
                </div>
                <button
                  onClick={() => setShowCouponModal(true)}
                  className="bg-gray-900 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl shadow-gray-200 hover:shadow-amber-500/30 flex items-center gap-2 group"
                >
                  <span className="group-hover:rotate-90 transition-transform duration-300">+</span>
                  Tạo Coupon Mới
                </button>
              </div>

              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                        <th className="p-6">Mã</th>
                        <th className="p-6">Loại Ưu Đãi</th>
                        <th className="p-6">Mức giảm</th>
                        <th className="p-6">Số lượng</th>
                        <th className="p-6">Đã dùng</th>
                        <th className="p-6">Hết hạn</th>
                        <th className="p-6 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {coupons.length > 0 ? coupons.map(cp => (
                        <tr key={cp._id} className="group hover:bg-amber-50/30 transition-all duration-300">
                          <td className="p-6">
                            <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg font-black text-xs border border-amber-100 group-hover:bg-amber-500 group-hover:text-gray-900 transition-colors">
                              {cp.code}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="font-bold text-gray-800 text-sm uppercase italic">{cp.couponType?.name || 'Phổ thông'}</div>
                          </td>
                          <td className="p-6 text-sm font-black text-gray-900">
                            {cp.discount.toLocaleString()} <span className="text-[10px] text-gray-400 ml-1">VND</span>
                          </td>
                          <td className="p-6">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center font-black text-blue-600 border border-gray-100">
                              {cp.quantity || 0}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center font-black text-green-600 border border-gray-100">
                              {cp.usedCount || 0}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-700">{new Date(cp.expiryDate).toLocaleDateString('vi-VN')}</span>
                              <span className="text-[10px] font-medium text-gray-400">{new Date(cp.expiryDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="p-6 text-right">
                            <button
                              onClick={() => handleDeleteCoupon(cp._id)}
                              className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group/btn"
                              title="Xóa mã giảm giá"
                            >
                              <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="7" className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl grayscale opacity-30">🧧</div>
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Shop chưa có mã giảm giá nào</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* MODAL TẠO COUPON (SELLER) */}
          {showCouponModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 relative">
                {/* Modal Header */}
                <div className="bg-gray-900 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <div className="relative z-10">
                    <h2 className="text-2xl font-black uppercase tracking-tight italic">Tạo Coupon Mới</h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 mt-1">Thiết lập chương trình ưu đãi cho Shop</p>
                  </div>
                  <button
                    onClick={() => setShowCouponModal(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <form onSubmit={handleCreateCoupon} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block leading-none">Mã Coupon</label>
                      <input
                        required
                        type="text"
                        placeholder="VD: SUMMERSALE"
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-amber-500 focus:bg-white transition outline-none shadow-inner"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block leading-none">Loại Coupon</label>
                      <select
                        required
                        value={newCoupon.couponType}
                        onChange={(e) => setNewCoupon({ ...newCoupon, couponType: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-amber-500 focus:bg-white transition outline-none shadow-inner"
                      >
                        <option value="">-- Chọn loại --</option>
                        {couponTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block leading-none">Mức giảm (VNĐ)</label>
                      <input
                        required
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newCoupon.discount}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-amber-500 focus:bg-white transition outline-none shadow-inner"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block leading-none">Số lượng</label>
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="100"
                        value={newCoupon.quantity}
                        onChange={(e) => setNewCoupon({ ...newCoupon, quantity: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-amber-500 focus:bg-white transition outline-none shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block leading-none">Ngày & Giờ hết hạn</label>
                    <input
                      required
                      type="datetime-local"
                      value={newCoupon.expiryDate}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-amber-500 focus:bg-white transition outline-none shadow-inner"
                    />
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={() => setShowCouponModal(false)}
                      className="flex-1 px-6 py-4 bg-gray-100 border-2 border-transparent text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 hover:text-gray-600 transition-all active:scale-95"
                    >
                      HỦY BỎ
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl shadow-gray-200 hover:shadow-amber-500/30 active:scale-95"
                    >
                      XÁC NHẬN TẠO
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL FLASH SALE */}
          {isFlashSaleModalOpen && flashSaleEditingProduct && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-zoomIn">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-xl font-black text-gray-900 uppercase italic">Thiết lập <span className="text-amber-500">Flash Sale</span></h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{flashSaleEditingProduct.name}</p>
                </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block">Thời gian kết thúc</label>
                      <input
                        type="datetime-local"
                        value={flashSaleEndDate}
                        onChange={(e) => setFlashSaleEndDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block">Số lượng chạy Flash Sale</label>
                      <input
                        type="number"
                        value={flashSaleStockQty}
                        onChange={(e) => setFlashSaleStockQty(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-amber-500 outline-none"
                        placeholder="Ví dụ: 10"
                      />
                      <p className="text-[9px] text-gray-400 mt-1 italic">Tồn kho hiện tại: {Array.isArray(flashSaleEditingProduct.stock) ? flashSaleEditingProduct.stock.reduce((a, b) => a + b, 0) : (flashSaleEditingProduct.stock || 0)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 block">Phần trăm giảm giá (%)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={flashSaleDiscount}
                        onChange={(e) => setFlashSaleDiscount(e.target.value)}
                        className="flex-1 accent-amber-500"
                      />
                      <div className="w-16 h-12 bg-gray-900 text-white flex items-center justify-center rounded-xl font-black text-lg">
                        {flashSaleDiscount}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                      <span>Giá gốc:</span>
                      <span className="line-through">{formatPrice(flashSaleEditingProduct.price)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black text-gray-900 uppercase tracking-widest">
                      <span>Giá FLASH SALE:</span>
                      <span className="text-xl text-amber-500">
                        {formatPrice(Math.round(flashSaleEditingProduct.price * (1 - flashSaleDiscount / 100)))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gray-50 flex gap-4">
                  <button
                    onClick={() => {
                      setIsFlashSaleModalOpen(false);
                      setFlashSaleEditingProduct(null);
                    }}
                    className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:bg-gray-200 transition-colors"
                  >
                    HỦY
                  </button>
                  <button
                    onClick={async () => {
                      const totalStock = Array.isArray(flashSaleEditingProduct.stock)
                        ? flashSaleEditingProduct.stock.reduce((a, b) => a + b, 0)
                        : (flashSaleEditingProduct.stock || 0);

                      if (!flashSaleEndDate || flashSaleStockQty <= 0) {
                        return Swal.fire('Lỗi', 'Vui lòng nhập đầy đủ thời gian và số lượng', 'error');
                      }

                      if (Number(flashSaleStockQty) > totalStock) {
                        return Swal.fire('Lỗi', `Số lượng Flash Sale (${flashSaleStockQty}) không được vượt quá tồn kho (${totalStock})`, 'error');
                      }

                      if (new Date(flashSaleEndDate) <= new Date()) {
                        return Swal.fire('Lỗi', 'Thời gian kết thúc phải lớn hơn thời gian hiện tại', 'error');
                      }

                      try {
                        await api.put(`/products/${flashSaleEditingProduct._id}/flash-sale`, {
                          isFlashSale: Number(flashSaleDiscount) > 0,
                          discountPercentage: Number(flashSaleDiscount),
                          flashSaleEndDate,
                          flashSaleStock: Number(flashSaleStockQty)
                        });
                        Swal.fire({
                          icon: 'success',
                          title: 'Thành công',
                          text: Number(flashSaleDiscount) > 0 ? 'Đã khởi tạo Flash Sale!' : 'Đã tắt Flash Sale cho sản phẩm này.',
                          confirmButtonColor: '#d97706'
                        });
                        setIsFlashSaleModalOpen(false);
                        fetchProducts();
                      } catch (err) {
                        Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi cập nhật', 'error');
                      }
                    }}
                    className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-600 hover:text-gray-900 transition-all shadow-xl shadow-gray-200 hover:shadow-amber-500/30"
                  >
                    XÁC NHẬN CẬP NHẬT
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Events */}
          {activeTab === 'events' && (
            <div className="w-full space-y-6 animate-fadeIn pb-10">
              {/* Sub-tab header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 gap-4">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic leading-none">Sự Kiện Khuyến Mãi</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-3">Tham gia các chương trình ưu đãi để tăng doanh số</p>
                </div>
                <div className="flex gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  {['list', 'my'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setEventSubTab(tab)}
                      className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${eventSubTab === tab ? 'bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-gray-600 hover:bg-white'}`}>
                      {tab === 'list' ? '🎪 Tham gia sự kiện mới' : '📋 Danh sách đã đăng ký'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Sub-tab: Event List */}
                {eventSubTab === 'list' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.length === 0 && (
                      <div className="col-span-full bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
                        <div className="text-6xl mb-4 grayscale opacity-20">🎪</div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Hiện không có sự kiện nào đang diễn ra</p>
                      </div>
                    )}
                    {events.map(ev => {
                      const now = new Date();
                      const isOngoing = ev.status === 'active' && new Date(ev.startDate) <= now && new Date(ev.endDate) >= now;
                      const isUpcoming = new Date(ev.startDate) > now;
                      return (
                        <div key={ev._id} className={`group relative bg-white rounded-[2.5rem] p-8 border transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 ${isOngoing ? 'border-amber-200 bg-amber-50/5' : 'border-gray-100'}`}>
                          <div className="absolute top-6 right-8 text-4xl group-hover:scale-125 transition-transform duration-500 grayscale group-hover:grayscale-0">{ev.eventType?.icon || '🎪'}</div>

                          <div className="space-y-4">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isOngoing ? 'bg-green-100 text-green-600' : isUpcoming ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOngoing ? 'bg-green-500' : isUpcoming ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                              {isOngoing ? 'Đang diễn ra' : isUpcoming ? 'Sắp mở' : ev.status}
                            </div>

                            <h4 className="text-lg font-black text-gray-900 uppercase leading-tight line-clamp-2">{ev.name}</h4>

                            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100 group-hover:bg-white transition-colors">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-gray-400 font-bold uppercase">Bắt đầu</span>
                                <span className="text-gray-900 font-black italic">{new Date(ev.startDate).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span className="text-gray-400 font-bold uppercase">Kết thúc</span>
                                <span className="text-gray-900 font-black italic">{new Date(ev.endDate).toLocaleDateString('vi-VN')}</span>
                              </div>
                              {ev.discountPercentage > 0 && (
                                <div className="flex justify-between text-[10px] pt-1 border-t border-gray-200/50">
                                  <span className="text-amber-500 font-bold uppercase">Ưu đãi lên đến</span>
                                  <span className="text-amber-600 font-black">{ev.discountPercentage}%</span>
                                </div>
                              )}
                            </div>

                            {(isOngoing || isUpcoming) && (
                              <button
                                onClick={() => {
                                  setRegisterForm({ ...registerForm, eventId: ev._id });
                                  setIsRegisterModalOpen(true);
                                }}
                                className="w-full bg-gray-900 text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl shadow-gray-200 hover:shadow-amber-500/30 transform active:scale-95"
                              >
                                Đăng Ký Tham Gia
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Sub-tab: My Registrations */}
                {eventSubTab === 'my' && (
                  <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                            <th className="p-6">Sản phẩm</th>
                            <th className="p-6">Sự kiện</th>
                            <th className="p-6 text-center">Giá SK / Gốc</th>
                            <th className="p-6 text-center">Tồn kho / Giảm</th>
                            <th className="p-6">Trạng thái</th>
                            <th className="p-6 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {myProductEvents.length === 0 && (
                            <tr>
                              <td colSpan="6" className="p-20 text-center">
                                <div className="flex flex-col items-center gap-4">
                                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl grayscale opacity-30">📋</div>
                                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Bạn chưa có đăng ký nào</p>
                                </div>
                              </td>
                            </tr>
                          )}
                          {myProductEvents.map(pe => (
                            <tr key={pe._id} className="group hover:bg-amber-50/30 transition-all duration-300">
                              <td className="p-6">
                                <div className="flex items-center gap-3">
                                  <img src={pe.product?.images?.[0]?.url ? (pe.product.images[0].url.startsWith('http') ? pe.product.images[0].url : `http://localhost:5000${pe.product.images[0].url}`) : `https://picsum.photos/seed/${pe.product?._id}/50/50`} className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm" alt="" />
                                  <div className="font-bold text-gray-800 line-clamp-1">{pe.product?.name}</div>
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="text-sm font-black text-gray-900 uppercase italic">{pe.event?.name}</div>
                              </td>
                              <td className="p-6 text-center">
                                <div className="font-black text-amber-600">
                                  {pe.event?.discountPercentage > 0
                                    ? formatPrice(Math.round(pe.originalPrice * (1 - pe.event.discountPercentage / 100)))
                                    : formatPrice(pe.eventPrice)
                                  }
                                </div>
                                <div className="text-[10px] text-gray-400 line-through italic">{formatPrice(pe.originalPrice)}</div>
                              </td>
                              <td className="p-6 text-center">
                                <div className="font-black text-gray-900">{pe.eventStock}</div>
                                <div className="text-[10px] text-red-500 font-bold">-{pe.discountPercentage}%</div>
                              </td>
                              <td className="p-6">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${pe.status === 'approved' ? 'bg-green-100 text-green-600' : pe.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                  <span className={`w-1 h-1 rounded-full ${pe.status === 'approved' ? 'bg-green-500' : pe.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                  {pe.status === 'approved' ? 'Đã duyệt' : pe.status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
                                </span>
                              </td>
                              <td className="p-6 text-right">
                                {pe.status === 'pending' && (
                                  <button onClick={() => handleWithdrawProductEvent(pe._id)} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Rút đăng ký</button>
                                )}
                                {pe.status === 'rejected' && pe.rejectionReason && (
                                  <div className="text-[9px] text-gray-400 italic mt-1 bg-white p-2 rounded-lg border border-gray-100 shadow-sm inline-block">Lý do: {pe.rejectionReason}</div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODAL ĐĂNG KÝ SỰ KIỆN */}
          {isRegisterModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 relative flex flex-col">
                <div className="bg-gray-900 p-8 text-white relative overflow-hidden flex-shrink-0 shadow-lg z-30">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                  <div className="relative z-10">
                    <h2 className="text-2xl font-black uppercase tracking-tight italic leading-none">ĐĂNG KÝ SỰ KIỆN</h2>
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-500 mt-2">Thiết lập sản phẩm tham gia chương trình</p>
                  </div>
                  <button
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="absolute top-8 right-8 text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <form onSubmit={handleRegisterProductToEvent} className="flex-1 overflow-y-auto p-8 space-y-8 bg-white scrollbar-thin scrollbar-thumb-amber-200">
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-3 block italic">1. Chọn chương trình tham gia *</label>
                    <select
                      required
                      value={registerForm.eventId}
                      onChange={e => setRegisterForm({ ...registerForm, eventId: e.target.value })}
                      className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 font-black text-gray-900 focus:border-amber-500 outline-none transition shadow-sm text-base"
                    >
                      <option value="">-- CHỌN SỰ KIỆN --</option>
                      {events.filter(ev => ev.status !== 'ended').map(ev => (
                        <option key={ev._id} value={ev._id}>{ev.eventType?.icon} {ev.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest italic">2. Chọn các sản phẩm đăng ký tham gia *</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={selectAllProducts} className="text-[9px] font-black text-amber-600 uppercase tracking-widest hover:underline">Chọn tất cả</button>
                        <span className="text-gray-300">|</span>
                        <button type="button" onClick={deselectAllProducts} className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:underline">Bỏ chọn hết</button>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-3 border-b border-gray-100">
                        <input
                          type="text"
                          placeholder="Tìm nhanh sản phẩm..."
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold focus:border-amber-500 focus:bg-white outline-none transition"
                        />
                      </div>
                      <div className="p-3 space-y-2">
                        {products
                          .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
                          .map(p => (
                            <label key={p._id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${registerForm.productIds.includes(p._id) ? 'bg-amber-50 border-amber-500 shadow-md transform translate-x-2' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${registerForm.productIds.includes(p._id) ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-200 bg-white'}`}>
                                {registerForm.productIds.includes(p._id) && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                )}
                              </div>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={registerForm.productIds.includes(p._id)}
                                onChange={() => toggleProductSelection(p._id)}
                              />
                              <img
                                src={p.images?.[0]?.url
                                  ? (p.images[0].url.startsWith('http') ? p.images[0].url : `http://localhost:5000${p.images[0].url}`)
                                  : `https://picsum.photos/seed/${p._id}/50/50`
                                }
                                className="w-10 h-10 rounded-xl object-cover shadow-sm border border-gray-100" alt=""
                              />
                              <div className="flex-1">
                                <div className="font-black text-gray-800 text-sm line-clamp-1 italic uppercase tracking-tight">{p.name}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[10px] font-bold uppercase tracking-widest ${registerForm.eventId && events.find(e => e._id === registerForm.eventId)?.discountPercentage > 0 ? 'text-gray-400 line-through' : 'text-gray-400'}`}>
                                    {formatPrice(p.price)}
                                  </span>
                                  {registerForm.eventId && events.find(e => e._id === registerForm.eventId)?.discountPercentage > 0 && (
                                    <span className="text-[10px] text-amber-600 font-black uppercase tracking-widest flex items-center gap-1">
                                      <span className="bg-amber-100 px-1.5 py-0.5 rounded-md text-[8px] italic -rotate-2">
                                        -{events.find(e => e._id === registerForm.eventId).discountPercentage}%
                                      </span>
                                      {formatPrice(Math.round(p.price * (1 - events.find(e => e._id === registerForm.eventId).discountPercentage / 100)))}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-gray-400 italic">Đã chọn: <span className="text-amber-500 text-lg ml-1">{registerForm.productIds.length}</span> sản phẩm</span>
                      <span className="text-gray-300 italic">Lưu ý: Sản phẩm sẽ sử dụng giá và tồn kho hiện tại</span>
                    </div>
                  </div>
                  <div className="p-8 border-t border-gray-100 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)] sticky bottom-0 z-20 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsRegisterModalOpen(false)}
                      className="flex-1 px-6 py-4 bg-white border-2 border-gray-200 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-95"
                    >
                      HUỶ BỎ
                    </button>
                    <button
                      type="submit"
                      disabled={isRegisteringEvent || registerForm.productIds.length === 0}
                      className="flex-[2] px-6 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      {isRegisteringEvent ? 'ĐANG GỬI...' : '🚀 XÁC NHẬN ĐĂNG KÝ BÙNG NỔ'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <StockModal
            isOpen={isStockModalOpen}
            onClose={() => setIsStockModalOpen(false)}
            product={stockEditingProduct}
            stocks={tempStocks}
            setStocks={setTempStocks}
            variantImages={tempVariantImages}
            setVariantImages={setTempVariantImages}
            onSave={saveStock}
            isSaving={isSavingStock}
          />
        </main>
      </div>
    </div>
  );
}

// Sub-component for Stock Modal
const StockModal = ({ isOpen, onClose, product, stocks, setStocks, variantImages, setVariantImages, onSave, isSaving }) => {
  if (!isOpen || !product) return null;

  const handleVariantImageUpload = async (file, index) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      Swal.fire({ title: 'Đang tải ảnh...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
      const res = await api.post('/images/upload', formData);
      const newVariantImages = [...variantImages];
      newVariantImages[index] = res.data.image.url;
      setVariantImages(newVariantImages);
      Swal.close();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể tải ảnh biến thể!' });
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 italic">Nhập số lượng & Ảnh biến thể</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sản phẩm: {product.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition p-2 bg-white rounded-full shadow-sm hover:rotate-90 duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocks.map((item, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-4 group hover:border-amber-400 hover:bg-amber-50/30 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest leading-none mb-1.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 self-start">Biến thể</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-gray-800 uppercase italic">{item.color}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm font-black text-gray-800 uppercase italic">{item.size}</span>
                    </div>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="0"
                      value={item.value}
                      onChange={(e) => {
                        const newStocks = [...stocks];
                        newStocks[idx].value = e.target.value;
                        setStocks(newStocks);
                      }}
                      className="w-full bg-white border-2 border-gray-100 rounded-xl px-2 py-2 text-right font-black focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition shadow-inner text-amber-600 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 group-hover:border-amber-200 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                    {variantImages[idx] ? (
                      <img src={`http://localhost:5000${variantImages[idx]}`} alt="variant" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest hover:text-amber-700 transition">Chọn ảnh combo</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleVariantImageUpload(e.target.files[0], idx)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          {stocks.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <span className="text-4xl grayscale opacity-30">⚠️</span>
              <p className="text-gray-400 uppercase font-black text-[10px] tracking-[0.2em] max-w-xs leading-relaxed">
                Vui lòng thêm Màu sắc và Kích cỡ trong phần chỉnh sửa sản phẩm trước khi nhập kho.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-8 py-4 bg-white border-2 border-gray-200 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-95"
          >
            ĐÓNG
          </button>
          <button
            onClick={() => {
              console.log("Save button clicked in StockModal");
              if (typeof onSave === 'function') {
                onSave();
              }
            }}
            disabled={stocks.length === 0 || isSaving}
            className={`flex-1 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95 ${stocks.length === 0 || isSaving
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-amber-500 hover:text-gray-900 shadow-gray-200 hover:shadow-amber-500/30'
              }`}
          >
            {isSaving ? 'ĐANG LƯU...' : 'LƯU TẤT CẢ BIẾN THỂ'}
          </button>
        </div>
      </div>
    </div>
  );
};
