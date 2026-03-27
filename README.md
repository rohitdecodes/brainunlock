# 🧠 BrainUnlock

> Any topic. Three brains. Zero confusion.

A gamified AI-powered knowledge explainer that breaks down any topic at 3 levels — ELI5, College, and Expert.

![Deployed](https://img.shields.io/badge/Status-Live-brightgreen) ![AI](https://img.shields.io/badge/AI-Groq%20%2B%20Llama-purple)

---

## 🔥 Live Demo

🌐 **[brainunlock.vercel.app](https://brainunlock.vercel.app)**

---

## 🎮 Features

- **3-Level Explanations** — ELI5, College, Expert for any topic
- **XP System** — Earn XP every time you unlock knowledge
- **Level Progression** — 10 levels with increasing XP thresholds
- **Streak Multiplier** — Consecutive unlocks give up to 2x XP bonus
- **10 Achievements** — Unlock badges like First Blood, Galaxy Brain, Speed Runner
- **3 Modes** — All Levels, ELI5 Only, Expert Only
- **Particle System** — Live animated background
- **Retro HUD UI** — Cyberpunk aesthetic with scanlines and glow effects
- **Copy & Rate** — Copy any explanation, rate with 👍/👎

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python, Flask |
| AI Model | Llama 3.1 70B via Groq |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## 🚀 Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/rohitdecodes/brainunlock.git
cd brainunlock
```

### 2. Install dependencies
```bash
pip install flask flask-cors groq gunicorn python-dotenv
```

### 3. Add your API key
Create a `.env` file in the root:
```
GROQ_API_KEY=your_groq_key_here
```
Get your free key at [console.groq.com](https://console.groq.com)

### 4. Run the backend
```bash
python server.py
```

### 5. Open the frontend
Open `public/index.html` in your browser. Done.

---

## 📁 Project Structure
```
brainunlock/
├── public/
│   ├── index.html      ← Frontend UI
│   ├── style.css       ← Cyberpunk styling
│   └── script.js       ← Game logic + API calls
├── server.py           ← Flask backend
├── requirements.txt    ← Python dependencies
├── vercel.json         ← Vercel config
├── .env                ← API keys (never pushed)
└── .gitignore          ← Ignores .env
```

---

## 🎯 How It Works

1. User enters any topic
2. Frontend sends it to Flask backend
3. Flask calls Groq API with a structured prompt
4. Llama 3.1 returns JSON with 3 explanation levels
5. Frontend renders cards with animations + awards XP

---

## 🏆 Achievements

| Achievement | Condition |
|-------------|-----------|
| 🔓 First Blood | Unlock first explanation |
| 🔥 On Fire | Unlock 5 explanations |
| 💥 Knowledge Bomb | Unlock 10 explanations |
| ⚡ Lightning Streak | Get a 3x streak |
| 🌪️ Unstoppable | Get a 5x streak |
| 🎯 Sharp Mind | Reach Level 3 |
| 🧠 Big Brain | Reach Level 5 |
| 👑 Galaxy Brain | Reach Level 10 |
| 🔬 Expert Mode | Use Expert Only mode |
| 💨 Speed Runner | Use Ctrl+Enter to submit |

---


## 📄 License

MIT — use it, remix it, build on it.
