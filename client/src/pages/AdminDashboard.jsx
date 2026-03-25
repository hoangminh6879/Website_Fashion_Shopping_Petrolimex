import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [couponTypes, setCouponTypes] = useState([]);
  const [coupons, setCoupons] = useState([]);
  // Event Management State
  const [eventTypes, setEventTypes] = useState([]);
  const [events, setEvents] = useState([]);
  const [pendingProductEvents, setPendingProductEvents] = useState([]);
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTypeForm, setEventTypeForm] = useState({ name: '', label: '', description: '', icon: '🎉', color: '#f59e0b' });
  const [eventForm, setEventForm] = useState({ name: '', description: '', eventType: '', startDate: '', endDate: '', discountPercentage: 0, thumbnailImage: '' });
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventBannerFile, setEventBannerFile] = useState(null);
  const [eventBannerPreview, setEventBannerPreview] = useState("");
  const [eventThumbFile, setEventThumbFile] = useState(null);
  const [eventThumbPreview, setEventThumbPreview] = useState("");
  const [showEventProductsModal, setShowEventProductsModal] = useState(false);
  const [selectedEventForProducts, setSelectedEventForProducts] = useState(null);
  const [eventProducts, setEventProducts] = useState([]);
  const navigate = useNavigate();

  // Category Form State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState("");

  // CouponType Form State
  const [showCouponTypeModal, setShowCouponTypeModal] = useState(false);
  const [editingCouponType, setEditingCouponType] = useState(null);
  const [couponTypeName, setCouponTypeName] = useState("");
  const [couponTypeDesc, setCouponTypeDesc] = useState("");

  // Coupon Form State (Admin)
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: "", discount: "", couponType: "", expiryDate: "", quantity: "" });

  useEffect(() => {
    fetchData(activeTab);
    fetchPendingCount();
  }, [activeTab]);

  const fetchPendingCount = async () => {
    try {
      const res = await api.get("/product-events/pending");
      setPendingProductEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Error fetching pending count:", err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Swal.fire({
      icon: 'success',
      title: 'Đã đăng xuất',
      text: 'Chào tạm biệt Admin!',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      navigate('/login');
    });
  };

  const fetchData = async (tab) => {
    try {
      if (tab === "overview") {
        const [statsRes, usersRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users")
        ]);
        setStats(statsRes.data || {});
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      } else if (tab === "users" || tab === "upgrade_requests") {
        const res = await api.get("/admin/users");
        setUsers(Array.isArray(res.data) ? res.data : []);
      } else if (tab === "shops") {
        const res = await api.get("/admin/shops");
        setShops(Array.isArray(res.data) ? res.data : []);
      } else if (tab === "categories") {
        const res = await api.get("/categories");
        setCategories(Array.isArray(res.data) ? res.data : []);
      } else if (tab === "couponTypes") {
        const res = await api.get("/coupon-types");
        setCouponTypes(Array.isArray(res.data) ? res.data : []);
      } else if (tab === "coupons") {
        const [couponsRes, typesRes] = await Promise.all([
          api.get("/coupons"),
          api.get("/coupon-types")
        ]);
        setCoupons(Array.isArray(couponsRes.data) ? couponsRes.data : []);
        setCouponTypes(Array.isArray(typesRes.data) ? typesRes.data : []);
      } else if (tab === "eventTypes") {
        const res = await api.get("/event-types");
        setEventTypes(Array.isArray(res.data) ? res.data : []);
      } else if (tab === "events") {
        const [evRes, typesRes] = await Promise.all([ api.get("/events"), api.get("/event-types") ]);
        setEvents(Array.isArray(evRes.data) ? evRes.data : []);
        setEventTypes(Array.isArray(typesRes.data) ? typesRes.data : []);
      } else if (tab === "productEvents") {
        const res = await api.get("/product-events/pending");
        setPendingProductEvents(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        Swal.fire("Lỗi", "Bạn không có quyền truy cập", "error");
        navigate("/");
      } else {
        console.error("Lỗi lấy dữ liệu:", err);
      }
    }
  };

  const handleSellerRequest = async (userId, action) => {
    try {
      await api.put(`/admin/users/${userId}/approve-seller`, { action });
      Swal.fire("Thành công", action === 'approve' ? "Đã cập nhật yêu cầu mở shop" : "Đã từ chối yêu cầu", "success");
      fetchData("users"); // reload
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi xử lý yêu cầu", "error");
    }
  };

  const handleShopStatus = async (shopId, status) => {
    try {
      await api.put(`/admin/shops/${shopId}/status`, { status });
      Swal.fire("Thành công", status === 'active' ? "Đã duyệt cửa hàng" : "Đã từ chối cửa hàng", "success");
      fetchData("shops");
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi xử lý cửa hàng", "error");
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      Swal.fire("Thành công", `Đã cấp quyền ${newRole}`, "success");
      fetchData("users"); // reload
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi đổi quyền", "error");
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Swal.fire("Lỗi", "Vui lòng nhập tên danh mục", "warning");
      return;
    }
    
    let imageUrl = editingCategory?.image || null;

    try {
      // Nếu có chọn ảnh mới, upload trước
      if (categoryImage) {
        const formData = new FormData();
        formData.append("image", categoryImage);
        const uploadRes = await api.post("/images/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        imageUrl = uploadRes.data.image.url;
      }

      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, { 
          name: categoryName,
          image: imageUrl 
        });
        Swal.fire("Thành công", "Đã cập nhật danh mục", "success");
      } else {
        await api.post("/categories", { 
          name: categoryName,
          image: imageUrl 
        });
        Swal.fire("Thành công", "Đã thêm danh mục mới", "success");
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryName("");
      setCategoryImage(null);
      setCategoryImagePreview("");
      fetchData("categories");
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi lưu danh mục", "error");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (confirm("Chắc chắn xóa danh mục này? Các sản phẩm thuộc danh mục sẽ không bị xóa.")) {
      try {
        await api.delete(`/categories/${id}`);
        Swal.fire("Thành công", "Đã xóa danh mục", "success");
        fetchData("categories");
      } catch (err) {
        Swal.fire("Lỗi", err.response?.data?.message || "Lỗi xóa danh mục", "error");
      }
    }
  };

  const handleSaveCouponType = async () => {
    if (!couponTypeName.trim()) {
      Swal.fire("Lỗi", "Vui lòng nhập tên loại coupon", "warning");
      return;
    }
    try {
      if (editingCouponType) {
        await api.put(`/coupon-types/${editingCouponType._id}`, { name: couponTypeName, description: couponTypeDesc });
        Swal.fire("Thành công", "Đã cập nhật loại coupon", "success");
      } else {
        await api.post("/coupon-types", { name: couponTypeName, description: couponTypeDesc });
        Swal.fire("Thành công", "Đã thêm loại coupon mới", "success");
      }
      setShowCouponTypeModal(false);
      setEditingCouponType(null);
      setCouponTypeName("");
      setCouponTypeDesc("");
      fetchData("couponTypes");
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi lưu loại coupon", "error");
    }
  };

  const handleDeleteCouponType = async (id) => {
    if (confirm("Chắc chắn xóa loại coupon này?")) {
      try {
        await api.delete(`/coupon-types/${id}`);
        Swal.fire("Thành công", "Đã xóa loại coupon", "success");
        fetchData("couponTypes");
      } catch (err) {
        Swal.fire("Lỗi", err.response?.data?.message || "Lỗi xóa loại coupon", "error");
      }
    }
  };

  const handleCreateCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount || !newCoupon.couponType || !newCoupon.expiryDate || !newCoupon.quantity) {
      Swal.fire("Lỗi", "Vui lòng nhập đầy đủ thông tin", "warning");
      return;
    }
    try {
      await api.post("/coupons", newCoupon);
      Swal.fire("Thành công", "Đã tạo coupon mới", "success");
      setShowCouponModal(false);
      setNewCoupon({ code: "", discount: "", couponType: "", expiryDate: "", quantity: "" });
      fetchData("coupons");
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi tạo coupon", "error");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (confirm("Chắc chắn xóa coupon này?")) {
      try {
        await api.delete(`/coupons/${id}`);
        Swal.fire("Thành công", "Đã xóa coupon", "success");
        fetchData("coupons");
      } catch (err) {
        Swal.fire("Lỗi", err.response?.data?.message || "Lỗi xóa coupon", "error");
      }
    }
  };

  const handleSaveEventType = async () => {
    if (!eventTypeForm.name || !eventTypeForm.label) return Swal.fire('Lỗi', 'Tên và nhãn là bắt buộc', 'warning');
    try {
      await api.post('/event-types', eventTypeForm);
      Swal.fire('Thành công', 'Đã tạo loại sự kiện', 'success');
      setShowEventTypeModal(false);
      setEventTypeForm({ name: '', label: '', description: '', icon: '🎉', color: '#f59e0b' });
      fetchData('eventTypes');
    } catch (err) { Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi tạo', 'error'); }
  };

  const handleDeleteEventType = async (id) => {
    if (!confirm('Xóa loại sự kiện này?')) return;
    try { await api.delete(`/event-types/${id}`); Swal.fire('Thành công', 'Đã xóa', 'success'); fetchData('eventTypes'); }
    catch (err) { Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi xóa', 'error'); }
  };

  const handleSaveEvent = async () => {
    const { name, eventType, startDate, endDate } = eventForm;
    if (!name || !eventType || !startDate || !endDate) return Swal.fire('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
    
    let updatedEventForm = { ...eventForm };

    try {
      // Upload Thumbnail if selected
      if (eventThumbFile) {
        const formData = new FormData();
        formData.append("image", eventThumbFile);
        const uploadRes = await api.post("/images/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        updatedEventForm.thumbnailImage = uploadRes.data.image.url;
      }

      if (editingEvent) {
        await api.put(`/events/${editingEvent._id}`, updatedEventForm);
        Swal.fire('Thành công', 'Đã cập nhật sự kiện', 'success');
      } else {
        await api.post('/events', updatedEventForm);
        Swal.fire('Thành công', 'Đã tạo sự kiện', 'success');
      }

      setShowEventModal(false);
      setEditingEvent(null);
      setEventForm({ name: '', description: '', eventType: '', startDate: '', endDate: '', discountPercentage: 0, thumbnailImage: '' });
      setEventBannerFile(null);
      setEventBannerPreview("");
      setEventThumbFile(null);
      setEventThumbPreview("");
      fetchData('events');
    } catch (err) { Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi lưu sự kiện', 'error'); }
  };

  const handleEditEvent = (ev) => {
    setEditingEvent(ev);
    setEventForm({
      name: ev.name,
      description: ev.description,
      eventType: ev.eventType?._id || ev.eventType,
      startDate: new Date(ev.startDate).toISOString().slice(0, 16),
      endDate: new Date(ev.endDate).toISOString().slice(0, 16),
      discountPercentage: ev.discountPercentage,
      thumbnailImage: ev.thumbnailImage
    });
    setEventThumbPreview(ev.thumbnailImage ? (ev.thumbnailImage.startsWith('http') ? ev.thumbnailImage : `http://localhost:5000${ev.thumbnailImage}`) : "");
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Xóa sự kiện? Tất cả sản phẩm đã đăng ký cũng bị xóa!')) return;
    try { await api.delete(`/events/${id}`); Swal.fire('Thành công', 'Đã xóa sự kiện', 'success'); fetchData('events'); }
    catch (err) { Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi xóa', 'error'); }
  };

  const handleApproveProductEvent = async (id, status) => {
    const reason = status === 'rejected' ? await Swal.fire({ input: 'textarea', inputLabel: 'Lý do từ chối', showCancelButton: true }).then(r => r.value) : '';
    try {
      await api.put(`/product-events/${id}/approve`, { status, reason });
      Swal.fire('Thành công', status === 'approved' ? 'Đã duyệt sản phẩm' : 'Đã từ chối', 'success');
      fetchData('productEvents');
      fetchPendingCount();
    } catch (err) { Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi', 'error'); }
  };

  const handleActivateEvent = async (id, newStatus) => {
    try { await api.put(`/events/${id}`, { status: newStatus }); fetchData('events'); Swal.fire('OK', 'Đã cập nhật trạng thái sự kiện', 'success'); }
    catch (err) { Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi', 'error'); }
  };

  const fetchEventProducts = async (eventId) => {
    try {
      const res = await api.get(`/product-events?eventId=${eventId}&status=all`); // Get all statuses for admin
      setEventProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi lấy sản phẩm sự kiện:", err);
    }
  };

  const handleRecalculatePrices = async (eventId) => {
    try {
      const res = await api.post(`/product-events/admin/recalculate/${eventId}`);
      Swal.fire("Thành công", res.data.message, "success");
      fetchEventProducts(eventId);
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi đồng bộ giá", "error");
    }
  };

  const handleAdminRemoveProductFromEvent = async (regId) => {
    if (!confirm("Xóa sản phẩm này khỏi sự kiện? Hành động này không thể hoàn tác.")) return;
    try {
      await api.delete(`/product-events/admin/${regId}`);
      Swal.fire("Thành công", "Đã xóa sản phẩm khỏi sự kiện", "success");
      // Refresh list
      fetchEventProducts(selectedEventForProducts._id);
      fetchData("events"); // Update count
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi xóa sản phẩm", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-amber-900/50 sticky top-0 z-50 py-4 px-6 text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600">
            ADMIN PANEL
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-semibold transition"
          >
            Trang chủ
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500/20 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold transition border border-red-500/50"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-4 border border-gray-100 flex flex-col gap-2 sticky top-24">
            <button
              onClick={() => setActiveTab("overview")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${
                activeTab === "overview" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              📊 Tổng quan
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${
                activeTab === "users" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              👥 Người dùng
            </button>
            <button
              onClick={() => setActiveTab("upgrade_requests")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all flex justify-between items-center ${
                activeTab === "upgrade_requests" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>⭐ Yêu cầu nâng cấp</span>
              {Array.isArray(users) && users.filter(u => u.sellerRequest?.status === 'pending' && u.role !== 'seller').length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {users.filter(u => u.sellerRequest?.status === 'pending' && u.role !== 'seller').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("shops")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${
                activeTab === "shops" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              🏪 Cửa hàng
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${
                activeTab === "categories" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              🏷️ Danh mục
            </button>
            <button
              onClick={() => setActiveTab("couponTypes")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${
                activeTab === "couponTypes" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              🎟️ Loại Coupon
            </button>
            <button
              onClick={() => setActiveTab("coupons")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${
                activeTab === "coupons" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              🧧 Mã Giảm Giá
            </button>
            <div className="border-t border-gray-100 my-2"></div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 pb-1">Quản Lý Sự Kiện</p>
            <button onClick={() => setActiveTab("eventTypes")} className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${ activeTab === "eventTypes" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100" }`}>🏷️ Loại Sự Kiện</button>
            <button onClick={() => setActiveTab("events")} className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${ activeTab === "events" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100" }`}>🎪 Sự Kiện</button>
            <button onClick={() => setActiveTab("productEvents")} className={`text-left px-5 py-3 rounded-xl font-bold transition-all flex justify-between items-center ${ activeTab === "productEvents" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100" }`}>
              <span>⏳ Duyệt Sản Phẩm</span>
              {pendingProductEvents.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingProductEvents.length}</span>}
            </button>
          </div>
        </aside>

        {/* Cột hiển thị dữ liệu chính */}
        <main className="flex-1 bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
          
          {/* TAB: Tổng quan */}
          {activeTab === "overview" && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Thống kê hệ thống</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center">
                  <div className="text-blue-500 text-4xl mb-2 font-black">{stats.totalUsers || 0}</div>
                  <div className="text-blue-800 font-semibold text-sm uppercase">Người dùng</div>
                </div>
                <div className="bg-green-50 border border-green-100 p-6 rounded-2xl text-center">
                  <div className="text-green-500 text-4xl mb-2 font-black">{stats.totalShops || 0}</div>
                  <div className="text-green-800 font-semibold text-sm uppercase">Cửa hàng</div>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl text-center">
                  <div className="text-purple-500 text-4xl mb-2 font-black">{stats.totalProducts || 0}</div>
                  <div className="text-purple-800 font-semibold text-sm uppercase">Sản phẩm</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl text-center">
                  <div className="text-amber-500 text-4xl mb-2 font-black">{stats.totalOrders || 0}</div>
                  <div className="text-amber-800 font-semibold text-sm uppercase">Đơn hàng</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Người dùng */}
          {activeTab === "users" && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Quản lý người dùng</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Tên</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Quyền</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.filter(u => !(u.sellerRequest?.status === 'pending' && u.role !== 'seller')).map(u => (
                      <tr key={u._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 text-gray-600">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            u.role === 'admin' ? 'bg-red-100 text-red-700' :
                            u.role === 'seller' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {u.sellerRequest?.status === 'rejected' ? (
                            <span className="text-red-500 font-medium select-none">Từng bị từ chối</span>
                          ) : (
                            <span className="text-green-600 font-medium select-none">Bình thường</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {u.role !== 'admin' && (
                              <button 
                                onClick={() => {
                                  if (confirm("Chắc chắn cấp quyền Admin thay vì User/Seller?")) {
                                    handleChangeRole(u._id, 'admin')
                                  }
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded border border-red-200 text-xs font-bold transition"
                              >
                                Cấp Admin
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.filter(u => !(u.sellerRequest?.status === 'pending' && u.role !== 'seller')).length === 0 && (
                      <tr><td colSpan="5" className="text-center py-8 text-gray-400">Không có người dùng nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Yêu cầu nâng cấp */}
          {activeTab === "upgrade_requests" && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">Yêu cầu nâng cấp Seller</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Người dùng</th>
                      <th className="px-6 py-4">Lý do mở shop</th>
                      <th className="px-6 py-4 text-center">Ảnh minh chứng</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.filter(u => u.sellerRequest?.status === 'pending' && u.role !== 'seller').map(u => (
                      <tr key={u._id} className="hover:bg-amber-50/50 transition border-l-4 border-l-amber-500">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 italic whitespace-normal max-w-sm">
                          "{u.sellerRequest.reason}"
                        </td>
                        <td className="px-6 py-4 text-center">
                          <a href={`http://localhost:5000${u.sellerRequest.proofImage}`} target="_blank" rel="noreferrer" className="inline-block hover:scale-105 transition">
                            <img src={`http://localhost:5000${u.sellerRequest.proofImage}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm inline-block" alt="minh chứng" />
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <button 
                              onClick={() => handleSellerRequest(u._id, 'approve')}
                              className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded shadow-sm text-xs font-bold transition"
                            >
                              Duyệt (Nâng Seller)
                            </button>
                            <button 
                              onClick={() => handleSellerRequest(u._id, 'reject')}
                              className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded shadow-sm text-xs font-bold transition"
                            >
                              Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.filter(u => u.sellerRequest?.status === 'pending' && u.role !== 'seller').length === 0 && (
                      <tr><td colSpan="4" className="text-center py-12 text-gray-400 font-medium">✨ Hiện không có yêu cầu nâng cấp nào đang chờ xử lý.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Cửa hàng */}
          {activeTab === "shops" && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Quản lý cửa hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.isArray(shops) && shops.map(shop => (
                  <div key={shop._id} className="border border-gray-100 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition">
                    <img 
                      src={`http://localhost:5000${shop.image}`} 
                      onError={(e) => e.target.src="https://picsum.photos/150"}
                      className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                    />
                    <div className="flex flex-col justify-center flex-1">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{shop.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Chủ: <span className="font-semibold">{shop.owner?.name || "Không rõ"}</span>
                      </p>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full w-max ${
                          shop.status === 'active' ? 'bg-green-100 text-green-700' :
                          shop.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {shop.status === 'active' ? 'Đang hoạt động' : 
                           shop.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                        </span>
                        
                        {shop.status === 'pending' && (
                          <div className="flex items-center gap-2 ml-auto">
                            <button 
                              onClick={() => handleShopStatus(shop._id, 'active')}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs font-bold rounded shadow transition"
                            >
                              Duyệt
                            </button>
                            <button 
                              onClick={() => handleShopStatus(shop._id, 'rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs font-bold rounded shadow transition"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {shops.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400">Không có cửa hàng nào được tạo.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Danh mục */}
          {activeTab === "categories" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">Quản lý danh mục</h2>
                <button 
                  onClick={() => { setEditingCategory(null); setCategoryName(""); setShowCategoryModal(true); }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-amber-500/30 transition"
                >
                  + Thêm danh mục
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Ảnh</th>
                      <th className="px-6 py-4">Tên danh mục</th>
                      <th className="px-6 py-4">Slug (Đường dẫn)</th>
                      <th className="px-6 py-4">Cấp quản lý</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.isArray(categories) && categories.map(cat => (
                      <tr key={cat._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <img 
                            src={cat.image ? `http://localhost:5000${cat.image}` : "https://picsum.photos/50"} 
                            alt={cat.name} 
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                          />
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">{cat.name}</td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{cat.slug}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {cat.parent ? cat.parent.name : <span className="text-amber-600 font-semibold border border-amber-200 bg-amber-50 px-2 py-0.5 rounded text-xs">Gốc</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => { 
                                setEditingCategory(cat); 
                                setCategoryName(cat.name); 
                                setCategoryImagePreview(cat.image ? `http://localhost:5000${cat.image}` : "");
                                setShowCategoryModal(true); 
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded shadow-sm text-xs font-bold transition border border-blue-200"
                            >
                              Sửa
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat._id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded shadow-sm text-xs font-bold transition border border-red-200"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-8 text-gray-400">Không có danh mục nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Loại Coupon */}
          {activeTab === "couponTypes" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">Quản lý loại Coupon</h2>
                <button 
                  onClick={() => { setEditingCouponType(null); setCouponTypeName(""); setCouponTypeDesc(""); setShowCouponTypeModal(true); }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-amber-500/30 transition"
                >
                  + Thêm loại coupon
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Tên loại</th>
                      <th className="px-6 py-4">Mô tả</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.isArray(couponTypes) && couponTypes.map(type => (
                      <tr key={type._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-bold text-gray-900">{type.name}</td>
                        <td className="px-6 py-4 text-gray-500">{type.description}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => { setEditingCouponType(type); setCouponTypeName(type.name); setCouponTypeDesc(type.description); setShowCouponTypeModal(true); }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded shadow-sm text-xs font-bold transition border border-blue-200"
                            >
                              Sửa
                            </button>
                            <button 
                              onClick={() => handleDeleteCouponType(type._id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded shadow-sm text-xs font-bold transition border border-red-200"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {couponTypes.length === 0 && (
                      <tr><td colSpan="3" className="text-center py-8 text-gray-400">Không có loại coupon nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Mã Giảm Giá (Admin) */}
          {activeTab === "coupons" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">Quản lý Mã Giảm Giá</h2>
                <button 
                  onClick={() => setShowCouponModal(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-amber-500/30 transition"
                >
                  + Tạo Coupon Admin
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Mã</th>
                      <th className="px-6 py-4">Loại</th>
                      <th className="px-6 py-4">Giảm giá</th>
                      <th className="px-6 py-4">Số lượng</th>
                      <th className="px-6 py-4">Đã dùng</th>
                      <th className="px-6 py-4">Người tạo</th>
                      <th className="px-6 py-4">Hết hạn</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.isArray(coupons) && coupons.map(cp => (
                      <tr key={cp._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-bold text-amber-600">{cp.code}</td>
                        <td className="px-6 py-4">{cp.couponType?.name || "N/A"}</td>
                        <td className="px-6 py-4 font-bold">{cp.discount?.toLocaleString() || 0}</td>
                        <td className="px-6 py-4 font-bold text-blue-600">{cp.quantity || 0}</td>
                        <td className="px-6 py-4 font-bold text-green-600">{cp.usedCount || 0}</td>
                        <td className="px-6 py-4 uppercase text-xs font-bold">
                           {cp.createdBy === 'admin' ? <span className="text-red-600">Admin</span> : <span className="text-amber-600">Shop: {cp.shop?.name || "N/A"}</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {cp.expiryDate ? new Date(cp.expiryDate).toLocaleString("vi-VN") : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleDeleteCoupon(cp._id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded shadow-sm text-xs font-bold transition border border-red-200"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr><td colSpan="6" className="text-center py-8 text-gray-400">Không có mã giảm giá nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Loại Sự Kiện */}
          {activeTab === "eventTypes" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">Loại Sự Kiện</h2>
                <button onClick={() => setShowEventTypeModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-amber-500/30 transition">+ Thêm loại</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventTypes.map(et => (
                  <div key={et._id} className="border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition">
                    <div className="text-4xl w-14 h-14 flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">{et.icon}</div>
                    <div className="flex-1">
                      <div className="font-black text-gray-900 uppercase tracking-tight">{et.label}</div>
                      <div className="text-xs text-gray-400 font-mono">{et.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{et.description}</div>
                    </div>
                    <button onClick={() => handleDeleteEventType(et._id)} className="text-red-400 hover:text-red-600 text-xs font-bold transition">Xóa</button>
                  </div>
                ))}
                {eventTypes.length === 0 && <p className="col-span-full text-center py-10 text-gray-400">Chưa có loại sự kiện nào.</p>}
              </div>
            </div>
          )}

          {/* TAB: Sự Kiện */}
          {activeTab === "events" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">Quản Lý Sự Kiện</h2>
                <button onClick={() => setShowEventModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-amber-500/30 transition">+ Tạo sự kiện</button>
              </div>
              <div className="space-y-4">
                {events.map(ev => {
                  const now = new Date();
                  const isOngoing = ev.status === 'active' && new Date(ev.startDate) <= now && new Date(ev.endDate) >= now;
                  return (
                    <div key={ev._id} className={`border rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm transition hover:shadow-md ${ isOngoing ? 'border-amber-400 bg-amber-50/30' : 'border-gray-100 bg-white' }`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{ev.eventType?.icon || '🎪'}</span>
                          <div>
                            <h3 className="font-black text-gray-900 uppercase tracking-tight">{ev.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ ev.status === 'active' ? 'bg-green-100 text-green-700' : ev.status === 'draft' ? 'bg-gray-100 text-gray-500' : ev.status === 'ended' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-600' }`}>{ev.status.toUpperCase()}{isOngoing ? ' (Đang diễn ra)' : ''}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <span>🕐 Bắt đầu: <b>{new Date(ev.startDate).toLocaleString('vi-VN')}</b></span>
                          <span>🕔 Kết thúc: <b>{new Date(ev.endDate).toLocaleString('vi-VN')}</b></span>
                          <span>🛍️ Sản phẩm tham gia: <b>{ev.totalProductCount || 0}</b></span>
                          <span>💰 Giảm: <b>{ev.discountPercentage}%</b></span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ev.status === 'draft' && <button onClick={() => handleActivateEvent(ev._id, 'active')} className="bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-600 transition">Kích hoạt</button>}
                        {ev.status === 'active' && <button onClick={() => handleActivateEvent(ev._id, 'paused')} className="bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-600 transition">Tạm dừng</button>}
                        {ev.status === 'paused' && <button onClick={() => handleActivateEvent(ev._id, 'active')} className="bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-600 transition">Tiếp tục</button>}
                        <button onClick={() => handleEditEvent(ev)} className="bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-200 transition">Sửa</button>
                        <button 
                          onClick={() => {
                            setSelectedEventForProducts(ev);
                            fetchEventProducts(ev._id);
                            setShowEventProductsModal(true);
                          }}
                          className="bg-amber-100 text-amber-600 text-xs font-bold px-4 py-2 rounded-xl border border-amber-200 hover:bg-amber-500 hover:text-white transition"
                        >
                          Quản lý SP
                        </button>
                        <button onClick={() => handleDeleteEvent(ev._id)} className="bg-red-50 text-red-500 text-xs font-bold px-4 py-2 rounded-xl border border-red-100 hover:bg-red-500 hover:text-white transition">Xóa</button>
                      </div>
                    </div>
                  );
                })}
                {events.length === 0 && <p className="text-center py-12 text-gray-400">Chưa có sự kiện nào. Hãy tạo sự kiện đầu tiên!</p>}
              </div>
            </div>
          )}

          {/* TAB: Duyệt Sản Phẩm Sự Kiện */}
          {activeTab === "productEvents" && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Duyệt Sản Phẩm Vào Sự Kiện <span className="text-red-500 text-lg">({pendingProductEvents.length} chờ duyệt)</span></h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                    <tr>
                      <th className="px-4 py-3">Sản phẩm</th>
                      <th className="px-4 py-3">Shop</th>
                      <th className="px-4 py-3">Sự kiện</th>
                      <th className="px-4 py-3">Giá SK</th>
                      <th className="px-4 py-3">Tồn kho</th>
                      <th className="px-4 py-3">Giảm</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingProductEvents.map(pe => (
                      <tr key={pe._id} className="hover:bg-amber-50/30 transition">
                        <td className="px-4 py-3 font-semibold text-gray-900">{pe.product?.name}</td>
                        <td className="px-4 py-3 text-gray-600">{pe.shop?.name}</td>
                        <td className="px-4 py-3 text-gray-600">{pe.event?.name}</td>
                        <td className="px-4 py-3 font-bold text-amber-600">{pe.eventPrice?.toLocaleString()}đ</td>
                        <td className="px-4 py-3">{pe.eventStock}</td>
                        <td className="px-4 py-3 text-red-500 font-bold">{pe.discountPercentage}%</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => handleApproveProductEvent(pe._id, 'approved')} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">Duyệt</button>
                            <button onClick={() => handleApproveProductEvent(pe._id, 'rejected')} className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 transition">Từ chối</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingProductEvents.length === 0 && <tr><td colSpan="7" className="text-center py-10 text-gray-400">Không có đăng ký nào đang chờ duyệt.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL THÊM/SỬA DANH MỤC */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-gray-900 mb-6 uppercase">
              {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên danh mục</label>
                <input 
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Nhập tên danh mục (vd: Áo thun)"
                  className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh danh mục</label>
                <div className="flex flex-col gap-4">
                  {categoryImagePreview && (
                    <img 
                      src={categoryImagePreview} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-xl border border-gray-200"
                    />
                  )}
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setCategoryImage(file);
                        setCategoryImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryName(""); }}
                className="flex-1 bg-gray-100 text-gray-600 font-black uppercase py-4 rounded-xl hover:bg-gray-200 transition"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveCategory}
                className="flex-1 bg-amber-500 text-gray-900 font-black uppercase py-4 rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/30 transition"
              >
                Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM/SỬA LOẠI COUPON */}
      {showCouponTypeModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-gray-900 mb-6 uppercase">
              {editingCouponType ? "Sửa loại coupon" : "Thêm loại coupon mới"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên loại (vd: FREESHIP)</label>
                <input 
                  type="text"
                  value={couponTypeName}
                  onChange={(e) => setCouponTypeName(e.target.value)}
                  placeholder="Nhập tên loại"
                  className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <textarea 
                  value={couponTypeDesc}
                  onChange={(e) => setCouponTypeDesc(e.target.value)}
                  placeholder="Mô tả loại coupon"
                  className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition font-medium"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => { setShowCouponTypeModal(false); setEditingCouponType(null); }}
                className="flex-1 bg-gray-100 text-gray-600 font-black uppercase py-4 rounded-xl hover:bg-gray-200 transition"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveCouponType}
                className="flex-1 bg-amber-500 text-gray-900 font-black uppercase py-4 rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/30 transition"
              >
                Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO COUPON (ADMIN) */}
      {showCouponModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-gray-900 mb-6 uppercase">Tạo Coupon Admin mới</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mã Coupon</label>
                <input 
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  placeholder="VD: GIAMGIA10"
                  className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Loại Coupon</label>
                <select 
                  value={newCoupon.couponType}
                  onChange={(e) => setNewCoupon({ ...newCoupon, couponType: e.target.value })}
                  className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                >
                  <option value="">-- Chọn loại --</option>
                  {Array.isArray(couponTypes) && couponTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mức giảm</label>
                <input 
                  type="number"
                  value={newCoupon.discount}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                  placeholder="Số tiền hoặc %"
                  className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Số lượng</label>
                <input 
                  type="number"
                  min="1"
                  value={newCoupon.quantity}
                  onChange={(e) => setNewCoupon({ ...newCoupon, quantity: e.target.value })}
                  placeholder="VD: 100"
                  className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ngày & Giờ hết hạn</label>
                <input 
                  type="datetime-local"
                  value={newCoupon.expiryDate}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                  className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowCouponModal(false)}
                className="flex-1 bg-gray-100 text-gray-600 font-black uppercase py-4 rounded-xl hover:bg-gray-200 transition"
              >
                Hủy
              </button>
              <button 
                onClick={handleCreateCoupon}
                className="flex-1 bg-amber-500 text-gray-900 font-black uppercase py-4 rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/30 transition"
              >
                Tạo ngay
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Tạo Loại Sự Kiện */}
      {showEventTypeModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-6 uppercase">Thêm Loại Sự Kiện Mới</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Tên mã (VD: FLASH_SALE) *</label>
                <input type="text" value={eventTypeForm.name} onChange={e => setEventTypeForm({...eventTypeForm, name: e.target.value.toUpperCase()})} placeholder="FLASH_SALE" className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Tên hiển thị *</label>
                <input type="text" value={eventTypeForm.label} onChange={e => setEventTypeForm({...eventTypeForm, label: e.target.value})} placeholder="Flash Sale" className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Icon (emoji)</label>
                  <input type="text" value={eventTypeForm.icon} onChange={e => setEventTypeForm({...eventTypeForm, icon: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold text-xl" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Màu chủ đạo</label>
                  <input type="color" value={eventTypeForm.color} onChange={e => setEventTypeForm({...eventTypeForm, color: e.target.value})} className="w-full h-12 rounded-xl border border-gray-200 cursor-pointer" /></div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <textarea value={eventTypeForm.description} onChange={e => setEventTypeForm({...eventTypeForm, description: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-medium" rows="2" /></div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowEventTypeModal(false)} className="flex-1 bg-gray-100 text-gray-600 font-black uppercase py-3 rounded-xl hover:bg-gray-200 transition">Hủy</button>
              <button onClick={handleSaveEventType} className="flex-1 bg-amber-500 text-gray-900 font-black uppercase py-3 rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/30 transition">Tạo ngay</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM SỰ KIỆN */}
      {showEventModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative my-8">
            <h3 className="text-xl font-black text-gray-900 mb-6 uppercase">{editingEvent ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới"}</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Tên sự kiện *</label>
                <input type="text" value={eventForm.name} onChange={e => setEventForm({...eventForm, name: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Loại sự kiện *</label>
                <select value={eventForm.eventType} onChange={e => setEventForm({...eventForm, eventType: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold">
                  <option value="">-- Chọn loại --</option>
                  {eventTypes.map(et => <option key={et._id} value={et._id}>{et.icon} {et.label}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-2">🕐 Ngày bắt đầu *</label>
                  <input type="datetime-local" value={eventForm.startDate} onChange={e => setEventForm({...eventForm, startDate: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-2">🕔 Ngày kết thúc *</label>
                  <input type="datetime-local" value={eventForm.endDate} onChange={e => setEventForm({...eventForm, endDate: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold" /></div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">% Giảm giá chung (0 = không áp dụng)</label>
                <input type="number" min="0" max="100" value={eventForm.discountPercentage} onChange={e => setEventForm({...eventForm, discountPercentage: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <textarea value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-medium" rows="2" /></div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail Sự Kiện</label>
                {eventThumbPreview && <img src={eventThumbPreview} className="w-full h-32 object-cover rounded-lg mb-2" />}
                <input type="file" onChange={e => {
                  const file = e.target.files[0];
                  if (file) { setEventThumbFile(file); setEventThumbPreview(URL.createObjectURL(file)); }
                }} className="text-xs" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => { setShowEventModal(false); setEditingEvent(null); }} className="flex-1 bg-gray-100 text-gray-500 font-bold py-3 rounded-xl uppercase hover:bg-gray-200 transition">Hủy</button>
              <button onClick={handleSaveEvent} className="flex-1 bg-amber-500 text-white font-bold py-3 rounded-xl uppercase hover:bg-amber-600 transition shadow-lg shadow-amber-500/30">
                {editingEvent ? "Lưu thay đổi" : "Tạo sự kiện"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QUẢN LÝ SẢN PHẨM TRONG SỰ KIỆN */}
      {showEventProductsModal && selectedEventForProducts && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl relative max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
                  Sản phẩm trong: <span className="text-amber-500">{selectedEventForProducts.name}</span>
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Danh sách sản phẩm tham gia sự kiện này</p>
              </div>
              <button 
                onClick={() => setShowEventProductsModal(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all active:scale-95 shadow-sm"
              >
                ×
              </button>
            </div>

            {/* Modal Content - Table */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                      <th className="px-6 py-4">Sản phẩm</th>
                      <th className="px-6 py-4">Cửa hàng</th>
                      <th className="px-6 py-4 text-center">Giá SK</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {eventProducts.map(pe => (
                      <tr key={pe._id} className="group hover:bg-amber-50/20 transition-all duration-300">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex-shrink-0">
                              <img 
                                src={pe.product?.images?.[0]?.url 
                                  ? (pe.product.images[0].url.startsWith('http') ? pe.product.images[0].url : `http://localhost:5000${pe.product.images[0].url}`) 
                                  : `https://picsum.photos/seed/${pe.product?._id}/60/60`
                                } 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                alt=""
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-gray-900 text-sm line-clamp-1 italic">{pe.product?.name}</span>
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">ID: {pe.product?._id?.slice(-6)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-gray-700 uppercase italic">{pe.shop?.name}</span>
                            <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Gian hàng Petro</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="text-lg font-black text-amber-600 italic leading-none">
                            {selectedEventForProducts?.discountPercentage > 0
                              ? (Math.round(pe.originalPrice * (1 - selectedEventForProducts.discountPercentage / 100))).toLocaleString()
                              : pe.eventPrice?.toLocaleString()}đ
                          </div>
                          <div className="text-[9px] text-gray-400 line-through mt-1">Gốc: {pe.originalPrice?.toLocaleString()}đ</div>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${pe.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                             <span className={`w-1 h-1 rounded-full ${pe.status === 'approved' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                             {pe.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <button 
                             onClick={() => handleAdminRemoveProductFromEvent(pe._id)}
                             className="px-4 py-2 bg-red-50 text-red-500 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-red-500/20 active:scale-95"
                           >
                             XÓA KHỎI SK
                           </button>
                        </td>
                      </tr>
                    ))}
                    {eventProducts.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-24 text-center">
                           <div className="flex flex-col items-center gap-4 opacity-20 transform -rotate-2">
                             <span className="text-6xl grayscale">🏷️</span>
                             <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Không có sản phẩm nào tham gia</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setShowEventProductsModal(false)}
                className="px-12 py-4 bg-gray-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl shadow-gray-200 hover:shadow-amber-500/30 active:scale-95"
              >
                🚀 XÁC NHẬN & ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
