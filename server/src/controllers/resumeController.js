const Resume = require("../models/Resume");
const Activity = require("../models/Activity");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const fs = require("fs");
const path = require("path");
const { generateJSON } = require("../services/geminiService");

// ── PDF Text Extraction ───────────────────────────────────────────────────────
async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  }
  // PDF
  const pdfParse = require("pdf-parse");
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

// ── AI Resume Improver Engine (Gemini-powered) ──────────────────────────────
async function improveResume(originalText, jobDescription) {
  try {
    const jdContext = jobDescription
      ? `

=== TARGET JOB DESCRIPTION ===
${jobDescription}
=== END JOB DESCRIPTION ===

IMPORTANT: The improved resume MUST be specifically tailored to this job description. Incorporate relevant keywords, mirror the language used in the JD, and emphasize matching experience/skills.`
      : "";

    const result = await generateJSON(`You are a world-class professional resume writer with 15+ years of experience helping candidates land jobs at top companies (Google, Amazon, Microsoft, etc.). You specialize in creating ATS-optimized, high-impact resumes.

=== ORIGINAL RESUME ===
${originalText}
=== END ORIGINAL RESUME ===${jdContext}

YOUR TASK: Completely rewrite and dramatically improve this resume. Do NOT just rephrase — transform it into a compelling, professional document that would impress recruiters.

MANDATORY IMPROVEMENT RULES:
1. **PROFESSIONAL SUMMARY** (3-4 sentences): Write a powerful summary highlighting years of experience, key expertise, domain knowledge, and career impact. Use metrics if available. Never use first person ("I"). Example: "Results-driven Software Engineer with 3+ years of experience building scalable web applications..."
2. **TECHNICAL SKILLS**: Organize into categories (Languages, Frameworks, Databases, Tools, Cloud, etc.). List ONLY skills that appear in the resume or are strongly implied. If a JD is provided, prioritize matching skills first.
3. **PROFESSIONAL EXPERIENCE**: 
   - Each bullet MUST start with a strong action verb (Engineered, Spearheaded, Architected, Optimized, Delivered, Orchestrated, etc.)
   - Each bullet MUST include quantifiable impact where possible (percentages, user counts, time saved, revenue, etc.). If the original has no metrics, add realistic estimated ones like "Improved API response time by ~40%" or "Served 1,000+ daily active users"
   - 4-6 bullets per role, each showing IMPACT not just responsibility
   - Use the XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]"
4. **PROJECTS**: Rewrite with tech stack, problem solved, and measurable outcome. Each project should read like a mini case study.
5. **EDUCATION**: Clean formatting with degree, institution, year, and relevant coursework/GPA if notable.
6. **CERTIFICATIONS/ACHIEVEMENTS**: Highlight with dates and issuing organizations.

FORMATTING RULES:
- Use these exact section headers in ALL CAPS: PROFESSIONAL SUMMARY, TECHNICAL SKILLS, PROFESSIONAL EXPERIENCE, EDUCATION, PROJECTS, CERTIFICATIONS & ACHIEVEMENTS
- Put candidate name in ALL CAPS at the top
- Contact info on one line separated by " | "
- Add a line of "─" (50 characters) under each section header
- Use "•" for bullet points
- Keep total length between 450-700 words (1-2 pages equivalent)
- Ensure clean, consistent spacing between sections

Return a JSON object:
{
  "improvedText": "The COMPLETE improved resume as formatted plain text following all rules above. This must be a full, ready-to-use resume — not a summary or outline.",
  "improvementNotes": [
    "✅ Specific improvement 1 — describe exactly what you changed and why",
    "✅ Specific improvement 2 — be precise about the before vs after",
    ...6-10 total notes
  ],
  "parsedSections": {
    "name": "candidate's full name",
    "skillCount": <number of unique skills identified>,
    "experienceCount": <number of work experience entries>,
    "educationCount": <number of education entries>,
    "projectCount": <number of projects>,
    "bulletPoints": <total number of experience bullet points>,
    "hasMetrics": <boolean — does the improved version include quantifiable metrics>,
    "estimatedWordCount": <word count of improved resume>
  }
}`, { maxTokens: 8192, temperature: 0.4 });

    return {
      improvedText: result.improvedText || originalText,
      improvementNotes: result.improvementNotes || ["✅ AI analysis complete"],
      parsedSections: result.parsedSections || {},
    };
  } catch (err) {
    console.error("[Resume AI] Gemini improvement failed, using fallback:", err.message);
    return improveResumeFallback(originalText, jobDescription);
  }
}

// Fallback rule-based improver (used when AI is unavailable)
function improveResumeFallback(originalText, jobDescription) {
  const lines = originalText.split("\n").map((l) => l.trim()).filter(Boolean);

  // ── Extract sections from raw text ──
  const parsed = {
    name: "",
    contact: [],
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    otherSections: [],
  };

  // Header detection: first non-email, non-phone, non-url line is likely the name
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const phoneRegex = /(\+?\d[\d\s\-()]{7,})/;
  const urlRegex = /(?:https?:\/\/|www\.)\S+/gi;
  const linkedinRegex = /linkedin\.com\/in\/\S+/i;
  const githubRegex = /github\.com\/\S+/i;

  let nameFound = false;
  const contactLines = [];

  for (const line of lines.slice(0, 8)) {
    if (!nameFound && !emailRegex.test(line) && !phoneRegex.test(line) && !urlRegex.test(line) && line.length > 2 && line.length < 60) {
      parsed.name = line;
      nameFound = true;
      continue;
    }
    const email = line.match(emailRegex);
    const phone = line.match(phoneRegex);
    const linkedin = line.match(linkedinRegex);
    const github = line.match(githubRegex);
    const url = line.match(urlRegex);
    if (email) contactLines.push(email[0]);
    if (phone) contactLines.push(phone[0].trim());
    if (linkedin) contactLines.push(linkedin[0]);
    else if (github) contactLines.push(github[0]);
    else if (url) contactLines.push(url[0]);
    // Location heuristic
    if (/,\s*[A-Z]{2}\b/.test(line) || /\b(India|USA|UK|Canada|Germany|Australia)\b/i.test(line)) {
      if (!contactLines.includes(line)) contactLines.push(line);
    }
  }
  parsed.contact = [...new Set(contactLines)];

  // Section detection by headings
  const sectionHeadings = {
    summary: /^(summary|profile|objective|about\s*me|professional\s*summary)/i,
    experience: /^(experience|work\s*experience|employment|work\s*history|professional\s*experience)/i,
    education: /^(education|academic|qualification)/i,
    skills: /^(skills|technical\s*skills|technologies|tools|core\s*competencies|proficiencies)/i,
    projects: /^(projects|personal\s*projects|notable\s*projects|key\s*projects)/i,
    certifications: /^(certifications?|certificates?|licenses?|awards?|achievements?)/i,
  };

  let currentSection = null;
  let currentContent = [];

  const flushSection = () => {
    if (currentSection && currentContent.length > 0) {
      const text = currentContent.join("\n").trim();
      if (currentSection === "summary") parsed.summary = text;
      else if (currentSection === "experience") parsed.experience.push(text);
      else if (currentSection === "education") parsed.education.push(text);
      else if (currentSection === "skills") parsed.skills = text.split(/[,;|•·●]/).map((s) => s.trim()).filter(Boolean);
      else if (currentSection === "projects") parsed.projects.push(text);
      else if (currentSection === "certifications") parsed.certifications.push(text);
      else parsed.otherSections.push({ heading: currentSection, content: text });
    }
    currentContent = [];
  };

  // Skip header lines
  const bodyStart = Math.min(8, lines.length);
  for (let i = bodyStart; i < lines.length; i++) {
    let matched = false;
    for (const [section, regex] of Object.entries(sectionHeadings)) {
      if (regex.test(lines[i])) {
        flushSection();
        currentSection = section;
        matched = true;
        break;
      }
    }
    if (!matched && currentSection) {
      currentContent.push(lines[i]);
    } else if (!matched && !currentSection) {
      // Pre-section content might be summary
      if (lines[i].length > 30) {
        parsed.summary += (parsed.summary ? " " : "") + lines[i];
      }
    }
  }
  flushSection();

  // ── Improvement logic ──

  // Action verbs for experience
  const actionVerbs = [
    "Developed", "Engineered", "Implemented", "Designed", "Led", "Built",
    "Optimized", "Architected", "Deployed", "Automated", "Managed",
    "Streamlined", "Delivered", "Spearheaded", "Collaborated", "Reduced",
    "Increased", "Improved", "Created", "Established", "Launched",
    "Mentored", "Integrated", "Migrated", "Refactored", "Orchestrated",
  ];

  // Improve experience bullets
  function improveBullet(bullet) {
    let improved = bullet.trim();
    if (!improved) return "";
    // Remove leading bullets/dashes
    improved = improved.replace(/^[-•●*]\s*/, "");
    // Capitalize first letter
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    // If doesn't start with action verb, add one
    const startsWithAction = actionVerbs.some((v) => improved.toLowerCase().startsWith(v.toLowerCase()));
    if (!startsWithAction && improved.length > 10) {
      // Try to detect what the bullet is about and prefix
      if (/(?:develop|build|creat|cod|program|writ)/i.test(improved)) improved = "Developed " + improved.charAt(0).toLowerCase() + improved.slice(1);
      else if (/(?:manag|lead|supervis|coordinat)/i.test(improved)) improved = "Led " + improved.charAt(0).toLowerCase() + improved.slice(1);
      else if (/(?:design|architect|plan)/i.test(improved)) improved = "Designed " + improved.charAt(0).toLowerCase() + improved.slice(1);
      else if (/(?:test|debug|fix|resolv)/i.test(improved)) improved = "Resolved " + improved.charAt(0).toLowerCase() + improved.slice(1);
      else if (/(?:deploy|launch|releas|ship)/i.test(improved)) improved = "Deployed " + improved.charAt(0).toLowerCase() + improved.slice(1);
      else if (/(?:improv|optimiz|enhanc|upgrad)/i.test(improved)) improved = "Optimized " + improved.charAt(0).toLowerCase() + improved.slice(1);
    }
    // Add period if missing
    if (!/[.!]$/.test(improved)) improved += ".";
    return improved;
  }

  function improveExperience(expText) {
    const expLines = expText.split("\n").filter(Boolean);
    const improved = [];
    for (const line of expLines) {
      // Keep role/company/date lines as-is
      if (/\d{4}/.test(line) && line.length < 80) {
        improved.push(line);
      } else if (line.length < 50 && (line.includes("|") || /^[A-Z]/.test(line))) {
        improved.push(line);
      } else {
        improved.push("• " + improveBullet(line));
      }
    }
    return improved.join("\n");
  }

  // Improve summary
  function improveSummary(summary) {
    if (!summary || summary.length < 20) {
      return "Results-driven professional with a strong foundation in software development and problem-solving. Adept at building scalable applications and collaborating with cross-functional teams to deliver high-impact solutions. Seeking to leverage technical expertise and analytical skills to drive innovation and business growth.";
    }
    let improved = summary.trim();
    if (improved.length < 100) {
      improved += " Passionate about building scalable solutions and continuously improving processes.";
    }
    // Remove first person
    improved = improved.replace(/\bI am\b/gi, "").replace(/\bI have\b/gi, "Possessing").replace(/\bI\b/g, "").replace(/\bmy\b/gi, "").trim();
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    return improved;
  }

  // JD keyword injection into skills
  let jdKeywords = [];
  if (jobDescription) {
    const techKeywords = jobDescription.match(/\b(?:React|Node\.?js|Python|Java|TypeScript|JavaScript|AWS|Docker|Kubernetes|SQL|NoSQL|MongoDB|PostgreSQL|Redis|GraphQL|REST|API|CI\/CD|Git|Agile|Scrum|Machine Learning|AI|Cloud|Azure|GCP|Linux|HTML|CSS|Webpack|Next\.?js|Express|Spring|Django|Flask|Vue|Angular|Swift|Kotlin|Go|Rust|C\+\+|Terraform|Jenkins|Ansible|Microservices|Serverless|DevOps)\b/gi) || [];
    jdKeywords = [...new Set(jdKeywords.concat(techKeywords.map((k) => k.trim())))];
  }

  // Build improved resume
  const improvedSkills = [...new Set([...parsed.skills, ...jdKeywords])].slice(0, 25);
  const improvedSummary = improveSummary(parsed.summary);
  const improvedExperience = parsed.experience.map(improveExperience);

  // Assemble improved resume text
  const sections = [];

  // Header
  sections.push(`${(parsed.name || "YOUR NAME").toUpperCase()}`);
  if (parsed.contact.length > 0) {
    sections.push(parsed.contact.join(" | "));
  }
  sections.push("");

  // Summary
  sections.push("PROFESSIONAL SUMMARY");
  sections.push("─".repeat(50));
  sections.push(improvedSummary);
  sections.push("");

  // Skills
  if (improvedSkills.length > 0) {
    sections.push("TECHNICAL SKILLS");
    sections.push("─".repeat(50));
    // Group skills in rows of 5
    for (let i = 0; i < improvedSkills.length; i += 5) {
      sections.push(improvedSkills.slice(i, i + 5).join(" • "));
    }
    sections.push("");
  }

  // Experience
  if (improvedExperience.length > 0) {
    sections.push("PROFESSIONAL EXPERIENCE");
    sections.push("─".repeat(50));
    for (const exp of improvedExperience) {
      sections.push(exp);
      sections.push("");
    }
  }

  // Education
  if (parsed.education.length > 0) {
    sections.push("EDUCATION");
    sections.push("─".repeat(50));
    for (const edu of parsed.education) {
      sections.push(edu);
    }
    sections.push("");
  }

  // Projects
  if (parsed.projects.length > 0) {
    sections.push("PROJECTS");
    sections.push("─".repeat(50));
    for (const proj of parsed.projects) {
      sections.push(proj);
    }
    sections.push("");
  }

  // Certifications
  if (parsed.certifications.length > 0) {
    sections.push("CERTIFICATIONS & ACHIEVEMENTS");
    sections.push("─".repeat(50));
    for (const cert of parsed.certifications) {
      sections.push(cert);
    }
    sections.push("");
  }

  // Score the improvement
  const improvementNotes = [];
  if (parsed.summary.length < 20) improvementNotes.push("✅ Added a professional summary section");
  else improvementNotes.push("✅ Enhanced professional summary with stronger language");
  improvementNotes.push("✅ Organized resume into clear, ATS-friendly sections");
  if (jdKeywords.length > 0) improvementNotes.push(`✅ Injected ${jdKeywords.length} keywords from job description into skills`);
  if (parsed.experience.length > 0) improvementNotes.push("✅ Improved experience bullets with action verbs");
  improvementNotes.push("✅ Standardized formatting for ATS compatibility");
  if (parsed.skills.length === 0 && improvedSkills.length > 0) improvementNotes.push("✅ Added technical skills section");

  return {
    improvedText: sections.join("\n"),
    improvementNotes,
    parsedSections: {
      name: parsed.name,
      contact: parsed.contact,
      summaryLength: parsed.summary.length,
      experienceCount: parsed.experience.length,
      educationCount: parsed.education.length,
      skillCount: parsed.skills.length,
      improvedSkillCount: improvedSkills.length,
    },
  };
}

// ── ATS scoring (Gemini-powered) ─────────────────────────────────────────────
async function scoreResumeText(text, jobDescription) {
  try {
    const jdContext = jobDescription
      ? `\n\nTarget Job Description:\n${jobDescription}`
      : "";

    const result = await generateJSON(`You are a senior technical recruiter and ATS (Applicant Tracking System) expert at a Fortune 500 company. You have reviewed 50,000+ resumes and know exactly what makes a resume pass or fail ATS screening.

=== RESUME TO ANALYZE ===
${text}
=== END RESUME ===${jdContext}

STRICT SCORING RUBRIC — Score each category honestly. Do NOT inflate scores. Most resumes score 40-70. Only truly exceptional resumes score 80+.

1. **KEYWORD MATCH (0-100)**:
   ${jobDescription ? "- Compare resume keywords against the job description. Score based on % of JD requirements matched." : "- Evaluate presence of industry-standard technical keywords, tools, and technologies for the candidate's apparent field."}
   - 90-100: Matches 90%+ of key terms perfectly
   - 70-89: Matches most key terms, missing a few
   - 50-69: Matches some terms but significant gaps
   - Below 50: Major keyword gaps, would likely be filtered out

2. **FORMATTING & CONTACT (0-100)**:
   - Has email? (+15) Has phone? (+15) Has LinkedIn? (+10) Has GitHub/portfolio? (+10)
   - Clean section structure with clear headers? (+15)
   - Uses bullet points consistently? (+10)
   - No tables/images/graphics that break ATS? (+10)
   - Appropriate length (1-2 pages / 300-700 words)? (+15)
   
3. **SECTION COMPLETENESS (0-100)**:
   - Professional Summary/Objective present and strong? (+20)
   - Work Experience with dates, titles, companies? (+25)
   - Education with degree, institution, year? (+15)
   - Skills section with organized technical skills? (+20)
   - Projects with tech stack and outcomes? (+10)
   - Certifications/Achievements? (+10)

4. **READABILITY & IMPACT (0-100)**:
   - Bullets start with strong action verbs? (+20)
   - Quantifiable achievements (percentages, numbers, metrics)? (+25)
   - No generic phrases ("responsible for", "worked on")? (+15)
   - Demonstrates impact, not just duties? (+20)
   - Consistent tense (past for previous, present for current)? (+10)
   - Free of spelling/grammar issues? (+10)

OVERALL ATS SCORE: Weighted average → Keywords(30%) + Formatting(20%) + Sections(25%) + Readability(25%)

For SUGGESTIONS, be brutally specific and actionable:
- ✅ = Something done well (quote the actual text from the resume)
- ⚠️ = Something that needs improvement (explain exactly what to fix and give an example)
- ❌ = Critical issue that will likely cause ATS rejection (explain why and how to fix)

Include 3-4 ✅, 3-4 ⚠️, and 1-3 ❌ items minimum. Reference actual content from the resume.

For KEYWORDS:
- foundKeywords: List every relevant technical/professional keyword actually present in the resume
- missingKeywords: ${jobDescription ? "List specific keywords from the JD that are NOT in the resume" : "List important industry keywords the candidate should add based on their apparent role/field"}

Return this exact JSON:
{
  "atsScore": <weighted score 0-100>,
  "breakdown": {
    "keywords": <0-100>,
    "formatting": <0-100>,
    "sections": <0-100>,
    "readability": <0-100>
  },
  "suggestions": ["array of 8-14 specific suggestions with ✅/⚠️/❌ prefixes — each one MUST reference specific content from this resume"],
  "foundKeywords": ["every relevant keyword found"],
  "missingKeywords": ["important missing keywords with brief reason why each matters"],
  "wordCount": <actual word count>,
  "overallVerdict": "1-2 sentence executive summary of the resume's ATS readiness — be direct and honest"
}`, { maxTokens: 4096, temperature: 0.2 });

    return {
      atsScore: Math.min(100, Math.max(0, result.atsScore || 0)),
      breakdown: {
        keywords: result.breakdown?.keywords || 0,
        formatting: result.breakdown?.formatting || 0,
        sections: result.breakdown?.sections || 0,
        readability: result.breakdown?.readability || 0,
      },
      suggestions: result.suggestions || [],
      foundKeywords: (result.foundKeywords || []).slice(0, 30),
      missingKeywords: (result.missingKeywords || []).slice(0, 20),
      wordCount: result.wordCount || text.split(/\s+/).filter(Boolean).length,
      overallVerdict: result.overallVerdict || "",
    };
  } catch (err) {
    console.error("[Resume AI] Gemini scoring failed, using fallback:", err.message);
    return scoreResumeTextFallback(text, jobDescription);
  }
}

// Fallback rule-based scorer (used when AI is unavailable)
function scoreResumeTextFallback(text, jobDescription) {
  const lines = text.split("\n").filter((l) => l.trim());
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const suggestions = [];
  const foundKeywords = [];
  const missingKeywords = [];

  // 1. Sections detection (25%)
  const sectionPatterns = {
    summary: /\b(summary|profile|objective|about)\b/i,
    experience: /\b(experience|employment|work\s*history)\b/i,
    education: /\b(education|academic|qualification)\b/i,
    skills: /\b(skills|technologies|tools|competencies)\b/i,
    projects: /\b(projects)\b/i,
    contact: /[\w.-]+@[\w.-]+\.\w+/,
  };
  let sectionsFound = 0;
  for (const [name, pattern] of Object.entries(sectionPatterns)) {
    if (pattern.test(text)) sectionsFound++;
    else suggestions.push(`⚠️ Missing "${name}" section — most ATS systems expect this.`);
  }
  const sectionsScore = Math.round((sectionsFound / 6) * 100);

  // 2. Formatting (25%)
  let formatScore = 0;
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /(\+?\d[\d\s\-()]{7,})/.test(text);
  const hasLinkedIn = /linkedin/i.test(text);
  const hasBullets = /[•\-●]/.test(text);
  const hasQuantifiables = /\d+%|\$\d+|[\d,]+\s*(users|customers|revenue|increase|decrease)/i.test(text);

  if (hasEmail) formatScore += 20; else suggestions.push("❌ Add your email address for recruiter contact.");
  if (hasPhone) formatScore += 20; else suggestions.push("❌ Add a phone number.");
  if (hasLinkedIn) formatScore += 20; else suggestions.push("⚠️ Add your LinkedIn profile URL.");
  if (hasBullets) formatScore += 20; else suggestions.push("⚠️ Use bullet points for experience — ATS systems parse them better.");
  if (hasQuantifiables) formatScore += 20; else suggestions.push("⚠️ Add quantifiable achievements (e.g., 'Improved load time by 40%').");

  // 3. Keywords (25%)
  let keywordScore = 50;
  if (jobDescription) {
    const jdWords = [...new Set(jobDescription.toLowerCase().split(/\W+/).filter((w) => w.length > 3))];
    const resumeLower = text.toLowerCase();

    // Also check for tech keywords specifically
    const techTerms = (jobDescription.match(/\b(?:React|Node\.?js|Python|Java|TypeScript|JavaScript|AWS|Docker|Kubernetes|SQL|NoSQL|MongoDB|PostgreSQL|Redis|GraphQL|REST|API|CI\/CD|Git|Agile|Scrum|Machine\s*Learning|AI|Cloud|Azure|GCP|Linux|HTML|CSS|Webpack|Next\.?js|Express|Spring|Django|Flask|Vue|Angular|Go|Rust|C\+\+|DevOps)\b/gi) || []);
    const allJDTerms = [...new Set([...jdWords, ...techTerms.map((t) => t.toLowerCase())])];

    for (const word of allJDTerms) {
      if (resumeLower.includes(word)) foundKeywords.push(word);
      else missingKeywords.push(word);
    }

    keywordScore = allJDTerms.length > 0
      ? Math.round((foundKeywords.length / allJDTerms.length) * 100)
      : 50;

    if (missingKeywords.length > 0 && missingKeywords.length <= 15) {
      suggestions.push(`⚠️ Consider adding these keywords: ${missingKeywords.slice(0, 12).join(", ")}`);
    } else if (missingKeywords.length > 15) {
      suggestions.push(`⚠️ ${missingKeywords.length} JD keywords missing — consider tailoring your resume more closely.`);
    }
    if (foundKeywords.length > 5) {
      suggestions.push(`✅ Good keyword coverage — ${foundKeywords.length} JD keywords found.`);
    }
  } else {
    suggestions.push("⚠️ Paste a job description for targeted keyword matching.");
  }

  // 4. Readability (25%)
  let readabilityScore = 0;
  if (wordCount > 150) readabilityScore += 25; else suggestions.push("⚠️ Resume is too short. Aim for 300-700 words.");
  if (wordCount > 300) readabilityScore += 25;
  if (wordCount <= 800) readabilityScore += 15; else suggestions.push("⚠️ Resume may be too long (800+ words). Keep it concise.");
  if (lines.length > 15) readabilityScore += 15;
  if (/\b(developed|managed|led|built|designed|implemented|improved|created)\b/i.test(text)) readabilityScore += 20;
  else suggestions.push("⚠️ Use strong action verbs (Developed, Led, Built, Improved).");
  readabilityScore = Math.min(readabilityScore, 100);

  const atsScore = Math.round(
    sectionsScore * 0.25 + formatScore * 0.25 + keywordScore * 0.25 + readabilityScore * 0.25
  );

  // Generate a dynamic verdict based on the actual score
  let overallVerdict = "";
  if (atsScore >= 80) {
    overallVerdict = `Strong resume with an ATS score of ${atsScore}/100. Good keyword coverage and formatting. Focus on adding more quantifiable achievements to push into the top tier.`;
  } else if (atsScore >= 60) {
    overallVerdict = `Decent resume (${atsScore}/100) but needs improvement. Key areas to address: ${suggestions.filter(s => s.startsWith("⚠️") || s.startsWith("❌")).slice(0, 2).map(s => s.replace(/^[⚠️❌]\s*/, "")).join("; ")}. Consider using our Resume Builder to optimize.`;
  } else if (atsScore >= 40) {
    overallVerdict = `Below average ATS score (${atsScore}/100). This resume is likely to be filtered out by most ATS systems. Critical issues: missing sections, weak keyword coverage, and lack of quantifiable impact. Significant rewriting recommended.`;
  } else {
    overallVerdict = `Very low ATS score (${atsScore}/100). This resume needs a complete overhaul — missing essential sections, no keywords matched, and formatting issues. Use our Resume Builder to create an ATS-optimized version from scratch.`;
  }

  return {
    atsScore,
    breakdown: {
      keywords: keywordScore,
      formatting: formatScore,
      sections: sectionsScore,
      readability: readabilityScore,
    },
    suggestions,
    foundKeywords: foundKeywords.slice(0, 30),
    missingKeywords: missingKeywords.slice(0, 20),
    wordCount,
    overallVerdict,
  };
}

// ──────────────────────────────────────
// GET /api/resumes — List user's resumes
// ──────────────────────────────────────
exports.getResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id })
    .select("title template atsScore personalInfo.fullName updatedAt createdAt")
    .sort("-updatedAt");

  res.json({ success: true, data: { resumes, count: resumes.length } });
});

// ──────────────────────────────────────
// POST /api/resumes — Create new resume
// ──────────────────────────────────────
exports.createResume = asyncHandler(async (req, res) => {
  const { title, template } = req.body;

  const user = await User.findById(req.user._id);
  const resume = await Resume.create({
    user: req.user._id,
    title: title || "Untitled Resume",
    template: template || "modern",
    personalInfo: {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      location: user.location || "",
      website: user.socialLinks?.website || "",
      linkedin: user.socialLinks?.linkedin || "",
      github: user.socialLinks?.github || "",
    },
  });

  // Track activity
  await Activity.create({
    user: req.user._id,
    action: `Created resume: ${resume.title}`,
    type: "resume",
    xpEarned: 15,
  });
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalXP: 15, "stats.resumesCreated": 1, activeScore: 5 },
  });

  res.status(201).json({ success: true, data: { resume } });
});

// ──────────────────────────────────────
// GET /api/resumes/:id — Get single resume
// ──────────────────────────────────────
exports.getResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) throw new AppError("Resume not found", 404);

  res.json({ success: true, data: { resume } });
});

// ──────────────────────────────────────
// PUT /api/resumes/:id — Update resume
// ──────────────────────────────────────
exports.updateResume = asyncHandler(async (req, res) => {
  const allowed = [
    "title", "template", "personalInfo", "experience", "education",
    "skills", "projects", "certifications", "isPublic",
  ];

  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });
  updates.lastEdited = new Date();

  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );
  if (!resume) throw new AppError("Resume not found", 404);

  // Log activity
  await Activity.create({
    user: req.user._id,
    action: `Updated resume: ${resume.title}`,
    type: "resume",
    xpEarned: 5,
  });
  await User.findByIdAndUpdate(req.user._id, { $inc: { totalXP: 5, activeScore: 2 } });

  res.json({ success: true, message: "Resume updated.", data: { resume } });
});

// ──────────────────────────────────────
// DELETE /api/resumes/:id — Delete resume
// ──────────────────────────────────────
exports.deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!resume) throw new AppError("Resume not found", 404);

  res.json({ success: true, message: "Resume deleted." });
});

// ──────────────────────────────────────
// POST /api/resumes/:id/analyze — ATS Analysis
// ──────────────────────────────────────
exports.analyzeResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) throw new AppError("Resume not found", 404);

  const { jobDescription } = req.body;

  // Rule-based ATS scoring
  let keywordScore = 0;
  let formattingScore = 0;
  let sectionsScore = 0;
  let readabilityScore = 0;
  const suggestions = [];
  const foundKeywords = [];
  const missingKeywords = [];

  // 1. Sections completeness (25%)
  const sections = {
    personalInfo: !!(resume.personalInfo?.fullName && resume.personalInfo?.email),
    summary: !!resume.personalInfo?.summary,
    experience: resume.experience?.length > 0,
    education: resume.education?.length > 0,
    skills: resume.skills?.length > 0,
    projects: resume.projects?.length > 0,
  };
  const filledSections = Object.values(sections).filter(Boolean).length;
  sectionsScore = Math.round((filledSections / 6) * 100);

  if (!sections.summary) suggestions.push("Add a professional summary to your resume.");
  if (!sections.experience) suggestions.push("Add work experience to strengthen your resume.");
  if (!sections.skills) suggestions.push("Add a skills section with relevant technologies.");
  if (!sections.projects) suggestions.push("Add projects to showcase your practical experience.");

  // 2. Formatting (25%)
  let formatChecks = 0;
  const totalFormatChecks = 5;
  if (resume.personalInfo?.fullName) formatChecks++;
  if (resume.personalInfo?.email) formatChecks++;
  if (resume.personalInfo?.phone) formatChecks++;
  if (resume.experience?.some((e) => e.highlights?.length > 0)) formatChecks++;
  if (resume.education?.some((e) => e.degree)) formatChecks++;
  formattingScore = Math.round((formatChecks / totalFormatChecks) * 100);

  if (!resume.personalInfo?.phone) suggestions.push("Add a phone number for recruiter contact.");
  if (resume.experience?.length > 0 && !resume.experience.some((e) => e.highlights?.length > 0)) {
    suggestions.push("Add bullet points (highlights) to your experience entries.");
  }

  // 3. Keyword matching (25%) — if job description provided
  if (jobDescription) {
    const jdWords = jobDescription.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const uniqueJDWords = [...new Set(jdWords)];
    const resumeText = JSON.stringify(resume).toLowerCase();

    uniqueJDWords.forEach((word) => {
      if (resumeText.includes(word)) {
        foundKeywords.push(word);
      } else {
        missingKeywords.push(word);
      }
    });

    keywordScore = uniqueJDWords.length > 0
      ? Math.round((foundKeywords.length / uniqueJDWords.length) * 100)
      : 50;

    if (missingKeywords.length > 0) {
      suggestions.push(
        `Consider adding these keywords: ${missingKeywords.slice(0, 10).join(", ")}`
      );
    }
  } else {
    keywordScore = 50; // neutral if no JD provided
    suggestions.push("Paste a job description for targeted keyword analysis.");
  }

  // 4. Readability (25%)
  const expDescriptions = (resume.experience || []).map((e) => e.description || "").join(" ");
  const wordCount = expDescriptions.split(/\s+/).filter(Boolean).length;
  if (wordCount > 50) readabilityScore += 30;
  if (wordCount > 100) readabilityScore += 20;
  if (resume.personalInfo?.summary?.length > 50) readabilityScore += 25;
  if (resume.skills?.length > 0) readabilityScore += 25;
  readabilityScore = Math.min(readabilityScore, 100);

  if (wordCount < 50) suggestions.push("Add more detail to your experience descriptions.");

  // Overall ATS score
  const atsScore = Math.round(
    keywordScore * 0.25 + formattingScore * 0.25 + sectionsScore * 0.25 + readabilityScore * 0.25
  );

  // Save analysis
  resume.atsScore = atsScore;
  resume.atsAnalysis = {
    keywordMatch: keywordScore,
    formatting: formattingScore,
    sections: sectionsScore,
    readability: readabilityScore,
    suggestions,
    keywords: { found: foundKeywords.slice(0, 30), missing: missingKeywords.slice(0, 20) },
  };
  await resume.save();

  // Activity
  await Activity.create({
    user: req.user._id,
    action: `ATS analysis: ${atsScore}% score`,
    type: "resume",
    xpEarned: 10,
  });
  await User.findByIdAndUpdate(req.user._id, { $inc: { totalXP: 10, activeScore: 5 } });

  res.json({
    success: true,
    data: {
      atsScore,
      analysis: resume.atsAnalysis,
    },
  });
});

// ──────────────────────────────────────
// POST /api/resumes/upload-analyze — Upload PDF and get ATS + improved resume
// ──────────────────────────────────────
exports.uploadAndAnalyze = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("Please upload a PDF or TXT file", 400);

  const filePath = req.file.path;
  let originalText;
  try {
    originalText = await extractTextFromFile(filePath);
  } catch (err) {
    // Clean up file
    fs.unlink(filePath, () => {});
    throw new AppError("Failed to extract text from file. Make sure it's a valid PDF.", 400);
  }

  if (!originalText || originalText.trim().length < 30) {
    fs.unlink(filePath, () => {});
    throw new AppError("Could not extract meaningful text. The PDF may be image-based — please use a text-based PDF.", 400);
  }

  const jobDescription = req.body.jobDescription || "";

  // Run ATS scoring (AI-powered)
  const atsResult = await scoreResumeText(originalText, jobDescription);

  // Generate improved resume (AI-powered)
  const improved = await improveResume(originalText, jobDescription);

  // Clean up uploaded file
  fs.unlink(filePath, () => {});

  // Activity + XP
  await Activity.create({
    user: req.user._id,
    action: `Resume upload analysis: ${atsResult.atsScore}% ATS score`,
    type: "resume",
    xpEarned: 15,
  });
  await User.findByIdAndUpdate(req.user._id, { $inc: { totalXP: 15, activeScore: 5 } });

  res.json({
    success: true,
    data: {
      originalText,
      atsScore: atsResult.atsScore,
      breakdown: atsResult.breakdown,
      suggestions: atsResult.suggestions,
      foundKeywords: atsResult.foundKeywords,
      missingKeywords: atsResult.missingKeywords,
      wordCount: atsResult.wordCount,
      overallVerdict: atsResult.overallVerdict,
      improvedResume: improved.improvedText,
      improvementNotes: improved.improvementNotes,
      parsedSections: improved.parsedSections,
    },
  });
});

