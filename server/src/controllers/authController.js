const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Activity = require("../models/Activity");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const { sendPasswordResetEmail } = require("../utils/emailService");
const {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies,
} = require("../middleware/auth");

// ── Helper: finish OAuth login (shared by Google & GitHub) ──
async function finishOAuthLogin(res, { email, fullName, avatar, provider, providerId }) {
  let user = await User.findOne({ email });

  if (user) {
    // Existing user — update provider info if they signed up via local before
    if (!user.providerId) {
      user.provider = provider;
      user.providerId = providerId;
    }
    if (avatar && !user.avatar) user.avatar = avatar;
  } else {
    // New user
    user = await User.create({
      fullName,
      email,
      provider,
      providerId,
      avatar: avatar || "",
      role: "job_seeker",
    });
    user.totalXP = 50;
    user.calculateProfileCompletion();
    await user.save();
    await Activity.create({ user: user._id, action: "Account created via " + provider, type: "general", xpEarned: 50 });
  }

  // Update login streak
  const now = new Date();
  const lastLogin = user.lastLoginDate;
  if (lastLogin) {
    const diffHours = (now - lastLogin) / (1000 * 60 * 60);
    if (diffHours >= 20 && diffHours <= 48) {
      user.loginStreak += 1;
      user.longestStreak = Math.max(user.longestStreak, user.loginStreak);
      user.totalXP += 10;
    } else if (diffHours > 48) {
      user.loginStreak = 1;
    }
  } else {
    user.loginStreak = 1;
  }
  user.lastLoginDate = now;
  user.activeScore += 5;

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);

  await Activity.create({ user: user._id, action: `Logged in via ${provider}`, type: "general", xpEarned: 10 });

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  return { userResponse, accessToken };
}

// ──────────────────────────────────────
// POST /api/auth/signup
// ──────────────────────────────────────
exports.signup = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { fullName, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  // Create user
  const user = await User.create({
    fullName,
    email,
    password,
    provider: "local",
    role: role === "higher_studies" ? "higher_studies" : "job_seeker",
  });

  // Calculate initial profile completion
  user.calculateProfileCompletion();
  await user.save();

  // Log activity
  await Activity.create({
    user: user._id,
    action: "Account created",
    type: "general",
    xpEarned: 50,
  });

  // Update XP
  user.totalXP = 50;
  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Response (exclude password)
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  res.status(201).json({
    success: true,
    message: "Account created successfully!",
    data: {
      user: userResponse,
      accessToken,
    },
  });
});

// ──────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  // Find user with password
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  // Check if user signed up with OAuth
  if (user.provider !== "local" && !user.password) {
    throw new AppError(
      `This account uses ${user.provider} sign-in. Please use that method.`,
      401
    );
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError("Invalid email or password.", 401);
  }

  // Update login streak
  const now = new Date();
  const lastLogin = user.lastLoginDate;
  if (lastLogin) {
    const diffHours = (now - lastLogin) / (1000 * 60 * 60);
    if (diffHours >= 20 && diffHours <= 48) {
      user.loginStreak += 1;
      user.longestStreak = Math.max(user.longestStreak, user.loginStreak);
      user.totalXP += 10; // streak bonus
    } else if (diffHours > 48) {
      user.loginStreak = 1;
    }
  } else {
    user.loginStreak = 1;
  }
  user.lastLoginDate = now;
  user.activeScore += 5;

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);

  // Log activity
  await Activity.create({
    user: user._id,
    action: `Logged in (${user.loginStreak} day streak)`,
    type: "general",
    xpEarned: 10,
  });

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  res.json({
    success: true,
    message: "Login successful!",
    data: {
      user: userResponse,
      accessToken,
    },
  });
});

// ──────────────────────────────────────
// POST /api/auth/logout
// ──────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: "" });
  }

  // Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

  res.json({
    success: true,
    message: "Logged out successfully.",
  });
});

// ──────────────────────────────────────
// POST /api/auth/refresh
// ──────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    throw new AppError("No refresh token provided.", 401);
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw new AppError("Invalid or expired refresh token.", 401);
  }

  // Find user and verify stored token matches
  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== token) {
    throw new AppError("Invalid refresh token.", 401);
  }

  // Rotate tokens
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save();

  setTokenCookies(res, newAccessToken, newRefreshToken);

  res.json({
    success: true,
    data: { accessToken: newAccessToken },
  });
});

// ──────────────────────────────────────
// GET /api/auth/me
// ──────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: { user },
  });
});

// ──────────────────────────────────────
// POST /api/auth/forgot-password
// ──────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const user = await User.findOne({ email: req.body.email });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save();

  // Send reset email
  try {
    await sendPasswordResetEmail(user.email, resetToken);
  } catch (emailErr) {
    console.error("Failed to send reset email:", emailErr.message);
    // In development, still log token so manual testing is possible
    if (process.env.NODE_ENV === "development") {
      console.log(`Password reset token for ${user.email}: ${resetToken}`);
    }
  }

  res.json({
    success: true,
    message: "If an account with that email exists, a reset link has been sent.",
    // Include token in dev for testing convenience
    ...(process.env.NODE_ENV === "development" && { resetToken }),
  });
});

// ──────────────────────────────────────
// POST /api/auth/reset-password/:token
// ──────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Hash the token from URL
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new AppError("Invalid or expired reset token.", 400);
  }

  // Set new password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Generate new tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);

  res.json({
    success: true,
    message: "Password reset successful!",
    data: { accessToken },
  });
});

// ──────────────────────────────────────
// POST /api/auth/google — Google OAuth
// ──────────────────────────────────────
exports.googleLogin = asyncHandler(async (req, res) => {
  const { code, redirectUri } = req.body;
  if (!code) throw new AppError("Authorization code is required", 400);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  if (!clientId || !clientSecret) {
    throw new AppError("Google OAuth is not configured on this server.", 500);
  }

  // Use the redirect_uri sent by the frontend (must match what was used in the auth request)
  const oauthRedirectUri = redirectUri || `${clientUrl}/login`;

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: oauthRedirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new AppError("Failed to exchange Google authorization code.", 401);
  }

  // Fetch user info from Google
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const gUser = await userInfoRes.json();

  if (!gUser.email) {
    throw new AppError("Could not retrieve email from Google.", 401);
  }

  const { userResponse, accessToken } = await finishOAuthLogin(res, {
    email: gUser.email,
    fullName: gUser.name || gUser.email.split("@")[0],
    avatar: gUser.picture || "",
    provider: "google",
    providerId: gUser.id,
  });

  res.json({
    success: true,
    message: "Google login successful!",
    data: { user: userResponse, accessToken },
  });
});

// ──────────────────────────────────────
// POST /api/auth/github — GitHub OAuth
// ──────────────────────────────────────
exports.githubLogin = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new AppError("Authorization code is required", 400);

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AppError("GitHub OAuth is not configured on this server.", 500);
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new AppError("Failed to exchange GitHub authorization code.", 401);
  }

  // Fetch GitHub user profile
  const ghHeaders = {
    Authorization: `Bearer ${tokenData.access_token}`,
    "User-Agent": "CareerX-App",
  };
  const [userRes, emailsRes] = await Promise.all([
    fetch("https://api.github.com/user", { headers: ghHeaders }),
    fetch("https://api.github.com/user/emails", { headers: ghHeaders }),
  ]);

  const ghUser = await userRes.json();
  const emails = emailsRes.ok ? await emailsRes.json() : [];

  // Get primary verified email
  const primaryEmail =
    (Array.isArray(emails) && emails.find((e) => e.primary && e.verified)?.email) ||
    ghUser.email;

  if (!primaryEmail) {
    throw new AppError(
      "No verified email found on your GitHub account. Please add a verified email to GitHub.",
      401
    );
  }

  const { userResponse, accessToken } = await finishOAuthLogin(res, {
    email: primaryEmail,
    fullName: ghUser.name || ghUser.login,
    avatar: ghUser.avatar_url || "",
    provider: "github",
    providerId: String(ghUser.id),
  });

  res.json({
    success: true,
    message: "GitHub login successful!",
    data: { user: userResponse, accessToken },
  });
});
