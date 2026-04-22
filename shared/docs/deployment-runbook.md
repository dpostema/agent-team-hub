# Deployment Runbook

Step-by-step guide to deploy the OpenClaw / Paperclip agent system on your memu.bot PCs.

## Architecture Overview

```
[COO PC - memu.bot]              [VP PC - OpenClaw]
  Pepper (supervisor)              MJ (code builder)
  Hermes (research)                Nerve Dashboard
  Nerve Dashboard                  Agent Factory
  Agent Factory
         \                          /
          \--- Telegram API -------/
          \--- OpenRouter AI -----/
          \--- GitHub (shared config) /
```

Both PCs run independent instances. Each can host any combination of agents.

---

## Prerequisites

Before starting, you need:

- [ ] **Node.js 18+** installed on each PC
  - Download: https://nodejs.org/en/download
  - Verify: `node --version`
- [ ] **Git** installed
  - Download: https://git-scm.com/download/win
  - Verify: `git --version`
- [ ] **Telegram Bot Tokens** — one per agent bot
  - Create bots via @BotFather on Telegram
  - You already have: Hermes (@H2_HermeBot), MJ (@MJMiniJarvis_bot)
- [ ] **OpenRouter API Key**
  - Get one at: https://openrouter.ai/keys
  - Free models available (Qwen 3.6 Plus)
- [ ] **Your Telegram Chat ID** (for testing)
  - Message @userinfobot on Telegram to get your ID

---

## PC 1: COO PC (memu.bot — Pepper + Hermes)

### Step 1: Clone the repo

Open Command Prompt or PowerShell:

```cmd
cd C:\Users\Jarvis\AppData\Roaming\memu-bot
git clone https://github.com/dpostema/agent-team-hub.git
cd agent-team-hub
```

### Step 2: Install dependencies

```cmd
cd projects\nerve-dashboard
npm install
cd ..\..
```

### Step 3: Create your secrets file

```cmd
copy shared\configs\secrets.example.json shared\configs\secrets.local.json
```

Now edit `shared\configs\secrets.local.json` in Notepad:

```cmd
notepad shared\configs\secrets.local.json
```

Replace the placeholder values with your real tokens:

```json
{
  "HERMES_TELEGRAM_TOKEN": "8430548799:AAHkc4BN...(your real token)",
  "MJ_TELEGRAM_TOKEN": "8769773397:AAHCuzs...(your real token)",
  "OPENROUTER_API_KEY": "sk-or-v1-...(your real key)",
  "HERMES_DATA_PATH": "C:\\Users\\Jarvis\\AppData\\Roaming\\memu-bot\\workspace\\services\\hermes-pro-(h2-hermebot)_1775217775837\\data",
  "MJ_DATA_PATH": "C:\\Users\\Jarvis\\AppData\\Roaming\\memu-bot\\workspace\\services\\mj-pro-builder-bot_1775217860196\\data"
}
```

Save and close.

### Step 4: Validate the config

```cmd
cd projects\nerve-dashboard
node paperclip.js pilot-company
```

Expected output:
```
[Paperclip] Loaded company "Pilot Company" with 3 agents
Company: Pilot Company
Namespace: pilot
Agents: hermes, mj, pepper
Bot agents: hermes, mj

Agent Registry:
  hermes: Hermes (Research & Analysis) [running]
  mj: MJ (VP (OpenClaw)) [running]
  pepper: Pepper (COO (memu.bot)) [online]

Validation passed.
```

If you see errors, check that `secrets.local.json` has valid JSON and the correct key names.

### Step 5: Start Hermes bot

Open a **new** Command Prompt window (keep it open):

```cmd
cd C:\Users\Jarvis\AppData\Roaming\memu-bot\agent-team-hub\projects\nerve-dashboard
node agent-factory.js hermes
```

Expected output:
```
[Hermes] Starting agent (Research & Analysis)...
[Hermes] Telegram: @H2_HermeBot
[Hermes] AI Model: qwen/qwen3.6-plus:free
```

### Step 6: Test Hermes

On your phone or Telegram desktop:
1. Open Telegram
2. Search for **@H2_HermeBot**
3. Send `/start`
4. You should get a response: "Hermes Online!"
5. Send "What can you do?" — you should get an AI response

If no response:
- Check the Command Prompt window for errors
- Verify the Telegram token in `secrets.local.json`
- Make sure the bot isn't running elsewhere (only one process can poll per bot)

### Step 7: Start the Nerve Dashboard

Open another **new** Command Prompt window:

```cmd
cd C:\Users\Jarvis\AppData\Roaming\memu-bot\agent-team-hub\projects\nerve-dashboard
node server.js
```

Expected output:
```
[Paperclip] Loaded company "Pilot Company" with 3 agents
Nerve Command Center running for Pilot Company!
   Local: http://localhost:3456
   Network: http://192.168.x.x:3456
```

### Step 8: Verify the dashboard

1. Open a web browser
2. Go to **http://localhost:3456**
3. You should see:
   - "Nerve Command Center - Pilot Company" title
   - "Paperclip Orchestration Active" badge
   - Three agent cards: Hermes, MJ, Pepper
   - Each showing their role and capabilities
4. Try assigning a task to Hermes (you'll need your Telegram Chat ID)

---

## PC 2: VP PC (OpenClaw — MJ)

### Step 1: Clone the repo

```cmd
cd C:\Users\Jarvis\AppData\Roaming\memu-bot
git clone https://github.com/dpostema/agent-team-hub.git
cd agent-team-hub
```

### Step 2: Install dependencies

```cmd
cd projects\nerve-dashboard
npm install
cd ..\..
```

### Step 3: Create secrets file

Same process as PC 1:

```cmd
copy shared\configs\secrets.example.json shared\configs\secrets.local.json
notepad shared\configs\secrets.local.json
```

Fill in the same tokens (or different ones if this PC has separate bots).

**Important:** Update the data paths if they're different on this PC:
```json
{
  "MJ_DATA_PATH": "C:\\Users\\<USERNAME>\\AppData\\Roaming\\memu-bot\\workspace\\services\\mj-pro-builder-bot_<ID>\\data"
}
```

### Step 4: Validate

```cmd
cd projects\nerve-dashboard
node paperclip.js pilot-company
```

### Step 5: Start MJ bot

```cmd
node agent-factory.js mj
```

### Step 6: Test MJ

1. Open Telegram
2. Search for **@MJMiniJarvis_bot**
3. Send `/start`
4. Send "Write me a hello world in Python"
5. MJ should respond with code

### Step 7: Start dashboard (optional on PC 2)

```cmd
node server.js
```

This gives you a second dashboard instance. Both PCs can run dashboards independently — they read from the same config files.

---

## Adding a New Agent (on either PC)

To add a new Hermes-style agent after deployment:

### 1. Create the agent config

```cmd
cd C:\Users\Jarvis\AppData\Roaming\memu-bot\agent-team-hub
node shared\scripts\create-agent-config.js analyst --name "Analyst" --role "Data Analysis" --bot "@AnalystBot" --company pilot-company
```

### 2. Add the Telegram token

Edit `shared\configs\secrets.local.json` and add:
```json
{
  "ANALYST_TELEGRAM_TOKEN": "your-new-bot-token-here",
  "ANALYST_DATA_PATH": "C:\\path\\to\\agent\\data"
}
```

### 3. Start the new agent

```cmd
cd projects\nerve-dashboard
node agent-factory.js analyst
```

### 4. Restart the dashboard

Close and re-open the dashboard — the new agent appears automatically.

No code changes needed.

---

## Running as Background Services (Optional)

To keep agents running after you close the terminal:

### Option A: PM2 (recommended)

```cmd
npm install -g pm2

cd C:\Users\Jarvis\AppData\Roaming\memu-bot\agent-team-hub\projects\nerve-dashboard

pm2 start agent-factory.js --name hermes -- hermes
pm2 start agent-factory.js --name mj -- mj
pm2 start server.js --name nerve-dashboard

pm2 save
pm2 startup
```

Useful PM2 commands:
```cmd
pm2 list              :: see all running agents
pm2 logs hermes       :: view Hermes logs
pm2 restart hermes    :: restart Hermes
pm2 stop mj           :: stop MJ
pm2 monit             :: live monitoring dashboard
```

### Option B: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task > name it "Hermes Agent"
3. Trigger: "When the computer starts"
4. Action: Start a program
   - Program: `node`
   - Arguments: `agent-factory.js hermes`
   - Start in: `C:\Users\Jarvis\AppData\Roaming\memu-bot\agent-team-hub\projects\nerve-dashboard`
5. Repeat for each agent and the dashboard

---

## Keeping PCs in Sync

When you add agents or change configs, sync both PCs:

```cmd
cd C:\Users\Jarvis\AppData\Roaming\memu-bot\agent-team-hub
git pull origin claude/setup-openclaw-computer-use-fYhNx
```

Or if you've made local changes:
```cmd
git stash
git pull origin claude/setup-openclaw-computer-use-fYhNx
git stash pop
```

**Never commit `secrets.local.json`** — it's gitignored. Each PC has its own secrets file.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Config not found" | Run from the `projects/nerve-dashboard` directory, not from elsewhere |
| "Secret not found in secrets.local.json" | Check key names match exactly (case-sensitive) |
| Bot doesn't respond | Check only ONE process polls per bot token. Kill duplicates. |
| "ECONNREFUSED" on AI | OpenRouter may be rate-limiting. Wait 60s and retry. |
| Dashboard shows no agents | Verify `node paperclip.js pilot-company` passes validation |
| Wrong data paths | Update paths in `secrets.local.json` to match your PC's actual memu-bot data directories |
| Port 3456 in use | Set `COMPANY_ID=pilot-company` and change port in `shared/configs/companies/pilot-company.json` |

---

## Verification Checklist

After deployment, confirm:

- [ ] `node paperclip.js pilot-company` — validation passes
- [ ] `node agent-factory.js hermes` — starts without errors
- [ ] Telegram `/start` to Hermes — gets greeting response
- [ ] Telegram free-text to Hermes — gets AI response
- [ ] `node agent-factory.js mj` — starts without errors
- [ ] Telegram `/start` to MJ — gets greeting response
- [ ] `node server.js` — dashboard starts
- [ ] http://localhost:3456 — shows all 3 agents with correct roles
- [ ] Dashboard "Assign Task" — sends task via Telegram
- [ ] Dashboard "Quick Chat" — sends message via Telegram
