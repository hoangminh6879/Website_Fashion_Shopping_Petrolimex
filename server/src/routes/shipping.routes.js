import express from 'express';
import Shop from '../models/Shop.model.js';
const router = express.Router();

// Haversine formula tính khoảng cách (km)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// POST /api/shipping/calculate
router.post('/calculate', async (req, res) => {
    const { lat, lng, shopId } = req.body;

    if (lat == null || lng == null) {
        return res.status(400).json({ message: 'Thiếu tọa độ lat/lng người mua' });
    }

    let shopLat, shopLng;

    if (shopId) {
        const shop = await Shop.findById(shopId);
        if (shop && shop.lat && shop.lng) {
            shopLat = shop.lat;
            shopLng = shop.lng;
        }
    }

    // Nếu không có shopId hoặc shop không có tọa độ, dùng tọa độ mặc định (Hà Nội)
    if (shopLat == null || shopLng == null) {
        shopLat = 10.7769; // TP.HCM (Ví dụ)
        shopLng = 106.7009;
    }

    const distance = getDistance(shopLat, shopLng, lat, lng);

    // Phí ship: 15.000đ cơ bản + 5.000đ mỗi km vượt quá 5km
    let fee = 15000;
    if (distance > 5) {
        fee += Math.round((distance - 5) * 5000);
    }
    // Tối đa 100.000đ
    fee = Math.min(fee, 100000);

    res.json({
        distance: parseFloat(distance.toFixed(2)),
        shippingFee: Math.round(fee),
        fromShop: shopId ? true : false
    });
});

export default router;
