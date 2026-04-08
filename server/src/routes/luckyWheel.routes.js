import express from "express";
import {
  getPrizes,
  createPrize,
  updatePrize,
  deletePrize,
  spinWheel,
} from "../controllers/luckyWheel.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router
  .route("/")
  .get(getPrizes) // Public (ai cũng lấy danh sách được để xem vòng quay)
  .post(protect, authorizeRoles("admin"), createPrize);

router
  .route("/spin")
  .post(protect, spinWheel);

router
  .route("/:id")
  .put(protect, authorizeRoles("admin"), updatePrize)
  .delete(protect, authorizeRoles("admin"), deletePrize);

export default router;
