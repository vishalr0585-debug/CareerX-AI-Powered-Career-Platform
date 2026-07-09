"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowLeft, ArrowRight, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { authService } from "@/lib/services";
import { syncTokenCookie } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token. Please request a new reset link.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword(token, password, confirmPassword);
      if (res.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
        syncTokenCookie(true);
        // Sync the auth store so the dashboard guard doesn't redirect back to login
        await useAuthStore.getState().fetchUser();
      }
      setIsSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Reset failed. The link may have expired.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
          <ShieldCheck size={24} />
        </div>
        <h1 className="text-3xl font-black mb-2 tracking-tight">Invalid Link</h1>
        <p className="text-muted-foreground/70 mb-6">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link href="/forgot-password">
          <Button variant="gradient" className="gap-2" size="lg">
            Request New Link <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground transition-colors mb-10"
      >
        <ArrowLeft size={14} /> Back to login
      </Link>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(238,70%,65%)] text-white mb-6 shadow-[0_4px_16px_hsl(var(--primary)/0.3)]">
        <ShieldCheck size={24} />
      </div>

      <h1 className="text-3xl font-black mb-2 tracking-tight">Set new password</h1>
      <p className="text-muted-foreground/70 mb-8">
        Your new password must be at least 8 characters long.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {isSuccess ? (
        <div className="p-6 rounded-2xl bg-success/10 border border-success/20 text-center">
          <CheckCircle2 size={32} className="text-success mx-auto mb-3" />
          <h3 className="font-bold mb-1">Password reset successful!</h3>
          <p className="text-sm text-muted-foreground">
            Redirecting to dashboard...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold">New Password</label>
            <Input
              icon={<Lock size={15} />}
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Confirm Password</label>
            <Input
              icon={<Lock size={15} />}
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button
            variant="gradient"
            className="w-full gap-2"
            size="lg"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Resetting...
              </>
            ) : (
              <>
                Reset Password <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground/60 mt-8">
        Remember your password?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-[hsl(238,70%,65%)]/8 blur-[100px]" />
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center gap-3">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
