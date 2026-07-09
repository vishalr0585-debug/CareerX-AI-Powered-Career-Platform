const asyncHandler = require("express-async-handler");

const ALFA_BASE = "https://alfa-leetcode-api.onrender.com";

// ── Helper: fetch with timeout ────────────────────────────────────────────────
function fetchWithTimeout(url, options = {}, timeout = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

// ── GET /api/coding-profile/leetcode/:username ────────────────────────────────
exports.getLeetCodeStats = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const headers = { "Accept": "application/json" };

  // Fire all three requests in parallel
  const [profileRes, solvedRes, contestRes] = await Promise.allSettled([
    fetchWithTimeout(`${ALFA_BASE}/${username}`, { headers }),
    fetchWithTimeout(`${ALFA_BASE}/userProfile/${username}`, { headers }),
    fetchWithTimeout(`${ALFA_BASE}/${username}/contest`, { headers }),
  ]);

  // Parse helpers
  const parseJson = async (settled) => {
    if (settled.status !== "fulfilled" || !settled.value.ok) return null;
    try { return await settled.value.json(); } catch { return null; }
  };

  const [profile, solved, contest] = await Promise.all([
    parseJson(profileRes),
    parseJson(solvedRes),
    parseJson(contestRes),
  ]);

  // If the core profile/solved data is missing, user likely doesn't exist
  if (!profile && !solved) {
    return res.status(404).json({ success: false, message: "LeetCode user not found. Check the username and try again." });
  }

  const totalSolved = solved?.totalSolved ?? 0;
  const easySolved  = solved?.easySolved  ?? 0;
  const medSolved   = solved?.mediumSolved ?? 0;
  const hardSolved  = solved?.hardSolved  ?? 0;

  // totalSubmissions is an array: [{difficulty:"All", count:N, submissions:N}, ...]
  const totalSubsObj = Array.isArray(solved?.totalSubmissions)
    ? solved.totalSubmissions.find((s) => s.difficulty === "All")
    : null;
  const totalSubs = totalSubsObj?.submissions ?? totalSubsObj?.count ?? 0;
  const acceptanceRate = totalSubs > 0 ? Math.round((totalSolved / totalSubs) * 1000) / 10 : 0;

  res.json({
    success: true,
    data: {
      username:         profile?.username   ?? solved?.username  ?? username,
      realName:         profile?.name       ?? "",
      avatar:           profile?.avatar     ?? "",
      totalSolved,
      totalSubmissions: totalSubs,
      acceptanceRate,
      easy:             easySolved,
      medium:           medSolved,
      hard:             hardSolved,
      ranking:          profile?.ranking    ?? solved?.ranking   ?? 0,
      reputation:       profile?.reputation ?? solved?.reputation ?? 0,
      activeBadge:      null,
      contest: contest?.contestRating != null
        ? {
            attended:      contest.contestAttend          ?? 0,
            rating:        Math.round(contest.contestRating ?? 0),
            globalRanking: contest.contestGlobalRanking   ?? 0,
            topPercentage: contest.contestTopPercentage != null
              ? Math.round(contest.contestTopPercentage * 10) / 10
              : null,
          }
        : null,
    },
  });
});

// ── GET /api/coding-profile/github/:username ──────────────────────────────────
exports.getGitHubStats = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const headers = { "User-Agent": "CareerX-App" };

  const [profileRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers }),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers }),
  ]);

  if (!profileRes.ok) {
    return res
      .status(profileRes.status)
      .json({ success: false, message: "GitHub user not found" });
  }

  const profile = await profileRes.json();
  const repos   = reposRes.ok ? await reposRes.json() : [];

  const langMap   = {};
  let totalStars  = 0;
  let totalForks  = 0;

  (Array.isArray(repos) ? repos : []).forEach((repo) => {
    if (repo.language) {
      langMap[repo.language] = (langMap[repo.language] ?? 0) + 1;
    }
    totalStars += repo.stargazers_count ?? 0;
    totalForks += repo.forks_count ?? 0;
  });

  const topLanguages = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, count]) => ({ lang, count }));

  res.json({
    success: true,
    data: {
      username: profile.login,
      name: profile.name ?? "",
      avatarUrl: profile.avatar_url,
      bio: profile.bio ?? "",
      publicRepos: profile.public_repos ?? 0,
      followers: profile.followers ?? 0,
      following: profile.following ?? 0,
      totalStars,
      totalForks,
      topLanguages,
      profileUrl: profile.html_url,
      createdAt: profile.created_at,
    },
  });
});

// ── GET /api/coding-profile/gfg/:username ─────────────────────────────────────
exports.getGeeksForGeeksStats = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const apiRes = await fetchWithTimeout(
    `https://authapi.geeksforgeeks.org/api-get/user-profile-info/?handle=${encodeURIComponent(username)}`
  );

  if (!apiRes.ok) {
    return res.status(404).json({ success: false, message: "GFG user not found. Check the username." });
  }

  const json = await apiRes.json();
  const data = json?.data;

  if (!data || !data.name) {
    return res.status(404).json({ success: false, message: "GFG user not found. Check the username." });
  }

  res.json({
    success: true,
    data: {
      username: username,
      totalSolved: data.total_problems_solved ?? 0,
      easy: 0,
      medium: 0,
      hard: 0,
      score: data.score ?? 0,
      streak: data.pod_solved_longest_streak ?? data.pod_solved_current_streak ?? 0,
      institute: data.institute_rank ? `#${data.institute_rank}` : "N/A",
      instituteName: data.institute_name || "",
      languages: [],
      profileUrl: `https://www.geeksforgeeks.org/user/${username}`,
    },
  });
});

// ── GET /api/coding-profile/codechef/:username ────────────────────────────────
exports.getCodeChefStats = asyncHandler(async (req, res) => {
  const { username } = req.params;

  // CodeChef third-party APIs are unreliable; scrape the public profile page
  const pageRes = await fetchWithTimeout(
    `https://www.codechef.com/users/${encodeURIComponent(username)}`,
    { headers: { "User-Agent": "Mozilla/5.0 (compatible; CareerX/1.0)" } },
    15000
  );

  if (!pageRes.ok) {
    return res.status(404).json({ success: false, message: "CodeChef user not found." });
  }

  const html = await pageRes.text();

  // Detect non-existent user: a real profile page has the user-country-name class
  // or "Total Problems Solved" heading; generic pages don't
  const hasProfile = html.includes("user-country-name") || /Total Problems Solved/i.test(html);
  if (!hasProfile) {
    return res.status(404).json({ success: false, message: "CodeChef user not found." });
  }

  // Extract rating & contest count from Drupal.settings JSON
  let currentRating = 0;
  let highestRating = 0;
  let contests = 0;
  const drupalMatch = html.match(/jQuery\.extend\(Drupal\.settings,\s*(\{[\s\S]*?\})\);/);
  if (drupalMatch) {
    try {
      const settings = JSON.parse(drupalMatch[1]);
      const allRatings = settings.date_versus_rating?.all;
      if (Array.isArray(allRatings) && allRatings.length > 0) {
        contests = allRatings.length;
        const latest = allRatings[allRatings.length - 1];
        currentRating = parseInt(latest.elo_rating || latest.rating, 10) || 0;
        highestRating = allRatings.reduce((max, r) => {
          const v = parseInt(r.elo_rating || r.rating, 10) || 0;
          return v > max ? v : max;
        }, 0);
      }
    } catch { /* ignore parse errors */ }
  }

  // Fallback: rating-number class in HTML
  if (!currentRating) {
    const rn = html.match(/class="rating-number"[^>]*>(\d+)/);
    if (rn) currentRating = parseInt(rn[1], 10) || 0;
  }

  // Calculate stars from rating (CodeChef star system)
  let stars = "unrated";
  if (currentRating > 0) {
    if (currentRating >= 3000) stars = "7★";
    else if (currentRating >= 2500) stars = "6★";
    else if (currentRating >= 2200) stars = "5★";
    else if (currentRating >= 2000) stars = "4★";
    else if (currentRating >= 1800) stars = "3★";
    else if (currentRating >= 1600) stars = "2★";
    else stars = "1★";
  }

  // Problems solved from heading
  let problemsSolved = 0;
  const solvedMatch = html.match(/(?:Total )?Problems Solved:\s*(\d+)/i);
  if (solvedMatch) problemsSolved = parseInt(solvedMatch[1], 10) || 0;

  // Country
  let country = "";
  const countryMatch = html.match(/class="user-country-name"[^>]*>([^<]+)/);
  if (countryMatch) country = countryMatch[1].trim();

  res.json({
    success: true,
    data: {
      username,
      currentRating,
      highestRating: highestRating || currentRating,
      stars,
      globalRank: 0,
      countryRank: 0,
      country,
      problemsSolved,
      contests,
      profileUrl: `https://www.codechef.com/users/${username}`,
    },
  });
});

// ── GET /api/coding-profile/hackerrank/:username ──────────────────────────────
exports.getHackerRankStats = asyncHandler(async (req, res) => {
  const { username } = req.params;

  // HackerRank public model API
  const [profileRes, badgesRes] = await Promise.allSettled([
    fetchWithTimeout(`https://www.hackerrank.com/rest/contests/master/hackers/${encodeURIComponent(username)}/profile`, {
      headers: { "User-Agent": "CareerX-App", Accept: "application/json" },
    }),
    fetchWithTimeout(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/badges`, {
      headers: { "User-Agent": "CareerX-App", Accept: "application/json" },
    }),
  ]);

  const parseJson = async (settled) => {
    if (settled.status !== "fulfilled" || !settled.value.ok) return null;
    try { return await settled.value.json(); } catch { return null; }
  };

  const [profile, badges] = await Promise.all([
    parseJson(profileRes),
    parseJson(badgesRes),
  ]);

  if (!profile || !profile.model) {
    return res.status(404).json({ success: false, message: "HackerRank user not found." });
  }

  const model = profile.model;
  const badgeList = Array.isArray(badges?.models) ? badges.models : [];

  res.json({
    success: true,
    data: {
      username: model.username || username,
      name: model.name || "",
      country: model.country || "",
      school: model.school || "",
      level: model.level ?? 0,
      followers: model.followers_count ?? 0,
      badges: badgeList.map((b) => ({
        name: b.badge_name || b.id,
        stars: b.stars ?? b.current_points ?? 0,
      })),
      totalBadges: badgeList.length,
      profileUrl: `https://www.hackerrank.com/profile/${username}`,
    },
  });
});
