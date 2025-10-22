# HireWise

AI-powered mock interview studio that helps candidates practice job interviews end-to-end. HireWise generates targeted interview question sets, runs a real-time voice session with an AI interviewer, captures the full transcript, and delivers structured feedback scored by Gemini.

---

## Highlights
- Voice-first mock interviews powered by the Vapi voice assistant and ElevenLabs voices (`components/Agent.tsx`).
- Custom interview generation using Gemini 2.0 Flash (`app/api/vapi/generate/route.ts`).
- Automated scoring, strengths, and improvement areas via structured Gemini responses (`lib/actions/general.action.ts`).
- Post-interview email summaries delivered through EmailJS (`lib/actions/general.action.ts`).
- Firebase Auth sign-in/sign-up with server-verified session cookies (`lib/actions/auth.action.ts`).
- Firestore-backed dashboard showing personal history and community interviews (`app/(root)/page.tsx`).
- Smart tech stack badges sourced from Devicon with graceful fallbacks (`components/DisplayTechIcons.tsx`, `lib/utils.ts`).
- Opinionated Tailwind CSS v4 theme with dark-suited styling (`app/globals.css`).

---

## Tech Stack
- **Framework:** Next.js 15 (App Router) with React 19 & TypeScript.
- **Styling:** Tailwind CSS v4, custom utility classes, Radix UI primitives, sonner toasts.
- **AI/Voice:** Google AI SDK (Gemini 2.0 Flash) for prompts + structured outputs, Vapi Web SDK for real-time voice, ElevenLabs voice preset, Deepgram live transcription.
- **Data:** Firebase Auth, Firebase Admin SDK, Cloud Firestore (`users`, `interviews`, `feedback` collections).
- **Forms & Validation:** React Hook Form + Zod resolver.
- **Utilities:** dayjs, lucide-react, clsx/tailwind-merge, Next Themes (dark mode ready).

---

## Architecture & Key Modules

```text
app/
  (auth)/                 # Public auth pages + redirects based on session
  (root)/                 # Authenticated layout, dashboard, interview flows
    interview/            # Interview generator, dynamic interview room, feedback pages
  api/vapi/generate/      # POST endpoint that creates interview question sets
components/
  Agent.tsx               # Voice interview UI + Vapi interactions + transcript capture
  InterviewCard.tsx       # Interview summaries with dynamic tech icons & scores
  AuthForm.tsx            # Shared sign-in/sign-up form using Firebase client SDK
constants/index.ts        # AI prompts, scoring schema, tech mapping, sample data
firebase/
  admin.ts & client.ts    # Firebase Admin (server) and client initialization helpers
lib/
  actions/                # Next.js Server Actions for auth, interviews, feedback
  utils.ts                # Tailwind helper + tech icon resolver + random covers
public/covers/            # Cover artwork sourced at runtime by interview cards
types/                    # Global TypeScript declarations for app-wide entities
```

Server Actions shield business logic and sensitive credentials from the client while keeping pages server-rendered as much as possible. Client components are reserved for interactive pieces (voice agent, forms).

---

## Core Product Flow

1. **Generate interviews** – Authenticated users hit `/interview` to ask Gemini for a question set tailored to role, seniority, and tech stack. Entries are written to the `interviews` collection.
2. **Run voice session** – For a selected interview, the Agent component spins up a Vapi call using the configured workflow, streams Deepgram transcripts, and maintains call status in React state.
3. **Capture transcripts** – Final transcripts are stored locally in component state and sent to the `createFeedback` server action at the end of the call.
4. **Score & analyze** – `createFeedback` asks Gemini for detailed scoring aligned with `feedbackSchema` (Zod). The structured output is persisted to the `feedback` collection.
5. **Review dashboard** – The home page shows personal history plus community interviews ordered by recency, letting users retake or view feedback on demand.
6. **Notify by email** – When EmailJS is configured, a summary email with scores and a feedback link is automatically delivered to the candidate.

---

## Getting Started

### Prerequisites
- Node.js 18.18+ (Next.js 15 requirement).
- npm 9+ (or pnpm/yarn/bun if you adjust the scripts).
- Firebase project with:
  - Web app for client-side auth.
  - Service account key for Admin SDK.
- Vapi account with a Web token and workflow configured.
- Google AI Studio API key with access to Gemini 2.0 Flash.

### Installation
```bash
git clone <your-fork-url>
cd hirewise
npm install
```

### Environment Variables
Create `.env.local` at the project root. Use placeholders below and keep secrets outside version control.

```bash
# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<your-key>\n-----END PRIVATE KEY-----\n"

# Firebase Web app (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# AI providers
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key
NEXT_PUBLIC_VAPI_WEB_TOKEN=your-vapi-web-token
NEXT_PUBLIC_VAPI_WORKFLOW_ID=workflow-id

# EmailJS (optional but recommended)
EMAILJS_SERVICE_ID=your-service-id
EMAILJS_TEMPLATE_ID=your-template-id
EMAILJS_PUBLIC_KEY=your-public-key
EMAILJS_PRIVATE_KEY=your-private-key

# App URL for email links
NEXT_PUBLIC_APP_URL=https://your-app-url.com
```

> Tip: If your Firebase private key contains literal `\n` characters, keep them escaped exactly as shown so the Admin SDK receives proper new lines.

---

## Running Locally

```bash
# Start the development server (Turbopack enabled)
npm run dev

# Build and run a production bundle
npm run build
npm start

# Lint all source files
npm run lint
```

Visit `http://localhost:3000` and create an account to access the dashboard. Session cookies are issued via the `setSessionCookie` server action, so your browser must allow HTTP-only cookies.

---

## Platform Setup Notes
- **Firestore collections**:
  - `users`: created during `signUp` server action.
  - `interviews`: populated by `POST /api/vapi/generate` when a new question set is generated.
  - `feedback`: written by `createFeedback` after an interview call.
- **Vapi workflow**: Ensure the workflow referenced by `NEXT_PUBLIC_VAPI_WORKFLOW_ID` includes the interviewer assistant defined in `constants/index.ts`. Adjust greetings, prompts, or voice in that file as needed.
- **Gemini structured outputs**: `feedbackSchema` enforces a strict shape for the AI response. Modify the schema before adjusting prompt expectations.
- **EmailJS templates**: Create a template containing placeholders such as `recipient_email`, `recipient_name`, `total_score`, `final_assessment`, `category_breakdown`, `feedback_url`, and `feedback_id`. Assign the service/template IDs along with the public/private keys in `.env.local`.

---

## Productivity Scripts
- `npm run dev` – Next.js dev server with Turbopack.
- `npm run build` – Production build artifacts.
- `npm start` – Start production server.
- `npm run lint` – Validate code style with ESLint 9 and Next.js config.

---

## Contributing
1. Fork and branch from `main`.
2. Keep PRs focused—voice/AI prompt tweaks, UI polish, or data changes tend to touch different modules.
3. Run `npm run lint` before submitting.
4. Document any prompt or schema updates in this README to keep AI behavior discoverable.

---

## Deployment
- Optimized for Vercel (app directory + Edge-ready server actions).
- Add all required environment variables in the hosting provider.
- If deploying elsewhere, ensure Firebase Admin credentials are stored securely (e.g., platform secrets manager) and that streaming fetch APIs are supported.

---

## Roadmap Ideas
- Add interview history analytics (trendlines via `feedback.categoryScores`).
- Support multiple voice personas and languages through Vapi configuration.
- Allow custom interview templates per company role.
- Export transcripts and feedback as PDF for sharing.

---

Made with care to help candidates ace their next interview.
