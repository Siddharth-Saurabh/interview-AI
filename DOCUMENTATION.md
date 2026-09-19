# InterviewAI — Platform Documentation & Architectural Manual 📘

> **Production-Grade MERN Stack AI Mock Interview Platform with 2D Animated Avatar Video Calling, Monaco Code Studio, and In-Browser Computer Vision Telemetry.**

---

## 📑 Table of Contents

1. [Executive Summary](#-executive-summary)
2. [System Architecture & Data Flow](#-system-architecture--data-flow)
3. [Core Feature Breakdown](#-core-feature-breakdown)
   - [1. 📹 AI Video Call Studio & 2D Talking Avatars](#1--ai-video-call-studio--2d-talking-avatars)
   - [2. 👁️ Real-Time Computer Vision & Body Language Telemetry](#2-️-real-time-computer-vision--body-language-telemetry)
   - [3. 💻 Monaco Code Studio & Algorithmic Sandbox](#3--monaco-code-studio--algorithmic-sandbox)
   - [4. 🎙️ Dual-Engine Voice Synthesizer & Speech Recognition](#4-️-dual-engine-voice-synthesizer--speech-recognition)
   - [5. 🎯 4-Stage Hiring Pipeline Simulator](#5--4-stage-hiring-pipeline-simulator)
   - [6. 📊 Multi-Dimensional Competency & Scoring Rubric](#6--multi-dimensional-competency--scoring-rubric)
   - [7. 💳 Credits Gateway & Firebase Authentication](#7--credits-gateway--firebase-authentication)
4. [Component Hierarchy & Frontend Architecture](#-component-hierarchy--frontend-architecture)
5. [Backend API Reference & Schema Definitions](#-backend-api-reference--schema-definitions)
6. [Security, In-Browser Privacy & Proctoring](#-security-in-browser-privacy--proctoring)
7. [Installation, Environment Setup & Run Guide](#-installation-environment-setup--run-guide)

---

## 🌟 Executive Summary

**InterviewAI** is a full-stack, enterprise-grade mock interview simulator built on the **MERN** stack (MongoDB, Express.js, React 18, Node.js). Designed for software engineers preparing for top-tier tech roles, it replicates real-world hiring loops (Screening, Live Coding, System Design, Behavioral Bar Raiser).

### Key Differentiators:
- **Interactive 2D Animated AI Avatars**: Vector SVG character interviewers with dynamic lip-sync mouth animation, eye blinks, and responsive emotional expressions.
- **Client-Side Computer Vision Telemetry**: Real-time non-verbal presence analysis (Direct Eye Contact %, Posture Alignment, Composure, Gaze Distribution) computed 100% locally with zero video recording.
- **Embedded Monaco Code Editor**: Browser-based code execution sandbox with custom test cases, syntax highlighting, and Big-O runtime analysis.
- **Voice Synthesis & Transcription**: Real-time Speech-to-Text (STT) and persona-driven Text-to-Speech (TTS) audio narration.

---

## 🏗️ System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client ["Client (React 18 + Vite)"]
        AUTH[AuthPage / Firebase]
        SETUP[InterviewSetup & Persona Config]
        VID_ROOM[VideoInterviewRoom]
        AVATAR[2D Animated Avatar (SVG Lip-Sync)]
        VISION[Vision Telemetry (Canvas Frame Analyzer)]
        IDE[Monaco Code Editor Sandbox]
        TTS_STT[Web Speech TTS / STT Engine]
        FEEDBACK[AnswerFeedback Modal]
        REPORT[FinalReport & Vision Scorecard]
        HISTORY[HistoryAnalytics Dashboard]
    end

    subgraph Server ["Server (Node.js + Express 5)"]
        AUTH_MID[JWT & Firebase Auth Middleware]
        INT_CTRL[Interview Controller & Session Store]
        PAY_CTRL[Payment & Credit Controller]
        FALLBACK_CACHE[(In-Memory Session Map)]
    end

    subgraph External ["Cloud Infrastructure"]
        OPENROUTER[OpenRouter Multi-Model LLM Gateway]
        MONGO[(MongoDB Atlas Database)]
    end

    AUTH -->|Authenticate & Sync| AUTH_MID
    SETUP -->|Configure Session| INT_CTRL
    INT_CTRL -->|Synthesize Questions| OPENROUTER
    INT_CTRL -->|Persist Session Record| MONGO
    INT_CTRL -.->|Offline Recovery| FALLBACK_CACHE

    VID_ROOM --> AVATAR
    VID_ROOM --> VISION
    VID_ROOM --> IDE
    VID_ROOM --> TTS_STT

    VID_ROOM -->|Submit Response + Vision Telemetry| INT_CTRL
    INT_CTRL -->|Evaluate Answer & Big-O| OPENROUTER
    INT_CTRL -->|Update History & Scores| MONGO
    INT_CTRL --> FEEDBACK
    FEEDBACK --> REPORT
    HISTORY -->|Query User History| INT_CTRL
```

---

## 🚀 Core Feature Breakdown

### 1. 📹 AI Video Call Studio & 2D Talking Avatars
The Video Call Studio mimics modern conferencing tools (Google Meet / Zoom / Microsoft Teams).

- **2D Animated Vector Character**:
  - **Dynamic Lip-Sync**: Syllable and sound-wave-driven mouth shape cycling (`wide-O`, `open-smile`, `articulate`, `neutral`) during active question narration.
  - **Natural Eye Blinking & Head Tilt**: Random interval eye blinks and attentive head tilts when listening to candidate answers.
  - **4 Selectable Interviewer Personas**:
    1. 👔 **Alex Rivera** (*Lead Architect*) — Technical deep-dives & distributed systems.
    2. 👑 **Sarah Chen** (*VP of Engineering*) — Strategic architecture & high-level decision making.
    3. 🔬 **David Miller** (*Senior Staff SDE*) — Algorithms, concurrency & low-level performance.
    4. 🤝 **Elena Rostova** (*Director of Talent*) — STAR behavioral framework & culture fit.
- **Meeting Room View Modes**:
  - **Split Grid**: Side-by-side equal tiles for 2D Interviewer Avatar and Candidate Webcam.
  - **Code Studio**: Video conference panel docked next to the live Monaco Code Editor.
  - **Spotlight View**: Focus on interviewer stage with candidate self-preview.
- **Floating Meeting Toolbar**:
  - Mic Mute / Unmute (`Alt + M`)
  - Camera Toggle (`Alt + V`)
  - Subtitles / Closed Captions On/Off
  - Switch Interviewer Avatar on the fly
  - Submit Answer (`Ctrl + Enter`)
  - End Call Button

---

### 2. 👁️ Real-Time Computer Vision & Body Language Telemetry
Computed **100% locally in-browser** via an HTML5 canvas processing loop running at ~12 FPS.

```
[Webcam Stream] ──> [HTML5 Canvas Offscreen Analyzer] ──> [Feature Detection]
                                                              │
   ┌──────────────────────────────────────────────────────────┴───────────────────────────┐
   ▼                                                          ▼                           ▼
[Eye Contact % & Gaze]                             [Posture Alignment]          [Composure & Stability]
- Vector to camera center                          - Head Y-centroid (slouch)   - Frame-to-frame jitter
- Gaze: Center, Left, Right, Down                  - Head X-offset (centering)  - Expression symmetry
```

- **Live Vision HUD Overlay**:
  - Renders real-time telemetry metrics directly over the candidate video tile.
  - Actionable micro-coaching tips (e.g. *"Great eye contact"*, *"Center face in frame"*, *"Upright posture maintained"*).
- **Session Aggregate Dossier**:
  - Eye Contact Percentage (e.g. 92%)
  - Posture Score (0–100)
  - Composure Index (1–10)
  - Head Stability Score (0–100)
  - Gaze Attention Breakdown (`Center`, `Left`, `Right`, `Down`)

---

### 3. 💻 Monaco Code Studio & Algorithmic Sandbox
- **Industry Standard Editor**: Powered by `@monaco-editor/react` (the engine behind VS Code).
- **Multi-Language Support**: JavaScript (Node.js), TypeScript, Python 3, Java, C++.
- **Interactive Sandbox Execution**:
  - In-browser execution with output console and error boundary.
  - Pre-populated LeetCode-style test cases (`input`, `expectedOutput`, `description`).
- **AI Big-O Complexity Scoring**:
  - Automatic evaluation of **Time Complexity** (e.g., $O(N \log N)$) and **Space Complexity** (e.g., $O(1)$).
  - Benchmark 10/10 optimal solutions provided after each question.

---

### 4. 🎙️ Dual-Engine Voice Synthesizer & Speech Recognition
- **Text-to-Speech (TTS)**: Web Speech Synthesis with persona-based pitch and speech rate modulation.
- **Speech-to-Text (STT)**: Continuous speech recognition streaming directly into editable text transcripts.
- **Clarity & Verbal Filler Telemetry**:
  - Real-time detector for common filler words (`um`, `uh`, `like`, `basically`, `actually`, `literally`).
  - Active voice timer measuring speech fluency and word-per-minute pace.
- **Web Audio Sound Effects**: Native synthesized audio chimes for microphone toggle, answer evaluation, and stage completions.

---

### 5. 🎯 4-Stage Hiring Pipeline Simulator

| Stage | Round Title | Focus Areas | Key Output |
| :--- | :--- | :--- | :--- |
| **Round 1** | **Live Coding & Algorithms** | Data Structures, LeetCode Challenges, Edge Cases | Code Sandbox + Big-O Analysis |
| **Round 2** | **Technical Screening** | Async event loops, language internals, security, debugging | Concept scoring + Model answers |
| **Round 3** | **System Design & Architecture** | Distributed scaling, sharding, caching, microservices, SPOFs | Architectural trade-offs + Scalability |
| **Round 4** | **Behavioral & Bar Raiser** | Executive STAR framework, leadership, conflict resolution | Communication clarity + Hiring signal |

---

### 6. 📊 Multi-Dimensional Competency & Scoring Rubric

Every candidate answer is evaluated against 6 core hiring competencies:
1. **Technical Knowledge & Depth** ($1-10$)
2. **Code Quality & Algorithmic Efficiency** ($1-10$)
3. **Communication & Articulation** ($1-10$)
4. **Problem Solving & Systematic Logic** ($1-10$)
5. **Answer Structure & Clarity** ($1-10$)
6. **Non-Verbal Confidence & Composure** ($1-10$)

**Hiring Decision Recommendation**:
- **Strong Hire / FAANG Tier**: Score $\ge 8.5$
- **Hire / Production Ready**: Score $7.0 - 8.4$
- **Borderline / Needs Polish**: Score $5.5 - 6.9$
- **Foundational Review Needed**: Score $< 5.5$

---

### 7. 💳 Credits Gateway & Firebase Authentication
- **Authentication**: Firebase Authentication supporting Google One-Tap Sign-In and Email/Password credentials, secured with JWT session tokens.
- **Credit Metering**: Each mock interview session costs 10 credits.
- **Payment Top-Up**: Razorpay checkout integration with instant credit crediting and local testing fallback.

---

## 📁 Component Hierarchy & Frontend Architecture

```
client/src/
├── App.jsx                     # Root application router & state manager
├── main.jsx                    # React 18 DOM root mount point
├── index.css                   # Global glassmorphism design tokens & keyframes
├── components/
│   ├── Navbar.jsx              # App header with credits meter & navigation
│   ├── AuthPage.jsx            # Full-page login & registration screen
│   ├── InterviewSetup.jsx      # Mode, Persona, Round & Tech stack configurator
│   ├── VideoInterviewRoom.jsx  # 2D Avatar Video Call Studio with Camera feed
│   ├── Avatar2D.jsx            # Vector animated 2D talking avatar component
│   ├── VisionHUD.jsx           # Live eye contact & posture HUD overlay
│   ├── InterviewRoom.jsx       # Classical text/audio mock interview room
│   ├── CodeEditor.jsx          # Monaco code editor sandbox & test runner
│   ├── AnswerFeedback.jsx      # Per-question AI critique & follow-up modal
│   ├── FinalReport.jsx         # Executive dossier, Vision breakdown & PDF print
│   ├── HistoryAnalytics.jsx    # User session history & performance dashboard
│   └── PricingModal.jsx        # Credit recharge & payment modal
├── hooks/
│   ├── useSpeechRecognition.js # Web Speech Recognition continuous STT hook
│   └── useTextToSpeech.js      # Web Speech Synthesis persona-based TTS hook
└── utils/
    ├── visionTelemetry.js      # Client-side computer vision tracking engine
    └── soundEffects.js         # Web Audio API chime & sound FX synthesizer
```

---

## 🔌 Backend API Reference & Schema Definitions

### 1. `POST /api/interview/generate`
Generates structured AI interview questions based on role, round, and tech stack.

**Request Payload:**
```json
{
  "role": "Full Stack MERN Developer",
  "level": "Mid-Level",
  "techStack": ["React", "Node.js", "MongoDB"],
  "interviewType": "Live Coding",
  "mode": "video",
  "avatarId": "alex",
  "interviewerPersonality": "Professional",
  "questionCount": 5,
  "durationMinutes": 15
}
```

**Response Payload:**
```json
{
  "success": true,
  "interviewId": "6aa99781125b89dd75829c28",
  "data": {
    "title": "Mid-Level Full Stack MERN Developer Assessment",
    "overview": "Rigorous live coding challenges covering algorithmic design.",
    "interviewerGreeting": "Hello! I'm your AI Lead Technical Interviewer today...",
    "questions": [...]
  },
  "mode": "video",
  "remainingCredits": 90
}
```

---

### 2. `POST /api/interview/evaluate`
Evaluates candidate code or verbal response, generating score, Big-O analysis, strengths, improvements, and adaptive follow-up.

**Request Payload:**
```json
{
  "interviewId": "6aa99781125b89dd75829c28",
  "questionIndex": 0,
  "question": "Implement an LRU Cache with O(1) operations.",
  "userAnswer": "class LRUCache { ... }",
  "answerMode": "code",
  "language": "javascript",
  "responseTime": 180,
  "fillerWordCount": 2,
  "visionReport": {
    "eyeContactPercentage": 92,
    "postureScore": 90,
    "composureScore": 8.6,
    "headStabilityScore": 94
  }
}
```

---

### 3. `GET /api/interview/history`
Returns paginated list of candidate completed and in-progress sessions.

---

### 4. `POST /api/payment/verify` & `POST /api/payment/create-order`
Creates Razorpay checkout orders and verifies signatures to credit user balances.

---

## 🔒 Security, In-Browser Privacy & Proctoring

- **100% In-Browser Video Privacy**: All webcam video streams and computer vision frame analysis are processed strictly within browser RAM via HTML5 `<canvas>`. No raw video frames, images, or biometric vectors are ever stored or transmitted to external servers.
- **JWT & HTTP Authorization**: API endpoints require `Authorization: Bearer <token>` verified with `jsonwebtoken`.
- **Sanitized AI Parsing**: AI prompt generation employs schema validation and Markdown code fence stripping to prevent prompt injection.

---

## ⚙️ Installation, Environment Setup & Run Guide

### Prerequisites
- Node.js `v18.0+`
- MongoDB Atlas or Local MongoDB instance
- OpenRouter API Key

### 1. Environment Configuration

**Server Environment (`server/.env`):**
```env
PORT=8000
MONGO_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/interviewai
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=super_secret_interviewai_jwt_token_key_2025
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx
```

**Client Environment (`client/.env`):**
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=interviewai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=interviewai
```

### 2. Running Locally

**Start Backend Server:**
```bash
cd server
npm install
npm run dev
# Server running on http://localhost:8000
```

**Start Frontend Client:**
```bash
cd client
npm install
npm run dev
# Client running on http://localhost:5173
```

---

*InterviewAI • Built with React, Node.js, Express, MongoDB, OpenRouter & Firebase.*
