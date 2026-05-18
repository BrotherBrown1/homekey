# Orchestrate Agent 3 — Nova Eligibility Validator

A second-look agent that re-checks a grant against a specific buyer's profile and returns `eligible`, `uncertain`, or `ineligible` with a one-sentence reason.

## Why this exists

The rule-based matcher (in `lib/matcher.ts`) hard-excludes obvious disqualifiers: income cap, veteran-only, first-time-only, profession-restricted, owner-occupied. But many programs have softer rules buried in `detailedRequirements` or `notes`:

- "Targeted to specific census tracts in Detroit"
- "Income must not exceed 80% AMI for your county"
- "Available only in opportunity zones"
- "Funding window — applications paused until Q3"

The Validator agent reads the program's full text and decides whether a particular buyer plausibly qualifies. It runs automatically inside `matchGrants()` (the web app), and is also exposed as a standalone Orchestrate skill so the Buyer Advisor agent can call it for any single grant.

## What it does

Given a `grantId` and a buyer profile:
1. Fetches the full grant record.
2. Sends grant + buyer to watsonx.ai with a strict validator prompt.
3. Returns one of:
   - `eligible` — buyer plausibly qualifies; no notable concerns
   - `uncertain` — needs human review; some condition is ambiguous
   - `ineligible` — the program's notes/requirements make clear the buyer won't qualify

Ineligible grants are dropped from buyer results entirely. Uncertain grants are downgraded to medium confidence and surfaced with the validator's note in `whyDisqualify`.

## Setup steps in Orchestrate Builder

### 1. Create the agent

1. **Agents** → **+ New agent**
2. Name: **Nova Eligibility Validator**
3. Type: **Skill / utility** (no conversational UI required, but you can give it one for the demo)
4. Foundation model: Granite 3 8B Instruct (same as the others)
5. **System prompt**:

```
You are the Nova Eligibility Validator. The Buyer Advisor agent calls you when it needs a second opinion on whether a specific buyer qualifies for a specific grant.

Workflow:
1. Receive a grantId and a buyer profile.
2. Call validateEligibility with both.
3. Return the verdict verbatim to the calling agent, including the one-sentence reason.

You do not chat with buyers directly. You return short, factual verdicts only:
- "eligible" — the buyer plausibly qualifies
- "uncertain" — at least one condition is ambiguous and needs human review
- "ineligible" — clear evidence the buyer would not qualify

Be conservative. When in doubt, return uncertain — never ineligible. Never invent eligibility rules that aren't in the program's record.
```

6. **Skills**:
   - `validateEligibility` — the single skill this agent exposes

### 2. Wire it to the Buyer Advisor

In the Nova Buyer Advisor agent's system prompt, add this line:

```
When recommending a specific grant to a buyer, you may call the Nova Eligibility Validator (via validateEligibility) to confirm a borderline case before suggesting it. If the validator returns "ineligible", do not recommend that grant.
```

This is the multi-agent loop: Buyer Advisor proposes a match → Validator checks it → Curator keeps the underlying data fresh.

## Demo script for the hackathon video

```
[Orchestrate Buyer Advisor chat]
User: I make $9 million a year. What grants can I get?

Buyer Advisor: [calls matchGrants]
Buyer Advisor: Based on your income, none of the major down-payment-assistance programs apply — they're all income-capped or AMI-restricted. Let me double-check one borderline one just in case.

Buyer Advisor: [calls validateEligibility on a federal program]
Validator: { verdict: "ineligible", reason: "Federal down payment assistance programs cap income at 80–140% AMI; $9M household income exceeds every county AMI in the country." }

Buyer Advisor: Confirmed — none of the programs in our database are designed for households at your income level. They're built for first-time buyers under local AMI caps.
```

This is the third agent for the hackathon judges: **the safety net.** The Buyer Advisor proposes matches; the Validator confirms; the Curator keeps the source data current. Three watsonx-powered agents, one mission: make sure first-time home buyers see only the grants they can actually claim.
