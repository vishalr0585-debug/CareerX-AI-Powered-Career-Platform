# CareerX — Configuration Reference

## Architecture

| Layer    | Tech                                                | Port  |
| -------- | --------------------------------------------------- | ----- |
| Frontend | Next.js 16.1.6 (Turbopack), Tailwind v4, TypeScript | 3000  |
| Backend  | Node.js + Express 4.21.2                            | 5000  |
| Database | MongoDB Atlas (cluster0.gwmnsjq)                    | 27017 |

---

## Server — `d:\CareerX\server\.env`

```env
# ── Runtime ──────────────────────────────
PORT=5000
NODE_ENV=development          # set to production for deploy

# ── Database ─────────────────────────────
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.gwmnsjq.mongodb.net/careerx?retryWrites=true&w=majority&appName=Cluster0

# ── JWT Auth ──────────────────────────────
JWT_SECRET=careerx_jwt_secret_change_in_production_2026
JWT_REFRESH_SECRET=careerx_refresh_secret_change_in_production_2026
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── CORS ─────────────────────────────────
CLIENT_URL=http://localhost:3000       # set to https://yourdomain.com in prod

# ── OAuth (Google & GitHub login) ─────────
GOOGLE_CLIENT_ID=              # From Google Cloud Console → OAuth 2.0
GOOGLE_CLIENT_SECRET=          # From Google Cloud Console → OAuth 2.0
GITHUB_CLIENT_ID=              # From GitHub → Settings → Developer → OAuth Apps
GITHUB_CLIENT_SECRET=          # From GitHub → Settings → Developer → OAuth Apps
```

## Client — `d:\CareerX\client\.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=  # Same as GOOGLE_CLIENT_ID above
NEXT_PUBLIC_GITHUB_CLIENT_ID=  # Same as GITHUB_CLIENT_ID above
```

---

## Auth Flow

| Token         | Storage          | Expiry |
| ------------- | ---------------- | ------ |
| Access token  | localStorage     | 15 min |
| Refresh token | HTTP-only cookie | 7 days |

**Test accounts**

| Email            | Password    |
| ---------------- | ----------- |
| test@careerx.dev | Test1234    |
| demo@careerx.dev | NewPass1234 |

---

## AI Engines (no API key required)

| Feature           | Engine                                                                             |
| ----------------- | ---------------------------------------------------------------------------------- |
| AI Chat           | Built-in rule-based (5 topics: resume / interview / dsa / career / general)        |
| Project Generator | Template engine (web / api / ml / cli categories, keyword-detected from prompt)    |
| ATS Analyzer      | Rule-based scoring: keywords 25% + formatting 25% + sections 25% + readability 25% |
| Code Execution    | In-process JS/Python simulation                                                    |

---

## Seeding the Database

All collections can be seeded in one request after logging in:

```bash
POST http://localhost:5000/api/seed/all
Authorization: Bearer <access_token>
```

Or seed individually:

```bash
POST /api/compiler/seed/init   # 30 coding problems
POST /api/exams/seed/init      # MCQ question bank
POST /api/jobs/seed/init       # 100 sample jobs
```

---

## API Overview (58+ endpoints)

| Module     | Base Route      |
| ---------- | --------------- |
| Auth       | /api/auth       |
| Users      | /api/users      |
| Dashboard  | /api/dashboard  |
| Resumes    | /api/resumes    |
| Jobs       | /api/jobs       |
| Interviews | /api/interviews |
| Exams      | /api/exams      |
| Compiler   | /api/compiler   |
| AI Chat    | /api/chat       |
| Projects   | /api/projects   |
| Seed       | /api/seed       |

---

## Start Commands

```powershell
# Terminal 1 — Backend
cd d:\CareerX\server
npm run dev        # nodemon on port 5000

# Terminal 2 — Frontend
cd d:\CareerX\client
npm run dev        # Next.js Turbopack on port 3000
```

## Production Build

```powershell
cd d:\CareerX\client
npm run build      # outputs .next/  (23 routes, 0 TS errors)
```

---

## Pages & API Wiring Status

| Page                      | API Wired | Notes                                              |
| ------------------------- | --------- | -------------------------------------------------- |
| /dashboard                | ✅        | Real stats from /api/dashboard/stats               |
| /dashboard/resume-builder | ✅        | CRUD via /api/resumes                              |
| /dashboard/jobs           | ✅        | Search + apply via /api/jobs                       |
| /dashboard/interview-lab  | ✅        | Sessions via /api/interviews                       |
| /dashboard/exam-mcq       | ✅        | Start/submit via /api/exams                        |
| /dashboard/compiler       | ✅        | Run/submit via /api/compiler                       |
| /dashboard/ai-chat        | ✅        | Sessions + messages via /api/chat                  |
| /dashboard/ai-project-lab | ✅        | Generate via /api/projects/generate                |
| /dashboard/leaderboard    | ✅        | Rankings via /api/dashboard/leaderboard            |
| /dashboard/ats-analyzer   | ✅        | Resume pick + analyze via /api/resumes/:id/analyze |
| /dashboard/coding-profile | ✅        | Live stats via /api/compiler/stats                 |
