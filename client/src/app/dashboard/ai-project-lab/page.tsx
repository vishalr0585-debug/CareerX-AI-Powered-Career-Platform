"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Star, GitFork, ExternalLink, Code2,
  Loader2, Sparkles, ChevronLeft, ChevronRight, Clock,
  ArrowUpDown,
} from "lucide-react";
import { projectService } from "@/lib/services";

const trendingSearches = [
  "react dashboard template",
  "node.js REST API boilerplate",
  "python machine learning project",
  "next.js e-commerce",
  "flutter app template",
  "django blog project",
  "express mongodb starter",
  "vue.js portfolio template",
];

const languageColors: Record<string, string> = {
  JavaScript: "bg-yellow-400",
  TypeScript: "bg-blue-500",
  Python: "bg-green-500",
  Java: "bg-orange-600",
  "C++": "bg-pink-500",
  C: "bg-gray-500",
  Go: "bg-cyan-500",
  Rust: "bg-orange-700",
  Ruby: "bg-red-600",
  PHP: "bg-indigo-400",
  Swift: "bg-orange-500",
  Kotlin: "bg-purple-500",
  Dart: "bg-blue-400",
  HTML: "bg-red-500",
  CSS: "bg-blue-600",
  Shell: "bg-green-600",
  Jupyter: "bg-orange-400",
  Vue: "bg-emerald-500",
  Unknown: "bg-gray-400",
};

interface Repo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  homepage: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string;
  topics: string[];
  owner: { login: string; avatar: string; url: string };
  license: string | null;
  updatedAt: string;
  createdAt: string;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function AIProjectLabPage() {
  const [query, setQuery] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("stars");
  const [error, setError] = useState("");

  const searchRepos = async (q: string, p = 1, sort = sortBy) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const res = await projectService.searchGitHub(q, { sort, page: p, per_page: 12 });
      const data = res.data;
      setRepos(data.repos || []);
      setTotalCount(data.totalCount || 0);
      setPage(data.page || p);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || "Search failed. Please try again.");
      setRepos([]);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    setPage(1);
    searchRepos(query, 1);
  };

  const handleSort = (sort: string) => {
    setSortBy(sort);
    searchRepos(query, 1, sort);
  };

  const handlePage = (p: number) => {
    searchRepos(query, p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(Math.min(totalCount, 1000) / 12);

  return (
    <div className="space-y-6 page-enter-stagger">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Project Explorer</h1>
        <p className="text-muted-foreground/70">
          Search GitHub for real open-source projects. Find, explore, and clone repositories instantly.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-primary" />
            <h3 className="font-bold">What kind of project are you looking for?</h3>
          </div>
          <div className="flex gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g., react chat application, python machine learning, node.js REST API..."
              className="flex-1"
            />
            <Button variant="gradient" className="gap-2" onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Searching...</>
              ) : (
                <><Search size={16} /> Search GitHub</>
              )}
            </Button>
          </div>

          {/* Trending searches */}
          {!searched && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Trending searches:</p>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); searchRepos(s, 1); }}
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

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      )}

      {/* Results header */}
      {searched && !loading && repos.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Found <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> repositories
          </p>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort by:</span>
            {["stars", "forks", "updated"].map((s) => (
              <button
                key={s}
                onClick={() => handleSort(s)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sortBy === s ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-primary/10"
                }`}
              >
                {s === "stars" ? "Stars" : s === "forks" ? "Forks" : "Updated"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}

      {/* Results */}
      {!loading && repos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <a
              key={repo.id}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="h-full hover-lift transition-all cursor-pointer border-border/40 hover:border-primary/30 hover:shadow-lg">
                <CardContent className="p-5 flex flex-col h-full">
                  {/* Owner + repo name */}
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={repo.owner.avatar}
                      alt={repo.owner.login}
                      className="w-10 h-10 rounded-xl border border-border/30"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                        {repo.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{repo.owner.login}</p>
                    </div>
                    <ExternalLink size={14} className="text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">
                    {repo.description || "No description provided"}
                  </p>

                  {/* Topics */}
                  {repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {repo.topics.slice(0, 4).map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-[9px] px-1.5 py-0">
                          {topic}
                        </Badge>
                      ))}
                      {repo.topics.length > 4 && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                          +{repo.topics.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-border/30">
                    <span className="flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${languageColors[repo.language] || "bg-gray-400"}`} />
                      {repo.language}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-500" />
                      {formatCount(repo.stars)}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork size={12} />
                      {formatCount(repo.forks)}
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <Clock size={11} />
                      {timeAgo(repo.updatedAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && repos.length === 0 && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <Code2 size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No repositories found. Try a different search term.</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePage(page - 1)}
            className="gap-1"
          >
            <ChevronLeft size={14} /> Previous
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePage(page + 1)}
            className="gap-1"
          >
            Next <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
