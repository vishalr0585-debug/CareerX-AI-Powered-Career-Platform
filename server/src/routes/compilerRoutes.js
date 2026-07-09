const express = require("express");
const router = express.Router();
const compilerController = require("../controllers/compilerController");
const { protect, optionalAuth } = require("../middleware/auth");

// Problem browsing (auth optional for viewing, required for submissions)
router.get("/problems", optionalAuth, compilerController.getProblems);
router.get("/problems/:slug", optionalAuth, compilerController.getProblem);

// Protected routes
router.post("/run", protect, compilerController.runCode);
router.post("/submit", protect, compilerController.submitSolution);
router.get("/submissions", protect, compilerController.getSubmissions);
router.get("/stats", protect, compilerController.getCodingStats);

// Dev/seed route
router.post("/seed/init", protect, compilerController.seedProblems);

module.exports = router;
