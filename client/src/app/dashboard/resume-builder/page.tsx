"use client";

import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download, Plus, Trash2, Loader2, GripVertical,
  User, Briefcase, GraduationCap, Wrench, FolderOpen, Award,
  FileText, Eye, EyeOff, ChevronDown, ChevronUp,
} from "lucide-react";

/* ───────────── types ───────────── */

interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

interface Project {
  id: string;
  name: string;
  tech: string;
  link: string;
  bullets: string[];
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link: string;
}

interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string;
  projects: Project[];
  certifications: Certification[];
}

const uid = () => Math.random().toString(36).slice(2, 9);

const empty: ResumeData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  website: "",
  summary: "",
  experience: [],
  education: [],
  skills: "",
  projects: [],
  certifications: [],
};

/* ───────────── collapsible section ───────────── */

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left cursor-pointer"
      >
        <Icon size={15} className="text-primary shrink-0" />
        <span className="text-sm font-bold flex-1">{title}</span>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

/* ───────────── main component ───────────── */

export default function ResumeBuilderPage() {
  const [data, setData] = useState<ResumeData>(empty);
  const [downloading, setDownloading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  /* helpers */
  const set = useCallback(
    <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
      setData((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const updateExp = (id: string, patch: Partial<Experience>) =>
    set("experience", data.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const updateEdu = (id: string, patch: Partial<Education>) =>
    set("education", data.education.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const updateProj = (id: string, patch: Partial<Project>) =>
    set("projects", data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const updateCert = (id: string, patch: Partial<Certification>) =>
    set("certifications", data.certifications.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  /* download as PDF */
  const handleDownload = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opts: Record<string, unknown> = {
        margin: 0,
        filename: `${data.fullName || "resume"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };
      await html2pdf()
        .set(opts)
        .from(previewRef.current)
        .save();
    } catch {
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const hasContent =
    data.fullName || data.summary || data.experience.length > 0 || data.education.length > 0 || data.skills;

  /* ───────────── render ───────────── */
  return (
    <div className="space-y-4 page-enter-stagger">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Resume Builder</h1>
          <p className="text-muted-foreground/70 text-sm">Fill in your details — see the ATS resume build in real time.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl lg:hidden"
            onClick={() => setPreviewVisible(!previewVisible)}
          >
            {previewVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            {previewVisible ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button
            variant="gradient"
            className="gap-2 rounded-xl"
            disabled={!hasContent || downloading}
            onClick={handleDownload}
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* ─── LEFT: Form ─── */}
        <div className="space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto pr-1 pb-8 custom-scrollbar">
          {/* Personal Info */}
          <Section title="Personal Information" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <Input placeholder="John Doe" value={data.fullName} onChange={(e) => set("fullName", e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input placeholder="john@example.com" value={data.email} onChange={(e) => set("email", e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input placeholder="+91 98765 43210" value={data.phone} onChange={(e) => set("phone", e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Location</Label>
                <Input placeholder="Chennai, India" value={data.location} onChange={(e) => set("location", e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">LinkedIn</Label>
                <Input placeholder="linkedin.com/in/johndoe" value={data.linkedin} onChange={(e) => set("linkedin", e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">GitHub</Label>
                <Input placeholder="github.com/johndoe" value={data.github} onChange={(e) => set("github", e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Website / Portfolio</Label>
                <Input placeholder="johndoe.dev" value={data.website} onChange={(e) => set("website", e.target.value)} className="rounded-xl mt-1" />
              </div>
            </div>
          </Section>

          {/* Summary */}
          <Section title="Professional Summary" icon={FileText}>
            <textarea
              className="w-full rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[90px]"
              placeholder="Results-driven software engineer with 3+ years of experience in full-stack development..."
              value={data.summary}
              onChange={(e) => set("summary", e.target.value)}
            />
          </Section>

          {/* Experience */}
          <Section title="Work Experience" icon={Briefcase}>
            {data.experience.map((exp, idx) => (
              <Card key={exp.id} className="border-border/40">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <GripVertical size={12} /> Experience {idx + 1}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={() => set("experience", data.experience.filter((e) => e.id !== exp.id))}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Job Title</Label>
                      <Input placeholder="Software Engineer" value={exp.role} onChange={(e) => updateExp(exp.id, { role: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Company</Label>
                      <Input placeholder="Google" value={exp.company} onChange={(e) => updateExp(exp.id, { company: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Location</Label>
                      <Input placeholder="Bangalore, India" value={exp.location} onChange={(e) => updateExp(exp.id, { location: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Start</Label>
                        <Input placeholder="Jan 2023" value={exp.startDate} onChange={(e) => updateExp(exp.id, { startDate: e.target.value })} className="rounded-xl mt-1" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">End</Label>
                        <Input
                          placeholder={exp.current ? "Present" : "Dec 2024"}
                          value={exp.current ? "Present" : exp.endDate}
                          disabled={exp.current}
                          onChange={(e) => updateExp(exp.id, { endDate: e.target.value })}
                          className="rounded-xl mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input type="checkbox" checked={exp.current} onChange={(e) => updateExp(exp.id, { current: e.target.checked, endDate: "" })} className="accent-primary" />
                    I currently work here
                  </label>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Key Achievements / Responsibilities</Label>
                    {exp.bullets.map((b, bi) => (
                      <div key={bi} className="flex gap-2">
                        <Input
                          placeholder="Developed a microservice that reduced latency by 40%..."
                          value={b}
                          onChange={(e) => {
                            const nb = [...exp.bullets];
                            nb[bi] = e.target.value;
                            updateExp(exp.id, { bullets: nb });
                          }}
                          className="rounded-xl flex-1"
                        />
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                          onClick={() => updateExp(exp.id, { bullets: exp.bullets.filter((_, i) => i !== bi) })}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs rounded-xl"
                      onClick={() => updateExp(exp.id, { bullets: [...exp.bullets, ""] })}>
                      <Plus size={12} /> Add Bullet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl"
              onClick={() => set("experience", [...data.experience, { id: uid(), company: "", role: "", location: "", startDate: "", endDate: "", current: false, bullets: [""] }])}>
              <Plus size={14} /> Add Experience
            </Button>
          </Section>

          {/* Education */}
          <Section title="Education" icon={GraduationCap}>
            {data.education.map((edu, idx) => (
              <Card key={edu.id} className="border-border/40">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <GripVertical size={12} /> Education {idx + 1}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={() => set("education", data.education.filter((e) => e.id !== edu.id))}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Institution</Label>
                      <Input placeholder="IIT Madras" value={edu.institution} onChange={(e) => updateEdu(edu.id, { institution: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Degree</Label>
                      <Input placeholder="B.Tech" value={edu.degree} onChange={(e) => updateEdu(edu.id, { degree: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Field of Study</Label>
                      <Input placeholder="Computer Science" value={edu.field} onChange={(e) => updateEdu(edu.id, { field: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Location</Label>
                      <Input placeholder="Chennai, India" value={edu.location} onChange={(e) => updateEdu(edu.id, { location: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">GPA / Percentage</Label>
                      <Input placeholder="9.2 / 10" value={edu.gpa} onChange={(e) => updateEdu(edu.id, { gpa: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Start Year</Label>
                      <Input placeholder="2019" value={edu.startDate} onChange={(e) => updateEdu(edu.id, { startDate: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">End Year</Label>
                      <Input placeholder="2023" value={edu.endDate} onChange={(e) => updateEdu(edu.id, { endDate: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl"
              onClick={() => set("education", [...data.education, { id: uid(), institution: "", degree: "", field: "", location: "", startDate: "", endDate: "", gpa: "" }])}>
              <Plus size={14} /> Add Education
            </Button>
          </Section>

          {/* Skills */}
          <Section title="Technical Skills" icon={Wrench}>
            <textarea
              className="w-full rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
              placeholder={"Languages: JavaScript, Python, Java\nFrameworks: React, Node.js, Django\nTools: Git, Docker, AWS, PostgreSQL"}
              value={data.skills}
              onChange={(e) => set("skills", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground/50">Tip: Group by category (Languages, Frameworks, Tools) for better ATS scoring.</p>
          </Section>

          {/* Projects */}
          <Section title="Projects" icon={FolderOpen} defaultOpen={false}>
            {data.projects.map((proj, idx) => (
              <Card key={proj.id} className="border-border/40">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <GripVertical size={12} /> Project {idx + 1}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={() => set("projects", data.projects.filter((p) => p.id !== proj.id))}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Project Name</Label>
                      <Input placeholder="CareerX Platform" value={proj.name} onChange={(e) => updateProj(proj.id, { name: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Technologies Used</Label>
                      <Input placeholder="React, Node.js, MongoDB" value={proj.tech} onChange={(e) => updateProj(proj.id, { tech: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Link (optional)</Label>
                      <Input placeholder="https://github.com/..." value={proj.link} onChange={(e) => updateProj(proj.id, { link: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Description Bullets</Label>
                    {proj.bullets.map((b, bi) => (
                      <div key={bi} className="flex gap-2">
                        <Input
                          placeholder="Built a real-time dashboard serving 10K+ users..."
                          value={b}
                          onChange={(e) => {
                            const nb = [...proj.bullets];
                            nb[bi] = e.target.value;
                            updateProj(proj.id, { bullets: nb });
                          }}
                          className="rounded-xl flex-1"
                        />
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                          onClick={() => updateProj(proj.id, { bullets: proj.bullets.filter((_, i) => i !== bi) })}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs rounded-xl"
                      onClick={() => updateProj(proj.id, { bullets: [...proj.bullets, ""] })}>
                      <Plus size={12} /> Add Bullet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl"
              onClick={() => set("projects", [...data.projects, { id: uid(), name: "", tech: "", link: "", bullets: [""] }])}>
              <Plus size={14} /> Add Project
            </Button>
          </Section>

          {/* Certifications */}
          <Section title="Certifications" icon={Award} defaultOpen={false}>
            {data.certifications.map((cert, idx) => (
              <Card key={cert.id} className="border-border/40">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <GripVertical size={12} /> Certification {idx + 1}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={() => set("certifications", data.certifications.filter((c) => c.id !== cert.id))}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Certification Name</Label>
                      <Input placeholder="AWS Solutions Architect" value={cert.name} onChange={(e) => updateCert(cert.id, { name: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Issuing Organization</Label>
                      <Input placeholder="Amazon Web Services" value={cert.issuer} onChange={(e) => updateCert(cert.id, { issuer: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <Input placeholder="Mar 2024" value={cert.date} onChange={(e) => updateCert(cert.id, { date: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl"
              onClick={() => set("certifications", [...data.certifications, { id: uid(), name: "", issuer: "", date: "", link: "" }])}>
              <Plus size={14} /> Add Certification
            </Button>
          </Section>
        </div>

        {/* ─── RIGHT: Live ATS Preview ─── */}
        <div className={`${previewVisible ? "block" : "hidden lg:block"} sticky top-20`}>
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className="gap-1.5 rounded-lg text-xs">
              <Eye size={11} /> Live Preview
            </Badge>
            <Button variant="gradient" size="sm" className="gap-2 rounded-xl" disabled={!hasContent || downloading} onClick={handleDownload}>
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Download PDF
            </Button>
          </div>

          {/* A4 preview container */}
          <div className="border border-border/50 rounded-xl shadow-lg overflow-hidden bg-white">
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
              <div
                ref={previewRef}
                className="w-full bg-white text-black"
                style={{ padding: "40px 44px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", fontSize: "11px", lineHeight: "1.45", color: "#1a1a1a", minHeight: "1056px" }}
              >
                {/* ── Name & Contact ── */}
                {(data.fullName || data.email || data.phone) ? (
                  <div style={{ textAlign: "center", marginBottom: "14px", borderBottom: "2px solid #1a1a1a", paddingBottom: "12px" }}>
                    {data.fullName && (
                      <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "1px", margin: 0, textTransform: "uppercase", color: "#111" }}>
                        {data.fullName}
                      </h1>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 12px", marginTop: "6px", fontSize: "10px", color: "#444" }}>
                      {data.email && <span>{data.email}</span>}
                      {data.phone && <span>| {data.phone}</span>}
                      {data.location && <span>| {data.location}</span>}
                      {data.linkedin && <span>| {data.linkedin}</span>}
                      {data.github && <span>| {data.github}</span>}
                      {data.website && <span>| {data.website}</span>}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>
                    <p style={{ fontSize: "16px", fontWeight: 600 }}>Your resume preview will appear here</p>
                    <p style={{ fontSize: "11px", marginTop: "6px" }}>Start typing in the form on the left</p>
                  </div>
                )}

                {/* ── Summary ── */}
                {data.summary && (
                  <div style={{ marginBottom: "12px" }}>
                    <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px", color: "#111" }}>
                      Professional Summary
                    </h2>
                    <p style={{ margin: 0, color: "#333" }}>{data.summary}</p>
                  </div>
                )}

                {/* ── Experience ── */}
                {data.experience.length > 0 && data.experience.some((e) => e.role || e.company) && (
                  <div style={{ marginBottom: "12px" }}>
                    <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px", color: "#111" }}>
                      Work Experience
                    </h2>
                    {data.experience.filter((e) => e.role || e.company).map((exp) => (
                      <div key={exp.id} style={{ marginBottom: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <strong style={{ fontSize: "11.5px", color: "#111" }}>{exp.role}</strong>
                          <span style={{ fontSize: "10px", color: "#555" }}>
                            {exp.startDate}{exp.startDate && (exp.endDate || exp.current) ? " – " : ""}{exp.current ? "Present" : exp.endDate}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "#555", marginTop: "1px" }}>
                          <span>{exp.company}</span>
                          <span>{exp.location}</span>
                        </div>
                        {exp.bullets.filter(Boolean).length > 0 && (
                          <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px" }}>
                            {exp.bullets.filter(Boolean).map((b, i) => (
                              <li key={i} style={{ marginBottom: "2px", color: "#333" }}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Education ── */}
                {data.education.length > 0 && data.education.some((e) => e.institution || e.degree) && (
                  <div style={{ marginBottom: "12px" }}>
                    <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px", color: "#111" }}>
                      Education
                    </h2>
                    {data.education.filter((e) => e.institution || e.degree).map((edu) => (
                      <div key={edu.id} style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <strong style={{ fontSize: "11.5px", color: "#111" }}>
                            {edu.degree}{edu.degree && edu.field ? " in " : ""}{edu.field}
                          </strong>
                          <span style={{ fontSize: "10px", color: "#555" }}>
                            {edu.startDate}{edu.startDate && edu.endDate ? " – " : ""}{edu.endDate}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "#555", marginTop: "1px" }}>
                          <span>{edu.institution}</span>
                          <span>{edu.location}{edu.location && edu.gpa ? " | " : ""}{edu.gpa ? `GPA: ${edu.gpa}` : ""}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Skills ── */}
                {data.skills && (
                  <div style={{ marginBottom: "12px" }}>
                    <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px", color: "#111" }}>
                      Technical Skills
                    </h2>
                    {data.skills.split("\n").filter(Boolean).map((line, i) => (
                      <p key={i} style={{ margin: "2px 0", color: "#333" }}>{line}</p>
                    ))}
                  </div>
                )}

                {/* ── Projects ── */}
                {data.projects.length > 0 && data.projects.some((p) => p.name) && (
                  <div style={{ marginBottom: "12px" }}>
                    <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px", color: "#111" }}>
                      Projects
                    </h2>
                    {data.projects.filter((p) => p.name).map((proj) => (
                      <div key={proj.id} style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <strong style={{ fontSize: "11.5px", color: "#111" }}>
                            {proj.name}
                            {proj.tech && <span style={{ fontWeight: 400, color: "#555" }}> | {proj.tech}</span>}
                          </strong>
                          {proj.link && <span style={{ fontSize: "9px", color: "#666" }}>{proj.link}</span>}
                        </div>
                        {proj.bullets.filter(Boolean).length > 0 && (
                          <ul style={{ margin: "3px 0 0 0", paddingLeft: "16px" }}>
                            {proj.bullets.filter(Boolean).map((b, i) => (
                              <li key={i} style={{ marginBottom: "2px", color: "#333" }}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Certifications ── */}
                {data.certifications.length > 0 && data.certifications.some((c) => c.name) && (
                  <div style={{ marginBottom: "12px" }}>
                    <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px", color: "#111" }}>
                      Certifications
                    </h2>
                    {data.certifications.filter((c) => c.name).map((cert) => (
                      <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#222" }}>
                          <strong>{cert.name}</strong>
                          {cert.issuer && <span style={{ color: "#555" }}> — {cert.issuer}</span>}
                        </span>
                        {cert.date && <span style={{ fontSize: "10px", color: "#555" }}>{cert.date}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
