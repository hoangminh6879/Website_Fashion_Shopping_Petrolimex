import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Khởi tạo User
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data && res.data._id) {
            setUserId(res.data._id);
            setUser(res.data);
            setUserRole(res.data.role);
          } else {
            setUserId('guest');
            setUser(null);
            setUserRole('guest');
          }
        })
        .catch(err => {
          console.error("Lỗi khi tải user trong CartContext:", err);
          setUserId('guest');
          setUserRole('guest');
        })
        .finally(() => setIsInitialized(true));
    } else {
      setUserId('guest');
      setUser(null);
      setUserRole('guest');
      setIsInitialized(true);
    }
  }, []);

  // 2. Tải Giỏ Hàng ban đầu
  useEffect(() => {
    if (!isInitialized) return;

    if (userId && userId !== 'guest') {
      if (userRole === 'admin' || userRole === 'seller') {
        // Admin or Seller blocks cart functionality completely
        setCart([]);
        return;
      }
      // User đã đăng nhập: lấy từ DB
      api.get('/cart')
        .then(res => {
          setCart(res.data);
        })
        .catch(err => {
          console.error('Lỗi khi tải giỏ hàng từ DB:', err);
          setCart([]);
        });
    } else {
      // Guest: clear cart (disabling anonymous cart as requested)
      setCart([]);
    }
  }, [isInitialized, userId]);

  // 3. Backup LocalStorage cho Guest (Disabled)
  /*
  useEffect(() => {
    if (isInitialized && userId === 'guest') {
      localStorage.setItem('cart_guest', JSON.stringify(cart));
    }
  }, [cart, isInitialized, userId]);
  */

  // Hành động: Thêm
  const addToCart = async (product, color, size, quantity = 1) => {
    if (userRole === 'admin' || userRole === 'seller') return;

    if (userId && userId !== 'guest') {
      try {
        const res = await api.post('/cart/add', {
          productId: product._id,
          color,
          size,
          quantity
        });
        
        // Cập nhật lại UI dựa trên kết quả trả về từ API
        setCart(prevCart => {
          const existingItemIndex = prevCart.findIndex(
            item => item.product._id === product._id && item.color === color && item.size === size
          );
          if (existingItemIndex >= 0) {
            const updated = [...prevCart];
            updated[existingItemIndex].quantity += quantity;
            return updated;
          } else {
            return [...prevCart, res.data]; // res.data là populatedItem
          }
        });
      } catch (err) {
        console.error("Lỗi khi thêm vào giỏ hàng DB:", err);
      }
    } else {
      // Guest logic
      setCart(prevCart => {
        const existingItemIndex = prevCart.findIndex(
          item => item.product._id === product._id && item.color === color && item.size === size
        );
        if (existingItemIndex >= 0) {
          const updatedCart = [...prevCart];
          updatedCart[existingItemIndex].quantity += quantity;
          return updatedCart;
        } else {
          return [...prevCart, { product, color, size, quantity }];
        }
      });
    }
  };

  // Hành động: Xóa 1
  const removeFromCart = async (productId, color, size) => {
    if (userId && userId !== 'guest') {
      try {
        await api.delete('/cart/remove', {
          data: { productId, color, size }
        });
      } catch (err) {
        console.error("Lỗi xóa sản phẩm DB:", err);
      }
    }
    // Cập nhật UI
    setCart(prevCart => prevCart.filter(
      item => !(item.product._id === productId && item.color === color && item.size === size)
    ));
  };

  // Hành động: Cập nhật số lượng
  const updateQuantity = async (productId, color, size, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, color, size);
      return;
    }

    if (userId && userId !== 'guest') {
      try {
        await api.put('/cart/update', { productId, color, size, quantity });
      } catch (err) {
        console.error("Lỗi cập nhật số lượng DB:", err);
      }
    }
    // Cập nhật UI
    setCart(prevCart => prevCart.map(item => {
      if (item.product._id === productId && item.color === color && item.size === size) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  // Hành động: Cập nhật biến thể (Màu sắc / Kích cỡ)
  const updateVariant = async (productId, oldColor, oldSize, newColor, newSize) => {
    if (userId && userId !== 'guest') {
      try {
        const res = await api.put('/cart/update-variant', { 
          productId, 
          oldColor, 
          oldSize, 
          newColor, 
          newSize 
        });
        
        const { item, merged } = res.data;
        
        setCart(prevCart => {
          if (merged) {
            // Nếu bị merged: Xóa item cũ, cập nhật item mới (variant mới)
            const filtered = prevCart.filter(i => !(i.product._id === productId && i.color === oldColor && i.size === oldSize));
            return filtered.map(i => {
              if (i.product._id === productId && i.color === newColor && i.size === newSize) {
                return item;
              }
              return i;
            });
          } else {
            // Nếu không merged: Chỉ cập nhật item cũ
            return prevCart.map(i => {
              if (i.product._id === productId && i.color === oldColor && i.size === oldSize) {
                return item;
              }
              return i;
            });
          }
        });
      } catch (err) {
        console.error("Lỗi cập nhật biến thể DB:", err);
        throw err; // Ném lỗi để UI xử lý (hiển thị thông báo)
      }
    } else {
      // Logic cho Guest (nếu cần)
      setCart(prevCart => {
        const oldItem = prevCart.find(i => i.product._id === productId && i.color === oldColor && i.size === oldSize);
        if (!oldItem) return prevCart;

        const filtered = prevCart.filter(i => !(i.product._id === productId && i.color === oldColor && i.size === oldSize));
        const existingNew = filtered.find(i => i.product._id === productId && i.color === newColor && i.size === newSize);

        if (existingNew) {
          return filtered.map(i => {
            if (i.product._id === productId && i.color === newColor && i.size === newSize) {
              return { ...i, quantity: i.quantity + oldItem.quantity };
            }
            return i;
          });
        } else {
          return [...filtered, { ...oldItem, color: newColor, size: newSize }];
        }
      });
    }
  };

  // Hành động: Xóa tất cả
  const clearCart = async () => {
    if (userId && userId !== 'guest') {
      try {
        await api.delete('/cart/clear');
      } catch (err) {
        console.error("Lỗi clear giỏ hàng DB:", err);
      }
    }
    setCart([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserId('guest');
    setUser(null);
    setUserRole('guest');
    setCart([]);
    window.location.href = '/login';
  };

  // Tính toán
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      if (!item.product || !item.product.price) return total;
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      user,
      userRole,
      handleLogout,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateVariant,
      clearCart,
      getCartTotal,
      getCartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
