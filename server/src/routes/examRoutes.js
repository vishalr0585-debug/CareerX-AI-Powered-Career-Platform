const express = require("express");
const router = express.Router();
const examController = require("../controllers/examController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/subjects", examController.getSubjects);
router.post("/start", examController.startExam);
router.post("/:attemptId/submit", examController.submitExam);
router.get("/history", examController.getHistory);

// Dev/seed route
router.post("/seed/init", examController.seedQuestions);

module.exports = router;
