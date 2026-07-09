"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Code2,
  Bot,
  Briefcase,
  Video,
  Terminal,
  FlaskConical,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  Shield,
  Users,
  TrendingUp,
  ChevronRight,
  Play,
  Sparkles,
  Globe,
  Target,
  Award,
  Rocket,
} from "lucide-react";



export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleRoleSelect = (role: "job_seeker" | "higher_studies") => {
    localStorage.setItem("selectedRole", role);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-[1000px] gradient-mesh-hero" />
        <div className="absolute inset-0 dot-pattern opacity-20" />
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "glass-strong shadow-sm" : ""}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(238,70%,65%)] text-white font-bold text-sm shadow-[0_2px_12px_hsl(var(--primary)/0.4)] group-hover:shadow-[0_4px_20px_hsl(var(--primary)/0.5)] transition-all duration-300">
              C
            </div>
            <span className="text-xl font-bold tracking-tight">
              Career<span className="gradient-text-static">X</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {/* Navigation links removed to simplify the page */}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="gradient" size="sm">
                Get Started <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24">
        {/* Floating orbs */}
        <div className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-primary/8 blur-[80px] animate-float" />
        <div className="absolute top-40 right-[15%] w-80 h-80 rounded-full bg-[hsl(238,70%,65%)]/8 blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-20 left-[40%] w-56 h-56 rounded-full bg-[hsl(var(--chart-4))]/6 blur-[80px] animate-float" style={{ animationDelay: "4s" }} />

        <div className="max-w-7xl mx-auto px-6 text-center relative">
          {/* Top badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm mb-8 animate-fade-in backdrop-blur-sm">
            <Sparkles size={14} className="text-primary animate-pulse" />
            <span className="text-muted-foreground">AI-Powered Career Development</span>
            <ChevronRight size={14} className="text-primary" />
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 animate-fade-in leading-[0.9]" style={{ animationDelay: "0.1s" }}>
            Your Career
            <br />
            <span className="gradient-text">Supercharged</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in leading-relaxed" style={{ animationDelay: "0.2s" }}>
            Build ATS-optimized resumes, master coding interviews, and discover
            your dream job — all powered by cutting-edge AI.
          </p>

          {/* Role Selection Cards */}
          <div className="max-w-3xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <p className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-widest mb-6">I am a...</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Job Seeker Card */}
              <button
                onClick={() => handleRoleSelect("job_seeker")}
                className="group relative rounded-3xl border-2 border-border/40 bg-card/60 backdrop-blur-sm p-8 hover:border-primary/50 hover:shadow-[0_8px_40px_hsl(var(--primary)/0.15)] transition-all duration-500 cursor-pointer text-left"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 mb-5">
                    <Briefcase size={28} />
                  </div>
                  <h3 className="text-xl font-black mb-2 group-hover:text-primary transition-colors duration-300">Job Seeker</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Build resumes, practice coding, ace interviews, and discover your dream job.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Resume Builder", "ATS Analyzer", "Jobs Board", "Interview Prep", "Coding Practice"].map((tag) => (
                      <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-5 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                    Get Started <ArrowRight size={15} />
                  </div>
                </div>
              </button>

              {/* Higher Studies Card */}
              <button
                onClick={() => handleRoleSelect("higher_studies")}
                className="group relative rounded-3xl border-2 border-border/40 bg-card/60 backdrop-blur-sm p-8 hover:border-teal-500/50 hover:shadow-[0_8px_40px_hsl(160,60%,45%,0.15)] transition-all duration-500 cursor-pointer text-left"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 mb-5">
                    <GraduationCap size={28} />
                  </div>
                  <h3 className="text-xl font-black mb-2 group-hover:text-teal-500 transition-colors duration-300">Higher Studies</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Prepare for GATE, CAT, GRE & more with AI-powered roadmaps and MCQ practice.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Exam Preparation", "Exam MCQs", "AI Roadmaps", "Study Plans", "AI Assistant"].map((tag) => (
                      <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-500 dark:text-teal-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-5 text-sm font-semibold text-teal-500 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                    Get Started <ArrowRight size={15} />
                  </div>
                </div>
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/60 mb-16 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            Free forever &middot; No credit card required &middot; 50K+ users
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative rounded-[2rem] overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(238,70%,62%)] to-[hsl(var(--chart-4))] opacity-[0.08]" />
            <div className="absolute inset-0 dot-pattern opacity-10" />

            <div className="relative border border-primary/10 rounded-[2rem] p-12 md:p-20">
              <Rocket size={40} className="mx-auto mb-6 text-primary/40" />
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                Ready to Accelerate?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join thousands using AI to build better careers. Start completely free.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button variant="gradient" size="xl" className="gap-2 shadow-2xl" onClick={() => handleRoleSelect("job_seeker")}>
                  I&apos;m a Job Seeker <Briefcase size={18} />
                </Button>
                <Button variant="outline" size="xl" className="gap-2" onClick={() => handleRoleSelect("higher_studies")}>
                  <GraduationCap size={18} /> I&apos;m Preparing for Exams
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-success" /> Free forever</span>
                <span className="flex items-center gap-1.5"><Shield size={14} className="text-success" /> No credit card</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(238,70%,65%)] text-white font-bold text-xs shadow-md">C</div>
                <span className="font-bold">Career<span className="gradient-text-static">X</span></span>
              </div>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">AI-powered career development platform for the next generation.</p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-muted-foreground/60">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="/signup" className="hover:text-foreground transition-colors">Get Started</a></li>
                <li><a href="/login" className="hover:text-foreground transition-colors">Sign In</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">Resources</h4>
              <ul className="space-y-2 text-xs text-muted-foreground/60">
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a></li>
                <li><a href="/dashboard/ai-chat" className="hover:text-foreground transition-colors">AI Assistant</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-muted-foreground/60">
                <li><span className="cursor-default">Privacy Policy</span></li>
                <li><span className="cursor-default">Terms of Service</span></li>
                <li><a href="mailto:support@careerx.dev" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 pt-6 text-center text-xs text-muted-foreground/40">&copy; 2026 CareerX. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
