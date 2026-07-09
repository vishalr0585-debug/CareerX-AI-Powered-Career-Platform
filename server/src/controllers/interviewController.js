const { InterviewQuestion, InterviewSession } = require("../models/Interview");
const Activity = require("../models/Activity");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const { generateJSON } = require("../services/geminiService");

// Bank of interview questions — expanded for variety
const questionBank = {
  behavioral: [
    { q: "Tell me about yourself.", tips: ["Keep it 2 mins", "Focus on career highlights", "End with why this role"] },
    { q: "Describe a challenging project you worked on.", tips: ["Use STAR method", "Focus on your contributions", "Mention the outcome"] },
    { q: "How do you handle conflict with a teammate?", tips: ["Show empathy", "Focus on resolution", "Give a real example"] },
    { q: "Tell me about a time you failed.", tips: ["Be honest", "Focus on learning", "Show growth"] },
    { q: "Why do you want to work here?", tips: ["Research the company", "Align with your goals", "Show enthusiasm"] },
    { q: "Where do you see yourself in 5 years?", tips: ["Show ambition", "Align with role", "Be realistic"] },
    { q: "How do you prioritize tasks when everything seems urgent?", tips: ["Mention frameworks", "Give examples", "Show flexibility"] },
    { q: "Tell me about a time you showed leadership.", tips: ["Don't need 'leader' title", "Show initiative", "Quantify impact"] },
    { q: "Describe a situation where you had to learn something new quickly.", tips: ["Show adaptability", "Mention resources used", "Highlight the result"] },
    { q: "Tell me about a time you disagreed with your manager.", tips: ["Stay professional", "Focus on outcome", "Show diplomatic skills"] },
    { q: "How do you handle working under pressure or tight deadlines?", tips: ["Give a concrete example", "Show composure", "Mention time management"] },
    { q: "Describe a time you went above and beyond.", tips: ["Quantify impact", "Show initiative", "Explain motivation"] },
    { q: "Tell me about a time you received critical feedback.", tips: ["Show openness", "Describe action taken", "Highlight improvement"] },
    { q: "How do you handle ambiguity or unclear requirements?", tips: ["Ask questions", "Make assumptions explicit", "Show structured thinking"] },
    { q: "Describe a situation where you had to influence someone without authority.", tips: ["Use persuasion", "Show empathy", "Focus on data/results"] },
    { q: "Tell me about your most impactful contribution to a team.", tips: ["Quantify results", "Show collaboration", "Highlight unique value"] },
    { q: "How do you stay motivated during repetitive or tedious tasks?", tips: ["Show discipline", "Mention personal techniques", "Connect to bigger picture"] },
    { q: "Describe a time you had to make a decision with incomplete information.", tips: ["Show analytical thinking", "Mention risk mitigation", "Highlight outcome"] },
  ],
  technical: [
    { q: "Explain the difference between REST and GraphQL.", tips: ["Compare strengths/weaknesses", "When to use each", "Give examples"] },
    { q: "What is the event loop in JavaScript?", tips: ["Explain call stack", "Mention microtasks/macrotasks", "Give code example"] },
    { q: "Explain database indexing and when to use it.", tips: ["B-tree indexes", "Performance tradeoffs", "Composite indexes"] },
    { q: "What are the SOLID principles?", tips: ["Name all five", "Give examples for each", "Explain benefits"] },
    { q: "Explain the difference between SQL and NoSQL databases.", tips: ["Use cases", "Scalability", "ACID vs BASE"] },
    { q: "What is a closure in JavaScript?", tips: ["Lexical scoping", "Practical uses", "Memory considerations"] },
    { q: "Explain how HTTPS works.", tips: ["TLS handshake", "Certificates", "Encryption types"] },
    { q: "What is the difference between process and thread?", tips: ["Memory sharing", "Context switching", "Use cases"] },
    { q: "Explain the concept of caching and its strategies.", tips: ["LRU, LFU, FIFO", "Cache invalidation", "Redis, CDN"] },
    { q: "What are microservices and how do they differ from monoliths?", tips: ["Scalability", "Deployment", "Communication patterns"] },
    { q: "Explain the CAP theorem.", tips: ["Consistency, Availability, Partition tolerance", "Which two to pick", "Real-world examples"] },
    { q: "What is the difference between TCP and UDP?", tips: ["Reliability vs speed", "Use cases", "Handshake process"] },
    { q: "Explain OAuth 2.0 flow.", tips: ["Authorization code grant", "Access vs refresh tokens", "Security considerations"] },
    { q: "What is a race condition and how do you prevent it?", tips: ["Concurrent access", "Locks/mutexes", "Atomic operations"] },
    { q: "Explain the difference between horizontal and vertical scaling.", tips: ["Cost implications", "When to use each", "Load balancing"] },
    { q: "What is Docker and why is it useful?", tips: ["Containerization vs VMs", "Dockerfile basics", "Docker Compose"] },
    { q: "Explain how garbage collection works in Java or JavaScript.", tips: ["Mark and sweep", "Reference counting", "Memory leaks"] },
    { q: "What is the difference between authentication and authorization?", tips: ["JWT, sessions", "RBAC, ABAC", "Real-world examples"] },
    { q: "How does a load balancer work?", tips: ["Round robin, least connections", "Health checks", "Layer 4 vs Layer 7"] },
    { q: "Explain the concept of eventual consistency.", tips: ["Distributed systems", "Trade-offs", "Use cases like social media feeds"] },
  ],
  "system-design": [
    { q: "Design a URL shortener like bit.ly.", tips: ["Hash generation", "Database choice", "Analytics", "Scale considerations"] },
    { q: "Design a chat application like WhatsApp.", tips: ["WebSockets", "Message queues", "Read receipts", "E2E encryption"] },
    { q: "Design a news feed system like Facebook.", tips: ["Fan-out approaches", "Caching", "Ranking algorithm"] },
    { q: "Design a rate limiter.", tips: ["Token bucket", "Sliding window", "Distributed systems"] },
    { q: "Design an e-commerce platform.", tips: ["Microservices", "Payment flow", "Inventory management", "Search"] },
    { q: "Design a video streaming service like YouTube.", tips: ["CDN", "Transcoding", "Recommendation engine", "Storage"] },
    { q: "Design a ride-sharing service like Uber.", tips: ["Location tracking", "Matching algorithm", "Surge pricing", "ETA calculation"] },
    { q: "Design a search autocomplete system.", tips: ["Trie data structure", "Ranking by popularity", "Caching"] },
    { q: "Design a notification system.", tips: ["Push, email, SMS channels", "Priority queues", "Rate limiting", "User preferences"] },
    { q: "Design a distributed cache like Redis.", tips: ["Eviction policies", "Replication", "Consistent hashing"] },
    { q: "Design a file storage system like Google Drive.", tips: ["Chunking", "Deduplication", "Sync conflicts", "Permissions"] },
    { q: "Design a metrics and monitoring system.", tips: ["Time-series DB", "Alerting", "Dashboards", "Data retention"] },
    { q: "Design a social media platform's follower/following system.", tips: ["Graph structure", "Fan-out on write vs read", "Celebrity accounts"] },
    { q: "Design a job scheduling system like cron at scale.", tips: ["Priority queues", "Failure handling", "Idempotency", "Distributed locking"] },
  ],
  hr: [
    { q: "What are your salary expectations?", tips: ["Research market rates", "Give a range", "Show flexibility"] },
    { q: "Why are you leaving your current job?", tips: ["Stay positive", "Focus on growth", "Don't badmouth"] },
    { q: "What is your biggest strength?", tips: ["Be specific", "Give examples", "Relate to the role"] },
    { q: "What is your biggest weakness?", tips: ["Be genuine", "Show self-awareness", "Mention improvement steps"] },
    { q: "Do you have any questions for us?", tips: ["Ask about team culture", "Ask about growth", "Show genuine interest"] },
    { q: "Tell me about a gap in your resume.", tips: ["Be honest", "Highlight what you learned", "Stay positive"] },
    { q: "How would your previous colleagues describe you?", tips: ["Be authentic", "Mention 2-3 traits", "Give examples"] },
    { q: "What do you know about our company?", tips: ["Research beforehand", "Mention recent news", "Align with values"] },
    { q: "How do you handle work-life balance?", tips: ["Show flexibility", "Mention boundaries", "Be realistic"] },
    { q: "What motivates you at work?", tips: ["Be specific", "Connect to role", "Avoid generic answers"] },
    { q: "Describe your ideal work environment.", tips: ["Be honest but flexible", "Connect to company culture", "Mention collaboration"] },
    { q: "How do you deal with repetitive work?", tips: ["Show reliability", "Mention personal strategies", "Connect to the bigger picture"] },
    { q: "Why should we hire you over other candidates?", tips: ["Unique value proposition", "Match with job requirements", "Quantify impact"] },
    { q: "What are your long-term career goals?", tips: ["Be realistic", "Show ambition", "Connect to company growth"] },
  ],
};

// ──────────────────────────────────────
// POST /api/interviews/start — Start a session
// ──────────────────────────────────────
exports.startSession = asyncHandler(async (req, res) => {
  const { type = "mixed", difficulty = "medium", role = "Software Engineer", company, questionCount = 5 } = req.body;

  let questions = [];

  // Try AI-generated questions first
  try {
    const companyContext = company ? ` at ${company}` : "";
    const aiQuestions = await generateJSON(`Generate ${questionCount} interview questions for a ${role}${companyContext} position.

Category: ${type === "mixed" ? "mix of behavioral, technical, system-design, and HR" : type}
Difficulty: ${difficulty}

Return a JSON array of objects with these fields:
[
  {
    "question": "the interview question",
    "category": "behavioral|technical|system-design|hr",
    "tips": ["3-4 tips for answering this question well"]
  }
]

Make questions specific to the ${role} role${company ? ` and ${company}'s culture/tech stack` : ""}. Include industry-relevant scenarios.`, { maxTokens: 3000 });

    const aiQs = Array.isArray(aiQuestions) ? aiQuestions : [];
    questions = aiQs.slice(0, questionCount).map((q) => ({
      question: q.question,
      category: q.category || type,
      tips: q.tips || [],
      userAnswer: "",
      feedback: "",
      score: 0,
    }));
  } catch (err) {
    console.error("[Interview AI] Question generation failed, using bank:", err.message);
  }

  // Fallback to static question bank if AI fails
  if (questions.length === 0) {
    let pool = [];
    if (type === "mixed") {
      Object.values(questionBank).forEach((cats) => pool.push(...cats));
    } else {
      pool = questionBank[type] || questionBank.technical;
    }
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, pool.length));
    questions = selected.map((q) => ({
      question: q.q,
      category: type === "mixed"
        ? Object.entries(questionBank).find(([, qs]) => qs.includes(q))?.[0] || "technical"
        : type,
      userAnswer: "",
      feedback: "",
      score: 0,
    }));
  }

  const session = await InterviewSession.create({
    user: req.user._id,
    type,
    difficulty,
    role,
    company: company || "",
    questions,
    totalQuestions: questions.length,
  });

  // Return questions without scores/feedback
  const safeQuestions = session.questions.map((q, i) => ({
    index: i,
    question: q.question,
    category: q.category,
  }));

  res.status(201).json({
    success: true,
    data: {
      sessionId: session._id,
      type: session.type,
      difficulty: session.difficulty,
      role: session.role,
      totalQuestions: session.totalQuestions,
      questions: safeQuestions,
    },
  });
});

// ──────────────────────────────────────
// POST /api/interviews/:sessionId/answer — Submit an answer
// ──────────────────────────────────────
exports.submitAnswer = asyncHandler(async (req, res) => {
  const { questionIndex, answer } = req.body;

  const session = await InterviewSession.findOne({
    _id: req.params.sessionId,
    user: req.user._id,
    status: "in-progress",
  });
  if (!session) throw new AppError("Session not found or already completed", 404);

  if (questionIndex < 0 || questionIndex >= session.questions.length) {
    throw new AppError("Invalid question index", 400);
  }

  const question = session.questions[questionIndex];
  question.userAnswer = answer;
  question.answeredAt = new Date();

  // AI-powered answer evaluation
  let score = 0;
  let feedback = "";

  try {
    const evaluation = await generateJSON(`You are an experienced interview coach. Evaluate this interview answer.

Question: "${question.question}"
Category: ${question.category}
Candidate's Answer: "${answer}"

Provide a JSON response:
{
  "score": <number 1-10, be fair but rigorous. 1-3=poor, 4-5=needs improvement, 6-7=good, 8-9=excellent, 10=perfect>,
  "feedback": "<2-4 sentences of specific, actionable feedback. Reference the actual answer content. Mention what was done well and what could be improved. Suggest the STAR method if applicable.>"
}`, { maxTokens: 500 });

    score = Math.min(10, Math.max(1, evaluation.score || 5));
    feedback = evaluation.feedback || "Good attempt. Try to add more specific examples.";
  } catch (err) {
    console.error("[Interview AI] Evaluation failed, using fallback:", err.message);
    // Fallback scoring
    const wordCount = answer.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 10) score += 2;
    if (wordCount >= 30) score += 2;
    if (wordCount >= 60) score += 1;
    if (wordCount >= 100) score += 1;
    if (/example|instance|situation|project/i.test(answer)) score += 1;
    if (/result|outcome|impact|achieved|improved/i.test(answer)) score += 1;
    if (/because|therefore|approach|strategy/i.test(answer)) score += 1;
    if (/team|collaborate|communicate/i.test(answer)) score += 1;
    score = Math.min(score, 10);

    if (score >= 8) feedback = "Excellent answer! Well-structured with specific examples and clear outcomes.";
    else if (score >= 6) feedback = "Good answer. Consider adding more specific examples or quantifiable results.";
    else if (score >= 4) feedback = "Decent start. Try using the STAR method for more impact.";
    else feedback = "Try to elaborate more. Include specific examples, your role, and the outcome.";
  }

  question.score = score;
  question.feedback = feedback;

  session.answeredQuestions += 1;
  await session.save();

  res.json({
    success: true,
    data: {
      score: question.score,
      feedback: question.feedback,
      answeredQuestions: session.answeredQuestions,
      totalQuestions: session.totalQuestions,
    },
  });
});

// ──────────────────────────────────────
// POST /api/interviews/:sessionId/complete — End session
// ──────────────────────────────────────
exports.completeSession = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    _id: req.params.sessionId,
    user: req.user._id,
  });
  if (!session) throw new AppError("Session not found", 404);

  // Calculate average score
  const answeredQs = session.questions.filter((q) => q.userAnswer);
  const avgScore = answeredQs.length > 0
    ? Math.round((answeredQs.reduce((sum, q) => sum + q.score, 0) / answeredQs.length) * 10) / 10
    : 0;

  session.averageScore = avgScore;
  session.status = "completed";
  session.duration = Math.round((Date.now() - session.createdAt.getTime()) / 1000);

  // Overall feedback — AI-powered personalized session summary
  let strengths = [];
  let improvements = [];
  let overallFeedback = "";

  try {
    const qaSummary = answeredQs
      .map((q, i) => `Q${i + 1}: "${q.question}"\nAnswer: "${q.userAnswer}"\nScore: ${q.score}/10`)
      .join("\n\n");

    const sessionSummary = await generateJSON(`You are an interview coach. Analyze this mock interview session and provide a personalized summary.

Role: ${session.role}
Type: ${session.type}
Average Score: ${avgScore}/10

Questions & Answers:
${qaSummary}

Provide a JSON response:
{
  "strengths": ["3-5 specific things the candidate did well, referencing their actual answers"],
  "improvements": ["3-5 specific areas to improve, with actionable advice"],
  "overallFeedback": "A 2-3 sentence personalized summary of their performance with encouragement and next steps"
}`, { maxTokens: 1500 });

    strengths = sessionSummary.strengths || [];
    improvements = sessionSummary.improvements || [];
    overallFeedback = sessionSummary.overallFeedback || "";
  } catch (err) {
    console.error("[Interview AI] Session summary failed, using fallback:", err.message);
    if (avgScore >= 7) strengths.push("Strong, detailed responses");
    if (answeredQs.some((q) => q.score >= 8)) strengths.push("Excellent use of examples");
    if (session.answeredQuestions === session.totalQuestions) strengths.push("Answered all questions");
    if (avgScore < 5) improvements.push("Use the STAR method for behavioral questions");
    if (answeredQs.some((q) => q.score < 4)) improvements.push("Elaborate more on some answers");
    if (session.answeredQuestions < session.totalQuestions) improvements.push("Try to attempt all questions");
    overallFeedback = avgScore >= 7
      ? "Great performance! You demonstrated strong communication skills."
      : avgScore >= 5
      ? "Good effort. Focus on providing more specific examples and outcomes."
      : "Keep practicing. Try recording yourself and use the STAR method.";
  }

  session.strengths = strengths;
  session.improvements = improvements;
  session.overallFeedback = overallFeedback;

  // XP
  const xp = Math.round(avgScore * 5) + (session.answeredQuestions * 3);
  session.xpEarned = xp;
  await session.save();

  // Activity & User update
  await Activity.create({
    user: req.user._id,
    action: `Completed mock interview (${avgScore}/10 avg)`,
    type: "interview",
    xpEarned: xp,
  });
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalXP: xp, activeScore: 10, "stats.interviewsCompleted": 1 },
  });

  res.json({
    success: true,
    data: {
      averageScore: avgScore,
      answeredQuestions: session.answeredQuestions,
      totalQuestions: session.totalQuestions,
      duration: session.duration,
      overallFeedback: session.overallFeedback,
      strengths: session.strengths,
      improvements: session.improvements,
      xpEarned: xp,
      questions: session.questions,
    },
  });
});

// ──────────────────────────────────────
// GET /api/interviews/history — Past sessions
// ──────────────────────────────────────
exports.getHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const total = await InterviewSession.countDocuments({ user: req.user._id, status: "completed" });
  const sessions = await InterviewSession.find({ user: req.user._id, status: "completed" })
    .select("type difficulty role company averageScore totalQuestions answeredQuestions duration xpEarned createdAt")
    .sort("-createdAt")
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: { sessions, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

// ──────────────────────────────────────
// GET /api/interviews/:sessionId — Get session details
// ──────────────────────────────────────
exports.getSession = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    _id: req.params.sessionId,
    user: req.user._id,
  });
  if (!session) throw new AppError("Session not found", 404);

  res.json({ success: true, data: { session } });
});
