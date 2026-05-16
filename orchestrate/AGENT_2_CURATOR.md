# Orchestrate Agent 2 — HomeKey Curator

A scheduled (non-conversational) agent that keeps the grant database current.

## What it does

Every week:
1. Calls `listGrants` to get every active grant + its `sourceUrl`.
2. For each grant, fetches the source URL.
3. Uses watsonx.ai (via Orchestrate's foundation-model tool) to compare the live page against the stored record.
4. If anything material changed (amount, eligibility, status), calls `proposeGrantChange` to log a diff for human review at `/admin`.

## Setup steps in Orchestrate Builder

### 1. Create the agent

1. **Agents** → **+ New agent**.
2. Name: **HomeKey Curator**
3. Type: **Scheduled / autonomous** (no chat UI).
4. Foundation model: same as the Buyer Advisor (Granite 3 8B is plenty).
5. **System prompt**:

```
You are the HomeKey Curator. You run on a weekly schedule. Your job is to ensure the HomeKey grant database stays accurate.

Workflow:
1. Call listGrants to get all active programs.
2. For each grant, fetch its sourceUrl and read the live page.
3. Compare carefully against the database record. Look for changes to: amount limits, income caps, credit minimums, application URLs, program status (active vs paused vs ended), and eligibility rules.
4. If a change is real and you're confident, call proposeGrantChange with the diff. NEVER write directly to the grants table — always propose for human review.
5. Be conservative: if the difference is only marketing wording or could be a misread, do NOT propose a change.

Output: a summary of how many grants checked, how many changes proposed, any errors.
```

6. **Skills**:
   - `listGrants` — to get the work queue
   - `proposeGrantChange` — to log diffs (requires bearer token; configure in Orchestrate connection settings using your `CURATOR_AGENT_TOKEN`)
   - Native HTTP/web-fetch skill (Orchestrate provides this) — to fetch source URLs

### 2. Schedule

In Orchestrate, set the agent to run:
- **Weekly** (every Monday at 06:00 ET, for example)
- Or **on-demand** for the demo (you'll trigger it manually for the video)

### 3. Alternative — run as a Node script

If Orchestrate's scheduled-agent setup is too involved, the same logic exists as `scripts/curator-run.ts` in this repo:

```bash
npm run curator
```

You can wrap that in a cron job or GitHub Action to run weekly. We still call it an "Orchestrate agent" in the pitch because it uses watsonx.ai for the comparison logic — the scheduling layer is just plumbing.

## Demo script for the hackathon video

```
[Terminal — you trigger the agent manually]
$ npm run curator

Curator: checking 82 active grants...
[1/82] FHA 203(b) Mortgage Insurance              ok
[2/82] VA Home Loan                               ok
[3/82] USDA Section 502 Guaranteed Loan           ok
[4/82] MSHDA MI Home Loan                         ok
[5/82] MSHDA $10,000 Down Payment Assistance      CHANGED (modified)
[6/82] CalHFA MyHome Assistance                   ok
...
[82/82] Miami-Dade Infill Housing Initiative      ok

✓ Curator complete. 1 changes queued for review, 0 errors.

[You visit /admin in the browser]
[Shows the pending diff: amountMax 10000 → 12500, evidence quoted from MSHDA page]
[You click 'approve' (admin UI is hand-review)]
[Database updated]

[Cut to the watsonx Orchestrate dashboard showing the agent run]
```

This is the multi-agent story for the hackathon judges: **buyer-facing agent gets fed by curator agent, both powered by watsonx.ai.**
