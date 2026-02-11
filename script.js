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
let CELL = 0;   // wird bei resize gesetzt

let snake, dir, nextDir, food, running, tickMs, timer;
let applesEaten, letterIndex, collectedText, phase; // phase: "apples" | "letters" | "done"
let pendingChar = null; // aktueller Buchstabe der "eingesammelt" werden soll

function resetGame() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  food = spawnFood();
  running = true;
  // schnellere Grundgeschwindigkeit
  tickMs = 160;

  applesEaten = 0;
  letterIndex = 0;
  collectedText = "";
  phase = "apples";
  pendingChar = null;

  valentineEl.classList.add("hidden");
  resultEl.textContent = "";
  questionEl.textContent = "Will you be my Valentine?";

  setHud();
  resizeCanvas();
  stopLoop();
  startLoop();
  draw();
}

function resizeCanvas() {
  // berechne verfügbares Quadrat: nutze das kleinere der Dimensionen
  const hudHeight = document.querySelector('.hud')?.getBoundingClientRect().height || 60;
  const controlsHeight = document.querySelector('.controls')?.getBoundingClientRect().height || 60;
  const valentineHeight = document.getElementById('valentine')?.getBoundingClientRect().height || 0;
  const touchHeight = document.getElementById('touchControls')?.getBoundingClientRect().height || 0;

  const verticalPadding = 24; // etwas Puffer
  const availableW = window.innerWidth - 24;
  const availableH = window.innerHeight - hudHeight - controlsHeight - valentineHeight - touchHeight - verticalPadding;
  const size = Math.floor(Math.min(availableW, availableH));

  // setze CSS Größe (sichtbar) und Pixel-Auflösung für scharfe Darstellung
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(size * dpr));
  canvas.height = Math.max(1, Math.floor(size * dpr));

  CELL = canvas.width / GRID;
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

  // wrap-around walls (kein Game Over)
  newHead.x = (newHead.x + GRID) % GRID;
  newHead.y = (newHead.y + GRID) % GRID;

  // Selbstkollisionen werden jetzt ignoriert (kein Game Over)

  snake.unshift(newHead);

  // eat?
    if (newHead.x === food.x && newHead.y === food.y) {
      onEat();
      food = spawnFood();
      // Geschwindigkeit bleibt konstant: keine Anpassung von `tickMs` und kein Neustart des Loops
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
  // Für Kompatibilität beibehalten, aber das Spiel nicht stoppen.
  statusEl.textContent = "Kollision ignoriert — weiter geht's!";
}

function showValentineUI() {
  setHud();
  // Öffne eine neue Seite mit dem Bild und den Buttons.
  const params = new URLSearchParams({ message: MESSAGE, text: collectedText });
  const url = 'valentine.html?' + params.toString();
  const w = window.open(url, '_blank');
  if (!w) {
    // Popup blockiert? Dann im selben Tab navigieren.
    window.location.href = url;
  }
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
    const fontSize = Math.max(12, Math.floor(CELL * 0.75));
    ctx.font = `${fontSize}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
      // make sure apple glyph fits inside the cell (use small padding)
      const aPad = Math.max(2, Math.floor(CELL * 0.12));
      const aRect = CELL - aPad * 2;
      let aFont = Math.floor(aRect * 0.85);
      aFont = Math.max(10, aFont);
      const apple = "🍎";
      while (aFont > 8) {
        ctx.font = `${aFont}px system-ui`;
        if (ctx.measureText(apple).width <= aRect * 0.95) break;
        aFont -= 1;
      }
      ctx.font = `${aFont}px system-ui`;
      ctx.fillText(apple, centerX, centerY + 1);
  } else if (phase === "letters") {
    const ch = pendingChar ?? "?";
    // proportional padding so glyphs fit inside the cell
    const pad = Math.max(3, Math.floor(CELL * 0.12));
    const radius = Math.max(4, Math.floor(CELL * 0.12));
    const rectSize = CELL - pad * 2;
    const rx = food.x * CELL + pad;
    const ry = food.y * CELL + pad;

    ctx.fillStyle = "#ff4d7d";
    ctx.beginPath();
    ctx.roundRect(rx, ry, rectSize, rectSize, radius);
    ctx.fill();

    // choose a font size that fits the rect
    let fontSize = Math.floor(rectSize * 0.68);
    fontSize = Math.max(10, fontSize);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#0b0f1a";
    const drawChar = ch === " " ? "␠" : ch;
    while (fontSize > 8) {
      ctx.font = `800 ${fontSize}px system-ui`;
      const w = ctx.measureText(drawChar).width;
      if (w <= rectSize * 0.86) break;
      fontSize -= 1;
    }
    ctx.font = `800 ${fontSize}px system-ui`;
    ctx.fillText(drawChar, centerX, centerY + 1);
  } else {
    // done: show heart
    const fontSize = Math.max(12, Math.floor(CELL * 0.75));
    ctx.font = `${fontSize}px system-ui`;
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

// Resize handling
window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});
window.addEventListener('orientationchange', () => {
  setTimeout(() => { resizeCanvas(); draw(); }, 120);
});

// Touch controls: map buttons to directions
const touchContainer = document.getElementById('touchControls');
if (touchContainer) {
  touchContainer.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('[data-dir]');
    if (!btn) return;
    const dirKey = btn.getAttribute('data-dir');
    const map = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    if (map[dirKey]) {
      nextDir = map[dirKey];
    }
    // prevent focus/scroll
    e.preventDefault();
  }, { passive: false });
}

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
