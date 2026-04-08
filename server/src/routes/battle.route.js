import express from "express";
import {
  createBattle,
  getSellerBattles,
  getOngoingBattles,
  getBattleById,
  voteBattle,
  getAdminBattles
} from "../controllers/battle.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// Công khai (Public)
router.get("/ongoing", getOngoingBattles);
// Vẫn cần hỗ trợ truyền token để kiểm tra user "hasVoted" hay không, thay vì protect cứng
// nên viết 1 hàm middleware nhẹ hoặc xử lý error trong jwt.
import jwt from "jsonwebtoken";
const optionalProtect = (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Bỏ qua lỗi, coi như chưa đăng nhập
    }
  }
  next();
};

router.get("/:id", optionalProtect, getBattleById);

// Cần đăng nhập để làm các việc sau
router.post("/:id/vote", protect, voteBattle); // Bất kỳ user nào cũng được vote

// Seller
router.post("/", protect, createBattle);
router.get("/seller/list", protect, getSellerBattles);

// Admin
router.get("/admin/list", protect, authorizeRoles("admin"), getAdminBattles);

export default router;
