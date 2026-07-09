"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Video, Mic, MicOff, VideoOff, Play, StopCircle, CheckCircle2,
  RotateCcw, ChevronRight, Brain, MessageSquare,
  Star, BarChart3, Loader2, Clock,
} from "lucide-react";
import { interviewService } from "@/lib/services";

interface HistorySession {
  _id: string;
  type: string;
  difficulty: string;
  role: string;
  company: string;
  averageScore: number;
  totalQuestions: number;
  answeredQuestions: number;
  duration: number;
  xpEarned: number;
  createdAt: string;
}

const interviewTypes = [
  {
    title: "Technical (DSA)",
    type: "technical",
    icon: "💻",
    description: "Practice DSA, algorithms, and coding questions.",
    duration: "45 min",
    difficulty: "Hard",
    color: "from-red-500 to-orange-400",
  },
  {
    title: "System Design",
    type: "system-design",
    icon: "🏗️",
    description: "Architecture and system design for senior roles.",
    duration: "45 min",
    difficulty: "Hard",
    color: "from-purple-500 to-violet-400",
  },
  {
    title: "Behavioral",
    type: "behavioral",
    icon: "🤝",
    description: "STAR method behavioral and situational questions.",
    duration: "30 min",
    difficulty: "Medium",
    color: "from-green-500 to-emerald-400",
  },
  {
    title: "HR Round",
    type: "hr",
    icon: "👔",
    description: "Common HR questions, salary negotiation, and more.",
    duration: "30 min",
    difficulty: "Easy",
    color: "from-blue-500 to-cyan-400",
  },
];

export default function InterviewLabPage() {
  const [stage, setStage] = useState<"overview" | "setup" | "interview" | "feedback">("overview");
  const [currentQ, setCurrentQ] = useState(0);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("technical");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Array<Record<string, unknown>>>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [answerText, setAnswerText] = useState("");

  // History
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    interviewService.getHistory()
      .then((res) => setSessions(res.data?.sessions || []))
      .catch(() => { })
      .finally(() => setHistoryLoading(false));
  }, []);

  const totalSessions = sessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(sessions.reduce((s, x) => s + (x.averageScore || 0), 0) / totalSessions * 10)
    : 0;
  const totalHours = (sessions.reduce((s, x) => s + (x.duration || 0), 0) / 3600).toFixed(1);
  const totalXP = sessions.reduce((s, x) => s + (x.xpEarned || 0), 0);

  // ── Camera & Mic ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const interviewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState("");

  const startMedia = useCallback(async (video: boolean, audio: boolean) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (!video && !audio) return;
    try {
      setMediaError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      if (interviewVideoRef.current) interviewVideoRef.current.srcObject = stream;
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name === "NotAllowedError") setMediaError("Camera/mic permission denied.");
      else if (e.name === "NotFoundError") setMediaError("No camera or microphone found.");
      else setMediaError("Could not access camera/mic.");
    }
  }, []);

  const stopMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const toggleCamera = useCallback(async () => {
    const next = !cameraOn;
    setCameraOn(next);
    if (streamRef.current) {
      const tracks = streamRef.current.getVideoTracks();
      if (next && tracks.length === 0) await startMedia(true, micOn);
      else tracks.forEach((t) => (t.enabled = next));
    } else if (next) await startMedia(true, micOn);
  }, [cameraOn, micOn, startMedia]);

  const toggleMic = useCallback(async () => {
    const next = !micOn;
    setMicOn(next);
    if (streamRef.current) {
      const tracks = streamRef.current.getAudioTracks();
      if (next && tracks.length === 0) await startMedia(cameraOn, true);
      else tracks.forEach((t) => (t.enabled = next));
    } else if (next) await startMedia(cameraOn, true);
  }, [cameraOn, micOn, startMedia]);

  useEffect(() => {
    if (stage === "setup") {
      startMedia(cameraOn, micOn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Ensure media is ALWAYS stopped if the user completely navigates away from the page
  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  useEffect(() => {
    if (stage === "interview" && streamRef.current && interviewVideoRef.current) {
      interviewVideoRef.current.srcObject = streamRef.current;
    }
  }, [stage]);

  const selectTypeAndSetup = (type: string) => {
    setSelectedCategory(type);
    setStage("setup");
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await interviewService.start({ type: selectedCategory, questionCount: 5 });
      const session = res.data?.session || res.data;
      setSessionId(session._id || session.sessionId);
      setQuestions(session.questions || []);
      setAnswers(new Array(session.questions?.length || 5).fill(""));
      setCurrentQ(0);
      setStage("interview");
    } catch (e) {
      console.error("Failed to start interview", e);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!sessionId || !answerText.trim()) return;
    try {
      await interviewService.answer(sessionId, { questionIndex: currentQ, answer: answerText });
      const newAnswers = [...answers];
      newAnswers[currentQ] = answerText;
      setAnswers(newAnswers);
      // Removed setAnswerText("") here so when it jumps to the next question, 
      // the value is properly derived from the answers buffer.

      if (currentQ < questions.length - 1) {
        const nextQ = currentQ + 1;
        setCurrentQ(nextQ);
        setAnswerText(newAnswers[nextQ] || "");
      } else {
        await endInterview();
      }
    } catch (e) {
      console.error("Submit answer error", e);
    }
  };

  const handleQuestionChange = (newIndex: number) => {
    // Save current draft answer to the answers array before switching
    if (answerText.trim() !== answers[currentQ]) {
      const newAnswers = [...answers];
      newAnswers[currentQ] = answerText;
      setAnswers(newAnswers);
    }
    setCurrentQ(newIndex);
    setAnswerText(answers[newIndex] || "");
  };

  const endInterview = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await interviewService.complete(sessionId);
      const raw = res.data?.session || res.data;
      if (raw.averageScore !== undefined && raw.overallScore === undefined) {
        raw.overallScore = Math.round(raw.averageScore * 10);
      }
      if (raw.questions && !raw.feedback) {
        raw.feedback = raw.questions
          .filter((q: Record<string, unknown>) => q.userAnswer)
          .map((q: Record<string, unknown>) => ({
            category: q.category || q.question,
            score: q.score,
            feedback: q.feedback,
          }));
      }
      setFeedback(raw);
      setStage("feedback");
      stopMedia();
    } catch (e) {
      console.error("Complete interview error", e);
    } finally {
      setLoading(false);
    }
  };

  const backToOverview = () => {
    stopMedia();
    setStage("overview");
    setFeedback(null);
    setQuestions([]);
    setAnswers([]);
    setSessionId(null);
    // Refresh history
    interviewService.getHistory()
      .then((res) => setSessions(res.data?.sessions || []))
      .catch(() => { });
  };

  const overallScore = (feedback?.overallScore as number) || 0;
  const fbCategories = (feedback?.feedback as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-6 page-enter-stagger">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Interview Practice</h1>
        <p className="text-muted-foreground/70">AI-powered mock interviews with instant feedback. Choose a type and start practicing.</p>
      </div>

      {/* ═══════════════════ OVERVIEW STAGE ═══════════════════ */}
      {stage === "overview" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Sessions", value: String(totalSessions), icon: Video },
              { label: "Avg Score", value: `${avgScore}%`, icon: Star },
              { label: "Practice Time", value: `${totalHours} hrs`, icon: Clock },
              { label: "XP Earned", value: String(totalXP), icon: CheckCircle2 },
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

          {/* Interview Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviewTypes.map((t) => (
              <Card key={t.title} className="group hover-lift transition-all cursor-pointer" onClick={() => selectTypeAndSetup(t.type)}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${t.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <span className="text-2xl">{t.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{t.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                        <span>{t.duration}</span>
                        <span>·</span>
                        <Badge variant={t.difficulty === "Easy" ? "success" : t.difficulty === "Hard" ? "destructive" : "warning"} className="text-[10px]">{t.difficulty}</Badge>
                        <span>·</span>
                        <Badge variant="secondary" className="text-[10px]">AI-powered</Badge>
                      </div>
                      <Button variant="gradient" size="sm" className="gap-2">
                        <Play size={14} /> Start Interview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Sessions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold mb-4">Recent Sessions</h3>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No sessions yet. Pick an interview type above to start!</p>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session) => {
                    const scorePercent = Math.round((session.averageScore || 0) * 10);
                    const durationMin = Math.round((session.duration || 0) / 60);
                    return (
                      <div key={session._id} className="flex items-center justify-between rounded-xl border border-border/40 p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Video size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold capitalize">{session.type?.replace("-", " ")} Interview</p>
                            <p className="text-[10px] text-muted-foreground/60 font-medium">
                              {new Date(session.createdAt).toLocaleDateString()} · {durationMin} min · {session.answeredQuestions}/{session.totalQuestions} answered
                            </p>
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${scorePercent >= 80 ? "text-green-500" : scorePercent >= 60 ? "text-yellow-500" : "text-red-500"}`}>
                          {scorePercent}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════════ SETUP STAGE ═══════════════════ */}
      {stage === "setup" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" className="gap-2 mb-2" onClick={backToOverview}>
            ← Back to overview
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>
                {interviewTypes.find((t) => t.type === selectedCategory)?.icon}{" "}
                {interviewTypes.find((t) => t.type === selectedCategory)?.title} Interview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative rounded-2xl bg-muted aspect-video flex items-center justify-center overflow-hidden">
                  {cameraOn && !mediaError ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-2xl" style={{ transform: "scaleX(-1)" }} />
                  ) : (
                    <div className="text-center">
                      <VideoOff size={48} className="mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">{mediaError || "Camera is off"}</p>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    <Button variant={cameraOn ? "default" : "destructive"} size="sm" className="gap-1.5 rounded-full" onClick={toggleCamera}>
                      {cameraOn ? <Video size={14} /> : <VideoOff size={14} />} {cameraOn ? "On" : "Off"}
                    </Button>
                    <Button variant={micOn ? "default" : "destructive"} size="sm" className="gap-1.5 rounded-full" onClick={toggleMic}>
                      {micOn ? <Mic size={14} /> : <MicOff size={14} />} {micOn ? "On" : "Off"}
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Before You Start</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {["Good lighting and quiet environment", "Look at the camera while answering", "Speak clearly at a moderate pace", "Take a moment to think before answering", "5 AI-generated questions per session"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" />{item}</li>
                    ))}
                  </ul>
                  <Button variant="gradient" size="lg" className="w-full gap-2 mt-4" onClick={startInterview} disabled={loading}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} {loading ? "Generating Questions..." : "Start Interview"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════ INTERVIEW STAGE ═══════════════════ */}
      {stage === "interview" && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="gap-1.5"><MessageSquare size={12} /> Question {currentQ + 1} of {questions.length}</Badge>
            <Button variant="destructive" size="sm" className="gap-2" onClick={endInterview} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <StopCircle size={14} />} End Interview
            </Button>
          </div>
          <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1.5" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="overflow-hidden">
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video flex items-center justify-center">
                  {cameraOn ? (
                    <video ref={interviewVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                  ) : (
                    <div className="text-center text-white/50"><VideoOff size={64} className="mx-auto mb-2" /><p className="text-sm">Camera is off</p></div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <div className="flex items-center gap-2 mb-2"><Brain size={16} className="text-primary" /><span className="text-xs text-primary font-medium">AI Question</span></div>
                    <p className="text-white text-lg font-medium">{(questions[currentQ] as Record<string, unknown>)?.question as string}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <textarea
                    className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
                    placeholder="Type your answer here..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                  />
                  <Button variant="gradient" className="w-full mt-3 gap-2" onClick={submitAnswer} disabled={!answerText.trim()}>
                    {currentQ < questions.length - 1 ? "Submit & Next" : "Submit & Finish"} <ChevronRight size={14} />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Questions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuestionChange(i)}
                      className={`w-full text-left rounded-lg px-3 py-2.5 text-xs transition-all cursor-pointer ${i === currentQ ? "bg-primary/10 text-primary border border-primary/30" :
                        answers[i] ? "bg-success/5 text-success" : "text-muted-foreground hover:bg-muted"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {answers[i] ? <CheckCircle2 size={12} /> : <span className="w-3 text-center">{i + 1}</span>}
                        <span className="truncate">{((q as Record<string, unknown>).question as string)?.substring(0, 50)}...</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════ FEEDBACK STAGE ═══════════════════ */}
      {stage === "feedback" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="relative w-36 h-36 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                  <circle cx="100" cy="100" r="80" fill="none" stroke="hsl(var(--primary))" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${overallScore * 5.03} ${503 - overallScore * 5.03}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{overallScore}%</span>
                  <span className="text-xs text-muted-foreground">Overall</span>
                </div>
              </div>
              <h2 className="text-xl font-bold">{overallScore >= 70 ? "Great Performance! 🎉" : "Keep Practicing! 💪"}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {(feedback?.overallFeedback as string) || (overallScore >= 70 ? "You scored above average. Keep it up!" : "Review the feedback below and try again.")}
              </p>
            </CardContent>
          </Card>

          {/* Strengths & Improvements */}
          {((feedback?.strengths as string[])?.length > 0 || (feedback?.improvements as string[])?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(feedback?.strengths as string[])?.length > 0 && (
                <Card className="border-green-500/20">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-green-500 mb-3 flex items-center gap-2"><CheckCircle2 size={16} /> Strengths</h3>
                    <ul className="space-y-2">
                      {(feedback?.strengths as string[]).map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-green-500 shrink-0">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {(feedback?.improvements as string[])?.length > 0 && (
                <Card className="border-yellow-500/20">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-yellow-500 mb-3 flex items-center gap-2"><Star size={16} /> Areas to Improve</h3>
                    <ul className="space-y-2">
                      {(feedback?.improvements as string[]).map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-yellow-500 shrink-0">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {fbCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 size={18} className="text-primary" /> Per-Question Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fbCategories.map((cat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-xs">{(cat.category as string) || `Question ${i + 1}`}</span>
                      <span className="text-sm font-semibold">{cat.score as number}/10</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${(cat.score as number) >= 8 ? "bg-green-500" : (cat.score as number) >= 6 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                        style={{ width: `${((cat.score as number) / 10) * 100}%` }}
                      />
                    </div>
                    {!!cat.feedback && <p className="text-xs text-muted-foreground">{String(cat.feedback)}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="gap-2" onClick={backToOverview}>
              <RotateCcw size={14} /> Back to Overview
            </Button>
            <Button variant="gradient" className="gap-2" onClick={() => { setFeedback(null); setQuestions([]); setAnswers([]); selectTypeAndSetup(selectedCategory); }}>
              <Play size={14} /> Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
