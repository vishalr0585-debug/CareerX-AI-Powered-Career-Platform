const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    category: {
      type: String,
      enum: ["web", "mobile", "api", "ml", "cli", "game", "automation", "other"],
      default: "web",
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    technologies: [String],
    features: [String],
    steps: [
      {
        title: String,
        description: String,
        completed: { type: Boolean, default: false },
      },
    ],
    totalSteps: { type: Number, default: 0 },
    completedSteps: { type: Number, default: 0 },
    progress: { type: Number, default: 0 }, // percentage
    status: {
      type: String,
      enum: ["planning", "in-progress", "completed", "archived"],
      default: "planning",
    },
    githubUrl: String,
    liveUrl: String,
    xpEarned: { type: Number, default: 0 },
    aiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

projectSchema.index({ user: 1, status: 1 });
projectSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
