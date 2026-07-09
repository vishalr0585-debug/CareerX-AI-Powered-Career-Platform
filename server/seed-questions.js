/**
 * Standalone seed script — run from d:\CareerX\server
 * Usage: node seed-questions.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌  MONGODB_URI not found in .env");
  process.exit(1);
}

const { ExamQuestion } = require("./src/models/Exam");

// ── FULL QUESTION BANK ─────────────────────────────────────────────────────────
const questionBankData = require("./src/controllers/examController").__questionBank ||
  (() => { throw new Error("Cannot import questionBankData — check examController exports"); })();

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✓ MongoDB connected");

  const allQuestions = [];
  Object.entries(questionBankData).forEach(([subject, questions]) => {
    questions.forEach((q) => {
      allQuestions.push({ ...q, subject, tags: [subject, q.topic || "general"] });
    });
  });

  await ExamQuestion.deleteMany({});
  const inserted = await ExamQuestion.insertMany(allQuestions);
  console.log(`✅  Seeded ${inserted.length} questions across ${Object.keys(questionBankData).length} subjects.`);

  const breakdown = {};
  Object.keys(questionBankData).forEach((s) => { breakdown[s] = questionBankData[s].length; });
  console.table(breakdown);

  await mongoose.disconnect();
}

seed().catch((err) => { console.error("❌", err.message); process.exit(1); });
