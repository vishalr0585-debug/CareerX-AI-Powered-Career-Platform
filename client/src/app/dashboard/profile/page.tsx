"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail, MapPin, Calendar, Github, Linkedin, Globe, Edit3,
  Trophy, Flame, Zap, TrendingUp, Star, Clock, Award,
  Save, X, Loader2, Phone, Briefcase, FileText,
  Camera, Upload, Download, Trash2, Sparkles, ExternalLink, Search,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { useAuthStore } from "@/stores/authStore";
import { userService, type User } from "@/lib/services";

const getColor = (value: number) => {
  if (value === 0) return "bg-muted/50";
  if (value === 1) return "bg-primary/20";
  if (value === 2) return "bg-primary/40";
  if (value === 3) return "bg-primary/60";
  return "bg-primary/80";
};

const tierLabels: Record<string, string> = {
  free: "Free Member",
  pro: "Pro Member",
  enterprise: "Enterprise",
};

interface Achievement {
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number;
  target?: number;
}

interface HeatmapCell {
  date: string;
  count: number;
}

interface XPMonth {
  month: string;
  xp: number;
}

interface JobSuggestion {
  title: string;
  company_examples: string[];
  match_reason: string;
  matching_skills: string[];
  skills_to_learn: string[];
  salary_range: string;
  demand_level: string;
  search_query: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [xpHistory, setXpHistory] = useState<XPMonth[]>([]);

  // Avatar & Resume upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeDeleting, setResumeDeleting] = useState(false);

  // AI Job Suggestions state
  const [jobSuggestions, setJobSuggestions] = useState<JobSuggestion[]>([]);
  const [careerSummary, setCareerSummary] = useState("");
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  // Cache-bust key for avatar (avoid SSR/CSR Date.now() mismatch)
  const [avatarKey, setAvatarKey] = useState(0);

  // Edit form state
  const [formData, setFormData] = useState({
    fullName: "",
    jobTitle: "",
    location: "",
    bio: "",
    phone: "",
    skills: "",
    github: "",
    linkedin: "",
    website: "",
    twitter: "",
  });

  // Load profile data
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userService.getProfile();
      const u = res.data.user;
      setProfile(u);
      setFormData({
        fullName: u.fullName || "",
        jobTitle: u.jobTitle || "",
        location: u.location || "",
        bio: u.bio || "",
        phone: u.phone || "",
        skills: (u.skills || []).join(", "),
        github: u.socialLinks?.github || "",
        linkedin: u.socialLinks?.linkedin || "",
        website: u.socialLinks?.website || "",
        twitter: u.socialLinks?.twitter || "",
      });
    } catch {
      // If no token, profile stays null
    } finally {
      setLoading(false);
    }
  }, []);

  // Load achievements, heatmap, XP history
  const loadExtras = useCallback(async () => {
    try {
      const [achRes, heatRes, xpRes] = await Promise.allSettled([
        userService.getAchievements(),
        userService.getActivityHeatmap(),
        userService.getXPHistory(6),
      ]);

      if (achRes.status === "fulfilled") {
        setAchievements(achRes.value.data?.achievements || []);
      }
      if (heatRes.status === "fulfilled") {
        const raw = heatRes.value.data?.heatmap;
        // Backend returns object { "2026-01-15": { count, xp } }, convert to array
        if (raw && !Array.isArray(raw)) {
          const arr = Object.entries(raw).map(([date, val]: [string, unknown]) => ({
            date,
            count: (val as { count: number }).count || 0,
          }));
          setHeatmap(arr);
        } else {
          setHeatmap(raw || []);
        }
      }
      if (xpRes.status === "fulfilled") {
        setXpHistory(xpRes.value.data?.xpHistory || []);
      }
    } catch {
      // Silently fail for supplementary data
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadExtras();
  }, [loadProfile, loadExtras]);

  // Save profile
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      const updates = {
        fullName: formData.fullName,
        jobTitle: formData.jobTitle,
        location: formData.location,
        bio: formData.bio,
        phone: formData.phone,
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        socialLinks: {
          github: formData.github,
          linkedin: formData.linkedin,
          website: formData.website,
          twitter: formData.twitter,
        },
      };

      const res = await userService.updateProfile(updates);
      const updatedUser = res.data.user;
      setProfile(updatedUser);
      setUser(updatedUser);
      setIsEditing(false);
      setSaveMessage("Profile saved!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to save. Please try again.");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        jobTitle: profile.jobTitle || "",
        location: profile.location || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        skills: (profile.skills || []).join(", "),
        github: profile.socialLinks?.github || "",
        linkedin: profile.socialLinks?.linkedin || "",
        website: profile.socialLinks?.website || "",
        twitter: profile.socialLinks?.twitter || "",
      });
    }
    setIsEditing(false);
  };

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveMessage("Please select an image file.");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }
    setAvatarUploading(true);
    try {
      const res = await userService.uploadAvatar(file);
      const updatedUser = res.data.user;
      setProfile(updatedUser);
      setUser(updatedUser);
      setAvatarKey((k) => k + 1);
      setSaveMessage("Avatar updated!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to upload avatar.");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // Resume upload handler
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    try {
      const res = await userService.uploadProfileResume(file);
      const updatedUser = res.data.user;
      setProfile(updatedUser);
      setUser(updatedUser);
      setSaveMessage("Resume uploaded!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to upload resume.");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setResumeUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  // Resume delete handler
  const handleResumeDelete = async () => {
    setResumeDeleting(true);
    try {
      const res = await userService.deleteProfileResume();
      const updatedUser = res.data.user;
      setProfile(updatedUser);
      setUser(updatedUser);
      setSaveMessage("Resume removed.");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to remove resume.");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setResumeDeleting(false);
    }
  };

  // AI Job Suggestions
  const loadJobSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const res = await userService.getAIJobSuggestions();
      setJobSuggestions(res.data.suggestions || []);
      setCareerSummary(res.data.careerSummary || "");
      setSuggestionsLoaded(true);
    } catch {
      setSaveMessage("Failed to load job suggestions.");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const p = profile || user;
  const joinDate = p?.createdAt
    ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  // Build heatmap grid (52 weeks x 7 days)
  const heatmapGrid = React.useMemo(() => {
    const grid: number[][] = Array.from({ length: 52 }, () => Array(7).fill(0));
    if (heatmap.length > 0) {
      heatmap.forEach((cell) => {
        const d = new Date(cell.date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 364) {
          const weekIdx = 51 - Math.floor(diffDays / 7);
          const dayIdx = d.getDay();
          if (weekIdx >= 0 && weekIdx < 52) {
            grid[weekIdx][dayIdx] = Math.min(cell.count, 4);
          }
        }
      });
    }
    return grid;
  }, [heatmap]);

  const activeDays = heatmap.filter((c) => c.count > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
        <Button onClick={() => (window.location.href = "/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter-stagger">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Profile & Analytics</h1>
        {saveMessage && (
          <Badge variant={saveMessage.includes("Failed") ? "destructive" : "default"} className="rounded-lg animate-in fade-in">
            {saveMessage}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <Card className="lg:row-span-2 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(238,70%,65%)] to-[hsl(var(--chart-4))]" />
          <CardContent className="p-6 relative pt-14">
            {isEditing ? (
              /* ── EDIT MODE ── */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">Edit Profile</h3>
                  <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8 rounded-xl">
                    <X size={16} />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fullName" className="text-xs text-muted-foreground mb-1">Full Name</Label>
                    <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="jobTitle" className="text-xs text-muted-foreground mb-1">Job Title</Label>
                    <Input id="jobTitle" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} placeholder="e.g. Full Stack Developer" className="rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-xs text-muted-foreground mb-1">Location</Label>
                    <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Chennai, India" className="rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="bio" className="text-xs text-muted-foreground mb-1">Bio</Label>
                    <textarea id="bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell us about yourself..." className="w-full min-h-[80px] rounded-xl border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-xs text-muted-foreground mb-1">Phone</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" className="rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="skills" className="text-xs text-muted-foreground mb-1">Skills (comma separated)</Label>
                    <Input id="skills" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} placeholder="JavaScript, React, Node.js" className="rounded-xl" />
                  </div>

                  <div className="pt-2 border-t border-border/30">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Social Links</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Github size={14} className="shrink-0 text-muted-foreground" />
                        <Input value={formData.github} onChange={(e) => setFormData({ ...formData, github: e.target.value })} placeholder="https://github.com/username" className="rounded-xl text-xs h-8" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Linkedin size={14} className="shrink-0 text-muted-foreground" />
                        <Input value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} placeholder="https://linkedin.com/in/username" className="rounded-xl text-xs h-8" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="shrink-0 text-muted-foreground" />
                        <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://yourwebsite.com" className="rounded-xl text-xs h-8" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="rounded-xl">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* ── VIEW MODE ── */
              <div className="flex flex-col items-center text-center">
                {/* Avatar with upload overlay */}
                <div className="relative group cursor-pointer mb-4" onClick={() => avatarInputRef.current?.click()}>
                  <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
                    {p.avatar && (
                      <AvatarImage
                        src={`${p.avatar.startsWith("http") ? p.avatar : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || ""}${p.avatar}`}${avatarKey ? `?v=${avatarKey}` : ""}`}
                        alt={p.fullName}
                      />
                    )}
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(238,70%,65%)] text-white font-black">
                      {p.initials || p.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {avatarUploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>
                <h2 className="text-xl font-black">{p.fullName}</h2>
                <p className="text-sm text-muted-foreground/60">{p.jobTitle || "No title set"}</p>

                {p.bio && <p className="text-xs text-muted-foreground/50 mt-2 leading-relaxed">{p.bio}</p>}

                <div className="flex gap-2 mt-3">
                  <Badge className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(238,70%,65%)] text-white border-0 shadow-sm">
                    {tierLabels[p.membershipTier] || "Free Member"}
                  </Badge>
                  {p.loginStreak > 0 && (
                    <Badge variant="outline" className="gap-1 border-orange-500/20 text-orange-500 rounded-lg">
                      <Flame size={11} /> {p.loginStreak} day{p.loginStreak !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                <Button variant="outline" size="sm" className="mt-4 w-full gap-2 rounded-xl" onClick={() => setIsEditing(true)}>
                  <Edit3 size={13} /> Edit Profile
                </Button>

                {p.skills && p.skills.length > 0 && (
                  <div className="w-full mt-4 flex flex-wrap gap-1.5 justify-center">
                    {p.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-[10px] rounded-lg">{skill}</Badge>
                    ))}
                  </div>
                )}

                <div className="w-full mt-5 space-y-3 text-left text-sm">
                  {[
                    { icon: Mail, text: p.email, show: true },
                    { icon: MapPin, text: p.location, show: !!p.location },
                    { icon: Phone, text: p.phone, show: !!p.phone },
                    { icon: Calendar, text: `Joined ${joinDate}`, show: !!joinDate },
                    { icon: Github, text: p.socialLinks?.github, show: !!p.socialLinks?.github },
                    { icon: Linkedin, text: p.socialLinks?.linkedin, show: !!p.socialLinks?.linkedin },
                    { icon: Globe, text: p.socialLinks?.website, show: !!p.socialLinks?.website },
                  ]
                    .filter((item) => item.show)
                    .map((item) => (
                      <div key={item.text} className="flex items-center gap-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                        <item.icon size={14} className="shrink-0" />
                        <span className="truncate">{item.text}</span>
                      </div>
                    ))}
                </div>

                <div className="w-full mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Profile Completion</span>
                    <span className="font-bold text-primary">{p.profileCompletion}%</span>
                  </div>
                  <Progress value={p.profileCompletion} className="h-2 rounded-full" indicatorClassName="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(238,70%,65%)] rounded-full" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Score", value: p.activeScore?.toLocaleString() || "0", icon: Zap, gradient: "from-violet-500 to-purple-600" },
            { label: "Login Streak", value: `${p.loginStreak || 0} day${(p.loginStreak || 0) !== 1 ? "s" : ""}`, icon: Flame, gradient: "from-orange-500 to-amber-500" },
            { label: "Global Rank", value: p.globalRank ? `#${p.globalRank}` : "—", icon: Trophy, gradient: "from-amber-500 to-yellow-500" },
            { label: "Total XP", value: p.totalXP?.toLocaleString() || "0", icon: Star, gradient: "from-pink-500 to-rose-500" },
          ].map((stat) => (
            <Card key={stat.label} className="hover-lift">
              <CardContent className="p-4 text-center">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white mb-2 shadow-sm`}>
                  <stat.icon size={17} />
                </div>
                <div className="stat-number text-xl">{stat.value}</div>
                <p className="text-[10px] text-muted-foreground/50 font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* XP Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp size={14} className="text-primary" />
              </div>
              XP Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {xpHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={xpHistory}>
                    <defs>
                      <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(252, 70%, 58%)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(252, 70%, 58%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="xp" stroke="hsl(252, 70%, 58%)" strokeWidth={2.5} fill="url(#xpGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm">
                  <div className="text-center">
                    <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
                    <p>XP history will appear as you use the platform</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Problems Solved", value: p.problemsSolved || 0, icon: Briefcase },
          { label: "Interviews Done", value: p.interviewsCompleted || 0, icon: FileText },
          { label: "Resumes Created", value: p.resumesCreated || 0, icon: FileText },
          { label: "Jobs Applied", value: p.jobsApplied || 0, icon: Briefcase },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <stat.icon size={15} className="text-muted-foreground" />
              </div>
              <div>
                <div className="text-lg font-bold">{stat.value}</div>
                <p className="text-[10px] text-muted-foreground/50 font-medium">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resume on Profile */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                <FileText size={14} className="text-blue-500" />
              </div>
              Profile Resume
            </CardTitle>
            <Button size="sm" variant="outline" className="rounded-xl gap-2" onClick={() => resumeInputRef.current?.click()} disabled={resumeUploading}>
              {resumeUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {p?.profileResume?.filePath ? "Replace" : "Upload"}
            </Button>
            <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleResumeUpload} />
          </div>
        </CardHeader>
        <CardContent>
          {p?.profileResume?.filePath ? (
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{p.profileResume.fileName || "Resume"}</p>
                  <p className="text-[10px] text-muted-foreground/50">
                    Uploaded {p.profileResume.uploadedAt ? new Date(p.profileResume.uploadedAt).toLocaleDateString() : "recently"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:text-blue-500" asChild>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || ""}${p.profileResume.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download size={14} />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive" onClick={handleResumeDelete} disabled={resumeDeleting}>
                  {resumeDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground/40 border border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/30 hover:bg-muted/20 transition-colors"
              onClick={() => resumeInputRef.current?.click()}>
              <Upload size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Upload your resume</p>
              <p className="text-[10px] mt-1">PDF, DOC, DOCX, or TXT — Max 10MB</p>
              <p className="text-[10px] text-muted-foreground/30 mt-1">Visible to visitors on your profile</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Job Suggestions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10">
                <Sparkles size={14} className="text-violet-500" />
              </div>
              AI Job Suggestions
            </CardTitle>
            <Button
              size="sm"
              className="rounded-xl gap-2 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
              onClick={loadJobSuggestions}
              disabled={suggestionsLoading}
            >
              {suggestionsLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {suggestionsLoaded ? "Refresh" : "Get Suggestions"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {suggestionsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={28} className="animate-spin text-violet-500" />
              <p className="text-sm text-muted-foreground/60">Analyzing your profile & skills...</p>
            </div>
          ) : jobSuggestions.length > 0 ? (
            <div className="space-y-4">
              {careerSummary && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/5 to-pink-500/5 border border-violet-500/10">
                  <p className="text-sm text-muted-foreground">{careerSummary}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {jobSuggestions.map((job, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm leading-tight">{job.title}</h4>
                      <Badge
                        variant={job.demand_level === "high" ? "default" : "secondary"}
                        className={`text-[9px] shrink-0 rounded-lg ${
                          job.demand_level === "high" ? "bg-green-500/10 text-green-600 border-green-500/20" : ""
                        }`}
                      >
                        {job.demand_level} demand
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground/60 leading-relaxed">{job.match_reason}</p>

                    {job.salary_range && (
                      <p className="text-xs font-semibold text-primary">{job.salary_range}</p>
                    )}

                    {job.matching_skills?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground/40 font-medium mb-1">Your matching skills</p>
                        <div className="flex flex-wrap gap-1">
                          {job.matching_skills.map((s) => (
                            <Badge key={s} variant="secondary" className="text-[9px] rounded-md bg-green-500/5 text-green-600 border-green-500/15">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {job.skills_to_learn?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground/40 font-medium mb-1">Skills to learn</p>
                        <div className="flex flex-wrap gap-1">
                          {job.skills_to_learn.map((s) => (
                            <Badge key={s} variant="outline" className="text-[9px] rounded-md border-amber-500/20 text-amber-600">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {job.company_examples?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/40">
                        <span className="font-medium">Companies:</span> {job.company_examples.join(", ")}
                      </p>
                    )}

                    {job.search_query && (
                      <Button variant="ghost" size="sm" className="w-full mt-1 rounded-xl text-xs gap-1.5 h-8" asChild>
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(job.search_query + " jobs")}`} target="_blank" rel="noopener noreferrer">
                          <Search size={11} /> Search Jobs <ExternalLink size={10} />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground/40">
              <Sparkles size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Get AI-powered job recommendations</p>
              <p className="text-[11px] mt-1 max-w-md mx-auto">Based on your skills, resume, and profile — our AI will suggest the best roles for you with salary insights and company matches.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Clock size={14} className="text-muted-foreground" />
              </div>
              Activity Timeline
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] rounded-lg font-semibold">{activeDays} active day{activeDays !== 1 ? "s" : ""}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex gap-[3px] min-w-[700px]">
              {heatmapGrid.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {week.map((value, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`w-[11px] h-[11px] rounded-sm ${getColor(value)} transition-colors`}
                      title={`Activity level: ${value}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-[10px] text-muted-foreground/50 justify-end font-medium">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((v) => (
              <div key={v} className={`w-[11px] h-[11px] rounded-sm ${getColor(v)}`} />
            ))}
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Award size={14} className="text-amber-500" />
            </div>
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {achievements.map((a) => (
                <div
                  key={a.title}
                  className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 ${
                    a.earned ? "bg-primary/5 border-primary/15 hover-lift" : "opacity-30 grayscale border-border/30"
                  }`}
                >
                  <span className="text-3xl mb-2">{a.icon}</span>
                  <p className="text-xs font-bold">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">{a.description}</p>
                  {!a.earned && a.progress !== undefined && a.target !== undefined && (
                    <div className="w-full mt-2">
                      <Progress value={(a.progress / a.target) * 100} className="h-1 rounded-full" />
                      <p className="text-[9px] text-muted-foreground/40 mt-0.5">{a.progress}/{a.target}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground/40">
              <Award size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Achievements will unlock as you use the platform</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
