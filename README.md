# Values Card Game

A four-step reflective card game to uncover and rank the values that define who you are. At the end of the game, Claude generates a personal values portrait based on every choice you made.

---

## Project structure

```
values-card-game/
├── api/
│   └── synthesize.js   ← Vercel serverless function (proxies Claude API)
├── index.html
├── style.css
├── game.js
├── config.js           ← local dev notes only; key is never stored here
├── vercel.json
└── README.md
```

The API key **never** reaches the browser. `game.js` calls `/api/synthesize`, which runs on Vercel's servers and forwards the request to Anthropic using `CLAUDE_API_KEY` from your environment variables.

---

## Deploying to Vercel (step-by-step for beginners)

### Step 1 — Put the code on GitHub

1. Go to [github.com](https://github.com) and sign in (create a free account if you don't have one).
2. Click the **+** button in the top-right corner → **New repository**.
3. Give it a name (e.g. `values-card-game`), leave it **Private** if you prefer, then click **Create repository**.
4. On your Mac, open Terminal and run:

```bash
cd "/Users/yourname/path/to/Values Card Game"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/values-card-game.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username and update the path to match your local folder.

---

### Step 2 — Sign up for Vercel

1. Go to [vercel.com](https://vercel.com) and click **Sign Up**.
2. Choose **Continue with GitHub** — this links Vercel to your GitHub account automatically.
3. Vercel will ask to install the GitHub App. Click **Install** and allow access to the repository you just created.

---

### Step 3 — Import your project

1. From the Vercel dashboard, click **Add New… → Project**.
2. Find your `values-card-game` repository in the list and click **Import**.
3. On the **Configure Project** screen:
   - **Framework Preset:** leave it as **Other** (this is a plain static site).
   - **Root Directory:** leave it as `.` (the repository root).
   - **Build Command:** leave it blank.
   - **Output Directory:** leave it blank.
4. Do **not** click Deploy yet — first set the environment variable below.

---

### Step 4 — Add your Anthropic API key

1. Still on the Configure Project screen, scroll down to **Environment Variables**.
2. Add one variable:
   - **Name:** `CLAUDE_API_KEY`
   - **Value:** your Anthropic API key (starts with `sk-ant-…`)
   - Get a key at [console.anthropic.com](https://console.anthropic.com) → **API Keys** → **Create Key**.
3. Make sure the variable is enabled for **Production**, **Preview**, and **Development** environments.

> **Security note:** Vercel stores this key encrypted. It is injected into the serverless function at runtime and is never sent to the browser.

---

### Step 5 — Deploy

1. Click **Deploy**.
2. Vercel will build and deploy in about 30 seconds.
3. When it finishes you'll see a URL like `https://values-card-game-abc123.vercel.app`. That's your live game!

---

### Step 6 — Add a custom domain (optional)

1. In your Vercel project, go to **Settings → Domains**.
2. Type in your domain (e.g. `values.yourdomain.com`) and follow the DNS instructions.

---

## Future updates

Every time you push a commit to the `main` branch on GitHub, Vercel automatically redeploys — no extra steps needed.

---

## Local development

To run locally with the AI portrait feature working:

1. Install the [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. Create a `.env.local` file in the project root:
   ```
   CLAUDE_API_KEY=sk-ant-your-key-here
   ```
3. Run `vercel dev` — this starts a local server that handles both the static files and the `/api/synthesize` serverless function exactly as Vercel does in production.

Without `vercel dev`, you can still run the game with the local Python server (`python3 serve.py 3456`) — the four game steps work normally, but the AI portrait at the end will fail gracefully with an error message since `/api/synthesize` won't be available.
