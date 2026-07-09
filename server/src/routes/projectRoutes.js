const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { protect } = require("../middleware/auth");

router.use(protect);

// GitHub search (public API)
router.get("/github-search", projectController.searchGitHub);

// Templates & generation
router.get("/templates", projectController.getTemplates);
router.post("/generate", projectController.generateProject);

// CRUD
router.get("/", projectController.getProjects);
router.post("/", projectController.createProject);
router.get("/:id", projectController.getProject);
router.put("/:id", projectController.updateProject);
router.delete("/:id", projectController.deleteProject);

// Step tracking
router.put("/:id/steps/:stepIndex", projectController.toggleStep);

module.exports = router;
