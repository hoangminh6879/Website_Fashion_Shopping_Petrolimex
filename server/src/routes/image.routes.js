import express from "express";
import { uploadImage, deleteImage } from "../controllers/image.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/upload", protect, authorizeRoles("user", "seller", "admin"), upload.single("image"), uploadImage);
router.delete("/:id", protect, authorizeRoles("user", "seller", "admin"), deleteImage);

export default router;
