const express = require("express");
const router = express.Router();
const resumeController = require("../controllers/resumeController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

// All resume routes require authentication
router.use(protect);

router.get("/", resumeController.getResumes);
router.post("/", resumeController.createResume);
router.post("/upload-analyze", upload.single("resume"), resumeController.uploadAndAnalyze);
router.get("/:id", resumeController.getResume);
router.put("/:id", resumeController.updateResume);
router.delete("/:id", resumeController.deleteResume);
router.post("/:id/analyze", resumeController.analyzeResume);

module.exports = router;
