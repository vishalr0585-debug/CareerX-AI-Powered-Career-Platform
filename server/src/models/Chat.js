const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      model: String,
      tokens: Number,
      topic: String,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ user: 1, sessionId: 1, createdAt: 1 });

const chatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      default: "New Chat",
    },
    topic: {
      type: String,
      enum: ["dsa", "web-dev", "system-design", "career", "interview", "resume", "general"],
      default: "general",
    },
    messageCount: { type: Number, default: 0 },
    lastMessage: String,
  },
  { timestamps: true }
);

chatSessionSchema.index({ user: 1, updatedAt: -1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

module.exports = { ChatMessage, ChatSession };
