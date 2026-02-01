<div align="center">
  <br />
  <a href="https://youtu.be/MOKwA-F5QnE" target="_blank">
    <img src="public/banner.png" alt="ELIA Project Banner" width="100%">
  </a>
  <br /><br />

  <div>
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
    <img src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwindcss" />
    <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js" />
  </div>

  <h1 align="center">🌱 ELIA</h1>
  <h3 align="center">Environmental Lifecycle Intelligence Assistant</h3>
  <h4 align="center">HackEarth Hackathon Project</h4>

  <h3 align="center">
    🔗 <a href="https://elia-hack-earth.vercel.app/">Live Demo</a>
  </h3>

  <p align="center">
    <strong>Your AI companion for a more sustainable future.</strong><br/>
    Track habits, learn through play, and visualize your real-world impact.
  </p>
</div>

---

## 📌 Table of Contents

1. [💡 Inspiration](#-inspiration)
2. [🚀 What It Does](#-what-it-does)
3. [⚙️ How We Built It](#-how-we-built-it)
4. [🧠 The AI Brain](#-the-ai-brain)
5. [🌍 3D & Gamification](#-3d--gamification)
6. [🛠️ Installation](#-installation)
7. [🔮 What’s Next](#-whats-next)

---

## 💡 Inspiration

Climate change is a global problem—but individual action often feels **invisible and unrewarding**.  
Most sustainability tools are manual, boring, and disconnected from daily life.

**ELIA** was created to change that.

We imagined sustainability as something **interactive, intelligent, and motivating**—an AI companion that learns from your habits, teaches you through immersive experiences, and shows how small actions scale into global impact.

---

## 🚀 What It Does

**ELIA** is a next-generation sustainability platform that fuses **Generative AI**, **data visualization**, and **gamification**.

### 🤖 AI Eco-Journal
Log your day naturally:
> *“I took a 5-minute shower and biked to work.”*

ELIA’s **Gemini-powered AI** transforms this into five core sustainability metrics:
- 🌫️ **CO₂ Emissions** (kg)
- 💧 **Water Usage** (L)
- ⚡ **Energy Consumption** (kWh)
- 🗑️ **Waste Generated** (kg)
- 🍽️ **Food Footprint** (score 1–10)

If the input is unclear, ELIA asks **smart follow-up questions** to improve accuracy.

---

### 🌍 Global Impact Map (3D)
See sustainability at scale.

Using **Mapbox**, ELIA renders a real-time, interactive 3D world map showing:
- Community-wide impact
- Regional sustainability trends
- Dynamic “emission clouds” per metric

---

### 🎮 Immersive Learning Hub
Learning sustainability should be fun.

Built with **React Three Fiber**, ELIA includes:
- **Carbon Sort Challenge** – a fast-paced 3D game where players sort falling waste into correct bins under pressure
- **Interactive Quizzes** – learn, compete, and earn rewards

---

### 🏆 Gamification & Rewards
Motivation through play:
- 🥇 **Leaderboards** (global & friends)
- 🏅 **Badges** (e.g. *Zero-Waste Hero*, *Streak Master*)
- 🎯 **Challenges** (*Meatless Monday*, *Plastic-Free Week*)

---

### 📊 Smart Analytics
Track your progress with elegant, interactive charts:
- Weekly reduction trends
- Impact breakdown by category
- Long-term sustainability insights

---

## ⚙️ How We Built It

ELIA is powered by a modern, scalable stack:

- **Frontend** – Next.js 16 (App Router)
- **Styling** – Tailwind CSS v4 + Framer Motion (glassmorphism UI)
- **Backend & Auth** – Firebase (Auth + Firestore)
- **AI Engine** – Google Gemini (via Firebase Genkit)
- **3D Graphics** – Three.js & React Three Fiber
- **Maps** – Mapbox GL
- **Icons** – Lucide React

---

## 🧠 The AI Brain

ELIA doesn’t just parse text—it understands **context**.

**Example:**
- *Input*: “I had a beef burger for lunch.”
- *Reasoning*: Detects beef’s high carbon and water footprint
- *Output*: Calculates impact + delivers a friendly, educational tip

### 🔁 Follow-Up Protocol
If data is incomplete:
> *“I drove today.”*

ELIA responds with:
> *“How many kilometers did you drive and what type of vehicle?”*

This ensures **accuracy without friction**.

---

## 🌍 3D & Gamification

For the **Carbon Sort Game**, we implemented:
- Physics-based object spawning
- Raycasting for interaction
- Real-time visual & educational feedback  
  *(“Greasy pizza boxes belong in compost, not paper!”)*

**Interaction > Information** is the core design philosophy.

---

## 🛠️ Installation

```bash
git clone https://github.com/ViktorNedev/ELIA.git
cd elia
npm install
```

## Environment Variables

### Create .env.local:

```.env
EMAIL_USER=...
EMAIL_PASS=...
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=...
```

## Run locally
```bash npm run dev ```

## Optional:

-Add serviceAccountKey.json

-Use upload-quizzes.js to seed quiz data

Open 👉 [http://localhost:3000](http://localhost:3000)

## 🔮 What’s Next

- 🕶️ AR Carbon Visualization (WebXR)
- 🏠 IoT Integration (smart energy tracking)
- 🏢 Corporate Sustainability Challenges
- 📱 Mobile App (React Native)
- 🧑‍🤝‍🧑 Multiplayer Games & Quizzes

<div align="center"> <strong>Built with 💚 by DEVT for the HackEarth Hackathon</strong> </div> 