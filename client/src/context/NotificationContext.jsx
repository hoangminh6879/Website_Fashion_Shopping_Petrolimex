import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useCart } from "./CartContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useCart();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Lỗi khi lấy thông báo:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Tự động cập nhật mỗi phút
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      await axios.put("http://localhost:5000/api/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, fetchNotifications, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
