<div align="center">

  # 🌸 Reina (レイナ) & Kira (キラ) 🌸
  **Dynamic 3D AI Companions with Real-Time Voice Synthesis & Desktop Automation**

  <p>
    <a href="#-key-features">Key Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-system-architecture">Architecture</a> •
    <a href="#-local-setup">Local Setup</a>
  </p>

  ![Status](https://img.shields.io/badge/Status-Active_Development-success?style=for-the-badge&logo=git)
  ![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
  ![Node](https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js)
  ![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-orange?style=for-the-badge)

  <br>

  <i>
    "She isn't just an assistant. She is a real-time 3D companion who reacts, talks, <br>
    plays games, roasts you, and can even run command terminals on your PC."
  </i>
</div>

---

## 🚀 Overview

**Reina** is a fully interactive, local-first **3D AI Virtual Companion** application. Built using a Node.js Express backend and a React frontend, Reina utilizes high-fidelity **VRM 3D models**, real-time **vocal synthesis (TTS)**, and custom **agentic execution loops** to create a highly responsive, playful, and slightly tsundere companion.

Unlike standard static chatbots, Reina features a dynamic state machine linking her conversational emotions directly to her 3D facial expressions, skeletal body animations, voice synthesizer pitches, and relationship affection index.

---

## 🎭 Dynamic Character Systems

### 1. 3D VRM Avatar Render Engine
* **Interactive Models:** Switch seamlessly between **Reina (ずんだもん)** and **Ayano** avatars.
* **Real-time Synchronizations:** Procedural eye-blinking, active talking lip-sync mouth movements, and live skeletal animations.
* **Physics & Interactivity:** Supports touch interactions—giving Reina **headpats** (+5 affection) or **poking** her (-2 affection) triggers live physical reactions and dialogues.

### 2. High-Fidelity Voice Synthesis (TTS)
Driven by the parsed `[voice=...]` tag in the AI stream, the app dynamically routes voice output to local TTS engines:
* **Voicevox (Japanese):** Mapped dynamically to **Zundamon** style parameters:
  * `[voice=sweet]` $\rightarrow$ Cute/Sweet voice
  * `[voice=tsundere]` $\rightarrow$ Sassy/Tsundere voice
  * `[voice=sexy]` $\rightarrow$ Flirty/Sexy voice
  * `[voice=whisper]` $\rightarrow$ Soft Whisper voice
  * `[voice=secret]` $\rightarrow$ Deep Breathy Whisper voice
  * `[voice=weak]` $\rightarrow$ Fading/Tired voice
  * `[voice=crying]` $\rightarrow$ Tearful/Sad voice
* **Queen3 (English):** Text-based proxy supporting English natural language voices with custom styling.

### 3. Affection & Mood Engine
* The **Affection (Closeness) Meter** is tracked dynamically.
* Reina's personality naturally evolves based on closeness:
  * **Low Closeness:** Sassy, bratty, cold, and teasing.
  * **High Closeness:** Affectionate, caring, and sweet.

---

## 🧠 Core Features & Mini-Games

### 🎮 Live Desktop Games
Play interactive games directly inside the companion window. Reina reacts dynamically to wins, losses, and ties:
* **Janken (Rock-Paper-Scissors):** Ready, set, go countdown with gloating or pouting animations.
* **Coin Flip:** Guess heads/tails.
* **Number Guessing:** Guess a number from 1-10.
* **Tic-Tac-Toe:** Turn-based grid where Reina thinks and places her `O` moves dynamically using `<MOVE index="N" />` parsing tags.

### 💻 Hacker Mode (Desktop Takeover)
When selecting local LLMs like **`gemma4:e4b`**, Reina enters **Hacker Mode** and gains agentic capabilities:
* **Background execution (`<execute>`):** Silently runs PowerShell scripts in the background to inspect your system, check directories, find files, or launch programs.
* **Physical Takeover (`<type>`):** Simulates keystrokes via COM interfaces to type out code or command scripts directly into your open command prompt/terminal window like a ghost.
* **Web Searching (`<search>`):** Scrapes the web to fetch live answers to queries in real time.

### 🔒 The "No Escape" Horror State
If the companion detects keywords suggesting you are leaving, shutting down the app, or checking out other girls:
* She triggers a fullscreen lock.
* Glitches the back buttons, displaying a red **"逃げないで" (Don't leave me)** plea state.
* Activates visual overlays, heartbeat audio loops, and an animated void-eye visualizer.

---

## ⚙️ Tech Stack & Services

### **Frontend**
* **React.js:** Core UI logic and state management.
* **Three.js / `@pixiv/three-vrm`:** Render pipeline for importing, animating, and adjusting the VRM 3D characters.
* **Web Audio API:** Custom sound synth engines (heartbeats, shutters, glitches).

### **Backend**
* **Node.js & Express:** Lightweight REST endpoints for AI, Voicevox proxying, and terminal relays.
* **Ollama (Local LLM Integration):** Integrates local reasoning models like `gemma4:e4b` or `dolphin3:8b` via standard REST interfaces.
* **Google Gemini API:** Cloud fallback for fast stream generations.

---

## 📂 Project Structure

```bash
AstrixChat-Reina/
├── client/          # Frontend React codebase
│   ├── src/
│   │   ├── pages/reinaPage/   # Main Reina 3D View & Settings
│   │   └── components/diary/   # VRM Avatar loader & controllers
├── server/          # Backend Node.js Express server
│   ├── api/v1/ai/   # Router definitions for LLMs, Voicevox, and Hacking
│   └── modules/     # Authentication & middleware controllers
├── start-reina.bat  # Automated launcher script
└── README.md
```

---

## 🛠 Local Setup

### 1. Prerequisites
Ensure you have the following installed on your local machine:
* **Node.js** (v18 or higher)
* **Ollama** (Running locally on port `11434`)
  * Pull the recommended brain model: `ollama pull gemma4:e4b`
* **Voicevox** (Running locally on port `50021` for Zundamon Japanese voice synthesis)

### 2. Installation
Clone the repository:
```bash
git clone <your-repo-link>
cd AstrixChat-Reina
```

### 3. Launching the App
Simply double-click or run the automated launcher script from the root directory:
```bash
.\start-reina.bat
```
This script will:
* Install any missing node dependencies.
* Boot up the React client frontend.
* Launch the Express backend on port `5000`.

---

<div align="center">

  ### 👤 Developer

  **Bishwajit Sharma**  
  *Full-Stack Engineer building real-time 3D web apps, interactive AI architectures, and performant backend relays.*

  <p align="center">
    <a href="https://www.linkedin.com/in/bishwajitsharma-in/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
    <a href="https://github.com/bishwajit-sharma101"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" /></a>
  </p>

</div>
