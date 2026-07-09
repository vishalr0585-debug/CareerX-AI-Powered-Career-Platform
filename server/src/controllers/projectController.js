const Project = require("../models/Project");
const Activity = require("../models/Activity");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const { generateJSON } = require("../services/geminiService");

// ──────────────────────────────────────
// GET /api/projects/github-search — Search GitHub repos
// ──────────────────────────────────────
exports.searchGitHub = asyncHandler(async (req, res) => {
  const { q, sort = "stars", order = "desc", page = 1, per_page = 12 } = req.query;
  if (!q) throw new AppError("Search query (q) is required", 400);

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&page=${page}&per_page=${per_page}`;

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "CareerX-App",
  };
  // Use token if available for higher rate limits (30 req/min vs 10)
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errBody = await response.text();
    console.error("[GitHub API]", response.status, errBody);
    throw new AppError(
      response.status === 403
        ? "GitHub API rate limit reached. Please try again in a minute."
        : "Failed to search GitHub repositories",
      response.status === 403 ? 429 : 502
    );
  }

  const data = await response.json();

  const repos = (data.items || []).map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description || "",
    url: r.html_url,
    homepage: r.homepage || "",
    stars: r.stargazers_count,
    forks: r.forks_count,
    watchers: r.watchers_count,
    openIssues: r.open_issues_count,
    language: r.language || "Unknown",
    topics: r.topics || [],
    owner: {
      login: r.owner.login,
      avatar: r.owner.avatar_url,
      url: r.owner.html_url,
    },
    license: r.license?.spdx_id || null,
    updatedAt: r.updated_at,
    createdAt: r.created_at,
  }));

  res.json({
    success: true,
    data: {
      repos,
      totalCount: Math.min(data.total_count || 0, 1000), // GitHub caps at 1000
      page: parseInt(page),
      perPage: parseInt(per_page),
    },
  });
});

// Built-in project idea templates
const projectTemplates = {
  web: [
    { title: "Portfolio Website", description: "Build a personal portfolio showcasing your projects, skills, and experience with a modern design.", technologies: ["React", "Tailwind CSS", "Framer Motion"], difficulty: "beginner", features: ["Responsive design", "Dark/Light mode", "Project gallery", "Contact form", "Smooth animations"], steps: [{ title: "Set up React project with Tailwind" }, { title: "Create header and navigation" }, { title: "Build hero section" }, { title: "Design project gallery/cards" }, { title: "Add skills section" }, { title: "Create contact form" }, { title: "Add animations with Framer Motion" }, { title: "Deploy to Vercel" }] },
    { title: "E-Commerce Store", description: "Full-stack e-commerce application with product listing, cart, checkout, and order management.", technologies: ["Next.js", "Node.js", "MongoDB", "Stripe"], difficulty: "intermediate", features: ["Product catalog", "Shopping cart", "User authentication", "Payment processing", "Order tracking", "Admin dashboard"], steps: [{ title: "Set up Next.js + Express backend" }, { title: "Design product schema & seed data" }, { title: "Build product listing page" }, { title: "Implement shopping cart (Zustand)" }, { title: "Add user authentication" }, { title: "Integrate Stripe checkout" }, { title: "Build order management" }, { title: "Create admin dashboard" }, { title: "Deploy to production" }] },
    { title: "Real-time Chat Application", description: "Build a real-time messaging app with WebSocket support, rooms, typing indicators, and message history.", technologies: ["React", "Socket.io", "Node.js", "MongoDB"], difficulty: "intermediate", features: ["Real-time messaging", "Chat rooms", "Typing indicators", "Message history", "Online status", "File sharing"], steps: [{ title: "Set up Express + Socket.io server" }, { title: "Design message & room schemas" }, { title: "Build chat UI components" }, { title: "Implement WebSocket events" }, { title: "Add room creation & joining" }, { title: "Add typing indicators" }, { title: "Implement message history" }, { title: "Add file upload support" }] },
  ],
  api: [
    { title: "RESTful Blog API", description: "Build a complete REST API for a blog platform with CRUD operations, authentication, and pagination.", technologies: ["Node.js", "Express", "MongoDB", "JWT"], difficulty: "beginner", features: ["User registration/login", "CRUD posts", "Comments system", "Tag-based search", "Pagination", "Rate limiting"], steps: [{ title: "Set up Express project structure" }, { title: "Create User model & auth routes" }, { title: "Build Post CRUD endpoints" }, { title: "Add comment system" }, { title: "Implement search & pagination" }, { title: "Add rate limiting & validation" }, { title: "Write API documentation" }, { title: "Deploy to Railway/Render" }] },
  ],
  ml: [
    { title: "Sentiment Analyzer", description: "Build a sentiment analysis tool that classifies text as positive, negative, or neutral using NLP.", technologies: ["Python", "Flask", "scikit-learn", "NLTK"], difficulty: "intermediate", features: ["Text classification", "REST API endpoint", "Batch analysis", "Confidence scores", "Multiple languages"], steps: [{ title: "Set up Python environment" }, { title: "Preprocess text data (NLTK)" }, { title: "Train classification model" }, { title: "Build Flask API" }, { title: "Create simple frontend" }, { title: "Add batch processing" }, { title: "Evaluate model accuracy" }, { title: "Deploy with Docker" }] },
  ],
  cli: [
    { title: "Task Manager CLI", description: "A command-line task manager with categories, priorities, deadlines, and persistent storage.", technologies: ["Node.js", "Commander.js", "Chalk"], difficulty: "beginner", features: ["Add/edit/delete tasks", "Priority levels", "Categories", "Deadline tracking", "Status updates", "Export to JSON"], steps: [{ title: "Set up Node.js CLI project" }, { title: "Add Commander.js commands" }, { title: "Implement file-based storage" }, { title: "Add task CRUD operations" }, { title: "Add priority & category filters" }, { title: "Implement deadline tracking" }, { title: "Add colorful output (Chalk)" }, { title: "Publish to npm" }] },
  ],
};

// ──────────────────────────────────────
// GET /api/projects — List user projects
// ──────────────────────────────────────
exports.getProjects = asyncHandler(async (req, res) => {
  const { category, status, page = 1, limit = 10 } = req.query;
  const filter = { user: req.user._id };
  if (category) filter.category = category;
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Project.countDocuments(filter);

  const projects = await Project.find(filter)
    .sort("-updatedAt")
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: {
      projects,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ──────────────────────────────────────
// POST /api/projects — Create project
// ──────────────────────────────────────
exports.createProject = asyncHandler(async (req, res) => {
  const { title, description, category, difficulty, technologies, features, steps } = req.body;

  if (!title) throw new AppError("Project title is required", 400);

  const project = await Project.create({
    user: req.user._id,
    title,
    description: description || "",
    category: category || "web",
    difficulty: difficulty || "beginner",
    technologies: technologies || [],
    features: features || [],
    steps: (steps || []).map((s) => ({
      title: typeof s === "string" ? s : s.title,
      completed: false,
    })),
    progress: 0,
    status: "planning",
  });

  await Activity.create({
    user: req.user._id,
    action: `Started project: "${title}"`,
    type: "project",
    xpEarned: 10,
    metadata: { project: project._id },
  });
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalXP: 10, activeScore: 5 },
  });

  res.status(201).json({ success: true, data: { project } });
});

// ──────────────────────────────────────
// GET /api/projects/:id — Get project details
// ──────────────────────────────────────
exports.getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!project) throw new AppError("Project not found", 404);

  res.json({ success: true, data: { project } });
});

// ──────────────────────────────────────
// PUT /api/projects/:id — Update project
// ──────────────────────────────────────
exports.updateProject = asyncHandler(async (req, res) => {
  const allowed = ["title", "description", "category", "difficulty", "technologies", "features", "steps", "status", "githubUrl", "liveUrl"];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );
  if (!project) throw new AppError("Project not found", 404);

  // Recalculate progress
  if (project.steps && project.steps.length > 0) {
    const completed = project.steps.filter((s) => s.completed).length;
    project.progress = Math.round((completed / project.steps.length) * 100);
    if (project.progress === 100 && project.status !== "completed") {
      project.status = "completed";
    }
    await project.save();
  }

  res.json({ success: true, data: { project } });
});

// ──────────────────────────────────────
// PUT /api/projects/:id/steps/:stepIndex — Toggle step completion
// ──────────────────────────────────────
exports.toggleStep = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!project) throw new AppError("Project not found", 404);

  const stepIndex = parseInt(req.params.stepIndex);
  if (stepIndex < 0 || stepIndex >= project.steps.length) {
    throw new AppError("Invalid step index", 400);
  }

  // Toggle completion
  project.steps[stepIndex].completed = !project.steps[stepIndex].completed;
  if (project.steps[stepIndex].completed) {
    project.steps[stepIndex].completedAt = new Date();
  } else {
    project.steps[stepIndex].completedAt = undefined;
  }

  // Recalculate progress
  const completed = project.steps.filter((s) => s.completed).length;
  project.progress = Math.round((completed / project.steps.length) * 100);

  // XP for completing a step
  if (project.steps[stepIndex].completed) {
    const xp = 5;
    await Activity.create({
      user: req.user._id,
      action: `Completed step in "${project.title}"`,
      type: "project",
      xpEarned: xp,
    });
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalXP: xp, activeScore: 3 },
    });
  }

  // Check if all steps complete
  if (project.progress === 100 && project.status !== "completed") {
    project.status = "completed";
    const xp = 50;
    project.xpEarned = (project.xpEarned || 0) + xp;
    await Activity.create({
      user: req.user._id,
      action: `Completed project: "${project.title}" 🎉`,
      type: "project",
      xpEarned: xp,
    });
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalXP: xp, activeScore: 20 },
    });
  }

  await project.save();
  res.json({ success: true, data: { project } });
});

// ──────────────────────────────────────
// DELETE /api/projects/:id — Delete project
// ──────────────────────────────────────
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!project) throw new AppError("Project not found", 404);

  res.json({ success: true, message: "Project deleted" });
});

// ──────────────────────────────────────
// POST /api/projects/generate — AI project idea generator
// ──────────────────────────────────────
exports.generateProject = asyncHandler(async (req, res) => {
  const { prompt = "", difficulty } = req.body;

  // Parse category from prompt text
  const p = prompt.toLowerCase();
  let category = "web";
  if (p.includes("machine learning") || p.includes("nlp") || p.includes("ml") || p.includes("ai model") || p.includes("sentiment") || p.includes("tensorflow") || p.includes("pytorch")) category = "ml";
  else if (p.includes("cli") || p.includes("command line") || p.includes("terminal") || p.includes("task manager cli")) category = "cli";
  else if (p.includes("api") || p.includes("rest") || p.includes("backend") || p.includes("graphql")) category = "api";
  else if (p.includes("mobile") || p.includes("react native") || p.includes("flutter") || p.includes("android") || p.includes("ios")) category = "mobile";

  let projectData;

  try {
    projectData = await generateJSON(`You are a senior software architect. Generate a complete project idea with starter code based on this prompt:

"${prompt}"

Difficulty: ${difficulty || "intermediate"}
Category: ${category}

Return a JSON object with this EXACT structure:
{
  "title": "Project Name (concise, professional)",
  "description": "2-3 sentence description of what the project does and its value",
  "category": "${category}",
  "difficulty": "${difficulty || 'intermediate'}",
  "technologies": ["Tech1", "Tech2", "Tech3", "Tech4"],
  "features": ["Feature 1 — brief description", "Feature 2 — brief description", "Feature 3", "Feature 4", "Feature 5"],
  "steps": [
    {"title": "Step 1: Setup & Initialization"},
    {"title": "Step 2: Core Structure"},
    {"title": "Step 3: Main Feature Implementation"},
    {"title": "Step 4: Secondary Features"},
    {"title": "Step 5: Styling & UI"},
    {"title": "Step 6: Testing & Polish"},
    {"title": "Step 7: Deployment"}
  ],
  "files": [
    {"name": "package.json", "type": "json", "content": "...actual package.json content..."},
    {"name": "index.js", "type": "js", "content": "...actual starter code with comments..."},
    {"name": "README.md", "type": "md", "content": "...project readme with setup instructions..."}
  ]
}

IMPORTANT:
- "files" must contain 3-5 real starter code files with ACTUAL working code (not placeholders)
- Each file's "content" must be complete, runnable code with good comments
- The code should be a solid starting point that the developer can build upon
- Include a proper README.md with project description, setup instructions, and features list
- Technologies should be relevant to the prompt`, { maxTokens: 6000, temperature: 0.7 });
  } catch (err) {
    console.error("[Project AI] Generation failed, using template:", err.message);
    // Fallback to template-based generation
    const templates = projectTemplates[category] || projectTemplates.web;
    let filtered = templates;
    if (difficulty) {
      filtered = templates.filter((t) => t.difficulty === difficulty);
      if (filtered.length === 0) filtered = templates;
    }
    const template = filtered[Math.floor(Math.random() * filtered.length)];
    projectData = {
      ...template,
      files: [
        { name: "README.md", type: "md", content: `# ${template.title}\n\n${template.description}\n\n## Tech Stack\n${template.technologies.map(t => `- ${t}`).join("\n")}\n\n## Features\n${template.features.map(f => `- ${f}`).join("\n")}\n\n## Getting Started\n\n1. Clone this repository\n2. Install dependencies: \`npm install\`\n3. Start development server: \`npm run dev\`\n\n## Steps\n${template.steps.map((s, i) => `${i + 1}. ${s.title}`).join("\n")}` },
        { name: "package.json", type: "json", content: JSON.stringify({ name: template.title.toLowerCase().replace(/\s+/g, "-"), version: "1.0.0", description: template.description, scripts: { dev: "node index.js", start: "node index.js" }, dependencies: {} }, null, 2) },
        { name: "index.js", type: "js", content: `// ${template.title}\n// ${template.description}\n\nconsole.log("${template.title} - Starting...");\n\n// TODO: Implement your project here\n// Technologies: ${template.technologies.join(", ")}\n` },
      ],
    };
  }

  // Create project in DB
  const project = await Project.create({
    user: req.user._id,
    title: projectData.title || "Generated Project",
    description: projectData.description || "",
    category,
    difficulty: projectData.difficulty || difficulty || "intermediate",
    technologies: projectData.technologies || [],
    features: projectData.features || [],
    steps: (projectData.steps || []).map((s) => ({
      title: typeof s === "string" ? s : s.title,
      completed: false,
    })),
    progress: 0,
    status: "planning",
    aiGenerated: true,
  });

  await Activity.create({
    user: req.user._id,
    action: `Generated AI project: "${projectData.title}"`,
    type: "project",
    xpEarned: 5,
  });
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalXP: 5, activeScore: 2 },
  });

  // Return project + files (files aren't stored in DB, they're for immediate display)
  res.status(201).json({
    success: true,
    data: {
      project: {
        ...project.toObject(),
        files: projectData.files || [],
        techStack: projectData.technologies || [],
      },
    },
  });
});

// ──────────────────────────────────────
// GET /api/projects/templates — Get project templates
// ──────────────────────────────────────
exports.getTemplates = asyncHandler(async (req, res) => {
  const { category } = req.query;

  if (category && projectTemplates[category]) {
    return res.json({
      success: true,
      data: { templates: projectTemplates[category], category },
    });
  }

  res.json({
    success: true,
    data: {
      categories: Object.keys(projectTemplates),
      templates: projectTemplates,
    },
  });
});
