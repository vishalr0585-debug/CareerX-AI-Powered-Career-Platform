const { validationResult } = require("express-validator");
const User = require("../models/User");
const Activity = require("../models/Activity");
const Resume = require("../models/Resume");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const fs = require("fs");
const path = require("path");
const { generateJSON } = require("../services/geminiService");

// ──────────────────────────────────────
// GET /api/users/profile
// ──────────────────────────────────────
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  res.json({
    success: true,
    data: { user },
  });
});

// ──────────────────────────────────────
// PUT /api/users/profile
// ──────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const allowedFields = [
    "fullName",
    "jobTitle",
    "location",
    "bio",
    "phone",
    "avatar",
    "skills",
    "socialLinks",
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  // Recalculate profile completion
  user.calculateProfileCompletion();
  await user.save();

  // Log activity if major update
  if (Object.keys(updates).length > 0) {
    await Activity.create({
      user: user._id,
      action: "Updated profile",
      type: "general",
      xpEarned: 5,
    });
    user.totalXP += 5;
    await user.save();
  }

  res.json({
    success: true,
    message: "Profile updated successfully.",
    data: { user },
  });
});

// ──────────────────────────────────────
// PATCH /api/users/role
// ──────────────────────────────────────
exports.updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role || !["job_seeker", "higher_studies"].includes(role)) {
    throw new AppError("Invalid role. Must be 'job_seeker' or 'higher_studies'", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) throw new AppError("User not found", 404);

  // Log activity
  await Activity.create({
    user: user._id,
    action: `Changed career path to ${role === "job_seeker" ? "Job Seeker" : "Higher Studies"}`,
    type: "general",
    xpEarned: 2,
  });
  user.totalXP += 2;
  await user.save();

  res.json({
    success: true,
    message: "Career path updated successfully.",
    data: { user },
  });
});

// ──────────────────────────────────────
// GET /api/users/stats
// ──────────────────────────────────────
exports.getStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Get rank (position among all users by XP)
  const rank = await User.countDocuments({ totalXP: { $gt: user.totalXP } });

  const stats = {
    activeScore: user.activeScore,
    problemsSolved: user.problemsSolved,
    globalRank: rank + 1,
    jobsApplied: user.jobsApplied,
    totalXP: user.totalXP,
    loginStreak: user.loginStreak,
    longestStreak: user.longestStreak,
    interviewsCompleted: user.interviewsCompleted,
    resumesCreated: user.resumesCreated,
    profileCompletion: user.profileCompletion,
    membershipTier: user.membershipTier,
  };

  res.json({
    success: true,
    data: { stats },
  });
});

// ──────────────────────────────────────
// GET /api/users/activity/recent
// ──────────────────────────────────────
exports.getRecentActivity = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const activities = await Activity.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Activity.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    data: {
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// ──────────────────────────────────────
// GET /api/users/activity/heatmap
// ──────────────────────────────────────
exports.getActivityHeatmap = asyncHandler(async (req, res) => {
  // Get activity counts per day for the last ~52 weeks
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const pipeline = [
    {
      $match: {
        user: req.user._id,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
        xp: { $sum: "$xpEarned" },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const heatmapData = await Activity.aggregate(pipeline);

  // Convert to a map { "2026-01-15": { count: 3, xp: 30 } }
  const heatmap = {};
  heatmapData.forEach((d) => {
    heatmap[d._id] = { count: d.count, xp: d.xp };
  });

  res.json({
    success: true,
    data: { heatmap },
  });
});

// ──────────────────────────────────────
// GET /api/users/xp-history
// ──────────────────────────────────────
exports.getXPHistory = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const pipeline = [
    {
      $match: {
        user: req.user._id,
        createdAt: { $gte: startDate },
        xpEarned: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalXP: { $sum: "$xpEarned" },
        activities: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ];

  const monthlyXP = await Activity.aggregate(pipeline);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const formatted = monthlyXP.map((m) => ({
    month: monthNames[m._id.month - 1],
    year: m._id.year,
    xp: m.totalXP,
    activities: m.activities,
  }));

  res.json({
    success: true,
    data: { xpHistory: formatted },
  });
});

// ──────────────────────────────────────
// GET /api/users/skill-distribution
// ──────────────────────────────────────
exports.getSkillDistribution = asyncHandler(async (req, res) => {
  // Aggregate activity types to build skill distribution
  const pipeline = [
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        xp: { $sum: "$xpEarned" },
      },
    },
  ];

  const distribution = await Activity.aggregate(pipeline);

  const skillMap = {
    coding: "DSA & Coding",
    resume: "Resume & Writing",
    interview: "Interview Prep",
    job: "Job Applications",
    exam: "Exam Preparation",
    project: "Projects",
    general: "General",
  };

  const skills = distribution.map((d) => ({
    name: skillMap[d._id] || d._id,
    value: d.count,
    xp: d.xp,
  }));

  res.json({
    success: true,
    data: { skills },
  });
});

// ──────────────────────────────────────
// GET /api/users/achievements
// ──────────────────────────────────────
exports.getAchievements = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Define achievement rules
  const achievementDefs = [
    {
      id: "early_bird",
      title: "Early Bird",
      description: "Create your account",
      icon: "🌅",
      earned: true, // Always true if they have an account
    },
    {
      id: "streak_3",
      title: "On Fire",
      description: "Maintain a 3-day login streak",
      icon: "🔥",
      earned: user.longestStreak >= 3,
    },
    {
      id: "streak_7",
      title: "Consistent",
      description: "Maintain a 7-day login streak",
      icon: "⚡",
      earned: user.longestStreak >= 7,
    },
    {
      id: "streak_30",
      title: "Unstoppable",
      description: "Maintain a 30-day login streak",
      icon: "💎",
      earned: user.longestStreak >= 30,
    },
    {
      id: "problems_10",
      title: "Problem Solver",
      description: "Solve 10 coding problems",
      icon: "🧩",
      earned: user.problemsSolved >= 10,
    },
    {
      id: "problems_50",
      title: "Code Warrior",
      description: "Solve 50 coding problems",
      icon: "⚔️",
      earned: user.problemsSolved >= 50,
    },
    {
      id: "problems_100",
      title: "Algorithm Master",
      description: "Solve 100 coding problems",
      icon: "🏆",
      earned: user.problemsSolved >= 100,
    },
    {
      id: "interview_1",
      title: "Interview Ready",
      description: "Complete your first mock interview",
      icon: "🎤",
      earned: user.interviewsCompleted >= 1,
    },
    {
      id: "interview_10",
      title: "Interview Pro",
      description: "Complete 10 mock interviews",
      icon: "🎯",
      earned: user.interviewsCompleted >= 10,
    },
    {
      id: "resume_1",
      title: "Resume Builder",
      description: "Create your first resume",
      icon: "📄",
      earned: user.resumesCreated >= 1,
    },
    {
      id: "job_5",
      title: "Job Hunter",
      description: "Apply to 5 jobs",
      icon: "🔍",
      earned: user.jobsApplied >= 5,
    },
    {
      id: "profile_100",
      title: "Complete Profile",
      description: "Reach 100% profile completion",
      icon: "✅",
      earned: user.profileCompletion >= 100,
    },
    {
      id: "xp_1000",
      title: "XP Milestone",
      description: "Earn 1000 XP",
      icon: "⭐",
      earned: user.totalXP >= 1000,
    },
  ];

  res.json({
    success: true,
    data: {
      achievements: achievementDefs,
      earned: achievementDefs.filter((a) => a.earned).length,
      total: achievementDefs.length,
    },
  });
});

// ──────────────────────────────────────
// POST /api/users/avatar — Upload avatar image
// ──────────────────────────────────────
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Please upload an image file", 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  // Delete old avatar if it exists and is a local file
  if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
    const oldPath = path.join(__dirname, "../../", user.avatar);
    fs.unlink(oldPath, () => { });
  }

  // Set new avatar URL (relative path served as static)
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  user.avatar = avatarUrl;
  user.calculateProfileCompletion();
  await user.save();

  await Activity.create({
    user: user._id,
    action: "Updated profile picture",
    type: "general",
    xpEarned: 5,
  });

  res.json({
    success: true,
    message: "Avatar uploaded successfully.",
    data: { avatar: avatarUrl, user },
  });
});

// ──────────────────────────────────────
// POST /api/users/profile-resume — Upload resume to profile
// ──────────────────────────────────────
exports.uploadProfileResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Please upload a resume file (PDF, DOC, DOCX, or TXT)", 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  // Delete old profile resume if exists
  if (user.profileResume?.filePath) {
    const oldPath = path.join(__dirname, "../../", user.profileResume.filePath);
    fs.unlink(oldPath, () => { });
  }

  const resumePath = `/uploads/profile-resumes/${req.file.filename}`;
  user.profileResume = {
    fileName: req.file.originalname,
    filePath: resumePath,
    uploadedAt: new Date(),
  };
  await user.save();

  await Activity.create({
    user: user._id,
    action: "Uploaded resume to profile",
    type: "resume",
    xpEarned: 10,
  });
  user.totalXP += 10;
  await user.save();

  res.json({
    success: true,
    message: "Resume uploaded to profile successfully.",
    data: { profileResume: user.profileResume, user },
  });
});

// ──────────────────────────────────────
// DELETE /api/users/profile-resume — Remove resume from profile
// ──────────────────────────────────────
exports.deleteProfileResume = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  if (user.profileResume?.filePath) {
    const oldPath = path.join(__dirname, "../../", user.profileResume.filePath);
    fs.unlink(oldPath, () => { });
  }

  user.profileResume = { fileName: "", filePath: "", uploadedAt: null };
  await user.save();

  res.json({
    success: true,
    message: "Resume removed from profile.",
    data: { user },
  });
});

// ──────────────────────────────────────
// GET /api/users/ai-job-suggestions — AI job suggestions based on skills/resume
// ──────────────────────────────────────
exports.getAIJobSuggestions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  const skills = [...(user.skills || [])];
  const jobTitle = user.jobTitle || "";
  const bio = user.bio || "";
  const location = user.location || "";

  // Try to get resume text from uploaded profile resume
  let resumeText = "";
  if (user.profileResume?.filePath) {
    try {
      const fullPath = path.join(__dirname, "../../", user.profileResume.filePath);
      const ext = path.extname(fullPath).toLowerCase();
      if (ext === ".txt") {
        resumeText = fs.readFileSync(fullPath, "utf-8");
      } else if (ext === ".pdf") {
        const pdfParse = require("pdf-parse");
        const buffer = fs.readFileSync(fullPath);
        const data = await pdfParse(buffer);
        resumeText = data.text;
      }
    } catch {
      // Ignore file read errors
    }
  }

  // Also try getting skills from the latest Resume model entry
  if (!resumeText && skills.length === 0) {
    const latestResume = await Resume.findOne({ user: user._id }).sort("-updatedAt");
    if (latestResume) {
      const resumeSkills = (latestResume.skills || []).flatMap((s) => s.items || []);
      skills.push(...resumeSkills);
    }
  }

  if (skills.length === 0 && !resumeText && !jobTitle) {
    return res.json({
      success: true,
      data: {
        suggestions: [],
        message: "Add skills, a job title, or upload a resume to get AI-powered job suggestions.",
      },
    });
  }

  const userContext = [
    jobTitle ? `Current/Target Role: ${jobTitle}` : "",
    skills.length > 0 ? `Skills: ${skills.join(", ")}` : "",
    location ? `Location: ${location}` : "",
    bio ? `Bio: ${bio}` : "",
    resumeText ? `Resume excerpt: ${resumeText.slice(0, 1500)}` : "",
  ].filter(Boolean).join("\n");

  try {
    const result = await generateJSON(`You are an expert career advisor and job market analyst. Based on the following candidate profile, suggest 6 highly relevant job roles they should target.

=== CANDIDATE PROFILE ===
${userContext}
=== END PROFILE ===

For each suggestion, provide:
1. A specific, real-world job title (not generic)
2. Why this role matches their profile
3. Key skills they already have that apply
4. 1-2 skills they should learn to be more competitive
5. Estimated salary range in INR (LPA) or USD
6. Companies that commonly hire for this role in India

Return this exact JSON:
{
  "suggestions": [
    {
      "title": "Job title",
      "company_examples": ["Company1", "Company2", "Company3"],
      "match_reason": "Why this is a great fit (1-2 sentences)",
      "matching_skills": ["skill1", "skill2"],
      "skills_to_learn": ["skill1", "skill2"],
      "salary_range": "8-15 LPA",
      "demand_level": "high|medium|low",
      "search_query": "search query to find these jobs"
    }
  ],
  "career_summary": "1-2 sentence summary of the candidate's career direction and strongest areas"
}`, { maxTokens: 4096, temperature: 0.5 });

    await Activity.create({
      user: user._id,
      action: "Got AI job suggestions",
      type: "job",
      xpEarned: 5,
    });
    user.totalXP += 5;
    user.activeScore += 2;
    await user.save();

    res.json({
      success: true,
      data: {
        suggestions: result.suggestions || [],
        careerSummary: result.career_summary || "",
      },
    });
  } catch (err) {
    console.error("[AI Job Suggestions] Error:", err.message);

    // Fallback: generate basic suggestions from skills
    const fallbackSuggestions = [];
    const skillLower = skills.map((s) => s.toLowerCase());

    if (skillLower.some((s) => ["react", "next.js", "nextjs", "vue", "angular", "frontend"].includes(s))) {
      fallbackSuggestions.push({
        title: "Frontend Developer",
        company_examples: ["Flipkart", "Swiggy", "Razorpay"],
        match_reason: "Your frontend skills align well with this role.",
        matching_skills: skills.filter((s) => ["React", "Next.js", "Vue", "Angular", "JavaScript", "TypeScript", "CSS", "HTML"].map(sk => sk.toLowerCase()).includes(s.toLowerCase())),
        skills_to_learn: ["Testing (Jest/Cypress)", "Performance Optimization"],
        salary_range: "6-18 LPA",
        demand_level: "high",
        search_query: "frontend developer react",
      });
    }
    if (skillLower.some((s) => ["node.js", "nodejs", "express", "python", "django", "java", "spring", "backend"].includes(s))) {
      fallbackSuggestions.push({
        title: "Backend Developer",
        company_examples: ["Zoho", "Freshworks", "Infosys"],
        match_reason: "Your backend skills make you a strong candidate.",
        matching_skills: skills.filter((s) => ["Node.js", "Express", "Python", "Java", "MongoDB", "PostgreSQL", "SQL"].map(sk => sk.toLowerCase()).includes(s.toLowerCase())),
        skills_to_learn: ["System Design", "Cloud Services (AWS/GCP)"],
        salary_range: "8-20 LPA",
        demand_level: "high",
        search_query: "backend developer nodejs python",
      });
    }
    if (skillLower.some((s) => ["react", "node.js", "nodejs", "fullstack", "full stack", "full-stack", "mern"].includes(s))) {
      fallbackSuggestions.push({
        title: "Full Stack Developer",
        company_examples: ["TCS", "Wipro", "Startups"],
        match_reason: "Your combination of frontend and backend skills fits this role.",
        matching_skills: skills.slice(0, 5),
        skills_to_learn: ["DevOps/CI-CD", "Cloud Deployment"],
        salary_range: "8-22 LPA",
        demand_level: "high",
        search_query: "full stack developer",
      });
    }

    if (fallbackSuggestions.length === 0) {
      fallbackSuggestions.push({
        title: jobTitle || "Software Developer",
        company_examples: ["TCS", "Infosys", "Wipro", "HCL"],
        match_reason: "Based on your profile, this is a good starting point.",
        matching_skills: skills.slice(0, 4),
        skills_to_learn: ["DSA", "System Design"],
        salary_range: "5-15 LPA",
        demand_level: "high",
        search_query: (jobTitle || "software developer") + " " + (location || "India"),
      });
    }

    res.json({
      success: true,
      data: {
        suggestions: fallbackSuggestions,
        careerSummary: `Based on your skills in ${skills.slice(0, 3).join(", ") || "your area"}, you're well-positioned for several tech roles.`,
      },
    });
  }
});
