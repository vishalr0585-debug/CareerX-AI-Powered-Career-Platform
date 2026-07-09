"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  FileText,
  Code2,
  Briefcase,
  Trophy,
  Target,
  ArrowUpRight,
  Calendar,
  Flame,
  Zap,
  BarChart3,
  Clock,
  Star,
  BookOpen,
  Sparkles,
  Loader2,
  Search,
  Award,
  CalendarDays,
  FileEdit,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { dashboardService, userService } from "@/lib/services";
import { useAuthStore } from "@/stores/authStore";

const skillColors = [
  "hsl(252, 70%, 58%)",
  "hsl(145, 70%, 45%)",
  "hsl(38, 92%, 56%)",
  "hsl(340, 75%, 55%)",
  "hsl(350, 80%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(28, 80%, 52%)",
];

const jobSeekerQuickActions = [
  { label: "Build Resume", desc: "AI-powered builder", href: "/dashboard/resume-builder", icon: FileText, color: "text-blue-500 bg-blue-500/10" },
  { label: "Practice Code", desc: "DSA challenges", href: "/dashboard/compiler", icon: Code2, color: "text-emerald-500 bg-emerald-500/10" },
  { label: "Mock Interview", desc: "AI feedback", href: "/dashboard/interview-lab", icon: Target, color: "text-violet-500 bg-violet-500/10" },
  { label: "Find Jobs", desc: "Search platforms", href: "/dashboard/jobs", icon: Briefcase, color: "text-orange-500 bg-orange-500/10" },
];

const higherStudiesQuickActions = [
  { label: "Exam Prep", desc: "GATE, CAT, GRE", href: "/dashboard/exam-prep", icon: BookOpen, color: "text-teal-500 bg-teal-500/10" },
  { label: "Practice MCQs", desc: "Exam questions", href: "/dashboard/exam-mcq", icon: Target, color: "text-violet-500 bg-violet-500/10" },
  { label: "University Finder", desc: "Find best-fit unis", href: "/dashboard/university-finder", icon: Search, color: "text-blue-500 bg-blue-500/10" },
  { label: "Scholarships", desc: "Find funding", href: "/dashboard/scholarship-finder", icon: Award, color: "text-amber-500 bg-amber-500/10" },
  { label: "Study Planner", desc: "Plan & focus", href: "/dashboard/study-planner", icon: CalendarDays, color: "text-emerald-500 bg-emerald-500/10" },
  { label: "SOP Writer", desc: "AI-powered SOP", href: "/dashboard/sop-writer", icon: FileEdit, color: "text-violet-500 bg-violet-500/10" },
];

const activityIconMap: Record<string, { icon: typeof Code2; color: string; bg: string }> = {
  compiler: { icon: Code2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  resume: { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
  interview: { icon: Target, color: "text-violet-500", bg: "bg-violet-500/10" },
  job: { icon: Briefcase, color: "text-orange-500", bg: "bg-orange-500/10" },
  exam: { icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/10" },
  project: { icon: Sparkles, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  chat: { icon: Star, color: "text-pink-500", bg: "bg-pink-500/10" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [activities, setActivities] = useState<Array<Record<string, unknown>>>([]);
  const [skills, setSkills] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [xpHistory, setXpHistory] = useState<Array<Record<string, unknown>>>([]);
  const { user: authUser } = useAuthStore();

  const userRole = authUser?.role || "job_seeker";
  const quickActions = userRole === "higher_studies" ? higherStudiesQuickActions : jobSeekerQuickActions;

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, actRes, skillRes, xpRes] = await Promise.all([
          dashboardService.getSummary(),
          userService.getRecentActivity(1, 5),
          userService.getSkillDistribution(),
          userService.getXPHistory(1),
        ]);
        setSummary(sumRes.data);
        setActivities(actRes.data?.activities || []);
        const sd = skillRes.data?.skills || [];
        setSkills(
          (Array.isArray(sd) ? sd : []).map(
            (s: { name: string; value: number; xp: number }, i: number) => ({
              name: s.name,
              value: s.value,
              color: skillColors[i % skillColors.length],
            })
          )
        );
        const xpArr = xpRes.data?.xpHistory || [];
        setXpHistory(Array.isArray(xpArr) ? xpArr : []);
      } catch (e) {
        console.error("Dashboard load error", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const user = (summary as Record<string, unknown>)?.user as Record<string, unknown> | undefined;
  const stats = (summary as Record<string, unknown>)?.stats as Record<string, unknown> | undefined;
  const userName = (user?.fullName as string)?.split(" ")[0] || "there";
  const streak = (user?.loginStreak as number) || 0;
  const profileCompletion = (user?.profileCompletion as number) || 0;
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const pThisWeek = (stats?.problemsSolvedThisWeek as number) || 0;
  const jThisWeek = (stats?.jobsAppliedThisWeek as number) || 0;

  const statCards = [
    { label: "Active Score", value: String(stats?.activeScore ?? 0), change: `${(stats?.activeScore as number) > 0 ? "+" : ""}${stats?.activeScore ?? 0} XP`, icon: Zap, accent: "text-violet-500 bg-violet-500/10" },
    { label: "Problems Solved", value: String(stats?.problemsSolved ?? 0), change: pThisWeek > 0 ? `+${pThisWeek} this week` : "this week", icon: Code2, accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Global Rank", value: `#${stats?.globalRank ?? "—"}`, change: `Top ${Math.max(1, Math.min(100, (stats?.globalRank as number) || 1))}`, icon: Trophy, accent: "text-amber-500 bg-amber-500/10" },
    { label: "Jobs Applied", value: String(stats?.jobsApplied ?? 0), change: jThisWeek > 0 ? `+${jThisWeek} this week` : "this week", icon: Briefcase, accent: "text-orange-500 bg-orange-500/10" },
  ];

  // Build weekly activity data from XP history or fallback
  const activityData = xpHistory.length > 0
    ? xpHistory.map((h: Record<string, unknown>) => ({ day: (h.month as string) || (h.date as string) || "", score: (h.xp as number) || 0 }))
    : [{ day: "Today", score: (user?.totalXP as number) || 0 }];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {userName}</h1>
          <p className="text-muted-foreground mt-1">Here&apos;s your career progress overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 rounded-lg">
            <Calendar size={13} />
            {today}
          </Badge>
          {streak > 0 && (
          <Badge variant="warning" className="gap-1.5 px-3 py-1.5 rounded-lg">
            <Flame size={13} />
            {streak} Day Streak
          </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="group">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.accent}`}>
                  <stat.icon size={16} />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">{stat.change}</span>
              </div>
              <div className="stat-number text-2xl font-semibold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="cursor-pointer group hover:border-border transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color} shrink-0`}>
                  <action.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{action.label}</p>
                  <p className="text-[11px] text-muted-foreground">{action.desc}</p>
                </div>
                <ArrowUpRight size={14} className="text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 size={14} className="text-primary" />
                </div>
                Weekly Activity
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] rounded-lg font-semibold">This Week</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(252, 70%, 58%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(252, 70%, 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(252, 70%, 58%)"
                    strokeWidth={2.5}
                    fill="url(#activityGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Skill Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                <Star size={14} className="text-amber-500" />
              </div>
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={skills.length > 0 ? skills : [{ name: "No data", value: 1, color: "hsl(var(--muted))" }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {(skills.length > 0 ? skills : [{ name: "No data", value: 1, color: "hsl(var(--muted))" }]).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {skills.map((skill) => (
                <div key={skill.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: skill.color }} />
                  <span className="text-muted-foreground/70">{skill.name}</span>
                  <span className="ml-auto font-semibold">{skill.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Progress Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              Monthly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="score" fill="hsl(252, 70%, 58%)" radius={[6, 6, 0, 0]} name="XP" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <Clock size={14} className="text-muted-foreground" />
                </div>
                Recent Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5">
              {activities.length > 0 ? activities.map((activity, i) => {
                const type = (activity.type as string) || "exam";
                const meta = activityIconMap[type] || activityIconMap.exam;
                const Icon = meta.icon;
                return (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${meta.bg} shrink-0`}>
                      <Icon size={14} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate font-medium">{(activity.action || activity.description) as string}</p>
                      <p className="text-[10px] text-muted-foreground/50 font-medium">{timeAgo(activity.createdAt as string)}</p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity yet. Start practicing!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Completion */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Profile Completion</h3>
                <p className="text-xs text-muted-foreground/60">Complete your profile for better recommendations.</p>
              </div>
            </div>
            <span className="stat-number text-3xl text-primary">{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} className="h-2 rounded-full" indicatorClassName="bg-primary rounded-full" />
          <div className="flex flex-wrap gap-2 mt-4">
            {["Add Skills", "Upload Resume", "Link GitHub", "Set Career Goals"].map((task) => (
              <Badge key={task} variant="secondary" className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg text-xs">
                + {task}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
