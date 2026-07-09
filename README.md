# CareerX

AI-powered career development platform — resume building, interview prep, coding practice, exam preparation, and job discovery in one dashboard.

## Tech Stack

| Layer    | Tech                                                             |
| -------- | ---------------------------------------------------------------- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind v4, Zustand, Recharts |
| Backend  | Node.js, Express 4, Mongoose 9, MongoDB Atlas                    |
| Auth     | JWT (access 15 min + refresh 7 day), httpOnly cookies            |
| Email    | Nodemailer (Ethereal in dev, SMTP in prod)                       |

## Quick Start

```bash
# 1 — Clone & install everything
git clone <repo-url> CareerX && cd CareerX
npm run install:all

# 2 — Configure environment
cp server/.env.example server/.env      # edit with your MongoDB URI + secrets
cp client/.env.local.example client/.env.local

# 3 — Seed the database (once server is running)
# POST http://localhost:5000/api/seed/all

# 4 — Run both client & server
npm run dev
```

The client runs on **http://localhost:3000** and the API on **http://localhost:5000**.

## Project Structure

```
CareerX/
├── client/                 # Next.js frontend
│   └── src/
│       ├── app/            # 24 routes (landing, auth, 15 dashboard pages)
│       ├── components/     # Radix UI + custom components
│       ├── lib/            # API client, services, utils
│       └── stores/         # Zustand auth store
├── server/                 # Express backend
│   └── src/
│       ├── controllers/    # 11 controllers
│       ├── models/         # 9 Mongoose models
│       ├── routes/         # 12 route files (58+ endpoints)
│       ├── middleware/      # Auth, validators, error handler
│       └── utils/          # Email service
└── package.json            # Root monorepo (concurrently)
```

## Features

- **Resume Builder** — Full CRUD with multiple sections
- **ATS Analyzer** — Rule-based resume scoring engine
- **Jobs Board** — Search, filter, paginate, one-click apply
- **Interview Lab** — AI-generated questions with feedback
- **Online Compiler** — Multi-language code editor & runner
- **AI Project Lab** — Generate project ideas from prompts
- **AI Chat Assistant** — Career guidance chatbot
- **Exam Preparation** — GATE/CAT/GRE roadmaps + MCQ practice
- **Coding Profile** — Track submissions, languages, difficulty stats
- **Leaderboard** — XP-based ranking system
- **Smart Search** — Cross-module search (problems + jobs)

## Scripts

| Command               | Description                |
| --------------------- | -------------------------- |
| `npm run dev`         | Start both client & server |
| `npm run dev:client`  | Start frontend only        |
| `npm run dev:server`  | Start backend only         |
| `npm run build`       | Production build (client)  |
| `npm run install:all` | Install all dependencies   |

## Environment Variables

See [`server/.env.example`](server/.env.example) and [`client/.env.local.example`](client/.env.local.example) for all required variables.

## License

MIT
