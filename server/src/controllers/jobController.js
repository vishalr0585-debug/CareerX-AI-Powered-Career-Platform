const { Job, Application } = require("../models/Job");
const Activity = require("../models/Activity");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../middleware/errorHandler");

// ──────────────────────────────────────
// GET /api/jobs/search-external — Search external job platforms
// ──────────────────────────────────────
exports.searchExternal = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) throw new AppError("Search query (q) is required", 400);

  const query = encodeURIComponent(q);

  // Build direct search URLs for major job platforms
  const platforms = [
    {
      name: "LinkedIn Jobs",
      icon: "linkedin",
      color: "#0A66C2",
      url: `https://www.linkedin.com/jobs/search/?keywords=${query}`,
      description: "Professional network with millions of job listings worldwide",
    },
    {
      name: "Indeed",
      icon: "indeed",
      color: "#2164F3",
      url: `https://www.indeed.com/jobs?q=${query}`,
      description: "World's largest job search engine with company reviews",
    },
    {
      name: "Glassdoor",
      icon: "glassdoor",
      color: "#0CAA41",
      url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${query}`,
      description: "Job listings with salary data and company reviews",
    },
    {
      name: "Naukri",
      icon: "naukri",
      color: "#4A90D9",
      url: `https://www.naukri.com/${q.replace(/\s+/g, "-")}-jobs`,
      description: "India's #1 job portal with lakhs of opportunities",
    },
    {
      name: "Internshala",
      icon: "internshala",
      color: "#00A5EC",
      url: `https://internshala.com/internships/${q.replace(/\s+/g, "-")}-internship`,
      description: "Internships and fresher jobs across India",
    },
    {
      name: "Wellfound (AngelList)",
      icon: "wellfound",
      color: "#000000",
      url: `https://wellfound.com/role/r/${q.replace(/\s+/g, "-")}`,
      description: "Startup jobs — work at the next big thing",
    },
    {
      name: "Google Jobs",
      icon: "google",
      color: "#4285F4",
      url: `https://www.google.com/search?q=${query}+jobs&ibp=htl;jobs`,
      description: "Aggregated job listings from across the web",
    },
    {
      name: "GitHub Jobs",
      icon: "github",
      color: "#333333",
      url: `https://github.com/search?q=${query}+label%3A%22good+first+issue%22&type=issues`,
      description: "Open-source contributions and developer opportunities",
    },
  ];

  // Log activity
  await Activity.create({
    user: req.user._id,
    action: `Searched jobs: "${q}"`,
    type: "job",
    xpEarned: 2,
  });
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalXP: 2, activeScore: 1 },
  });

  res.json({
    success: true,
    data: { platforms, query: q },
  });
});

// ──────────────────────────────────────
// GET /api/jobs — List/search jobs
// ──────────────────────────────────────
exports.getJobs = asyncHandler(async (req, res) => {
  const {
    search, type, experienceLevel, location, page = 1, limit = 20,
  } = req.query;

  const filter = { isActive: true };

  if (search) {
    filter.$text = { $search: search };
  }
  if (type) filter.type = type;
  if (experienceLevel) filter.experienceLevel = experienceLevel;
  if (location) filter.location = { $regex: location, $options: "i" };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Job.countDocuments(filter);
  const jobs = await Job.find(filter)
    .sort("-postedAt")
    .skip(skip)
    .limit(parseInt(limit));

  // If user is logged in, get their application statuses
  let applications = {};
  if (req.user) {
    const userApps = await Application.find({ user: req.user._id })
      .select("job status");
    userApps.forEach((app) => {
      applications[app.job.toString()] = app.status;
    });
  }

  res.json({
    success: true,
    data: {
      jobs: jobs.map((j) => ({
        ...j.toObject(),
        applicationStatus: applications[j._id.toString()] || null,
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ──────────────────────────────────────
// GET /api/jobs/:id — Get single job
// ──────────────────────────────────────
exports.getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new AppError("Job not found", 404);

  let application = null;
  if (req.user) {
    application = await Application.findOne({ user: req.user._id, job: job._id });
  }

  res.json({
    success: true,
    data: { job, application },
  });
});

// ──────────────────────────────────────
// POST /api/jobs/:id/apply — Save/apply to job
// ──────────────────────────────────────
exports.applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new AppError("Job not found", 404);

  const { status = "saved", resume, coverLetter, notes } = req.body;

  let application = await Application.findOne({ user: req.user._id, job: job._id });

  if (application) {
    // Update existing application
    application.status = status;
    if (resume) application.resume = resume;
    if (coverLetter) application.coverLetter = coverLetter;
    if (notes) application.notes = notes;
    if (status === "applied") application.appliedAt = new Date();
    application.lastUpdated = new Date();
    await application.save();
  } else {
    // Create new application
    application = await Application.create({
      user: req.user._id,
      job: job._id,
      status,
      resume,
      coverLetter,
      notes,
      appliedAt: status === "applied" ? new Date() : undefined,
    });

    // Track activity
    const action = status === "applied"
      ? `Applied to ${job.title} at ${job.company}`
      : `Saved job: ${job.title} at ${job.company}`;
    const xp = status === "applied" ? 20 : 5;

    await Activity.create({
      user: req.user._id,
      action,
      type: "job",
      xpEarned: xp,
    });
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalXP: xp,
        activeScore: 3,
        ...(status === "applied" ? { "stats.jobsApplied": 1 } : {}),
      },
    });
  }

  res.json({ success: true, data: { application } });
});

// ──────────────────────────────────────
// GET /api/jobs/applications — User's applications
// ──────────────────────────────────────
exports.getApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Application.countDocuments(filter);
  const applications = await Application.find(filter)
    .populate("job", "title company location type salary")
    .sort("-lastUpdated")
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: {
      applications,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ──────────────────────────────────────
// PUT /api/jobs/applications/:id — Update application status
// ──────────────────────────────────────
exports.updateApplication = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const application = await Application.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!application) throw new AppError("Application not found", 404);

  if (status) application.status = status;
  if (notes !== undefined) application.notes = notes;
  application.lastUpdated = new Date();
  await application.save();

  res.json({ success: true, data: { application } });
});

// ──────────────────────────────────────
// POST /api/jobs/seed — Seed sample jobs (dev only)
// ──────────────────────────────────────
exports.seedJobs = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    throw new AppError("Only available in development", 403);
  }

  const sampleJobs = [
    {
      title: "Frontend Developer",
      company: "TechCorp India",
      location: "Bangalore, India",
      type: "full-time",
      salary: { min: 800000, max: 1500000, currency: "INR" },
      description: "Build modern web applications using React, Next.js, and TypeScript.",
      requirements: ["2+ years React experience", "TypeScript", "Responsive design", "Git"],
      skills: ["React", "Next.js", "TypeScript", "CSS", "Git"],
      experienceLevel: "mid",
      applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Frontend+Developer",
    },
    {
      title: "Backend Engineer",
      company: "StartupXYZ",
      location: "Remote",
      type: "remote",
      salary: { min: 1000000, max: 2000000, currency: "INR" },
      description: "Design and build scalable APIs using Node.js and microservices.",
      requirements: ["Node.js", "Express/Fastify", "MongoDB/PostgreSQL", "Docker"],
      skills: ["Node.js", "Express", "MongoDB", "Docker", "AWS"],
      experienceLevel: "mid",
      applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Backend+Engineer",
    },
    {
      title: "Full Stack Developer",
      company: "DigitalWave",
      location: "Chennai, India",
      type: "full-time",
      salary: { min: 600000, max: 1200000, currency: "INR" },
      description: "End-to-end development of web applications.",
      requirements: ["React/Angular", "Node.js", "SQL/NoSQL", "REST APIs"],
      skills: ["React", "Node.js", "MongoDB", "PostgreSQL", "JavaScript"],
      experienceLevel: "entry",
      applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Full+Stack+Developer",
    },
    {
      title: "DevOps Engineer",
      company: "CloudFirst Solutions",
      location: "Hyderabad, India",
      type: "full-time",
      salary: { min: 1200000, max: 2200000, currency: "INR" },
      description: "Manage CI/CD pipelines, cloud infrastructure, and container orchestration.",
      requirements: ["AWS/GCP/Azure", "Docker", "Kubernetes", "Terraform", "CI/CD"],
      skills: ["AWS", "Docker", "Kubernetes", "Terraform", "Jenkins"],
      experienceLevel: "senior",
      applyUrl: "https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer",
    },
    {
      title: "ML Engineer Intern",
      company: "AI Labs",
      location: "Pune, India",
      type: "internship",
      salary: { min: 20000, max: 40000, currency: "INR" },
      description: "Work on machine learning models for NLP and computer vision.",
      requirements: ["Python", "TensorFlow/PyTorch", "Linear Algebra", "Statistics"],
      skills: ["Python", "TensorFlow", "PyTorch", "Pandas", "NumPy"],
      experienceLevel: "entry",
      applyUrl: "https://www.linkedin.com/jobs/search/?keywords=ML+Engineer+Intern",
    },
    {
      title: "React Native Developer",
      company: "MobileFirst Tech",
      location: "Mumbai, India",
      type: "full-time",
      salary: { min: 900000, max: 1800000, currency: "INR" },
      description: "Build cross-platform mobile apps with React Native.",
      requirements: ["React Native", "JavaScript/TypeScript", "iOS/Android", "Redux"],
      skills: ["React Native", "TypeScript", "Redux", "Firebase", "REST APIs"],
      experienceLevel: "mid",
      applyUrl: "https://www.linkedin.com/jobs/search/?keywords=React+Native+Developer",
    },
    {
      title: "Data Analyst",
      company: "Analytics Pro",
      location: "Delhi, India",
      type: "full-time",
      salary: { min: 500000, max: 1000000, currency: "INR" },
      description: "Analyze data and create dashboards for business insights.",
      requirements: ["SQL", "Python", "Tableau/PowerBI", "Excel", "Statistics"],
      skills: ["SQL", "Python", "Tableau", "Excel", "Statistics"],
      experienceLevel: "entry",
    },
    {
      title: "Senior System Design Engineer",
      company: "ScaleUp Technologies",
      location: "Bangalore, India",
      type: "full-time",
      salary: { min: 2500000, max: 4000000, currency: "INR" },
      description: "Design distributed systems handling millions of requests per second.",
      requirements: ["5+ years experience", "System Design", "Microservices", "Distributed Systems"],
      skills: ["System Design", "Microservices", "Kafka", "Redis", "Go"],
      experienceLevel: "lead",
    },
  ];

  await Job.deleteMany({});
  const jobs = await Job.insertMany(sampleJobs);

  res.json({ success: true, message: `Seeded ${jobs.length} jobs.`, data: { count: jobs.length } });
});
