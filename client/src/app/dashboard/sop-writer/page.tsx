"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText, Loader2, Sparkles, Copy, Check, ChevronRight,
  GraduationCap, Lightbulb, Download, BookOpen, Briefcase,
  Target, Award, Globe, Wand2,
} from "lucide-react";
import { higherEdService } from "@/lib/services";

interface SOPResult {
  sop: string;
  wordCount: number;
  structure: { section: string; summary: string }[];
  tips: string[];
}

const fields = [
  "Computer Science", "Data Science / AI / ML", "Electrical Engineering",
  "Mechanical Engineering", "MBA / Management", "Finance / Economics",
  "Civil Engineering", "Biotechnology", "Physics", "Chemistry",
  "Mathematics", "Law", "Medicine", "Public Policy", "Design",
  "Environmental Science", "Aerospace Engineering",
];

const degrees = ["Bachelors", "Masters", "PhD", "MBA"];

export default function SOPWriterPage() {
  const [form, setForm] = useState({
    university: "",
    program: "",
    degreeLevel: "",
    fieldOfStudy: "",
    academicBackground: "",
    workExperience: "",
    achievements: "",
    whyThisField: "",
    whyThisUniversity: "",
    careerGoals: "",
    wordLimit: 800,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SOPResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const update = (key: string, value: string | number) => setForm((p) => ({ ...p, [key]: value }));

  const handleGenerate = async () => {
    if (!form.university || !form.program || !form.fieldOfStudy) {
      setError("University, program, and field of study are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await higherEdService.generateSOP(form);
      setResult(res.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to generate SOP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.sop) {
      navigator.clipboard.writeText(result.sop);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result?.sop) return;
    const blob = new Blob([result.sop], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SOP_${form.university.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const steps = [
    { title: "Application Details", icon: GraduationCap },
    { title: "Your Background", icon: Briefcase },
    { title: "Motivation & Goals", icon: Target },
  ];

  return (
    <div className="space-y-6 page-enter-stagger">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">SOP Writer</h1>
        <p className="text-muted-foreground/70 text-sm">
          AI-powered Statement of Purpose generator — personalized, authentic, and admission-ready.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <React.Fragment key={idx}>
                  <button
                    onClick={() => setActiveStep(idx)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                      activeStep === idx
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "border-border/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <StepIcon size={13} /> {step.title}
                  </button>
                  {idx < steps.length - 1 && <ChevronRight size={14} className="text-muted-foreground/30" />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step 1: Application Details */}
          {activeStep === 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap size={16} className="text-primary" /> Application Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">University Name *</Label>
                    <Input
                      placeholder="e.g., MIT, Stanford, IIT Bombay, University of Oxford"
                      className="rounded-xl mt-1"
                      value={form.university}
                      onChange={(e) => update("university", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Program / Department *</Label>
                    <Input
                      placeholder="e.g., MS in Computer Science"
                      className="rounded-xl mt-1"
                      value={form.program}
                      onChange={(e) => update("program", e.target.value)}
                    />
                  </div>
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
                    <Label className="text-xs text-muted-foreground">Word Limit</Label>
                    <Input
                      type="number"
                      min={300}
                      max={2000}
                      className="rounded-xl mt-1"
                      value={form.wordLimit}
                      onChange={(e) => update("wordLimit", Number(e.target.value) || 800)}
                    />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => setActiveStep(1)}>
                  Next: Your Background <ChevronRight size={13} />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Background */}
          {activeStep === 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase size={16} className="text-primary" /> Your Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Academic Background</Label>
                  <textarea
                    className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                    placeholder="e.g., B.Tech in Computer Science from XYZ University with 8.5 CGPA. Coursework in ML, algorithms, databases. Final year project on NLP-based sentiment analysis."
                    value={form.academicBackground}
                    onChange={(e) => update("academicBackground", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Work / Research Experience</Label>
                  <textarea
                    className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                    placeholder="e.g., 2 years as SDE at Google working on search infrastructure. Published a paper on distributed caching at SIGMOD."
                    value={form.workExperience}
                    onChange={(e) => update("workExperience", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Key Achievements</Label>
                  <textarea
                    className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[70px]"
                    placeholder="e.g., GATE AIR 150, ACM ICPC finalist, open-source contributor to TensorFlow, Dean's list 3 semesters"
                    value={form.achievements}
                    onChange={(e) => update("achievements", e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl" onClick={() => setActiveStep(0)}>
                    Back
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => setActiveStep(2)}>
                    Next: Motivation <ChevronRight size={13} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Motivation */}
          {activeStep === 2 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target size={16} className="text-primary" /> Motivation & Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Why this field?</Label>
                  <textarea
                    className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[70px]"
                    placeholder="What specifically draws you to this field? Any pivotal moments or experiences?"
                    value={form.whyThisField}
                    onChange={(e) => update("whyThisField", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Why this university?</Label>
                  <textarea
                    className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[70px]"
                    placeholder="Specific professors, labs, research groups, or programs that interest you at this university."
                    value={form.whyThisUniversity}
                    onChange={(e) => update("whyThisUniversity", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Career Goals</Label>
                  <textarea
                    className="w-full mt-1 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[70px]"
                    placeholder="Where do you see yourself in 5-10 years? How does this program help achieve that?"
                    value={form.careerGoals}
                    onChange={(e) => update("careerGoals", e.target.value)}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl" onClick={() => setActiveStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="gradient"
                    className="gap-2 rounded-xl"
                    disabled={loading}
                    onClick={handleGenerate}
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    {loading ? "Generating SOP..." : "Generate SOP"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated SOP */}
          {result && !loading && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText size={16} className="text-primary" /> Your Statement of Purpose
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs" onClick={handleCopy}>
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs" onClick={handleDownload}>
                      <Download size={12} /> Download
                    </Button>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] w-fit">{result.wordCount} words</Badge>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl bg-muted/30 border border-border/30 p-5">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {result.sop.split("\n\n").map((para, i) => (
                      <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-3">{para}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Crafting your personalized SOP...</p>
            </div>
          )}
        </div>

        {/* Right: Structure & Tips */}
        <div className="space-y-4">
          {/* SOP Structure */}
          {result?.structure && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BookOpen size={14} className="text-primary" /> SOP Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {result.structure.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{s.section}</p>
                      <p className="text-[10px] text-muted-foreground">{s.summary}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* AI Tips */}
          {result?.tips && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lightbulb size={14} className="text-amber-400" /> Improvement Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Sparkles size={10} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* General SOP Guide */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Award size={14} className="text-violet-400" /> SOP Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { tip: "Start with a compelling hook — avoid generic openings", icon: "🎯" },
                { tip: "Show, don't tell — use specific examples and numbers", icon: "📊" },
                { tip: "Connect your past → present → future logically", icon: "🔗" },
                { tip: "Research the university — mention specific programs/professors", icon: "🔬" },
                { tip: "Be authentic — admissions can spot generic SOPs instantly", icon: "💎" },
                { tip: "Proofread at least 3 times, get feedback from mentors", icon: "✅" },
                { tip: "Each university SOP should be unique, not copy-pasted", icon: "🎨" },
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-sm">{t.icon}</span>
                  <span>{t.tip}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Word Count Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe size={14} className="text-blue-400" /> Typical Word Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {[
                  { uni: "US Universities", limit: "500–1000 words" },
                  { uni: "UK Universities", limit: "300–500 words" },
                  { uni: "German Universities", limit: "500–750 words" },
                  { uni: "IITs / IISc", limit: "500–800 words" },
                  { uni: "Canadian Unis", limit: "500–750 words" },
                ].map((w) => (
                  <div key={w.uni} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{w.uni}</span>
                    <Badge variant="secondary" className="text-[10px]">{w.limit}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
