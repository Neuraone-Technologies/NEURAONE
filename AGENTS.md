# AGENTS.md

This document provides an overview of the project architecture, conventions, and key decisions for developers and AI agents working on this codebase.

## Project Overview

NeuraOne Ultimate AI Agent website — a product landing page + live AI chatbot for NeuraOne Technologies. Built with TanStack Start on Netlify.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 + custom CSS in `src/styles.css` |
| Auth | Netlify Identity via `@netlify/identity` |
| AI | Anthropic Claude API via `@anthropic-ai/sdk` |
| Language | TypeScript 5.7 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
src/
├── components/
│   ├── CallbackHandler.tsx   # Handles OAuth/email token hash on load
│   └── Header.tsx            # Nav with login button + "Welcome [Name]" when logged in
├── lib/
│   ├── auth.ts               # getServerUser — server-side identity via @netlify/identity
│   └── identity-context.tsx  # Client-side React context wrapping @netlify/identity
├── routes/
│   ├── __root.tsx            # Root layout: IdentityProvider, CallbackHandler, Header, Footer
│   ├── index.tsx             # Main landing page: Hero, Commands, Chatbot Demo, Brain, Download
│   ├── login.tsx             # Login/Signup/ForgotPassword page (email + Google + GitHub)
│   └── faq.tsx               # Accordion FAQ with NeuraOne-specific Q&A
├── server/
│   └── chat.functions.ts     # TanStack Start server function calling Anthropic Claude API
└── styles.css                # Global styles: Tailwind + full NeuraOne dark theme CSS
```

## Key Architecture Decisions

### Authentication
- Uses `@netlify/identity` — the single package that handles JWT cookies, GoTrue validation, and OAuth
- `IdentityProvider` (client context) wraps the entire app in `__root.tsx`
- `CallbackHandler` handles all auth token types in the URL hash (email confirmation, password reset, OAuth)
- **Auth does NOT work on localhost** — must be tested on a deployed Netlify environment

### Chatbot
- `src/server/chat.functions.ts` is a TanStack Start server function (`createServerFn`) that calls Anthropic's Claude API
- The system prompt positions the bot as "NeuraOne AI" created by Harsh Patel / NeuraOne Technologies
- `ANTHROPIC_API_KEY` must be set as an environment variable in the Netlify dashboard
- Chat history is passed client-side with each request for conversation context

### Download Section
- Shows a "Feature Under Development" notice (not a real download)
- All three platform badges (Windows, macOS, Linux) show "Coming Soon"

### Styling
- All custom NeuraOne styling lives in `src/styles.css` as plain CSS (not Tailwind utilities)
- Dark theme: `#05050f` background, `#6c63ff` (purple) and `#ff6584` (pink) accent colors
- Font: Orbitron (headings/branding) + Poppins (body) from Google Fonts

## Conventions

- Components: PascalCase files in `src/components/`
- Server functions: `.functions.ts` suffix in `src/server/`
- Routes: kebab-case files in `src/routes/`
- Import alias: `@/` maps to `src/`
- Auth identity: use `user.name` and `user.email` (not `user.user_metadata`)

## Development Commands

```bash
npm run dev      # Start Vite dev server (no auth, fastest iteration)
npm run build    # Production build
```

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `ANTHROPIC_API_KEY` | Netlify dashboard | Anthropic Claude API for chatbot |
