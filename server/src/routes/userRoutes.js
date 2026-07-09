const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { updateProfileValidation } = require("../middleware/validators");
const { avatarUpload, profileResumeUpload } = require("../middleware/upload");

// All routes require authentication
router.use(protect);

router.get("/profile", userController.getProfile);
router.put("/profile", updateProfileValidation, userController.updateProfile);
router.patch("/role", userController.updateRole);
router.get("/stats", userController.getStats);
router.get("/activity/recent", userController.getRecentActivity);
router.get("/activity/heatmap", userController.getActivityHeatmap);
router.get("/xp-history", userController.getXPHistory);
router.get("/skill-distribution", userController.getSkillDistribution);
router.get("/achievements", userController.getAchievements);

// Profile image & resume uploads
router.post("/avatar", avatarUpload.single("avatar"), userController.uploadAvatar);
router.post("/profile-resume", profileResumeUpload.single("resume"), userController.uploadProfileResume);
router.delete("/profile-resume", userController.deleteProfileResume);

// AI job suggestions
router.get("/ai-job-suggestions", userController.getAIJobSuggestions);

module.exports = router;
