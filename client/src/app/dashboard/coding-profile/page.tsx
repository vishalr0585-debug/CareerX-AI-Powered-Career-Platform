"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Code2,
  Github,
  Loader2,
  Search,
  Star,
  GitFork,
  Users,
  BookOpen,
  Trophy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Award,
  Flame,
  Hash,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { compilerService, codingProfileService } from "@/lib/services";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CodingStats {
  totalSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
  categoryStats: { _id: string; count: number }[];
  languageStats: { _id: string; count: number; accepted: number }[];
  difficultyStats: { easy: number; medium: number; hard: number };
}

interface LeetCodeStats {
  username: string;
  realName: string;
  avatar: string;
  totalSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
  easy: number;
  medium: number;
  hard: number;
  ranking: number;
  reputation: number;
  activeBadge: string | null;
  contest: {
    attended: number;
    rating: number;
    globalRanking: number;
    topPercentage: number | null;
  } | null;
}

interface GitHubStats {
  username: string;
  name: string;
  avatarUrl: string;
  bio: string;
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  totalForks: number;
  topLanguages: { lang: string; count: number }[];
  profileUrl: string;
  createdAt: string;
}

interface GFGStats {
  username: string;
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  score: number;
  streak: number;
  institute: string;
  instituteName?: string;
  languages: string[];
  profileUrl: string;
}

interface CodeChefStats {
  username: string;
  currentRating: number;
  highestRating: number;
  stars: string;
  globalRank: number;
  countryRank: number;
  country: string;
  problemsSolved: number;
  contests: number;
  profileUrl: string;
}

interface HackerRankStats {
  username: string;
  name: string;
  country: string;
  school: string;
  level: number;
  followers: number;
  badges: { name: string; stars: number }[];
  totalBadges: number;
  profileUrl: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LANG_COLORS = [
  "#3776AB", "#F7DF1E", "#00599C", "#ED8B00", "#00ADD8",
  "#7952B3", "#f05032", "#4EC9B0", "#E34F26", "#563D7C",
];

const GITHUB_LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178C6", JavaScript: "#F7DF1E", Python: "#3776AB",
  Java: "#ED8B00", "C++": "#00599C", C: "#555555", "C#": "#9B4993",
  Go: "#00ADD8", Rust: "#CE422B", Ruby: "#CC342D", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#7F52FF", Dart: "#0175C2", HTML: "#E34F26",
  CSS: "#563D7C", Shell: "#89E051", Vue: "#41B883", React: "#61DAFB",
};

function getLangColor(lang: string, idx: number) {
  return GITHUB_LANG_COLORS[lang] ?? LANG_COLORS[idx % LANG_COLORS.length];
}

function PlatformInput({
  icon,
  label,
  placeholder,
  value,
  onChange,
  onFetch,
  loading,
  loaded,
  error,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onFetch: () => void;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
        {loaded && <CheckCircle size={14} className="text-emerald-500" />}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onFetch()}
          className="h-9 text-sm"
        />
        <Button size="sm" onClick={onFetch} disabled={loading || !value.trim()} className="gap-1 px-3">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          {loading ? "" : "Fetch"}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle size={12} /> {error}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CodingProfilePage() {
  // Internal compiler stats
  const [stats, setStats] = useState<CodingStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // LeetCode
  const [lcUsername, setLcUsername] = useState("");
  const [lcLoading, setLcLoading] = useState(false);
  const [lcData, setLcData] = useState<LeetCodeStats | null>(null);
  const [lcError, setLcError] = useState<string | null>(null);

  // GitHub
  const [ghUsername, setGhUsername] = useState("");
  const [ghLoading, setGhLoading] = useState(false);
  const [ghData, setGhData] = useState<GitHubStats | null>(null);
  const [ghError, setGhError] = useState<string | null>(null);

  // GeeksForGeeks
  const [gfgUsername, setGfgUsername] = useState("");
  const [gfgLoading, setGfgLoading] = useState(false);
  const [gfgData, setGfgData] = useState<GFGStats | null>(null);
  const [gfgError, setGfgError] = useState<string | null>(null);

  // CodeChef
  const [ccUsername, setCcUsername] = useState("");
  const [ccLoading, setCcLoading] = useState(false);
  const [ccData, setCcData] = useState<CodeChefStats | null>(null);
  const [ccError, setCcError] = useState<string | null>(null);

  // HackerRank
  const [hrUsername, setHrUsername] = useState("");
  const [hrLoading, setHrLoading] = useState(false);
  const [hrData, setHrData] = useState<HackerRankStats | null>(null);
  const [hrError, setHrError] = useState<string | null>(null);

  // Restore saved usernames on mount
  useEffect(() => {
    const savedLcData = localStorage.getItem("cx_lc_data");
    const savedGhData = localStorage.getItem("cx_gh_data");
    const savedLc = localStorage.getItem("cx_lc_username");
    const savedGh = localStorage.getItem("cx_gh_username");

    const savedGfgData = localStorage.getItem("cx_gfg_data");
    const savedGfg = localStorage.getItem("cx_gfg_username");
    const savedCcData = localStorage.getItem("cx_cc_data");
    const savedCc = localStorage.getItem("cx_cc_username");
    const savedHrData = localStorage.getItem("cx_hr_data");
    const savedHr = localStorage.getItem("cx_hr_username");

    if (savedLc) setLcUsername(savedLc);
    if (savedGh) setGhUsername(savedGh);
    if (savedGfg) setGfgUsername(savedGfg);
    if (savedCc) setCcUsername(savedCc);
    if (savedHr) setHrUsername(savedHr);

    if (savedLcData) { try { setLcData(JSON.parse(savedLcData)); } catch { /* ignore */ } }
    if (savedGhData) { try { setGhData(JSON.parse(savedGhData)); } catch { /* ignore */ } }
    if (savedGfgData) { try { setGfgData(JSON.parse(savedGfgData)); } catch { /* ignore */ } }
    if (savedCcData) { try { setCcData(JSON.parse(savedCcData)); } catch { /* ignore */ } }
    if (savedHrData) { try { setHrData(JSON.parse(savedHrData)); } catch { /* ignore */ } }
  }, []);

  // Load internal compiler stats
  useEffect(() => {
    (async () => {
      try {
        const res = await compilerService.getStats();
        setStats(res.data ?? res);
      } catch {
        // ignore
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  async function fetchLeetCode() {
    if (!lcUsername.trim()) return;
    setLcLoading(true);
    setLcError(null);
    try {
      const res = await codingProfileService.getLeetCode(lcUsername.trim());
      setLcData(res.data);
      localStorage.setItem("cx_lc_username", lcUsername.trim());
      localStorage.setItem("cx_lc_data", JSON.stringify(res.data));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not fetch LeetCode profile.";
      setLcError(msg);
    } finally {
      setLcLoading(false);
    }
  }

  async function fetchGitHub() {
    if (!ghUsername.trim()) return;
    setGhLoading(true);
    setGhError(null);
    try {
      const res = await codingProfileService.getGitHub(ghUsername.trim());
      setGhData(res.data);
      localStorage.setItem("cx_gh_username", ghUsername.trim());
      localStorage.setItem("cx_gh_data", JSON.stringify(res.data));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not fetch GitHub profile.";
      setGhError(msg);
    } finally {
      setGhLoading(false);
    }
  }

  async function fetchGFG() {
    if (!gfgUsername.trim()) return;
    setGfgLoading(true);
    setGfgError(null);
    try {
      const res = await codingProfileService.getGeeksForGeeks(gfgUsername.trim());
      setGfgData(res.data);
      localStorage.setItem("cx_gfg_username", gfgUsername.trim());
      localStorage.setItem("cx_gfg_data", JSON.stringify(res.data));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not fetch GFG profile.";
      setGfgError(msg);
    } finally {
      setGfgLoading(false);
    }
  }

  async function fetchCodeChef() {
    if (!ccUsername.trim()) return;
    setCcLoading(true);
    setCcError(null);
    try {
      const res = await codingProfileService.getCodeChef(ccUsername.trim());
      setCcData(res.data);
      localStorage.setItem("cx_cc_username", ccUsername.trim());
      localStorage.setItem("cx_cc_data", JSON.stringify(res.data));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not fetch CodeChef profile.";
      setCcError(msg);
    } finally {
      setCcLoading(false);
    }
  }

  async function fetchHackerRank() {
    if (!hrUsername.trim()) return;
    setHrLoading(true);
    setHrError(null);
    try {
      const res = await codingProfileService.getHackerRank(hrUsername.trim());
      setHrData(res.data);
      localStorage.setItem("cx_hr_username", hrUsername.trim());
      localStorage.setItem("cx_hr_data", JSON.stringify(res.data));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not fetch HackerRank profile.";
      setHrError(msg);
    } finally {
      setHrLoading(false);
    }
  }

  // Derived data for internal compiler stats
  const totalSolved      = stats?.totalSolved ?? 0;
  const totalSubmissions = stats?.totalSubmissions ?? 0;
  const acceptanceRate   = stats?.acceptanceRate ?? 0;
  const difficultyStats  = stats?.difficultyStats ?? { easy: 0, medium: 0, hard: 0 };

  const languageData = (stats?.languageStats ?? []).map((l, i) => {
    const pct = totalSubmissions > 0 ? Math.round((l.count / totalSubmissions) * 100) : 0;
    return { language: l._id, percentage: pct, problems: l.count, color: LANG_COLORS[i % LANG_COLORS.length] };
  });

  const rawRadar   = stats?.categoryStats ?? [];
  const maxCat     = rawRadar.reduce((m, c) => Math.max(m, c.count), 1);
  const skillRadar = rawRadar.map((c) => ({ skill: c._id, A: Math.round((c.count / maxCat) * 100) }));

  const activityData = [
    { label: "Easy",   value: difficultyStats.easy,   fill: "hsl(160, 84%, 39%)" },
    { label: "Medium", value: difficultyStats.medium, fill: "hsl(35, 92%, 60%)"  },
    { label: "Hard",   value: difficultyStats.hard,   fill: "hsl(350, 80%, 55%)" },
  ];

  const lcTotal      = lcData ? lcData.easy + lcData.medium + lcData.hard : 0;
  const ghLangTotal  = ghData?.topLanguages.reduce((s, l) => s + l.count, 0) ?? 1;

  return (
    <div className="space-y-6 page-enter-stagger">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Coding Profile Analyzer</h1>
        <p className="text-muted-foreground/70">
          Connect your LeetCode, GitHub, GFG, CodeChef &amp; HackerRank to see your real stats alongside CareerX compiler data.
        </p>
      </div>

      {/* ── Platform Connect ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Code2 size={14} className="text-primary" />
            </div>
            Connect Your Profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PlatformInput
              icon={<span className="text-amber-500 font-black text-sm">LC</span>}
              label="LeetCode Username"
              placeholder="e.g. neal_wu"
              value={lcUsername}
              onChange={setLcUsername}
              onFetch={fetchLeetCode}
              loading={lcLoading}
              loaded={!!lcData}
              error={lcError}
            />
            <PlatformInput
              icon={<Github size={14} className="text-muted-foreground" />}
              label="GitHub Username"
              placeholder="e.g. torvalds"
              value={ghUsername}
              onChange={setGhUsername}
              onFetch={fetchGitHub}
              loading={ghLoading}
              loaded={!!ghData}
              error={ghError}
            />
            <PlatformInput
              icon={<span className="text-emerald-500 font-black text-sm">GFG</span>}
              label="GeeksForGeeks Username"
              placeholder="e.g. geeksuser"
              value={gfgUsername}
              onChange={setGfgUsername}
              onFetch={fetchGFG}
              loading={gfgLoading}
              loaded={!!gfgData}
              error={gfgError}
            />
            <PlatformInput
              icon={<span className="text-yellow-600 font-black text-sm">CC</span>}
              label="CodeChef Username"
              placeholder="e.g. admin"
              value={ccUsername}
              onChange={setCcUsername}
              onFetch={fetchCodeChef}
              loading={ccLoading}
              loaded={!!ccData}
              error={ccError}
            />
            <PlatformInput
              icon={<span className="text-green-500 font-black text-sm">HR</span>}
              label="HackerRank Username"
              placeholder="e.g. hackerrank_user"
              value={hrUsername}
              onChange={setHrUsername}
              onFetch={fetchHackerRank}
              loading={hrLoading}
              loaded={!!hrData}
              error={hrError}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── LeetCode Stats ──────────────────────────────────────────────── */}
      {lcData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              {lcData.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lcData.avatar} alt={lcData.username} className="w-7 h-7 rounded-full border border-amber-500/40" />
              )}
              <span className="text-amber-500 font-black">LC</span>
              LeetCode —{" "}
              <a
                href={`https://leetcode.com/${lcData.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                {lcData.username} <ExternalLink size={12} />
              </a>
            </h2>
            {lcData.activeBadge && (
              <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/40">
                🏅 {lcData.activeBadge}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Problems Solved",  value: lcData.totalSolved.toString(),                                      sub: `${lcData.easy}E · ${lcData.medium}M · ${lcData.hard}H`, color: "text-emerald-500" },
              { label: "Acceptance Rate",  value: `${lcData.acceptanceRate}%`,                                        sub: `${lcData.totalSubmissions} submissions`,                  color: "text-blue-400"   },
              { label: "Global Ranking",   value: lcData.ranking > 0 ? `#${lcData.ranking.toLocaleString()}` : "—",  sub: "LeetCode rank",                                          color: "text-violet-400" },
              { label: "Contest Rating",   value: lcData.contest ? lcData.contest.rating.toString() : "—",           sub: lcData.contest ? `${lcData.contest.attended} contests` : "No contests", color: "text-amber-400" },
            ].map((s) => (
              <Card key={s.label} className="hover-lift">
                <CardContent className="p-4">
                  <p className={`stat-number text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Difficulty Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Easy",   count: lcData.easy,   color: "bg-emerald-500", text: "text-emerald-500" },
                  { label: "Medium", count: lcData.medium, color: "bg-amber-400",   text: "text-amber-400"   },
                  { label: "Hard",   count: lcData.hard,   color: "bg-red-500",     text: "text-red-500"     },
                ].map((d) => (
                  <div key={d.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-medium ${d.text}`}>{d.label}</span>
                      <span className="text-muted-foreground">{d.count} solved</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${d.color}`}
                        style={{ width: lcTotal > 0 ? `${Math.round((d.count / lcTotal) * 100)}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {lcData.contest?.topPercentage != null && (
                <p className="text-xs text-muted-foreground/60 mt-3 text-right">
                  Top {lcData.contest.topPercentage}% globally in contests
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── GitHub Stats ─────────────────────────────────────────────────── */}
      {ghData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Github size={16} />
            <h2 className="text-lg font-bold">
              GitHub —{" "}
              <a
                href={ghData.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {ghData.username} <ExternalLink size={12} />
              </a>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  {ghData.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ghData.avatarUrl} alt={ghData.username} className="w-12 h-12 rounded-full border border-border/40" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">{ghData.name || ghData.username}</p>
                    {ghData.bio && <p className="text-xs text-muted-foreground/70 line-clamp-2">{ghData.bio}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <BookOpen size={12} />, label: "Public Repos", value: ghData.publicRepos },
                    { icon: <Users size={12} />,    label: "Followers",    value: ghData.followers    },
                    { icon: <Star size={12} />,     label: "Total Stars",  value: ghData.totalStars   },
                    { icon: <GitFork size={12} />,  label: "Total Forks",  value: ghData.totalForks   },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-muted/30 p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                        {item.icon}
                        <span className="text-[10px]">{item.label}</span>
                      </div>
                      <p className="text-xl font-black">{item.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Top Languages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {ghData.topLanguages.slice(0, 6).map((l, i) => {
                  const pct   = Math.round((l.count / ghLangTotal) * 100);
                  const color = getLangColor(l.lang, i);
                  return (
                    <div key={l.lang}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="font-medium flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                          {l.lang}
                        </span>
                        <span className="text-muted-foreground">{l.count} repos · {pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── GeeksForGeeks Stats ──────────────────────────────────────────── */}
      {gfgData && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="text-emerald-500 font-black">GFG</span>
            GeeksForGeeks —{" "}
            <a href={gfgData.profileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
              {gfgData.username} <ExternalLink size={12} />
            </a>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Problems Solved", value: gfgData.totalSolved.toString(), sub: gfgData.easy || gfgData.medium || gfgData.hard ? `${gfgData.easy}E · ${gfgData.medium}M · ${gfgData.hard}H` : "Total solved", color: "text-emerald-500" },
              { label: "Coding Score", value: gfgData.score.toString(), sub: "Overall score", color: "text-blue-400" },
              { label: "Longest Streak", value: gfgData.streak.toString(), sub: "POTD streak", color: "text-amber-400" },
              { label: "Institute Rank", value: gfgData.institute || "N/A", sub: gfgData.instituteName || "Institute ranking", color: "text-violet-400" },
            ].map((s) => (
              <Card key={s.label} className="hover-lift">
                <CardContent className="p-4">
                  <p className={`stat-number text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {(gfgData.easy > 0 || gfgData.medium > 0 || gfgData.hard > 0) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Difficulty Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Easy", count: gfgData.easy, color: "bg-emerald-500", text: "text-emerald-500" },
                  { label: "Medium", count: gfgData.medium, color: "bg-amber-400", text: "text-amber-400" },
                  { label: "Hard", count: gfgData.hard, color: "bg-red-500", text: "text-red-500" },
                ].map((d) => (
                  <div key={d.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-medium ${d.text}`}>{d.label}</span>
                      <span className="text-muted-foreground">{d.count} solved</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${d.color}`}
                        style={{ width: gfgData.totalSolved > 0 ? `${Math.round((d.count / gfgData.totalSolved) * 100)}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      )}

      {/* ── CodeChef Stats ───────────────────────────────────────────────── */}
      {ccData && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="text-yellow-600 font-black">CC</span>
            CodeChef —{" "}
            <a href={ccData.profileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
              {ccData.username} <ExternalLink size={12} />
            </a>
            {ccData.stars && ccData.stars !== "unrated" && (
              <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/40">
                {ccData.stars}
              </Badge>
            )}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Current Rating", value: ccData.currentRating.toString(), sub: ccData.stars || "Unrated", color: "text-yellow-500" },
              { label: "Highest Rating", value: ccData.highestRating.toString(), sub: "Peak rating", color: "text-emerald-500" },
              { label: "Problems Solved", value: ccData.problemsSolved.toString(), sub: "Total solved", color: "text-blue-400" },
              { label: "Country", value: ccData.country || "—", sub: ccData.contests > 0 ? `${ccData.contests} contests` : "No contests", color: "text-violet-400" },
            ].map((s) => (
              <Card key={s.label} className="hover-lift">
                <CardContent className="p-4">
                  <p className={`stat-number text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── HackerRank Stats ─────────────────────────────────────────────── */}
      {hrData && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="text-green-500 font-black">HR</span>
            HackerRank —{" "}
            <a href={hrData.profileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
              {hrData.username} <ExternalLink size={12} />
            </a>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Level", value: hrData.level.toString(), sub: hrData.name || hrData.username, color: "text-green-500" },
              { label: "Followers", value: hrData.followers.toLocaleString(), sub: hrData.country || "Global", color: "text-blue-400" },
              { label: "Total Badges", value: hrData.totalBadges.toString(), sub: "Earned badges", color: "text-amber-400" },
              { label: "School", value: hrData.school || "—", sub: "Institution", color: "text-violet-400" },
            ].map((s) => (
              <Card key={s.label} className="hover-lift">
                <CardContent className="p-4">
                  <p className={`stat-number text-2xl font-black ${s.color} ${s.label === "School" ? "text-sm" : ""}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {hrData.badges.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Award size={14} className="text-green-500" /> Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {hrData.badges.map((b) => (
                    <Badge key={b.name} variant="outline" className="text-xs gap-1">
                      <Star size={10} className="text-amber-400" />
                      {b.name} ({b.stars}★)
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── CareerX Compiler Stats ───────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Trophy size={16} className="text-primary" />
          CareerX Compiler Stats
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Solved",        value: totalSolved.toString(),                                                        trend: `${difficultyStats.hard} hard`           },
            { label: "Acceptance Rate",      value: `${acceptanceRate}%`,                                                          trend: `${totalSubmissions} submissions`         },
            { label: "Easy / Medium / Hard", value: `${difficultyStats.easy}/${difficultyStats.medium}/${difficultyStats.hard}`,   trend: "Difficulty breakdown"                    },
            { label: "Languages",            value: languageData.length > 0 ? languageData.length.toString() : "—",               trend: "Active"                                  },
          ].map((stat) => (
            <Card key={stat.label} className="hover-lift">
              <CardContent className="p-4">
                {statsLoading ? (
                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <p className="stat-number text-2xl">{stat.value}</p>
                    <p className="text-xs text-muted-foreground/60">{stat.label}</p>
                    <p className="text-[10px] text-emerald-500 font-medium mt-1">{stat.trend}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Language Proficiency</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {languageData.length > 0 ? (
                languageData.map((lang) => (
                  <div key={lang.language}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lang.color }} />
                        <span className="text-sm font-medium">{lang.language}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{lang.problems} submissions · {lang.percentage}%</div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No submissions yet — solve some problems to see language stats.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Skill Analysis</CardTitle></CardHeader>
            <CardContent>
              {skillRadar.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skillRadar}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Radar name="You" dataKey="A" stroke="hsl(252, 70%, 58%)" fill="hsl(252, 70%, 58%)" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                  Solve problems across categories to see your skill radar.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Code2 size={14} className="text-primary" />
              </div>
              Difficulty Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="label" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={55} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(value) => [`${value} solved`, ""]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {activityData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}