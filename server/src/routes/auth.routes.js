import express from "express";
import { register, login, getMe, updateMe, googleSuccess } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import passport from "passport";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

// Google Auth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    googleSuccess
);

export default router;