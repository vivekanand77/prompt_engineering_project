# 🧠 Prompt Engineering Hub

> **Build, test, optimize, and deploy AI prompts. An interactive lab — not a blog.**

An interactive learning and tooling platform that teaches prompt engineering through hands-on practice. Learn how AI processes your words, master professional prompt patterns, and test against real models — all in one place.

---

## ✨ Features

| Module | What It Does |
|--------|-------------|
| **📚 Learn** | 10 progressive modules with theory + interactive exercises (quiz, fix-prompt, token-challenge) |
| **🔬 Simulate** | 5-stage pipeline: Live Tokenizer → BPE Visualizer → Cost Calculator → Attention Map → Generation |
| **🏗️ Builder** | Structured form that generates professional prompts with quality scoring (0–100) |
| **🧪 Playground** | Test prompts with adjustable temperature, model selection, and run history |
| **📋 Patterns** | 6 battle-tested templates: Chain of Thought, ReAct, Few-Shot, Role Prompting, JSON Output, Guardrails |
| **⚖️ Compare** | Side-by-side model output comparison (GPT-4, Claude 3, Gemini Pro) |
| **💾 Dashboard** | CRUD for saved prompts with search, tags, export/import (JSON) |

## 🎨 Design

- **Brutalist editorial** design system with monochrome palette
- **Dark mode** toggle with system preference detection
- **Fully responsive** — works on desktop, tablet, and mobile
- **Accessible** — ARIA labels, focus-visible outlines, keyboard navigation

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16 + React 19
- **Language:** TypeScript
- **Styling:** CSS Variables + Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Persistence:** localStorage (client-side)

---

## 📁 Project Structure

```
app/
├── page.tsx              → Homepage
├── learn/page.tsx        → Learning modules (10 modules)
├── journey/page.tsx      → Interactive simulation
├── builder/page.tsx      → Prompt builder
├── lab/page.tsx          → Live playground
├── patterns/page.tsx     → Pattern library
├── comparator/page.tsx   → Model comparator
├── dashboard/page.tsx    → Saved prompts + export/import
└── api/generate/route.ts → API endpoint (mock)

components/ui/            → Reusable components (Navbar, CopyButton, etc.)
lib/                      → Hooks & helpers (exercises, localStorage, theme)
styles/                   → Design system (variables, typography, layout)
```

---

## ✅ What's Been Done

- [x] 10 interactive learning modules with auto-grading
- [x] Live tokenizer & BPE step-by-step visualizer
- [x] Structured prompt builder with quality scoring
- [x] Model comparison playground
- [x] Prompt dashboard with CRUD + export/import (JSON)
- [x] 6 professional prompt pattern templates
- [x] Dark mode with system preference detection
- [x] Responsive design for all breakpoints
- [x] SEO metadata on every route
- [x] Accessibility (ARIA labels, focus-visible, roles)
- [x] Error handling with retry in playground

---

## 🔧 Remaining Tasks (Developer Action Required)

These items require API keys, external services, or manual setup:

### 🔴 Critical — Must-Have for Competition

| # | Task | What's Needed |
|---|------|---------------|
| 1 | **Connect real AI APIs** | Sign up for OpenAI / Anthropic / Google AI keys. Update `app/api/generate/route.ts` to call real APIs instead of `mockAIResponse()`. Create `.env.local` with API keys. |
| 2 | **User authentication** | Set up Firebase Auth or NextAuth.js. Replace localStorage with Firestore/Supabase for cross-device persistence of progress and saved prompts. |

### 🟡 Important — Elevates Quality

| # | Task | What's Needed |
|---|------|---------------|
| 3 | **Real tokenizer** | Install `tiktoken` (OpenAI's tokenizer): `npm install @anthropic-ai/tokenizer` or use `tiktoken` WASM build. Replace the regex approximation in `lib/promptHelpers.ts`. |
| 4 | **Prompt versioning & diff** | Add version history tracking to `useLocalStorage.ts`. Store an array of past versions per prompt. Build a visual diff view component. |
| 5 | **Onboarding tour** | Install a tour library (e.g., `react-joyride`) and create a first-time walkthrough highlighting key features. |
| 6 | **`GlowButton` and `TokenFloat`** | These components in `components/ui/` are currently unused. Either integrate them into pages or remove to reduce bundle size. |

### 🟢 Nice to Have — Polish & Delight

| # | Task | What's Needed |
|---|------|---------------|
| 7 | **Leaderboard / Badges** | Gamification layer on top of the progress system (e.g., "Completed 10 modules", "Saved 20 prompts"). |
| 8 | **Community patterns** | Backend needed. Let users submit and vote on prompt patterns. |
| 9 | **Prompt sharing** | Generate shareable short URLs for prompts. Requires a backend or service like Firebase Dynamic Links. |
| 10 | **Voice-to-prompt** | Use the Web Speech API (`SpeechRecognition`) for mic input → text in playground. |
| 11 | **Analytics dashboard** | Track token usage, cost trends, and model preferences over time with charts (use `recharts` or `chart.js`). |
| 12 | **Comparator diff** | Highlight textual differences between model outputs in the comparator using a diff library. |
| 13 | **API rate/cost alerts** | Warn users when approaching spending thresholds. Requires real API integration first. |
| 14 | **Tests** | Add unit tests (Jest/Vitest) for lib functions and integration tests for pages. |
| 15 | **CI/CD** | Set up GitHub Actions for lint + test + deploy. Add Vercel or Netlify deployment config. |

### Setup Guide for Real API Integration

```bash
# 1. Create environment file
cp .env.example .env.local

# 2. Add your API keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_KEY=AI...

# 3. Update app/api/generate/route.ts to use real API calls
# Replace mockAIResponse() with actual SDK calls
```

---

## 📝 Environment Variables

Create a `.env.local` file (not committed to git):

```env
# AI API Keys (for real API integration)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_KEY=

# Auth (if implementing authentication)
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

---

## 📄 License

MIT
