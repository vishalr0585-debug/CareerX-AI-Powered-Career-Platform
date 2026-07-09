const { ChatMessage, ChatSession } = require("../models/Chat");
const Activity = require("../models/Activity");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const { chat: geminiChat } = require("../services/geminiService");

// AI-powered response engine using Gemini
const generateAIResponse = async (message, topic, sessionId, userId) => {
  try {
    // Fetch previous messages for context (last 20)
    const previousMessages = await ChatMessage.find({
      sessionId,
      user: userId,
    })
      .sort("-createdAt")
      .limit(20)
      .lean();

    // Convert to Gemini format (reverse to chronological)
    // Filter: Gemini requires first message to be role 'user', so drop leading assistant messages
    const allMessages = previousMessages
      .reverse()
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    // Drop messages until we find a 'user' message first
    let startIdx = 0;
    while (startIdx < allMessages.length && allMessages[startIdx].role === "model") {
      startIdx++;
    }
    const history = allMessages.slice(startIdx);

    const systemInstruction = `You are CareerX AI, a professional career preparation assistant. You specialize in:
- Resume writing and optimization (ATS-friendly formatting, action verbs, quantifiable achievements)
- Interview preparation (behavioral STAR method, technical interviews, system design)
- Data Structures & Algorithms (study plans, problem-solving patterns, complexity analysis)
- Career advice (job search strategies, salary negotiation, networking, career transitions)
- Coding concepts and best practices

Guidelines:
- Give specific, actionable advice with examples
- Use markdown formatting (bold, bullets, headers) for readability
- Be encouraging but honest
- When discussing technical topics, provide code examples when relevant
- Keep responses focused and concise (200-400 words unless more detail is needed)
- Reference specific tools, frameworks, and real-world practices
- If the user's question is unclear, ask for clarification`;

    const content = await geminiChat(history, message, systemInstruction);
    return { content, topic: topic || "general" };
  } catch (err) {
    console.error("[Chat AI] Gemini failed, using fallback:", err.message);
    return generateFallbackResponse(message, topic);
  }
};

// Smart fallback responses — keyword-matched, context-aware (used when AI is unavailable)
const generateFallbackResponse = (message, topic) => {
  const lowerMsg = message.toLowerCase();

  // Detect category from message content
  let category = topic || "general";
  if (/resume|cv|cover\s*letter|ats|applicant/i.test(lowerMsg)) category = "resume";
  else if (/interview|behavioral|star\s*method|hr\s*round/i.test(lowerMsg)) category = "interview";
  else if (/dsa|algorithm|data\s*structure|leetcode|array|tree|graph|dynamic\s*prog|linked\s*list|sorting|binary\s*search|stack|queue|hash|heap|two\s*pointer|sliding\s*window|backtrack|recursion|big\s*o|time\s*complex|greedy|bfs|dfs|trie|knapsack/i.test(lowerMsg)) category = "dsa";
  else if (/salary|negotiat|offer|job\s*search|career|switch|transition|networking|linkedin/i.test(lowerMsg)) category = "career";
  else if (/react|node|python|java|javascript|typescript|api|rest|database|sql|mongo|docker|git|code|debug|framework|frontend|backend|fullstack|css|html/i.test(lowerMsg)) category = "tech";

  // Sub-topic detection for more specific responses
  const responses = {
    resume: {
      ats: "**ATS Optimization Tips:**\n\n1. **Use standard section headings** — \"Experience\", \"Education\", \"Skills\" (not creative alternatives)\n2. **Include exact keywords from the job posting** — ATS systems do literal keyword matching\n3. **Avoid tables, columns, headers/footers** — Most ATS parsers can't read them\n4. **Use a simple, clean format** — .docx or plain text works best\n5. **Put your name and contact info at the very top** — Not in a header\n6. **Spell out acronyms at least once** — e.g., \"Search Engine Optimization (SEO)\"\n\n💡 **Pro tip:** Paste your resume and the job description into our ATS Analyzer for a detailed score!",
      format: "**Resume Formatting Best Practices:**\n\n• **Length:** 1 page for <5 years experience, 2 pages max\n• **Font:** Professional fonts like Calibri, Arial, or Garamond (10-12pt)\n• **Margins:** 0.5-1 inch on all sides\n• **Section order:** Contact → Summary → Skills → Experience → Education → Projects\n• **Bullet points:** 3-5 per role, start each with a strong action verb\n• **Dates:** Use consistent format (e.g., \"Jan 2023 – Present\")\n• **White space:** Don't cram — readability matters\n\n❌ **Avoid:** Photos, graphics, colored backgrounds, fancy fonts, \"References available upon request\"",
      bullets: "**Writing Powerful Resume Bullets (XYZ Formula):**\n\n**Formula:** Accomplished [X] as measured by [Y] by doing [Z]\n\n**Examples:**\n• ❌ *\"Responsible for managing the database\"*\n• ✅ *\"Optimized PostgreSQL queries reducing API response time by 45%, serving 10K+ daily users\"*\n\n• ❌ *\"Worked on the frontend\"*\n• ✅ *\"Engineered responsive React dashboard with 15+ interactive components, improving user engagement by 30%\"*\n\n**Strong Action Verbs:** Engineered, Spearheaded, Architected, Orchestrated, Streamlined, Delivered, Automated, Mentored, Launched, Migrated\n\n💡 Always quantify: percentages, dollar amounts, user counts, time saved.",
      default: "**Resume Writing Essentials:**\n\n1. **Professional Summary:** 2-3 sentences highlighting years of experience, key skills, and career focus. No first person (\"I\").\n2. **Action Verbs:** Start every bullet with a strong verb — Built, Led, Designed, Improved, Architected\n3. **Quantify Impact:** \"Increased load speed by 40%\" beats \"Improved performance\"\n4. **Tailor for Each Role:** Mirror keywords from the job description\n5. **Skills Section:** Organized by category (Languages, Frameworks, Tools, Cloud)\n6. **Projects:** Include tech stack, problem solved, and measurable outcome\n\n**Quick Checklist:**\n✅ Email + Phone + LinkedIn\n✅ No typos or grammar errors\n✅ Consistent formatting throughout\n✅ PDF format for submission",
    },
    interview: {
      behavioral: "**Behavioral Interview Mastery (STAR Method):**\n\n**S** — **Situation:** Set the scene with context (1-2 sentences)\n**T** — **Task:** What was your specific responsibility?\n**A** — **Action:** What did YOU do? (be specific, use \"I\" not \"we\")\n**R** — **Result:** Quantifiable outcome + what you learned\n\n**Must-Prepare Stories:**\n1. 🏆 A time you **led** a team/project\n2. ⚡ A time you **solved a difficult problem**\n3. 💥 A time you **failed** and what you learned\n4. 🤝 A time you **resolved a conflict**\n5. 🚀 A time you went **above and beyond**\n6. ⏰ A time you worked under **tight deadlines**\n\n**Common Questions:** \"Tell me about yourself\", \"Why this company?\", \"What's your greatest weakness?\", \"Where do you see yourself in 5 years?\"",
      technical: "**Technical Interview Preparation:**\n\n**Coding Interviews:**\n1. Practice 100-150 LeetCode problems (Easy: 40%, Medium: 50%, Hard: 10%)\n2. Master these patterns: Two Pointers, Sliding Window, BFS/DFS, DP, Binary Search\n3. Always clarify requirements before coding\n4. Talk through your approach before writing code\n5. Test with edge cases (empty input, single element, large input)\n\n**System Design (for mid-senior roles):**\n• Start with requirements gathering → high-level design → detailed components\n• Know: Load balancers, CDNs, caching (Redis), message queues, databases (SQL vs NoSQL)\n• Practice: Design URL shortener, Twitter feed, chat system\n\n**Tips:** Think out loud, ask clarifying questions, discuss trade-offs, mention time/space complexity.",
      default: "**Interview Preparation Guide:**\n\n**Before the Interview:**\n• Research the company thoroughly (products, culture, recent news)\n• Review the job description and prepare examples for each requirement\n• Prepare 3-5 thoughtful questions to ask the interviewer\n• Test your setup (camera, mic, internet) for virtual interviews\n\n**During the Interview:**\n• Use the **STAR method** for behavioral questions\n• Think out loud during technical problems\n• It's OK to ask clarifying questions — interviewers want to see your thought process\n• Be concise — aim for 2-3 minute answers\n\n**After the Interview:**\n• Send a thank-you email within 24 hours\n• Reference something specific from your conversation\n\n🎯 Use our **Interview Lab** to practice with AI-powered mock interviews!",
    },
    dsa: {
      array: "**Arrays & Strings — Key Patterns:**\n\n**1. Two Pointers:**\n• Use when: sorted array, finding pairs, palindrome check\n• Example: Two Sum (sorted), Container With Most Water\n\n**2. Sliding Window:**\n• Use when: subarray/substring of size k, longest/shortest with condition\n• Example: Max sum subarray of size k, Longest substring without repeating\n\n**3. Prefix Sum:**\n• Use when: range sum queries, subarray sum equals k\n\n**4. Kadane's Algorithm:**\n• Max subarray sum in O(n)\n• `maxSum = Math.max(nums[i], maxSum + nums[i])`\n\n**Practice Problems:**\n1. Two Sum → Hash Map O(n)\n2. Best Time to Buy/Sell Stock\n3. Product of Array Except Self\n4. Maximum Subarray (Kadane's)\n5. Merge Intervals",
      tree: "**Trees & Graphs — Essential Concepts:**\n\n**Binary Tree Traversals:**\n• **Inorder** (Left-Root-Right): BST gives sorted order\n• **Preorder** (Root-Left-Right): Used to serialize/copy trees\n• **Postorder** (Left-Right-Root): Used to delete/evaluate\n• **Level-order** (BFS): Use a queue\n\n**Binary Search Tree (BST):**\n• Left < Root < Right\n• Search/Insert/Delete: O(log n) average, O(n) worst\n• Validate BST: Inorder traversal should be sorted\n\n**Graph Algorithms:**\n• **BFS:** Shortest path (unweighted), level-order traversal\n• **DFS:** Connected components, cycle detection, topological sort\n• **Dijkstra:** Shortest path (weighted, no negative edges)\n\n**Practice:** LCA of BST, Max depth, Validate BST, Number of Islands, Course Schedule",
      dp: "**Dynamic Programming — Framework:**\n\n**Steps to solve any DP problem:**\n1. **Define state:** What variables describe a subproblem?\n2. **Write recurrence:** How does the current state relate to smaller subproblems?\n3. **Identify base cases:** What are the smallest subproblems?\n4. **Choose direction:** Top-down (memoization) or Bottom-up (tabulation)\n5. **Optimize space** if possible\n\n**Classic DP Patterns:**\n• **1D DP:** Fibonacci, Climbing Stairs, House Robber\n• **2D DP:** Longest Common Subsequence, Edit Distance, Unique Paths\n• **Knapsack:** 0/1 Knapsack, Unbounded Knapsack, Coin Change\n• **Interval DP:** Matrix Chain, Burst Balloons\n• **String DP:** Longest Palindromic Substring, Word Break\n\n**Pro tip:** Start with the brute-force recursive solution, then add memoization. Don't jump to tabulation.",
      default: "**DSA Study Roadmap (8-10 weeks):**\n\n**Week 1-2: Foundations**\n• Arrays, Strings, Hash Maps\n• Two Pointers, Sliding Window\n• Time/Space Complexity analysis\n\n**Week 3-4: Linear Structures**\n• Linked Lists (reverse, merge, cycle detection)\n• Stacks & Queues (monotonic stack, BFS)\n• Recursion & Backtracking\n\n**Week 5-6: Trees & Graphs**\n• Binary Trees, BST, Heaps (Priority Queue)\n• Graph BFS/DFS, Topological Sort\n\n**Week 7-8: Advanced**\n• Dynamic Programming (1D → 2D → Knapsack)\n• Greedy Algorithms\n• Binary Search on answer\n\n**Week 9-10: Practice & Review**\n• Mock interviews, timed contests\n• Review weak topics\n\n📌 **Daily target:** 3-5 problems. Track patterns, not just solutions.\n🎯 Use our **Online Compiler** to practice coding problems!",
    },
    career: {
      default: "**Career Growth Tips:**\n\n**Job Search Strategy:**\n1. Update LinkedIn — Recruiters search by keywords, not job titles\n2. Apply to 5-10 tailored applications/day (quality > quantity)\n3. Network: 80% of jobs are filled through connections\n4. Build in public — blog, open source, portfolio projects\n\n**Salary Negotiation:**\n• Research market rates (Glassdoor, Levels.fyi, Blind)\n• Never give a number first — let the company make an offer\n• Negotiate total compensation (base + bonus + equity + benefits)\n• \"I'm excited about this role. Based on my research, I was expecting $X-$Y. Is there flexibility?\"\n\n**Career Switching:**\n• Build 2-3 strong portfolio projects in your target field\n• Take online courses for credibility (certificates from recognized platforms)\n• Leverage transferable skills from your current role\n• Start networking in target field communities",
    },
    tech: {
      default: "**Technical Learning Resources & Tips:**\n\n**Frontend:**\n• React: Component lifecycle, hooks, state management (Redux/Zustand)\n• CSS: Flexbox, Grid, responsive design, Tailwind CSS\n• Performance: Lazy loading, code splitting, memoization\n\n**Backend:**\n• Node.js + Express: RESTful APIs, middleware, error handling\n• Databases: SQL (PostgreSQL) vs NoSQL (MongoDB) — know trade-offs\n• Authentication: JWT, OAuth2, session management\n• Caching: Redis for performance-critical endpoints\n\n**DevOps Basics:**\n• Git: Branching strategies, rebase vs merge, pull requests\n• Docker: Containerization, Dockerfile, docker-compose\n• CI/CD: GitHub Actions, automated testing, deployment pipelines\n\n**Pro tip:** Build projects that solve real problems. A weather app is fine for learning, but a tool that automates something in your daily life stands out in interviews.",
    },
    general: {
      default: "I'm your **CareerX AI Assistant**! I can help with:\n\n🔹 **Resume & ATS** — Writing tips, formatting, keyword optimization\n🔹 **Interview Prep** — Behavioral (STAR), technical, system design\n🔹 **DSA & Coding** — Study plans, patterns, problem-solving strategies\n🔹 **Career Advice** — Job search, networking, salary negotiation\n🔹 **Technical Skills** — Frontend, backend, DevOps, system design\n\n**Quick commands you can try:**\n• \"How do I write a strong resume summary?\"\n• \"Explain the STAR method for interviews\"\n• \"Give me a DSA study plan\"\n• \"How to negotiate salary?\"\n• \"Explain Two Pointers technique\"\n\nWhat would you like help with?",
    },
  };

  // Pick sub-topic
  const categoryResponses = responses[category] || responses.general;
  let subTopic = "default";

  if (category === "resume") {
    if (/ats|keyword|scan|track|screen/i.test(lowerMsg)) subTopic = "ats";
    else if (/format|layout|template|font|margin|design/i.test(lowerMsg)) subTopic = "format";
    else if (/bullet|action\s*verb|xyz|achievement|impact/i.test(lowerMsg)) subTopic = "bullets";
  } else if (category === "interview") {
    if (/behavioral|star|tell\s*me|weakness|strength|conflict/i.test(lowerMsg)) subTopic = "behavioral";
    else if (/technical|coding|system\s*design|whiteboard|leetcode/i.test(lowerMsg)) subTopic = "technical";
  } else if (category === "dsa") {
    if (/array|string|two\s*pointer|sliding\s*window|subarray/i.test(lowerMsg)) subTopic = "array";
    else if (/tree|graph|bfs|dfs|binary\s*search\s*tree|bst|traversal/i.test(lowerMsg)) subTopic = "tree";
    else if (/dynamic\s*prog|dp|memoiz|tabul|knapsack|fibonacci/i.test(lowerMsg)) subTopic = "dp";
  }

  const content = categoryResponses[subTopic] || categoryResponses.default;
  return { content, topic: category };
};

// ──────────────────────────────────────
// GET /api/chat/sessions — List user's chat sessions
// ──────────────────────────────────────
exports.getSessions = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find({ user: req.user._id })
    .sort("-updatedAt")
    .limit(50);

  res.json({ success: true, data: { sessions } });
});

// ──────────────────────────────────────
// POST /api/chat/sessions — Create new session
// ──────────────────────────────────────
exports.createSession = asyncHandler(async (req, res) => {
  const { title = "New Chat", topic = "general" } = req.body;

  const session = await ChatSession.create({
    user: req.user._id,
    sessionId: uuidv4(),
    title,
    topic,
  });

  // Create system welcome message
  await ChatMessage.create({
    user: req.user._id,
    sessionId: session.sessionId,
    role: "assistant",
    content: `Welcome to CareerX AI Chat! I'm here to help with your career preparation. Ask me anything about resumes, interviews, DSA, career advice, and more.`,
  });

  session.messageCount = 1;
  await session.save();

  res.status(201).json({ success: true, data: { session } });
});

// ──────────────────────────────────────
// GET /api/chat/sessions/:sessionId — Get session messages
// ──────────────────────────────────────
exports.getMessages = asyncHandler(async (req, res) => {
  const session = await ChatSession.findOne({
    sessionId: req.params.sessionId,
    user: req.user._id,
  });
  if (!session) throw new AppError("Chat session not found", 404);

  const messages = await ChatMessage.find({
    sessionId: req.params.sessionId,
    user: req.user._id,
  }).sort("createdAt");

  res.json({ success: true, data: { session, messages } });
});

// ──────────────────────────────────────
// POST /api/chat/sessions/:sessionId/messages — Send message
// ──────────────────────────────────────
exports.sendMessage = asyncHandler(async (req, res) => {
  const message = req.body.message || req.body.content;
  if (!message) throw new AppError("Message is required", 400);

  const session = await ChatSession.findOne({
    sessionId: req.params.sessionId,
    user: req.user._id,
  });
  if (!session) throw new AppError("Chat session not found", 404);

  // Save user message
  const userMsg = await ChatMessage.create({
    user: req.user._id,
    sessionId: session.sessionId,
    role: "user",
    content: message,
  });

  // Generate AI response (Gemini-powered with conversation context)
  const aiResponse = await generateAIResponse(message, session.topic, session.sessionId, req.user._id);

  const assistantMsg = await ChatMessage.create({
    user: req.user._id,
    sessionId: session.sessionId,
    role: "assistant",
    content: aiResponse.content,
    metadata: { topic: aiResponse.topic },
  });

  // Update session
  session.messageCount += 2;
  session.lastMessage = message.substring(0, 100);
  if (!session.title || session.title === "New Chat") {
    session.title = message.substring(0, 50);
  }
  if (aiResponse.topic !== "general") {
    session.topic = aiResponse.topic;
  }
  await session.save();

  // XP every 5 messages
  if (session.messageCount % 5 === 0) {
    await Activity.create({
      user: req.user._id,
      action: `AI chat session — ${session.messageCount} messages`,
      type: "chat",
      xpEarned: 5,
    });
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalXP: 5, activeScore: 2 },
    });
  }

  res.json({
    success: true,
    data: {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    },
  });
});

// ──────────────────────────────────────
// DELETE /api/chat/sessions/:sessionId — Delete session
// ──────────────────────────────────────
exports.deleteSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.findOneAndDelete({
    sessionId: req.params.sessionId,
    user: req.user._id,
  });
  if (!session) throw new AppError("Chat session not found", 404);

  await ChatMessage.deleteMany({
    sessionId: req.params.sessionId,
    user: req.user._id,
  });

  res.json({ success: true, message: "Chat session deleted" });
});
