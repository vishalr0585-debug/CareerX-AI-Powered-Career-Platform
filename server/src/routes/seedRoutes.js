const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const jobController = require("../controllers/jobController");
const examController = require("../controllers/examController");
const compilerController = require("../controllers/compilerController");

// POST /api/seed/all — Seed all collections in one shot (dev/setup only)
router.post("/all", protect, async (req, res) => {
  const results = {};

  try {
    // Seed jobs
    const jobRes = { json: (d) => (results.jobs = d) };
    await jobController.seedJobs(req, jobRes);
  } catch (e) {
    results.jobs = { success: false, error: e.message };
  }

  try {
    // Seed exam questions
    const examRes = { json: (d) => (results.exams = d) };
    await examController.seedQuestions(req, examRes);
  } catch (e) {
    results.exams = { success: false, error: e.message };
  }

  try {
    // Seed compiler problems
    const compRes = { json: (d) => (results.compiler = d) };
    await compilerController.seedProblems(req, compRes);
  } catch (e) {
    results.compiler = { success: false, error: e.message };
  }

  res.json({
    success: true,
    message: "All collections seeded successfully",
    results,
  });
});

module.exports = router;
