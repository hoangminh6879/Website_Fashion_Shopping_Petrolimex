import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import * as XLSX from 'xlsx';
import { useTranslation } from "react-i18next";

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
  
  // Post Management State
  const [pendingPosts, setPendingPosts] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);
  const [prizeForm, setPrizeForm] = useState({ name: '', discount: 0, couponType: '', expiryDays: 30, probability: 0, quantity: -1, color: '#f59e0b', isActive: true });
  
  // Battle Management State
  const [adminBattles, setAdminBattles] = useState([]);
  const [now, setNow] = useState(new Date());

  const navigate = useNavigate();
  const { t } = useTranslation();

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending': return { label: t('status_pending'), color: '#f59e0b', bg: 'bg-amber-500/20', text: 'text-amber-400' };
      case 'paid': return { label: t('status_paid'), color: '#3b82f6', bg: 'bg-blue-500/20', text: 'text-blue-400' };
      case 'shipped': return { label: t('status_shipped'), color: '#8b5cf6', bg: 'bg-purple-500/20', text: 'text-purple-400' };
      case 'completed': return { label: t('status_completed'), color: '#10b981', bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
      case 'cancelled': return { label: t('status_cancelled'), color: '#ef4444', bg: 'bg-red-500/20', text: 'text-red-400' };
      default: return { label: status, color: '#94a3b8', bg: 'bg-gray-50', text: 'text-gray-400' };
    }
  };

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

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
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
      if (tab === "overview" || tab === "revenue") {
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
        const [evRes, typesRes] = await Promise.all([api.get("/events"), api.get("/event-types")]);
        setEvents(Array.isArray(evRes.data) ? evRes.data : []);
        setEventTypes(Array.isArray(typesRes.data) ? typesRes.data : []);
      } else if (tab === "productEvents") {
        const res = await api.get("/product-events/pending");
        setPendingProductEvents(Array.isArray(res.data) ? res.data : []);
      } else if (tab === "luckyWheel") {
        const [prizesRes, couponsRes, typesRes] = await Promise.all([
          api.get("/lucky-wheel"),
          api.get("/coupons"),
          api.get("/coupon-types")
        ]);
        setPrizes(Array.isArray(prizesRes.data) ? prizesRes.data : []);
        setCoupons(Array.isArray(couponsRes.data) ? couponsRes.data : []);
        setCouponTypes(Array.isArray(typesRes.data) ? typesRes.data : []);
      } else if (tab === "pendingPosts") {
        const res = await api.get("/posts/pending");
        setPendingPosts(Array.isArray(res.data) ? res.data : []);
      } else if (tab === "battles") {
        const res = await api.get("/battles/admin/list");
        setAdminBattles(Array.isArray(res.data) ? res.data : []);
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

  const exportToExcel = (data, fileName) => {
    // 1. Chuẩn bị dữ liệu chỉ với các cột mong muốn và dịch sang tiếng Việt
    const formattedData = data.map(shop => ({
      "Tên cửa hàng": shop.name,
      "Doanh thu (VND)": shop.revenue,
      "Số lượng đã bán": shop.soldCount,
      "Số lượng bị hoàn": shop.cancelledCount || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // 2. Thiết lập độ rộng cột (Cánh chỉnh cho rộng hơn xíu)
    const wscols = [
      { wch: 30 }, // Tên cửa hàng
      { wch: 20 }, // Doanh thu
      { wch: 20 }, // Đã bán
      { wch: 20 }, // Bị hoàn
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCao");
    XLSX.writeFile(workbook, `${fileName}_${new Date().getUTCDate()}.xlsx`);
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

  const handleLockUser = async (userId, isCurrentlyLocked) => {
    if (isCurrentlyLocked) {
      if (confirm("Mở khóa cho người dùng này?")) {
        try {
          await api.put(`/admin/users/${userId}/lock`, { lockDays: 0 });
          Swal.fire("Thành công", "Đã mở khóa tài khoản", "success");
          fetchData("users");
        } catch (err) {
          Swal.fire("Lỗi", err.response?.data?.message || "Lỗi khóa tài khoản", "error");
        }
      }
    } else {
      const { value: formValues } = await Swal.fire({
        title: 'Khóa tài khoản',
        html:
          '<input id="swal-input1" type="number" class="swal2-input" placeholder="Số ngày khóa">' +
          '<input id="swal-input2" class="swal2-input" placeholder="Lý do khóa">',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Khóa',
        cancelButtonText: 'Hủy',
        preConfirm: () => {
          return [
            document.getElementById('swal-input1').value,
            document.getElementById('swal-input2').value
          ]
        }
      });
      if (formValues) {
        const [lockDays, reason] = formValues;
        if (!lockDays || lockDays <= 0) return Swal.fire("Lỗi", "Số ngày không hợp lệ", "error");
        try {
          await api.put(`/admin/users/${userId}/lock`, { lockDays: parseInt(lockDays), reason });
          Swal.fire("Thành công", "Đã khóa người dùng", "success");
          fetchData("users");
        } catch (err) {
          Swal.fire("Lỗi", err.response?.data?.message || "Lỗi khóa tài khoản", "error");
        }
      }
    }
  };

  const handleLockShop = async (shopId, isCurrentlyLocked) => {
    if (isCurrentlyLocked) {
      if (confirm("Mở khóa kênh bán hàng này?")) {
        try {
          await api.put(`/admin/shops/${shopId}/lock`, { lockDays: 0 });
          Swal.fire("Thành công", "Đã mở khóa Shop", "success");
          fetchData("shops");
        } catch (err) {
          Swal.fire("Lỗi", err.response?.data?.message || "Lỗi mở khóa", "error");
        }
      }
    } else {
      const { value: formValues } = await Swal.fire({
        title: 'Khóa kênh bán hàng',
        html:
          '<input id="swal-input1" type="number" class="swal2-input" placeholder="Số ngày khóa">' +
          '<input id="swal-input2" class="swal2-input" placeholder="Lý do khóa">',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Khóa',
        cancelButtonText: 'Hủy',
        preConfirm: () => {
          return [
            document.getElementById('swal-input1').value,
            document.getElementById('swal-input2').value
          ]
        }
      });
      if (formValues) {
        const [lockDays, reason] = formValues;
        if (!lockDays || lockDays <= 0) return Swal.fire("Lỗi", "Số ngày không hợp lệ", "error");
        try {
          await api.put(`/admin/shops/${shopId}/lock`, { lockDays: parseInt(lockDays), reason });
          Swal.fire("Thành công", "Đã vô hiệu hóa Shop tạm thời", "success");
          fetchData("shops");
        } catch (err) {
          Swal.fire("Lỗi", err.response?.data?.message || "Lỗi thao tác", "error");
        }
      }
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

  const handleSavePrize = async () => {
    if (!prizeForm.name) return Swal.fire('Lỗi', 'Vui lòng điền Tên hiển thị', 'warning');
    if (prizeForm.discount > 0 && !prizeForm.couponType) return Swal.fire('Lỗi', 'Vui lòng chọn Loại Coupon cho phần thưởng có giá trị giảm giá', 'warning');

    const prizeData = { ...prizeForm };
    try {
      if (editingPrize) {
        await api.put(`/lucky-wheel/${editingPrize._id}`, prizeData);
        Swal.fire('Thành công', 'Đã cập nhật', 'success');
      } else {
        await api.post('/lucky-wheel', prizeData);
        Swal.fire('Thành công', 'Đã tạo', 'success');
      }
      setShowPrizeModal(false);
      setEditingPrize(null);
      setPrizeForm({ name: '', discount: 0, couponType: '', expiryDays: 30, probability: 0, quantity: -1, color: '#f59e0b', isActive: true });
      fetchData('luckyWheel');
    } catch (err) { Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi lưu giải thưởng', 'error'); }
  };

  const handleEditPrize = (pz) => {
    setEditingPrize(pz);
    setPrizeForm({
      name: pz.name,
      discount: pz.discount || 0,
      couponType: pz.couponType?._id || pz.couponType || "",
      expiryDays: pz.expiryDays || 30,
      probability: pz.probability,
      quantity: pz.quantity,
      color: pz.color,
      isActive: pz.isActive
    });
    setShowPrizeModal(true);
  };

  const handleDeletePrize = async (id) => {
    if (!confirm('Xóa giải thưởng này?')) return;
    try { await api.delete(`/lucky-wheel/${id}`); Swal.fire('Thành công', 'Đã xóa', 'success'); fetchData('luckyWheel'); }
    catch (err) { Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi xóa', 'error'); }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 py-4 px-6 text-gray-900 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
            ADMIN PANEL
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition"
          >
            Trang chủ
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-4 py-2 rounded-lg font-bold transition border border-red-100"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 p-4 border border-gray-100 flex flex-col gap-2 sticky top-24">
            <button
              onClick={() => setActiveTab("overview")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${activeTab === "overview" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"
                  }`}
            >
              📊 Tổng quan
            </button>
            <button
              onClick={() => setActiveTab("revenue")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${activeTab === "revenue" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              💰 Quản lý doanh thu
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${activeTab === "users" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              👥 Người dùng
            </button>
            <button
              onClick={() => setActiveTab("upgrade_requests")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all flex justify-between items-center ${activeTab === "upgrade_requests" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"
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
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${activeTab === "shops" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              🏪 Cửa hàng
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${activeTab === "categories" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              🏷️ Danh mục
            </button>
            <button
              onClick={() => setActiveTab("couponTypes")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${activeTab === "couponTypes" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              🎟️ Loại Coupon
            </button>
            <button
              onClick={() => setActiveTab("coupons")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${activeTab === "coupons" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              🧧 Mã Giảm Giá
            </button>
            <div className="border-t border-gray-100 my-2"></div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 pb-1">Giải Trí</p>
            <button onClick={() => setActiveTab("luckyWheel")} className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${activeTab === "luckyWheel" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"}`}>🎡 Vòng Quay (Nhận Coupon)</button>
            <button onClick={() => setActiveTab("pendingPosts")} className={`text-left px-5 py-3 rounded-xl font-bold transition-all flex justify-between items-center ${activeTab === "pendingPosts" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"}`}>
               <span>📸 Duyệt bài viết</span>
               {pendingPosts.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingPosts.length}</span>}
            </button>

            <div className="border-t border-gray-100 my-2"></div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 pb-1">Quản Lý Sự Kiện</p>
            <button onClick={() => setActiveTab("eventTypes")} className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${activeTab === "eventTypes" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"}`}>🏷️ Loại Sự Kiện</button>
            <button onClick={() => setActiveTab("events")} className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${activeTab === "events" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"}`}>🎪 Sự Kiện</button>
            <button onClick={() => setActiveTab("productEvents")} className={`text-left px-5 py-3 rounded-xl font-bold transition-all flex justify-between items-center ${activeTab === "productEvents" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"}`}>
              <span>⏳ Duyệt Sản Phẩm</span>
              {pendingProductEvents.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingProductEvents.length}</span>}
            </button>
            <button onClick={() => setActiveTab("battles")} className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${activeTab === "battles" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-500 hover:bg-gray-50"}`}>
              ⚔️ Fashion Battle
            </button>
          </div>
        </aside>

        {/* Main Content Column */}
        <main className="flex-1 bg-white rounded-2xl shadow-2xl shadow-gray-200/50 p-8 border border-gray-100">
          
          {/* TAB: Post Management */}
          {activeTab === "pendingPosts" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="mb-8">
                  <h2 className="text-2xl font-black text-gray-900 uppercase">Phê duyệt bài viết</h2>
                  <p className="text-gray-400 text-sm">Xem và duyệt các bài viết mới từ người dùng</p>
               </div>

               <div className="grid grid-cols-1 gap-6">
                  {pendingPosts.map((post) => (
                    <div key={post._id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
                       <div className="w-full md:w-48 aspect-square rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                          {post.images && post.images.length > 0 ? (
                            <img src={post.images[0].startsWith('http') ? post.images[0] : `http://localhost:5000${post.images[0]}`} className="w-full h-full object-cover" alt="post" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200 text-3xl">🖼️</div>
                          )}
                       </div>
                       <div className="flex-1 flex flex-col justify-between">
                          <div>
                             <div className="flex items-center gap-2 mb-3">
                                <img src={post.user?.avatar ? (post.user.avatar.startsWith('http') ? post.user.avatar : `http://localhost:5000${post.user.avatar}`) : `https://ui-avatars.com/api/?name=${post.user?.name}&background=f59e0b&color=fff`} className="w-6 h-6 rounded-full" alt="avatar" />
                                <span className="font-bold text-gray-900 text-sm">{post.user?.name}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase ml-auto">{new Date(post.createdAt).toLocaleString()}</span>
                             </div>
                             <p className="text-gray-600 text-sm italic">"{post.content}"</p>
                          </div>
                          
                          <div className="flex gap-3 mt-6">
                             <button 
                               onClick={async () => {
                                 try {
                                   await api.put(`/posts/${post._id}/status`, { status: 'approved' });
                                   Swal.fire('Thành công', 'Đã duyệt bài viết', 'success');
                                   fetchData('pendingPosts');
                                 } catch(err) { Swal.fire('Lỗi', 'Không thể duyệt', 'error'); }
                               }}
                               className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-amber-500/20"
                             >
                               Duyệt bài
                             </button>
                             <button 
                               onClick={async () => {
                                 try {
                                   await api.put(`/posts/${post._id}/status`, { status: 'rejected' });
                                   Swal.fire('Đã từ chối', 'Bài viết đã bị loại bỏ', 'info');
                                   fetchData('pendingPosts');
                                 } catch(err) { Swal.fire('Lỗi', 'Không thể từ chối', 'error'); }
                               }}
                               className="flex-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white py-3 rounded-xl font-bold transition border border-red-100"
                             >
                               Từ chối
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
                  {pendingPosts.length === 0 && (
                    <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-sm">
                        🎉 Tuyệt vời! Không có bài viết nào đang chờ duyệt
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* TAB: Fashion Battle Management */}
          {activeTab === "battles" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase">⚔️ Quản lý Fashion Battle</h2>
                  <p className="text-gray-400 text-sm">Theo dõi các trận chiến thời trang đang diễn ra trên toàn hệ thống</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {adminBattles.map((battle) => {
                  const isOngoing = battle.status === "ongoing" && new Date(battle.endTime) > now;
                  const calculateTimeLeft = (endTime) => {
                    const diff = +new Date(endTime) - +now;
                    if (diff <= 0) return "Đã kết thúc";
                    const h = Math.floor(diff / (1000 * 60 * 60));
                    const m = Math.floor((diff / (1000 * 60)) % 60);
                    const s = Math.floor((diff / 1000) % 60);
                    return `${h}g ${m}p ${s}s`;
                  };

                  return (
                    <div key={battle._id} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl transition-all duration-500">
                       <div className="flex -space-x-4 mb-4 md:mb-0">
                          {battle.products?.slice(0, 2).map((p, idx) => (
                            <div key={idx} className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden relative z-10 first:z-20">
                               <img src={p.images?.[0]?.url ? (p.images[0].url.startsWith('http') ? p.images[0].url : `http://localhost:5000${p.images[0].url}`) : 'https://placehold.co/100'} className="w-full h-full object-cover" alt="" />
                            </div>
                          ))}
                       </div>

                       <div className="flex-1 text-center md:text-left">
                          <h3 className="text-xl font-black text-gray-900 uppercase italic leading-tight mb-1">{battle.name}</h3>
                          <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                             <img src={battle.shop?.image ? (battle.shop.image.startsWith('http') ? battle.shop.image : `http://localhost:5000${battle.shop.image}`) : 'https://placehold.co/50'} className="w-5 h-5 rounded-full border border-amber-500" alt="" />
                             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{battle.shop?.name}</span>
                          </div>
                          
                          <div className="flex flex-wrap justify-center md:justify-start gap-3">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isOngoing ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                {isOngoing ? '● Đang diễn ra' : 'Đã kết thúc'}
                             </span>
                             <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border border-red-100">
                                Giảm {battle.discountPercentage}%
                             </span>
                             <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                {battle.products?.length} Sản phẩm
                             </span>
                          </div>
                       </div>

                       <div className="bg-gray-50 rounded-2xl p-4 min-w-[180px] text-center">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Thời gian còn lại</p>
                          <p className={`text-lg font-mono font-black ${isOngoing ? 'text-amber-600' : 'text-gray-400'}`}>
                             {calculateTimeLeft(battle.endTime)}
                          </p>
                       </div>

                       <button 
                         onClick={() => navigate(`/fashion-battle/${battle._id}`)}
                         className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-500 hover:text-gray-900 transition-all active:scale-95 shadow-lg shadow-gray-900/10"
                       >
                         THEO DÕI
                       </button>
                    </div>
                  );
                })}

                {adminBattles.length === 0 && (
                  <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                     <span className="text-4xl mb-4 block">⚔️</span>
                     <p className="font-bold text-gray-400 uppercase tracking-widest">Chưa có trận battle nào trong hệ thống</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Vòng quay */}
          {activeTab === "luckyWheel" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Vòng quay may mắn</h2>
                  <p className="text-gray-400 text-sm">Quản lý các phần thưởng trên vòng quay</p>
                </div>
                <button
                  onClick={() => {
                    setPrizeForm({ name: '', type: 'coupon', couponId: '', discount: 0, couponType: '', expiryDays: 30, probability: 0, quantity: -1, color: '#f59e0b', isActive: true });
                    setShowPrizeModal(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-amber-500/30"
                >
                  + Thêm phần thưởng
                </button>
              </div>

              {/* Help Text */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <p className="text-xs font-bold text-amber-700 flex items-center gap-2">
                  <span>💡</span> 
                  <span>Mẹo: Bạn có thể chọn một Coupon có sẵn hoặc tự định nghĩa thông tin Coupon mới (Hệ thống sẽ tự tạo mã cho khách hàng khi trúng).</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                 {prizes.map((pz, idx) => (
                    <div key={pz._id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                       <div className="w-2 h-full absolute top-0 left-0" style={{ backgroundColor: pz.color }}></div>
                       <div className="pl-4 flex justify-between items-start">
                          <div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">{pz.type === 'coupon' ? 'Mã Giảm Giá' : 'Không Trúng'}</span>
                            <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{pz.name}</h3>
                          </div>
                          <span className={`px-2 py-1 text-[10px] rounded-full font-bold ${pz.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {pz.isActive ? 'Bật' : 'Tắt'}
                          </span>
                       </div>
                       <div className="pl-4 grid grid-cols-2 gap-2 text-xs font-bold text-gray-600 mt-2">
                          <div>🎯 Tỉ lệ: <span className="text-amber-500">{pz.probability}%</span></div>
                          <div>📦 TT: <span className="text-blue-500">{pz.quantity === -1 ? 'Vô hạn' : pz.quantity}</span></div>
                       </div>
                       <div className="pl-4 mt-2 flex gap-2">
                           <button onClick={() => handleEditPrize(pz)} className="flex-1 bg-gray-50 hover:bg-gray-200 text-gray-600 py-2 rounded-lg font-bold transition text-xs">Sửa</button>
                           <button onClick={() => handleDeletePrize(pz._id)} className="flex-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white py-2 rounded-lg font-bold transition text-xs">Xóa</button>
                       </div>
                    </div>
                 ))}
                 {prizes.length === 0 && <div className="col-span-full text-center text-gray-400 py-10">Chưa có phần thưởng nào</div>}
              </div>

              {/* MODAL PRIZE */}
              {showPrizeModal && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur p-4">
                  <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
                    <h3 className="text-xl font-black text-gray-900 mb-6 uppercase">{editingPrize ? "Sửa phần thưởng" : "Thêm phần thưởng"}</h3>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Tên hiển thị *</label>
                        <input 
                          type="text" 
                          value={prizeForm.name} 
                          onChange={e => setPrizeForm({ ...prizeForm, name: e.target.value })} 
                          placeholder="VD: Voucher 50K hoặc Chúc may mắn"
                          className="w-full bg-gray-50 p-3.5 rounded-2xl border border-gray-100 focus:border-amber-500 focus:bg-white outline-none font-bold transition-all" 
                        />
                      </div>
                      
                      <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100/50 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-amber-600 text-lg">🎟️</span>
                          <h4 className="text-[11px] font-black uppercase text-amber-900 tracking-widest">Cấu hình Phần thưởng</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <label className="block text-[10px] font-bold text-amber-700 uppercase ml-1 mb-1.5">Loại Coupon</label>
                            <div className="relative group">
                              <select 
                                value={prizeForm.couponType} 
                                onChange={e => setPrizeForm({ ...prizeForm, couponType: e.target.value })} 
                                className="w-full bg-white p-3 pr-10 rounded-xl border border-amber-200 focus:border-amber-500 outline-none font-bold text-sm shadow-sm appearance-none transition-all cursor-pointer"
                              >
                                <option value="">-- Chọn Loại --</option>
                                {couponTypes?.map(ct => <option key={ct._id} value={ct._id}>{ct.name}</option>)}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-amber-700 uppercase ml-1 mb-1.5">Giá trị giảm</label>
                            <input 
                              type="number" 
                              value={prizeForm.discount} 
                              onChange={e => setPrizeForm({ ...prizeForm, discount: e.target.value })} 
                              placeholder="VD: 10 hoặc 50000"
                              className="w-full bg-white p-3 rounded-xl border border-amber-200 focus:border-amber-500 outline-none font-bold text-sm shadow-sm" 
                            />
                            <p className="text-[9px] text-amber-600/70 mt-1 ml-1">* Nhập 0 nếu là giải không trúng</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-amber-700 uppercase ml-1 mb-1.5">Số ngày hết hạn</label>
                          <input 
                            type="number" 
                            value={prizeForm.expiryDays} 
                            onChange={e => setPrizeForm({ ...prizeForm, expiryDays: e.target.value })} 
                            className="w-full bg-white p-3 rounded-xl border border-amber-200 focus:border-amber-500 outline-none font-bold text-sm shadow-sm" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">Tỉ lệ trúng (%) *</label>
                          <input type="number" min="0" max="100" value={prizeForm.probability} onChange={e => setPrizeForm({ ...prizeForm, probability: e.target.value })} className="w-full bg-[#FBFBFB] p-3 rounded-xl border border-gray-100 focus:border-amber-500 outline-none font-bold" /></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">Số lượng (-1 là vô hạn)</label>
                          <input type="number" value={prizeForm.quantity} onChange={e => setPrizeForm({ ...prizeForm, quantity: e.target.value })} className="w-full bg-[#FBFBFB] p-3 rounded-xl border border-gray-100 focus:border-amber-500 outline-none font-bold" /></div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div><label className="block text-sm font-bold text-gray-700 mb-2">Màu ô vòng quay</label>
                            <input type="color" value={prizeForm.color} onChange={e => setPrizeForm({ ...prizeForm, color: e.target.value })} className="w-full h-12 py-1 rounded-xl border border-gray-100 cursor-pointer" /></div>
                         <div><label className="block text-sm font-bold text-gray-700 mb-2">Trạng thái</label>
                            <div className="flex items-center gap-2 mt-3">
                               <input type="checkbox" checked={prizeForm.isActive} onChange={e => setPrizeForm({...prizeForm, isActive: e.target.checked})} className="w-5 h-5 accent-amber-500" />
                               <span className="font-bold text-gray-600">Đang hoạt động</span>
                            </div></div>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-6">
                      <button onClick={() => setShowPrizeModal(false)} className="flex-1 bg-gray-50 text-gray-500 font-black uppercase py-3 rounded-xl hover:bg-gray-200 transition">Hủy</button>
                      <button onClick={handleSavePrize} className="flex-1 bg-amber-500 text-gray-900 font-black uppercase py-3 rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/30 transition">Lưu Lại</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Tổng quan */}
          {activeTab === "overview" && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Thống kê hệ thống</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-3xl font-black">{stats.summary?.totalUsers || 0}</div>
                      <div className="text-blue-100 font-bold text-[10px] uppercase tracking-widest mt-1">Người dùng</div>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">👤</div>
                  </div>
                </div>
                <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-2xl font-black">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.summary?.totalRevenue || 0)}
                      </div>
                      <div className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest mt-1">Doanh thu</div>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">💰</div>
                  </div>
                </div>
                <div className="bg-violet-600 p-6 rounded-2xl shadow-lg text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-3xl font-black">{stats.summary?.totalOrders || 0}</div>
                      <div className="text-violet-100 font-bold text-[10px] uppercase tracking-widest mt-1">Đơn hàng</div>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">📦</div>
                  </div>
                </div>
                <div className="bg-amber-600 p-6 rounded-2xl shadow-lg text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-3xl font-black">{stats.summary?.activeShops || 0}</div>
                      <div className="text-amber-100 font-bold text-[10px] uppercase tracking-widest mt-1">Shop hoạt động</div>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">🏪</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
                  <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Doanh thu 6 tháng gần nhất</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.monthlyRevenue?.map(m => ({ name: `${m._id.month}/${m._id.year}`, revenue: m.revenue })) || []}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
                  <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Trạng thái đơn hàng</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.statusStats?.map(s => ({
                            name: getStatusConfig(s._id).label,
                            value: s.count,
                            color: getStatusConfig(s._id).color
                          })) || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.statusStats?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getStatusConfig(entry._id).color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-black text-gray-900 mb-4 uppercase italic tracking-tighter">Đơn hàng mới nhất</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-50 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FBFBFB] text-gray-500 font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-3">Khách hàng</th>
                      <th className="px-6 py-3">Tổng tiền</th>
                      <th className="px-6 py-3">Trạng thái</th>
                      <th className="px-6 py-3">Ngày đặt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.latestOrders?.map(order => {
                      const config = getStatusConfig(order.status);
                      return (
                        <tr key={order._id} className="hover:bg-gray-50/50 transition border-b border-gray-50/50">
                          <td className="px-6 py-4 font-bold text-gray-900">{order.user?.name}</td>
                          <td className="px-6 py-4 font-mono font-black text-amber-500">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalPrice)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase shadow-sm ${config.bg} ${config.text}`}>
                              {config.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Quản lý doanh thu */}
          {activeTab === "revenue" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Quản lý doanh thu</h2>
                  <p className="text-gray-400 text-sm">Phân tích chi tiết doanh thu và sản phẩm bán được</p>
                </div>
                <button
                  onClick={() => exportToExcel(stats.shopRevenue || [], 'BaoCaoDoanhThu_Shops')}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-1"
                >
                  <span>📊 Xuất Excel</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-3xl shadow-xl text-white">
                  <div className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Tổng doanh thu</div>
                  <div className="text-3xl font-black mb-4">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.summary?.totalRevenue || 0)}
                  </div>
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-3/4 rounded-full"></div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-3xl shadow-xl text-white">
                  <div className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Sản phẩm đã bán</div>
                  <div className="text-3xl font-black mb-4">
                    {stats.shopRevenue?.reduce((sum, s) => sum + s.soldCount, 0) || 0} {t('unit_item')}
                  </div>
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-1/2 rounded-full"></div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-3xl shadow-xl text-white">
                  <div className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Trung bình giá đơn</div>
                  <div className="text-3xl font-black mb-4">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((stats.summary?.totalRevenue / (stats.summary?.totalOrders || 1)) || 0)}
                  </div>
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-2/3 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <div className="bg-white p-8 rounded-3xl border border-gray-50 shadow-xl shadow-gray-200/50">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-gray-900 uppercase">Doanh thu theo cửa hàng (Top 10)</h3>
                  </div>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.shopRevenue || []} layout="vertical" margin={{ left: 50, right: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 13 }} width={120} />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 10, 10, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-50 shadow-xl shadow-gray-200/50">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-gray-900 uppercase">Sản phẩm Bán vs Hoàn (Top 10)</h3>
                  </div>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.shopRevenue || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="soldCount" name={t('sold_count')} fill="#10b981" radius={[10, 10, 0, 0]} />
                        <Bar dataKey="cancelledCount" name={t('returned_count')} fill="#ef4444" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
                  <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                    <span className="p-2 bg-blue-100 rounded-lg text-blue-600">📦</span> Bảng xếp hạng bán chạy
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-gray-50">
                          <th className="pb-4">Tên Shop</th>
                          <th className="pb-4 text-center">Số lượng</th>
                          <th className="pb-4 text-right">Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {stats.shopRevenue?.map((shop, i) => (
                          <tr key={shop._id} className="group">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-400">{i + 1}</span>
                                <span className="font-bold text-slate-200 group-hover:text-amber-600 transition">{shop.name}</span>
                              </div>
                            </td>
                            <td className="py-4 text-center font-bold text-gray-400">{shop.soldCount}</td>
                            <td className="py-4 text-right font-black text-amber-600">
                              {new Intl.NumberFormat('vi-VN').format(shop.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <span className="p-2 bg-emerald-100 rounded-lg text-emerald-600">📈</span> Thống kê tăng trưởng
                    </h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.monthlyRevenue?.map(m => ({ name: `${m._id.month}/${m._id.year}`, count: m.count })) || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', border: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-4 bg-[#FBFBFB] rounded-xl">
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      Dựa trên dữ liệu 6 tháng gần nhất, hệ thống ghi nhận mức độ tương tác và doanh số có sự biến động ổn định.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Người dùng */}
          {activeTab === "users" && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Quản lý người dùng</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-[#FBFBFB] text-gray-400 font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Tên</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Quyền</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.filter(u => !(u.sellerRequest?.status === 'pending' && u.role !== 'seller')).map(u => (
                      <tr key={u._id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 text-gray-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                            u.role === 'seller' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.sellerRequest?.status === 'rejected' ? (
                            <span className="text-red-500 font-medium select-none">Từng bị từ chối</span>
                          ) : (
                            <span className="text-green-600 font-medium select-none">Bình thường</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {u.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => {
                                    if (confirm("Chắc chắn cấp quyền Admin thay vì User/Seller?")) {
                                      handleChangeRole(u._id, 'admin')
                                    }
                                  }}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded border border-blue-200 text-xs font-bold transition"
                                >
                                  Cấp Admin
                                </button>
                                <button
                                  onClick={() => handleLockUser(u._id, u.adminLockUntil && new Date(u.adminLockUntil) > new Date())}
                                  className={`${u.adminLockUntil && new Date(u.adminLockUntil) > new Date() ? 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200' : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'} px-3 py-1 rounded border text-xs font-bold transition flex items-center justify-center`}
                                >
                                  {u.adminLockUntil && new Date(u.adminLockUntil) > new Date() ? 'Mở Khóa' : 'Khóa'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.filter(u => !(u.sellerRequest?.status === 'pending' && u.role !== 'seller')).length === 0 && (
                      <tr><td colSpan="5" className="text-center py-8 text-slate-500">Không có người dùng nào.</td></tr>
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
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-[#FBFBFB] text-gray-400 font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Người dùng</th>
                      <th className="px-6 py-4">Lý do mở shop</th>
                      <th className="px-6 py-4 text-center">Ảnh minh chứng</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.filter(u => u.sellerRequest?.status === 'pending' && u.role !== 'seller').map(u => (
                      <tr key={u._id} className="hover:bg-amber-50/50 transition border-l-4 border-l-amber-500">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 italic whitespace-normal max-w-sm">
                          "{u.sellerRequest.reason}"
                        </td>
                        <td className="px-6 py-4 text-center">
                          <a href={`http://localhost:5000${u.sellerRequest.proofImage}`} target="_blank" rel="noreferrer" className="inline-block hover:scale-105 transition">
                            <img src={`http://localhost:5000${u.sellerRequest.proofImage}`} className="w-16 h-16 object-cover rounded-lg border border-gray-100 shadow-sm inline-block" alt="minh chứng" />
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
                      <tr><td colSpan="4" className="text-center py-12 text-slate-500 font-medium">✨ Hiện không có yêu cầu nâng cấp nào đang chờ xử lý.</td></tr>
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
                  <div key={shop._id} className="border border-gray-50 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition">
                    <img
                      src={`http://localhost:5000${shop.image}`}
                      onError={(e) => e.target.src = "https://picsum.photos/150"}
                      className="w-24 h-24 object-cover rounded-xl border border-gray-100"
                    />
                    <div className="flex flex-col justify-center flex-1">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{shop.name}</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Chủ: <span className="font-semibold">{shop.owner?.name || "Không rõ"}</span>
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full w-max ${shop.status === 'active' ? 'bg-green-100 text-green-700' :
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
                        {shop.status === 'active' && (
                          <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={() => handleLockShop(shop._id, shop.adminLockUntil && new Date(shop.adminLockUntil) > new Date())}
                                className={`${shop.adminLockUntil && new Date(shop.adminLockUntil) > new Date() ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'} text-white px-3 py-1 text-xs font-bold rounded shadow transition`}
                              >
                                {shop.adminLockUntil && new Date(shop.adminLockUntil) > new Date() ? 'Mở Khóa' : 'Khóa'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {shops.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-500">Không có cửa hàng nào được tạo.</div>
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

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-[#FBFBFB] text-gray-400 font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Ảnh</th>
                      <th className="px-6 py-4">Tên danh mục</th>
                      <th className="px-6 py-4">Slug (Đường dẫn)</th>
                      <th className="px-6 py-4">Cấp quản lý</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Array.isArray(categories) && categories.map(cat => (
                      <tr key={cat._id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                          <img
                            src={cat.image ? `http://localhost:5000${cat.image}` : "https://picsum.photos/50"}
                            alt={cat.name}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                          />
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">{cat.name}</td>
                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">{cat.slug}</td>
                        <td className="px-6 py-4 text-gray-400">
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
                      <tr><td colSpan="4" className="text-center py-8 text-slate-500">Không có danh mục nào.</td></tr>
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

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-[#FBFBFB] text-gray-400 font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Tên loại</th>
                      <th className="px-6 py-4">Mô tả</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Array.isArray(couponTypes) && couponTypes.map(type => (
                      <tr key={type._id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-bold text-gray-900">{type.name}</td>
                        <td className="px-6 py-4 text-gray-400">{type.description}</td>
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
                      <tr><td colSpan="3" className="text-center py-8 text-slate-500">Không có loại coupon nào.</td></tr>
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

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-[#FBFBFB] text-gray-400 font-bold uppercase">
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
                  <tbody className="divide-y divide-gray-50">
                    {Array.isArray(coupons) && coupons.map(cp => (
                      <tr key={cp._id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-bold text-amber-500">{cp.code}</td>
                        <td className="px-6 py-4 text-gray-500 uppercase text-xs font-black italic">{cp.couponType?.name || "N/A"}</td>
                        <td className="px-6 py-4 font-black text-gray-900">{cp.discount?.toLocaleString() || 0}</td>
                        <td className="px-6 py-4 font-black text-blue-400">{cp.quantity || 0}</td>
                        <td className="px-6 py-4 font-black text-emerald-400">{cp.usedCount || 0}</td>
                        <td className="px-6 py-4 uppercase text-xs font-bold">
                          {cp.createdBy === 'admin' ? <span className="text-red-600">Admin</span> : <span className="text-amber-600">Shop: {cp.shop?.name || "N/A"}</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
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
                      <tr><td colSpan="6" className="text-center py-8 text-slate-500">Không có mã giảm giá nào.</td></tr>
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
                  <div key={et._id} className="border border-gray-50 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition">
                    <div className="text-4xl w-14 h-14 flex items-center justify-center rounded-2xl bg-[#FBFBFB] border border-gray-50">{et.icon}</div>
                    <div className="flex-1">
                      <div className="font-black text-gray-900 uppercase tracking-tight">{et.label}</div>
                      <div className="text-xs text-slate-500 font-mono">{et.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{et.description}</div>
                    </div>
                    <button onClick={() => handleDeleteEventType(et._id)} className="text-red-400 hover:text-red-600 text-xs font-bold transition">Xóa</button>
                  </div>
                ))}
                {eventTypes.length === 0 && <p className="col-span-full text-center py-10 text-slate-500">Chưa có loại sự kiện nào.</p>}
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
                    <div key={ev._id} className={`border rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm transition hover:shadow-md ${isOngoing ? 'border-amber-400 bg-amber-50/30' : 'border-gray-50 bg-white'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{ev.eventType?.icon || '🎪'}</span>
                          <div>
                            <h3 className="font-black text-gray-900 uppercase tracking-tight">{ev.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.status === 'active' ? 'bg-green-100 text-green-700' : ev.status === 'draft' ? 'bg-gray-50 text-gray-400' : ev.status === 'ended' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-600'}`}>{ev.status.toUpperCase()}{isOngoing ? ' (Đang diễn ra)' : ''}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
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
                        <button onClick={() => handleEditEvent(ev)} className="bg-gray-50 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl border border-gray-100 hover:bg-gray-200 transition">Sửa</button>
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
                {events.length === 0 && <p className="text-center py-12 text-slate-500">Chưa có sự kiện nào. Hãy tạo sự kiện đầu tiên!</p>}
              </div>
            </div>
          )}

          {/* TAB: Duyệt Sản Phẩm Sự Kiện */}
          {activeTab === "productEvents" && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Duyệt Sản Phẩm Vào Sự Kiện <span className="text-red-500 text-lg">({pendingProductEvents.length} chờ duyệt)</span></h2>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-[#FBFBFB] text-gray-400 font-bold uppercase">
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
                  <tbody className="divide-y divide-gray-50">
                    {pendingProductEvents.map(pe => (
                      <tr key={pe._id} className="hover:bg-amber-50/30 transition">
                        <td className="px-4 py-3 font-semibold text-gray-900">{pe.product?.name}</td>
                        <td className="px-4 py-3 text-gray-500">{pe.shop?.name}</td>
                        <td className="px-4 py-3 text-gray-500">{pe.event?.name}</td>
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
                    {pendingProductEvents.length === 0 && <tr><td colSpan="7" className="text-center py-10 text-slate-500">Không có đăng ký nào đang chờ duyệt.</td></tr>}
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
                  className="w-full bg-[#FBFBFB] p-4 rounded-xl border border-gray-100 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh danh mục</label>
                <div className="flex flex-col gap-4">
                  {categoryImagePreview && (
                    <img
                      src={categoryImagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-xl border border-gray-100"
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
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryName(""); }}
                className="flex-1 bg-gray-50 text-gray-500 font-black uppercase py-4 rounded-xl hover:bg-gray-200 transition"
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
                  className="w-full bg-[#FBFBFB] p-4 rounded-xl border border-gray-100 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={couponTypeDesc}
                  onChange={(e) => setCouponTypeDesc(e.target.value)}
                  placeholder="Mô tả loại coupon"
                  className="w-full bg-[#FBFBFB] p-4 rounded-xl border border-gray-100 focus:border-amber-500 focus:bg-white outline-none transition font-medium"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => { setShowCouponTypeModal(false); setEditingCouponType(null); }}
                className="flex-1 bg-gray-50 text-gray-500 font-black uppercase py-4 rounded-xl hover:bg-gray-200 transition"
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
                  className="w-full bg-[#FBFBFB] p-4 rounded-xl border border-gray-100 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Loại Coupon</label>
                <select
                  value={newCoupon.couponType}
                  onChange={(e) => setNewCoupon({ ...newCoupon, couponType: e.target.value })}
                  className="w-full bg-[#FBFBFB] p-4 rounded-xl border border-gray-100 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
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
                  className="w-full bg-[#FBFBFB] p-4 rounded-xl border border-gray-100 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
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
                  className="w-full bg-[#FBFBFB] p-4 rounded-xl border border-gray-100 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ngày hết hạn</label>
                <input
                  type="date"
                  value={newCoupon.expiryDate}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                  className="w-full bg-[#FBFBFB] p-4 rounded-xl border border-gray-100 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowCouponModal(false)}
                className="flex-1 bg-gray-50 text-gray-500 font-black uppercase py-4 rounded-xl hover:bg-gray-200 transition"
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
                <input type="text" value={eventTypeForm.name} onChange={e => setEventTypeForm({ ...eventTypeForm, name: e.target.value.toUpperCase() })} placeholder="FLASH_SALE" className="w-full bg-[#FBFBFB] p-3 rounded-xl border border-gray-100 focus:border-amber-500 outline-none font-bold" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Tên hiển thị *</label>
                <input type="text" value={eventTypeForm.label} onChange={e => setEventTypeForm({ ...eventTypeForm, label: e.target.value })} placeholder="Flash Sale" className="w-full bg-[#FBFBFB] p-3 rounded-xl border border-gray-100 focus:border-amber-500 outline-none font-bold" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Icon (emoji)</label>
                  <input type="text" value={eventTypeForm.icon} onChange={e => setEventTypeForm({ ...eventTypeForm, icon: e.target.value })} className="w-full bg-[#FBFBFB] p-3 rounded-xl border border-gray-100 focus:border-amber-500 outline-none font-bold text-xl" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Màu chủ đạo</label>
                  <input type="color" value={eventTypeForm.color} onChange={e => setEventTypeForm({ ...eventTypeForm, color: e.target.value })} className="w-full h-12 rounded-xl border border-gray-100 cursor-pointer" /></div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <textarea value={eventTypeForm.description} onChange={e => setEventTypeForm({ ...eventTypeForm, description: e.target.value })} className="w-full bg-[#FBFBFB] p-3 rounded-xl border border-gray-100 focus:border-amber-500 outline-none font-medium" rows="2" /></div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowEventTypeModal(false)} className="flex-1 bg-gray-50 text-gray-500 font-black uppercase py-3 rounded-xl hover:bg-gray-200 transition">Hủy</button>
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
                <input type="text" value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })} className="w-full bg-[#FBFBFB] p-3 rounded-xl border border-gray-100 focus:border-amber-500 outline-none font-bold" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Loại sự kiện *</label>
                <select value={eventForm.eventType} onChange={e => setEventForm({ ...eventForm, eventType: e.target.value })} className="w-full bg-[#FBFBFB] p-3 rounded-xl border border-gray-100 focus:border-amber-500 outline-none font-bold">
                  <option value="">-- Chọn loại --</option>
                  {eventTypes.map(et => <option key={et._id} value={et._id}>{et.icon} {et.label}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-2">📅 Ngày bắt đầu *</label>
                  <input type="date" value={eventForm.startDate} onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })} className="w-full bg-[#FBFBFB] p-3 rounded-xl border border-gray-100 focus:border-amber-500 outline-none font-bold" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-2">📅 Ngày kết thúc *</label>
                  <input type="date" value={eventForm.endDate} onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })} className="w-full bg-[#FBFBFB] p-3 rounded-xl border border-gray-100 focus:border-amber-500 outline-none font-bold" /></div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">% Giảm giá chung (0 = không áp dụng)</label>
                <input type="number" min="0" max="100" value={eventForm.discountPercentage} onChange={e => setEventForm({ ...eventForm, discountPercentage: e.target.value })} className="w-full bg-[#FBFBFB] p-3 rounded-xl border border-gray-100 focus:border-amber-500 outline-none font-bold" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <textarea value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} className="w-full bg-[#FBFBFB] p-3 rounded-xl border border-gray-100 focus:border-amber-500 outline-none font-medium" rows="2" /></div>

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
              <button onClick={() => { setShowEventModal(false); setEditingEvent(null); }} className="flex-1 bg-gray-50 text-gray-400 font-bold py-3 rounded-xl uppercase hover:bg-gray-200 transition">Hủy</button>
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
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl relative max-h-[90vh] flex flex-col border border-gray-50 overflow-hidden">
            {/* Modal Header */}
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
                  Sản phẩm trong: <span className="text-amber-500">{selectedEventForProducts.name}</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Danh sách sản phẩm tham gia sự kiện này</p>
              </div>
              <button
                onClick={() => setShowEventProductsModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-slate-500 hover:text-gray-900 hover:border-gray-900 transition-all active:scale-95 shadow-sm"
              >
                ×
              </button>
            </div>

            {/* Modal Content - Table */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="bg-white rounded-[2rem] border border-gray-50 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-50">
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
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-50 shadow-sm bg-[#FBFBFB] flex-shrink-0">
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
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">ID: {pe.product?._id?.slice(-6)}</span>
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
                          <div className="text-[9px] text-slate-500 line-through mt-1">Gốc: {pe.originalPrice?.toLocaleString()}đ</div>
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
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Không có sản phẩm nào tham gia</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-[#FBFBFB] border-t border-gray-50 flex justify-end">
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
