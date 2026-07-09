const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

// GET /api/coding-profile/leetcode/:username
router.get("/leetcode/:username", profileController.getLeetCodeStats);

// GET /api/coding-profile/github/:username
router.get("/github/:username", profileController.getGitHubStats);

// GET /api/coding-profile/gfg/:username
router.get("/gfg/:username", profileController.getGeeksForGeeksStats);

// GET /api/coding-profile/codechef/:username
router.get("/codechef/:username", profileController.getCodeChefStats);

// GET /api/coding-profile/hackerrank/:username
router.get("/hackerrank/:username", profileController.getHackerRankStats);

module.exports = router;
