"use client";

import React, { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play, RotateCcw, Copy, Terminal, Code2, Loader2, Check,
  ChevronDown, Keyboard, Clock, Zap,
} from "lucide-react";
import { compilerService } from "@/lib/services";

// Lazy-load Monaco (SSR-incompatible) 
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

/* ── Language definitions ─────────────────────────────────────────────────── */
const languages = [
  { id: "cpp",    name: "C++",    ext: "cpp",  monacoId: "cpp",    icon: "⚡", color: "from-blue-600 to-purple-600" },
  { id: "c",      name: "C",      ext: "c",    monacoId: "c",      icon: "🔧", color: "from-gray-600 to-blue-600" },
  { id: "java",   name: "Java",   ext: "java", monacoId: "java",   icon: "☕", color: "from-red-500 to-orange-500" },
  { id: "python", name: "Python", ext: "py",   monacoId: "python", icon: "🐍", color: "from-green-500 to-yellow-500" },
];

const defaultCode: Record<string, string> = {
  cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cout << "Enter number of elements: ";
    cin >> n;
    
    vector<int> arr(n);
    cout << "Enter elements: ";
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    sort(arr.begin(), arr.end());
    
    cout << "Sorted array: ";
    for (int x : arr) {
        cout << x << " ";
    }
    cout << endl;
    return 0;
}`,
  c: `#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    int n;
    printf("Enter number of terms: ");
    scanf("%d", &n);
    
    printf("Fibonacci Series:\\n");
    for (int i = 0; i < n; i++) {
        printf("F(%d) = %d\\n", i, fibonacci(i));
    }
    return 0;
}`,
  java: `import java.util.Scanner;

public class Main {
    public static boolean isPrime(int n) {
        if (n < 2) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter a number: ");
        int num = sc.nextInt();
        
        System.out.println("Prime numbers up to " + num + ":");
        for (int i = 2; i <= num; i++) {
            if (isPrime(i)) {
                System.out.print(i + " ");
            }
        }
        System.out.println();
        sc.close();
    }
}`,
  python: `# Welcome to CareerX Online Compiler

def fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

def is_palindrome(s):
    s = s.lower().replace(" ", "")
    return s == s[::-1]

# Fibonacci
n = int(input("Enter number of terms: "))
print(f"Fibonacci({n}): {fibonacci(n)}")

# Palindrome check
word = input("Enter a word: ")
print(f"'{word}' is {'a palindrome' if is_palindrome(word) else 'not a palindrome'}")
`,
};

const defaultStdin: Record<string, string> = {
  cpp: "5\n3 1 4 1 5",
  c: "10",
  java: "30",
  python: "10\nracecar",
};

export default function CompilerPage() {
  const [selectedLang, setSelectedLang] = useState("cpp");
  const [code, setCode] = useState(defaultCode.cpp);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(false);
  const [stdin, setStdin] = useState(defaultStdin.cpp);
  const [copied, setCopied] = useState(false);
  const [execTime, setExecTime] = useState("");
  const [engine, setEngine] = useState("");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const editorRef = useRef<unknown>(null);

  const currentLang = languages.find((l) => l.id === selectedLang)!;

  const handleEditorMount = useCallback((editor: unknown) => {
    editorRef.current = editor;
  }, []);

  const handleRun = async () => {
    setRunning(true);
    setOutput("");
    setError(false);
    setExecTime("");
    setEngine("");
    try {
      const res = await compilerService.runCode({ language: selectedLang, code, input: stdin || undefined });
      const data = res.data;
      if (data?.executionTime) setExecTime(data.executionTime);
      if (data?.engine) setEngine(data.engine);
      if (data?.error) {
        setOutput(data.error);
        setError(true);
      } else {
        setOutput(data?.output || data?.stdout || "Program exited with no output.");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setOutput(err?.response?.data?.message || "Execution failed. Please try again.");
      setError(true);
    }
    setRunning(false);
  };

  const handleLangChange = (langId: string) => {
    setSelectedLang(langId);
    setCode(defaultCode[langId] || "");
    setOutput("");
    setError(false);
    setStdin(defaultStdin[langId] || "");
    setExecTime("");
    setEngine("");
    setShowLangMenu(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
  };

  return (
    <div className="space-y-4 page-enter-stagger" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Online Compiler</h1>
          <p className="text-muted-foreground/70 text-sm">Write, compile, and run code — powered by cloud execution.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Keyboard size={14} />
          <span>Ctrl + Enter to run</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-2 relative z-30">
        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all hover:bg-muted cursor-pointer"
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${currentLang.color} text-white text-xs`}>
              {currentLang.icon}
            </div>
            {currentLang.name}
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showLangMenu ? "rotate-180" : ""}`} />
          </button>
          {showLangMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 w-48 rounded-xl border border-border/60 bg-popover p-1.5 shadow-xl max-h-64 overflow-y-auto">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLangChange(lang.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${
                      selectedLang === lang.id ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br ${lang.color} text-white text-[10px]`}>
                      {lang.icon}
                    </div>
                    {lang.name}
                    {selectedLang === lang.id && <Check size={14} className="ml-auto text-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleCopy}>
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => { setCode(defaultCode[selectedLang]); setOutput(""); setError(false); setStdin(defaultStdin[selectedLang] || ""); }}>
            <RotateCcw size={14} /> Reset
          </Button>
          <div className="w-px h-5 bg-border/60 mx-1" />
          <Button variant="gradient" size="sm" className="gap-2 min-w-[100px]" onClick={handleRun} disabled={running}>
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      {/* Editor + Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Editor */}
        <Card className="overflow-hidden border-border/40 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Code2 size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                main.{currentLang.ext}
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px]">{currentLang.name}</Badge>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-[420px]">
            <MonacoEditor
              height="420px"
              language={currentLang.monacoId}
              value={code}
              onChange={(val) => setCode(val || "")}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                glyphMargin: false,
                folding: true,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                renderLineHighlight: "line",
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                suggest: { showKeywords: true, showSnippets: true },
                quickSuggestions: true,
              }}
            />
          </div>

          {/* Stdin */}
          <div className="border-t border-border/30">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/20">
              <Terminal size={12} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Standard Input (stdin)</span>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter input for your program here..."
              className="w-full h-[70px] bg-[#1e1e1e] text-[#d4d4d4] px-4 py-3 font-mono text-xs leading-relaxed resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
        </Card>

        {/* Output Panel */}
        <Card className="overflow-hidden border-border/40 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Output</span>
            </div>
            <div className="flex items-center gap-2">
              {execTime && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock size={10} />
                  {execTime}
                </div>
              )}
              {engine && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Zap size={8} />
                  {engine === "cloud" ? "Cloud" : "Local"}
                </Badge>
              )}
              {output && !error && <Badge variant="success" className="text-[10px]">Success</Badge>}
              {error && <Badge variant="destructive" className="text-[10px]">Error</Badge>}
            </div>
          </div>
          <div className="flex-1 min-h-[500px] bg-[#1e1e1e] p-4 overflow-auto">
            {running ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="relative">
                  <div className="w-10 h-10 border-2 border-primary/30 rounded-full" />
                  <div className="absolute inset-0 w-10 h-10 border-2 border-transparent border-t-primary rounded-full animate-spin" />
                </div>
                <span className="text-sm text-muted-foreground font-mono animate-pulse">Compiling & executing...</span>
              </div>
            ) : output ? (
              <pre className={`text-sm font-mono whitespace-pre-wrap leading-relaxed ${error ? "text-[#f38ba8]" : "text-[#a6e3a1]"}`}>
                {output}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-[#6c7086]">
                <Play size={32} className="opacity-30" />
                <p className="text-sm font-mono">Click &quot;Run&quot; or press Ctrl+Enter</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
