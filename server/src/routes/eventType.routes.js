import express from "express";
import {
  getEventTypes,
  getEventTypeById,
  createEventType,
  updateEventType,
  deleteEventType,
} from "../controllers/eventType.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router
  .route("/")
  .get(getEventTypes) // Public
  .post(protect, authorizeRoles("admin"), createEventType);

router
  .route("/:id")
  .get(getEventTypeById)
  .put(protect, authorizeRoles("admin"), updateEventType)
  .delete(protect, authorizeRoles("admin"), deleteEventType);

export default router;
