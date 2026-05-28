# VedaAI — AI Assessment Creator

A modern, production-grade AI-powered assessment generation platform. Teachers create assignments, configure question parameters, and generate structured exam papers using AI — with real-time progress tracking, professional PDF exports, and a premium UI.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │  Pages    │  │  Zustand  │  │ TanStack │  │Socket.IO││
│  │  (App     │  │  Store    │  │  Query   │  │ Client  ││
│  │  Router)  │  │          │  │          │  │         ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP + WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                   Backend (Express + TS)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │  Routes   │  │Controllers│  │ Services │  │  Socket ││
│  │  + Zod   │  │          │  │  (AI +   │  │   .IO   ││
│  │ Validate │  │          │  │   PDF)   │  │  Server ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
│  ┌──────────────────────────────────────────────────────┐│
│  │              BullMQ Worker (Generation)              ││
│  └──────────────────────────────────────────────────────┘│
└──────────┬─────────────────┬────────────────────────────┘
           │                 │
   ┌───────▼───────┐ ┌──────▼──────┐
   │   MongoDB     │ │    Redis    │
   │  (Documents)  │ │ (Queue +   │
   │               │ │  Job State) │
   └───────────────┘ └─────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS 4 | Utility-first styling |
| Zustand | Lightweight state management |
| TanStack Query | Server state & caching |
| React Hook Form + Zod | Form handling & validation |
| Framer Motion | Animations & transitions |
| Socket.IO Client | Real-time WebSocket updates |
| Lucide React | Icon system |
| Sonner | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| Express.js | HTTP server |
| TypeScript | Type safety |
| MongoDB + Mongoose | Document database |
| Redis + IORedis | Caching & queue backend |
| BullMQ | Job queue for AI generation |
| Socket.IO | Real-time bidirectional events |
| OpenAI API | GPT-4o-mini for question generation |
| pdf-lib | Server-side PDF generation |
| Zod | Request validation |
| Multer | File upload handling |

---

## Features

- **Assignment Management** — Create, view, search, filter, and delete assignments
- **Multi-step Form** — Wizard-style creation with file upload, question type configurator, and marks distribution
- **AI Generation Pipeline** — Structured JSON output from GPT-4o-mini with schema validation, retry logic, and fallback handling
- **Real-time Progress** — WebSocket-powered live status updates (queued → processing → generating → parsing → saving → completed)
- **Professional PDF Export** — University-grade exam papers with institute header, student info fields, section hierarchy, difficulty tags, marks allocation, and answer key
- **Beautiful UI** — Premium design inspired by Linear/Notion with Framer Motion animations, skeleton loaders, and polished interactions
- **Queue Architecture** — BullMQ with configurable concurrency, exponential backoff retries, and rate limiting

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or cloud)
- OpenAI API key

### 1. Clone & Install

```bash
git clone <repository-url>
cd aryan

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables

**Backend** (`backend/.env`):
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=sk-your-openai-api-key
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### 3. Run

```bash
# Terminal 1 — Backend (starts Express server + BullMQ worker)
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## AI Generation Pipeline

```
Teacher clicks "Generate"
        │
        ▼
  ┌──────────────┐
  │  API validates│
  │  assignment   │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐     ┌──────────────┐
  │  Create Job   │────▶│  BullMQ Queue│
  │  in MongoDB   │     │  (Redis)     │
  └──────────────┘     └──────┬───────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Worker picks up  │
                    │  job from queue   │
                    └──────┬───────────┘
                           │
              ┌────────────▼────────────┐
              │  Build prompt from      │
              │  assignment config      │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Call OpenAI API        │
              │  (JSON mode, 3 retries) │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Validate response with │
              │  Zod schema             │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Save to MongoDB        │
              │  Link to assignment     │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  WebSocket broadcast    │
              │  "completed" to client  │
              └─────────────────────────┘
```

Each step emits WebSocket events so the frontend shows live progress.

---

## WebSocket Architecture

```
Client                          Server
  │                               │
  │──── join:assignment ─────────▶│  (join room)
  │                               │
  │◀── generation:progress ──────│  (status updates)
  │    { status, progress,        │
  │      message, error }         │
  │                               │
  │──── leave:assignment ────────▶│  (leave room)
```

Events are scoped to assignment-specific rooms to prevent cross-client leakage.

---

## Database Schema

### Assignments
```
{
  title, subject, dueDate,
  questionTypes: [{ type, count, marks }],
  totalQuestions, totalMarks,
  additionalInstructions?, uploadedFileUrl?,
  status: draft | generating | completed | failed,
  generatedAssessmentId?
}
```

### Generated Assessments
```
{
  assignmentId,
  title, instituteName, subject, className, duration, maxMarks,
  sections: [{
    title, instruction,
    questions: [{ questionNumber, question, difficulty, marks, type, answer? }]
  }],
  answerKey: [{ questionNumber, answer }],
  metadata: { model, tokensUsed, generationTimeMs }
}
```

### Generation Jobs
```
{
  assignmentId, status, progress, statusMessage,
  bullJobId?, error?, startedAt?, completedAt?
}
```

---

## Folder Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── assignments/
│   │   │   ├── [id]/
│   │   │   │   ├── assessment/ # Generated output page
│   │   │   │   └── page.tsx    # Assignment detail
│   │   │   ├── create/         # Multi-step creation form
│   │   │   └── page.tsx        # Assignment list
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── features/           # Domain-specific components
│   │   ├── layout/             # Sidebar, TopBar
│   │   └── ui/                 # Reusable primitives
│   ├── lib/                    # API client, socket, utils
│   └── store/                  # Zustand stores

backend/
├── src/
│   ├── config/                 # DB, Redis, env
│   ├── controllers/            # Request handlers
│   ├── middleware/              # Auth, validation, upload, errors
│   ├── models/                 # Mongoose schemas
│   ├── queues/                 # BullMQ queue definitions
│   ├── routes/                 # Express routers
│   ├── services/               # AI generation, PDF export
│   ├── sockets/                # Socket.IO setup
│   ├── validators/             # Zod schemas
│   ├── workers/                # BullMQ job processors
│   └── index.ts                # Server bootstrap
```

---

## Tradeoffs & Design Decisions

| Decision | Why |
|---|---|
| **BullMQ over direct API calls** | AI generation is slow (5-30s). Queue decouples request from processing, enables retries, prevents timeouts |
| **WebSocket over polling** | Real-time progress feels premium; polling would add latency and unnecessary requests |
| **pdf-lib over Puppeteer** | No browser dependency, faster, smaller footprint. Puppeteer gives pixel-perfect HTML rendering but adds ~400MB |
| **Zustand over Redux** | Simpler API for this scale. No action creators, reducers, or boilerplate |
| **Server-side PDF** | Generated once, cached. Client-side PDF would require shipping fonts and layout logic to the browser |
| **JSON mode for AI** | Ensures parseable output. Raw text would require fragile regex parsing |

---

## Future Improvements

- **Authentication** — Role-based access (teachers, admins, students) with NextAuth
- **AI Streaming** — Stream tokens in real-time for a ChatGPT-like experience
- **Question Regeneration** — Regenerate individual questions without regenerating the entire paper
- **Template Library** — Save and reuse prompt templates across assignments
- **Analytics Dashboard** — Track generation stats, question difficulty distributions, usage patterns
- **Dark Mode** — Theme toggle with CSS variables (foundation already in place)
- **Assignment History** — Version control for generated assessments
- **Autosave Draft** — Persist form state to localStorage during creation
- **Multi-language** — Support question generation in regional languages
- **Caching Layer** — Redis cache for frequently accessed assessments to reduce DB load
- **Rate Limiting** — Per-user API rate limits to prevent abuse
- **Drag & Drop Reorder** — Reorder questions and sections after generation

---

## Performance Considerations

- **TanStack Query** — 30s stale time, 2 retries, background refetch on focus disabled
- **Skeleton Loaders** — Perceived performance improvement during data fetching
- **WebSocket rooms** — Events scoped to assignment rooms, not broadcast globally
- **BullMQ concurrency** — 2 concurrent workers with rate limiting (5/min)
- **Lazy loading** — Pages and heavy components loaded on demand via Next.js App Router
- **Optimistic updates** — Deletion reflected immediately in UI before server confirmation

---

## License

MIT
