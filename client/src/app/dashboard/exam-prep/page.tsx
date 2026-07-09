"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, BookOpen, Calendar, CheckCircle2,
  ExternalLink, Code2, Brain,
  FileText, Globe, Zap, TrendingUp,
  ChevronRight, Loader2, ListChecks, Map,
  Award, Lightbulb, Download,
} from "lucide-react";
import Link from "next/link";
import { examService } from "@/lib/services";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Subject { id: string; name: string; questionCount: number }
interface ExamStat { _id: string; avgScore: number; totalAttempts: number; bestScore: number; totalCorrect: number }
type ExamKey = "gate" | "cat" | "upsc";

// ─── GATE CSE Data ───────────────────────────────────────────────────────────
const gateSyllabus = [
  { section: "Engineering Mathematics", weight: "15%", topics: ["Linear Algebra", "Calculus", "Probability", "Graph Theory", "Combinatorics"] },
  { section: "Digital Logic", weight: "5%", topics: ["Boolean Algebra", "Minimization", "Combinational Circuits", "Sequential Circuits", "Number Systems"] },
  { section: "Computer Organization", weight: "8%", topics: ["Machine Instructions", "ALU & Pipelining", "Memory Hierarchy", "I/O Interface", "Cache Design"] },
  { section: "Programming & DS", weight: "10%", topics: ["ANSI C", "Recursion", "Arrays & Linked Lists", "Stacks & Queues", "Trees & Graphs"] },
  { section: "Algorithms", weight: "12%", topics: ["Time Complexity", "Sorting & Searching", "Greedy", "Dynamic Programming", "NP-Completeness"] },
  { section: "Theory of Computation", weight: "8%", topics: ["Regular Languages", "Context-Free Grammars", "Turing Machines", "Decidability", "Complexity"] },
  { section: "Compiler Design", weight: "6%", topics: ["Lexical Analysis", "Parsing", "Syntax-Directed Translation", "Code Generation", "Optimisation"] },
  { section: "Operating Systems", weight: "10%", topics: ["Processes & Threads", "CPU Scheduling", "Memory Management", "File Systems", "Deadlocks"] },
  { section: "Databases", weight: "10%", topics: ["ER Model", "Relational Algebra", "SQL", "Normalisation", "Transactions & Concurrency"] },
  { section: "Computer Networks", weight: "9%", topics: ["OSI & TCP/IP", "Data Link Layer", "Network Layer / IP", "Transport Layer", "Application Layer"] },
];

const gatePYQ = [
  { year: "2025", link: "https://gateoverflow.in/tag/GATE2025", marks: 100, qs: 65 },
  { year: "2024", link: "https://gateoverflow.in/tag/GATE2024", marks: 100, qs: 65 },
  { year: "2023", link: "https://gateoverflow.in/tag/GATE2023", marks: 100, qs: 65 },
  { year: "2022", link: "https://gateoverflow.in/tag/GATE2022", marks: 100, qs: 65 },
  { year: "2021", link: "https://gateoverflow.in/tag/GATE2021", marks: 100, qs: 65 },
  { year: "2020", link: "https://gateoverflow.in/tag/GATE2020", marks: 100, qs: 65 },
  { year: "2018", link: "https://gateoverflow.in/tag/GATE2018", marks: 100, qs: 65 },
  { year: "2017", link: "https://gateoverflow.in/tag/GATE2017", marks: 100, qs: 65 },
];

const gateRoadmap = [
  { month: "Month 1 — Foundation", color: "border-blue-500/40 bg-blue-500/5", topics: ["Engineering Mathematics", "Digital Logic", "Computer Organization", "C Programming Basics", "Data Structures (Arrays, LL, Stack, Queue)"] },
  { month: "Month 2 — Core CS", color: "border-violet-500/40 bg-violet-500/5", topics: ["Algorithms (Sorting, DP, Greedy)", "Theory of Computation", "Compiler Design", "Operating Systems", "DBMS"] },
  { month: "Month 3 — Networks + Revision", color: "border-emerald-500/40 bg-emerald-500/5", topics: ["Computer Networks", "Full Syllabus Revision", "Previous Year Papers (2017–2025)", "10+ Full Mock Tests", "Weak Topics Focus"] },
];

const gateResources = [
  { name: "NPTEL / IIT Lectures", type: "Video", link: "https://www.youtube.com/@iit_madras_nptel", icon: "🎓", desc: "Free IIT lectures on all GATE subjects" },
  { name: "GateSmashers YouTube", type: "Video", link: "https://www.youtube.com/@GateSmashers", icon: "▶️", desc: "Topic-wise GATE videos with solved examples" },
  { name: "GeeksForGeeks GATE", type: "Website", link: "https://www.geeksforgeeks.org/gate-cs-notes-gq/", icon: "🌐", desc: "GATE CS notes, quizzes, and PYQs" },
  { name: "Made Easy / ACE Books", type: "Books", link: "https://www.madeeasy.in/books.php", icon: "📚", desc: "Standard GATE preparation books" },
  { name: "GATE Overflow", type: "QnA", link: "https://gateoverflow.in/", icon: "💬", desc: "Community Q&A for GATE PYQs with explanations" },
  { name: "Testbook GATE Mock", type: "Mock Tests", link: "https://testbook.com/gate-cse", icon: "📝", desc: "Free and paid full-length mock tests" },
];

// ─── CAT Data ────────────────────────────────────────────────────────────────
const catSyllabus = [
  { section: "Quantitative Aptitude (QA)", weight: "34 Qs", topics: ["Number System", "Arithmetic (Ratio, %, Profit & Loss, SI/CI)", "Algebra", "Geometry & Mensuration", "Modern Maths (P&C, Probability, Set Theory)"] },
  { section: "Verbal Ability & RC (VARC)", weight: "34 Qs", topics: ["Reading Comprehension (28+)", "Para Jumbles", "Para Summary", "Odd Sentence Out", "Critical Reasoning"] },
  { section: "Data Interpretation & LR (DILR)", weight: "32 Qs", topics: ["Tables & Graphs", "Caselets", "Seating Arrangement", "Blood Relations", "Logical Puzzles", "Games & Tournaments"] },
];

const catPYQ = [
  { year: "2024", link: "https://cracku.in/cat-previous-year-papers", slot: "Slot 1, 2, 3" },
  { year: "2023", link: "https://cracku.in/cat-previous-year-papers", slot: "Slot 1, 2, 3" },
  { year: "2022", link: "https://cracku.in/cat-previous-year-papers", slot: "Slot 1, 2, 3" },
  { year: "2021", link: "https://cracku.in/cat-previous-year-papers", slot: "Slot 1, 2, 3" },
  { year: "2020", link: "https://cracku.in/cat-previous-year-papers", slot: "Slot 1, 2, 3" },
  { year: "2019", link: "https://cracku.in/cat-previous-year-papers", slot: "Slot 1, 2" },
  { year: "2018", link: "https://cracku.in/cat-previous-year-papers", slot: "Slot 1, 2" },
  { year: "2017", link: "https://cracku.in/cat-previous-year-papers", slot: "Slot 1, 2" },
];

const catRoadmap = [
  { month: "Month 1–2 — Concept Building", color: "border-purple-500/40 bg-purple-500/5", topics: ["Number System fundamentals", "Basic Arithmetic (% age, SI/CI, ratio)", "Grammar rules & vocabulary", "RC passage practice daily", "Simple DI (graphs, tables)"] },
  { month: "Month 3–4 — Advanced Topics", color: "border-pink-500/40 bg-pink-500/5", topics: ["Geometry, Algebra, P&C", "Critical reasoning & Para Jumbles", "Complex DI sets + Caselets", "Seating arrangements & puzzles", "Weekly mock + analysis"] },
  { month: "Month 5–6 — Mock & Drill", color: "border-orange-500/40 bg-orange-500/5", topics: ["Full CAT mocks (2+ per week)", "Sectional mocks for weak areas", "PYQ analysis (2017–2024)", "Speed & accuracy drills", "Time management strategy"] },
];

const catResources = [
  { name: "IIM CAT Official Portal", type: "Official", link: "https://iimcat.ac.in/", icon: "🏛️", desc: "Official syllabus, registration, and notifications" },
  { name: "2IIM CAT Prep (Free Videos)", type: "Video", link: "https://www.2iim.com/", icon: "▶️", desc: "Excellent free QA and LR topic videos" },
  { name: "Cracku CAT Mock Tests", type: "Mocks", link: "https://cracku.in/cat", icon: "📝", desc: "Free CAT mocks with detailed analysis" },
  { name: "TathaGat / Arun Sharma Books", type: "Books", link: "https://www.amazon.in/s?k=cat+preparation+books+arun+sharma", icon: "📚", desc: "Industry-standard CAT prep books for all sections" },
  { name: "CATKing YouTube", type: "Video", link: "https://www.youtube.com/@CATKingRahulSingh", icon: "▶️", desc: "Strategy, tricks & previous year paper walkthroughs" },
  { name: "PaGaLGuY Forums", type: "Community", link: "https://www.pagalguy.com/", icon: "💬", desc: "Active CAT community, PYQ discussions, IIM insights" },
];

// ─── UPSC CSE Data ───────────────────────────────────────────────────────────
const upscSyllabus = [
  { section: "Prelims — General Studies Paper I", weight: "100 Qs / 200 marks", topics: ["History of India", "Indian & World Geography", "Indian Polity & Governance", "Economy & Development", "Environment & Ecology", "General Science"] },
  { section: "Prelims — CSAT Paper II (Qualifying)", weight: "80 Qs / 200 marks", topics: ["Reading Comprehension", "Interpersonal Skills", "Logical Reasoning & Analytical Ability", "Decision Making", "Basic Numeracy & Data Interpretation"] },
  { section: "Mains — General Studies I", weight: "250 marks", topics: ["Indian Heritage & Culture", "Modern Indian History", "Post-Independence Consolidation", "World History (18th–20th C)", "Indian Society"] },
  { section: "Mains — General Studies II", weight: "250 marks", topics: ["Indian Constitution & Polity", "Social Justice", "Governance", "International Relations", "India & Neighbours"] },
  { section: "Mains — General Studies III", weight: "250 marks", topics: ["Indian Economy", "Agriculture", "Science & Technology", "Environment & Disaster Management", "Security & Extremism"] },
  { section: "Mains — General Studies IV (Ethics)", weight: "250 marks", topics: ["Ethics & Human Interface", "Integrity", "Emotional Intelligence", "Attitude", "Case Studies"] },
  { section: "Mains — Essay Paper", weight: "250 marks", topics: ["Two essays from different sections", "Social/Political/Economic themes", "Philosophical/Abstract topics", "Writing clarity & structure"] },
  { section: "Optional Subject", weight: "500 marks", topics: ["PSIR", "Sociology", "History", "Geography", "Public Administration", "Economics", "Anthropology — choose wisely"] },
];

const upscPYQ = [
  { year: "2024 Prelims", link: "https://upsc.gov.in/examinations/previous-question-papers", paper: "GS I + CSAT" },
  { year: "2023 Prelims", link: "https://upsc.gov.in/examinations/previous-question-papers", paper: "GS I + CSAT" },
  { year: "2022 Prelims", link: "https://upsc.gov.in/examinations/previous-question-papers", paper: "GS I + CSAT" },
  { year: "2021 Prelims", link: "https://upsc.gov.in/examinations/previous-question-papers", paper: "GS I + CSAT" },
  { year: "2023 Mains", link: "https://upsc.gov.in/examinations/previous-question-papers", paper: "GS I–IV + Essay" },
  { year: "2022 Mains", link: "https://upsc.gov.in/examinations/previous-question-papers", paper: "GS I–IV + Essay" },
  { year: "2021 Mains", link: "https://upsc.gov.in/examinations/previous-question-papers", paper: "GS I–IV + Essay" },
  { year: "2020 Mains", link: "https://upsc.gov.in/examinations/previous-question-papers", paper: "GS I–IV + Essay" },
];

const upscRoadmap = [
  { month: "Phase 1 (6–9 months) — Foundation", color: "border-amber-500/40 bg-amber-500/5", topics: ["NCERT Class 6–12 (History, Geography, Economy, Science, Polity)", "Basic Indian Polity (Laxmikant)", "Modern India History (Spectrum / Bipin Chandra)", "Newspaper reading daily (The Hindu / IE)", "CSAT paper practice"] },
  { month: "Phase 2 (4–6 months) — Advanced", color: "border-red-500/40 bg-red-500/5", topics: ["Deep GS reading for Mains level", "Static subject mastery (Polity, Economy, Environment)", "Optional subject preparation starts", "Answer writing practice begins", "Previous year Prelims mock tests"] },
  { month: "Phase 3 (3–4 months) — Mains + Revision", color: "border-teal-500/40 bg-teal-500/5", topics: ["Intensive answer writing (daily)", "Essay writing practice (weekly)", "Full GS revision — all 4 papers", "Optional subject completion + mocks", "Current affairs compilation & revision"] },
];

const upscResources = [
  { name: "UPSC Official Website", type: "Official", link: "https://upsc.gov.in/", icon: "🏛️", desc: "Notifications, syllabus, calendar, PYQ papers" },
  { name: "VisionIAS Materials", type: "Study Material", link: "https://www.visionias.in/", icon: "📚", desc: "Premium notes, current affairs, test series" },
  { name: "Unacademy IAS (Free)", type: "Video", link: "https://unacademy.com/goal/upsc-civil-services-examination-ias/KSCGY", icon: "▶️", desc: "Free video lectures on GS subjects and current affairs" },
  { name: "Drishti IAS", type: "Website", link: "https://www.drishtiias.com/", icon: "🌐", desc: "Comprehensive study notes, editorials, prelims/mains tests" },
  { name: "PRS India (Polity/Bills)", type: "Resource", link: "https://prsindia.org/", icon: "📄", desc: "Track new bills, acts — essential for GS-II" },
  { name: "Insights IAS Test Series", type: "Mocks", link: "https://www.insightsonindia.com/", icon: "📝", desc: "Free Prelims & Mains test series with answers" },
];

// ─── Aptitude Global ─────────────────────────────────────────────────────────
const aptitudeTopics = [
  { category: "Arithmetic", icon: "🔢", coverage: "All exams", topics: ["Percentage & Profit-Loss", "Simple & Compound Interest", "Ratio & Proportions", "Time-Speed-Distance", "Time & Work", "Averages & Mixtures"] },
  { category: "Algebra & Numbers", icon: "📐", coverage: "GATE / CAT", topics: ["Number System & Divisibility", "LCM & HCF", "Quadratic Equations", "Progressions (AP/GP)", "Logarithms", "Surds & Indices"] },
  { category: "Geometry", icon: "📏", coverage: "CAT / UPSC", topics: ["Lines & Angles", "Triangles & Congruence", "Circles", "Polygons & Areas", "3D Mensuration", "Coordinate Geometry"] },
  { category: "Logical Reasoning", icon: "🧩", coverage: "All exams", topics: ["Syllogisms", "Blood Relations", "Direction Sense", "Coding-Decoding", "Series Completion", "Seating Arrangements"] },
  { category: "Data Interpretation", icon: "📊", coverage: "CAT / UPSC CSAT", topics: ["Bar Charts & Pie Charts", "Line Graphs", "Tables & Caselets", "Mixed DI sets", "Data Sufficiency"] },
  { category: "Verbal Reasoning", icon: "📝", coverage: "CAT / UPSC", topics: ["Sentence Correction", "Para Jumbles", "Critical Reasoning", "Reading Comprehension", "Vocabulary"] },
];

const aptitudePlatforms = [
  { name: "IndiaBix", link: "https://www.indiabix.com/", desc: "10000+ aptitude questions topic-wise with solutions", tag: "Free" },
  { name: "Testbook Aptitude", link: "https://testbook.com/aptitude/questions", desc: "Quizzes, mock tests, exam-specific aptitude prep", tag: "Free" },
  { name: "Career360 Practise", link: "https://school.careers360.com/examskr/aptitude-practice-questions", desc: "Aptitude tests for CAT, Bank, SSC, GATE", tag: "Free" },
  { name: "PrepInsta", link: "https://prepinsta.com/", desc: "Company-specific aptitude rounds preparation", tag: "Free" },
  { name: "GFG Aptitude", link: "https://www.geeksforgeeks.org/aptitude-questions-and-answers/", desc: "Topic-wise solved questions with explanation", tag: "Free" },
  { name: "Cracku QA Minis", link: "https://cracku.in/", desc: "Daily QA teasers and CAT-level quant drills", tag: "Free" },
];

// ─── Coding for Exam Prep ────────────────────────────────────────────────────
const codingTopics = [
  { name: "Data Structures", icon: "🏗️", importance: "GATE — very high", topics: ["Arrays & Strings", "Linked Lists", "Stacks & Queues", "Trees (BST, AVL, Heap)", "Hashing", "Graphs"] },
  { name: "Algorithms", icon: "⚙️", importance: "GATE / placements", topics: ["Sorting (Quick, Merge, Heap)", "Searching (Binary Search)", "Greedy Algorithms", "Dynamic Programming", "Graph Algorithms (BFS, DFS, Dijkstra)", "NP-Completeness basics"] },
  { name: "Programming Concepts", icon: "💡", importance: "GATE — moderate", topics: ["Recursion & Backtracking", "Bit Manipulation", "Time & Space Complexity", "ANSI C pointer arithmetic", "Memory management"] },
];

const codingPlatforms = [
  { name: "LeetCode", link: "https://leetcode.com/", icon: "🟡", desc: "2500+ problems, company-wise filters, contests", badge: "Best for DSA" },
  { name: "GeeksForGeeks", link: "https://www.geeksforgeeks.org/", icon: "🟢", desc: "GATE coding questions, theory + implementation", badge: "Best for GATE" },
  { name: "HackerRank", link: "https://www.hackerrank.com/", icon: "🟢", desc: "Beginner-friendly tracks: DS, Algorithms, SQL", badge: "Beginner" },
  { name: "Codeforces", link: "https://codeforces.com/", icon: "🔵", desc: "Competitive programming, weekly contests", badge: "Advanced" },
  { name: "CodeChef", link: "https://www.codechef.com/", icon: "🟣", desc: "Long challenges, practice tracks, rated contests", badge: "Competitions" },
  { name: "InterviewBit", link: "https://www.interviewbit.com/", icon: "🟤", desc: "Structured DSA + system design learning path", badge: "Interviews" },
];

// ─── Subjecticon map ──────────────────────────────────────────────────────────
const subjectIcons: Record<string, string> = {
  dsa: "🏗️", os: "💻", dbms: "🗄️", cn: "🌐", oops: "🧩",
  "web-dev": "🕸️", "system-design": "🏛️", aptitude: "🧠", reasoning: "🔍", verbal: "📝",
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">{icon}</div>
      <div>
        <h2 className="text-lg font-black tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
      </div>
    </div>
  );
}

function PYQCard({ year, link, extra }: { year: string; link: string; extra: string }) {
  return (
    <a href={link} target="_blank" rel="noopener noreferrer"
      className="group flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-4 py-3 hover:border-primary/40 hover:bg-primary/5 transition-all">
      <div>
        <p className="font-bold text-sm">{year}</p>
        <p className="text-[10px] text-muted-foreground">{extra}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <Download size={12} /> Access
      </div>
    </a>
  );
}

function ResourceCard({ item }: { item: { name: string; type: string; link: string; icon: string; desc: string } }) {
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border border-border/40 p-4 hover:border-primary/40 hover:shadow-md hover:bg-primary/5 transition-all h-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{item.name}</p>
          <Badge variant="outline" className="text-[9px] h-4 px-1">{item.type}</Badge>
        </div>
        <ExternalLink size={11} className="text-muted-foreground/50 shrink-0" />
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
    </a>
  );
}

function RoadmapPhase({ phase }: { phase: { month: string; color: string; topics: string[] } }) {
  return (
    <div className={`rounded-2xl border p-4 ${phase.color}`}>
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
        <Calendar size={14} className="text-primary" />
        {phase.month}
      </h3>
      <ul className="space-y-1.5">
        {phase.topics.map((t) => (
          <li key={t} className="flex items-start gap-2 text-xs text-muted-foreground">
            <ChevronRight size={12} className="text-primary shrink-0 mt-0.5" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── GATE Tab ─────────────────────────────────────────────────────────────────
function GateTab() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Marks", value: "100", icon: "🏆" },
          { label: "Questions", value: "65", icon: "❓" },
          { label: "Duration", value: "3 hrs", icon: "⏱️" },
          { label: "Negative Marking", value: "1/3", icon: "⚠️" },
        ].map((s) => (
          <Card key={s.label} className="hover-lift">
            <CardContent className="p-4 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <p className="text-lg font-black">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roadmap */}
      <div>
        <SectionTitle icon={<Map size={16} className="text-primary" />} title="3-Month Study Roadmap" subtitle="Structured plan from foundation to full mocks" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gateRoadmap.map((p) => <RoadmapPhase key={p.month} phase={p} />)}
        </div>
      </div>

      {/* Syllabus */}
      <div>
        <SectionTitle icon={<ListChecks size={16} className="text-primary" />} title="Complete Syllabus with Weightage" subtitle="Based on GATE 2024 analysis" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {gateSyllabus.map((s) => (
            <Card key={s.section} className="hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold">{s.section}</h3>
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{s.weight}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.topics.map((t) => (
                    <span key={t} className="text-[10px] bg-muted rounded-md px-2 py-0.5 text-muted-foreground">{t}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* PYQ */}
      <div>
        <SectionTitle icon={<FileText size={16} className="text-primary" />} title="Previous Year Question Papers" subtitle="Access official GATE CSE papers — click to open" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {gatePYQ.map((p) => (
            <PYQCard key={p.year} year={`GATE ${p.year}`} link={p.link} extra={`${p.qs} questions · ${p.marks} marks`} />
          ))}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <a href="https://gateoverflow.in/previous-years" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1 text-xs"><ExternalLink size={11} /> All PYQs on GATE Overflow</Button>
          </a>
          <a href="https://www.geeksforgeeks.org/gate-previous-year-question-papers/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1 text-xs"><ExternalLink size={11} /> GFG GATE PYQ Archive</Button>
          </a>
        </div>
      </div>

      {/* Resources */}
      <div>
        <SectionTitle icon={<BookOpen size={16} className="text-primary" />} title="Where to Study" subtitle="Free & paid resources — ranked by effectiveness" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {gateResources.map((r) => <ResourceCard key={r.name} item={r} />)}
        </div>
      </div>

      {/* Practice Inside CareerX */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold text-sm">Practice GATE-style MCQs inside CareerX</p>
            <p className="text-xs text-muted-foreground">DSA, OS, DBMS, CN & more — with instant scoring</p>
          </div>
          <Link href="/dashboard/test-practice"><Button size="sm" variant="gradient" className="gap-1"><Zap size={12} /> Start Practice</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── CAT Tab ──────────────────────────────────────────────────────────────────
function CatTab() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Marks", value: "228", icon: "🏆" },
          { label: "Questions", value: "66", icon: "❓" },
          { label: "Duration", value: "2 hrs", icon: "⏱️" },
          { label: "Top Percentile", value: "99%+", icon: "🎯" },
        ].map((s) => (
          <Card key={s.label} className="hover-lift">
            <CardContent className="p-4 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <p className="text-lg font-black">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roadmap */}
      <div>
        <SectionTitle icon={<Map size={16} className="text-primary" />} title="6-Month Study Roadmap" subtitle="From basics to 99+ percentile strategy" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {catRoadmap.map((p) => <RoadmapPhase key={p.month} phase={p} />)}
        </div>
      </div>

      {/* Syllabus */}
      <div>
        <SectionTitle icon={<ListChecks size={16} className="text-primary" />} title="Section-wise Syllabus" subtitle="CAT 2024 pattern — 3 sections" />
        <div className="space-y-3">
          {catSyllabus.map((s) => (
            <Card key={s.section} className="hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold">{s.section}</h3>
                  <Badge className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">{s.weight}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.topics.map((t) => (
                    <span key={t} className="text-[10px] bg-muted rounded-md px-2 py-0.5 text-muted-foreground">{t}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* PYQ */}
      <div>
        <SectionTitle icon={<FileText size={16} className="text-primary" />} title="Previous Year Question Papers" subtitle="All slots available — click to access" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {catPYQ.map((p) => (
            <PYQCard key={p.year} year={`CAT ${p.year}`} link={p.link} extra={p.slot} />
          ))}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <a href="https://cracku.in/cat/previous-papers" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1 text-xs"><ExternalLink size={11} /> Cracku CAT Papers Archive</Button>
          </a>
          <a href="https://iimcat.ac.in/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1 text-xs"><ExternalLink size={11} /> Official IIM CAT Portal</Button>
          </a>
        </div>
      </div>

      {/* Resources */}
      <div>
        <SectionTitle icon={<BookOpen size={16} className="text-primary" />} title="Where to Study" subtitle="Best free and paid CAT resources" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {catResources.map((r) => <ResourceCard key={r.name} item={r} />)}
        </div>
      </div>

      {/* IIM Cut-offs */}
      <div>
        <SectionTitle icon={<Award size={16} className="text-primary" />} title="IIM Cut-off Reference (Approx.)" subtitle="Varies every year — use as guidance only" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { iim: "IIM A", cutoff: "99.5+" }, { iim: "IIM B", cutoff: "99+" }, { iim: "IIM C", cutoff: "99+" },
            { iim: "IIM L", cutoff: "98+" }, { iim: "IIM K", cutoff: "97+" }, { iim: "New IIMs", cutoff: "90–95" },
          ].map((c) => (
            <div key={c.iim} className="rounded-xl border border-border/40 p-3 text-center hover:border-primary/30 transition-all">
              <p className="font-black text-sm">{c.iim}</p>
              <p className="text-xs text-primary font-semibold">{c.cutoff}</p>
              <p className="text-[9px] text-muted-foreground">percentile</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── UPSC Tab ─────────────────────────────────────────────────────────────────
function UpscTab() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Prelims", value: "June", icon: "📋" },
          { label: "Mains", value: "Sept/Oct", icon: "✍️" },
          { label: "Interview", value: "Feb/Mar", icon: "🎤" },
          { label: "Vacancies", value: "~1000/yr", icon: "👥" },
        ].map((s) => (
          <Card key={s.label} className="hover-lift">
            <CardContent className="p-4 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <p className="text-lg font-black">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roadmap */}
      <div>
        <SectionTitle icon={<Map size={16} className="text-primary" />} title="12–18 Month Study Roadmap" subtitle="The proven path from zero to IAS/IPS/IFS" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upscRoadmap.map((p) => <RoadmapPhase key={p.month} phase={p} />)}
        </div>
      </div>

      {/* Syllabus */}
      <div>
        <SectionTitle icon={<ListChecks size={16} className="text-primary" />} title="Complete Syllabus Breakdown" subtitle="Both Prelims and Mains covered" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {upscSyllabus.map((s) => (
            <Card key={s.section} className="hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold leading-tight">{s.section}</h3>
                  <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20 shrink-0 ml-2">{s.weight}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.topics.map((t) => (
                    <span key={t} className="text-[10px] bg-muted rounded-md px-2 py-0.5 text-muted-foreground">{t}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* PYQ */}
      <div>
        <SectionTitle icon={<FileText size={16} className="text-primary" />} title="Previous Year Question Papers" subtitle="Prelims + Mains — click to access on UPSC official site" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {upscPYQ.map((p) => (
            <PYQCard key={p.year} year={p.year} link={p.link} extra={p.paper} />
          ))}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <a href="https://upsc.gov.in/examinations/previous-question-papers" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1 text-xs"><ExternalLink size={11} /> UPSC Official PYQ Page</Button>
          </a>
          <a href="https://www.drishtiias.com/upsc-prelims-papers" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1 text-xs"><ExternalLink size={11} /> Drishti IAS Paper Archive</Button>
          </a>
        </div>
      </div>

      {/* Resources */}
      <div>
        <SectionTitle icon={<BookOpen size={16} className="text-primary" />} title="Where to Study" subtitle="Trusted free & premium UPSC resources" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {upscResources.map((r) => <ResourceCard key={r.name} item={r} />)}
        </div>
      </div>

      {/* NCERT Booklist */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-amber-400" />
            <h3 className="font-bold text-sm">NCERT Booklist — Start Here First</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              "History 6–10, 11–12 (Themes)",
              "Geography 6–12 (all)",
              "Polity 9–12 (Civics)",
              "Economy 10–12 (Eco)",
              "Science 6–10 (all)",
              "Biology 12 (Env ecology)",
            ].map((b) => (
              <div key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 size={11} className="text-amber-400 shrink-0" />{b}
              </div>
            ))}
          </div>
          <a href="https://ncert.nic.in/textbook.php" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline">
            <ExternalLink size={11} /> Download free at ncert.nic.in
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Aptitude & Coding Tab ───────────────────────────────────────────────────
function AptitudeTab() {
  return (
    <div className="space-y-6">
      {/* Aptitude topics */}
      <div>
        <SectionTitle icon={<Brain size={16} className="text-primary" />} title="Aptitude Topics to Master" subtitle="From basic arithmetic to advanced DI — covers all major exams" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {aptitudeTopics.map((a) => (
            <Card key={a.category} className="hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{a.icon}</span>
                  <div>
                    <h3 className="font-bold text-sm">{a.category}</h3>
                    <Badge variant="outline" className="text-[9px]">{a.coverage}</Badge>
                  </div>
                </div>
                <ul className="space-y-1">
                  {a.topics.map((t) => (
                    <li key={t} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <ChevronRight size={10} className="text-primary shrink-0" />{t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Aptitude Practice Platforms */}
      <div>
        <SectionTitle icon={<Globe size={16} className="text-primary" />} title="Where to Practice Aptitude" subtitle="All free platforms with structured content" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {aptitudePlatforms.map((p) => (
            <a key={p.name} href={p.link} target="_blank" rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-border/40 p-4 hover:border-primary/40 hover:bg-primary/5 transition-all">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{p.name}</h3>
                <div className="flex items-center gap-1">
                  <Badge className="text-[9px] bg-green-500/10 text-green-400 border-green-500/20">{p.tag}</Badge>
                  <ExternalLink size={11} className="text-muted-foreground/50" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">{p.desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Coding Section */}
      <div>
        <SectionTitle icon={<Code2 size={16} className="text-primary" />} title="Coding Preparation" subtitle="What to study and where to practice for GATE & tech roles" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {codingTopics.map((c) => (
            <Card key={c.name} className="hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <h3 className="font-bold text-sm">{c.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{c.importance}</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  {c.topics.map((t) => (
                    <li key={t} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <ChevronRight size={10} className="text-primary shrink-0" />{t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coding Platforms */}
      <div>
        <SectionTitle icon={<TrendingUp size={16} className="text-primary" />} title="Coding Practice Platforms" subtitle="Pick and stick to 1–2 platforms" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {codingPlatforms.map((p) => (
            <a key={p.name} href={p.link} target="_blank" rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-border/40 p-4 hover:border-primary/40 hover:bg-primary/5 transition-all">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{p.icon}</span>
                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{p.name}</h3>
                </div>
                <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">{p.badge}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">{p.desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* DSA Problems button */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold text-sm">Practice 75+ curated DSA problems</p>
            <p className="text-xs text-muted-foreground">LeetCode problems sorted by topic, difficulty, and company</p>
          </div>
          <Link href="/dashboard/smart-search"><Button size="sm" variant="gradient" className="gap-1"><Code2 size={12} /> DSA Problems</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExamPrepPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<ExamStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ExamKey | "aptitude">("gate");

  useEffect(() => {
    Promise.all([
      examService.getSubjects().catch(() => ({ data: { subjects: [] } })),
      examService.getHistory().catch(() => ({ data: { stats: [] } })),
    ]).then(([subRes, histRes]) => {
      setSubjects(subRes.data?.subjects || []);
      setStats(histRes.data?.stats || []);
    }).finally(() => setLoading(false));
  }, []);

  const totalQuestions = subjects.reduce((s, x) => s + x.questionCount, 0);
  const totalAttempts = stats.reduce((s, x) => s + x.totalAttempts, 0);

  const tabs: { key: ExamKey | "aptitude"; label: string; icon: string; color: string }[] = [
    { key: "gate",     label: "GATE CSE",       icon: "🎓", color: "from-blue-500 to-indigo-500" },
    { key: "cat",      label: "CAT",            icon: "📊", color: "from-purple-500 to-pink-500" },
    { key: "upsc",     label: "UPSC CSE",       icon: "🏛️", color: "from-amber-500 to-orange-500" },
    { key: "aptitude", label: "Aptitude & Code", icon: "🧠", color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="space-y-6 page-enter-stagger">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Exam Preparation</h1>
        <p className="text-muted-foreground/70 text-sm">Comprehensive guides for GATE CSE, CAT, and UPSC — roadmaps, previous year papers, resources, and more.</p>
      </div>

      {/* Practice Subjects from Backend */}
      {!loading && subjects.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap size={16} className="text-primary" /> Practice Subjects
              <Badge variant="secondary" className="text-[10px]">{totalQuestions} questions · {totalAttempts} attempts</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {subjects.map((sub) => {
                const stat = stats.find((s) => s._id === sub.id);
                return (
                  <Link key={sub.id} href={`/dashboard/test-practice?subject=${sub.id}`}>
                    <div className="rounded-xl border border-border/40 p-3 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group h-full">
                      <div className="text-xl mb-1.5">{subjectIcons[sub.id] || "📚"}</div>
                      <h3 className="font-bold text-xs mb-0.5 group-hover:text-primary transition-colors">{sub.name}</h3>
                      <p className="text-[10px] text-muted-foreground">{sub.questionCount} questions</p>
                      {stat && <p className="text-[10px] text-primary font-semibold mt-1">Best: {Math.round(stat.bestScore)}%</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={22} className="animate-spin text-primary" />
        </div>
      )}

      {/* Exam Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border transition-all cursor-pointer ${
              activeTab === t.key
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "gate"     && <GateTab />}
      {activeTab === "cat"      && <CatTab />}
      {activeTab === "upsc"     && <UpscTab />}
      {activeTab === "aptitude" && <AptitudeTab />}
    </div>
  );
}