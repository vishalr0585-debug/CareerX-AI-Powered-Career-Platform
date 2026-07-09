"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, ExternalLink, Code2, Filter, BookOpen,
  TrendingUp, CheckCircle2, Star, Zap, Trophy,
} from "lucide-react";

type Difficulty = "Easy" | "Medium" | "Hard";
type StatusFilter = "All" | "Todo" | "Done";

interface Problem {
  id: number;
  title: string;
  difficulty: Difficulty;
  category: string;
  companies: string[];
  acceptance: string;
  url: string;
  isPremium?: boolean;
}

const STORAGE_KEY = "careerx_dsa_solved";

const problems: Problem[] = [
  // Arrays
  { id: 1,    title: "Two Sum",                                       difficulty: "Easy",   category: "Arrays",              companies: ["Google","Amazon","Facebook"],        acceptance: "52%",  url: "https://leetcode.com/problems/two-sum/" },
  { id: 11,   title: "Container With Most Water",                     difficulty: "Medium", category: "Arrays",              companies: ["Google","Amazon"],                  acceptance: "54%",  url: "https://leetcode.com/problems/container-with-most-water/" },
  { id: 15,   title: "3Sum",                                          difficulty: "Medium", category: "Arrays",              companies: ["Amazon","Facebook","Apple"],         acceptance: "34%",  url: "https://leetcode.com/problems/3sum/" },
  { id: 31,   title: "Next Permutation",                              difficulty: "Medium", category: "Arrays",              companies: ["Google","Amazon"],                  acceptance: "39%",  url: "https://leetcode.com/problems/next-permutation/" },
  { id: 53,   title: "Maximum Subarray",                              difficulty: "Medium", category: "Arrays",              companies: ["Amazon","Microsoft","Apple"],        acceptance: "50%",  url: "https://leetcode.com/problems/maximum-subarray/" },
  { id: 56,   title: "Merge Intervals",                               difficulty: "Medium", category: "Arrays",              companies: ["Google","Facebook","Microsoft"],     acceptance: "46%",  url: "https://leetcode.com/problems/merge-intervals/" },
  { id: 121,  title: "Best Time to Buy and Sell Stock",               difficulty: "Easy",   category: "Arrays",              companies: ["Amazon","Goldman Sachs"],           acceptance: "54%",  url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
  { id: 238,  title: "Product of Array Except Self",                  difficulty: "Medium", category: "Arrays",              companies: ["Amazon","Facebook","Microsoft"],     acceptance: "65%",  url: "https://leetcode.com/problems/product-of-array-except-self/" },
  { id: 283,  title: "Move Zeroes",                                   difficulty: "Easy",   category: "Arrays",              companies: ["Facebook","Adobe"],                 acceptance: "61%",  url: "https://leetcode.com/problems/move-zeroes/" },
  { id: 448,  title: "Find All Numbers Disappeared in an Array",      difficulty: "Easy",   category: "Arrays",              companies: ["Google"],                           acceptance: "60%",  url: "https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/" },
  // Strings
  { id: 3,    title: "Longest Substring Without Repeating Characters", difficulty: "Medium", category: "Strings",            companies: ["Amazon","Google","Facebook"],        acceptance: "34%",  url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
  { id: 20,   title: "Valid Parentheses",                             difficulty: "Easy",   category: "Strings",             companies: ["Amazon","Google","Airbnb"],          acceptance: "41%",  url: "https://leetcode.com/problems/valid-parentheses/" },
  { id: 49,   title: "Group Anagrams",                                difficulty: "Medium", category: "Strings",             companies: ["Amazon","Facebook","Uber"],          acceptance: "67%",  url: "https://leetcode.com/problems/group-anagrams/" },
  { id: 76,   title: "Minimum Window Substring",                      difficulty: "Hard",   category: "Strings",             companies: ["Google","Facebook","Amazon"],        acceptance: "41%",  url: "https://leetcode.com/problems/minimum-window-substring/" },
  { id: 125,  title: "Valid Palindrome",                              difficulty: "Easy",   category: "Strings",             companies: ["Facebook","Microsoft"],             acceptance: "45%",  url: "https://leetcode.com/problems/valid-palindrome/" },
  { id: 242,  title: "Valid Anagram",                                 difficulty: "Easy",   category: "Strings",             companies: ["Amazon","Adobe"],                   acceptance: "63%",  url: "https://leetcode.com/problems/valid-anagram/" },
  { id: 424,  title: "Longest Repeating Character Replacement",       difficulty: "Medium", category: "Strings",             companies: ["Google"],                           acceptance: "53%",  url: "https://leetcode.com/problems/longest-repeating-character-replacement/" },
  { id: 647,  title: "Palindromic Substrings",                        difficulty: "Medium", category: "Strings",             companies: ["Facebook","Google"],                acceptance: "68%",  url: "https://leetcode.com/problems/palindromic-substrings/" },
  // Linked List
  { id: 21,   title: "Merge Two Sorted Lists",                        difficulty: "Easy",   category: "Linked List",         companies: ["Amazon","Microsoft","Apple"],        acceptance: "63%",  url: "https://leetcode.com/problems/merge-two-sorted-lists/" },
  { id: 141,  title: "Linked List Cycle",                             difficulty: "Easy",   category: "Linked List",         companies: ["Amazon","Google","Apple"],          acceptance: "49%",  url: "https://leetcode.com/problems/linked-list-cycle/" },
  { id: 143,  title: "Reorder List",                                  difficulty: "Medium", category: "Linked List",         companies: ["Amazon","Google"],                  acceptance: "57%",  url: "https://leetcode.com/problems/reorder-list/" },
  { id: 206,  title: "Reverse Linked List",                           difficulty: "Easy",   category: "Linked List",         companies: ["Amazon","Microsoft","Apple"],        acceptance: "74%",  url: "https://leetcode.com/problems/reverse-linked-list/" },
  { id: 234,  title: "Palindrome Linked List",                        difficulty: "Easy",   category: "Linked List",         companies: ["Amazon","Facebook"],                acceptance: "52%",  url: "https://leetcode.com/problems/palindrome-linked-list/" },
  { id: 19,   title: "Remove Nth Node From End of List",              difficulty: "Medium", category: "Linked List",         companies: ["Amazon","Microsoft"],               acceptance: "43%",  url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/" },
  { id: 23,   title: "Merge k Sorted Lists",                          difficulty: "Hard",   category: "Linked List",         companies: ["Amazon","Google","Facebook"],        acceptance: "51%",  url: "https://leetcode.com/problems/merge-k-sorted-lists/" },
  // Trees
  { id: 94,   title: "Binary Tree Inorder Traversal",                 difficulty: "Easy",   category: "Trees",               companies: ["Microsoft","Amazon"],               acceptance: "74%",  url: "https://leetcode.com/problems/binary-tree-inorder-traversal/" },
  { id: 102,  title: "Binary Tree Level Order Traversal",             difficulty: "Medium", category: "Trees",               companies: ["Amazon","Microsoft","Google"],       acceptance: "66%",  url: "https://leetcode.com/problems/binary-tree-level-order-traversal/" },
  { id: 104,  title: "Maximum Depth of Binary Tree",                  difficulty: "Easy",   category: "Trees",               companies: ["LinkedIn","Yahoo"],                 acceptance: "75%",  url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/" },
  { id: 124,  title: "Binary Tree Maximum Path Sum",                  difficulty: "Hard",   category: "Trees",               companies: ["Microsoft","Amazon"],               acceptance: "39%",  url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/" },
  { id: 226,  title: "Invert Binary Tree",                            difficulty: "Easy",   category: "Trees",               companies: ["Google","Facebook"],                acceptance: "77%",  url: "https://leetcode.com/problems/invert-binary-tree/" },
  { id: 230,  title: "Kth Smallest Element in a BST",                 difficulty: "Medium", category: "Trees",               companies: ["Bloomberg","Amazon"],               acceptance: "71%",  url: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/" },
  { id: 235,  title: "Lowest Common Ancestor of a BST",               difficulty: "Medium", category: "Trees",               companies: ["Amazon","Microsoft","Facebook"],     acceptance: "63%",  url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/" },
  { id: 572,  title: "Subtree of Another Tree",                       difficulty: "Easy",   category: "Trees",               companies: ["Amazon"],                           acceptance: "47%",  url: "https://leetcode.com/problems/subtree-of-another-tree/" },
  // Graphs
  { id: 133,  title: "Clone Graph",                                   difficulty: "Medium", category: "Graphs",              companies: ["Facebook","Uber","Google"],          acceptance: "57%",  url: "https://leetcode.com/problems/clone-graph/" },
  { id: 200,  title: "Number of Islands",                             difficulty: "Medium", category: "Graphs",              companies: ["Amazon","Google","Facebook"],        acceptance: "58%",  url: "https://leetcode.com/problems/number-of-islands/" },
  { id: 207,  title: "Course Schedule",                               difficulty: "Medium", category: "Graphs",              companies: ["Amazon","Airbnb","Uber"],           acceptance: "46%",  url: "https://leetcode.com/problems/course-schedule/" },
  { id: 417,  title: "Pacific Atlantic Water Flow",                   difficulty: "Medium", category: "Graphs",              companies: ["Google"],                           acceptance: "54%",  url: "https://leetcode.com/problems/pacific-atlantic-water-flow/" },
  { id: 684,  title: "Redundant Connection",                          difficulty: "Medium", category: "Graphs",              companies: ["Bloomberg"],                        acceptance: "61%",  url: "https://leetcode.com/problems/redundant-connection/" },
  // Dynamic Programming
  { id: 55,   title: "Jump Game",                                     difficulty: "Medium", category: "Dynamic Programming", companies: ["Amazon","Microsoft"],               acceptance: "39%",  url: "https://leetcode.com/problems/jump-game/" },
  { id: 62,   title: "Unique Paths",                                  difficulty: "Medium", category: "Dynamic Programming", companies: ["Amazon","Google"],                  acceptance: "63%",  url: "https://leetcode.com/problems/unique-paths/" },
  { id: 70,   title: "Climbing Stairs",                               difficulty: "Easy",   category: "Dynamic Programming", companies: ["Amazon","Adobe"],                   acceptance: "52%",  url: "https://leetcode.com/problems/climbing-stairs/" },
  { id: 72,   title: "Edit Distance",                                 difficulty: "Medium", category: "Dynamic Programming", companies: ["Google","Amazon"],                  acceptance: "54%",  url: "https://leetcode.com/problems/edit-distance/" },
  { id: 91,   title: "Decode Ways",                                   difficulty: "Medium", category: "Dynamic Programming", companies: ["Facebook"],                         acceptance: "34%",  url: "https://leetcode.com/problems/decode-ways/" },
  { id: 139,  title: "Word Break",                                    difficulty: "Medium", category: "Dynamic Programming", companies: ["Google","Amazon","Facebook"],        acceptance: "46%",  url: "https://leetcode.com/problems/word-break/" },
  { id: 198,  title: "House Robber",                                  difficulty: "Medium", category: "Dynamic Programming", companies: ["Amazon","Airbnb"],                  acceptance: "50%",  url: "https://leetcode.com/problems/house-robber/" },
  { id: 300,  title: "Longest Increasing Subsequence",                difficulty: "Medium", category: "Dynamic Programming", companies: ["Microsoft","Amazon"],               acceptance: "52%",  url: "https://leetcode.com/problems/longest-increasing-subsequence/" },
  { id: 322,  title: "Coin Change",                                   difficulty: "Medium", category: "Dynamic Programming", companies: ["Google","Amazon","Facebook"],        acceptance: "44%",  url: "https://leetcode.com/problems/coin-change/" },
  { id: 416,  title: "Partition Equal Subset Sum",                    difficulty: "Medium", category: "Dynamic Programming", companies: ["Apple","Amazon"],                   acceptance: "47%",  url: "https://leetcode.com/problems/partition-equal-subset-sum/" },
  // Binary Search
  { id: 33,   title: "Search in Rotated Sorted Array",                difficulty: "Medium", category: "Binary Search",       companies: ["Amazon","Microsoft","Adobe"],        acceptance: "39%",  url: "https://leetcode.com/problems/search-in-rotated-sorted-array/" },
  { id: 153,  title: "Find Minimum in Rotated Sorted Array",          difficulty: "Medium", category: "Binary Search",       companies: ["Amazon","Microsoft"],               acceptance: "49%",  url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/" },
  { id: 162,  title: "Find Peak Element",                             difficulty: "Medium", category: "Binary Search",       companies: ["Google"],                           acceptance: "46%",  url: "https://leetcode.com/problems/find-peak-element/" },
  { id: 875,  title: "Koko Eating Bananas",                           difficulty: "Medium", category: "Binary Search",       companies: ["Amazon"],                           acceptance: "56%",  url: "https://leetcode.com/problems/koko-eating-bananas/" },
  { id: 74,   title: "Search a 2D Matrix",                            difficulty: "Medium", category: "Binary Search",       companies: ["Amazon","Microsoft"],               acceptance: "50%",  url: "https://leetcode.com/problems/search-a-2d-matrix/" },
  { id: 4,    title: "Median of Two Sorted Arrays",                   difficulty: "Hard",   category: "Binary Search",       companies: ["Google","Amazon","Microsoft"],       acceptance: "37%",  url: "https://leetcode.com/problems/median-of-two-sorted-arrays/" },
  // Stack & Queue
  { id: 155,  title: "Min Stack",                                     difficulty: "Medium", category: "Stack & Queue",       companies: ["Amazon","Snapchat"],                acceptance: "53%",  url: "https://leetcode.com/problems/min-stack/" },
  { id: 84,   title: "Largest Rectangle in Histogram",                difficulty: "Hard",   category: "Stack & Queue",       companies: ["Amazon","Google"],                  acceptance: "44%",  url: "https://leetcode.com/problems/largest-rectangle-in-histogram/" },
  { id: 739,  title: "Daily Temperatures",                            difficulty: "Medium", category: "Stack & Queue",       companies: ["Amazon","Yahoo"],                   acceptance: "67%",  url: "https://leetcode.com/problems/daily-temperatures/" },
  // Sorting
  { id: 215,  title: "Kth Largest Element in an Array",               difficulty: "Medium", category: "Sorting",             companies: ["Amazon","Facebook","Microsoft"],     acceptance: "66%",  url: "https://leetcode.com/problems/kth-largest-element-in-an-array/" },
  { id: 347,  title: "Top K Frequent Elements",                       difficulty: "Medium", category: "Sorting",             companies: ["Amazon","Bloomberg","Yelp"],         acceptance: "65%",  url: "https://leetcode.com/problems/top-k-frequent-elements/" },
  // Heap
  { id: 295,  title: "Find Median from Data Stream",                  difficulty: "Hard",   category: "Heap",                companies: ["Amazon","Google"],                  acceptance: "51%",  url: "https://leetcode.com/problems/find-median-from-data-stream/" },
  { id: 703,  title: "Kth Largest Element in a Stream",               difficulty: "Easy",   category: "Heap",                companies: ["Amazon"],                           acceptance: "53%",  url: "https://leetcode.com/problems/kth-largest-element-in-a-stream/" },
  { id: 1046, title: "Last Stone Weight",                             difficulty: "Easy",   category: "Heap",                companies: ["Google"],                           acceptance: "64%",  url: "https://leetcode.com/problems/last-stone-weight/" },
  // Backtracking
  { id: 39,   title: "Combination Sum",                               difficulty: "Medium", category: "Backtracking",        companies: ["Google","Amazon"],                  acceptance: "70%",  url: "https://leetcode.com/problems/combination-sum/" },
  { id: 46,   title: "Permutations",                                  difficulty: "Medium", category: "Backtracking",        companies: ["Microsoft","LinkedIn"],             acceptance: "76%",  url: "https://leetcode.com/problems/permutations/" },
  { id: 51,   title: "N-Queens",                                      difficulty: "Hard",   category: "Backtracking",        companies: ["Microsoft","Amazon"],               acceptance: "67%",  url: "https://leetcode.com/problems/n-queens/" },
  { id: 79,   title: "Word Search",                                   difficulty: "Medium", category: "Backtracking",        companies: ["Amazon","Facebook","Microsoft"],     acceptance: "42%",  url: "https://leetcode.com/problems/word-search/" },
  { id: 131,  title: "Palindrome Partitioning",                       difficulty: "Medium", category: "Backtracking",        companies: ["Amazon","Apple"],                   acceptance: "69%",  url: "https://leetcode.com/problems/palindrome-partitioning/" },
  // Two Pointers
  { id: 167,  title: "Two Sum II",                                    difficulty: "Medium", category: "Two Pointers",        companies: ["Amazon"],                           acceptance: "59%",  url: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/" },
  { id: 209,  title: "Minimum Size Subarray Sum",                     difficulty: "Medium", category: "Two Pointers",        companies: ["Facebook"],                         acceptance: "46%",  url: "https://leetcode.com/problems/minimum-size-subarray-sum/" },
  { id: 567,  title: "Permutation in String",                         difficulty: "Medium", category: "Two Pointers",        companies: ["Microsoft"],                        acceptance: "44%",  url: "https://leetcode.com/problems/permutation-in-string/" },
  // Bit Manipulation
  { id: 191,  title: "Number of 1 Bits",                              difficulty: "Easy",   category: "Bit Manipulation",    companies: ["Apple","Microsoft"],                acceptance: "67%",  url: "https://leetcode.com/problems/number-of-1-bits/" },
  { id: 338,  title: "Counting Bits",                                 difficulty: "Easy",   category: "Bit Manipulation",    companies: ["Google"],                           acceptance: "77%",  url: "https://leetcode.com/problems/counting-bits/" },
  { id: 268,  title: "Missing Number",                                difficulty: "Easy",   category: "Bit Manipulation",    companies: ["Microsoft","Amazon"],               acceptance: "63%",  url: "https://leetcode.com/problems/missing-number/" },
  { id: 136,  title: "Single Number",                                 difficulty: "Easy",   category: "Bit Manipulation",    companies: ["Amazon"],                           acceptance: "71%",  url: "https://leetcode.com/problems/single-number/" },
  // Math
  { id: 9,    title: "Palindrome Number",                             difficulty: "Easy",   category: "Math",                companies: ["Adobe"],                            acceptance: "55%",  url: "https://leetcode.com/problems/palindrome-number/" },
  { id: 50,   title: "Pow(x, n)",                                     difficulty: "Medium", category: "Math",                companies: ["Google","Bloomberg"],               acceptance: "34%",  url: "https://leetcode.com/problems/powx-n/" },
  { id: 202,  title: "Happy Number",                                  difficulty: "Easy",   category: "Math",                companies: ["Adobe"],                            acceptance: "55%",  url: "https://leetcode.com/problems/happy-number/" },
];

const categories = ["All", ...Array.from(new Set(problems.map((p) => p.category))).sort()];
const difficulties = ["All", "Easy", "Medium", "Hard"];
const statuses: StatusFilter[] = ["All", "Todo", "Done"];
const companies = ["All", "Google", "Amazon", "Microsoft", "Facebook", "Apple", "Bloomberg", "Uber", "Airbnb", "LinkedIn"];

const diffStyles: Record<Difficulty, string> = {
  Easy:   "text-green-400 bg-green-400/10 border-green-400/20",
  Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Hard:   "text-red-400 bg-red-400/10 border-red-400/20",
};

export default function DSAProblemsPage() {
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDiff]   = useState("All");
  const [company, setCompany]   = useState("All");
  const [status, setStatus]     = useState<StatusFilter>("All");
  const [solved, setSolved] = useState<Set<number>>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
    } catch { return new Set(); }
  });

  const toggleSolved = useCallback((id: number) => {
    setSolved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const filtered = useMemo(() =>
    problems.filter((p) => {
      const q = search.toLowerCase();
      return (
        (!q || p.title.toLowerCase().includes(q)) &&
        (category === "All" || p.category === category) &&
        (difficulty === "All" || p.difficulty === difficulty) &&
        (company === "All" || p.companies.includes(company)) &&
        (status === "All" || (status === "Done" ? solved.has(p.id) : !solved.has(p.id)))
      );
    }),
  [search, category, difficulty, company, status, solved]);

  const easy       = problems.filter((p) => p.difficulty === "Easy").length;
  const medium     = problems.filter((p) => p.difficulty === "Medium").length;
  const hard       = problems.filter((p) => p.difficulty === "Hard").length;
  const solvedEasy   = problems.filter((p) => p.difficulty === "Easy"   && solved.has(p.id)).length;
  const solvedMedium = problems.filter((p) => p.difficulty === "Medium" && solved.has(p.id)).length;
  const solvedHard   = problems.filter((p) => p.difficulty === "Hard"   && solved.has(p.id)).length;
  const totalSolved  = solved.size;
  const pct = Math.round((totalSolved / problems.length) * 100);

  return (
    <div className="space-y-6 page-enter-stagger">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">DSA Problems</h1>
        <p className="text-muted-foreground/70 text-sm">Curated problems from LeetCode â€” tick a problem once you solve it to track your progress.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Solved",  value: `${totalSolved}/${problems.length}`, icon: Trophy,       color: "text-primary" },
          { label: "Easy",    value: `${solvedEasy}/${easy}`,             icon: CheckCircle2, color: "text-green-400" },
          { label: "Medium",  value: `${solvedMedium}/${medium}`,         icon: TrendingUp,   color: "text-yellow-400" },
          { label: "Hard",    value: `${solvedHard}/${hard}`,             icon: Zap,          color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="hover-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <s.icon size={16} className={s.color} />
              </div>
              <div>
                <p className="text-lg font-black">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Progress Bar */}
      <Card className="border-border/40">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <BookOpen size={13} className="text-primary" /> Overall Progress
            </span>
            <span className="text-muted-foreground">{totalSolved} / {problems.length} problems &nbsp;Â·&nbsp; <span className="text-primary font-bold">{pct}%</span></span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-linear-to-r from-primary to-[hsl(238,70%,65%)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex gap-4 text-[11px] text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-400" />{solvedEasy} Easy</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />{solvedMedium} Medium</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-400" />{solvedHard} Hard</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-border/40">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="pl-9 bg-muted/30"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter size={14} className="text-muted-foreground" />
            {difficulties.map((d) => (
              <button
                key={d}
                onClick={() => setDiff(d)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  difficulty === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {d}
              </button>
            ))}
            <div className="w-px h-5 bg-border/50" />
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  status === s
                    ? s === "Done"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : s === "Todo"
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {s === "Done" ? "âœ“ Done" : s === "Todo" ? "â—‹ Todo" : s}
              </button>
            ))}
            <div className="w-px h-5 bg-border/50" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-xs rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-foreground cursor-pointer focus:outline-none"
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="text-xs rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-foreground cursor-pointer focus:outline-none"
            >
              {companies.map((c) => <option key={c}>{c}</option>)}
            </select>
            <span className="ml-auto text-xs text-muted-foreground">{filtered.length} problems</span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-10">Done</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-14">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Difficulty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">Companies</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell">Acceptance</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Solve</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">No problems match your filters.</td>
                </tr>
              ) : (
                filtered.map((p, i) => {
                  const isDone = solved.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-border/20 transition-colors hover:bg-muted/20 ${
                        isDone ? "bg-green-500/5" : i % 2 === 0 ? "" : "bg-muted/5"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSolved(p.id)}
                          aria-label={isDone ? "Mark as unsolved" : "Mark as solved"}
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isDone
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-border/60 hover:border-green-500/60 hover:bg-green-500/10"
                          }`}
                        >
                          {isDone && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className={`px-4 py-3 text-xs font-mono ${isDone ? "text-green-500/70" : "text-muted-foreground"}`}>{p.id}</td>
                      <td className="px-4 py-3 font-medium max-w-65">
                        <div className="flex items-center gap-1.5">
                          <span className={`truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>{p.title}</span>
                          {p.isPremium && <Star size={11} className="text-yellow-500 shrink-0" />}
                          {isDone && <CheckCircle2 size={13} className="text-green-500 shrink-0" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${diffStyles[p.difficulty]}`}>
                          {p.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {p.companies.slice(0, 3).map((c) => (
                            <span key={c} className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5">{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">{p.acceptance}</td>
                      <td className="px-4 py-3 text-right">
                        <a href={p.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2.5 hover:bg-primary/10 hover:text-primary">
                            <Code2 size={12} /> Solve <ExternalLink size={10} />
                          </Button>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

