"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send, Bot, Sparkles, BookOpen, Briefcase, Code2,
  GraduationCap, Lightbulb, RotateCcw, ThumbsUp, ThumbsDown, Copy, Loader2,
} from "lucide-react";
import { chatService } from "@/lib/services";
import { useAuthStore } from "@/stores/authStore";

const quickPrompts = [
  { label: "Career Advice", icon: Briefcase, prompt: "What career path should I choose as a CS graduate?" },
  { label: "Resume Help", icon: BookOpen, prompt: "How can I improve my resume for a software engineer role?" },
  { label: "Coding Tips", icon: Code2, prompt: "Explain the best approach to solve dynamic programming problems" },
  { label: "Exam Guide", icon: GraduationCap, prompt: "Create a 3-month preparation plan for GATE CSE" },
  { label: "Interview Prep", icon: Lightbulb, prompt: "Common system design interview questions and how to approach them" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const welcomeMessage: Message = {
  role: "assistant",
  content: "Hello! I'm your AI Career Assistant. I can help you with:\n\n• **Career guidance** — choosing paths, skill development\n• **Resume optimization** — ATS tips, formatting advice\n• **Interview preparation** — common questions, strategies\n• **Exam preparation** — GATE, CAT, GRE study plans\n• **Technical help** — coding concepts, system design\n\nHow can I help you today?",
  timestamp: "Just now",
};

export default function AIChatPage() {
  const { user } = useAuthStore();
  const userInitials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const ensureSession = async (): Promise<string> => {
    if (sessionId) return sessionId;
    try {
      const res = await chatService.createSession({ topic: "career" });
      const session = res.data?.session || res.data;
      const id = session.sessionId || session._id;
      setSessionId(id);
      return id;
    } catch (e) {
      console.error("Failed to create session", e);
      throw e;
    }
  };

  const handleSend = async (text?: string) => {
    const message = text || input;
    if (!message.trim()) return;

    const userMsg: Message = { role: "user", content: message, timestamp: "Just now" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const sid = await ensureSession();
      const res = await chatService.sendMessage(sid, { content: message });
      const data = res.data;
      const aiContent = data?.assistantMessage?.content || data?.reply || data?.message?.content || data?.response || "I appreciate your question! Let me think about this...";
      const aiMsg: Message = { role: "assistant", content: aiContent, timestamp: "Just now" };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error("Chat error", e);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process your request. Please try again.", timestamp: "Just now" }]);
    }
    setIsTyping(false);
  };

  const handleNewChat = () => {
    setMessages([welcomeMessage]);
    setSessionId(null);
  };

  return (
    <div className="space-y-4 page-enter-stagger">
      <div>
        <h1 className="text-3xl font-black tracking-tight">AI Career Assistant</h1>
        <p className="text-muted-foreground/70">Get real-time career guidance, exam tips, and technical help from AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50 mb-3">Quick Prompts</h3>
              <div className="space-y-2">
                {quickPrompts.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => handleSend(qp.prompt)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-all hover:bg-primary/8 hover:text-primary cursor-pointer border border-transparent hover:border-primary/15"
                  >
                    <qp.icon size={16} className="shrink-0 text-muted-foreground" />
                    <span>{qp.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50 mb-3">Chat Settings</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Model</span>
                  <Badge variant="secondary" className="text-xs">Gemini AI</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Context</span>
                  <Badge variant="secondary" className="text-xs">Career</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3 gap-2" onClick={handleNewChat}>
                <RotateCcw size={12} /> New Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-3 flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(238,70%,65%)] text-white">
                    <Bot size={16} />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }} />
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                      <button className="p-1 rounded hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsUp size={12} />
                      </button>
                      <button className="p-1 rounded hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsDown size={12} />
                      </button>
                      <button className="p-1 rounded hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors" onClick={() => navigator.clipboard.writeText(msg.content)}>
                        <Copy size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{userInitials}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(238,70%,65%)] text-white">
                  <Bot size={16} />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything about career, coding, exams..."
                className="flex-1"
              />
              <Button variant="gradient" size="icon" onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
                {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              AI can make mistakes. Verify important information independently.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
