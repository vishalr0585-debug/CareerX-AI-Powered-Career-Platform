const { generateJSON } = require("../services/geminiService");
const { asyncHandler } = require("../middleware/errorHandler");

const generateRoadmap = asyncHandler(async (req, res) => {
  const { goal } = req.body;

  if (!goal || !goal.trim()) {
    return res.status(400).json({ success: false, message: "Goal is required" });
  }

  const prompt = `Create a comprehensive, practical learning roadmap for someone who wants to master: "${goal.trim()}"

Return ONLY a valid JSON object — no markdown fences, no extra text. Use this exact structure:
{
  "title": "Short descriptive title (e.g. Frontend Developer Roadmap)",
  "emoji": "one relevant emoji",
  "description": "2-sentence overview of this domain and what the learner will be able to do",
  "totalDuration": "X–Y months",
  "phases": [
    {
      "phase": "Phase name (e.g. Foundations, Core Skills, Advanced Topics, Job Ready)",
      "duration": "X weeks",
      "color": "blue",
      "steps": [
        {
          "title": "Specific topic or skill to learn",
          "description": "1-2 sentences: what this is and why it matters in 2026",
          "skills": ["skill1", "skill2", "skill3", "skill4"],
          "resources": [
            { "name": "Resource display name", "type": "Course" }
          ],
          "duration": "1–2 weeks",
          "level": "beginner"
        }
      ]
    }
  ]
}

Rules:
- Exactly 4 phases
- Each phase has 3–4 steps
- Use real, well-known resource names (YouTube channels, official docs, Coursera, freeCodeCamp, MDN, roadmap.sh, GitHub repos, books, etc.)
- Do NOT include any URL fields — names only
- Resource types must be one of: "Course", "Video", "Documentation", "Practice", "Book", "Article", "Community"
- Phase colors must be one of: "blue", "purple", "orange", "green", "teal", "red"
- Level values: "beginner", "intermediate", "advanced"
- Skills array: 3–5 items
- Resources array: 2–3 items per step
- Make the roadmap practical, specific, and actionable for someone starting in 2026`;

  const roadmap = await generateJSON(prompt, { maxRetries: 2 });

  if (!roadmap || !roadmap.phases || !Array.isArray(roadmap.phases)) {
    return res.status(500).json({ success: false, message: "Failed to generate a valid roadmap. Try again." });
  }

  res.json({ success: true, data: roadmap });
});

module.exports = { generateRoadmap };
