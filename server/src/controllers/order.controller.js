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
import Shop from "../models/Shop.model.js";
import mongoose from "mongoose";


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

                // Thông báo hết hàng cho Seller
                if (product.stock[stockIndex] === 0) {
                    const shop = await Shop.findById(product.shop);
                    if (shop && shop.owner) {
                        await Notification.create({
                            recipient: shop.owner,
                            title: "Sản phẩm hết hàng!",
                            message: `Sản phẩm "${product.name}" (Màu: ${item.color}, Size: ${item.size}) đã hết hàng lúc ${new Date().toLocaleTimeString('vi-VN')} ngày ${new Date().toLocaleDateString('vi-VN')}.`,
                            type: "system",
                            link: "/seller/products?tab=products"
                        });
                    }
                }
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

        // 5. Thông báo cho Sellers (Chủ shop)
        try {
            // Lấy danh sách sản phẩm trong đơn hàng kèm thông tin Shop
            const orderItems = await OrderItem.find({ order: order._id }).populate({
                path: 'product',
                populate: { path: 'shop' }
            });

            // Nhóm các Items theo Chủ shop (Owner)
            const sellerNotifications = new Map(); // OwnerID -> { shopName, itemsCount }

            orderItems.forEach(item => {
                const shop = item.product?.shop;
                const ownerId = shop?.owner?.toString();
                if (ownerId) {
                    if (!sellerNotifications.has(ownerId)) {
                        sellerNotifications.set(ownerId, { shopName: shop.name, count: 0 });
                    }
                    sellerNotifications.get(ownerId).count += item.quantity;
                }
            });

            // Gửi từng thông báo cho từng chủ shop
            const notificationPromises = [];
            for (const [ownerId, info] of sellerNotifications.entries()) {
                notificationPromises.push(
                    Notification.create({
                        recipient: ownerId,
                        title: "Bạn có đơn hàng mới!",
                        message: `Shop "${info.shopName}" vừa nhận được đơn hàng mới #${order._id.toString().slice(-6).toUpperCase()} với ${info.count} sản phẩm đang chờ duyệt.`,
                        type: "order",
                        link: "/seller/dashboard?tab=orders"
                    })
                );
            }
            await Promise.all(notificationPromises);
        } catch (notifyErr) {
            console.error("Lỗi khi gửi thông báo cho Seller:", notifyErr);
            // Không throw error ở đây để tránh làm hỏng luồng đặt hàng chính
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

        // Populate items cho mỗi order kèm thông tin Shop
        const populatedOrders = await Promise.all(orders.map(async (order) => {
            const items = await OrderItem.find({ order: order._id }).populate({
                path: "product",
                populate: [
                    { path: "shop", select: "name owner" },
                    { path: "images" }
                ]
            });
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

        const items = await OrderItem.find({ order: order._id }).populate({
            path: "product",
            populate: [
                { path: "shop", select: "name owner" },
                { path: "images" }
            ]
        });
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

        // Security check for seller: Phải sở hữu ít nhất 1 sản phẩm trong đơn này
        if (req.user.role === 'seller') {
            const shop = await Shop.findOne({ owner: req.user.id });
            if (!shop) return res.status(403).json({ message: "Bạn chưa có shop." });

            const myProductIds = await Product.find({ shop: shop._id }).distinct('_id');
            const hasAccess = await OrderItem.exists({ order: req.params.id, product: { $in: myProductIds } });
            if (!hasAccess) return res.status(403).json({ message: "Bạn không có quyền cập nhật đơn hàng này." });
        }

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
            type: "order",
            link: `/order-history?orderId=${order._id}`
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

        // Kiểm tra quyền sở hữu (User đã đặt hàng, Admin, hoặc Seller sở hữu sản phẩm trong đơn)
        const isBuyer = order.user.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';
        let isSellerOwner = false;

        if (req.user.role === 'seller') {
            const shop = await Shop.findOne({ owner: req.user.id });
            if (shop) {
                const myProductIds = await Product.find({ shop: shop._id }).distinct('_id');
                isSellerOwner = await OrderItem.exists({ order: id, product: { $in: myProductIds } });
            }
        }

        if (!isBuyer && !isAdmin && !isSellerOwner) {
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
            type: "order",
            link: `/order-history?orderId=${order._id}`
        });

        res.json({ message: "Đã hủy đơn hàng thành công", order });

    } catch (error) {
        console.error('cancelOrder error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Lấy thống kê doanh thu cho Seller
// @route   GET /api/orders/seller-stats
export const getSellerStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const shop = await Shop.findOne({ owner: userId });

        if (!shop) {
            return res.status(404).json({ message: "Không tìm thấy Shop gắn với tài khoản này." });
        }

        const shopId = shop._id;

        const stats = await OrderItem.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            { $match: { 'productInfo.shop': new mongoose.Types.ObjectId(shopId) } },
            {
                $lookup: {
                    from: 'orders',
                    localField: 'order',
                    foreignField: '_id',
                    as: 'orderInfo'
                }
            },
            { $unwind: '$orderInfo' },
            {
                $match: {
                    'orderInfo.status': { $in: ['paid', 'shipped', 'completed'] }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$orderInfo.createdAt' },
                        month: { $month: '$orderInfo.createdAt' }
                    },
                    totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } },
                    uniqueOrders: { $addToSet: '$order' }
                }
            },
            {
                $project: {
                    _id: 0,
                    year: '$_id.year',
                    month: '$_id.month',
                    revenue: '$totalRevenue',
                    orders: { $size: '$uniqueOrders' }
                }
            },
            { $sort: { year: -1, month: -1 } }
        ]);

        res.json(stats);
    } catch (error) {
        console.error('getSellerStats error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Lấy danh sách đơn hàng cho Seller (chỉ những đơn có sản phẩm của Shop mình)
// @route   GET /api/orders/seller
export const getSellerOrders = async (req, res) => {
    try {
        const userId = req.user.id;


        // 1. Tìm shop
        const shop = await Shop.findOne({ owner: userId }).lean();
        if (!shop) {
            return res.json([]);
        }
        const shopIdString = shop._id.toString();


        // 2. Tìm tất cả Product ID của Shop
        const products = await Product.find({ shop: shop._id }).select('_id name').lean();
        const myProductIds = products.map(p => p._id.toString());


        if (myProductIds.length === 0) {
            return res.json([]);
        }

        // 3. Tìm tất cả OrderItem liên quan đến các sản phẩm này
        // (Sử dụng ID sản phẩm để tìm Item)
        const myOrderItems = await OrderItem.find({ product: { $in: myProductIds } })
            .populate({
                path: 'product',
                populate: { path: 'images' }
            })
            .lean();


        if (myOrderItems.length === 0) {
            return res.json([]);
        }

        // 4. Lọc ra danh sách Order ID duy nhất
        const orderIdsSet = new Set();
        myOrderItems.forEach(item => {
            if (item.order) {
                orderIdsSet.add(item.order.toString());
            }
        });
        const uniqueOrderIds = Array.from(orderIdsSet);


        if (uniqueOrderIds.length === 0) {
            return res.json([]);
        }

        // 5. Lấy thông tin chi tiết các đơn hàng (Populate User)
        // Lưu ý: Không dùng lean ở đây nếu có vấn đề, nhưng dùng cho an toàn object
        const ordersFromDb = await Order.find({ _id: { $in: uniqueOrderIds } })
            .populate('user', 'name email phone avatar')
            .sort('-createdAt')
            .lean();



        // 6. Gắn/Lọc các Item tương ứng cho từng đơn hàng
        const finalSellerOrders = ordersFromDb.map(order => {
            const currentOrderIdStr = order._id.toString();

            // Chỉ lấy các item thuộc đơn hàng này VÀ thuộc shop hiện tại
            const itemsForThisOrder = myOrderItems.filter(item => {
                return item.order && item.order.toString() === currentOrderIdStr;
            });

            // Tính toán tổng tiền riêng cho phần của shop này trong đơn
            let shopSubtotal = 0;
            itemsForThisOrder.forEach(item => {
                const itemPrice = Number(item.price) || 0;
                const itemQuantity = Number(item.quantity) || 0;
                shopSubtotal += (itemPrice * itemQuantity);
            });

            // Trả về cấu trúc đơn hàng nhưng chỉ kèm các Item của shop mình
            return {
                ...order,
                items: itemsForThisOrder,
                shopSubtotal: shopSubtotal
            };
        });


        return res.json(finalSellerOrders);

    } catch (error) {
        console.error('[getSellerOrders CRITICAL ERROR]:', error);
        return res.status(500).json({
            message: "Lỗi hệ thống khi xử lý danh sách đơn hàng cho Seller",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc    Xác nhận đã nhận được hàng (Dành cho Người mua)
// @route   PUT /api/orders/:id/confirm-receipt
export const confirmReceipt = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        // Kiểm tra quyền sở hữu: Phải là người đặt hàng
        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ message: " Bạn không có quyền xác nhận đơn hàng này" });
        }

        // Chỉ cho phát xác nhận khi đang ở trạng thái 'shipped' (đang giao)
        if (order.status !== 'shipped') {
            return res.status(400).json({
                message: `Chỉ có thể xác nhận khi đơn hàng đang ở trạng thái "Đang giao". Trạng thái hiện tại: ${order.status}`
            });
        }

        // Cập nhật trạng thái thành 'completed'
        order.status = 'completed';
        order.completedAt = new Date();
        await order.save();

        // Tính điểm thưởng cho User
        const points = Math.floor(order.totalPrice / 1000);
        const user = await User.findById(req.user.id);
        if (user) {
            user.loyaltyPoints = (user.loyaltyPoints || 0) + points;
            
            // Đánh giá lại hạng
            if (user.loyaltyPoints >= 5000) {
                user.customerTier = "kim cương";
            } else if (user.loyaltyPoints >= 4000) {
                user.customerTier = "bạch kim";
            } else if (user.loyaltyPoints >= 3000) {
                user.customerTier = "vàng";
            } else if (user.loyaltyPoints >= 2000) {
                user.customerTier = "bạc";
            } else if (user.loyaltyPoints >= 1000) {
                user.customerTier = "đồng";
            } else {
                user.customerTier = "thường";
            }
            await user.save();
        }

        // Thông báo cho Seller(s) sở hữu các sản phẩm trong đơn này
        try {
            const orderItems = await OrderItem.find({ order: order._id }).populate({
                path: 'product',
                populate: { path: 'shop' }
            });

            const sellerNotifications = new Map(); // OwnerID -> ShopName

            orderItems.forEach(item => {
                const shop = item.product?.shop;
                const ownerId = shop?.owner?.toString();
                if (ownerId && !sellerNotifications.has(ownerId)) {
                    sellerNotifications.set(ownerId, shop.name);
                }
            });

            for (const [ownerId, shopName] of sellerNotifications.entries()) {
                await Notification.create({
                    recipient: ownerId,
                    title: "Đơn hàng hoàn tất! 📦",
                    message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} tại Shop "${shopName}" đã được khách hàng xác nhận nhận thành công.`,
                    type: "order",
                    link: "/seller/dashboard?tab=orders"
                });
            }
        } catch (notifyErr) {
            console.error("Lỗi gửi thông báo hoàn tất cho Seller:", notifyErr);
        }

        res.json({ message: "Đã xác nhận nhận hàng thành công. Cảm ơn quý khách!", order });
    } catch (error) {
        console.error('confirmReceipt error:', error);
        res.status(500).json({ message: error.message });
    }
};

