import api from "@/lib/api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  avatar: string;
  jobTitle: string;
  location: string;
  bio: string;
  phone: string;
  socialLinks: {
    github: string;
    linkedin: string;
    website: string;
    twitter: string;
  };
  skills: string[];
  provider: "local" | "google" | "github";
  membershipTier: "free" | "pro" | "enterprise";
  totalXP: number;
  activeScore: number;
  globalRank: number;
  loginStreak: number;
  longestStreak: number;
  profileCompletion: number;
  problemsSolved: number;
  interviewsCompleted: number;
  resumesCreated: number;
  jobsApplied: number;
  role: "job_seeker" | "higher_studies";
  profileResume?: {
    fileName: string;
    filePath: string;
    uploadedAt: string | null;
  };
  initials: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
  };
}

// ── Auth ──

export const authService = {
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const { data } = await api.post("/auth/signup", payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post("/auth/login", payload);
    return data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
    localStorage.removeItem("accessToken");
  },

  async getMe(): Promise<{ success: boolean; data: { user: User } }> {
    const { data } = await api.get("/auth/me");
    return data;
  },

  async forgotPassword(email: string) {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  },

  async resetPassword(token: string, password: string, confirmPassword: string) {
    const { data } = await api.post(`/auth/reset-password/${token}`, {
      password,
      confirmPassword,
    });
    if (data.data?.accessToken) {
      localStorage.setItem("accessToken", data.data.accessToken);
    }
    return data;
  },

  async googleLogin(code: string): Promise<AuthResponse> {
    const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
    const { data } = await api.post("/auth/google", { code, redirectUri });
    return data;
  },

  async githubLogin(code: string): Promise<AuthResponse> {
    const { data } = await api.post("/auth/github", { code });
    return data;
  },
};

// ── User / Profile ──

export const userService = {
  async getProfile() {
    const { data } = await api.get("/users/profile");
    return data;
  },

  async updateProfile(updates: Partial<User>) {
    const { data } = await api.put("/users/profile", updates);
    return data;
  },

  async updateRole(role: "job_seeker" | "higher_studies") {
    const { data } = await api.patch("/users/role", { role });
    return data;
  },

  async getStats() {
    const { data } = await api.get("/users/stats");
    return data;
  },

  async getRecentActivity(page = 1, limit = 10) {
    const { data } = await api.get(`/users/activity/recent?page=${page}&limit=${limit}`);
    return data;
  },

  async getActivityHeatmap() {
    const { data } = await api.get("/users/activity/heatmap");
    return data;
  },

  async getXPHistory(months = 6) {
    const { data } = await api.get(`/users/xp-history?months=${months}`);
    return data;
  },

  async getSkillDistribution() {
    const { data } = await api.get("/users/skill-distribution");
    return data;
  },

  async getAchievements() {
    const { data } = await api.get("/users/achievements");
    return data;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await api.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async uploadProfileResume(file: File) {
    const formData = new FormData();
    formData.append("resume", file);
    const { data } = await api.post("/users/profile-resume", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async deleteProfileResume() {
    const { data } = await api.delete("/users/profile-resume");
    return data;
  },

  async getAIJobSuggestions() {
    const { data } = await api.get("/users/ai-job-suggestions");
    return data;
  },
};

// ── Dashboard ──

export const dashboardService = {
  async getSummary() {
    const { data } = await api.get("/dashboard/summary");
    return data;
  },

  async getLeaderboard(page = 1, limit = 20, period = "overall") {
    const { data } = await api.get(
      `/dashboard/leaderboard?page=${page}&limit=${limit}&period=${period}`
    );
    return data;
  },
};

// ── Resumes ──

export const resumeService = {
  async getAll() {
    const { data } = await api.get("/resumes");
    return data;
  },

  async create(resume: Record<string, unknown>) {
    const { data } = await api.post("/resumes", resume);
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/resumes/${id}`);
    return data;
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data } = await api.put(`/resumes/${id}`, updates);
    return data;
  },

  async remove(id: string) {
    const { data } = await api.delete(`/resumes/${id}`);
    return data;
  },

  async analyze(id: string, body?: { jobDescription?: string }) {
    const { data } = await api.post(`/resumes/${id}/analyze`, body ?? {});
    return data;
  },

  async uploadAndAnalyze(file: File, jobDescription?: string) {
    const formData = new FormData();
    formData.append("resume", file);
    if (jobDescription) formData.append("jobDescription", jobDescription);
    const { data } = await api.post("/resumes/upload-analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};

// ── Jobs ──

export const jobService = {
  async searchExternal(q: string) {
    const { data } = await api.get(`/jobs/search-external?q=${encodeURIComponent(q)}`);
    return data;
  },

  async getAll(params?: { search?: string; category?: string; type?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    if (params?.type) query.set("type", params.type);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const { data } = await api.get(`/jobs?${query.toString()}`);
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/jobs/${id}`);
    return data;
  },

  async apply(id: string) {
    const { data } = await api.post(`/jobs/${id}/apply`);
    return data;
  },

  async getApplications() {
    const { data } = await api.get("/jobs/user/applications");
    return data;
  },

  async seed() {
    const { data } = await api.post("/jobs/seed/init");
    return data;
  },
};

// ── Interviews ──

export const interviewService = {
  async start(params: { type: string; difficulty?: string; questionCount?: number; role?: string; company?: string }) {
    const { data } = await api.post("/interviews/start", params);
    return data;
  },

  async answer(sessionId: string, body: { questionIndex: number; answer: string; timeSpent?: number }) {
    const { data } = await api.post(`/interviews/${sessionId}/answer`, body);
    return data;
  },

  async complete(sessionId: string) {
    const { data } = await api.post(`/interviews/${sessionId}/complete`);
    return data;
  },

  async getHistory() {
    const { data } = await api.get("/interviews/history");
    return data;
  },

  async getSession(sessionId: string) {
    const { data } = await api.get(`/interviews/${sessionId}`);
    return data;
  },
};

// ── Exams ──

export const examService = {
  async getSubjects() {
    const { data } = await api.get("/exams/subjects");
    return data;
  },

  async start(body: { subject: string; questionCount?: number }) {
    const { data } = await api.post("/exams/start", body);
    return data;
  },

  async submit(attemptId: string, answers: Record<string, number>) {
    const { data } = await api.post(`/exams/${attemptId}/submit`, { answers });
    return data;
  },

  async getHistory() {
    const { data } = await api.get("/exams/history");
    return data;
  },

  async seed() {
    const { data } = await api.post("/exams/seed/init");
    return data;
  },
};

// ── Search ──

export const searchService = {
  async search(q: string, type: "all" | "problems" | "jobs" = "all") {
    const { data } = await api.get(`/search?q=${encodeURIComponent(q)}&type=${type}`);
    return data;
  },
};

// ── Compiler ──

export const compilerService = {
  async getProblems() {
    const { data } = await api.get("/compiler/problems");
    return data;
  },

  async getProblem(slug: string) {
    const { data } = await api.get(`/compiler/problems/${slug}`);
    return data;
  },

  async runCode(body: { language: string; code: string; input?: string; problemSlug?: string }) {
    const { data } = await api.post("/compiler/run", body);
    return data;
  },

  async submitCode(body: { language: string; code: string; problemSlug: string }) {
    const { data } = await api.post("/compiler/submit", body);
    return data;
  },

  async getSubmissions() {
    const { data } = await api.get("/compiler/submissions");
    return data;
  },

  async getStats() {
    const { data } = await api.get("/compiler/stats");
    return data;
  },

  async seed() {
    const { data } = await api.post("/compiler/seed/init");
    return data;
  },
};

// ── Chat ──

export const chatService = {
  async getSessions() {
    const { data } = await api.get("/chat/sessions");
    return data;
  },

  async createSession(body: { topic?: string; title?: string }) {
    const { data } = await api.post("/chat/sessions", body);
    return data;
  },

  async getMessages(sessionId: string) {
    const { data } = await api.get(`/chat/sessions/${sessionId}`);
    return data;
  },

  async sendMessage(sessionId: string, body: { content: string }) {
    const { data } = await api.post(`/chat/sessions/${sessionId}/messages`, body);
    return data;
  },

  async deleteSession(sessionId: string) {
    const { data } = await api.delete(`/chat/sessions/${sessionId}`);
    return data;
  },
};

// ── Projects ──

export const projectService = {
  async searchGitHub(q: string, opts?: { sort?: string; page?: number; per_page?: number }) {
    const query = new URLSearchParams({ q });
    if (opts?.sort) query.set("sort", opts.sort);
    if (opts?.page) query.set("page", String(opts.page));
    if (opts?.per_page) query.set("per_page", String(opts.per_page));
    const { data } = await api.get(`/projects/github-search?${query.toString()}`);
    return data;
  },

  async getTemplates() {
    const { data } = await api.get("/projects/templates");
    return data;
  },

  async generate(body: { prompt: string; template?: string }) {
    const { data } = await api.post("/projects/generate", body);
    return data;
  },

  async getAll() {
    const { data } = await api.get("/projects");
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data } = await api.put(`/projects/${id}`, updates);
    return data;
  },

  async remove(id: string) {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  },

  async toggleStep(id: string, stepIndex: number) {
    const { data } = await api.put(`/projects/${id}/steps/${stepIndex}`);
    return data;
  },
};

export const roadmapService = {
  async generate(goal: string) {
    const { data } = await api.post("/roadmap/generate", { goal });
    return data;
  },
};

export const codingProfileService = {
  async getLeetCode(username: string) {
    const { data } = await api.get(`/coding-profile/leetcode/${username}`);
    return data;
  },
  async getGitHub(username: string) {
    const { data } = await api.get(`/coding-profile/github/${username}`);
    return data;
  },
  async getGeeksForGeeks(username: string) {
    const { data } = await api.get(`/coding-profile/gfg/${username}`);
    return data;
  },
  async getCodeChef(username: string) {
    const { data } = await api.get(`/coding-profile/codechef/${username}`);
    return data;
  },
  async getHackerRank(username: string) {
    const { data } = await api.get(`/coding-profile/hackerrank/${username}`);
    return data;
  },
};

// ── Higher Education ──

export const higherEdService = {
  async getUniversityRecommendations(body: {
    exam: string;
    score?: string;
    country?: string;
    budget?: string;
    fieldOfStudy: string;
    degreeLevel?: string;
  }) {
    const { data } = await api.post("/higher-ed/university-recommend", body);
    return data;
  },

  async getScholarshipRecommendations(body: {
    exam?: string;
    nationality?: string;
    fieldOfStudy: string;
    degreeLevel?: string;
    financialNeed?: string;
    meritLevel?: string;
  }) {
    const { data } = await api.post("/higher-ed/scholarship-recommend", body);
    return data;
  },

  async generateSOP(body: {
    university: string;
    program: string;
    degreeLevel?: string;
    fieldOfStudy: string;
    academicBackground?: string;
    workExperience?: string;
    achievements?: string;
    whyThisField?: string;
    whyThisUniversity?: string;
    careerGoals?: string;
    wordLimit?: number;
  }) {
    const { data } = await api.post("/higher-ed/generate-sop", body);
    return data;
  },
};
