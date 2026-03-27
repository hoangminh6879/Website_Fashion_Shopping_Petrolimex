import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "vi",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      vi: {
        translation: {
          provided_by: "Cung cấp bởi",
          color: "Màu Sắc",
          size: "Kích Cỡ",
          quantity: "Số Lượng",
          stock: "Tồn kho",
          products: "sản phẩm",
          out_of_stock: "Hết hàng",
          add_to_cart: "Thêm vào giỏ",
          buy_now: "Mua Ngay",
          only_for_customers: "Tính năng mua sắm chỉ dành cho khách hàng.",
          max: "Tối đa",
          select_options_price: "Chọn phân loại để xem giá",
          discount: "GIẢM",
          login_required: "Yêu cầu đăng nhập",
          login_required_msg: "Vui lòng đăng nhập với tài khoản Khách hàng để mua sắm.",
          login: "Đăng nhập",
          close: "Đóng",
          attention: "Chú ý",
          select_options_msg: "Vui lòng chọn đầy đủ màu sắc và kích cỡ",
          out_of_stock_msg: "Sản phẩm hiện đang tạm hết hàng cho lựa chọn này",
          added_to_cart: "Đã thêm vào giỏ hàng",
          error: "Lỗi",
          add_to_cart_error: "Không thể thêm sản phẩm vào giỏ hàng",
          adding: "Đang thêm...",
          cart: "Giỏ Hàng",
          total_items: "Sản phẩm",
          unit_price: "Đơn giá",
          subtotal: "Giá tạm tính",
          continue_shopping: "Tiếp Tục Mua Sắm",
          clear_cart: "Dọn dẹp giỏ hàng",
          summary: "Tạm Tính",
          order: "Đơn Hàng",
          items_total: "Tổng tiền hàng",
          shipping: "Phí vận chuyển",
          free: "Miễn Phí",
          total_payment: "Tổng cộng thanh toán",
          checkout: "THANH TOÁN NGAY",
          empty_cart: "Giỏ hàng đang trống",
          empty_cart_msg: "Hãy lấp đầy nó bằng những món đồ thời thượng nhất",
          explore_now: "Khám Phá Ngay",
          restricted_account: "Tài khoản hạn chế",
          restricted_account_msg: "Tính năng mua sắm chỉ dành riêng cho tài khoản Khách hàng.",
          go_home: "Về Trang Chủ",
          confirm_delete: "Xác nhận xóa?",
          confirm_delete_msg: "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
          delete_now: "Xóa ngay",
          cancel: "Hủy",
          clear_cart_confirm: "Dọn dẹp giỏ hàng?",
          clear_cart_msg: "Tất cả sản phẩm sẽ bị xóa khỏi giỏ hàng của bạn.",
          delete_all: "Xóa tất cả",
          keep_it: "Giữ lại",
          updated: "Đã cập nhật",
          update_error: "Không thể cập nhật",
          change: "Thay đổi",
          new_color: "Chọn màu mới",
          new_size: "Chọn size mới",
          confirm: "Xác nhận",
          see_all: "Xem Tất Cả",
          seller_channel: "Kênh Người Bán",
          register: "Đăng ký",
          login: "Đăng nhập",
          logout: "Đăng xuất",
          profile: "Hồ sơ",
          followed_shops: "Shop Đang Theo Dõi",
          manage_shop: "Quản lý Shop",
          manage_website: "Quản lý Website",
          status_pending: "Chờ xử lý",
          status_paid: "Đã thanh toán",
          status_shipped: "Đang giao hàng",
          status_completed: "Hoàn tất",
          status_cancelled: "Đã hủy",
          sold_count: "Sản phẩm đã bán",
          returned_count: "Sản phẩm bị hoàn",
          unit_item: "sản phẩm"
        }
      },
      en: {
        translation: {
          provided_by: "Provided by",
          color: "Color",
          size: "Size",
          quantity: "Quantity",
          stock: "Stock",
          products: "products",
          out_of_stock: "Out of Stock",
          add_to_cart: "Add to Cart",
          buy_now: "Buy Now",
          only_for_customers: "Shopping features are for customers only.",
          max: "Max",
          select_options_price: "Select options to see price",
          discount: "OFF",
          login_required: "Login Required",
          login_required_msg: "Please login with a Customer account to shop.",
          login: "Login",
          close: "Close",
          attention: "Attention",
          select_options_msg: "Please select all colors and sizes",
          out_of_stock_msg: "This product variant is currently out of stock",
          added_to_cart: "Added to cart",
          error: "Error",
          add_to_cart_error: "Could not add product to cart",
          adding: "Adding...",
          cart: "Cart",
          total_items: "Items",
          unit_price: "Unit Price",
          subtotal: "Subtotal",
          continue_shopping: "Continue Shopping",
          clear_cart: "Clear Cart",
          summary: "Summary",
          order: "Order",
          items_total: "Items Total",
          shipping: "Shipping",
          free: "Free",
          total_payment: "Total Payment",
          checkout: "CHECKOUT NOW",
          empty_cart: "Your cart is empty",
          empty_cart_msg: "Let's fill it with something trendy",
          explore_now: "Explore Now",
          restricted_account: "Restricted Account",
          restricted_account_msg: "Shopping features are only for Customer accounts.",
          go_home: "Go Home",
          confirm_delete: "Confirm delete?",
          confirm_delete_msg: "Are you sure you want to remove this item from the cart?",
          delete_now: "Delete",
          cancel: "Cancel",
          clear_cart_confirm: "Clear cart?",
          clear_cart_msg: "All items will be removed from your cart.",
          delete_all: "Delete all",
          keep_it: "Keep it",
          updated: "Updated",
          update_error: "Update failed",
          change: "Change",
          new_color: "Select new color",
          new_size: "Select new size",
          confirm: "Confirm",
          see_all: "See All",
          seller_channel: "Seller Channel",
          register: "Register",
          login: "Login",
          logout: "Logout",
          profile: "Profile",
          followed_shops: "Followed Shops",
          manage_shop: "Manage Shop",
          manage_website: "Manage Website",
          status_pending: "Pending",
          status_paid: "Paid",
          status_shipped: "Shipped",
          status_completed: "Completed",
          status_cancelled: "Cancelled",
          sold_count: "Items Sold",
          returned_count: "Items Returned",
          unit_item: "items"
        }
      }
    }
  });

// Hàm hỗ trợ dịch trực tiếp qua API (Mặc định là Anh -> Việt hoặc ngược lại tùy theo ngôn ngữ hiện tại)
export const liveTranslate = async (text, reverse = false) => {
  if (!text || typeof text !== 'string') return text;

  // sl: source language, tl: target language
  let sl = 'vi';
  let tl = 'en';

  if (reverse) {
    sl = 'en';
    tl = 'vi';
  } else if (i18n.language === 'en') {
    sl = 'vi';
    tl = 'en';
  } else {
    return text; // Ở Tiếng Việt thì không dịch gì cả
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data[0]
      .filter(item => item && item[0])
      .map(item => item[0])
      .join('');
  } catch (error) {
    return text;
  }
};

export default i18n;
