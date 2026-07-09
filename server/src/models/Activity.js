const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ["coding", "resume", "interview", "job", "exam", "project", "chat", "general"],
      default: "general",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for recent activity feed
activitySchema.index({ user: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);
module.exports = Activity;
