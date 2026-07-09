const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");

// ──────────────────────────────────────
// GET /api/dashboard/summary
// ──────────────────────────────────────
exports.getDashboardSummary = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Get rank
  const rank = await User.countDocuments({ totalXP: { $gt: user.totalXP } });

  // Get recent activities
  const Activity = require("../models/Activity");
  const recentActivities = await Activity.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(5);

  // Weekly activity (last 7 days)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const weeklyPipeline = [
    {
      $match: {
        user: req.user._id,
        createdAt: { $gte: weekStart },
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: "$createdAt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const weeklyData = await Activity.aggregate(weeklyPipeline);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyActivity = dayNames.map((name, i) => {
    const dayData = weeklyData.find((d) => d._id === i + 1);
    return { day: name, count: dayData?.count || 0 };
  });

  // Monthly progress (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyPipeline = [
    {
      $match: {
        user: req.user._id,
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          type: "$type",
        },
        count: { $sum: 1 },
      },
    },
  ];

  const monthlyData = await Activity.aggregate(monthlyPipeline);

  // Weekly stats — count activities from the last 7 days
  const problemsSolvedThisWeek = await Activity.countDocuments({
    user: req.user._id,
    type: { $in: ["coding", "problem"] },
    createdAt: { $gte: weekStart },
  });
  const jobsAppliedThisWeek = await Activity.countDocuments({
    user: req.user._id,
    type: "job",
    createdAt: { $gte: weekStart },
  });

  const summary = {
    // Stat cards
    stats: {
      activeScore: user.activeScore,
      problemsSolved: user.problemsSolved,
      globalRank: rank + 1,
      jobsApplied: user.jobsApplied,
      problemsSolvedThisWeek,
      jobsAppliedThisWeek,
    },

    // User info
    user: {
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      initials: user.initials,
      jobTitle: user.jobTitle,
      membershipTier: user.membershipTier,
      totalXP: user.totalXP,
      loginStreak: user.loginStreak,
      profileCompletion: user.profileCompletion,
    },

    // Charts
    weeklyActivity,
    monthlyProgress: monthlyData,

    // Feed
    recentActivities: recentActivities.map((a) => ({
      id: a._id,
      action: a.action,
      type: a.type,
      xpEarned: a.xpEarned,
      time: a.createdAt,
    })),
  };

  res.json({
    success: true,
    data: summary,
  });
});

// ──────────────────────────────────────
// GET /api/leaderboard
// ──────────────────────────────────────
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const period = req.query.period || "overall"; // overall | weekly | monthly

  let sortField = "totalXP";
  let dateFilter = {};

  // For weekly/monthly, we'd need to aggregate from activities
  // For now, sort by totalXP as the primary metric
  if (period === "weekly") {
    // Could use a separate weekly XP field in the future
    sortField = "activeScore";
  }

  const users = await User.find({})
    .select("fullName avatar jobTitle totalXP activeScore loginStreak")
    .sort({ [sortField]: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await User.countDocuments();

  const leaderboard = users.map((u, i) => ({
    rank: (page - 1) * limit + i + 1,
    user: {
      id: u._id,
      fullName: u.fullName,
      avatar: u.avatar,
      initials: u.initials,
      jobTitle: u.jobTitle,
    },
    xp: u.totalXP,
    streak: u.loginStreak,
    score: u.activeScore,
  }));

  // Get current user's rank
  const currentUserRank =
    (await User.countDocuments({
      [sortField]: { $gt: req.user[sortField] },
    })) + 1;

  res.json({
    success: true,
    data: {
      leaderboard,
      myRank: currentUserRank,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});
