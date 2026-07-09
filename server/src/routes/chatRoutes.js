const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/sessions", chatController.getSessions);
router.post("/sessions", chatController.createSession);
router.get("/sessions/:sessionId", chatController.getMessages);
router.post("/sessions/:sessionId/messages", chatController.sendMessage);
router.delete("/sessions/:sessionId", chatController.deleteSession);

module.exports = router;
