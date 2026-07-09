"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, CheckCircle2, XCircle, ChevronRight, Clock, Filter, Loader2, Trophy,
} from "lucide-react";
import { examService } from "@/lib/services";

interface Option { id: string; text: string }
interface Question { _id?: string; id?: number; index?: number; subject: string; question: string; options: Option[]; explanation: string; difficulty: string; year?: string }
interface Subject { subjectId: string; name: string; count: number }
interface ExamResult { question: string; options: string[]; correctAnswer: number; selectedAnswer: number; isCorrect: boolean; explanation: string }

export default function ExamMCQPage() {
  const [subjects, setSubjects] = useState<Subject[]>([{ subjectId: "", name: "All Subjects", count: 0 }]);
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [scoreInfo, setScoreInfo] = useState<{ score: number; correct: number; wrong: number; skipped: number; xpEarned: number } | null>(null);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await examService.getSubjects();
        const data = res.data?.subjects || res.data || [];
        if (Array.isArray(data) && data.length > 0) {
          const subs: Subject[] = [{ subjectId: "", name: "All Subjects", count: data.reduce((acc: number, s: Record<string, unknown>) => acc + ((s.questionCount as number) || (s.count as number) || 0), 0) }];
          data.forEach((s: Record<string, unknown>) => subs.push({ subjectId: (s.id as string) || (s._id as string) || "", name: s.name as string || s.subject as string || "", count: (s.questionCount as number) || (s.count as number) || 0 }));
          setSubjects(subs);
        }
      } catch (e) { console.error("Failed to load subjects", e); }
    };
    loadSubjects();
  }, []);

  const startExam = async (subject?: string) => {
    setLoading(true);
    setSubmitted(false);
    setResults([]);
    setScoreInfo(null);
    try {
      const match = subjects.find((s) => s.name === subject);
      const subjectParam = match?.subjectId || (subject && subject !== "All Subjects" ? subject : subjects.find((s) => s.subjectId)?.subjectId || "dsa");
      const res = await examService.start({ subject: subjectParam, questionCount: 5 });
      const exam = res.data?.attempt || res.data;
      setAttemptId(exam._id || exam.attemptId || null);
      const rawQs = exam.questions || [];
      const qs: Question[] = rawQs.map((q: Record<string, unknown>, qIdx: number) => {
        const rawOpts = (q.options || []) as Array<unknown>;
        const options = rawOpts.map((opt: unknown, idx: number) => {
          if (typeof opt === "string") {
            return { id: String.fromCharCode(97 + idx), text: opt };
          }
          return opt as { id: string; text: string };
        });
        return { ...q, index: (q.index as number) ?? qIdx, options } as unknown as Question;
      });
      setQuestions(qs);
      setAnswers({});
    } catch (e) { console.error("Failed to start exam", e); }
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await examService.start({ subject: "dsa", questionCount: 5 });
        if (!mounted) return;
        const exam = res.data?.attempt || res.data;
        setAttemptId(exam._id || exam.attemptId || null);
        const rawQs = exam.questions || [];
        const qs: Question[] = rawQs.map((q: Record<string, unknown>, qIdx: number) => {
          const rawOpts = (q.options || []) as Array<unknown>;
          const options = rawOpts.map((opt: unknown, idx: number) => {
            if (typeof opt === "string") return { id: String.fromCharCode(97 + idx), text: opt };
            return opt as { id: string; text: string };
          });
          return { ...q, index: (q.index as number) ?? qIdx, options } as unknown as Question;
        });
        setQuestions(qs);
        setAnswers({});
      } catch (e) { console.error("Failed to start exam", e); }
      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  const selectSubject = (name: string) => {
    setSelectedSubject(name);
    startExam(name);
  };

  const handleAnswer = (qKey: string, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qKey]: optionId }));
  };

  const submitExam = async () => {
    if (!attemptId) return;
    setSubmitting(true);
    try {
      const formatted: Record<string, number> = {};
      questions.forEach((q, idx) => {
        const qKey = q._id || String(q.id || q.index || idx);
        const ans = answers[qKey];
        if (ans) {
          formatted[String(idx)] = ans.charCodeAt(0) - 97;
        }
      });
      const res = await examService.submit(attemptId, formatted);
      const data = res.data;
      setResults(data.results || []);
      setScoreInfo({ score: data.score, correct: data.correct, wrong: data.wrong, skipped: data.skipped, xpEarned: data.xpEarned });
      setSubmitted(true);
    } catch (e) { console.error("Submit failed", e); }
    setSubmitting(false);
  };

  // Helper: get result for a question by index
  const getResult = (idx: number): ExamResult | undefined => results[idx];

  return (
    <div className="space-y-6 page-enter-stagger">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Exam MCQs</h1>
        <p className="text-muted-foreground/70">Practice GATE-style MCQs with detailed explanations.</p>
      </div>

      {submitted && scoreInfo && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-primary" />
                <span className="text-2xl font-black">{scoreInfo.score}%</span>
              </div>
              <Badge variant="success" className="text-xs">{scoreInfo.correct} Correct</Badge>
              <Badge variant="destructive" className="text-xs">{scoreInfo.wrong} Wrong</Badge>
              {scoreInfo.skipped > 0 && <Badge variant="secondary" className="text-xs">{scoreInfo.skipped} Skipped</Badge>}
              <Badge variant="outline" className="text-xs">+{scoreInfo.xpEarned} XP</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted"><Filter size={12} /></div> Subjects</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <nav className="space-y-0.5">
              {subjects.map((sub) => (
                <button
                  key={sub.name}
                  onClick={() => selectSubject(sub.name)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-all cursor-pointer ${
                    selectedSubject === sub.name ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{sub.name}</span>
                  <Badge variant="secondary" className="text-xs">{sub.count}</Badge>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
          ) : questions.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">No questions available. Try seeding exam data first.</CardContent></Card>
          ) : (
            <>
              {questions.map((q, idx) => {
                const qKey = q._id || String(q.id || q.index || idx);
                const result = getResult(idx);
                return (
                  <Card key={qKey}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary" className="text-xs">{q.subject}</Badge>
                        <Badge variant={q.difficulty === "Easy" ? "success" : q.difficulty === "Medium" ? "warning" : "destructive"} className="text-xs">
                          {q.difficulty || "Medium"}
                        </Badge>
                        {q.year && <Badge variant="outline" className="text-xs">{q.year}</Badge>}
                        {submitted && result && (
                          <Badge variant={result.isCorrect ? "success" : "destructive"} className="text-xs ml-auto">
                            {result.isCorrect ? "Correct" : "Incorrect"}
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-bold mb-4">{q.question}</h3>

                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = answers[qKey] === opt.id;
                          const isCorrectOption = submitted && result && result.correctAnswer === optIdx;
                          const isWrongSelected = submitted && result && isSelected && !result.isCorrect;

                          let optionClass = "hover:border-primary/30 hover:bg-primary/5";
                          let circleClass = "";
                          let icon: React.ReactNode = opt.id.toUpperCase();

                          if (submitted && result) {
                            if (isCorrectOption) {
                              optionClass = "border-green-500 bg-green-500/5";
                              circleClass = "bg-green-500 text-white border-green-500";
                              icon = <CheckCircle2 size={14} />;
                            } else if (isWrongSelected) {
                              optionClass = "border-red-500 bg-red-500/5";
                              circleClass = "bg-red-500 text-white border-red-500";
                              icon = <XCircle size={14} />;
                            }
                          } else if (isSelected) {
                            optionClass = "border-primary bg-primary/10";
                            circleClass = "bg-primary text-white border-primary";
                          }

                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleAnswer(qKey, opt.id)}
                              disabled={submitted}
                              className={`w-full text-left rounded-xl border p-3 text-sm transition-all cursor-pointer ${optionClass}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${circleClass}`}>
                                  {icon}
                                </div>
                                <span>{opt.text}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {submitted && result && result.explanation && (
                        <div className="mt-4 rounded-xl bg-primary/5 border border-primary/15 p-4">
                          <h4 className="text-sm font-bold text-primary mb-1">Explanation</h4>
                          <p className="text-sm text-muted-foreground">{result.explanation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              <div className="flex justify-center gap-3">
                {!submitted ? (
                  <Button variant="gradient" className="gap-2" onClick={submitExam} disabled={submitting || Object.keys(answers).length === 0}>
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {submitting ? "Submitting..." : "Submit Exam"}
                  </Button>
                ) : (
                  <Button variant="gradient" className="gap-2" onClick={() => startExam(selectedSubject)}>
                    Try Again <ChevronRight size={14} />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
