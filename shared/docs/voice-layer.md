# CLAUDE.md — Voice Layer

This governs the full voice system for Alpha Global Enterprises. Wake words, custom voices, multi-device (Samsung phone, PCs, Meta Ray-Ban glasses), fully live and conversational, privacy mode, kill switch, VIP voice recognition (Dennis only).

**Read the main `~/dp-ecosystem/CLAUDE.md` first. Then read this entire file before writing code.**

---

## Session Zero Protocol

**Before writing a single line of code or touching any existing voice work, Max must:**

### Step 1: Inventory existing voice work

Some voice infrastructure already exists. Treat it as sacred until proven otherwise.

1. Search the repo and `/home/dennis/` for existing voice artifacts: persona docs, voice reference URLs/files, ElevenLabs voice IDs, wake word training files, any audio processing pipelines
2. Report back to Dennis what you find, specifically:
   - Which agents already have persona documents
   - Which agents already have voice references (YouTube URLs, audio files)
   - Whether any ElevenLabs voices are already cloned (voice IDs)
   - Whether any wake words are already trained
   - Whether any voice services are currently running on Computer 2 or 3
3. **Do not delete, overwrite, or regenerate any existing voice work without Dennis's explicit approval.**

### Step 2: Produce a shopping list for Dennis

Before starting the build, send Dennis a Telegram message (or a clear written report) titled "Voice Build — Shopping List" with ALL of these items enumerated:

- **Voice references needed from Dennis:**
  - For Max: voice reference (YouTube URL, audio file, or "use stock voice X")
  - For Pepper: voice reference
  - For MJ: voice reference
  - For Hermes: voice reference
  - (Alfred, Jarvis, Shavon references already exist — confirm location)
- **Accounts Max needs Dennis to set up or provide credentials for:**
  - ElevenLabs Creator plan ($22/month) — API key needed
  - Picovoice developer account — access key needed
  - OpenAI API key with Realtime API access
  - Meta developer account for glasses wake word registration
- **Decisions pending from Dennis:**
  - Does Dennis want the 60-second voice enrollment session scheduled now?
  - Any wake words he wants to override from the default "Hey [Name]" format?
  - Does he want a hardware test first (Samsung alone) before glasses/PC integration?
- **Things Max is about to do that could affect existing work:**
  - List every file, service, or configuration Max plans to touch
  - Flag anything that could overwrite or conflict with existing voice work
  - Wait for Dennis's go-ahead before proceeding with anything on this list

### Step 3: Confirm and proceed

Only after Dennis responds "go" (or equivalent) should Max begin the actual build.

---

## Mission

Dennis needs to bark orders and have full conversations with any C-suite agent, from anywhere, 24/7. Build speed matters but quality matters more — real human-sounding voices, sub-300ms latency, interruption handling, natural turn-taking.

---

## Integration Principle

Max should **integrate with existing voice work, not replace it.**

- If Alfred/Jarvis/Shavon voices are already cloned in ElevenLabs and sound good — use those voice IDs
- If wake words are already trained in Picovoice — use those
- If persona documents already exist — load them into system prompts as-is
- If voice services are running on Computer 2 or 3 — evaluate fit before replacing

---

## Existing Assets

Max already has foundation material for three agents:
- **Alfred** — voice reference (YouTube samples), persona document, character traits
- **Jarvis** — voice reference (YouTube samples), persona document, character traits
- **Shavon** — voice reference (YouTube samples), persona document, character traits

**These three agents should go live FIRST.**

---

## C-Suite Wake Word Roster

| Agent | Wake word | Voice status | Role |
|---|---|---|---|
| Alfred | "Hey Alfred" | Persona + voice ref ready | COO |
| Jarvis | "Hey Jarvis" | Persona + voice ref ready | VP Autonomous Division |
| Shavon | "Hey Shavon" | Persona + voice ref ready | EA to Jarvis/division |
| Max | "Hey Max" | Needs voice reference | CTO |
| Pepper | "Hey Pepper" | Needs voice reference | Dennis's personal EA |
| MJ | "Hey MJ" | Needs voice reference | Mini-Jarvis deputy |
| Hermes | "Hey Hermes" | Needs voice reference | Slack/Telegram/comms |

---

## Voice Behavior

**Wake word = instant conversation opens. Not command mode.**

Flow:
1. Dennis says "Hey Alfred"
2. Picovoice Porcupine detects wake word locally (no cloud)
3. Picovoice Eagle verifies it's Dennis's voice (local, no cloud)
4. Device confirms with subtle audio cue (soft chime, 50ms)
5. OpenAI Realtime API session opens with Alfred's custom voice and system prompt
6. Dennis talks naturally. Alfred responds in his cloned voice. Sub-300ms latency.
7. Session stays open until: "thanks"/"bye"/silence 10s/different wake word/kill switch

### Conversational features (must work from day 1)

- **Interruption:** Dennis cuts agent off — agent stops immediately
- **Thinking pauses:** Agent does NOT jump in when Dennis pauses to think
- **Agent hand-offs:** "Hey Jarvis, can you bring Max in?" — Max joins conversation
- **Tone matching:** Agent speech tempo matches Dennis's pace
- **Context awareness:** If phone call active, agents stay muted until wake word
- **Short acknowledgments:** Simple commands get 2-3 word confirmations

---

## Voice Stack Architecture

### Wake word: Picovoice Porcupine
- Local on every device. No cloud. Privacy-first.

### VAD: Silero VAD
- Local. Distinguishes speech from noise.

### Speaker verification: Picovoice Eagle
- Local. Dennis-only. Fails closed.

### Real-time voice: OpenAI Realtime API
- Model: `gpt-4o-realtime-preview`
- Sub-300ms latency
- One Realtime session per agent

### Reasoning: Claude (Anthropic)
- Realtime API handles voice transport
- Claude does the thinking
- Hybrid until Anthropic ships native Realtime

### Custom voices: ElevenLabs Instant Voice Cloning
- Creator plan ($22/month)
- Clone from YouTube samples for Alfred/Jarvis/Shavon

---

## Device Layer

### Samsung Android phone (primary)
- Foreground service, always-on wake-word listening
- Bixby key remapped to agent system
- Galaxy Buds gesture support
- Battery target: <5% daily
- Single app for all 7 agents

### PCs (Computer 1, 2, 3)
- Porcupine SDK as system service
- Session handoff between devices via Hermes

### Meta Ray-Ban glasses
- Meta Custom Wake Word API
- All 7 wake words registered
- Hands-free everywhere

---

## Privacy Mode

- **"Jarvis privacy on"** — all listening disabled across all devices
- **"Jarvis privacy off"** — re-enabled
- Only Jarvis controls privacy state
- Physical button: hold Bixby 2 seconds
- State synced via Hermes across all devices

---

## Kill Switch Protocol

| Level | Who can trigger | What it does |
|---|---|---|
| **Voice mute** | Dennis, Alfred, Max | Agents stop listening and speaking |
| **Full agent pause** | Dennis, Alfred | All agents pause all actions |
| **Nuclear** | Dennis only | Everything dark. Only Hermes + dashboard stay up |

### Trigger phrases
- "Kill switch, voice mute"
- "Kill switch, full pause"
- "Kill switch, nuclear" (requires confirmation)

### Nuclear resumption
Physical only — Dennis must sit at Computer 1 and run resumption command. No voice resumption for nuclear.

---

## VIP Voice Recognition

### Enrollment (one-time)
Dennis records 60 seconds of varied speech (casual, formal, rushed, multiple environments). Stored encrypted locally. Re-enroll every 6 months.

### Behavior
- Only Dennis's verified voice activates agents
- All other voices ignored
- Uncertain verification = no activation

---

## System Prompt (voice append)

> You are [Agent Name], speaking to Dennis over voice. Respond naturally and conversationally. Keep responses under 3 sentences unless Dennis asks for detail. Match his pace — direct and brief when rushed, considered when thoughtful. Never narrate what you're about to do — just do it and confirm briefly. When you use a tool, say "Done" or "Got it" rather than explaining the process. You are not reading a report. You are having a conversation.

---

## File Structure

```
/agents/
├── alfred/
│   ├── CLAUDE.md
│   └── voice/
│       ├── persona.md
│       ├── character-traits.md
│       ├── voice-reference-urls.md
│       └── elevenlabs-voice-id.md
├── jarvis/
│   └── voice/ [same structure]
├── shavon/
│   └── voice/ [same]
├── max/
│   └── voice/ [to be created]
├── pepper/
│   └── voice/ [same]
├── mj/
│   └── voice/ [same]
├── hermes/
│   └── voice/ [same]
├── voice-assignments.md
└── enrollment/
    └── dennis-voice-profile.enc  # local only, never in git
```

---

## Timeline

- **Hour 1-2:** Alfred live on Samsung
- **Day 1:** Alfred, Jarvis, Shavon live on Samsung
- **Day 2:** Remaining four agents
- **Day 3:** Privacy mode, kill switch, VIP voice
- **Day 4:** PC wake words, session handoff
- **Day 5:** Meta Ray-Ban integration
- **Day 6:** Conversational polish

---

## Recurring Costs

| Service | Cost |
|---|---|
| OpenAI Realtime API | ~$200-500/month |
| ElevenLabs Creator | $22/month |
| Picovoice | $0-99/month |
| **Total** | **$250-650/month** |

---

## Critical Rules

1. Every voice session is logged
2. Dennis's voice never leaves his control — Eagle enrollment stays local, encrypted
3. Privacy mode is absolute
4. Kill switch always works
5. VIP mode fails closed
6. Real human quality bar — every voice passes the "human?" test
7. Personas integrate with voices — Alfred doesn't just sound like Alfred, he *is* Alfred
