"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck, Play, CheckCircle2, XCircle, Clock,
  Trophy, BarChart3, ChevronRight, RotateCcw, Loader2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { examService } from "@/lib/services";

interface Subject {
  id: string;
  name: string;
  questionCount: number;
}

interface Question {
  index: number;
  questionId: string;
  question: string;
  options: string[];
}

interface ResultItem {
  question: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer: number;
  isCorrect: boolean;
  explanation: string;
}

interface ExamResult {
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  totalQuestions: number;
  xpEarned: number;
  results: ResultItem[];
}

const subjectIcons: Record<string, string> = {
  dsa: "🏗️", os: "💻", dbms: "🗄️", cn: "🌐", oops: "🧩",
  "web-dev": "🕸️", "system-design": "🏛️", aptitude: "🧠", reasoning: "🔍", verbal: "📝",
};

function TestPracticeContent() {
  const searchParams = useSearchParams();
  const preselectedSubject = searchParams.get("subject");

  const [stage, setStage] = useState<"select" | "test" | "result">("select");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  // Test state
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Result state
  const [result, setResult] = useState<ExamResult | null>(null);
  const [reviewIdx, setReviewIdx] = useState<number | null>(null);

  // History stats
  const [stats, setStats] = useState({ tests: 0, avgScore: 0, bestScore: 0, totalQs: 0 });

  useEffect(() => {
    Promise.all([
      examService.getSubjects().catch(() => ({ data: { subjects: [] } })),
      examService.getHistory().catch(() => ({ data: { stats: [], attempts: [] } })),
    ]).then(([subRes, histRes]) => {
      setSubjects(subRes.data?.subjects || []);
      const allStats = histRes.data?.stats || [];
      const attempts = histRes.data?.attempts || [];
      const totalTests = allStats.reduce((s: number, x: { totalAttempts: number }) => s + x.totalAttempts, 0);
      const avgS = totalTests > 0
        ? Math.round(allStats.reduce((s: number, x: { avgScore: number; totalAttempts: number }) => s + x.avgScore * x.totalAttempts, 0) / totalTests)
        : 0;
      const bestS = allStats.length > 0
        ? Math.round(Math.max(...allStats.map((x: { bestScore: number }) => x.bestScore)))
        : 0;
      const totalQs = allStats.reduce((s: number, x: { totalCorrect: number }) => s + x.totalCorrect, 0);
      setStats({ tests: totalTests, avgScore: avgS, bestScore: bestS, totalQs });
    }).finally(() => setLoading(false));
  }, []);

  // Auto-start if subject param is present
  useEffect(() => {
    if (preselectedSubject && subjects.length > 0 && stage === "select") {
      const found = subjects.find((s) => s.id === preselectedSubject);
      if (found) startTest(found.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedSubject, subjects]);

  const startTest = useCallback(async (subjectId: string) => {
    setStarting(true);
    try {
      const res = await examService.start({ subject: subjectId, questionCount: 10 });
      const data = res.data;
      setAttemptId(data.attemptId);
      setQuestions(data.questions || []);
      setCurrentQ(0);
      setAnswers({});
      setSelectedAnswer(null);
      setResult(null);
      setReviewIdx(null);
      setStage("test");
    } catch {
      // Stay on select if failed
    } finally {
      setStarting(false);
    }
  }, []);

  const selectOption = (optIdx: number) => {
    setSelectedAnswer(optIdx);
    setAnswers((prev) => ({ ...prev, [String(currentQ)]: optIdx }));
  };

  const submitTest = async () => {
    setSubmitting(true);
    try {
      const res = await examService.submit(attemptId, answers);
      setResult(res.data);
      setStage("result");
    } catch {
      // Handle error gracefully
    } finally {
      setSubmitting(false);
    }
  };

  const goToQuestion = (idx: number) => {
    setCurrentQ(idx);
    setSelectedAnswer(answers[String(idx)] ?? null);
  };

  const nextQuestion = () => {
    if (currentQ >= questions.length - 1) return;
    goToQuestion(currentQ + 1);
  };

  const prevQuestion = () => {
    if (currentQ <= 0) return;
    goToQuestion(currentQ - 1);
  };

  const resetTest = () => {
    setStage("select");
    setAttemptId("");
    setQuestions([]);
    setCurrentQ(0);
    setAnswers({});
    setSelectedAnswer(null);
    setResult(null);
    setReviewIdx(null);
  };

  const q = questions[currentQ];

  return (
    <div className="space-y-6 page-enter-stagger">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Test Practice</h1>
        <p className="text-muted-foreground/70">Practice MCQs across various topics to sharpen your skills.</p>
      </div>


      {stage === "select" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Tests Taken", value: String(stats.tests), icon: ClipboardCheck },
              { label: "Avg Score", value: `${stats.avgScore}%`, icon: BarChart3 },
              { label: "Best Score", value: `${stats.bestScore}%`, icon: Trophy },
              { label: "Questions Solved", value: String(stats.totalQs), icon: CheckCircle2 },
            ].map((stat) => (
              <Card key={stat.label} className="hover-lift">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <stat.icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="stat-number text-xl">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Topic Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {subjects.map((sub) => (
                <Card key={sub.id} className="cursor-pointer hover-lift transition-all group" onClick={() => startTest(sub.id)}>
                  <CardContent className="p-5">
                    <div className="text-3xl mb-3">{subjectIcons[sub.id] || "📚"}</div>
                    <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{sub.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{sub.questionCount} questions</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4 gap-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all" disabled={starting}>
                      {starting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Start Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {subjects.length === 0 && (
                <p className="col-span-4 text-center text-sm text-muted-foreground py-8">No subjects available. Seed exam questions first via the seed endpoint.</p>
              )}
            </div>
          )}
        </>
      )}

      {stage === "test" && q && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Progress Bar */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <ClipboardCheck size={12} /> Question {currentQ + 1}/{questions.length}
              </Badge>
              <Badge variant="outline" className="gap-1">
                {Object.keys(answers).length}/{questions.length} answered
              </Badge>
            </div>
            <Button variant="destructive" size="sm" onClick={submitTest} disabled={submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null} End Test
            </Button>
          </div>
          <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1.5" />

          {/* Question Dots */}
          <div className="flex flex-wrap gap-1.5">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => goToQuestion(i)}
                className={`w-7 h-7 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                  i === currentQ
                    ? "bg-primary text-white"
                    : answers[String(i)] !== undefined
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Question Card */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-6">{q.question}</h2>

              <div className="space-y-3">
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectOption(idx)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                      selectedAnswer === idx
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/30 hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                        selectedAnswer === idx ? "bg-primary text-white border-primary" : ""
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span>{opt}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" disabled={currentQ <= 0} onClick={prevQuestion}>
                  Previous
                </Button>
                {currentQ >= questions.length - 1 ? (
                  <Button variant="gradient" className="gap-2" onClick={submitTest} disabled={submitting}>
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Submit Test
                  </Button>
                ) : (
                  <Button variant="gradient" className="gap-2" onClick={nextQuestion}>
                    Next <ChevronRight size={14} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {stage === "result" && result && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="text-center">
            <CardContent className="p-10">
              <div className="text-6xl mb-4">{result.score >= 80 ? "🎉" : result.score >= 50 ? "👍" : "💪"}</div>
              <h2 className="text-2xl font-black mb-2">Test Completed!</h2>
              <p className="text-muted-foreground mb-6">Here&apos;s your performance summary</p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl bg-green-500/10 p-4">
                  <p className="text-2xl font-bold text-green-500">{result.correct}</p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="rounded-2xl bg-red-500/10 p-4">
                  <p className="text-2xl font-bold text-red-500">{result.wrong}</p>
                  <p className="text-xs text-muted-foreground">Incorrect</p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-4">
                  <p className="text-2xl font-bold text-primary">{Math.round(result.score)}%</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>

              {result.xpEarned > 0 && (
                <p className="text-sm text-muted-foreground mb-4">+{result.xpEarned} XP earned!</p>
              )}

              <div className="flex gap-3 justify-center">
                <Button variant="outline" className="gap-2" onClick={resetTest}>
                  <RotateCcw size={14} /> Try Again
                </Button>
                <Button variant="gradient" className="gap-2" onClick={() => setReviewIdx(reviewIdx !== null ? null : 0)}>
                  <ClipboardCheck size={14} /> {reviewIdx !== null ? "Hide Review" : "Review Answers"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Answer Review */}
          {reviewIdx !== null && result.results && (
            <div className="space-y-4">
              {result.results.map((r, i) => (
                <Card key={i} className={`border-l-4 ${r.isCorrect ? "border-l-green-500" : "border-l-red-500"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-2 mb-3">
                      {r.isCorrect ? (
                        <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm font-semibold">{r.question}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {r.options.map((opt, oi) => (
                        <div key={oi} className={`text-xs rounded-lg px-3 py-2 border ${
                          oi === r.correctAnswer ? "bg-green-500/10 border-green-500/30 font-semibold" :
                          oi === r.selectedAnswer && !r.isCorrect ? "bg-red-500/10 border-red-500/30" :
                          "border-border/40"
                        }`}>
                          {String.fromCharCode(65 + oi)}. {opt}
                        </div>
                      ))}
                    </div>
                    {r.explanation && (
                      <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
                        <p className="text-xs text-muted-foreground"><span className="font-semibold text-primary">Explanation:</span> {r.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestPracticePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>}>
      <TestPracticeContent />
    </Suspense>
  );
}
