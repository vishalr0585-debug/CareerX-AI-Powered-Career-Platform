"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy, Medal, Crown, TrendingUp, Flame, Zap, Star,
  ChevronUp, ChevronDown, Minus, Code2, FileText, Target, Loader2,
} from "lucide-react";
import { dashboardService } from "@/lib/services";

interface LeaderboardEntry {
  rank: number;
  user: { id: string; fullName: string; avatar?: string; initials?: string; jobTitle?: string };
  xp: number;
  streak: number;
  score?: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number>(0);
  const [period, setPeriod] = useState("overall");
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (p: string) => {
    setLoading(true);
    try {
      const res = await dashboardService.getLeaderboard(1, 20, p);
      const data = res.data || res;
      setEntries(data.leaderboard || []);
      setMyRank(data.myRank || 0);
    } catch (e) { console.error("Leaderboard error", e); }
    setLoading(false);
  };

  useEffect(() => { fetchLeaderboard(period); }, [period]);

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const topUsers = entries.slice(0, 3);
  const restUsers = entries.slice(3);
  const badges = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6 page-enter-stagger">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground/70">Compete with others and climb the rankings.</p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 rounded-xl">
          <Zap size={14} className="text-primary" /> Your Rank: #{myRank}
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <>
          {topUsers.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {/* 2nd Place */}
              <div className="flex flex-col items-center pt-8">
                <Avatar className="h-16 w-16 mb-2 ring-4 ring-zinc-600">
                  <AvatarFallback className="text-lg bg-secondary text-secondary-foreground">{topUsers[1].user.initials || getInitials(topUsers[1].user.fullName)}</AvatarFallback>
                </Avatar>
                <span className="text-2xl mb-1">{badges[1]}</span>
                <p className="text-sm font-semibold text-center">{topUsers[1].user.fullName}</p>
                <p className="text-xs text-muted-foreground">{topUsers[1].xp.toLocaleString()} XP</p>
                <div className="mt-2 w-full h-20 rounded-t-2xl bg-gradient-to-t from-zinc-800 to-zinc-700 flex items-center justify-center">
                  <span className="text-2xl font-bold text-zinc-400">2</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Crown size={24} className="text-amber-500 mx-auto mb-1" />
                  <Avatar className="h-20 w-20 mb-2 ring-4 ring-amber-400">
                    <AvatarFallback className="text-xl bg-amber-500/20 text-amber-400">{topUsers[0].user.initials || getInitials(topUsers[0].user.fullName)}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-2xl mb-1">{badges[0]}</span>
                <p className="text-sm font-bold text-center">{topUsers[0].user.fullName}</p>
                <p className="text-xs text-muted-foreground">{topUsers[0].xp.toLocaleString()} XP</p>
                <div className="mt-2 w-full h-28 rounded-t-2xl bg-gradient-to-t from-amber-900/50 to-amber-800/30 flex items-center justify-center">
                  <span className="text-3xl font-bold text-amber-500">1</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center pt-12">
                <Avatar className="h-14 w-14 mb-2 ring-4 ring-amber-600">
                  <AvatarFallback className="text-base bg-amber-500/20 text-amber-400">{topUsers[2].user.initials || getInitials(topUsers[2].user.fullName)}</AvatarFallback>
                </Avatar>
                <span className="text-2xl mb-1">{badges[2]}</span>
                <p className="text-sm font-semibold text-center">{topUsers[2].user.fullName}</p>
                <p className="text-xs text-muted-foreground">{topUsers[2].xp.toLocaleString()} XP</p>
                <div className="mt-2 w-full h-16 rounded-t-2xl bg-gradient-to-t from-amber-900/60 to-amber-800/40 flex items-center justify-center">
                  <span className="text-2xl font-bold text-amber-600">3</span>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <Tabs defaultValue="overall" onValueChange={(v) => setPeriod(v)}>
                <TabsList>
                  <TabsTrigger value="overall">Overall</TabsTrigger>
                  <TabsTrigger value="weekly">This Week</TabsTrigger>
                  <TabsTrigger value="monthly">This Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-muted-foreground font-medium">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-5">User</div>
                  <div className="col-span-2 text-center">XP</div>
                  <div className="col-span-2 text-center">Streak</div>
                  <div className="col-span-2 text-center">Score</div>
                </div>

                {(restUsers.length > 0 ? restUsers : entries).map((entry) => (
                  <div
                    key={entry.rank}
                    className="grid grid-cols-12 gap-4 items-center rounded-xl px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <div className="col-span-1 font-bold text-muted-foreground">#{entry.rank}</div>
                    <div className="col-span-5 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-muted">
                          {entry.user.initials || getInitials(entry.user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{entry.user.fullName}</span>
                        {entry.user.jobTitle && <p className="text-xs text-muted-foreground">{entry.user.jobTitle}</p>}
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-bold">{entry.xp.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground ml-1">XP</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Flame size={10} className="text-orange-500" /> {entry.streak}d
                      </Badge>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-semibold">{entry.score || 0}</span>
                    </div>
                  </div>
                ))}

                {entries.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No leaderboard data yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
