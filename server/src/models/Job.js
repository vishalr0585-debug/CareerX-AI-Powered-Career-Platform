const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    // Job details
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: "" },
    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "remote"],
      default: "full-time",
    },
    salary: {
      min: Number,
      max: Number,
      currency: { type: String, default: "INR" },
    },
    description: String,
    requirements: [String],
    skills: [String],
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "lead"],
      default: "entry",
    },
    applyUrl: String,
    source: { type: String, default: "manual" },

    // Metadata
    postedAt: { type: Date, default: Date.now },
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", company: "text", skills: "text" });
jobSchema.index({ isActive: 1, postedAt: -1 });

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    status: {
      type: String,
      enum: ["saved", "applied", "interviewing", "offered", "rejected", "withdrawn"],
      default: "saved",
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
    coverLetter: String,
    notes: String,
    appliedAt: Date,
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

applicationSchema.index({ user: 1, job: 1 }, { unique: true });
applicationSchema.index({ user: 1, status: 1 });

const Job = mongoose.model("Job", jobSchema);
const Application = mongoose.model("Application", applicationSchema);

module.exports = { Job, Application };
