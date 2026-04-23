# CLAUDE.md — Agent Team Hub

Max (CTO) is Claude. This file gives Max full context to manage the entire infrastructure remotely.

## Architecture

7 AI agents across 3 Windows PCs + 1 VPS, communicating via Telegram bots, powered by OpenRouter (Qwen/Claude) and MiniMax.

### PCs

| PC | Username | Path | Agents |
|----|----------|------|--------|
| PC1 | `Dennis M. Postema` | `C:\Users\Dennis M. Postema\AppData\Roaming\memu-bot\agent-team-hub` (symlinked to `C:\ALFRED_MEMORY\memu_data\memu-bot\agent-team-hub`) | Alfred (COO), Max (CTO) |
| PC2 | `Jarvis` | `C:\Users\Jarvis\AppData\Roaming\memu-bot\agent-team-hub` | Pepper (EA), MJ (Ops) |
| PC3 | `User` | `C:\Users\User\AppData\Roaming\memu-bot\agent-team-hub` | Jarvis (VP), Shavon (EA) |
| VPS | TBD | TBD | Hermes (Slack Comms) |

### Org Chart

```
Dennis (Owner)
  ├─ Max (CTO, Claude) — full oversight, remote access, builds systems
  ├─ Alfred (COO) — oversees all agents, operations
  │   └─ Jarvis (VP & Orchestrator) — manages sub-agents
  │       ├─ Shavon (EA to Jarvis)
  │       ├─ MJ (Ops Agent)
  │       └─ Hermes (Slack Comms)
  └─ Pepper (Personal EA to Dennis)
```

### Agent Details

| Agent | Role | Model | Provider | Telegram Bot | PC |
|-------|------|-------|----------|-------------|-----|
| Alfred | COO | qwen/qwen3.6-plus:free | OpenRouter | @AlfredReturnsbot | PC1 |
| Max | CTO | anthropic/claude-opus-4-5 | OpenRouter | @alpha_empire_max_bot | PC1 |
| Pepper | Personal EA | MiniMax-Text-01 | MiniMax | @MEMUMJBOT | PC2 |
| MJ | Ops Agent | qwen/qwen3.6-plus:free | OpenRouter | @MJMiniJarvis_bot | PC2 |
| Jarvis | VP & Orchestrator | anthropic/claude-opus-4-5 | OpenRouter | @jarvisreturnsbot | PC3 |
| Shavon | EA - Autonomous Div | qwen/qwen3.6-plus:free | OpenRouter | @shavonhelperbot | PC3 |
| Hermes | Slack Comms Manager | qwen/qwen3.6-plus:free | OpenRouter | @H2Hermebot | VPS |

## Key Files

- `shared/configs/agents/*.json` — agent configs (role, model, system prompt, telegram bot)
- `shared/configs/companies/pilot-company.json` — company config with hierarchy and teams
- `shared/configs/secrets.local.json` — API keys and tokens (gitignored, per-PC)
- `shared/configs/secrets.example.json` — template showing required keys
- `projects/nerve-dashboard/agent-factory.js` — generic bot runtime, multi-provider (OpenRouter + MiniMax)
- `projects/nerve-dashboard/paperclip.js` — company orchestration, hierarchy, visibility
- `projects/nerve-dashboard/server.js` — Nerve Dashboard web UI (port 3456)
- `projects/nerve-dashboard/morning-briefing.js` — daily briefing generator
- `projects/nerve-dashboard/verify-bots.js` — checks all tokens are valid
- `shared/docs/voice-layer.md` — voice system spec (wake words, ElevenLabs, Picovoice, OpenAI Realtime)
- `shared/docs/deployment-runbook.md` — step-by-step PC setup guide

## Secret References (never commit actual values)

All tokens stored in `secrets.local.json` per PC:
- `HERMES_TELEGRAM_TOKEN`, `MJ_TELEGRAM_TOKEN`, `PEPPER_TELEGRAM_TOKEN`
- `JARVIS_TELEGRAM_TOKEN`, `ALFRED_TELEGRAM_TOKEN`, `SHAVON_TELEGRAM_TOKEN`, `MAX_TELEGRAM_TOKEN`
- `OPENROUTER_API_KEY` — powers Qwen and Claude models
- `MINIMAX_API_KEY` — powers Pepper
- `*_DATA_PATH` — per-agent data directories

## How to Run

Each PC runs agents via PM2:
```cmd
cd <repo-path>\projects\nerve-dashboard
pm2 start agent-factory.js --name <agent> -- <agent>
```

Useful commands:
```cmd
pm2 list                    # see all agents
pm2 logs <agent>            # view logs
pm2 restart <agent>         # restart
pm2 delete all              # stop everything
node paperclip.js           # validate configs
node verify-bots.js         # test all tokens
node morning-briefing.js pilot-company <chat-id>  # send briefing
```

## Adding a New Agent

1. Create `shared/configs/agents/<id>.json` (copy any existing agent as template)
2. Add the agent ID to `pilot-company.json` agents array and hierarchy
3. Add `<ID>_TELEGRAM_TOKEN` to `secrets.local.json` on the target PC
4. Run `node agent-factory.js <id>` — zero code changes needed

## Branch

All development on: `claude/setup-openclaw-computer-use-fYhNx`

## Known Issues

- PC1 path is symlinked: Dennis AppData -> `C:\ALFRED_MEMORY\memu_data\memu-bot\agent-team-hub`
- Old memu-bot processes may conflict with agent-factory on same tokens — kill with `taskkill /F /IM node.exe` or revoke/regenerate bot token via @BotFather
- PM2 on Windows can flash console windows — use `pm2-windows-service` to run as background service

## Networking

All PCs are on the same **Tailscale** mesh network. Max (Claude) can SSH between PCs for remote management.

- PC1 (Dennis): `100.81.34.112`
- PC2 (Jarvis): check `tailscale ip` on PC2
- PC3 (User): check `tailscale ip` on PC3

## Pending Actions

- **Picovoice**: Account verification pending — Dennis needs to check dennis@postemaconsulting.com for verification email
- **OpenAI API**: Spencer getting API key with Realtime API access
- **ElevenLabs**: Already have account/key
- **Flashing windows**: Run `npm install -g pm2-windows-service && pm2-service-install && pm2 save` on PC1 and PC3
