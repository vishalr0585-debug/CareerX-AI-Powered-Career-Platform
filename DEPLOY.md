# CareerX — Deployment Guide

## Architecture Overview

| Component | Platform     | Free Tier |
|-----------|-------------|-----------|
| Frontend  | **Vercel**  | Yes       |
| Backend   | **Render**  | Yes       |
| Database  | **MongoDB Atlas** | Yes (512 MB) |

---

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/CareerX.git
git push -u origin main
```

---

## Step 2: Deploy Backend on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name:** `careerx-api`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
4. Add **Environment Variables** in Render dashboard:

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (Render default) |
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | A strong random string (64+ chars) |
   | `JWT_REFRESH_SECRET` | A different strong random string |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | `https://your-app.vercel.app` (set after Vercel deploy) |
   | `GEMINI_API_KEY` | *(optional)* Your Google Gemini key |
   | `GROQ_API_KEY` | *(optional)* Your Groq API key |

5. Click **Deploy** → wait for the build to finish
6. Note your Render URL (e.g. `https://careerx-api.onrender.com`)

> **Important:** After deploying the frontend on Vercel, come back and set `CLIENT_URL` to your Vercel URL.

### MongoDB Atlas — Allow Render IPs

1. Go to MongoDB Atlas → **Network Access**
2. Add IP `0.0.0.0/0` (allow from anywhere) or add Render's static IPs
3. Make sure your database user has read/write permissions

---

## Step 3: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `client`
4. Add **Environment Variables**:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://careerx-api.onrender.com/api` |

5. Click **Deploy**

---

## Step 4: Update Cross-References

After both are deployed:

1. **Render dashboard** → Set `CLIENT_URL` = `https://your-app.vercel.app`
2. **Vercel dashboard** → Confirm `NEXT_PUBLIC_API_URL` = `https://careerx-api.onrender.com/api`

---

## Step 5: Seed the Database

Once both services are running:

```bash
# Login first
curl -X POST https://careerx-api.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Admin","email":"admin@careerx.dev","password":"Admin1234"}'

# Use the returned token to seed
curl -X POST https://careerx-api.onrender.com/api/seed/all \
  -H "Authorization: Bearer <your-access-token>"
```

---

## Generate Secure JWT Secrets

```bash
# Run in terminal to generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this twice — once for `JWT_SECRET` and once for `JWT_REFRESH_SECRET`.

---

## File Uploads in Production

The current setup stores uploads on local disk (`server/uploads/`). On Render's free tier, the disk is **ephemeral** — files are lost on redeploy.

**Options:**
- **Render Persistent Disk** (paid plan) — attach a persistent disk to `/opt/render/project/src/uploads`
- **Cloudinary** (free tier: 25GB) — store images/files in the cloud
- **AWS S3** — scalable cloud storage

For MVP/demo, the ephemeral disk works fine. Upgrade when needed.

---

## Custom Domain (Optional)

### Vercel (Frontend)
1. Vercel dashboard → **Settings** → **Domains**
2. Add your domain → update DNS records as shown

### Render (Backend)
1. Render dashboard → **Settings** → **Custom Domains**
2. Add `api.yourdomain.com` → update DNS CNAME

After adding custom domains, update:
- `CLIENT_URL` on Render → `https://yourdomain.com`
- `NEXT_PUBLIC_API_URL` on Vercel → `https://api.yourdomain.com/api`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Ensure `CLIENT_URL` exactly matches your Vercel URL (no trailing slash) |
| Cookies not working | Both services must use HTTPS; `sameSite: "none"` is set automatically in production |
| MongoDB connection fails | Check Atlas Network Access allows `0.0.0.0/0` |
| Render spins down (free tier) | First request after idle takes ~30s; consider upgrading or using a health check ping |
| Build fails on Vercel | Check that `NEXT_PUBLIC_API_URL` is set before build |
