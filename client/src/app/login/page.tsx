"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, ArrowRight, Github, Sparkles, Shield, Zap, Loader2, Briefcase, GraduationCap } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, oauthLogin, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("selectedRole") || "job_seeker";
    setSelectedRole(role);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      // Error handled by store
    }
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      alert("Google OAuth is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local");
      return;
    }
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/login`,
      response_type: "code",
      scope: "openid email profile",
      state: "google",
      access_type: "offline",
      prompt: "consent",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const handleGitHubLogin = () => {
    if (!GITHUB_CLIENT_ID) {
      alert("GitHub OAuth is not configured. Set NEXT_PUBLIC_GITHUB_CLIENT_ID in .env.local");
      return;
    }
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: `${window.location.origin}/login`,
      scope: "user:email",
      state: "github",
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 -z-10 dot-pattern opacity-20" />

        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-10 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(238,70%,65%)] text-white font-bold text-sm shadow-[0_2px_12px_hsl(var(--primary)/0.4)]">
              C
            </div>
            <span className="text-xl font-bold tracking-tight">
              Career<span className="gradient-text-static">X</span>
            </span>
          </Link>

          <h1 className="text-3xl font-black mb-2 tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground/70 mb-4">Sign in to continue your career journey.</p>

          {selectedRole && (
            <div className="mb-6 flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/10">
              {selectedRole === "job_seeker" ? (
                <Briefcase size={16} className="text-blue-500" />
              ) : (
                <GraduationCap size={16} className="text-teal-500" />
              )}
              <span className="text-sm font-medium">
                {selectedRole === "job_seeker" ? "Job Seeker" : "Higher Studies"} mode
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Email</label>
              <Input icon={<Mail size={15} />} type="email" placeholder="john@example.com" value={email} onChange={(e) => { setEmail(e.target.value); if (error) clearError(); }} required />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <Input icon={<Lock size={15} />} type="password" placeholder="Enter your password" value={password} onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }} required />
            </div>

            <Button variant="gradient" className="w-full gap-2" size="lg" type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : <>Sign In <ArrowRight size={16} /></>}
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
            <Button variant="outline" className="gap-2 h-11" onClick={handleGoogleLogin} disabled={isLoading || oauthLoading}>
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            <Button variant="outline" className="gap-2 h-11" onClick={handleGitHubLogin} disabled={isLoading || oauthLoading}>
              <Github size={16} />
              GitHub
            </Button>
          </div>

          {oauthLoading && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> Completing sign-in...
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground/60 mt-8">
            Don&apos;t have an account?{" "}
            <Link href={`/signup${selectedRole ? `?role=${selectedRole}` : ""}`} className="text-primary font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(238,70%,58%)] to-[hsl(var(--chart-4))]" />
        <div className="absolute inset-0 dot-pattern opacity-10" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-white/5 blur-[60px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-white/5 blur-[60px] animate-float" style={{ animationDelay: "3s" }} />

        <div className="relative z-10 text-center p-12 max-w-md">
          <div className="mb-10 animate-float">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm text-white text-4xl font-black shadow-2xl border border-white/10">
              CX
            </div>
          </div>
          <h2 className="text-3xl font-black mb-4 text-white tracking-tight">Your AI Career Companion</h2>
          <p className="text-white/60 leading-relaxed mb-10">Build resumes, practice coding, ace interviews, and discover your dream job.</p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Sparkles, label: "AI-Powered", value: "15+" },
              { icon: Shield, label: "Secure", value: "JWT" },
              { icon: Zap, label: "Fast", value: "60+" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/[0.08] backdrop-blur-sm p-4 border border-white/[0.06]">
                <item.icon size={20} className="mx-auto mb-2 text-white/70" />
                <div className="text-lg font-black text-white">{item.value}</div>
                <div className="text-[10px] text-white/40 font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={24} className="animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
