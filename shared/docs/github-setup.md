# GitHub Setup Guide for Agent Team

**Created:** 2026-04-03

---

## 📋 Required Repositories

Create these repos on GitHub:

1. **agent-team-hub** - Main hub website
2. **pepperclaw-app** - Real Estate SaaS
3. **nerve-dashboard** - Command Center
4. **hermes-config** - Hermes bot config
5. **mj-config** - MJ bot config

---

## 🚀 Quick Setup

### 1. Create GitHub Token
```
1. Go to github.com/settings/tokens
2. Generate new token (classic)
3. Select: repo, workflow, packages
4. Copy token
```

### 2. Initialize Local Repos
```bash
# Navigate to agent-team
cd C:\Users\Jarvis\AppData\Roaming\memu-bot\agent-team\projects

# Initialize pepperclaw
git init
git add .
git commit -m "Initial PepperClaw commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pepperclaw-app.git
git push -u origin main
```

### 3. Link Existing Repos
```bash
# Link pepperclaw
mklink /J pepperclaw C:\Users\Jarvis\AppData\Roaming\memu-bot\workspace\pepperclaw

# Link nerve
mklink /J nerve C:\Users\Jarvis\AppData\Roaming\memu-bot\workspace\nerve-dashboard
```

---

## 🌐 GitHub Pages Setup

### For Each Repo:
```
1. Go to repo Settings
2. Pages → Source: main branch
3. Select /docs or /public folder
4. Save
5. Site live at: https://username.github.io/repo-name
```

---

## 🔗 Useful Links

- GitHub: https://github.com
- Create Token: https://github.com/settings/tokens
- Your Profile: https://github.com/msitarzewski

---

## 📁 Repo Structure

```
pepperclaw-app/
├── public/           # Static files (for GitHub Pages)
├── src/             # Source code
├── docs/            # Documentation
├── README.md        # Project readme
└── LICENSE          # MIT License
```

---

## 🚢 Deployment

### Deploy to GitHub Pages
```bash
git add .
git commit -m "Update"
git push
# Site updates in ~2 minutes
```

### Deploy to Firebase
```bash
firebase deploy --only hosting
# Site live immediately
```

---

**Sync your code with GitHub!** 🌶️
