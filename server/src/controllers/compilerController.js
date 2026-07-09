const { Problem, Submission } = require("../models/Problem");
const Activity = require("../models/Activity");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const { execFile, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ── Local Code Execution Engine ───────────────────────────────────────────────
// Executes code locally using system runtimes (Node.js, Python, etc.)
// Suitable for portfolio/development — no external API dependency.

const LANG_CONFIG = {
  python: { ext: ".py", cmd: process.platform === "win32" ? "python" : "python3", compile: false },
  java: { ext: ".java", compile: true, compileCmd: "javac", runCmd: "java", className: "Main" },
  cpp: { ext: ".cpp", compile: true, compileCmd: "g++", compileArgs: ["-o"], runCmd: null },
  c: { ext: ".c", compile: true, compileCmd: "gcc", compileArgs: ["-o"], runCmd: null },
};

const TIMEOUT_MS = 10000; // 10 second execution timeout
const MAX_OUTPUT = 50000; // 50KB max output

/**
 * Execute code locally with timeout and output limits.
 * Returns { stdout, stderr, exitCode, executionTime }
 */
async function executeLocally(code, language, stdin = "") {
  const config = LANG_CONFIG[language];
  if (!config) {
    throw new Error(`Unsupported language: ${language}. Supported: ${Object.keys(LANG_CONFIG).join(", ")}`);
  }

  // Create temp directory and file
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "careerx-"));
  const fileName = language === "java" ? "Main" : "code";
  const filePath = path.join(tmpDir, fileName + config.ext);
  fs.writeFileSync(filePath, code, "utf-8");

  const cleanup = () => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  };

  try {
    if (config.compile) {
      // Compiled language: compile first, then run
      const outPath = path.join(tmpDir, fileName + (process.platform === "win32" ? ".exe" : ""));

      // Compile step
      const compileResult = await runProcess(
        config.compileCmd,
        language === "java"
          ? [filePath]
          : [...(config.compileArgs || []), outPath, filePath],
        tmpDir, "", TIMEOUT_MS
      );

      if (compileResult.exitCode !== 0) {
        return {
          stdout: "",
          stderr: compileResult.stderr || "Compilation failed",
          exitCode: compileResult.exitCode,
          executionTime: compileResult.executionTime,
          stage: "compile",
        };
      }

      // Run step
      let runCmd, runArgs;
      if (language === "java") {
        runCmd = "java";
        runArgs = ["-cp", tmpDir, config.className];
      } else {
        runCmd = outPath;
        runArgs = [];
      }

      const runResult = await runProcess(runCmd, runArgs, tmpDir, stdin, TIMEOUT_MS);
      return { ...runResult, stage: "run" };
    } else {
      // Interpreted language: run directly
      const args = [...(config.args || []), filePath];
      const result = await runProcess(config.cmd, args, tmpDir, stdin, TIMEOUT_MS);
      return { ...result, stage: "run" };
    }
  } finally {
    cleanup();
  }
}

/**
 * Run a process with timeout and stdin support.
 */
function runProcess(cmd, args, cwd, stdin, timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const proc = execFile(cmd, args, {
      cwd,
      timeout,
      maxBuffer: MAX_OUTPUT,
      windowsHide: true,
    }, (error, stdout, stderr) => {
      const executionTime = Date.now() - startTime;

      // Command not found — reject so caller can fallback to Piston
      if (error && (error.code === "ENOENT" || String(error.message).includes("ENOENT") || String(error.message).includes("not recognized"))) {
        reject(new Error(`ENOENT: ${cmd} not found on this system`));
        return;
      }

      if (error && error.killed) {
        resolve({
          stdout: stdout || "",
          stderr: "Time Limit Exceeded (10s). Your code took too long to execute.",
          exitCode: 124,
          executionTime,
        });
        return;
      }

      resolve({
        stdout: (stdout || "").substring(0, MAX_OUTPUT),
        stderr: (stderr || "").substring(0, MAX_OUTPUT),
        exitCode: error ? (typeof error.code === "number" ? error.code : 1) : 0,
        executionTime,
      });
    });

    // Send stdin if provided
    if (stdin && proc.stdin) {
      proc.stdin.write(stdin);
      proc.stdin.end();
    }
  });
}

// ── JDoodle API fallback (free, 200 req/day) ──────────────────────────────────
// Used when local compilers (javac, g++, etc.) aren't installed.
// Free signup at https://www.jdoodle.com/compiler-api/
const JDOODLE_URL = "https://api.jdoodle.com/v1/execute";
const JDOODLE_LANG_MAP = {
  python: { language: "python3", versionIndex: "4" },
  java:   { language: "java",    versionIndex: "4" },
  cpp:    { language: "cpp17",   versionIndex: "1" },
  c:      { language: "c",       versionIndex: "5" },
};

async function executeCloud(code, language, stdin = "") {
  const clientId     = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Cloud compiler not configured. Add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to your .env file. " +
      "Get a free key at https://www.jdoodle.com/compiler-api/"
    );
  }

  const langCfg = JDOODLE_LANG_MAP[language];
  if (!langCfg) throw new Error(`JDoodle: unsupported language ${language}`);

  const startTime = Date.now();
  const res = await fetch(JDOODLE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId,
      clientSecret,
      script: code,
      language: langCfg.language,
      versionIndex: langCfg.versionIndex,
      stdin: stdin || "",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`JDoodle API error: ${res.status} ${res.statusText}. ${text}`);
  }

  const data = await res.json();
  const executionTime = Date.now() - startTime;

  // JDoodle returns { output, statusCode, memory, cpuTime, isError }
  const isError = data.isError === true || (data.statusCode && data.statusCode !== 200);
  const output  = data.output || "";

  return {
    stdout: isError ? "" : output,
    stderr: isError ? output : "",
    exitCode: isError ? 1 : 0,
    executionTime,
    stage: isError ? "compile" : "run",
  };
}

// ──────────────────────────────────────
// GET /api/compiler/problems — List problems
// ──────────────────────────────────────
exports.getProblems = asyncHandler(async (req, res) => {
  const { difficulty, category, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (difficulty) filter.difficulty = difficulty;
  if (category) filter.category = category;
  if (search) filter.title = { $regex: search, $options: "i" };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Problem.countDocuments(filter);

  const problems = await Problem.find(filter)
    .select("title slug difficulty category tags companies")
    .sort("difficulty title")
    .skip(skip)
    .limit(parseInt(limit));

  // Get user's solved problems
  let solvedSet = new Set();
  if (req.user) {
    const solved = await Submission.find({
      user: req.user._id,
      status: "accepted",
    }).distinct("problem");
    solvedSet = new Set(solved.map((id) => id.toString()));
  }

  const result = problems.map((p) => ({
    ...p.toObject(),
    isSolved: solvedSet.has(p._id.toString()),
  }));

  res.json({
    success: true,
    data: {
      problems: result,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ──────────────────────────────────────
// GET /api/compiler/problems/:slug — Get problem
// ──────────────────────────────────────
exports.getProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({ slug: req.params.slug });
  if (!problem) throw new AppError("Problem not found", 404);

  // Remove solution from response
  const p = problem.toObject();
  delete p.solution;
  delete p.testCases;

  // Get user submissions for this problem
  let submissions = [];
  if (req.user) {
    submissions = await Submission.find({
      user: req.user._id,
      problem: problem._id,
    })
      .select("language status passedTests totalTests executionTime createdAt")
      .sort("-createdAt")
      .limit(10);
  }

  res.json({ success: true, data: { problem: p, submissions } });
});

// ──────────────────────────────────────
// POST /api/compiler/run — Execute code locally
// ──────────────────────────────────────
exports.runCode = asyncHandler(async (req, res) => {
  const { code, language, input = "" } = req.body;

  if (!code || !language) {
    throw new AppError("Code and language are required", 400);
  }

  let result;
  let usedPiston = false;

  try {
    result = await executeLocally(code, language, input);
  } catch (err) {
    // If local execution fails (e.g. javac/g++ not installed), try Piston API
    const isNotFound = err.message?.includes("ENOENT") || err.message?.includes("not recognized") || err.message?.includes("not found");
    if (isNotFound) {
      console.log(`[Compiler] Local ${language} not available, using Piston API...`);
      try {
        result = await executeCloud(code, language, input);
        usedPiston = true;
      } catch (pistonErr) {
        return res.json({
          success: true,
          data: {
            output: "",
            error: `Local compiler not found and cloud fallback failed: ${pistonErr.message}`,
            status: "error",
            executionTime: "0ms",
            language,
          },
        });
      }
    } else {
      return res.json({
        success: true,
        data: {
          output: "",
          error: err.message || "Execution failed",
          status: "error",
          executionTime: "0ms",
          language,
        },
      });
    }
  }

  // Compile error
  if (result.stage === "compile" && result.exitCode !== 0) {
    return res.json({
      success: true,
      data: {
        output: "",
        error: result.stderr,
        status: "compile_error",
        executionTime: `${result.executionTime}ms`,
        language,
        engine: usedPiston ? "cloud" : "local",
      },
    });
  }

  // Runtime error (has stderr but no stdout)
  if (result.stderr && !result.stdout) {
    return res.json({
      success: true,
      data: {
        output: "",
        error: result.stderr,
        status: result.exitCode === 124 ? "time_limit_exceeded" : "runtime_error",
        executionTime: `${result.executionTime}ms`,
        language,
        engine: usedPiston ? "cloud" : "local",
      },
    });
  }

  // Success
  res.json({
    success: true,
    data: {
      output: result.stdout || "",
      error: result.stderr || null,
      status: result.exitCode === 0 ? "success" : "error",
      executionTime: `${result.executionTime}ms`,
      language,
      engine: usedPiston ? "cloud" : "local",
    },
  });
});

// ──────────────────────────────────────
// POST /api/compiler/submit — Submit solution for a problem
// ──────────────────────────────────────
exports.submitSolution = asyncHandler(async (req, res) => {
  const { code, language, problemSlug } = req.body;

  if (!code || !language || !problemSlug) {
    throw new AppError("Code, language, and problemSlug are required", 400);
  }

  const problem = await Problem.findOne({ slug: problemSlug });
  if (!problem) throw new AppError("Problem not found", 404);

  const startTime = Date.now();

  // Run each test case with local execution
  const testCases = problem.testCases || [];
  const testResults = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      let result;
      try {
        result = await executeLocally(code, language, tc.input || "");
      } catch (localErr) {
        // Fallback to Piston if local compiler not found
        const isNotFound = localErr.message?.includes("ENOENT") || localErr.message?.includes("not recognized") || localErr.message?.includes("not found");
        if (isNotFound) {
          result = await executeCloud(code, language, tc.input || "");
        } else {
          throw localErr;
        }
      }

      let actualOutput = "";
      let passed = false;

      if (result.stage === "compile" && result.exitCode !== 0) {
        actualOutput = `[Compile Error] ${(result.stderr || "").substring(0, 200)}`;
      } else if (result.stderr && !result.stdout) {
        actualOutput = `[Runtime Error] ${(result.stderr || "").substring(0, 200)}`;
      } else {
        actualOutput = (result.stdout || "").trim();
        const expected = (tc.expectedOutput || "").trim();
        passed = actualOutput.replace(/\r\n/g, "\n").trim() === expected.replace(/\r\n/g, "\n").trim();
      }

      testResults.push({
        testCase: i + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput,
        passed,
        hidden: tc.isHidden,
      });
    } catch (err) {
      testResults.push({
        testCase: i + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: `[Error] ${err.message}`,
        passed: false,
        hidden: tc.isHidden,
      });
    }
  }

  const executionTime = Date.now() - startTime;
  const passedTests = testResults.filter((t) => t.passed).length;
  const totalTests = testResults.length;
  const allPassed = passedTests === totalTests && totalTests > 0;

  const submission = await Submission.create({
    user: req.user._id,
    problem: problem._id,
    language,
    code,
    status: totalTests === 0 ? "accepted" : allPassed ? "accepted" : "wrong-answer",
    testResults: testResults.map((t) => ({
      input: t.hidden ? "[hidden]" : t.input,
      expectedOutput: t.hidden ? "[hidden]" : t.expectedOutput,
      actualOutput: t.actualOutput,
      passed: t.passed,
    })),
    passedTests,
    totalTests,
    executionTime,
    memory: 0,
  });

  // XP
  const xp = allPassed ? 25 : passedTests > 0 ? 10 : 5;
  submission.xpEarned = xp;
  await submission.save();

  if (allPassed) {
    await Activity.create({
      user: req.user._id,
      action: `Solved "${problem.title}" in ${language}`,
      type: "problem",
      xpEarned: xp,
      metadata: { problem: problem.title, language },
    });
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalXP: xp, activeScore: 10, "stats.problemsSolved": 1 },
    });
  }

  res.json({
    success: true,
    data: {
      submissionId: submission._id,
      status: submission.status,
      passedTests,
      totalTests,
      xpEarned: xp,
      testResults: testResults.map((t) => ({
        testCase: t.testCase,
        passed: t.passed,
        input: t.hidden ? "[hidden]" : t.input,
        expectedOutput: t.hidden ? "[hidden]" : t.expectedOutput,
        actualOutput: t.actualOutput,
      })),
    },
  });
});

// ──────────────────────────────────────
// GET /api/compiler/submissions — User submission history
// ──────────────────────────────────────
exports.getSubmissions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status: statusFilter } = req.query;
  const filter = { user: req.user._id };
  if (statusFilter) filter.status = statusFilter;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Submission.countDocuments(filter);

  const submissions = await Submission.find(filter)
    .populate("problem", "title slug difficulty category")
    .select("language status passedTests totalTests executionTime memory xpEarned createdAt")
    .sort("-createdAt")
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: {
      submissions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ──────────────────────────────────────
// GET /api/compiler/stats — Coding statistics
// ──────────────────────────────────────
exports.getCodingStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [totalSolved, totalSubmissions, categoryStats, languageStats, difficultyStats] =
    await Promise.all([
      Submission.distinct("problem", { user: userId, status: "accepted" }).then((r) => r.length),
      Submission.countDocuments({ user: userId }),
      Submission.aggregate([
        { $match: { user: userId, status: "accepted" } },
        { $lookup: { from: "problems", localField: "problem", foreignField: "_id", as: "prob" } },
        { $unwind: "$prob" },
        { $group: { _id: "$prob.category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Submission.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$language", count: { $sum: 1 }, accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),
      Submission.aggregate([
        { $match: { user: userId, status: "accepted" } },
        { $lookup: { from: "problems", localField: "problem", foreignField: "_id", as: "prob" } },
        { $unwind: "$prob" },
        { $group: { _id: "$prob.difficulty", count: { $sum: 1 } } },
      ]),
    ]);

  res.json({
    success: true,
    data: {
      totalSolved,
      totalSubmissions,
      acceptanceRate: totalSubmissions > 0 ? Math.round((totalSolved / totalSubmissions) * 100) : 0,
      categoryStats,
      languageStats,
      difficultyStats: {
        easy: difficultyStats.find((d) => d._id === "easy")?.count || 0,
        medium: difficultyStats.find((d) => d._id === "medium")?.count || 0,
        hard: difficultyStats.find((d) => d._id === "hard")?.count || 0,
      },
    },
  });
});

// ──────────────────────────────────────
// POST /api/compiler/seed — Seed problems
// ──────────────────────────────────────
exports.seedProblems = asyncHandler(async (req, res) => {
  const sampleProblems = [
    {
      title: "Two Sum",
      slug: "two-sum",
      description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
      difficulty: "easy",
      category: "arrays",
      tags: ["array", "hash-map"],
      constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists"],
      examples: [
        { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 2 + 7 = 9" },
        { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "nums[1] + nums[2] = 2 + 4 = 6" },
      ],
      starterCode: { javascript: "function twoSum(nums, target) {\n  // Your code here\n}", python: "def two_sum(nums, target):\n    # Your code here\n    pass", java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n}" },
      testCases: [
        { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
        { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
        { input: "[3,3]\n6", expectedOutput: "[0,1]" },
      ],
      hints: ["Use a hash map to store complements", "One pass solution is possible"],
      companies: ["Google", "Amazon", "Microsoft"],
    },
    {
      title: "Valid Parentheses",
      slug: "valid-parentheses",
      description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nA string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket.",
      difficulty: "easy",
      category: "stacks",
      tags: ["stack", "string"],
      constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'"],
      examples: [
        { input: 's = "()"', output: "true" },
        { input: 's = "()[]{}"', output: "true" },
        { input: 's = "(]"', output: "false" },
      ],
      starterCode: { javascript: "function isValid(s) {\n  // Your code here\n}", python: "def is_valid(s):\n    # Your code here\n    pass" },
      testCases: [
        { input: "()", expectedOutput: "true" },
        { input: "()[]{}", expectedOutput: "true" },
        { input: "(]", expectedOutput: "false" },
        { input: "([)]", expectedOutput: "false" },
        { input: "{[]}", expectedOutput: "true" },
      ],
      hints: ["Use a stack", "Push opening brackets, pop for closing"],
      companies: ["Amazon", "Facebook", "Bloomberg"],
    },
    {
      title: "Reverse Linked List",
      slug: "reverse-linked-list",
      description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
      difficulty: "easy",
      category: "linked-lists",
      tags: ["linked-list", "recursion"],
      constraints: ["0 <= Number of nodes <= 5000", "-5000 <= Node.val <= 5000"],
      examples: [
        { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
        { input: "head = [1,2]", output: "[2,1]" },
      ],
      starterCode: { javascript: "function reverseList(head) {\n  // Your code here\n}", python: "def reverse_list(head):\n    # Your code here\n    pass" },
      testCases: [
        { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]" },
        { input: "[1,2]", expectedOutput: "[2,1]" },
        { input: "[]", expectedOutput: "[]" },
      ],
      hints: ["Use three pointers: prev, curr, next", "Can also be done recursively"],
      companies: ["Microsoft", "Apple", "Amazon"],
    },
    {
      title: "Maximum Subarray",
      slug: "maximum-subarray",
      description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
      difficulty: "medium",
      category: "dynamic-programming",
      tags: ["array", "dynamic-programming", "divide-and-conquer"],
      constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
      examples: [
        { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
      ],
      starterCode: { javascript: "function maxSubArray(nums) {\n  // Your code here\n}", python: "def max_sub_array(nums):\n    # Your code here\n    pass" },
      testCases: [
        { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6" },
        { input: "[1]", expectedOutput: "1" },
        { input: "[5,4,-1,7,8]", expectedOutput: "23" },
      ],
      hints: ["Kadane's algorithm", "Keep track of current sum and max sum"],
      companies: ["Google", "Amazon", "LinkedIn"],
    },
    {
      title: "Merge Two Sorted Lists",
      slug: "merge-two-sorted-lists",
      description: "Merge two sorted linked lists and return it as a sorted list. The list should be made by splicing together the nodes of the first two lists.",
      difficulty: "easy",
      category: "linked-lists",
      tags: ["linked-list", "recursion"],
      constraints: ["0 <= list length <= 50", "-100 <= Node.val <= 100", "Both lists are sorted in non-decreasing order"],
      examples: [
        { input: "l1 = [1,2,4], l2 = [1,3,4]", output: "[1,1,2,3,4,4]" },
      ],
      starterCode: { javascript: "function mergeTwoLists(l1, l2) {\n  // Your code here\n}", python: "def merge_two_lists(l1, l2):\n    # Your code here\n    pass" },
      testCases: [
        { input: "[1,2,4]\n[1,3,4]", expectedOutput: "[1,1,2,3,4,4]" },
        { input: "[]\n[]", expectedOutput: "[]" },
        { input: "[]\n[0]", expectedOutput: "[0]" },
      ],
      hints: ["Use a dummy head node", "Compare values and link nodes"],
      companies: ["Amazon", "Apple", "Microsoft"],
    },
    {
      title: "Longest Palindromic Substring",
      slug: "longest-palindromic-substring",
      description: "Given a string `s`, return the longest palindromic substring in s.",
      difficulty: "medium",
      category: "strings",
      tags: ["string", "dynamic-programming"],
      constraints: ["1 <= s.length <= 1000", "s consists only of digits and English letters"],
      examples: [
        { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also a valid answer.' },
        { input: 's = "cbbd"', output: '"bb"' },
      ],
      starterCode: { javascript: "function longestPalindrome(s) {\n  // Your code here\n}", python: "def longest_palindrome(s):\n    # Your code here\n    pass" },
      testCases: [
        { input: "babad", expectedOutput: "bab" },
        { input: "cbbd", expectedOutput: "bb" },
        { input: "a", expectedOutput: "a" },
      ],
      hints: ["Expand around center", "Consider both odd and even length palindromes"],
      companies: ["Amazon", "Microsoft", "Google"],
    },
    {
      title: "LRU Cache",
      slug: "lru-cache",
      description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- `LRUCache(int capacity)` Initialize the LRU cache with positive size capacity.\n- `int get(int key)` Return the value if the key exists, otherwise return -1.\n- `void put(int key, int value)` Update or add the key-value pair. If the number of keys exceeds the capacity, evict the least recently used key.",
      difficulty: "hard",
      category: "hash-maps",
      tags: ["hash-map", "linked-list", "design"],
      constraints: ["1 <= capacity <= 3000", "0 <= key <= 10^4", "0 <= value <= 10^5", "At most 2 * 10^5 calls to get and put"],
      examples: [
        { input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', output: "[null,null,null,1,null,-1,null,-1,3,4]" },
      ],
      starterCode: { javascript: "class LRUCache {\n  constructor(capacity) {\n    // Your code here\n  }\n  get(key) {\n    // Your code here\n  }\n  put(key, value) {\n    // Your code here\n  }\n}", python: "class LRUCache:\n    def __init__(self, capacity):\n        # Your code here\n        pass\n    def get(self, key):\n        # Your code here\n        pass\n    def put(self, key, value):\n        # Your code here\n        pass" },
      testCases: [
        { input: "put(1,1) put(2,2) get(1) put(3,3) get(2) put(4,4) get(1) get(3) get(4)", expectedOutput: "1 -1 -1 3 4" },
      ],
      hints: ["Use a doubly linked list + hash map", "O(1) for both get and put"],
      companies: ["Amazon", "Google", "Facebook", "Microsoft"],
    },
  ];

  await Problem.deleteMany({});
  const inserted = await Problem.insertMany(sampleProblems);

  res.json({
    success: true,
    message: `Seeded ${inserted.length} coding problems.`,
    data: { count: inserted.length },
  });
});
