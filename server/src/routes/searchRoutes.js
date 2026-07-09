const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { search } = require("../controllers/searchController");

// GET /api/search?q=<query>&type=<all|problems|jobs>
router.get("/", protect, search);

module.exports = router;
