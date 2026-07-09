const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy",
  },
  category: {
    type: String,
    enum: [
      "arrays", "strings", "linked-lists", "trees", "graphs",
      "dynamic-programming", "sorting", "searching", "stacks",
      "queues", "hash-maps", "math", "greedy", "backtracking",
      "bit-manipulation", "two-pointers",
    ],
    default: "arrays",
  },
  tags: [String],
  constraints: [String],
  examples: [
    {
      input: String,
      output: String,
      explanation: String,
    },
  ],
  starterCode: {
    javascript: { type: String, default: "" },
    python: { type: String, default: "" },
    java: { type: String, default: "" },
    cpp: { type: String, default: "" },
  },
  testCases: [
    {
      input: String,
      expectedOutput: String,
      isHidden: { type: Boolean, default: false },
    },
  ],
  solution: String,
  hints: [String],
  companies: [String],
});

problemSchema.index({ difficulty: 1, category: 1 });

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      default: "javascript",
    },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ["accepted", "wrong-answer", "time-limit", "runtime-error", "compile-error"],
      default: "wrong-answer",
    },
    testResults: [
      {
        input: String,
        expectedOutput: String,
        actualOutput: String,
        passed: Boolean,
        time: Number,
        memory: Number,
      },
    ],
    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    executionTime: Number,
    memory: Number,
    xpEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

submissionSchema.index({ user: 1, problem: 1, createdAt: -1 });

const Problem = mongoose.model("Problem", problemSchema);
const Submission = mongoose.model("Submission", submissionSchema);

module.exports = { Problem, Submission };
