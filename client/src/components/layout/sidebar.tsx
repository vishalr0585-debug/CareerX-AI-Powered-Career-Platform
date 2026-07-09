"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  FileText,
  FileSearch,
  Code2,
  Bot,
  Briefcase,
  Video,
  Terminal,
  FlaskConical,
  ClipboardCheck,
  GraduationCap,
  BookOpen,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Settings,
  X,
  Map,
  Award,
  CalendarDays,
  FileEdit,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/authStore";
import { useSidebar } from "./dashboard-layout";

const allMenuSections = [
  {
    label: "Overview",
    roles: ["job_seeker", "higher_studies"],
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Profile & Analytics", href: "/dashboard/profile", icon: User },
      { name: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Job Seeker",
    roles: ["job_seeker"],
    items: [
      { name: "Resume Builder", href: "/dashboard/resume-builder", icon: FileText },
      { name: "ATS Analyzer", href: "/dashboard/ats-analyzer", icon: FileSearch },
      { name: "Coding Profile", href: "/dashboard/coding-profile", icon: Code2 },
      { name: "Jobs Board", href: "/dashboard/jobs", icon: Briefcase },
      { name: "Interview Practice", href: "/dashboard/interview-lab", icon: Video },
      { name: "Online Compiler", href: "/dashboard/compiler", icon: Terminal },
      { name: "Project Explorer", href: "/dashboard/ai-project-lab", icon: FlaskConical },
      { name: "Test Practice", href: "/dashboard/test-practice", icon: ClipboardCheck },
    ],
  },
  {
    label: "Higher Education",
    roles: ["higher_studies"],
    items: [
      { name: "Exam Preparation", href: "/dashboard/exam-prep", icon: GraduationCap },
      { name: "Exam MCQs", href: "/dashboard/exam-mcq", icon: BookOpen },
      { name: "University Finder", href: "/dashboard/university-finder", icon: Search },
      { name: "Scholarship Finder", href: "/dashboard/scholarship-finder", icon: Award },
      { name: "Study Planner", href: "/dashboard/study-planner", icon: CalendarDays },
      { name: "SOP Writer", href: "/dashboard/sop-writer", icon: FileEdit },
    ],
  },
  {
    label: "Tools",
    roles: ["job_seeker", "higher_studies"],
    items: [
      { name: "AI Assistant", href: "/dashboard/ai-chat", icon: Bot },
      { name: "DSA Problems", href: "/dashboard/smart-search", icon: Code2 },
      { name: "Roadmap Generator", href: "/dashboard/roadmap", icon: Map },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { mobileOpen, setMobileOpen, collapsed, setCollapsed } = useSidebar();

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("selectedRole");
    router.push("/login");
  };

  // Filter menu sections based on user role
  const userRole = user?.role || "job_seeker";
  const menuSections = allMenuSections.filter(
    (section) => section.roles.includes(userRole)
  );

  const initials = user?.initials || user?.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <aside
      className={cn(
        "fixed top-0 z-50 flex h-screen flex-col transition-all duration-500 ease-out",
        "bg-background border-r border-border/60",
        // Desktop: left-0, controlled by collapsed state
        "max-lg:fixed max-lg:top-0 max-lg:h-full",
        collapsed ? "lg:w-[72px]" : "lg:w-[260px]",
        // Mobile: slide in/out
        mobileOpen ? "max-lg:left-0 max-lg:w-[280px]" : "max-lg:-left-[280px]",
        "lg:left-0"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/60">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
            C
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-foreground">
              Career<span className="text-primary">X</span>
            </span>
          )}
        </Link>
        {/* Desktop collapse / Mobile close */}
        <button
          onClick={() => {
            if (mobileOpen) setMobileOpen(false);
            else setCollapsed(!collapsed);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200 cursor-pointer"
        >
          {/* On mobile when open, show X; on desktop show collapse chevrons */}
          <span className="lg:hidden">{mobileOpen ? <X size={16} /> : null}</span>
          <span className="hidden lg:inline">{collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</span>
        </button>
      </div>

      {/* Role Switcher */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-border/40">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Path</span>
          </div>
          <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/40 relative">
            <button
              onClick={() => {
                useAuthStore.getState().updateRole("job_seeker");
                localStorage.setItem("selectedRole", "job_seeker");
                router.refresh();
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 relative overflow-hidden",
                userRole === "job_seeker"
                  ? "text-primary bg-primary/10 shadow-sm border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {userRole === "job_seeker" && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              )}
              <Briefcase size={12} className="relative z-10" />
              <span className="relative z-10">Job Seeker</span>
            </button>
            <button
              onClick={() => {
                useAuthStore.getState().updateRole("higher_studies");
                localStorage.setItem("selectedRole", "higher_studies");
                router.refresh();
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 relative overflow-hidden",
                userRole === "higher_studies"
                  ? "text-teal-500 bg-teal-500/10 shadow-sm border border-teal-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {userRole === "higher_studies" && (
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent" />
              )}
              <GraduationCap size={12} className="relative z-10" />
              <span className="relative z-10">Exams</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {menuSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-300 group relative",
                        isActive
                          ? "bg-primary/10 text-foreground shadow-[inset_0_1px_0_hsl(var(--primary)/0.15)]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
                      )}
                      <item.icon
                        size={17}
                        className={cn(
                          "shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-muted-foreground"
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50 transition-all duration-300">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.fullName || "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email || ""}</p>
            </div>
          )}
          {!collapsed && (
            <div className="flex gap-0.5">
              <Link href="/dashboard/profile" onClick={() => setMobileOpen(false)}>
                <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200 cursor-pointer">
                  <Settings size={13} />
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 cursor-pointer"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
