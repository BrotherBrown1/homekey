# HomeKey — Find the grants that unlock your first home

A buyer-facing grant-matching app powered by two **IBM watsonx Orchestrate** agents and the **watsonx.ai** Granite foundation model.

- **HomeKey Buyer Advisor** (conversational): interviews a buyer, calls our REST skills API, returns ranked matches with personalized "why you qualify" reasoning.
- **HomeKey Curator** (scheduled): scrapes every housing-finance-agency source URL weekly, uses watsonx.ai to detect material changes, and queues diffs for human review at `/admin`.

Built for the IBM watsonx hackathon. A free community resource for first-time home buyers — every federal, state, county, and city down-payment and closing-cost grant they qualify for, in one place, kept current by an autonomous agent.

## What's in the database

| Level | Count |
|---|---|
| Federal | 12 |
| State (all 50 + DC) | 56 |
| County | 5 |
| City | 9 |
| **Total** | **82** |

…and growing. The Curator agent finds new programs and amount changes weekly.

## Architecture

```
┌────────────────────┐         ┌─────────────────────────────────────┐
│ watsonx Orchestrate│         │  HomeKey Next.js app (this repo)    │
│                    │         │                                     │
│  Buyer Advisor ────┼────────►│  /api/skills/match-grants           │
│  (chat agent)      │         │  /api/skills/get-grant              │
│                    │         │  /api/skills/list-grants            │
│  Curator ──────────┼────────►│  /api/skills/capture-lead           │
│  (scheduled)       │         │  /api/skills/upsert-grant (admin)   │
│                    │         │                                     │
│  ▲                 │         │  ┌──────────────────────────────┐   │
│  │ both call       │         │  │ watsonx.ai (Granite 3 8B)    │◄──┤
│  │ foundation model│         │  │ via lib/watsonx.ts           │   │
│  ▼                 │         │  └──────────────────────────────┘   │
│  watsonx.ai        │         │                                     │
└────────────────────┘         │  SQLite (Drizzle ORM)               │
                               │  82 grants · leads · update_log     │
                               └─────────────────────────────────────┘
```

## Tech stack

- **Frontend / API**: Next.js 16 (App Router), Tailwind v4, TypeScript
- **DB**: SQLite via Drizzle ORM
- **LLM**: IBM watsonx.ai (Granite 3 8B Instruct, configurable)
- **Agents**: IBM watsonx Orchestrate (2 agents)
- **Hosting**: Vercel (recommended) or any Node 20+ host

## Getting started

```bash
git clone <this-repo>
cd grant-finder
npm install

# Provision the SQLite DB
npm run db:push
npm run db:seed

# Configure IBM credentials (see IBM_SETUP.md)
cp .env.example .env.local
# edit .env.local with your IBM_CLOUD_API_KEY and WATSONX_PROJECT_ID

# Run the app
npm run dev
# → http://localhost:3000
```

## Running the Curator agent

```bash
# Once .env.local has IBM credentials + CURATOR_AGENT_TOKEN set:
npm run curator
```

This iterates every active grant, fetches its source URL, asks watsonx.ai whether the page has changed since we stored it, and queues diffs to `/admin` for review.

## Routes

| Path | Purpose |
|---|---|
| `/` | Marketing landing page |
| `/onboarding` | 5-step buyer profile wizard |
| `/results?...` | Ranked grant matches |
| `/grant/[id]` | Full grant detail |
| `/admin` | Pending Curator diffs + recent leads |
| `/api/skills/match-grants` | POST — buyer profile → ranked matches |
| `/api/skills/get-grant?id=...` | GET — single grant detail |
| `/api/skills/list-grants?state=...` | GET — list of active grants |
| `/api/skills/capture-lead` | POST — save buyer email + match history |
| `/api/skills/upsert-grant` | POST — Curator only, propose a change |

## Project structure

```
app/                     Next.js app router
  page.tsx               Landing page
  onboarding/page.tsx    Buyer wizard
  results/page.tsx       Matched grants
  grant/[id]/page.tsx    Grant detail
  admin/page.tsx         Diff review + leads
  api/skills/*           REST endpoints called by Orchestrate skills
components/
  LeadCaptureBar.tsx     Soft email capture on results
lib/
  config.ts              Brand constants (rename HomeKey here)
  schema.ts              Drizzle tables + types
  db.ts                  SQLite connection
  watsonx.ts             watsonx.ai chat client
  matcher.ts             Rule + AI grant-matching engine
  data/
    seed-federal.ts      12 federal programs
    seed-states.ts       56 state HFA programs
    seed-local.ts        14 county/city programs
orchestrate/
  skills-openapi.yaml    Import into Orchestrate Builder
  AGENT_1_BUYER_ADVISOR.md   Step-by-step setup
  AGENT_2_CURATOR.md         Step-by-step setup
scripts/
  seed.ts                Load grants into SQLite
  curator-run.ts         Standalone Curator (or trigger via Orchestrate)
IBM_SETUP.md             watsonx.ai + Orchestrate provisioning guide
SUBMISSION.md            Hackathon submission text
DEMO_VIDEO.md            Recording script
```

## License

MIT. Built by Christian Brown (myrealtorbrown@gmail.com).
