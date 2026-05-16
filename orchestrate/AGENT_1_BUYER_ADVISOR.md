# Orchestrate Agent 1 — HomeKey Buyer Advisor

A conversational agent that helps a home-buyer find every grant they qualify for.

## Setup steps in Orchestrate Builder

Once you're inside watsonx Orchestrate, do this:

### 1. Import the skills (one-time)

1. In Orchestrate Builder, click **Skills** → **+ New skill** → **Import from API/OpenAPI**.
2. Upload `orchestrate/skills-openapi.yaml` (in this repo).
3. Set the **server URL** to your deployed app (or your ngrok URL during dev).
4. Five skills should appear: `matchGrants`, `getGrant`, `listGrants`, `captureLead`, `proposeGrantChange`.
5. Test the `matchGrants` skill with the sample payload below to confirm connectivity.

```json
{
  "state": "MI",
  "city": "Detroit",
  "annualIncome": 55000,
  "householdSize": 2,
  "targetPurchasePrice": 150000,
  "creditScore": 700,
  "firstTimeBuyer": true,
  "veteran": false,
  "activeMilitary": false,
  "profession": "teacher",
  "ownerOccupied": true
}
```

### 2. Create the agent

1. Click **Agents** → **+ New agent**.
2. Name: **HomeKey Buyer Advisor**
3. Foundation model: **ibm/granite-3-8b-instruct** (or whatever's available — Llama 3.3 70B also works)
4. Description: *"Helps first-time home buyers find every grant and down-payment assistance program they qualify for."*
5. **System prompt** — paste this:

```
You are the HomeKey Buyer Advisor, a friendly expert on US first-time home buyer programs and down payment assistance grants.

Your job is to:
1. Interview the buyer to understand their situation — where they want to buy, household income, household size, profession, military status, first-time-buyer status, credit range, target price.
2. Call the matchGrants skill with their profile. Always pass a 2-letter state code.
3. Present their top matches clearly: name, sponsor, dollar amount, why they qualify, the application URL.
4. If they want personalized help, call the captureLead skill with wantsRealtor=true.

Rules:
- Be warm but efficient. Don't ask for info you don't need.
- Never invent a grant — only return programs that matchGrants returns.
- Always include the official applicationUrl when recommending a program.
- If matchGrants returns 0 results, suggest the buyer try widening their criteria (different state, repeat-buyer-friendly programs, etc.).
- After showing results, always offer: "Want me to save these and have a realtor follow up?" — and if yes, ask for their email and call captureLead.

Tone: like a knowledgeable friend who happens to be a real estate agent. Not corporate. Not pushy.
```

6. **Attach skills**:
   - `matchGrants` — required (primary skill)
   - `getGrant` — for follow-up questions about a specific program
   - `captureLead` — for handoff to realtor

7. **Routing hints** (tell the agent when to use each skill):
   - `matchGrants`: "Call this once you have at least state + annual income. Other fields are optional but improve results."
   - `getGrant`: "Call this when the buyer asks for more details about a specific program they saw."
   - `captureLead`: "Call this only after you've shown the buyer their matches AND they've explicitly asked to be contacted by a realtor or want the weekly digest. Requires email."

### 3. Test the agent

In the Orchestrate playground, try:

> "Hi, I'm a teacher in Detroit making $58k a year. I want to buy my first house, target around $150k. What grants can I get?"

Expected behavior: the agent calls `matchGrants` with `{state: "MI", city: "Detroit", profession: "teacher", annualIncome: 58000, ...}`, then summarizes the top 3-5 matches with dollar amounts and apply links.

### 4. Publish + embed

Once it's working:
1. Click **Publish** in Orchestrate.
2. Grab the **embed snippet** (chat widget JS).
3. Paste it into `app/layout.tsx` just before `</body>` (we'll wire this up after you publish).

## Demo script for the hackathon video

```
[You, as the buyer, in Orchestrate chat]
"I'm a nurse in Detroit, my first home, $65k income, household of 3. Looking around $200k."

[Agent calls matchGrants → returns ~12 programs]

[Agent responds]
"Great — I found 12 programs you may qualify for. Top 3:

1. **MSHDA $10K Down Payment Assistance** (92% match)
   - Michigan State Housing Development Authority — $10,000 deferred 0% second mortgage
   - Why you qualify: first-time buyer, income under $145k cap, credit score sufficient
   - Apply: michigan.gov/mshda

2. **Detroit Home Mortgage** (88% match)
   - Designed to overcome Detroit's appraisal gap...

3. **FHA 203(b)** (85% match)
   - 3.5% down, federal program...

Want me to save these and have a realtor follow up?"

[You]
"Yes please, email me at jane@example.com"

[Agent calls captureLead → confirms]
"Done — your matches are saved. A realtor familiar with these programs will reach out within 24 hours."
```

This is the agent flow we want to record for the demo video.
