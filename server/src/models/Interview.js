const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  category: {
    type: String,
    enum: ["behavioral", "technical", "system-design", "coding", "hr"],
    default: "technical",
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  sampleAnswer: String,
  tips: [String],
  followUps: [String],
});

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["behavioral", "technical", "system-design", "coding", "hr", "mixed"],
      default: "mixed",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    role: { type: String, default: "Software Engineer" },
    company: { type: String, default: "" },

    // Questions and answers
    questions: [
      {
        question: String,
        category: String,
        userAnswer: String,
        feedback: String,
        score: { type: Number, min: 0, max: 10 },
        answeredAt: Date,
      },
    ],

    // Session metrics
    totalQuestions: { type: Number, default: 0 },
    answeredQuestions: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }, // in seconds
    status: {
      type: String,
      enum: ["in-progress", "completed", "abandoned"],
      default: "in-progress",
    },

    // Feedback
    overallFeedback: String,
    strengths: [String],
    improvements: [String],

    xpEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

interviewSessionSchema.index({ user: 1, createdAt: -1 });

const InterviewQuestion = mongoose.model("InterviewQuestion", questionSchema);
const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);

module.exports = { InterviewQuestion, InterviewSession };
