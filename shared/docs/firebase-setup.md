# Firebase Setup Guide for Agent Team

**Created:** 2026-04-03

---

## 🚀 Quick Firebase Setup

### 1. Create Firebase Project
```
1. Go to: https://console.firebase.google.com
2. Click "Add project"
3. Name it: "agent-team" or "your-team-name"
4. Disable Google Analytics (optional)
5. Click "Create project"
```

### 2. Enable Services

#### Hosting
```
1. Click "Hosting" in sidebar
2. Click "Get started"
3. Follow the setup wizard
4. Install CLI: npm install -g firebase-tools
```

#### Storage
```
1. Click "Storage" in sidebar
2. Click "Get started"
3. Select "Start in test mode"
4. Choose location (US or closest to you)
```

#### Firestore (Database)
```
1. Click "Firestore" in sidebar
2. Click "Create database"
3. Select "Start in test mode"
4. Choose location
```

### 3. Connect to CLI
```bash
# Login to Firebase
firebase login

# Initialize in project folder
cd C:\Users\Jarvis\AppData\Roaming\memu-bot\agent-team
firebase init

# Select:
# - Hosting
# - Storage
# - Firestore
```

---

## 📁 Firebase Folder Structure

```
agent-team/
├── firebase.json
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
└── public/
    ├── index.html
    ├── projects/
    │   ├── pepperclaw/
    │   └── nerve/
    ├── shared/
    │   ├── docs/
    │   └── scripts/
    └── releases/
```

---

## 🔥 Firebase API Keys

After setup, add these to your agents:

### For Hermes/MJ bots:

```javascript
// Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 🌐 Live URL

After deploying:
```
https://YOUR_PROJECT.web.app
https://YOUR_PROJECT.firebaseapp.com
```

---

## 🚢 Deploy Commands

```bash
# Deploy everything
firebase deploy

# Deploy just hosting
firebase deploy --only hosting

# Deploy just storage rules
firebase deploy --only storage
```

---

## 📱 Use Cases

### For PepperClaw:
- Host the landing page
- Store agent avatars/images
- Store user data in Firestore

### For Nerve Dashboard:
- Host the dashboard publicly
- Real-time updates via Firestore

### For Hermes/MJ:
- Store/retrieve shared files
- Store project configs

---

## 🔒 Security Rules

### Firestore Rules (firestore.rules)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Change for production!
    }
  }
}
```

### Storage Rules (storage.rules)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // Change for production!
    }
  }
}
```

---

## 📞 Firebase Console

https://console.firebase.google.com

---

**Set up Firebase and share links worldwide!** 🌐🌶️
