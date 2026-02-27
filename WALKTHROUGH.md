# LinkedIn Outreach Extension — Walkthrough

## What Was Built

A fully functional Chrome extension (**OutreachAI**) that scrapes LinkedIn profiles, finds emails via Hunter.io, generates personalized outreach with Gemini AI, and sends via Gmail — all from one popup. Uses dummy data fallbacks for all APIs.

## Project Structure

```
linkedin-outreach-extension/
├── manifest.json              ← Manifest V3 config
├── icons/
│   ├── icon16.png, icon48.png, icon128.png
├── content/
│   ├── profile-scraper.js     ← Scrapes LinkedIn profiles
│   └── job-scraper.js         ← Scrapes job postings
├── popup/
│   ├── popup.html             ← Main UI
│   ├── popup.css              ← Dark theme
│   └── popup.js               ← Orchestration logic
├── options/
│   ├── options.html           ← Settings page
│   ├── options.css            ← Settings theme
│   └── options.js             ← Save/load settings
├── utils/
│   ├── ai.js                  ← Gemini AI (+ dummy fallback)
│   ├── hunter.js              ← Hunter.io email finder (+ dummy)
│   └── gmail.js               ← Gmail send (+ dummy)
└── background/
    └── service-worker.js      ← OAuth + Gmail proxy
```

## Key Features

| Feature | Status | Notes |
|---|---|---|
| Profile scraping | ✅ Ready | Scrapes name, headline, about, experience, education, skills |
| Job scraping | ✅ Ready | Auto-detects role + company from job postings |
| Hunter.io email lookup | ✅ Dummy mode | Returns realistic fake emails when no API key |
| Gemini AI message gen | ✅ Dummy mode | Generates template messages when no API key |
| Gmail send | ✅ Dummy mode | Logs to console when no OAuth token |
| Dual outreach modes | ✅ Ready | Job Application + Networking toggle |
| Tone selection | ✅ Ready | Professional / Semi-casual / Casual |
| Configurable profile | ✅ Ready | Name, role, company, education, skills, summary |
| Dark theme UI | ✅ Ready | Gradient accents, glow effects, animations |

## How to Load & Test

### Step 1: Load the Extension
1. Open Chrome → navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select folder: `C:\Users\gopav\.gemini\antigravity\scratch\linkedin-outreach-extension`

### Step 2: Test the Popup (Dummy Mode)
1. Click the extension icon in Chrome toolbar
2. Fill in any name/headline/company in the Profile Data fields
3. Toggle between **Job Application** and **Networking** modes
4. Click **Generate Message** → a dummy personalized message appears
5. Click **Find** next to email → a dummy email is generated
6. Click **Send Email** → dummy send logged to console (F12 → Console)

### Step 3: Configure Settings
1. Right-click extension icon → **Options** (or click gear icon in popup)
2. Fill in your profile info (name, role, company, education, skills, summary)
3. Click **Save Settings**

### Step 4: When Ready with Real APIs
Replace these in Settings:
- **Gemini API Key** → from [Google AI Studio](https://aistudio.google.com/)
- **Hunter.io API Key** → from [Hunter.io](https://hunter.io/)
- **Gmail OAuth** → set up in [Google Cloud Console](https://console.cloud.google.com/) and update `manifest.json` with your OAuth client ID
