const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../middleware/validators");

// Public routes
router.post("/signup", signupValidation, authController.signup);
router.post("/login", loginValidation, authController.login);
router.post("/google", authController.googleLogin);
router.post("/github", authController.githubLogin);
router.post("/forgot-password", forgotPasswordValidation, authController.forgotPassword);
router.post("/reset-password/:token", resetPasswordValidation, authController.resetPassword);
router.post("/refresh", authController.refreshToken);

// Protected routes
router.get("/me", protect, authController.getMe);
router.post("/logout", protect, authController.logout);

module.exports = router;
