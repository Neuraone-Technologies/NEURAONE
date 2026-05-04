# NeuraOne Ultimate AI Agent

An AI-powered portfolio and product website for **NeuraOne Technologies**, featuring a live Claude-powered chatbot, Netlify Identity authentication, and a modern dark-themed UI.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start (SSR/SPA hybrid) |
| Frontend | React 19 + TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 + custom CSS |
| Auth | Netlify Identity (`@netlify/identity`) |
| AI Chatbot | Anthropic Claude API (`@anthropic-ai/sdk`) |
| Language | TypeScript 5.7 (strict mode) |
| Deployment | Netlify |

## Features

- **Authentication** — Login / Signup with email+password, Google OAuth, and GitHub OAuth via Netlify Identity
- **Welcome greeting** — After login, the header shows "Welcome, [First Last Name]"
- **AI Chatbot** — Live chatbot powered by Claude AI (claude-sonnet-4-6) that can answer any question
- **Download section** — Shows a "Feature Under Development" notice with a coming-soon message
- **Footer** — "© 2025 NeuraOne Technologies. All rights reserved."
- **FAQ page** — Accordion Q&A with NeuraOne-specific content

## Running Locally

> **Note:** Netlify Identity authentication only works on deployed Netlify environments, not on localhost.

```bash
# Install dependencies
npm install

# Start Vite dev server (no auth, fastest iteration)
npm run dev

# Or start via Netlify CLI (proxied, still no working Identity locally)
npx netlify dev
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API key for the AI chatbot (set in Netlify dashboard) |

## Deployment

Push to your connected GitHub repo — Netlify auto-deploys on every push. Identity is pre-enabled via the activation script.
