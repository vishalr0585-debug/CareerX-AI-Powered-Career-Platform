"use client";

import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, CheckCircle2, AlertTriangle, XCircle, Upload,
  Zap, Target, RotateCcw, Loader2, Copy, FileUp, Sparkles,
  TrendingUp, Download, Eye, EyeOff,
} from "lucide-react";
import { resumeService } from "@/lib/services";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScoreBreakdown {
  keywords: number;
  formatting: number;
  sections: number;
  readability: number;
}

interface AnalysisResult {
  atsScore: number;
  breakdown: ScoreBreakdown;
  suggestions: string[];
  foundKeywords: string[];
  missingKeywords: string[];
  wordCount: number;
  originalText: string;
  improvedResume: string;
  improvementNotes: string[];
  overallVerdict: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

function getScoreGradient(score: number) {
  if (score >= 80) return "from-green-500 to-emerald-400";
  if (score >= 60) return "from-yellow-500 to-amber-400";
  return "from-red-500 to-orange-400";
}

function getBarColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function getScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Work";
  return "Poor";
}

function parseSuggestion(text: string) {
  if (text.startsWith("✅")) return { type: "success" as const, text: text.replace(/^✅\s*/, "") };
  if (text.startsWith("❌")) return { type: "error" as const, text: text.replace(/^❌\s*/, "") };
  return { type: "warning" as const, text: text.replace(/^⚠️\s*/, "") };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ATSAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag & drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && (dropped.type === "application/pdf" || dropped.name.endsWith(".txt"))) {
      setFile(dropped);
      setError("");
    } else {
      setError("Please upload a PDF or TXT file.");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError("");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const res = await resumeService.uploadAndAnalyze(file, jobDescription || undefined);
      const d = res.data;
      setResult({
        atsScore: d.atsScore ?? 0,
        breakdown: {
          keywords: d.breakdown?.keywords ?? 0,
          formatting: d.breakdown?.formatting ?? 0,
          sections: d.breakdown?.sections ?? 0,
          readability: d.breakdown?.readability ?? 0,
        },
        suggestions: d.suggestions ?? [],
        foundKeywords: d.foundKeywords ?? [],
        missingKeywords: d.missingKeywords ?? [],
        wordCount: d.wordCount ?? 0,
        originalText: d.originalText ?? "",
        improvedResume: d.improvedResume ?? "",
        improvementNotes: d.improvementNotes ?? [],
        overallVerdict: d.overallVerdict ?? "",
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setError("");
    setJobDescription("");
    setShowOriginal(false);
    setCopied(false);
  };

  const handleCopyImproved = () => {
    if (result?.improvedResume) {
      navigator.clipboard.writeText(result.improvedResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadImproved = () => {
    if (!result?.improvedResume) return;
    const blob = new Blob([result.improvedResume], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "improved-resume.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const breakdownRows = result
    ? [
        { category: "Keyword Matching", score: result.breakdown.keywords, icon: Target },
        { category: "Formatting & Contact", score: result.breakdown.formatting, icon: FileText },
        { category: "Section Structure", score: result.breakdown.sections, icon: CheckCircle2 },
        { category: "Readability & Depth", score: result.breakdown.readability, icon: TrendingUp },
      ]
    : [];

  const parsedSuggestions = result?.suggestions?.map(parseSuggestion) ?? [];

  // ── Upload screen ──
  if (!result) {
    return (
      <div className="space-y-6 page-enter-stagger">
        <div>
          <h1 className="text-3xl font-black tracking-tight">ATS Resume Analyzer</h1>
          <p className="text-muted-foreground/70">Upload your resume for a deep AI-powered ATS analysis with honest scoring, actionable insights, and a professionally rewritten version.</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Upload Zone */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : file
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {file ? (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
                      <FileText size={28} className="text-green-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-500">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${dragActive ? "bg-primary/10" : "bg-muted"}`}>
                      <Upload size={28} className={dragActive ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold">Drop your resume here</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">Supports PDF, TXT · Max 5 MB</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                  <Target size={12} className="text-primary" />
                </div>
                Job Description
                <span className="text-muted-foreground/60 font-normal text-xs">(optional — improves keyword analysis)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={5}
                placeholder="Paste the target job description here so AI can tailor your resume keywords and phrasing..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500 flex items-center gap-2">
              <XCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <Button
            variant="gradient"
            className="w-full gap-2 h-12 text-base"
            disabled={!file || loading}
            onClick={handleAnalyze}
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> AI is deeply analyzing your resume — this may take 15-30 seconds…</>
            ) : (
              <><Zap size={18} /> Analyze & Improve Resume</>
            )}
          </Button>

          {/* How it works */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { step: "1", title: "Upload", desc: "Upload your resume as PDF or TXT", icon: FileUp },
              { step: "2", title: "AI Analysis", desc: "Get ATS score, suggestions, keywords", icon: Zap },
              { step: "3", title: "Improved Resume", desc: "Download your AI-improved resume", icon: Sparkles },
            ].map((item) => (
              <div key={item.step} className="text-center p-4 rounded-xl bg-muted/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-2">
                  <item.icon size={16} className="text-primary" />
                </div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Results screen ──
  return (
    <div className="space-y-6 page-enter-stagger">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Analysis Results</h1>
          <p className="text-muted-foreground/70">
            {file?.name} · {result.wordCount} words
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleReset}>
          <RotateCcw size={14} /> Analyze Another
        </Button>
      </div>

      {/* Score + Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Circle */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
                <circle
                  cx="100" cy="100" r="80" fill="none"
                  stroke={result.atsScore >= 80 ? "#22c55e" : result.atsScore >= 60 ? "#eab308" : "#ef4444"}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${result.atsScore * 5.03} ${503 - result.atsScore * 5.03}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`stat-number text-5xl font-black ${getScoreColor(result.atsScore)}`}>
                  {result.atsScore}
                </span>
                <span className="text-sm text-muted-foreground mt-1">ATS Score</span>
              </div>
            </div>
            <Badge
              className={`mt-4 bg-gradient-to-r ${getScoreGradient(result.atsScore)} text-white border-0 px-4 py-1`}
            >
              {getScoreLabel(result.atsScore)}
            </Badge>
            {result.overallVerdict && (
              <p className="mt-4 text-xs text-center text-muted-foreground leading-relaxed px-2">
                {result.overallVerdict}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Target size={14} className="text-primary" />
              </div>
              Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {breakdownRows.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <item.icon size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <span className={`text-sm font-bold ${getScoreColor(item.score)}`}>{item.score}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${getBarColor(item.score)}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Zap size={14} className="text-primary" />
            </div>
            AI Suggestions
            <Badge variant="secondary" className="ml-auto text-xs">{parsedSuggestions.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {parsedSuggestions.map((s, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl px-4 py-3 ${
                  s.type === "success" ? "bg-green-500/5 border border-green-500/10" :
                  s.type === "warning" ? "bg-yellow-500/5 border border-yellow-500/10" :
                  "bg-red-500/5 border border-red-500/10"
                }`}
              >
                {s.type === "success" && <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />}
                {s.type === "warning" && <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />}
                {s.type === "error" && <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />}
                <span className="text-sm">{s.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      {(result.foundKeywords.length > 0 || result.missingKeywords.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {result.foundKeywords.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-green-500">
                  <CheckCircle2 size={14} /> Found Keywords
                  <Badge variant="secondary" className="ml-auto text-xs">{result.foundKeywords.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {result.foundKeywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="border-green-500/30 text-green-500 bg-green-500/5 text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {result.missingKeywords.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                  <XCircle size={14} /> Missing Keywords
                  <Badge variant="secondary" className="ml-auto text-xs">{result.missingKeywords.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="border-red-400/30 text-red-400 bg-red-400/5 text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Improved Resume */}
      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-violet-500/5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles size={14} className="text-primary" />
              </div>
              AI-Improved Resume
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                {showOriginal ? <EyeOff size={12} /> : <Eye size={12} />}
                {showOriginal ? "Show Improved" : "Show Original"}
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleCopyImproved}>
                {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="gradient" size="sm" className="gap-2 text-xs" onClick={handleDownloadImproved}>
                <Download size={12} /> Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Improvement notes */}
          {result.improvementNotes.length > 0 && !showOriginal && (
            <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">What we improved</h4>
              <div className="flex flex-wrap gap-2">
                {result.improvementNotes.map((note, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                    {note}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Resume text */}
          <div className="p-6">
            <div className="bg-white dark:bg-zinc-950 rounded-xl border p-8 min-h-[400px] font-mono text-sm leading-relaxed whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 shadow-inner">
              {showOriginal ? result.originalText : result.improvedResume}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
