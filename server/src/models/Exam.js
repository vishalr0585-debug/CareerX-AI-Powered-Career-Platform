const mongoose = require("mongoose");

const examQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // index of correct option
  explanation: String,
  subject: {
    type: String,
    enum: [
      "dsa", "os", "dbms", "cn", "oops", "web-dev",
      "system-design", "aptitude", "reasoning", "verbal",
    ],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  topic: String,
  tags: [String],
});

examQuestionSchema.index({ subject: 1, difficulty: 1 });

const examAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    examType: {
      type: String,
      enum: ["practice", "mock-test", "topic-wise", "full-exam"],
      default: "practice",
    },
    subject: String,
    difficulty: String,
    topic: String,

    // Questions and responses
    questions: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ExamQuestion",
        },
        questionText: String,
        options: [String],
        correctAnswer: Number,
        selectedAnswer: { type: Number, default: -1 },
        isCorrect: Boolean,
        explanation: String,
        timeTaken: Number, // seconds per question
      },
    ],

    // Results
    totalQuestions: { type: Number, default: 0 },
    attempted: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    score: { type: Number, default: 0 }, // percentage
    timeTaken: { type: Number, default: 0 }, // total seconds
    timeLimit: { type: Number, default: 0 }, // seconds

    status: {
      type: String,
      enum: ["in-progress", "completed", "timed-out"],
      default: "in-progress",
    },
    xpEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

examAttemptSchema.index({ user: 1, createdAt: -1 });
examAttemptSchema.index({ user: 1, subject: 1 });

const ExamQuestion = mongoose.model("ExamQuestion", examQuestionSchema);
const ExamAttempt = mongoose.model("ExamAttempt", examAttemptSchema);

module.exports = { ExamQuestion, ExamAttempt };
