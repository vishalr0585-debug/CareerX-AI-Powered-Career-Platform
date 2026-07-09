const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be under 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't include password in queries by default
    },
    avatar: {
      type: String,
      default: "",
    },
    // Profile resume (uploaded PDF/DOC for public visibility)
    profileResume: {
      fileName: { type: String, default: "" },
      filePath: { type: String, default: "" },
      uploadedAt: { type: Date },
    },
    jobTitle: {
      type: String,
      default: "",
      maxlength: 100,
    },
    location: {
      type: String,
      default: "",
      maxlength: 100,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    phone: {
      type: String,
      default: "",
    },
    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      website: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    skills: [{ type: String, trim: true }],

    // Role - job_seeker or higher_studies
    role: {
      type: String,
      enum: ["job_seeker", "higher_studies"],
      default: "job_seeker",
    },

    // Auth
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    providerId: { type: String, default: "" },
    isEmailVerified: { type: Boolean, default: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshToken: { type: String, select: false },

    // Membership
    membershipTier: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },

    // Gamification
    totalXP: { type: Number, default: 0 },
    activeScore: { type: Number, default: 0 },
    globalRank: { type: Number, default: 0 },
    loginStreak: { type: Number, default: 0 },
    lastLoginDate: { type: Date },
    longestStreak: { type: Number, default: 0 },

    // Profile completion
    profileCompletion: { type: Number, default: 10, min: 0, max: 100 },

    // Stats
    problemsSolved: { type: Number, default: 0 },
    interviewsCompleted: { type: Number, default: 0 },
    resumesCreated: { type: Number, default: 0 },
    jobsApplied: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate profile completion
userSchema.methods.calculateProfileCompletion = function () {
  let score = 10; // base for having an account
  if (this.fullName) score += 10;
  if (this.avatar) score += 10;
  if (this.jobTitle) score += 10;
  if (this.location) score += 10;
  if (this.bio) score += 10;
  if (this.phone) score += 5;
  if (this.socialLinks?.github) score += 10;
  if (this.socialLinks?.linkedin) score += 10;
  if (this.socialLinks?.website) score += 5;
  if (this.skills?.length > 0) score += 10;
  this.profileCompletion = Math.min(score, 100);
  return this.profileCompletion;
};

// Get initials
userSchema.virtual("initials").get(function () {
  if (!this.fullName) return "??";
  return this.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
});

// Index for leaderboard
userSchema.index({ totalXP: -1 });
userSchema.index({ activeScore: -1 });

const User = mongoose.model("User", userSchema);
module.exports = User;
