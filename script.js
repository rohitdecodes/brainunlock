// ============================================
//  BRAINUNLOCK — script.js
//  Gamified Explain It
//  Change PROXY_URL if needed
// ============================================

const PROXY_URL = "https://brainunlock.onrender.com/explain";

// ===== GAME STATE =====
let gameState = {
  xp: 0,
  level: 1,
  streak: 0,
  totalUnlocked: 0,
  achievements: {},
  mode: "all",
  xpThresholds: [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700, 7500]
};

const XP_REWARDS = { eli5: 15, college: 25, expert: 40 };

// ===== ACHIEVEMENTS DEFINITION =====
const ACHIEVEMENTS = [
  { id: "first_unlock",   icon: "🔓", name: "First Blood",       desc: "Unlock your first explanation",        condition: () => gameState.totalUnlocked >= 1 },
  { id: "five_unlocks",   icon: "🔥", name: "On Fire",           desc: "Unlock 5 explanations",                condition: () => gameState.totalUnlocked >= 5 },
  { id: "ten_unlocks",    icon: "💥", name: "Knowledge Bomb",    desc: "Unlock 10 explanations",               condition: () => gameState.totalUnlocked >= 10 },
  { id: "streak_3",       icon: "⚡", name: "Lightning Streak",  desc: "Get a 3x streak",                      condition: () => gameState.streak >= 3 },
  { id: "streak_5",       icon: "🌪️", name: "Unstoppable",       desc: "Get a 5x streak",                      condition: () => gameState.streak >= 5 },
  { id: "level_3",        icon: "🎯", name: "Sharp Mind",        desc: "Reach Level 3",                        condition: () => gameState.level >= 3 },
  { id: "level_5",        icon: "🧠", name: "Big Brain",         desc: "Reach Level 5",                        condition: () => gameState.level >= 5 },
  { id: "level_10",       icon: "👑", name: "Galaxy Brain",      desc: "Reach Level 10",                       condition: () => gameState.level >= 10 },
  { id: "expert_mode",    icon: "🔬", name: "Expert Mode",       desc: "Use Expert Only mode",                 condition: () => gameState.mode === "expert" },
  { id: "speed_runner",   icon: "💨", name: "Speed Runner",      desc: "Use Ctrl+Enter to submit",             condition: () => false },
];

// ===== DOM REFS =====
const topicInput    = document.getElementById("topicInput");
const explainBtn    = document.getElementById("explainBtn");
const cardsGrid     = document.getElementById("cardsGrid");
const errorZone     = document.getElementById("errorZone");
const charCount     = document.getElementById("charCount");
const btnText       = document.getElementById("btnText");
const fireProgress  = document.getElementById("fireProgress");

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  renderAchievements();
  updateHUD();
  initParticles();
});

// ===== CHAR COUNTER =====
topicInput.addEventListener("input", () => {
  charCount.textContent = topicInput.value.length;
});

// ===== KEYBOARD SHORTCUT =====
topicInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    unlockAchievement("speed_runner");
    explainTopic();
  }
});

// ===== FILL TOPIC =====
function fillTopic(text) {
  topicInput.value = text;
  charCount.textContent = text.length;
  topicInput.focus();
}

// ===== SET MODE =====
function setMode(btn) {
  document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  gameState.mode = btn.dataset.mode;
  if (gameState.mode === "expert") unlockAchievement("expert_mode");

  // Show/hide cards based on mode
  const cards = { eli5: document.getElementById("card-eli5"), college: document.getElementById("card-college"), expert: document.getElementById("card-expert") };
  if (gameState.mode === "all") {
    Object.values(cards).forEach(c => c.style.display = "flex");
  } else if (gameState.mode === "eli5") {
    cards.eli5.style.display = "flex";
    cards.college.style.display = "none";
    cards.expert.style.display = "none";
  } else if (gameState.mode === "expert") {
    cards.eli5.style.display = "none";
    cards.college.style.display = "none";
    cards.expert.style.display = "flex";
  }
}

// ===== MAIN EXPLAIN =====
async function explainTopic() {
  const topic = topicInput.value.trim();
  if (!topic) { showError("TARGET REQUIRED: Enter a topic to unlock."); return; }

  setLoading(true);
  hideError();
  showSkeletons();
  cardsGrid.classList.add("visible");

  const prompt = `You are an expert teacher. Explain the following topic at exactly 3 levels.
Return ONLY a raw JSON object with exactly these 3 keys: "eli5", "college", "expert".
- "eli5": explain like I'm 5 years old. Fun analogy. Max 3 sentences.
- "college": explain for a college student who knows basics. Clear and accurate. Max 4 sentences.
- "expert": explain with technical depth. Proper terminology. Max 5 sentences.
No preamble. No markdown. No backticks. Just raw JSON.
Topic: ${topic}`;

  try {
    animateFireProgress();
    const result = await callServer(prompt);
    const parsed = parseJSON(result);

    if (!parsed) {
      showError("PARSE ERROR: Invalid response format. Try again.");
      setLoading(false);
      return;
    }

    await revealCards(parsed);
    awardXP();
    gameState.streak++;
    gameState.totalUnlocked++;
    document.getElementById("streakCount").innerHTML = gameState.streak + (gameState.streak >= 3 ? '<span class="streak-fire">🔥</span>' : '');
    document.getElementById("totalUnlocked").textContent = gameState.totalUnlocked;
    checkAchievements();
    updateHUD();

  } catch (err) {
    gameState.streak = 0;
    document.getElementById("streakCount").innerHTML = "0";
    console.error(err);
    showError("CONNECTION FAILED: " + err.message + " — Is Flask server running on :5000?");
  }

  setLoading(false);
}

// ===== CALL SERVER =====
async function callServer(prompt) {
  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Server ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.text;
}

// ===== PARSE JSON =====
function parseJSON(text) {
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch { return null; }
}

// ===== REVEAL CARDS WITH STAGGER =====
async function revealCards(data) {
  const levels = gameState.mode === "eli5" ? ["eli5"] : gameState.mode === "expert" ? ["expert"] : ["eli5", "college", "expert"];
  const texts = { eli5: data.eli5 || "No response.", college: data.college || "No response.", expert: data.expert || "No response." };

  for (let i = 0; i < levels.length; i++) {
    await sleep(i * 200);
    revealCard(levels[i], texts[levels[i]]);
  }
}

function revealCard(id, text) {
  const skel    = document.getElementById(`skel-${id}`);
  const p       = document.getElementById(`text-${id}`);
  const actions = document.getElementById(`actions-${id}`);
  const flash   = document.getElementById(`flash-${id}`);

  skel.style.display = "none";
  p.style.display = "block";
  p.textContent = text;
  actions.classList.add("visible");

  // Trigger flash effect
  flash.classList.remove("flash");
  void flash.offsetWidth;
  flash.classList.add("flash");

  // Particle burst at card
  const card = document.getElementById(`card-${id}`);
  const rect = card.getBoundingClientRect();
  burstParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function showSkeletons() {
  ["eli5", "college", "expert"].forEach(id => {
    const skel    = document.getElementById(`skel-${id}`);
    const p       = document.getElementById(`text-${id}`);
    const actions = document.getElementById(`actions-${id}`);
    skel.style.display = "flex";
    p.style.display = "none";
    p.textContent = "";
    actions.classList.remove("visible");
  });
}

// ===== XP SYSTEM =====
function awardXP() {
  const rewards = gameState.mode === "all" ? [15, 25, 40] : gameState.mode === "eli5" ? [15] : [40];
  const totalXP = rewards.reduce((a, b) => a + b, 0) * (gameState.streak > 0 ? Math.min(1 + gameState.streak * 0.1, 2) : 1);
  const rounded = Math.round(totalXP);

  gameState.xp += rounded;
  showToast(`+${rounded} XP EARNED${gameState.streak >= 2 ? ` (${Math.round((1 + gameState.streak * 0.1) * 100)}% streak bonus!)` : ''}`);
  checkLevelUp();
}

function checkLevelUp() {
  const thresholds = gameState.xpThresholds;
  let newLevel = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (gameState.xp >= thresholds[i]) newLevel = i + 1;
  }
  if (newLevel > gameState.level) {
    gameState.level = newLevel;
    triggerLevelUp(newLevel);
  }
}

function triggerLevelUp(level) {
  const overlay = document.getElementById("levelupOverlay");
  document.getElementById("levelupNumber").textContent = level;
  overlay.classList.add("show");
  burstParticles(window.innerWidth / 2, window.innerHeight / 2, 30);
  setTimeout(() => overlay.classList.remove("show"), 2500);
}

function updateHUD() {
  const thresholds = gameState.xpThresholds;
  const level = gameState.level;
  const currentThreshold = thresholds[level - 1] || 0;
  const nextThreshold = thresholds[level] || thresholds[thresholds.length - 1];
  const progress = Math.min(((gameState.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100);

  document.getElementById("playerLevel").textContent = level;
  document.getElementById("xpCurrent").textContent = gameState.xp;
  document.getElementById("xpNext").textContent = nextThreshold;
  document.getElementById("xpFill").style.width = progress + "%";
  document.getElementById("xpGlow").style.width = progress + "%";
}

// ===== ACHIEVEMENTS =====
function checkAchievements() {
  ACHIEVEMENTS.forEach(ach => {
    if (!gameState.achievements[ach.id] && ach.condition()) {
      unlockAchievement(ach.id);
    }
  });
}

function unlockAchievement(id) {
  if (gameState.achievements[id]) return;
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (!ach) return;
  gameState.achievements[id] = true;
  renderAchievements();
  document.getElementById("achievementCount").textContent = Object.keys(gameState.achievements).length;
  showToast(`🏆 ACHIEVEMENT UNLOCKED: ${ach.name}`);
}

function renderAchievements() {
  const list = document.getElementById("achievementList");
  list.innerHTML = ACHIEVEMENTS.map(ach => `
    <div class="ach-item ${gameState.achievements[ach.id] ? 'unlocked' : ''}">
      <div class="ach-icon">${ach.icon}</div>
      <div class="ach-info">
        <div class="ach-name">${ach.name}</div>
        <div class="ach-desc">${ach.desc}</div>
      </div>
    </div>
  `).join("");
}

function toggleAchievements() {
  document.getElementById("achievementPanel").classList.toggle("open");
}

// ===== COPY =====
function copyCard(id) {
  const text = document.getElementById(`text-${id}`).textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const span = document.getElementById(`copy-${id}`);
    span.textContent = "✓ COPIED";
    span.parentElement.classList.add("copied");
    setTimeout(() => {
      span.textContent = "⎘ COPY";
      span.parentElement.classList.remove("copied");
    }, 2000);
  });
}

// ===== RATE CARD =====
function rateCard(id, val) {
  const stars = document.getElementById(`stars-${id}`);
  stars.textContent = val > 0 ? "⭐" : "💀";
  if (val > 0) showToast("QUALITY CONFIRMED +5 XP");
  if (val > 0) { gameState.xp += 5; updateHUD(); }
}

// ===== FIRE PROGRESS ANIMATION =====
function animateFireProgress() {
  let w = 0;
  fireProgress.style.width = "0%";
  const interval = setInterval(() => {
    w += 1.5;
    fireProgress.style.width = Math.min(w, 90) + "%";
    if (w >= 90) clearInterval(interval);
  }, 80);
}

// ===== LOADING =====
function setLoading(state) {
  explainBtn.disabled = state;
  btnText.textContent = state ? "PROCESSING..." : "UNLOCK KNOWLEDGE";
  if (!state) fireProgress.style.width = "0%";
}

// ===== ERROR =====
function showError(msg) {
  errorZone.textContent = "[ERROR] " + msg;
  errorZone.classList.add("visible");
}
function hideError() { errorZone.classList.remove("visible"); }

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ===== UTILS =====
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== PARTICLE SYSTEM =====
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");
let particles = [];

function initParticles() {
  resize();
  window.addEventListener("resize", resize);
  spawnBackgroundParticles();
  requestAnimationFrame(animateParticles);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function spawnBackgroundParticles() {
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.5 - 0.1,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
      color: ['#00f5ff', '#ffd700', '#bf5fff', '#39ff14'][Math.floor(Math.random() * 4)],
      life: 1, decay: 0
    });
  }
}

function burstParticles(x, y, count = 15) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = Math.random() * 4 + 2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 3 + 1,
      alpha: 1,
      color: ['#00f5ff', '#ffd700', '#bf5fff', '#39ff14'][Math.floor(Math.random() * 4)],
      life: 1,
      decay: 0.02 + Math.random() * 0.02
    });
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles = particles.filter(p => p.alpha > 0.01);

  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    p.x += p.vx;
    p.y += p.vy;

    if (p.decay > 0) {
      p.alpha -= p.decay;
      p.vy += 0.05;
    } else {
      // Background particle — wrap around
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
    }
  });

  // Refill background particles
  if (particles.filter(p => p.decay === 0).length < 50) {
    spawnBackgroundParticles();
  }

  requestAnimationFrame(animateParticles);
}
