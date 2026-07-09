"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, ArrowRight, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { authService } from "@/lib/services";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await authService.forgotPassword(email);
      setIsSent(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-[hsl(238,70%,65%)]/8 blur-[100px]" />
      </div>

      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground transition-colors mb-10">
          <ArrowLeft size={14} /> Back to login
        </Link>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(238,70%,65%)] text-white mb-6 shadow-[0_4px_16px_hsl(var(--primary)/0.3)]">
          <KeyRound size={24} />
        </div>

        <h1 className="text-3xl font-black mb-2 tracking-tight">Forgot password?</h1>
        <p className="text-muted-foreground/70 mb-8">
          No worries, we&apos;ll send you reset instructions.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {isSent ? (
          <div className="p-6 rounded-2xl bg-success/10 border border-success/20 text-center">
            <CheckCircle2 size={32} className="text-success mx-auto mb-3" />
            <h3 className="font-bold mb-1">Check your email</h3>
            <p className="text-sm text-muted-foreground">We sent a reset link to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Email</label>
              <Input icon={<Mail size={15} />} type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <Button variant="gradient" className="w-full gap-2" size="lg" type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <>Send Reset Link <ArrowRight size={16} /></>}
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
    </div>
  );
}
