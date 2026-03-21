import api from "./api";

const cartService = {
  // Lấy giỏ hàng
  getCart: async () => {
    try {
      const response = await api.get("/cart");
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.response?.data || error.message || "Lỗi khi lấy giỏ hàng";
    }
  },

  // Thêm vào giỏ hàng
  addToCart: async (productId, variantId, quantity, color, size) => {
    try {
      const response = await api.post("/cart/add", {
        productId,
        variantId,
        quantity,
        color,
        size,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.response?.data || error.message || "Lỗi khi thêm vào giỏ hàng";
    }
  },

  // Cập nhật số lượng
  updateCartItem: async (cartItemId, quantity) => {
    try {
      const response = await api.put("/cart/update", {
        cartItemId,
        quantity,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.response?.data || error.message || "Lỗi cập nhật số lượng";
    }
  },

  // Xóa một sản phẩm
  removeFromCart: async (cartItemId) => {
    try {
      const response = await api.delete(`/cart/remove/${cartItemId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.response?.data || error.message || "Lỗi xóa sản phẩm";
    }
  },

  // Làm trống giỏ hàng
  clearCart: async () => {
    try {
      const response = await api.delete("/cart/clear");
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.response?.data || error.message || "Lỗi làm trống giỏ hàng";
    }
  },
};

export default cartService;