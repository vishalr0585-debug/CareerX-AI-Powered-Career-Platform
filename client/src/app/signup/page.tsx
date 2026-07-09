"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowRight, Github, CheckCircle2, Sparkles, Zap, Trophy, FileText, Bot, Loader2, Briefcase, GraduationCap } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "";

const benefits = [
  { icon: Bot, text: "AI-powered resume analysis & building" },
  { icon: Zap, text: "Practice coding across 5+ platforms" },
  { icon: Trophy, text: "AI interview preparation with feedback" },
  { icon: FileText, text: "Access to 1000+ curated job listings" },
  { icon: Sparkles, text: "Personalized learning roadmaps" },
];

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup, oauthLogin, isLoading, error, clearError } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<string>("job_seeker");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get("role");
    const storedRole = localStorage.getItem("selectedRole");
    const role = urlRole || storedRole || "job_seeker";
    setSelectedRole(role);
    localStorage.setItem("selectedRole", role);
  }, []);

  // Handle OAuth callback codes
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (code && (state === "google" || state === "github")) {
      setOauthLoading(true);
      oauthLogin(state, code)
        .then(() => router.push("/dashboard"))
        .catch(() => setOauthLoading(false));
    }
  }, [searchParams, oauthLogin, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(formData.fullName, formData.email, formData.password, formData.confirmPassword, selectedRole);
      router.push("/dashboard");
    } catch {
      // Error is handled by store
    }
  };

  const handleGoogleSignup = () => {
    if (!GOOGLE_CLIENT_ID) {
      alert("Google OAuth is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local");
      return;
    }
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/signup`,
      response_type: "code",
      scope: "openid email profile",
      state: "google",
      access_type: "offline",
      prompt: "consent",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const handleGitHubSignup = () => {
    if (!GITHUB_CLIENT_ID) {
      alert("GitHub OAuth is not configured. Set NEXT_PUBLIC_GITHUB_CLIENT_ID in .env.local");
      return;
    }
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: `${window.location.origin}/signup`,
      scope: "user:email",
      state: "github",
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(238,70%,58%)] via-[hsl(var(--primary))] to-[hsl(var(--chart-5))]" />
        <div className="absolute inset-0 dot-pattern opacity-10" />

        {/* Floating orbs */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-white/5 blur-[60px] animate-float" />
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 rounded-full bg-white/5 blur-[60px] animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 p-12 max-w-md">
          <div className="mb-10 animate-float">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm text-white text-3xl font-black shadow-2xl border border-white/10">
              CX
            </div>
          </div>
          <h2 className="text-3xl font-black mb-6 text-white tracking-tight">Start your career journey today</h2>
          <ul className="space-y-4">
            {benefits.map((b) => (
              <li key={b.text} className="flex items-center gap-3 text-sm text-white/70">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] border border-white/[0.06]">
                  <b.icon size={14} className="text-white/80" />
                </div>
                {b.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 -z-10 dot-pattern opacity-20" />

        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2.5 mb-10 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(238,70%,65%)] text-white font-bold text-sm shadow-[0_2px_12px_hsl(var(--primary)/0.4)]">
              C
            </div>
            <span className="text-xl font-bold tracking-tight">
              Career<span className="gradient-text-static">X</span>
            </span>
          </Link>

          <h1 className="text-3xl font-black mb-2 tracking-tight">Create your account</h1>
          <p className="text-muted-foreground/70 mb-4">Join thousands of professionals accelerating their careers.</p>

          {/* Role indicator */}
          <div className="mb-6 flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/10">
            {selectedRole === "job_seeker" ? (
              <Briefcase size={16} className="text-blue-500" />
            ) : (
              <GraduationCap size={16} className="text-teal-500" />
            )}
            <span className="text-sm font-medium">
              Signing up as {selectedRole === "job_seeker" ? "Job Seeker" : "Higher Studies"}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Full Name</label>
              <Input icon={<User size={15} />} name="fullName" placeholder="John Doe" value={formData.fullName} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Email</label>
              <Input icon={<Mail size={15} />} name="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Password</label>
              <Input icon={<Lock size={15} />} name="password" type="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Confirm Password</label>
              <Input icon={<Lock size={15} />} name="confirmPassword" type="password" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} required />
            </div>

            <Button variant="gradient" className="w-full gap-2" size="lg" type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <>Create Account <ArrowRight size={16} /></>}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground/50 text-[10px] tracking-widest font-medium">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="gap-2 h-11" onClick={handleGoogleSignup} disabled={isLoading || oauthLoading}>
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            <Button variant="outline" className="gap-2 h-11" onClick={handleGitHubSignup} disabled={isLoading || oauthLoading}>
              <Github size={16} /> GitHub
            </Button>
          </div>

          {oauthLoading && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> Completing sign-up...
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground/60 mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={24} className="animate-spin text-primary" /></div>}>
      <SignupContent />
    </Suspense>
  );
}
