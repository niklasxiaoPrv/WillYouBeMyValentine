// ========= Config =========
const APPLES_BEFORE_LETTERS = 4; // erst X Äpfel, dann Buchstaben
const MESSAGE = "Will you be my Valentine?";

// ========= DOM =========
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const statusEl = document.getElementById("status");
const progressEl = document.getElementById("progress");
const restartBtn = document.getElementById("restartBtn");

const valentineEl = document.getElementById("valentine");
const questionEl = document.getElementById("question");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const resultEl = document.getElementById("result");

// ========= Snake state =========
const GRID = 21;                    // 21x21 Felder
const CELL = canvas.width / GRID;   // quadratische Zellen

let snake, dir, nextDir, food, running, tickMs, timer;
let applesEaten, letterIndex, collectedText, phase; // phase: "apples" | "letters" | "done"
let pendingChar = null; // aktueller Buchstabe der "eingesammelt" werden soll

function resetGame() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  food = spawnFood();
  running = true;
  tickMs = 190;

  applesEaten = 0;
  letterIndex = 0;
  collectedText = "";
  phase = "apples";
  pendingChar = null;

  valentineEl.classList.add("hidden");
  resultEl.textContent = "";
  questionEl.textContent = "Will you be my Valentine?";

  setHud();
  stopLoop();
  startLoop();
  draw();
}

function setHud() {
  if (phase === "apples") {
    statusEl.textContent = "Sammle zuerst Äpfel 🍎 …";
    progressEl.textContent = `Äpfel: ${applesEaten}/${APPLES_BEFORE_LETTERS}`;
  } else if (phase === "letters") {
    statusEl.textContent = "Jetzt sammle die Buchstaben ✨";
    progressEl.textContent = collectedText + (pendingChar ? "▌" : "");
  } else {
    statusEl.textContent = "Geschafft!";
    progressEl.textContent = MESSAGE;
  }
}

function spawnFood() {
  // spawn auf freiem Feld
  while (true) {
    const pos = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
    const onSnake = snake?.some(s => s.x === pos.x && s.y === pos.y);
    if (!onSnake) return pos;
  }
}

function startLoop() {
  timer = setInterval(step, tickMs);
}

function stopLoop() {
  if (timer) clearInterval(timer);
  timer = null;
}

function step() {
  if (!running) return;

  // direction update (keine 180° Turns)
  if (!(nextDir.x === -dir.x && nextDir.y === -dir.y)) dir = nextDir;

  const head = snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  // walls
  if (newHead.x < 0 || newHead.y < 0 || newHead.x >= GRID || newHead.y >= GRID) {
    gameOver();
    return;
  }

  // self collision
  if (snake.some((s, i) => i !== 0 && s.x === newHead.x && s.y === newHead.y)) {
    gameOver();
    return;
  }

  snake.unshift(newHead);

  // eat?
  if (newHead.x === food.x && newHead.y === food.y) {
    onEat();
    food = spawnFood();
    // leicht schneller
    tickMs = Math.max(70, tickMs - 2);
    stopLoop();
    startLoop();
  } else {
    snake.pop();
  }

  draw();
}

function onEat() {
  if (phase === "apples") {
    applesEaten += 1;
    if (applesEaten >= APPLES_BEFORE_LETTERS) {
      phase = "letters";
      pendingChar = MESSAGE[letterIndex];
    }
  } else if (phase === "letters") {
    // sammle exakt das nächste Zeichen (inkl. Leerzeichen/Fragezeichen)
    const ch = MESSAGE[letterIndex];
    collectedText += ch;
    letterIndex += 1;

    if (letterIndex >= MESSAGE.length) {
      phase = "done";
      running = false;
      stopLoop();
      showValentineUI();
    } else {
      pendingChar = MESSAGE[letterIndex];
    }
  }
  setHud();
}

function gameOver() {
  running = false;
  stopLoop();
  statusEl.textContent = "Game Over 😅 — klick auf Neu starten";
}

function showValentineUI() {
  setHud();
  valentineEl.classList.remove("hidden");
}

// ========= Render =========
function draw() {
  // background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // subtle grid
  ctx.globalAlpha = 0.12;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, canvas.height);
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(canvas.width, i * CELL);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // food
  drawFood();

  // snake
  snake.forEach((seg, i) => {
    const pad = 2;
    ctx.fillStyle = i === 0 ? "#42d27a" : "rgba(66,210,122,0.85)";
    ctx.fillRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
  });
}

function drawFood() {
  const centerX = food.x * CELL + CELL / 2;
  const centerY = food.y * CELL + CELL / 2;

  if (phase === "apples") {
    // apple emoji
    ctx.font = `${Math.floor(CELL * 0.9)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🍎", centerX, centerY + 1);
  } else if (phase === "letters") {
    const ch = pendingChar ?? "?";
    ctx.fillStyle = "#ff4d7d";
    ctx.beginPath();
    ctx.roundRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6, 8);
    ctx.fill();

    ctx.fillStyle = "#0b0f1a";
    ctx.font = `800 ${Math.floor(CELL * 0.65)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch === " " ? "␠" : ch, centerX, centerY + 1);
  } else {
    // done: show heart
    ctx.font = `${Math.floor(CELL * 0.9)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💖", centerX, centerY + 1);
  }
}

// polyfill-ish for roundRect older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

// ========= Input =========
window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  const map = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
  };

  if (map[key]) {
    e.preventDefault();
    nextDir = map[key];
  }
});

// ========= Valentine Buttons =========
let yesScale = 1;
let noScale = 1;

function applyButtonScales() {
  yesBtn.style.transform = `scale(${yesScale})`;
  noBtn.style.transform = `scale(${noScale})`;
}

noBtn.addEventListener("click", () => {
  // no kleiner, yes größer
  noScale = Math.max(0.45, noScale - 0.10);
  yesScale = Math.min(2.6, yesScale + 0.12);
  applyButtonScales();

  // Optional: wenn No super klein wird, leicht ausweichen
  if (noScale <= 0.5) {
    noBtn.textContent = "No (really?)";
  }
});

yesBtn.addEventListener("click", () => {
  resultEl.textContent = "Okay see you on Saturday im Spa rojo";
  yesBtn.disabled = true;
  noBtn.disabled = true;
});

// ========= Restart =========
restartBtn.addEventListener("click", resetGame);

// start
resetGame();
