"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Search, Moon, Sun, Command, Menu, Flame, Zap, X, CheckCircle, Info, AlertCircle, Trophy, Briefcase, Loader2, Video, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import { useSidebar } from "./dashboard-layout";
import { cn } from "@/lib/utils";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "job" | "achievement" | "reminder" | "system" | "interview" | "resume";
  read: boolean;
  link?: string;
  createdAt: string;
}

export default function Header() {
  const [dark, setDark] = React.useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { setMobileOpen } = useSidebar();

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        withCredentials: true, // Sends httpOnly cookies automatically
      });
      
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Fallback to sample data if API fails
      setNotifications([
        {
          _id: "1",
          title: "New job match!",
          message: "Google is hiring Software Engineers - your profile matches",
          type: "job",
          read: false,
          createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
        },
        {
          _id: "2",
          title: "Daily streak maintained",
          message: "You've logged in for 5 days straight! Keep it up!",
          type: "achievement",
          read: false,
          createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
        },
        {
          _id: "3",
          title: "Interview reminder",
          message: "Your mock interview is scheduled for tomorrow at 2 PM",
          type: "reminder",
          read: true,
          createdAt: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
        },
      ]);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
        withCredentials: true,
      });
      
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Still update UI optimistically
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/mark-all-read`, {}, {
        withCredentials: true,
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      // Still update UI optimistically
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "job": return <Briefcase size={14} className="text-primary" />;
      case "achievement": return <Trophy size={14} className="text-warning" />;
      case "reminder": return <Info size={14} className="text-info" />;
      case "interview": return <Video size={14} className="text-primary" />;
      case "resume": return <FileText size={14} className="text-primary" />;
      default: return <AlertCircle size={14} className="text-muted-foreground" />;
    }
  };

  const toggleTheme = () => {
    setDark(!dark);
    if (dark) {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/60 backdrop-blur-xl px-4 sm:px-6 animate-slide-down">
      {/* Mobile hamburger + Search */}
      <div className="flex items-center gap-2 flex-1 max-w-lg">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </Button>
        <div className="relative flex-1 group">
          <Input
            icon={<Search size={15} />}
            placeholder="Search anything..."
            className="bg-muted/40 border-border/40 h-9 text-sm pr-20 transition-all duration-300 focus:bg-muted/60 focus:border-primary/30 focus:shadow-[0_0_12px_hsl(var(--primary)/0.08)]"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border/40 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Command size={10} /> K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5">
        {/* Streak Badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/60 px-3 py-1.5 mr-1">
          <Flame size={13} className="text-orange-500" />
          <span className="text-xs font-semibold text-muted-foreground">{user?.loginStreak ?? 0}</span>
        </div>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg h-9 w-9 text-muted-foreground hover:text-foreground">
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setNotifOpen(!notifOpen)}
            className="rounded-lg h-9 w-9 relative text-muted-foreground hover:text-foreground"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
            )}
          </Button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id}
                      onClick={() => markAsRead(notif._id)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 border-b border-border/40 last:border-0",
                        !notif.read && "bg-primary/[0.03]"
                      )}
                    >
                      <div className="mt-0.5 p-1.5 rounded-lg bg-muted">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm font-medium truncate", !notif.read && "text-foreground")}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{getTimeAgo(notif.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border/60 bg-muted/30">
                <button className="w-full text-center text-xs text-muted-foreground hover:text-foreground font-medium py-1">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* XP Badge */}
        <Badge variant="default" className="ml-1 hidden sm:inline-flex gap-1 py-1 px-3">
          <Zap size={12} /> <span className="stat-number">{user?.totalXP?.toLocaleString() ?? "0"} XP</span>
        </Badge>
      </div>
    </header>
  );
}
