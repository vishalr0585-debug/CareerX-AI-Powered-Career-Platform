const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const { protect } = require("../middleware/auth");

// External search (before :id routes)
router.get("/search-external", protect, jobController.searchExternal);

// Public routes (browsing jobs)
router.get("/", protect, jobController.getJobs);
router.get("/:id", protect, jobController.getJob);

// Protected routes
router.post("/:id/apply", protect, jobController.applyToJob);
router.get("/user/applications", protect, jobController.getApplications);
router.put("/user/applications/:id", protect, jobController.updateApplication);

// Dev/seed route
router.post("/seed/init", protect, jobController.seedJobs);

module.exports = router;
