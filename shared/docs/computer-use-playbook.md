# Computer Use Playbook

Step-by-step procedures for automating agent provisioning via Claude Computer Use API.
Every step is a CLI command — no GUI interaction required.

## Prerequisites

- Node.js installed on the target PC
- Repository cloned to the target PC
- `shared/configs/secrets.local.json` populated with API keys and tokens

## Procedure 1: Create a New Agent

```bash
# 1. Create agent config (generates shared/configs/agents/<id>.json)
node shared/scripts/create-agent-config.js <agent-id> \
  --name "<Display Name>" \
  --role "<Role Description>" \
  --bot "<@TelegramBotUsername>" \
  --company pilot-company

# 2. Add Telegram token to secrets (append to secrets.local.json)
# Key format: <AGENT_ID_UPPERCASE>_TELEGRAM_TOKEN
# Key for data path: <AGENT_ID_UPPERCASE>_DATA_PATH

# 3. Validate the config
node projects/nerve-dashboard/paperclip.js pilot-company

# 4. Start the agent
node projects/nerve-dashboard/agent-factory.js <agent-id>
```

## Procedure 2: Create a New Company

```bash
# 1. Create company config
# On Windows:
shared\scripts\provision-company.bat <company-id> "<Company Name>" <port>

# Or manually create shared/configs/companies/<id>.json

# 2. Add agents to the company
node shared/scripts/create-agent-config.js <agent-id> \
  --name "<Name>" --role "<Role>" --company <company-id>

# 3. Validate
node projects/nerve-dashboard/paperclip.js <company-id>

# 4. Start dashboard for this company
COMPANY_ID=<company-id> node projects/nerve-dashboard/server.js
```

## Procedure 3: Start an Entire Company

```bash
# Windows:
shared\scripts\start-company.bat <company-id> --with-agents

# Linux/Mac:
COMPANY_ID=<company-id> node projects/nerve-dashboard/server.js
# In separate terminals, start each agent:
node projects/nerve-dashboard/agent-factory.js <agent-id>
```

## Procedure 4: Add Agent to Existing Company

```bash
# 1. Create agent config
node shared/scripts/create-agent-config.js <agent-id> --company <company-id>

# 2. Restart dashboard to pick up the new agent
# (Dashboard reads configs fresh on each API call)
```

## Config File Locations

| File | Purpose |
|------|---------|
| `shared/configs/agents/<id>.json` | Agent definition (name, role, AI model, capabilities) |
| `shared/configs/companies/<id>.json` | Company definition (agent roster, dashboard port) |
| `shared/configs/secrets.local.json` | Tokens and API keys (never committed) |
| `shared/configs/secrets.example.json` | Template showing required secret keys |

## Validation Commands

```bash
# Validate a company and all its agents
node projects/nerve-dashboard/paperclip.js <company-id>

# List available agents
ls shared/configs/agents/

# List available companies
ls shared/configs/companies/

# Test agent factory without starting
node -e "const {loadAgentConfig}=require('./projects/nerve-dashboard/agent-factory');console.log(loadAgentConfig('<agent-id>'))"
```

## Architecture Roles

| Role | Platform | Agent Type |
|------|----------|------------|
| COO | memu.bot | Pepper (supervisor, no bot process) |
| VP | OpenClaw | MJ (code builder, Telegram bot) |
| Executive Assistant | memu.bot | Hermes (research, Telegram bot) |
