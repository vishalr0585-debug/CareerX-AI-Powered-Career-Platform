const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getUniversityRecommendations,
  getScholarshipRecommendations,
  generateSOP,
} = require("../controllers/higherEdController");

router.post("/university-recommend", protect, getUniversityRecommendations);
router.post("/scholarship-recommend", protect, getScholarshipRecommendations);
router.post("/generate-sop", protect, generateSOP);

module.exports = router;
