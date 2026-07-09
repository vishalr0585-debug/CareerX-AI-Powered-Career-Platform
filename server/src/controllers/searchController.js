const { asyncHandler } = require("../middleware/errorHandler");
const { Problem } = require("../models/Problem");
const { Job } = require("../models/Job");

// Helper to safely escape regex
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ──────────────────────────────────────
// GET /api/search?q=<query>&type=<all|problems|jobs>
// ──────────────────────────────────────
exports.search = asyncHandler(async (req, res) => {
  const { q = "", type = "all" } = req.query;

  if (!q.trim()) {
    return res.json({ success: true, data: { results: [], total: 0, query: "" } });
  }

  const regex = new RegExp(escapeRegex(q.trim()), "i");
  const results = [];

  // ── Problems ────────────────────────────────────────────────────────────
  if (type === "all" || type === "problems") {
    const problems = await Problem.find({
      $or: [{ title: regex }, { category: regex }, { tags: regex }],
    })
      .limit(5)
      .select("title difficulty category tags slug")
      .lean();

    problems.forEach((p) =>
      results.push({
        type: "problem",
        title: p.title,
        source: `${p.difficulty} · ${p.category}`,
        desc: `Tags: ${(p.tags || []).join(", ") || "None"}`,
        url: "/dashboard/compiler",
        difficulty: p.difficulty,
      })
    );
  }

  // ── Jobs ────────────────────────────────────────────────────────────────
  if (type === "all" || type === "jobs") {
    const jobs = await Job.find({
      isActive: true,
      $or: [{ title: regex }, { company: regex }, { skills: regex }],
    })
      .limit(5)
      .select("title company location type skills description")
      .lean();

    jobs.forEach((j) =>
      results.push({
        type: "job",
        title: j.title,
        source: `${j.company}${j.location ? " · " + j.location : ""}`,
        desc: j.description
          ? j.description.substring(0, 120) + (j.description.length > 120 ? "…" : "")
          : `Skills: ${(j.skills || []).slice(0, 4).join(", ")}`,
        url: "/dashboard/jobs",
        badge: j.type,
      })
    );
  }

  res.json({
    success: true,
    data: { results, total: results.length, query: q.trim() },
  });
});
