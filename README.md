# my-portfolio

Personal portfolio for **Muhammad Ishaq** — AI Engineer & Co-Founder of AI Cortexo.

A static site (plain HTML, CSS and JavaScript, no build step) with a dark, AI-themed design: animated neural-network background, glassmorphism cards, typing effect, filterable projects and scroll reveals.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Structure

```
index.html              page content (experience, projects, skills, education, contact)
styles.css              theme and layout
script.js               background animation, typing effect, filters, counters
assets/profile.png      profile photo
assets/Muhammad_Ishaq_CV.pdf  downloadable CV
```

## Deploy to Vercel

The repo includes `vercel.json` (clean URLs, security headers, CSP, asset caching) and `.vercelignore`.

**Option A: Dashboard.** Push to GitHub, then on vercel.com choose **Add New → Project**, import the repo, and keep these settings:
- Framework Preset: **Other**
- Build Command: *(empty)*
- Output Directory: *(empty, the root)*

Every push to `main` then deploys automatically.

**Option B: CLI.**

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

> If you later add external scripts, images or fonts from other domains, allow them in the `Content-Security-Policy` header in `vercel.json`.
