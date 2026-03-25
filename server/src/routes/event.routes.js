import express from "express";
import {
  getEvents,
  getOngoingEvents,
  getUpcomingEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/ongoing", getOngoingEvents);      // Public
router.get("/upcoming", getUpcomingEvents);    // Public (for seller registration)

router
  .route("/")
  .get(getEvents)                              // Public (admin/all)
  .post(protect, authorizeRoles("admin"), createEvent);

router
  .route("/:id")
  .get(getEventById)
  .put(protect, authorizeRoles("admin"), updateEvent)
  .delete(protect, authorizeRoles("admin"), deleteEvent);

export default router;
