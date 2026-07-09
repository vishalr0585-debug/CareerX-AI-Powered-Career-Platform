"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar, Plus, Trash2, Clock, CheckCircle2, Circle,
  BookOpen, Target, Flame, TrendingUp, GripVertical,
  Play, Pause, RotateCcw, ChevronDown, ChevronUp,
  Sparkles, Award, BarChart3,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StudyTask {
  id: string;
  subject: string;
  topic: string;
  duration: number; // minutes
  completed: boolean;
  notes: string;
}

interface StudyDay {
  date: string;
  tasks: StudyTask[];
}

interface PomodoroState {
  running: boolean;
  mode: "work" | "break";
  secondsLeft: number;
  workMinutes: number;
  breakMinutes: number;
  sessionsCompleted: number;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Computer Science",
  "Data Structures", "Algorithms", "Operating Systems", "DBMS",
  "Computer Networks", "Aptitude", "Verbal Ability", "Logical Reasoning",
  "General Knowledge", "Economics", "Polity", "History", "Geography",
  "English", "Essay Writing", "Current Affairs", "Other",
];

const STORAGE_KEY = "careerx_study_planner";

export default function StudyPlannerPage() {
  const [days, setDays] = useState<StudyDay[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Pomodoro
  const [pomo, setPomo] = useState<PomodoroState>({
    running: false,
    mode: "work",
    secondsLeft: 25 * 60,
    workMinutes: 25,
    breakMinutes: 5,
    sessionsCompleted: 0,
  });

  // Weekly stats
  const [weeklyGoal, setWeeklyGoal] = useState(20); // hours

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setDays(parsed.days || []);
        if (parsed.weeklyGoal) setWeeklyGoal(parsed.weeklyGoal);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage
  const save = useCallback((newDays: StudyDay[], goal?: number) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ days: newDays, weeklyGoal: goal ?? weeklyGoal }));
  }, [weeklyGoal]);

  // Get or create day
  const getDay = useCallback((date: string): StudyDay => {
    return days.find((d) => d.date === date) || { date, tasks: [] };
  }, [days]);

  const updateDay = (date: string, tasks: StudyTask[]) => {
    const exists = days.find((d) => d.date === date);
    let newDays: StudyDay[];
    if (exists) {
      newDays = days.map((d) => (d.date === date ? { ...d, tasks } : d));
    } else {
      newDays = [...days, { date, tasks }];
    }
    newDays.sort((a, b) => a.date.localeCompare(b.date));
    setDays(newDays);
    save(newDays);
  };

  const addTask = (date: string) => {
    const day = getDay(date);
    const task: StudyTask = { id: uid(), subject: "", topic: "", duration: 30, completed: false, notes: "" };
    updateDay(date, [...day.tasks, task]);
  };

  const updateTask = (date: string, taskId: string, patch: Partial<StudyTask>) => {
    const day = getDay(date);
    updateDay(date, day.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  };

  const removeTask = (date: string, taskId: string) => {
    const day = getDay(date);
    updateDay(date, day.tasks.filter((t) => t.id !== taskId));
  };

  const toggleTask = (date: string, taskId: string) => {
    const day = getDay(date);
    const task = day.tasks.find((t) => t.id === taskId);
    if (task) updateTask(date, taskId, { completed: !task.completed });
  };

  // Pomodoro timer
  useEffect(() => {
    if (!pomo.running) return;
    const interval = setInterval(() => {
      setPomo((p) => {
        if (p.secondsLeft <= 1) {
          // Switch modes
          if (p.mode === "work") {
            return { ...p, mode: "break", secondsLeft: p.breakMinutes * 60, sessionsCompleted: p.sessionsCompleted + 1 };
          } else {
            return { ...p, mode: "work", secondsLeft: p.workMinutes * 60 };
          }
        }
        return { ...p, secondsLeft: p.secondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomo.running]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Calculate stats
  const today = new Date().toISOString().split("T")[0];
  const todayDay = getDay(today);
  const todayCompleted = todayDay.tasks.filter((t) => t.completed).length;
  const todayTotal = todayDay.tasks.length;
  const todayMinutes = todayDay.tasks.filter((t) => t.completed).reduce((s, t) => s + t.duration, 0);

  // Weekly stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().split("T")[0]);
  }
  const weeklyMinutes = weekDates.reduce((sum, date) => {
    const day = getDay(date);
    return sum + day.tasks.filter((t) => t.completed).reduce((s, t) => s + t.duration, 0);
  }, 0);
  const weeklyHours = Math.round((weeklyMinutes / 60) * 10) / 10;
  const weeklyProgress = Math.min(100, Math.round((weeklyHours / weeklyGoal) * 100));

  // Streak calculation
  let streak = 0;
  const d = new Date();
  while (true) {
    const ds = d.toISOString().split("T")[0];
    const day = days.find((dy) => dy.date === ds);
    if (day && day.tasks.some((t) => t.completed)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  // Next 7 days for planning
  const planDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date();
    dt.setDate(dt.getDate() + i);
    planDates.push(dt.toISOString().split("T")[0]);
  }

  const formatDate = (ds: string) => {
    const d = new Date(ds + "T00:00:00");
    if (ds === today) return "Today";
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (ds === tomorrow.toISOString().split("T")[0]) return "Tomorrow";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6 page-enter-stagger">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Study Planner</h1>
        <p className="text-muted-foreground/70 text-sm">
          Plan your study schedule, track progress with Pomodoro, and build consistency.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="hover-lift">
          <CardContent className="p-4 text-center">
            <Flame size={20} className="text-orange-400 mx-auto mb-1.5" />
            <p className="text-2xl font-black">{streak}</p>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="p-4 text-center">
            <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-1.5" />
            <p className="text-2xl font-black">{todayCompleted}/{todayTotal}</p>
            <p className="text-[10px] text-muted-foreground">Today&apos;s Tasks</p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="p-4 text-center">
            <Clock size={20} className="text-blue-400 mx-auto mb-1.5" />
            <p className="text-2xl font-black">{Math.round(todayMinutes / 60 * 10) / 10}h</p>
            <p className="text-[10px] text-muted-foreground">Studied Today</p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="p-4 text-center">
            <Award size={20} className="text-violet-400 mx-auto mb-1.5" />
            <p className="text-2xl font-black">{pomo.sessionsCompleted}</p>
            <p className="text-[10px] text-muted-foreground">Pomodoros Done</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Planner */}
        <div className="lg:col-span-2 space-y-4">
          {/* Weekly Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 size={15} className="text-primary" />
                  <span className="text-sm font-bold">Weekly Goal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{weeklyHours}h / {weeklyGoal}h</span>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={weeklyGoal}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 20;
                      setWeeklyGoal(v);
                      save(days, v);
                    }}
                    className="w-16 h-7 text-xs rounded-lg text-center"
                  />
                </div>
              </div>
              <Progress value={weeklyProgress} className="h-2 rounded-full" />
              <div className="flex justify-between mt-2">
                {weekDates.map((wd) => {
                  const day = getDay(wd);
                  const done = day.tasks.some((t) => t.completed);
                  const isToday = wd === today;
                  return (
                    <div key={wd} className="flex flex-col items-center gap-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        done ? "bg-primary text-primary-foreground" : isToday ? "border-2 border-primary text-primary" : "bg-muted/50 text-muted-foreground"
                      }`}>
                        {new Date(wd + "T00:00:00").toLocaleDateString("en-US", { weekday: "narrow" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Day-by-day planner */}
          {planDates.map((date) => {
            const day = getDay(date);
            const isExpanded = expandedDay === date || date === today;
            const completedCount = day.tasks.filter((t) => t.completed).length;
            const totalMins = day.tasks.reduce((s, t) => s + t.duration, 0);

            return (
              <Card key={date} className={date === today ? "border-primary/30" : ""}>
                <button
                  type="button"
                  className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedDay(isExpanded && date !== today ? null : date)}
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={14} className={date === today ? "text-primary" : "text-muted-foreground"} />
                    <span className="font-bold text-sm">{formatDate(date)}</span>
                    {day.tasks.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {completedCount}/{day.tasks.length} tasks · {Math.round(totalMins / 60 * 10) / 10}h
                      </Badge>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <CardContent className="px-4 pb-4 pt-0 space-y-2.5">
                    {day.tasks.map((task) => (
                      <div key={task.id} className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
                        task.completed ? "border-emerald-500/20 bg-emerald-500/5" : "border-border/40"
                      }`}>
                        <button
                          onClick={() => toggleTask(date, task.id)}
                          className="mt-0.5 cursor-pointer shrink-0"
                        >
                          {task.completed
                            ? <CheckCircle2 size={18} className="text-emerald-400" />
                            : <Circle size={18} className="text-muted-foreground/40 hover:text-primary transition-colors" />
                          }
                        </button>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select
                              className="rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                              value={task.subject}
                              onChange={(e) => updateTask(date, task.id, { subject: e.target.value })}
                            >
                              <option value="">Subject</option>
                              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <Input
                              placeholder="Topic / Chapter"
                              className="rounded-lg text-xs h-8"
                              value={task.topic}
                              onChange={(e) => updateTask(date, task.id, { topic: e.target.value })}
                            />
                            <div className="flex items-center gap-1.5">
                              <Clock size={11} className="text-muted-foreground shrink-0" />
                              <Input
                                type="number"
                                min={5}
                                step={5}
                                className="rounded-lg text-xs h-8 w-16"
                                value={task.duration}
                                onChange={(e) => updateTask(date, task.id, { duration: Number(e.target.value) || 30 })}
                              />
                              <span className="text-[10px] text-muted-foreground">min</span>
                            </div>
                          </div>
                          <Input
                            placeholder="Notes (optional)"
                            className="rounded-lg text-xs h-7"
                            value={task.notes}
                            onChange={(e) => updateTask(date, task.id, { notes: e.target.value })}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive rounded-lg"
                          onClick={() => removeTask(date, task.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl text-xs" onClick={() => addTask(date)}>
                      <Plus size={12} /> Add Study Task
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Right: Pomodoro & Tips */}
        <div className="space-y-4">
          {/* Pomodoro Timer */}
          <Card className="sticky top-20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
                  <Clock size={14} className="text-red-400" />
                </div>
                Pomodoro Timer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timer Display */}
              <div className="text-center py-4">
                <div className={`text-5xl font-black font-mono tracking-tighter ${
                  pomo.mode === "work" ? "text-primary" : "text-emerald-400"
                }`}>
                  {formatTime(pomo.secondsLeft)}
                </div>
                <Badge variant="secondary" className="mt-2 text-xs">
                  {pomo.mode === "work" ? "🎯 Focus Time" : "☕ Break Time"}
                </Badge>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant={pomo.running ? "outline" : "gradient"}
                  size="sm"
                  className="gap-1.5 rounded-xl"
                  onClick={() => setPomo((p) => ({ ...p, running: !p.running }))}
                >
                  {pomo.running ? <Pause size={13} /> : <Play size={13} />}
                  {pomo.running ? "Pause" : "Start"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl"
                  onClick={() => setPomo((p) => ({
                    ...p,
                    running: false,
                    mode: "work",
                    secondsLeft: p.workMinutes * 60,
                  }))}
                >
                  <RotateCcw size={13} /> Reset
                </Button>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Work (min)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={60}
                    value={pomo.workMinutes}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 25;
                      setPomo((p) => ({
                        ...p,
                        workMinutes: v,
                        secondsLeft: p.mode === "work" && !p.running ? v * 60 : p.secondsLeft,
                      }));
                    }}
                    className="rounded-lg text-xs h-8 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Break (min)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={pomo.breakMinutes}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 5;
                      setPomo((p) => ({
                        ...p,
                        breakMinutes: v,
                        secondsLeft: p.mode === "break" && !p.running ? v * 60 : p.secondsLeft,
                      }));
                    }}
                    className="rounded-lg text-xs h-8 mt-1"
                  />
                </div>
              </div>

              {/* Sessions completed */}
              <div className="text-center pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                  Sessions today: <strong className="text-primary">{pomo.sessionsCompleted}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Study Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles size={14} className="text-amber-400" /> Study Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { tip: "Active recall beats re-reading — test yourself constantly", icon: "🧠" },
                { tip: "Spaced repetition: review after 1, 3, 7, and 21 days", icon: "📅" },
                { tip: "Study in 25-min blocks with 5-min breaks (Pomodoro)", icon: "🍅" },
                { tip: "Teach what you learn — explain concepts out loud", icon: "🗣️" },
                { tip: "Sleep is essential — 7-8 hours improves retention by 40%", icon: "😴" },
                { tip: "Mix subjects instead of blocking — interleaving works better", icon: "🔀" },
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-sm">{t.icon}</span>
                  <span>{t.tip}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
