"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Briefcase, Building2,
  ExternalLink, TrendingUp,
  Users, Star, Loader2, Globe, ArrowRight,
  CheckCircle, Clock, FileText,
} from "lucide-react";
import { jobService } from "@/lib/services";

interface Platform {
  name: string;
  icon: string;
  color: string;
  url: string;
  description: string;
}

interface TrackedApplication {
  platform: string;
  query: string;
  url: string;
  appliedAt: string;
}

const platformLogos: Record<string, React.ReactNode> = {
  linkedin: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  indeed: <Briefcase size={20} />,
  glassdoor: <Star size={20} />,
  naukri: <Building2 size={20} />,
  internshala: <Users size={20} />,
  wellfound: <TrendingUp size={20} />,
  google: <Search size={20} />,
  github: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>,
};

const trendingSuggestions = [
  "Frontend Developer",
  "Backend Engineer",
  "Full Stack Developer",
  "Data Scientist",
  "DevOps Engineer",
  "Machine Learning",
  "React Developer",
  "Python Developer",
];

function getStoredApplications(): TrackedApplication[] {
  try {
    return JSON.parse(localStorage.getItem("cx_job_applications") || "[]");
  } catch { return []; }
}

function storeApplication(app: TrackedApplication) {
  const apps = getStoredApplications();
  // Avoid duplicates for same platform + query
  const exists = apps.some((a) => a.platform === app.platform && a.url === app.url);
  if (!exists) {
    apps.unshift(app);
    localStorage.setItem("cx_job_applications", JSON.stringify(apps.slice(0, 50)));
  }
}

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [appliedPlatforms, setAppliedPlatforms] = useState<Set<string>>(new Set());
  const [applyingPlatform, setApplyingPlatform] = useState<string | null>(null);
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [showSuccessMsg, setShowSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const apps = getStoredApplications();
    setApplications(apps);
    // Build set of applied platform names for quick lookup
    const applied = new Set<string>();
    apps.forEach((a) => applied.add(a.platform));
    setAppliedPlatforms(applied);

    // Restore last search so applied badges persist across navigation
    const lastQuery = localStorage.getItem("cx_job_last_query");
    if (lastQuery) {
      setSearchTerm(lastQuery);
      handleSearch(lastQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (q?: string) => {
    const query = q || searchTerm;
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setSearchQuery(query);
    localStorage.setItem("cx_job_last_query", query);
    try {
      const res = await jobService.searchExternal(query);
      setPlatforms(res.data?.platforms || []);
    } catch (e) {
      console.error("Search failed", e);
    }
    setLoading(false);
  };

  const handleApplyNow = async (platform: Platform) => {
    setApplyingPlatform(platform.name);

    // Track application
    const application: TrackedApplication = {
      platform: platform.name,
      query: searchQuery,
      url: platform.url,
      appliedAt: new Date().toISOString(),
    };
    storeApplication(application);

    // Update applied set
    setAppliedPlatforms((prev) => new Set([...prev, platform.name]));
    setApplications(getStoredApplications());

    // Show success message
    setShowSuccessMsg(platform.name);
    setTimeout(() => setShowSuccessMsg(null), 3000);

    // Open external URL in new tab
    window.open(platform.url, "_blank", "noopener,noreferrer");

    setApplyingPlatform(null);
  };

  const isPlatformApplied = (platform: Platform) => {
    return appliedPlatforms.has(platform.name);
  };

  return (
    <div className="space-y-6 page-enter-stagger">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Job Finder</h1>
        <p className="text-muted-foreground/70">
          Search across top job platforms. We&apos;ll redirect you to apply directly on each platform.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={18} className="text-primary" />
            <h3 className="font-bold">What job are you looking for?</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="e.g., Frontend Developer, Python Engineer, Data Scientist..."
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button variant="gradient" className="gap-2" onClick={() => handleSearch()} disabled={loading || !searchTerm.trim()}>
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Searching...</>
              ) : (
                <><Search size={14} /> Search Jobs</>
              )}
            </Button>
          </div>

          {/* Suggestions */}
          {!searched && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {trendingSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSearchTerm(s); handleSearch(s); }}
                    className="text-xs rounded-xl border border-border/40 px-3 py-1.5 text-muted-foreground hover:bg-primary/8 hover:text-primary hover:border-primary/20 transition-all cursor-pointer"
                  >
                    <Search size={10} className="inline mr-1" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success toast */}
      {showSuccessMsg && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-5 fade-in">
          <Card className="border-emerald-500/30 bg-emerald-500/10 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle size={18} className="text-emerald-500" />
              <div>
                <p className="text-sm font-semibold">{showSuccessMsg} Opened!</p>
                <p className="text-xs text-muted-foreground">
                  {showSuccessMsg} has been opened in a new tab. Find a job and apply there — we&apos;ll track it here for you.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}

      {/* Results */}
      {!loading && searched && platforms.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-primary" />
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">&ldquo;{searchQuery}&rdquo;</span> across {platforms.length} platforms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((platform) => {
              const applied = isPlatformApplied(platform);
              return (
                <Card key={platform.name} className={`h-full transition-all border-border/40 hover:shadow-lg ${applied ? "border-blue-500/30 bg-blue-500/5" : "hover:border-primary/30"}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Platform icon */}
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md shrink-0"
                        style={{ backgroundColor: platform.color }}
                      >
                        {platformLogos[platform.icon] || <Globe size={20} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold">
                            {platform.name}
                          </h3>
                          {applied && (
                            <Badge variant="outline" className="text-xs text-blue-500 border-blue-500/40 gap-1">
                              <ExternalLink size={10} /> Visited
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {platform.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Search size={10} /> {searchQuery}
                          </Badge>
                          <div className="flex items-center gap-2 ml-auto">
                            <Button
                              size="sm"
                              variant={applied ? "outline" : "gradient"}
                              className="gap-1.5 text-xs h-8"
                              disabled={applyingPlatform === platform.name}
                              onClick={() => handleApplyNow(platform)}
                            >
                              {applyingPlatform === platform.name ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : applied ? (
                                <>
                                  <ExternalLink size={12} /> Open Again
                                </>
                              ) : (
                                <>
                                  <ExternalLink size={12} /> Open &amp; Apply
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tip */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Star size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">How It Works</p>
                <p className="text-xs text-muted-foreground">
                  Click &ldquo;Open &amp; Apply&rdquo; to go directly to the platform&apos;s job listings. Apply for jobs there — we&apos;ll
                  track which platforms you&apos;ve visited so you can manage your job search progress below!
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Tracked Applications */}
      {applications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            Visited Platforms
            <Badge variant="secondary" className="text-xs">{applications.length}</Badge>
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">Platforms you&apos;ve opened — make sure to apply on each site!</p>
          <div className="grid grid-cols-1 gap-2">
            {applications.slice(0, 10).map((app, i) => (
              <Card key={`${app.platform}-${i}`} className="hover-lift transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm shrink-0 text-xs font-bold"
                    style={{ backgroundColor: platformLogos[app.platform.toLowerCase().split(" ")[0]] ? "#6c47ff" : "#666" }}
                  >
                    {app.platform.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{app.platform}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Searched: &ldquo;{app.query}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-blue-500">
                        <ExternalLink size={10} /> Visited
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={9} />
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs h-7"
                      onClick={() => window.open(app.url, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink size={10} /> Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {applications.length > 10 && (
            <p className="text-xs text-center text-muted-foreground">
              Showing 10 of {applications.length} applications
            </p>
          )}
        </div>
      )}

      {/* Empty initial state */}
      {!loading && !searched && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: "LinkedIn", color: "#0A66C2", icon: "linkedin" },
            { name: "Indeed", color: "#2164F3", icon: "indeed" },
            { name: "Naukri", color: "#4A90D9", icon: "naukri" },
            { name: "Glassdoor", color: "#0CAA41", icon: "glassdoor" },
          ].map((p) => (
            <Card key={p.name} className="text-center hover-lift transition-all cursor-pointer opacity-60">
              <CardContent className="p-6">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md mx-auto mb-3"
                  style={{ backgroundColor: p.color }}
                >
                  {platformLogos[p.icon]}
                </div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Search to explore</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
