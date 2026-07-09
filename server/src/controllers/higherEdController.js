const { generateJSON, generateText } = require("../services/geminiService");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

// ── University Recommendations ─────────────────────────────────────────────
const getUniversityRecommendations = asyncHandler(async (req, res) => {
  const { exam, score, country, budget, fieldOfStudy, degreeLevel } = req.body;

  if (!exam || !fieldOfStudy) {
    throw new AppError("Exam and field of study are required", 400);
  }

  const prompt = `You are an expert higher-education counselor. Based on the student's profile, recommend 8 universities/colleges they should target.

Student Profile:
- Exam: ${exam}
- Score/Rank: ${score || "Not specified"}
- Preferred Country: ${country || "Any"}
- Budget: ${budget || "Not specified"}
- Field of Study: ${fieldOfStudy}
- Degree Level: ${degreeLevel || "Masters"}

Return a JSON object with this exact structure:
{
  "recommendations": [
    {
      "name": "University Name",
      "location": "City, Country",
      "ranking": "Approximate global/national ranking",
      "category": "Dream | Target | Safe",
      "tuitionRange": "Annual tuition range in USD or INR",
      "acceptanceRate": "Approximate acceptance rate",
      "strengths": ["strength1", "strength2", "strength3"],
      "programs": ["Relevant program/department name"],
      "scholarships": ["Available scholarship name or type"],
      "deadline": "Typical application deadline month",
      "tip": "One specific admission tip for this university"
    }
  ],
  "advice": "2-3 sentences of personalized advice based on the student's profile"
}

Rules:
- Include 2-3 Dream (stretch), 3-4 Target (good fit), 1-2 Safe (likely admit) universities
- Use real, well-known universities appropriate for the exam and field
- Be specific about programs, not generic
- Include actual scholarship names when possible
- Tuition should be realistic 2025-2026 figures`;

  const result = await generateJSON(prompt, { temperature: 0.5, maxTokens: 4096 });
  res.json({ success: true, data: result });
});

// ── Scholarship Recommendations ────────────────────────────────────────────
const getScholarshipRecommendations = asyncHandler(async (req, res) => {
  const { exam, nationality, fieldOfStudy, degreeLevel, financialNeed, meritLevel } = req.body;

  if (!fieldOfStudy) {
    throw new AppError("Field of study is required", 400);
  }

  const prompt = `You are a scholarship advisor. Find and recommend 10 real scholarships that match this student's profile.

Student Profile:
- Exam Taken: ${exam || "Not specified"}
- Nationality: ${nationality || "Indian"}
- Field of Study: ${fieldOfStudy}
- Degree Level: ${degreeLevel || "Masters"}
- Financial Need: ${financialNeed || "Moderate"}
- Academic Merit: ${meritLevel || "Good"}

Return a JSON object with this exact structure:
{
  "scholarships": [
    {
      "name": "Scholarship Name",
      "provider": "Organization/University providing it",
      "amount": "Scholarship amount or coverage (e.g., Full tuition, $10,000/year, 50% tuition waiver)",
      "type": "Merit | Need | Country-specific | Field-specific | Government | University",
      "eligibility": ["criterion 1", "criterion 2"],
      "deadline": "Application deadline (month/year or Rolling)",
      "country": "Country where this applies",
      "url": "Official website URL",
      "difficulty": "High | Medium | Low",
      "tip": "One specific tip to increase chances"
    }
  ],
  "strategy": "3-4 sentences of personalized scholarship strategy advice"
}

Rules:
- Only include REAL, currently active scholarships (not fictional)
- Include a mix of types: government, university-specific, organization-funded
- Sort by relevance to the student's profile
- Include both fully-funded and partial scholarships
- URLs should be real official scholarship pages
- Be specific about eligibility criteria`;

  const result = await generateJSON(prompt, { temperature: 0.4, maxTokens: 4096 });
  res.json({ success: true, data: result });
});

// ── SOP Generator ──────────────────────────────────────────────────────────
const generateSOP = asyncHandler(async (req, res) => {
  const {
    university, program, degreeLevel, fieldOfStudy,
    academicBackground, workExperience, achievements,
    whyThisField, whyThisUniversity, careerGoals,
    wordLimit
  } = req.body;

  if (!university || !program || !fieldOfStudy) {
    throw new AppError("University, program, and field of study are required", 400);
  }

  const prompt = `You are an expert admissions consultant who has helped students get into top universities worldwide. Write a compelling, authentic Statement of Purpose (SOP) based on the following details.

Application Details:
- University: ${university}
- Program: ${program}
- Degree Level: ${degreeLevel || "Masters"}
- Field of Study: ${fieldOfStudy}

Student Background:
- Academic Background: ${academicBackground || "Not specified"}
- Work Experience: ${workExperience || "None"}
- Key Achievements: ${achievements || "Not specified"}

Motivation:
- Why this field: ${whyThisField || "Not specified"}
- Why this university: ${whyThisUniversity || "Not specified"}
- Career Goals: ${careerGoals || "Not specified"}

Word Limit: ${wordLimit || 800} words

Return a JSON object with this exact structure:
{
  "sop": "The complete Statement of Purpose text with proper paragraphs separated by \\n\\n",
  "wordCount": 800,
  "structure": [
    { "section": "Opening Hook", "summary": "Brief description of what this paragraph covers" },
    { "section": "Academic Journey", "summary": "Brief description" },
    { "section": "Professional Experience", "summary": "Brief description" },
    { "section": "Why This Field", "summary": "Brief description" },
    { "section": "Why This University", "summary": "Brief description" },
    { "section": "Career Goals & Closing", "summary": "Brief description" }
  ],
  "tips": [
    "Specific improvement tip 1",
    "Specific improvement tip 2",
    "Specific improvement tip 3"
  ]
}

Rules:
- Write naturally, not formulaic — avoid clichés like "Since childhood I was fascinated..."
- Be specific and personal — use the student's actual details
- Show intellectual maturity and self-awareness
- Connect past experiences to future goals logically
- Mention specific professors, labs, or programs at the university when relevant
- Keep within the word limit
- Use a confident but humble tone
- Each paragraph should have a clear purpose`;

  const result = await generateJSON(prompt, { temperature: 0.7, maxTokens: 6000 });
  res.json({ success: true, data: result });
});

module.exports = {
  getUniversityRecommendations,
  getScholarshipRecommendations,
  generateSOP,
};
