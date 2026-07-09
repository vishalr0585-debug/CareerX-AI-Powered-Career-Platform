"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Award, Search, Loader2, DollarSign, Globe, ExternalLink,
  Lightbulb, ChevronRight, Calendar, GraduationCap,
  Star, Shield, TrendingUp, Filter,
} from "lucide-react";
import { higherEdService } from "@/lib/services";

interface Scholarship {
  name: string;
  provider: string;
  amount: string;
  type: string;
  eligibility: string[];
  deadline: string;
  country: string;
  url: string;
  difficulty: "High" | "Medium" | "Low";
  tip: string;
}

interface ScholarshipResult {
  scholarships: Scholarship[];
  strategy: string;
}

const fields = [
  "Computer Science", "Data Science / AI / ML", "Electrical Engineering",
  "Mechanical Engineering", "MBA / Management", "Finance / Economics",
  "Civil Engineering", "Biotechnology", "Physics", "Chemistry",
  "Mathematics", "Law", "Medicine", "Public Policy", "Design",
  "Environmental Science", "Aerospace Engineering", "Humanities / Arts",
];

const degrees = ["Bachelors", "Masters", "PhD", "MBA", "Diploma"];
const nationalities = ["Indian", "American", "British", "Canadian", "Other"];
const meritLevels = ["Outstanding (Top 5%)", "Excellent (Top 15%)", "Good (Top 30%)", "Average"];
const needLevels = ["Full funding needed", "High (75%+ needed)", "Moderate (50% needed)", "Low (25% supplement)", "Not needed"];

const difficultyConfig: Record<string, { color: string; bg: string }> = {
  High: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  Medium: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  Low: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

const typeColors: Record<string, string> = {
  Merit: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Need: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Government: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Country-specific": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Field-specific": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  University: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

export default function ScholarshipFinderPage() {
  const [form, setForm] = useState({
    exam: "",
    nationality: "",
    fieldOfStudy: "",
    degreeLevel: "",
    financialNeed: "",
    meritLevel: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScholarshipResult | null>(null);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("All");

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSearch = async () => {
    if (!form.fieldOfStudy) {
      setError("Please select a field of study.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await higherEdService.getScholarshipRecommendations(form);
      setResult(res.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to find scholarships.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const types = result
    ? ["All", ...Array.from(new Set(result.scholarships.map((s) => s.type)))]
    : [];
  const filtered = result?.scholarships.filter(
    (s) => filterType === "All" || s.type === filterType
  ) || [];

  return (
    <div className="space-y-6 page-enter-stagger">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Scholarship Finder</h1>
        <p className="text-muted-foreground/70 text-sm">
          Discover real scholarships matching your profile — merit-based, need-based, government, and more.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
              <Search size={15} className="text-amber-400" />
            </div>
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Field of Study *</Label>
              <select
                className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.fieldOfStudy}
                onChange={(e) => update("fieldOfStudy", e.target.value)}
              >
                <option value="">Select field</option>
                {fields.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Degree Level</Label>
              <select
                className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.degreeLevel}
                onChange={(e) => update("degreeLevel", e.target.value)}
              >
                <option value="">Select level</option>
                {degrees.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nationality</Label>
              <select
                className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.nationality}
                onChange={(e) => update("nationality", e.target.value)}
              >
                <option value="">Select nationality</option>
                {nationalities.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Exam Taken (optional)</Label>
              <Input
                placeholder="e.g., GRE, GATE, CAT"
                className="rounded-xl mt-1"
                value={form.exam}
                onChange={(e) => update("exam", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Academic Merit</Label>
              <select
                className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.meritLevel}
                onChange={(e) => update("meritLevel", e.target.value)}
              >
                <option value="">Select level</option>
                {meritLevels.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Financial Need</Label>
              <select
                className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.financialNeed}
                onChange={(e) => update("financialNeed", e.target.value)}
              >
                <option value="">Select need level</option>
                {needLevels.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button variant="gradient" className="gap-2 rounded-xl" disabled={loading} onClick={handleSearch}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? "Finding Scholarships..." : "Find Scholarships"}
          </Button>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Searching scholarship databases...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Strategy Advice */}
          {result.strategy && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4 flex items-start gap-3">
                <Lightbulb size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-400 mb-1">Scholarship Strategy</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.strategy}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Type Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-muted-foreground" />
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                  filterType === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {t}
              </button>
            ))}
            <Badge variant="secondary" className="text-[10px] ml-auto">{filtered.length} scholarships</Badge>
          </div>

          {/* Scholarship Cards */}
          <div className="space-y-4">
            {filtered.map((sch, idx) => {
              const diff = difficultyConfig[sch.difficulty] || difficultyConfig.Medium;
              const typeColor = typeColors[sch.type] || "bg-muted text-muted-foreground border-border/40";
              return (
                <Card key={idx} className="hover-lift group overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base group-hover:text-primary transition-colors">{sch.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{sch.provider}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Badge className={`text-[10px] ${typeColor}`}>{sch.type}</Badge>
                        <Badge className={`text-[10px] ${diff.bg}`}>
                          <span className={diff.color}>{sch.difficulty}</span>
                        </Badge>
                      </div>
                    </div>

                    {/* Amount & Details */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2.5 text-center">
                        <DollarSign size={14} className="text-emerald-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-emerald-400">{sch.amount}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                        <Globe size={14} className="text-blue-400 mx-auto mb-1" />
                        <p className="text-xs font-bold">{sch.country}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                        <Calendar size={14} className="text-amber-400 mx-auto mb-1" />
                        <p className="text-xs font-bold">{sch.deadline}</p>
                      </div>
                    </div>

                    {/* Eligibility */}
                    {sch.eligibility?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Eligibility</p>
                        <ul className="space-y-1">
                          {sch.eligibility.map((e, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                              <ChevronRight size={10} className="text-primary shrink-0 mt-0.5" />{e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tip */}
                    {sch.tip && (
                      <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5">
                        <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                          <Lightbulb size={11} className="text-primary shrink-0 mt-0.5" />
                          <span><strong className="text-primary">Tip:</strong> {sch.tip}</span>
                        </p>
                      </div>
                    )}

                    {/* Link */}
                    {sch.url && (
                      <a href={sch.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                        <ExternalLink size={11} /> Visit Official Page
                      </a>
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
              <Award size={28} className="text-amber-400 mx-auto" />
              <h3 className="font-bold text-sm">Merit Scholarships</h3>
              <p className="text-xs text-muted-foreground">Academic excellence awards from top universities and organizations worldwide.</p>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-5 text-center space-y-2">
              <Shield size={28} className="text-emerald-400 mx-auto" />
              <h3 className="font-bold text-sm">Government Funded</h3>
              <p className="text-xs text-muted-foreground">INSPIRE, Fulbright, Chevening, DAAD, and other national programs.</p>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-5 text-center space-y-2">
              <Star size={28} className="text-violet-400 mx-auto" />
              <h3 className="font-bold text-sm">Full Ride Options</h3>
              <p className="text-xs text-muted-foreground">Fully funded programs covering tuition, living, and travel expenses.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
