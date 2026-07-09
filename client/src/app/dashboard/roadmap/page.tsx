"use client";

import React, { useState } from "react";
import { roadmapService } from "@/lib/services";
import {
  Map,
  Sparkles,
  Search,
  Clock,
  ChevronRight,
  BookOpen,
  ExternalLink,
  Loader2,
  Star,
  Zap,
  Target,
} from "lucide-react";

const POPULAR_DOMAINS = [
  { label: "Frontend Dev", icon: "🌐" },
  { label: "Backend Dev", icon: "⚙️" },
  { label: "Full Stack", icon: "🔗" },
  { label: "Data Science", icon: "📊" },
  { label: "ML / AI", icon: "🤖" },
  { label: "DevOps", icon: "🚀" },
  { label: "Android Dev", icon: "📱" },
  { label: "iOS Dev", icon: "🍎" },
  { label: "Cybersecurity", icon: "🔒" },
  { label: "UI/UX Design", icon: "🎨" },
  { label: "Blockchain", icon: "⛓️" },
  { label: "Game Dev", icon: "🎮" },
];

const PHASE_COLORS: Record<string, string> = {
  blue:   "from-blue-500 to-blue-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
  green:  "from-green-500 to-green-600",
  teal:   "from-teal-500 to-teal-600",
  red:    "from-rose-500 to-rose-600",
};

const PHASE_BG: Record<string, string> = {
  blue:   "bg-blue-500/10 border-blue-500/20",
  purple: "bg-purple-500/10 border-purple-500/20",
  orange: "bg-orange-500/10 border-orange-500/20",
  green:  "bg-green-500/10 border-green-500/20",
  teal:   "bg-teal-500/10 border-teal-500/20",
  red:    "bg-rose-500/10 border-rose-500/20",
};

const PHASE_TEXT: Record<string, string> = {
  blue:   "text-blue-400",
  purple: "text-purple-400",
  orange: "text-orange-400",
  green:  "text-green-400",
  teal:   "text-teal-400",
  red:    "text-rose-400",
};

const LEVEL_BADGE: Record<string, string> = {
  beginner:     "bg-green-500/15 text-green-400 border-green-500/25",
  intermediate: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  advanced:     "bg-red-500/15 text-red-400 border-red-500/25",
};

// Builds a guaranteed-working URL from resource name + type.
// We never trust AI-generated URLs because they are frequently hallucinated.
function getResourceUrl(res: Resource): string {
  const q = encodeURIComponent(res.name);
  switch (res.type) {
    case "Video":
      return `https://www.youtube.com/results?search_query=${q}`;
    case "Course":
      return `https://www.google.com/search?q=${q}+free+online+course`;
    case "Documentation":
      return `https://www.google.com/search?q=${q}+official+documentation`;
    case "Practice":
      return `https://www.google.com/search?q=${q}+practice+problems+online`;
    case "Book":
      return `https://www.google.com/search?q=${q}+book+guide`;
    case "Article":
      return `https://www.google.com/search?q=${q}+tutorial+guide+article`;
    case "Community":
      return `https://www.google.com/search?q=${q}+community+reddit+forum`;
    default:
      return `https://www.google.com/search?q=${q}`;
  }
}

const RESOURCE_TYPE_COLOR: Record<string, string> = {
  Course:        "bg-blue-500/15 text-blue-400",
  Video:         "bg-red-500/15 text-red-400",
  Documentation: "bg-slate-500/15 text-slate-400",
  Practice:      "bg-green-500/15 text-green-400",
  Book:          "bg-amber-500/15 text-amber-400",
  Article:       "bg-purple-500/15 text-purple-400",
  Community:     "bg-teal-500/15 text-teal-400",
};

interface Resource {
  name: string;
  url: string;
  type: string;
}

interface Step {
  title: string;
  description: string;
  skills: string[];
  resources: Resource[];
  duration: string;
  level: string;
}

interface Phase {
  phase: string;
  duration: string;
  color: string;
  steps: Step[];
}

interface Roadmap {
  title: string;
  emoji: string;
  description: string;
  totalDuration: string;
  phases: Phase[];
}

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="bg-white/5 rounded-2xl p-6 space-y-3">
        <div className="h-6 bg-white/10 rounded-lg w-1/3" />
        <div className="h-4 bg-white/10 rounded w-2/3" />
        <div className="h-4 bg-white/10 rounded w-1/2" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="h-8 bg-white/10 rounded-xl w-1/4" />
          {[0, 1, 2].map((j) => (
            <div key={j} className="bg-white/5 rounded-xl p-5 space-y-3">
              <div className="h-5 bg-white/10 rounded w-1/3" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
              <div className="flex gap-2">
                {[0, 1, 2].map((k) => (
                  <div key={k} className="h-6 w-16 bg-white/10 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function RoadmapPage() {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async (input?: string) => {
    const query = (input ?? goal).trim();
    if (!query) return;

    setGoal(query);
    setLoading(true);
    setRoadmap(null);
    setError("");

    try {
      const result = await roadmapService.generate(query);
      if (result.success && result.data) {
        setRoadmap(result.data);
      } else {
        setError("Failed to generate roadmap. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleGenerate();
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-indigo-400 text-sm font-medium">
            <Map className="w-4 h-4" />
            Learning Roadmap Generator
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Your Personalised<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Learning Path
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
            Enter any goal or domain — get an AI-generated, step-by-step roadmap with resources, timelines, and skill requirements.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Frontend Developer, Data Scientist, Blockchain Engineer..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-36 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm sm:text-base"
          />
          <button
            onClick={() => handleGenerate()}
            disabled={!goal.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-xl transition-all text-sm flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>

        {/* Quick Pick */}
        <div className="space-y-3">
          <p className="text-gray-500 text-xs uppercase tracking-widest font-medium">
            Popular Domains
          </p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_DOMAINS.map(({ label, icon }) => (
              <button
                key={label}
                onClick={() => handleGenerate(label)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-full px-4 py-1.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && <SkeletonLoader />}

        {/* Roadmap Result */}
        {!loading && roadmap && (
          <div className="space-y-8">

            {/* Header Card */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <span className="text-4xl">{roadmap.emoji || "🗺️"}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{roadmap.title}</h2>
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed">{roadmap.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 text-sm">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="text-gray-300">Total Duration:</span>
                  <span className="font-semibold text-white">{roadmap.totalDuration}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 text-sm">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">Phases:</span>
                  <span className="font-semibold text-white">{roadmap.phases.length}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Steps:</span>
                  <span className="font-semibold text-white">
                    {roadmap.phases.reduce((a, p) => a + p.steps.length, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Phases Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-white/5 hidden sm:block" />

              <div className="space-y-10">
                {roadmap.phases.map((phase, phaseIdx) => {
                  const color = phase.color || "blue";
                  return (
                    <div key={phaseIdx} className="relative sm:pl-14">

                      {/* Phase dot */}
                      <div className={`absolute left-0 top-1.5 w-10 h-10 rounded-full bg-gradient-to-br ${PHASE_COLORS[color] || PHASE_COLORS.blue} hidden sm:flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                        {phaseIdx + 1}
                      </div>

                      {/* Phase header */}
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${PHASE_BG[color] || PHASE_BG.blue} mb-4`}>
                        <ChevronRight className={`w-4 h-4 ${PHASE_TEXT[color] || PHASE_TEXT.blue}`} />
                        <span className={`font-semibold ${PHASE_TEXT[color] || PHASE_TEXT.blue} text-sm`}>
                          Phase {phaseIdx + 1} — {phase.phase}
                        </span>
                        <span className="text-gray-500 text-xs ml-1">({phase.duration})</span>
                      </div>

                      {/* Steps */}
                      <div className="space-y-4">
                        {phase.steps.map((step, stepIdx) => (
                          <div
                            key={stepIdx}
                            className="bg-white/4 hover:bg-white/6 border border-white/8 hover:border-white/14 rounded-xl p-5 transition-all space-y-4"
                          >
                            {/* Step header */}
                            <div className="flex flex-wrap items-start gap-3">
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${PHASE_COLORS[color] || PHASE_COLORS.blue} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
                                {stepIdx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-semibold text-white text-sm sm:text-base">{step.title}</h4>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${LEVEL_BADGE[step.level] || LEVEL_BADGE.beginner}`}>
                                    {step.level}
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {step.duration}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{step.description}</p>
                              </div>
                            </div>

                            {/* Skills */}
                            {step.skills && step.skills.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {step.skills.map((skill, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 bg-white/5 border border-white/10 text-gray-300 text-xs px-3 py-1 rounded-full"
                                  >
                                    <Star className="w-2.5 h-2.5 text-yellow-400" />
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Resources */}
                            {step.resources && step.resources.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <BookOpen className="w-3 h-3" />
                                  Resources
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {step.resources.map((res, i) => (
                                    <a
                                      key={i}
                                      href={getResourceUrl(res)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={res.type === "Video" ? `Search YouTube: ${res.name}` : `Search: ${res.name}`}
                                      className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-all group"
                                    >
                                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${RESOURCE_TYPE_COLOR[res.type] || "bg-gray-500/15 text-gray-400"}`}>
                                        {res.type}
                                      </span>
                                      <span>{res.name}</span>
                                      <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 text-center space-y-3">
              <p className="text-gray-400 text-sm">Want a different focus? Generate another roadmap!</p>
              <button
                onClick={() => { setRoadmap(null); setGoal(""); }}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl px-5 py-2 text-sm transition-all"
              >
                <Map className="w-4 h-4" />
                Generate New Roadmap
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !roadmap && !error && (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
              <Map className="w-10 h-10 text-indigo-400" />
            </div>
            <p className="text-gray-500">Enter a goal above or pick a popular domain to get started.</p>
          </div>
        )}

      </div>
    </div>
  );
}
