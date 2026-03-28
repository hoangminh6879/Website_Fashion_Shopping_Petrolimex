import crypto from 'crypto';
import moment from 'moment';
import qs from 'qs';
import Order from '../models/Order.model.js';
import OrderItem from '../models/OrderItem.model.js';
import Cart from '../models/Cart.model.js';
import CartItem from '../models/CartItem.model.js';
import Product from '../models/Product.model.js';
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import Coupon from '../models/Coupon.model.js';
import sendEmail from '../utils/sendEmail.js';

// ─── Helper ────────────────────────────────────────────────────────────────
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[encodeURIComponent(key)] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
    }
    return sorted;
}

// ─── 1) Tạo order trong DB và redirect đến VNPay ─────────────────────────
// POST /api/orders/vnpay/create_payment_url
export const createVNPayPaymentUrl = async (req, res) => {
    try {
        process.env.TZ = 'Asia/Ho_Chi_Minh';

        const {
            items,
            totalPrice,
            address,
            phone,
            vouchers,
            discountAmount,
            shippingFee,
            isBuyNow,
            bankCode,
            language
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Không có sản phẩm trong đơn hàng' });
        }

        // 1. Xử lý vouchers
        if (vouchers && vouchers.length > 0) {
            for (const vId of vouchers) {
                const coupon = await Coupon.findById(vId);
                if (coupon && coupon.quantity > 0) {
                    coupon.quantity -= 1;
                    coupon.usedCount += 1;
                    await coupon.save();
                }
            }
        }

        // 2. Tạo đơn hàng với trạng thái "pending" (chờ xác nhận thanh toán)
        const order = await Order.create({
            user: req.user.id,
            totalPrice,
            discountAmount: discountAmount || 0,
            shippingFee: shippingFee || 0,
            vouchers: vouchers || [],
            address,
            phone,
            paymentMethod: 'VNPAY',
            status: 'pending_payment'  // Trạng thái chờ thanh toán VNPay
        });

        // 3. Tạo order items và cập nhật tồn kho
        const orderItemsPromises = items.map(async (item) => {
            const product = await Product.findById(item.product._id);
            if (!product) throw new Error(`Sản phẩm ${item.product._id} không tồn tại`);

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

        // 4. Nếu không phải Mua Ngay -> xóa giỏ hàng ngay bây giờ
        if (!isBuyNow) {
            const cart = await Cart.findOne({ user: req.user.id });
            if (cart) {
                await CartItem.deleteMany({ cart: cart._id });
            }
        }

        // 5. Tạo URL thanh toán VNPay
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const orderId = order._id.toString();   // Dùng chính _id của Order

        const ipAddr =
            req.headers['x-forwarded-for'] ||
            req.socket?.remoteAddress ||
            '127.0.0.1';

        const tmnCode = process.env.VNP_TMN_CODE;
        const secretKey = process.env.VNP_HASH_SECRET;
        const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:5000/api/orders/vnpay/vnpay_return';

        if (!secretKey || !tmnCode) {
            throw new Error('Cấu hình VNPay (TMN_CODE hoặc HASH_SECRET) chưa được thiết lập trong server.');
        }

        const locale = language || 'vn';
        const currCode = 'VND';

        let vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Locale: locale,
            vnp_CurrCode: currCode,
            vnp_TxnRef: orderId,
            vnp_OrderInfo: `Thanh toan don hang Petrolimex Fashion #${orderId.slice(-6).toUpperCase()}`,
            vnp_OrderType: 'other',
            vnp_Amount: Math.round(totalPrice) * 100,
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate
        };

        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnp_Params['vnp_SecureHash'] = signed;

        const paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });

        res.json({ paymentUrl, orderId });
    } catch (error) {
        console.error('createVNPayPaymentUrl error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── 2) VNPay Return URL (redirect sau thanh toán) ─────────────────────────
// GET /api/orders/vnpay/vnpay_return
export const vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = { ...req.query };
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const secretKey = process.env.VNP_HASH_SECRET;
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const rspCode = vnp_Params['vnp_ResponseCode'];
        const orderId = vnp_Params['vnp_TxnRef'];

        if (secureHash !== signed) {
            return res.redirect(`${frontendUrl}/order-history?vnpay=fail&reason=invalid_hash`);
        }

        if (rspCode === '00') {
            // Thanh toán thành công
            await Order.findByIdAndUpdate(orderId, {
                status: 'paid',
                paymentStatus: 'paid',
                vnp_TransactionNo: vnp_Params['vnp_TransactionNo'],
                vnp_PayDate: vnp_Params['vnp_PayDate']
            });

            // Gửi thông báo
            const order = await Order.findById(orderId);
            if (order) {
                await Notification.create({
                    recipient: order.user,
                    title: 'Thanh toán VNPay thành công!',
                    message: `Đơn hàng #${orderId.slice(-6).toUpperCase()} đã được thanh toán qua VNPay thành công.`,
                    type: 'order',
                    link: `/order-history?orderId=${orderId}`
                });

                // Gửi email xác nhận
                const user = await User.findById(order.user);
                if (user?.email) {
                    sendEmail({
                        email: user.email,
                        subject: `[Petrolimex Fashion] Xác nhận thanh toán đơn hàng #${orderId}`,
                        message: `Chào ${user.name}, đơn hàng của bạn đã được thanh toán thành công qua VNPay.`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                                <h2 style="color: #ff9900; text-align: center;">Petrolimex Fashion</h2>
                                <h3>Thanh toán VNPay thành công! 🎉</h3>
                                <p>Chào <strong>${user.name}</strong>,</p>
                                <p>Đơn hàng <strong>#${orderId}</strong> đã được thanh toán thành công qua VNPay.</p>
                                <p><strong>Tổng cộng:</strong> ${order.totalPrice.toLocaleString('vi-VN')} VND</p>
                                <p><strong>Địa chỉ giao hàng:</strong> ${order.address}</p>
                                <p><strong>Số điện thoại:</strong> ${order.phone}</p>
                                <hr/>
                                <p style="font-size: 12px; color: #777;">Cảm ơn bạn đã lựa chọn Petrolimex Fashion!</p>
                            </div>
                        `
                    }).catch(err => console.error('Lỗi gửi email VNPay:', err));
                }
            }

            return res.redirect(`${frontendUrl}/order-history?vnpay=success&orderId=${orderId}`);
        } else {
            // Thanh toán thất bại - đổi trạng thái về cancelled
            await Order.findByIdAndUpdate(orderId, { status: 'cancelled' });

            return res.redirect(`${frontendUrl}/order-history?vnpay=fail&reason=${rspCode}`);
        }
    } catch (error) {
        console.error('vnpayReturn error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/order-history?vnpay=fail&reason=server_error`);
    }
};

// ─── 3) VNPay IPN (server-to-server callback từ VNPay) ────────────────────
// GET /api/orders/vnpay/vnpay_ipn
export const vnpayIPN = async (req, res) => {
    try {
        let vnp_Params = { ...req.query };
        const secureHash = vnp_Params['vnp_SecureHash'];
        const orderId = vnp_Params['vnp_TxnRef'];
        const rspCode = vnp_Params['vnp_ResponseCode'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const secretKey = process.env.VNP_HASH_SECRET;
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash !== signed) {
            return res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        // Kiểm tra số tiền
        const vnpAmount = parseInt(vnp_Params['vnp_Amount']) / 100;
        if (vnpAmount !== order.totalPrice) {
            return res.status(200).json({ RspCode: '04', Message: 'Amount invalid' });
        }

        // Tránh cập nhật lại nếu đã xử lý
        if (order.status !== 'pending_payment') {
            return res.status(200).json({ RspCode: '02', Message: 'This order has been updated' });
        }

        if (rspCode === '00') {
            await Order.findByIdAndUpdate(orderId, {
                status: 'paid',
                paymentStatus: 'paid',
                vnp_TransactionNo: vnp_Params['vnp_TransactionNo'],
                vnp_PayDate: vnp_Params['vnp_PayDate']
            });
        } else {
            await Order.findByIdAndUpdate(orderId, { status: 'cancelled' });
        }

        return res.status(200).json({ RspCode: '00', Message: 'Success' });
    } catch (error) {
        console.error('vnpayIPN error:', error);
        return res.status(200).json({ RspCode: '99', Message: 'Server error' });
    }
};

// ─── 4) VNPay Refund (Helper function) ──────────────────────────────────
export const refundVNPay = async (order) => {
    try {
        const date = new Date();
        const vnp_TmnCode = process.env.VNP_TMN_CODE;
        const secretKey = process.env.VNP_HASH_SECRET;
        const vnp_Api = process.env.VNP_API || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

        const vnp_TxnRef = order._id.toString();
        const vnp_TransactionDate = order.vnp_PayDate;
        const vnp_Amount = order.totalPrice * 100;
        const vnp_TransactionType = '02'; // Hoàn tiền toàn phần
        const vnp_CreateBy = 'system';

        const vnp_RequestId = moment(date).format('HHmmss');
        const vnp_Version = '2.1.0';
        const vnp_Command = 'refund';
        const vnp_OrderInfo = 'Hoan tien don hang:' + vnp_TxnRef;

        const vnp_IpAddr = '127.0.0.1';
        const vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');
        const vnp_TransactionNo = order.vnp_TransactionNo || '0';

        const data = vnp_RequestId + "|" + vnp_Version + "|" + vnp_Command + "|" + vnp_TmnCode + "|" + vnp_TransactionType + "|" + vnp_TxnRef + "|" + vnp_Amount + "|" + vnp_TransactionNo + "|" + vnp_TransactionDate + "|" + vnp_CreateBy + "|" + vnp_CreateDate + "|" + vnp_IpAddr + "|" + vnp_OrderInfo;
        const hmac = crypto.createHmac("sha512", secretKey);
        const vnp_SecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest("hex");

        const dataObj = {
            'vnp_RequestId': vnp_RequestId,
            'vnp_Version': vnp_Version,
            'vnp_Command': vnp_Command,
            'vnp_TmnCode': vnp_TmnCode,
            'vnp_TransactionType': vnp_TransactionType,
            'vnp_TxnRef': vnp_TxnRef,
            'vnp_Amount': vnp_Amount,
            'vnp_TransactionNo': vnp_TransactionNo,
            'vnp_CreateBy': vnp_CreateBy,
            'vnp_OrderInfo': vnp_OrderInfo,
            'vnp_TransactionDate': vnp_TransactionDate,
            'vnp_CreateDate': vnp_CreateDate,
            'vnp_IpAddr': vnp_IpAddr,
            'vnp_SecureHash': vnp_SecureHash
        };

        const response = await fetch(vnp_Api, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataObj)
        });

        const result = await response.json();
        console.log('VNPay Refund result:', result);
        return result;
    } catch (error) {
        console.error('refundVNPay error:', error);
        throw error;
    }
};

