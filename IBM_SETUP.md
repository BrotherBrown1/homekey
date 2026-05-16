# IBM watsonx Setup — Step by Step

You need three things before we can wire up agents:
1. **IBM Cloud account** (free)
2. **watsonx.ai** instance (free Lite plan)
3. **watsonx Orchestrate** trial

Total time: ~30 minutes. Do this in your browser; come back to me with the credentials at the bottom of this doc.

---

## Step 1 — IBM Cloud account (5 min)

1. Go to https://cloud.ibm.com/registration
2. Use **myrealtorbrown@gmail.com** as the email.
3. Verify email, set a password, fill in name + country.
4. Skip the credit card step if it offers — the Lite tier doesn't require one. (If forced, you can add one; nothing we'll use bills automatically on free tier.)
5. After login, you should land on the IBM Cloud dashboard.

---

## Step 2 — Create your watsonx.ai project (10 min)

watsonx.ai is the LLM hosting service. Granite is IBM's own foundation model — we'll use it.

1. Go to https://dataplatform.cloud.ibm.com/wx (this is the watsonx.ai console).
2. If prompted, choose **Dallas (us-south)** region — best Granite availability and free tier.
3. Click **"Create a new project"** → name it `HomeKey` → select your account's free instance for storage.
4. Once the project is created, copy two values from the project settings:
   - **Project ID** (looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - **Region** (e.g., `us-south`)
5. Now create an **API key**:
   - Go to https://cloud.ibm.com/iam/apikeys
   - Click **"Create"** → name it `homekey-watsonx` → click Create
   - Copy the API key — **you can't see it again after closing the dialog**

---

## Step 3 — Activate watsonx Orchestrate trial (10 min)

1. Go to https://www.ibm.com/products/watsonx-orchestrate
2. Click **"Start your free trial"** (top-right). The trial is normally 30 days.
3. Sign in with the same IBM Cloud account.
4. Pick the **Dallas (us-south)** region to match watsonx.ai.
5. Wait for provisioning (~5 min). You'll get an email when ready.
6. When you log in, you'll see the **Orchestrate Builder**. We'll come back here later to build the two agents.
7. From the Orchestrate console, copy:
   - **Tenant / instance URL** (e.g., `https://api.dl.watson-orchestrate.ibm.com/instances/<tenant-id>`)

---

## Step 4 — Send me the credentials

When you're done, paste these into our chat:

```
IBM_CLOUD_API_KEY=xxxxx
WATSONX_PROJECT_ID=xxxxx
WATSONX_REGION=us-south
WATSONX_ORCHESTRATE_URL=https://api.dl.watson-orchestrate.ibm.com/instances/xxxxx
```

I'll add them to `.env.local` (gitignored) and wire them into the backend. After that you don't have to think about them.

---

## Troubleshooting

- **"Service not available in region"** — try us-east instead of us-south.
- **Credit card required for Lite tier** — IBM occasionally requires this. It's verification only; the Lite plan doesn't bill unless you upgrade.
- **Trial activation slow** — sometimes 15+ min. Refresh the Orchestrate page after a while.

If you get stuck on any step, screenshot it and send to me — I'll guide you through.
