const express = require("express");
const router = express.Router();
const interviewController = require("../controllers/interviewController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/start", interviewController.startSession);
router.post("/:sessionId/answer", interviewController.submitAnswer);
router.post("/:sessionId/complete", interviewController.completeSession);
router.get("/history", interviewController.getHistory);
router.get("/:sessionId", interviewController.getSession);

module.exports = router;
