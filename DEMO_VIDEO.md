# Demo Video Script (3-5 min Loom)

## Setup before recording

1. `npm run db:reset` (clean slate)
2. `npm run dev`
3. Open Orchestrate playground with **Nova Buyer Advisor** loaded.
4. Open a second tab to `localhost:3000` for the web flow.
5. Open a third tab to `localhost:3000/admin`.
6. Have terminal ready to run `npm run curator`.

## Recording (Loom in Chrome, 1080p)

### Scene 1 — The pitch (0:00–0:25)
*(camera on you)*

> "Hi, I'm Christian, a real estate agent in Michigan. Every week my clients ask, 'Are there any grants I can use?' The answer is almost always yes — but most people never find them because there are 2,500 programs across federal, state, county, and city governments, and the rules change every quarter. I built Nova for the watsonx hackathon to fix that with two IBM watsonx Orchestrate agents."

### Scene 2 — Buyer chats with the Orchestrate agent (0:25–1:20)
*(switch to Orchestrate playground)*

You: *"Hi, I'm a teacher in Detroit, household of 2, making $58,000. Looking to buy my first home around $150k. What grants can I get?"*

Agent calls `matchGrants` skill → returns ~12 programs → agent summarizes top 3 with dollar amounts + apply links.

You: *"Yes please, save these. Email me at demo@homekey.app and have someone follow up."*

Agent calls `captureLead` → confirms.

> "Notice the agent didn't make anything up — it called our REST skill, which combined rule-based filtering with watsonx.ai scoring to rank these programs."

### Scene 3 — The same flow on the website (1:20–2:00)
*(switch to localhost:3000)*

Walk through `/onboarding` quickly (state → income → first-time → profession), submit, land on `/results`. Highlight the per-grant "why you qualify" reasoning.

> "Same logic, web form for buyers who prefer not to chat."

### Scene 4 — The Curator agent (2:00–3:00)
*(switch to terminal)*

```bash
npm run curator
```

Watch it iterate: `[1/82] FHA 203(b)... ok` ... `[5/82] MSHDA $10K DPA... CHANGED`.

When done, switch to `/admin`:

> "The Curator just ran. It fetched every program's source URL, asked watsonx.ai whether anything material changed, and queued one diff for me to review. I'll approve or reject."

Click into the pending diff. Show the evidence quoted from the live page.

> "This runs every Monday in production. The same Granite 3 model that ranked the buyer's matches is finding amount changes for me — same brain, different agent."

### Scene 5 — Wrap (3:00–3:30)

*(camera back on you)*

> "Two agents, one watsonx.ai model, 82 programs covering every state. Free for buyers, lead-gen for me. Code is open source at the repo link. Thanks!"

## Loom upload checklist

- [ ] Privacy = "Anyone with the link"
- [ ] Title: "Nova — IBM watsonx Hackathon Submission"
- [ ] Description includes repo link
- [ ] Copy the share URL into SUBMISSION.md
