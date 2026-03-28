import Order from "../models/Order.model.js";
import OrderItem from "../models/OrderItem.model.js";
import Cart from "../models/Cart.model.js";
import CartItem from "../models/CartItem.model.js";
import Product from "../models/Product.model.js";
import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import Coupon from "../models/Coupon.model.js";
import sendEmail from "../utils/sendEmail.js";
import { refundVNPay } from "./vnpay.controller.js";


// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
export const createOrder = async (req, res) => {
    try {
        const { items, totalPrice, address, phone, paymentMethod, vouchers, discountAmount, shippingFee, isBuyNow } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Không có sản phẩm trong đơn hàng" });
        }

        // 1. Xử lý Vouchers (nếu có)
        if (vouchers && vouchers.length > 0) {
            for (const vId of vouchers) {
                const coupon = await Coupon.findById(vId);
                if (coupon) {
                    if (coupon.quantity > 0) {
                        coupon.quantity -= 1;
                        coupon.usedCount += 1;
                        await coupon.save();
                    }
                }
            }
        }

        // 2. Tạo đơn hàng cơ bản
        const order = await Order.create({
            user: req.user.id,
            totalPrice,
            discountAmount: discountAmount || 0,
            shippingFee: shippingFee || 0,
            vouchers: vouchers || [],
            address,
            phone,
            paymentMethod: paymentMethod || "COD",
            status: "pending"
        });

        // 2. Tạo các item trong đơn hàng và cập nhật tồn kho
        const orderItemsPromises = items.map(async (item) => {
            // Tìm sản phẩm để lấy giá hiện tại và cập nhật tồn kho
            const product = await Product.findById(item.product._id);
            if (!product) throw new Error(`Sản phẩm ${item.product._id} không tồn tại`);

            // Cập nhật tồn kho (Stock)
            const colorIdx = (product.colors || []).indexOf(item.color);
            const sizeIdx = (product.sizes || []).indexOf(item.size);

            if (colorIdx !== -1 && sizeIdx !== -1) {
                const stockIndex = colorIdx * (product.sizes?.length || 0) + sizeIdx;
                if (product.stock[stockIndex] < item.quantity) {
                    throw new Error(`Sản phẩm ${product.name} (Màu: ${item.color}, Size: ${item.size}) không đủ hàng`);
                }
                product.stock[stockIndex] -= item.quantity;
                product.sold = (product.sold || 0) + item.quantity;
                await product.save();
            }

            return OrderItem.create({
                order: order._id,
                product: item.product._id,
                color: item.color,
                size: item.size,
                quantity: item.quantity,
                price: item.product.price
            });
        });

        await Promise.all(orderItemsPromises);

        // 3. Làm sạch giỏ hàng sau khi đặt hàng thành công (nếu không phải Mua Ngay)
        if (!isBuyNow) {
            const cart = await Cart.findOne({ user: req.user.id });
            if (cart) {
                await CartItem.deleteMany({ cart: cart._id });
            }
        }

        // Tạo thông báo trong hệ thống cho User
        await Notification.create({
            recipient: req.user.id,
            title: "Đặt hàng thành công!",
            message: `Bạn vừa đặt thành công đơn hàng #${order._id.toString().slice(-6).toUpperCase()} với tổng tiền ${totalPrice.toLocaleString('vi-VN')} VND.`,
            type: "order",
            link: `/order-history?orderId=${order._id}` // Link to order history with ID to auto-open details
        });

        // 4. Gửi email xác nhận (không làm gián đoạn response)
        const user = await User.findById(req.user.id);
        if (user && user.email) {
            const orderItemsHtml = items.map(item =>
                `<li>${item.product.name} (Màu: ${item.color}, Size: ${item.size}) x ${item.quantity} - ${item.product.price.toLocaleString('vi-VN')} VND</li>`
            ).join('');

            sendEmail({
                email: user.email,
                subject: `[Petrolimex Fashion] Xác nhận đơn hàng #${order._id}`,
                message: `Chào ${user.name}, đơn hàng của bạn đã được tiếp nhận. Tổng tiền: ${totalPrice.toLocaleString('vi-VN')} VND.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #ff9900; text-align: center;">Petrolimex Fashion</h2>
                        <h3>Xác nhận đặt hàng thành công!</h3>
                        <p>Chào <strong>${user.name}</strong>,</p>
                        <p>Đơn hàng <strong>#${order._id}</strong> đã được hệ thống tiếp nhận và đang được xử lý.</p>
                        <hr/>
                        <h4>Chi tiết đơn hàng:</h4>
                        <ul>${orderItemsHtml}</ul>
                        <p><strong>Tổng cộng: ${totalPrice.toLocaleString('vi-VN')} VND</strong></p>
                        <p><strong>Địa chỉ giao hàng:</strong> ${address}</p>
                        <p><strong>Số điện thoại:</strong> ${phone}</p>
                        <hr/>
                        <p style="font-size: 12px; color: #777;">Cảm ơn bạn đã lựa chọn Petrolimex Fashion. Chúng tôi sẽ chuyển hàng cho bạn trong thời gian sớm nhất.</p>
                    </div>
                `
            }).catch(err => console.error("Lỗi gửi email xác nhận đặt hàng:", err));
        }

        res.status(201).json({ message: "Đặt hàng thành công", orderId: order._id });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Lấy danh sách đơn hàng của người dùng hiện tại
// @route   GET /api/orders/my-orders
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort("-createdAt");

        // Populate items cho mỗi order
        const populatedOrders = await Promise.all(orders.map(async (order) => {
            const items = await OrderItem.find({ order: order._id }).populate("product");
            return { ...order._doc, items };
        }));

        res.json(populatedOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Lấy chi tiết đơn hàng
// @route   GET /api/orders/:id
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate("user", "name email");
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        const items = await OrderItem.find({ order: order._id }).populate("product");
        res.json({ ...order._doc, items });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cập nhật trạng thái đơn hàng (Dành cho Admin/Seller)
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        // Tạo thông báo cho user
        const statusMap = {
            pending_payment: "đang chờ thanh toán VNPay",
            paid: "đã được thanh toán",
            shipped: "đang được giao",
            completed: "đã hoàn thành",
            cancelled: "đã bị hủy"
        };
        const statusText = statusMap[status] || status;

        await Notification.create({
            recipient: order.user,
            title: "Cập nhật đơn hàng",
            message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} của bạn ${statusText}.`,
            type: "order"
        });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Hủy đơn hàng
// @route   POST /api/orders/:id/cancel
export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        // Kiểm tra quyền sở hữu (chỉ cho phép user đã đặt đơn hàng này hủy)
        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền hủy đơn hàng này" });
        }

        // Kiểm tra điều kiện hủy
        if (order.status === 'completed') {
            return res.status(400).json({ message: "Đơn hàng đã hoàn thành, không thể hủy." });
        }
        if (order.status === 'cancelled') {
            return res.status(400).json({ message: "Đơn hàng đã được hủy trước đó." });
        }

        // Quy tắc riêng cho COD
        if (order.paymentMethod === 'COD' && order.status !== 'pending') {
            return res.status(400).json({ message: "Đơn hàng COD chỉ có thể hủy khi đang chờ duyệt." });
        }

        // Nếu đã thanh toán qua VNPay -> Gọi API hoàn tiền
        if (order.paymentMethod === 'VNPAY' && order.paymentStatus === 'paid') {
            if (!order.vnp_TransactionNo || !order.vnp_PayDate) {
                // Có thể do đơn hàng cũ chưa lưu thông tin này, hoặc lỗi trong quá trình callback
                console.warn(`Order ${order._id} paid via VNPAY but missing transaction info for refund.`);
            } else {
                try {
                    const refundResult = await refundVNPay(order);
                    if (refundResult.vnp_ResponseCode !== '00') {
                        console.error('VNPay Refund failed:', refundResult);
                        // Tùy chọn: trả về lỗi hoặc vẫn cho hủy nhưng đánh dấu cần xử lý thủ công
                    } else {
                        order.paymentStatus = 'refunded';
                    }
                } catch (refundErr) {
                    console.error('Error calling VNPay refund:', refundErr);
                }
            }
        }

        // Hoàn lại tồn kho cho các sản phẩm trong đơn hàng
        const orderItems = await OrderItem.find({ order: order._id }).populate("product");
        for (const item of orderItems) {
            const product = item.product;
            if (product) {
                const colorIdx = (product.colors || []).indexOf(item.color);
                const sizeIdx = (product.sizes || []).indexOf(item.size);

                if (colorIdx !== -1 && sizeIdx !== -1) {
                    const stockIndex = colorIdx * (product.sizes?.length || 0) + sizeIdx;
                    product.stock[stockIndex] += item.quantity;
                    product.sold = Math.max(0, (product.sold || 0) - item.quantity);
                    await product.save();
                }
            }
        }

        // Cập nhật trạng thái đơn hàng
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelReason = reason || "Người dùng yêu cầu hủy";
        await order.save();

        // Thông báo cho user
        await Notification.create({
            recipient: order.user,
            title: "Đơn hàng đã hủy",
            message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} của bạn đã được hủy thành công.`,
            type: "order"
        });

        res.json({ message: "Đã hủy đơn hàng thành công", order });

    } catch (error) {
        console.error('cancelOrder error:', error);
        res.status(500).json({ message: error.message });
    }
};

