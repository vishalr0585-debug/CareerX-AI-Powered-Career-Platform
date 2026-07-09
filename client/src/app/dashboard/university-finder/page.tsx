"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap, Search, Loader2, MapPin, Trophy, DollarSign,
  Target, Star, Shield, Lightbulb, ExternalLink, ChevronRight,
  Globe, BookOpen, Calendar, Award, TrendingUp,
} from "lucide-react";
import { higherEdService } from "@/lib/services";

interface University {
  name: string;
  location: string;
  ranking: string;
  category: "Dream" | "Target" | "Safe";
  tuitionRange: string;
  acceptanceRate: string;
  strengths: string[];
  programs: string[];
  scholarships: string[];
  deadline: string;
  tip: string;
}

interface RecommendationResult {
  recommendations: University[];
  advice: string;
}

const exams = [
  "GATE", "CAT", "GRE", "GMAT", "IELTS", "TOEFL", "UPSC", "SAT", "ACT",
  "NEET PG", "CLAT", "XAT", "MAT", "CMAT", "NMAT", "SNAP",
];

const countries = [
  "India", "USA", "UK", "Canada", "Australia", "Germany", "Singapore",
  "Ireland", "Netherlands", "France", "Japan", "South Korea", "Any",
];

const fields = [
  "Computer Science", "Data Science / AI / ML", "Electrical Engineering",
  "Mechanical Engineering", "MBA / Management", "Finance / Economics",
  "Civil Engineering", "Biotechnology", "Physics", "Chemistry",
  "Mathematics", "Law", "Medicine", "Public Policy", "Design",
  "Environmental Science", "Aerospace Engineering",
];

const degrees = ["Bachelors", "Masters", "PhD", "MBA", "Diploma"];

const categoryConfig: Record<string, { color: string; icon: typeof Star; bg: string }> = {
  Dream: { color: "text-amber-400", icon: Star, bg: "bg-amber-500/10 border-amber-500/20" },
  Target: { color: "text-blue-400", icon: Target, bg: "bg-blue-500/10 border-blue-500/20" },
  Safe: { color: "text-emerald-400", icon: Shield, bg: "bg-emerald-500/10 border-emerald-500/20" },
};

export default function UniversityFinderPage() {
  const [form, setForm] = useState({
    exam: "",
    score: "",
    country: "",
    budget: "",
    fieldOfStudy: "",
    degreeLevel: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState("");

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSearch = async () => {
    if (!form.exam || !form.fieldOfStudy) {
      setError("Please select at least an exam and field of study.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await higherEdService.getUniversityRecommendations(form);
      setResult(res.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to get recommendations.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const dreamCount = result?.recommendations.filter((u) => u.category === "Dream").length || 0;
  const targetCount = result?.recommendations.filter((u) => u.category === "Target").length || 0;
  const safeCount = result?.recommendations.filter((u) => u.category === "Safe").length || 0;

  return (
    <div className="space-y-6 page-enter-stagger">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">University Finder</h1>
        <p className="text-muted-foreground/70 text-sm">
          AI-powered university recommendations based on your exam, score, and preferences.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Search size={15} className="text-primary" />
            </div>
            Tell us about your goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Exam */}
            <div>
              <Label className="text-xs text-muted-foreground">Exam *</Label>
              <select
                className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.exam}
                onChange={(e) => update("exam", e.target.value)}
              >
                <option value="">Select exam</option>
                {exams.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            {/* Score */}
            <div>
              <Label className="text-xs text-muted-foreground">Score / Rank / Percentile</Label>
              <Input
                placeholder="e.g., 320/340, 98 percentile, AIR 500"
                className="rounded-xl mt-1"
                value={form.score}
                onChange={(e) => update("score", e.target.value)}
              />
            </div>

            {/* Field */}
            <div>
              <Label className="text-xs text-muted-foreground">Field of Study *</Label>
              <select
                className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.fieldOfStudy}
                onChange={(e) => update("fieldOfStudy", e.target.value)}
              >
                <option value="">Select field</option>
                {fields.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Degree */}
            <div>
              <Label className="text-xs text-muted-foreground">Degree Level</Label>
              <select
                className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.degreeLevel}
                onChange={(e) => update("degreeLevel", e.target.value)}
              >
                <option value="">Select level</option>
                {degrees.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div>
              <Label className="text-xs text-muted-foreground">Preferred Country</Label>
              <select
                className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              >
                <option value="">Any country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div>
              <Label className="text-xs text-muted-foreground">Annual Budget (optional)</Label>
              <Input
                placeholder="e.g., $30,000 or ₹5 lakhs"
                className="rounded-xl mt-1"
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            variant="gradient"
            className="gap-2 rounded-xl"
            disabled={loading}
            onClick={handleSearch}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? "Finding Universities..." : "Find Universities"}
          </Button>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">AI is analyzing universities matching your profile...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="gap-1.5 rounded-lg px-3 py-1.5">
              <GraduationCap size={13} /> {result.recommendations.length} Universities Found
            </Badge>
            <Badge className="gap-1 rounded-lg px-3 py-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20">
              <Star size={11} /> {dreamCount} Dream
            </Badge>
            <Badge className="gap-1 rounded-lg px-3 py-1.5 bg-blue-500/10 text-blue-400 border-blue-500/20">
              <Target size={11} /> {targetCount} Target
            </Badge>
            <Badge className="gap-1 rounded-lg px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <Shield size={11} /> {safeCount} Safe
            </Badge>
          </div>

          {/* Advice */}
          {result.advice && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-start gap-3">
                <Lightbulb size={18} className="text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{result.advice}</p>
              </CardContent>
            </Card>
          )}

          {/* University Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {result.recommendations.map((uni, idx) => {
              const cat = categoryConfig[uni.category] || categoryConfig.Target;
              const CatIcon = cat.icon;
              return (
                <Card key={idx} className="hover-lift group overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base group-hover:text-primary transition-colors">
                          {uni.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <MapPin size={11} /> {uni.location}
                        </div>
                      </div>
                      <Badge className={`gap-1 shrink-0 rounded-lg ${cat.bg}`}>
                        <CatIcon size={11} className={cat.color} />
                        <span className={cat.color}>{uni.category}</span>
                      </Badge>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <Trophy size={12} className="text-amber-400 mx-auto mb-1" />
                        <p className="text-[10px] text-muted-foreground">Ranking</p>
                        <p className="text-xs font-bold">{uni.ranking}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <DollarSign size={12} className="text-emerald-400 mx-auto mb-1" />
                        <p className="text-[10px] text-muted-foreground">Tuition</p>
                        <p className="text-xs font-bold">{uni.tuitionRange}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <TrendingUp size={12} className="text-blue-400 mx-auto mb-1" />
                        <p className="text-[10px] text-muted-foreground">Acceptance</p>
                        <p className="text-xs font-bold">{uni.acceptanceRate}</p>
                      </div>
                    </div>

                    {/* Strengths */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Strengths</p>
                      <div className="flex flex-wrap gap-1">
                        {uni.strengths?.map((s) => (
                          <span key={s} className="text-[10px] bg-primary/10 text-primary rounded-md px-2 py-0.5">{s}</span>
                        ))}
                      </div>
                    </div>

                    {/* Programs */}
                    {uni.programs?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Relevant Programs</p>
                        <div className="flex flex-wrap gap-1">
                          {uni.programs.map((p) => (
                            <span key={p} className="text-[10px] bg-muted rounded-md px-2 py-0.5 text-muted-foreground">{p}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scholarships */}
                    {uni.scholarships?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          <Award size={10} className="inline mr-1" />Scholarships Available
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {uni.scholarships.map((s) => (
                            <span key={s} className="text-[10px] bg-emerald-500/10 text-emerald-400 rounded-md px-2 py-0.5">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deadline & Tip */}
                    <div className="flex items-start gap-3 pt-2 border-t border-border/30">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                        <Calendar size={11} />
                        <span>Deadline: <strong className="text-foreground">{uni.deadline}</strong></span>
                      </div>
                    </div>
                    {uni.tip && (
                      <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-2.5">
                        <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                          <Lightbulb size={11} className="text-amber-400 shrink-0 mt-0.5" />
                          {uni.tip}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Cards when no results */}
      {!result && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover-lift">
            <CardContent className="p-5 text-center space-y-2">
              <Globe size={28} className="text-blue-400 mx-auto" />
              <h3 className="font-bold text-sm">Global Coverage</h3>
              <p className="text-xs text-muted-foreground">Universities from India, USA, UK, Canada, Germany, Australia, and more.</p>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-5 text-center space-y-2">
              <Target size={28} className="text-violet-400 mx-auto" />
              <h3 className="font-bold text-sm">Smart Categorization</h3>
              <p className="text-xs text-muted-foreground">Dream, Target, and Safe universities based on your profile strength.</p>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-5 text-center space-y-2">
              <BookOpen size={28} className="text-emerald-400 mx-auto" />
              <h3 className="font-bold text-sm">Scholarship Info</h3>
              <p className="text-xs text-muted-foreground">Available scholarships, deadlines, and admission tips for each university.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
