const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars — explicit path so it works regardless of CWD
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// ──────────────────────────────────────
// ENV VALIDATION — fail fast with clear messages
// ──────────────────────────────────────
const requiredEnv = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`\n✗ Missing required environment variables: ${missingEnv.join(", ")}`);
  console.error("  → Copy server/.env.example to server/.env and fill in the values.");
  console.error("  → See CONFIG.md for full setup instructions.\n");
  process.exit(1);
}

const optionalEnv = ["GEMINI_API_KEY", "GROQ_API_KEY"];
const hasAiKey = optionalEnv.some((key) => process.env[key]);
if (!hasAiKey) {
  console.warn("\n⚠ No AI API key found (GEMINI_API_KEY or GROQ_API_KEY).");
  console.warn("  AI features (chat, project lab, ATS analysis) will not work.\n");
}

const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");

// Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const jobRoutes = require("./routes/jobRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const examRoutes = require("./routes/examRoutes");
const compilerRoutes = require("./routes/compilerRoutes");
const chatRoutes = require("./routes/chatRoutes");
const projectRoutes = require("./routes/projectRoutes");
const seedRoutes = require("./routes/seedRoutes");
const searchRoutes = require("./routes/searchRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const profileRoutes = require("./routes/profileRoutes");
const higherEdRoutes = require("./routes/higherEdRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// ──────────────────────────────────────
// SECURITY & MIDDLEWARE
// ──────────────────────────────────────

// Trust proxy — required behind reverse proxies (Render, Railway, etc.)
app.set("trust proxy", 1);

// Helmet — security headers
app.use(helmet());

// Gzip compression
app.use(compression());

// CORS — support multiple frontend origins (comma-separated CLIENT_URL)
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server (no origin) or any listed origin
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per window
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parsing
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ──────────────────────────────────────
// ROUTES
// ──────────────────────────────────────

// Root route — welcome page
app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "CareerX API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth (signup, login, logout, forgot-password, reset-password)",
      users: "/api/users (profile, stats, activity, achievements)",
      dashboard: "/api/dashboard (summary, leaderboard)",
      resumes: "/api/resumes (CRUD, ATS analysis)",
      jobs: "/api/jobs (search, apply, applications)",
      interviews: "/api/interviews (practice sessions, history)",
      exams: "/api/exams (subjects, start, submit, history)",
      compiler: "/api/compiler (problems, run code, submit, stats)",
      chat: "/api/chat (AI career assistant sessions)",
      projects: "/api/projects (AI project lab, templates, steps)",
    },
    docs: "Use the endpoints above with proper HTTP methods",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CareerX API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), {
  setHeaders: (res, filePath, stat) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    // Allow first listed origin for static files
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0] || "*");
  },
}));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/compiler", compilerRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/coding-profile", profileRoutes);
app.use("/api/higher-ed", higherEdRoutes);
app.use("/api/notifications", notificationRoutes);

// Debug: log registered routes
console.log("✓ Notification routes registered at /api/notifications");

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// ──────────────────────────────────────
// START SERVER
// ──────────────────────────────────────

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════╗
║      CareerX API Server              ║
║──────────────────────────────────────║
║  Port:        ${PORT}                    ║
║  Environment: ${(process.env.NODE_ENV || "development").padEnd(19)} ║
║  API:         http://localhost:${PORT}   ║
╚══════════════════════════════════════╝
      `);
    });

    // ── Graceful shutdown ──────────────────────────────────────
    const shutdown = (signal) => {
      console.log(`\n⏻ ${signal} received. Shutting down gracefully...`);
      server.close(() => {
        const mongoose = require("mongoose");
        mongoose.connection.close(false).then(() => {
          console.log("✓ MongoDB connection closed.");
          process.exit(0);
        });
      });
      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        console.error("✗ Forced exit after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// ── Global crash handlers — prevent silent crashes ─────────────────────
process.on("unhandledRejection", (reason, promise) => {
  console.error("✗ Unhandled Promise Rejection:", reason);
  // Don't exit — log and continue. The error handler middleware catches most cases.
});

process.on("uncaughtException", (error) => {
  console.error("✗ Uncaught Exception:", error);
  // Exit on uncaught exceptions — the process is in an undefined state
  process.exit(1);
});

startServer();

module.exports = app;
