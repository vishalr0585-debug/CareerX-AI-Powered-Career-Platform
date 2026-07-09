const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "Untitled Resume",
      maxlength: 200,
    },
    template: {
      type: String,
      enum: ["modern", "classic", "minimal", "creative", "professional"],
      default: "modern",
    },

    // Personal info
    personalInfo: {
      fullName: String,
      email: String,
      phone: String,
      location: String,
      website: String,
      linkedin: String,
      github: String,
      summary: String,
    },

    // Sections
    experience: [
      {
        company: String,
        position: String,
        location: String,
        startDate: String,
        endDate: String,
        current: { type: Boolean, default: false },
        description: String,
        highlights: [String],
      },
    ],

    education: [
      {
        institution: String,
        degree: String,
        field: String,
        startDate: String,
        endDate: String,
        gpa: String,
        highlights: [String],
      },
    ],

    skills: [
      {
        category: String,
        items: [String],
      },
    ],

    projects: [
      {
        name: String,
        description: String,
        technologies: [String],
        link: String,
        github: String,
        highlights: [String],
      },
    ],

    certifications: [
      {
        name: String,
        issuer: String,
        date: String,
        link: String,
      },
    ],

    // ATS Analysis
    atsScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    atsAnalysis: {
      keywordMatch: { type: Number, default: 0 },
      formatting: { type: Number, default: 0 },
      sections: { type: Number, default: 0 },
      readability: { type: Number, default: 0 },
      suggestions: [String],
      keywords: {
        found: [String],
        missing: [String],
      },
    },

    // Status
    isPublic: { type: Boolean, default: false },
    lastEdited: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resumeSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("Resume", resumeSchema);
