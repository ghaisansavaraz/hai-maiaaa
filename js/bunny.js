// Autumn Bunny — ported from vscode-pets state machine
// Renders a walking white bunny over an autumn forest scene with falling leaves.

import { setCurrentValentineView } from './valentine.js';

const SPRITE_BASE = 'assets/bunny/white';
const AUTUMN_BG = 'assets/autumn/background.png';
const AUTUMN_FG = 'assets/autumn/foreground.png';

const LEAF_COLORS = ['#D7A50F', '#704910', '#A22D16', '#BB8144'];

// Sleep mode config
let isSleepModeTriggered = false;

const S = {
  sitIdle:    'sit-idle',
  walkRight:  'walk-right',
  walkLeft:   'walk-left',
  runRight:   'run-right',
  runLeft:    'run-left',
  lie:        'lie',
  standRight: 'stand-right',
  standLeft:  'stand-left',
  swipe:      'swipe',
};

const SPRITE_MAP = {
  [S.sitIdle]:    'idle',
  [S.walkRight]:  'walk',
  [S.walkLeft]:   'walk',
  [S.runRight]:   'walk_fast',
  [S.runLeft]:    'walk_fast',
  [S.lie]:        'lie',
  [S.standRight]: 'stand',
  [S.standLeft]:  'stand',
  [S.swipe]:      'swipe',
};

const DIR = { left: -1, right: 1, none: 0 };

const STATE_DIR = {
  [S.sitIdle]:    DIR.right,
  [S.walkRight]:  DIR.right,
  [S.walkLeft]:   DIR.left,
  [S.runRight]:   DIR.right,
  [S.runLeft]:    DIR.left,
  [S.lie]:        DIR.right,
  [S.standRight]: DIR.right,
  [S.standLeft]:  DIR.left,
  [S.swipe]:      DIR.none,
};

// Bunny sequence graph (from bunny.ts)
const TRANSITIONS = {
  [S.sitIdle]:    [S.lie, S.walkRight, S.walkLeft, S.standLeft, S.standRight],
  [S.lie]:        [S.sitIdle],
  [S.standLeft]:  [S.lie, S.walkRight, S.walkLeft, S.walkLeft],
  [S.standRight]: [S.lie, S.walkRight, S.walkRight, S.walkLeft],
  [S.walkRight]:  [S.walkLeft, S.runRight, S.runRight],
  [S.walkLeft]:   [S.walkRight, S.runLeft, S.runLeft],
  [S.runRight]:   [S.walkLeft, S.runLeft, S.runLeft],
  [S.runLeft]:    [S.standLeft],
  [S.swipe]:      [S.sitIdle],
};

// Expose sleep toggle function globally so HTML UI can call it
export function toggleSleepMode() {
  isSleepModeTriggered = !isSleepModeTriggered;
  
  // Toggle UI elements
  const btn = document.getElementById('bunnySleepToggle');
  const zzz = document.getElementById('bunnyZzz');
  const blanket = document.getElementById('bunnyBlanket');
  
  if (btn) btn.classList.toggle('active', isSleepModeTriggered);
  if (zzz) zzz.classList.toggle('active', isSleepModeTriggered);
  if (blanket) blanket.classList.toggle('active', isSleepModeTriggered);
  
  // Force active scenes to update state immediately
  if (window._activeBunnyScenes) {
    window._activeBunnyScenes.forEach(scene => {
      // If sleeping, force sit first, then it will transition to lie
      if (isSleepModeTriggered) {
         scene.stateEnum = S.sitIdle;
         scene.idleCounter = 0;
      } else {
         scene.stateEnum = S.standRight;
         scene.idleCounter = 0;
      }
      scene._applyState();
      scene._render();
    });
  }
}
window.toggleBunnySleepMode = toggleSleepMode;

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(a, b) { return a + Math.random() * (b - a); }

// ── Leaf Effect ─────────────────────────────────────

class Leaf {
  constructor(canvas, scale, floor, treeLine) {
    this.canvas = canvas;
    this.scale = scale;
    this.floor = floor;
    this.treeLine = treeLine;
    this.color = pick(LEAF_COLORS);
    this.reset(true);
  }

  reset(initial) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.originX = rand(0, w);
    this.originY = initial
      ? rand(h - this.treeLine, h - this.floor)
      : h - this.treeLine;
    this.x = this.originX;
    this.y = this.originY;
    this.vy = rand(10, 50);
    this.vx = rand(0.1, 1);
    this.amp = rand(5, 100);
    this.dx = rand(0, 100);
    this.rot = rand(0, Math.PI * 2);
    this.rotSpeed = rand(0.5, 3);
    this.settled = false;
    this.settleTime = 0;
    this.settleDur = rand(4, 7);
    this.color = pick(LEAF_COLORS);
  }

  update(dt, now) {
    if (this.settled) {
      if (now - this.settleTime >= this.settleDur) this.reset(false);
      return;
    }
    this.y += this.vy * dt;
    this.dx += this.vx * dt;
    this.x = this.originX + this.amp * Math.sin(this.dx);
    this.rot += this.rotSpeed * dt;

    const centerY = this.y + 119.5 * this.scale;
    if (centerY >= this.canvas.height - this.floor) {
      this.settled = true;
      this.settleTime = now;
      this.y = this.canvas.height - this.floor - 119.5 * this.scale;
    }
  }

  draw(ctx) {
    const s = this.scale;
    const x = this.x, y = this.y;
    ctx.save();
    const cx = x + (100 * s) / 2;
    const cy = y + (85 * s + 169 * s) / 2;
    ctx.translate(cx, cy);
    ctx.rotate(this.rot);
    ctx.translate(-cx, -cy);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(100*s+x, 85*s+y);
    ctx.lineTo(0+x, 107*s+y);
    ctx.lineTo(73*s+x, 112*s+y);
    ctx.lineTo(32*s+x, 138*s+y);
    ctx.lineTo(92*s+x, 123*s+y);
    ctx.lineTo(100*s+x, 169*s+y);
    ctx.lineTo(123*s+x, 123*s+y);
    ctx.lineTo(168*s+x, 133*s+y);
    ctx.lineTo(133*s+x, 112*s+y);
    ctx.lineTo(184*s+x, 110*s+y);
    ctx.lineTo(100*s+x, 85*s+y);
    ctx.lineTo(100*s+x, 70*s+y);
    ctx.fill();
    ctx.restore();
  }
}

class LeafEffect {
  constructor(canvas, floor, isLarge) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.floor = floor;
    this.running = false;
    this.lastTime = 0;
    const count = isLarge ? 30 : 20;
    const treeLine = isLarge ? 250 : 94;
    const scale = isLarge ? 1 / 10 : 1 / 20;
    this.leaves = [];
    for (let i = 0; i < count; i++) {
      this.leaves.push(new Leaf(canvas, scale, floor, treeLine));
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this._raf = requestAnimationFrame(() => this._loop());
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  _loop() {
    if (!this.running) return;
    const now = performance.now() / 1000;
    const dt = Math.min(now - this.lastTime, 0.1);
    this.lastTime = now;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const leaf of this.leaves) {
      leaf.update(dt, now);
      leaf.draw(this.ctx);
    }
    this._raf = requestAnimationFrame(() => this._loop());
  }
}

// ── BunnyScene ──────────────────────────────────────

class BunnyScene {
  constructor(container, { spriteSize = 55, floor = 0, isLarge = false } = {}) {
    this.container = container;
    this.spriteSize = spriteSize;
    this.floor = floor;
    this.isLarge = isLarge;
    this.running = false;
    this.left = 0;
    this.speed = rand(1.2, 2.0);
    this.stateEnum = S.sitIdle;
    this.idleCounter = 0;
    this.facingDir = DIR.right;
    
    // Track food
    this.foodTarget = null;
    this.foodElement = null;

    this._buildDOM();
    this._resetBoundary();
    this.left = rand(0, Math.max(0, this.boundary - this.spriteSize));
    this._applyState();
    
    // Register scene globally for sleep toggle
    if (!window._activeBunnyScenes) window._activeBunnyScenes = [];
    window._activeBunnyScenes.push(this);
    
    this._initInteractions();
  }

  _initInteractions() {
    this.container.addEventListener('mousemove', (e) => {
      // Only pet if awake
      if (isSleepModeTriggered) return;
      // throttle petting slightly
      if (this._lastPetTime && Date.now() - this._lastPetTime < 300) return;
      
      const rect = this.img.getBoundingClientRect();
      const contRect = this.container.getBoundingClientRect();
      // Mouse relative to container
      const mx = e.clientX - contRect.left;
      const my = e.clientY - contRect.top;
      
      // Check if mouse is roughly over the bunny
      const bx = this.left + this.spriteSize/2;
      const by = this.container.clientHeight - this.floor - this.spriteSize/2;
      
      const dist = Math.sqrt(Math.pow(mx - bx, 2) + Math.pow(my - by, 2));
      if (dist < this.spriteSize/1.5) {
        this._spawnHeart(bx, by - this.spriteSize/2);
        this._lastPetTime = Date.now();
      }
    });

    this.container.addEventListener('dblclick', (e) => {
      if (isSleepModeTriggered) {
        this._spawnDream();
        return;
      }
      
      // Drop food
      const rect = this.container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      this._dropFood(clickX);
    });
    
    this.container.addEventListener('click', (e) => {
      // If sleeping, spawn a dream bubble
      if (isSleepModeTriggered && e.target.closest('#bunnySection')) {
         this._spawnDream();
      }
    });
  }

  _spawnHeart(x, y) {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.cssText = `position:absolute;left:${x}px;top:${y}px;font-size:14px;pointer-events:none;z-index:10;animation:floatUpFade 1.2s ease-out forwards;`;
    this.container.appendChild(heart);
    setTimeout(() => heart.remove(), 1200);
  }
  
  _spawnDream() {
    // Only spawn one dream at a time roughly
    if (this._dreamEl) return;
    const dreams = ['🥕', '❤️', '🌙', '💤'];
    const dream = pick(dreams);
    
    const bx = this.left + this.spriteSize/2;
    const by = this.container.clientHeight - this.floor - this.spriteSize;
    
    const bubble = document.createElement('div');
    bubble.className = 'bunny-dream';
    bubble.innerHTML = `<span class="dream-icon">${dream}</span>`;
    bubble.style.cssText = `position:absolute;left:${bx}px;top:${by - 20}px;transform:translateX(-50%);z-index:20;opacity:0;`;
    this.container.appendChild(bubble);
    this._dreamEl = bubble;
    
    // animate in and out
    requestAnimationFrame(() => {
      bubble.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      bubble.style.top = `${by - 45}px`;
      bubble.style.opacity = '1';
    });
    
    setTimeout(() => {
      bubble.style.opacity = '0';
      bubble.style.top = `${by - 60}px`;
      setTimeout(() => {
        bubble.remove();
        this._dreamEl = null;
      }, 500);
    }, 2000);
  }

  _dropFood(x) {
    if (this.foodElement) {
      this.foodElement.remove();
    }
    
    const food = document.createElement('div');
    food.innerHTML = '🥕';
    food.style.cssText = `position:absolute;left:${x}px;top:-20px;font-size:16px;z-index:5;transition:top 0.5s cubic-bezier(0.55, 0.085, 0.68, 0.53);`;
    this.container.appendChild(food);
    this.foodElement = food;
    
    // fall
    setTimeout(() => {
      const bottom = this.container.clientHeight - this.floor - 16;
      food.style.top = `${bottom}px`;
    }, 50);

    // tell bunny to get it
    this.foodTarget = x;
    this.idleCounter = 0; // break current state
    this.stateEnum = (x < this.left) ? S.runLeft : S.runRight;
    this._applyState();
  }

  _buildDOM() {
    const bg = document.createElement('div');
    bg.className = 'bunny-bg';
    bg.style.cssText = `position:absolute;inset:0;background:url('${AUTUMN_BG}') repeat-x bottom/auto 100%;z-index:0;pointer-events:none;`;
    this.container.appendChild(bg);

    const canvas = document.createElement('canvas');
    canvas.className = 'bunny-leaves-canvas';
    canvas.style.cssText = 'position:absolute;inset:0;z-index:3;pointer-events:none;';
    this.container.appendChild(canvas);
    this.canvas = canvas;

    const img = document.createElement('img');
    img.className = 'bunny-pet';
    img.style.cssText = `position:absolute;bottom:${this.floor}px;z-index:2;image-rendering:pixelated;pointer-events:none;max-width:${this.spriteSize}px;max-height:${this.spriteSize}px;width:auto;height:auto;`;
    img.src = `${SPRITE_BASE}_idle_8fps.gif`;
    img.alt = 'bunny';
    img.draggable = false;
    this.container.appendChild(img);
    this.img = img;

    const fg = document.createElement('div');
    fg.className = 'bunny-fg';
    fg.style.cssText = `position:absolute;inset:0;background:url('${AUTUMN_FG}') repeat-x bottom/auto 100%;z-index:4;pointer-events:none;`;
    this.container.appendChild(fg);

    this.leafEffect = new LeafEffect(canvas, this.floor, this.isLarge);
  }

  _resetBoundary() {
    this.boundary = this.container.clientWidth;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._resize();
    this.leafEffect.start();
    this._interval = setInterval(() => this._tick(), 100);
    this._resizeHandler = () => this._resize();
    window.addEventListener('resize', this._resizeHandler);
  }

  stop() {
    this.running = false;
    this.leafEffect.stop();
    if (this._interval) clearInterval(this._interval);
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    
    // Remove from global active scenes
    if (window._activeBunnyScenes) {
       window._activeBunnyScenes = window._activeBunnyScenes.filter(s => s !== this);
    }
  }

  _resize() {
    this._resetBoundary();
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.leafEffect.resize(w, h);
    if (this.left > this.boundary - this.spriteSize) {
      this.left = Math.max(0, this.boundary - this.spriteSize);
    }
  }

  _tick() {
    const result = this._nextFrame();
    if (result === 'complete') {
      
      // Override logic if sleeping
      if (isSleepModeTriggered) {
        if (this.stateEnum !== S.lie) {
           this.stateEnum = S.sitIdle; // sit before lie for natural transition
           if (this.idleCounter > 5) this.stateEnum = S.lie;
        } else {
           this.stateEnum = S.lie;
        }
      } 
      // Logic for hunting food
      else if (this.foodTarget !== null) {
        const dist = Math.abs(this.left + this.spriteSize/2 - this.foodTarget);
        if (dist < 20) {
          // Reached food
          this.stateEnum = S.sitIdle;
          if (this.foodElement) {
             this.foodElement.style.transform = 'scale(1.2)';
             this.foodElement.style.opacity = '0';
             setTimeout(() => { if(this.foodElement) this.foodElement.remove() }, 300);
          }
          this.foodTarget = null;
          this.foodElement = null;
        } else {
          this.stateEnum = (this.foodTarget < this.left + this.spriteSize/2) ? S.runLeft : S.runRight;
        }
      }
      else {
        // Normal random walk
        const nextStates = TRANSITIONS[this.stateEnum];
        if (nextStates) {
          this.stateEnum = pick(nextStates);
        } else {
          this.stateEnum = S.sitIdle;
        }
      }
      
      this.idleCounter = 0;
      this._applyState();
    }
    this._render();
  }

  _holdTime() {
    switch (this.stateEnum) {
      case S.runRight: case S.runLeft: return 130;
      case S.walkRight: case S.walkLeft: return 60;
      case S.standRight: case S.standLeft: return 60;
      case S.sitIdle: case S.lie: return 50;
      case S.swipe: return 15;
      default: return 50;
    }
  }

  _speedMul() {
    return (this.stateEnum === S.runRight || this.stateEnum === S.runLeft) ? 1.6 : 1;
  }

  _nextFrame() {
    this.idleCounter++;
    const dir = STATE_DIR[this.stateEnum];
    const maxRight = Math.max(0, this.boundary - this.spriteSize);

    if (dir === DIR.right && (this.stateEnum === S.walkRight || this.stateEnum === S.runRight)) {
      this.left += this.speed * this._speedMul();
      if (this.left >= maxRight) { this.left = maxRight; return 'complete'; }
    } else if (dir === DIR.left && (this.stateEnum === S.walkLeft || this.stateEnum === S.runLeft)) {
      this.left -= this.speed * this._speedMul();
      if (this.left <= 0) { this.left = 0; return 'complete'; }
    }

    if (this.idleCounter > this._holdTime()) return 'complete';
    return 'continue';
  }

  _applyState() {
    const dir = STATE_DIR[this.stateEnum];
    if (dir === DIR.left) this.facingDir = DIR.left;
    else if (dir === DIR.right) this.facingDir = DIR.right;
  }

  _render() {
    const sprite = SPRITE_MAP[this.stateEnum];
    const src = `${SPRITE_BASE}_${sprite}_8fps.gif`;
    if (!this.img.src.endsWith(`_${sprite}_8fps.gif`)) {
      this.img.src = src;
    }
    this.img.style.left = `${this.left}px`;
    this.img.style.transform = this.facingDir === DIR.left ? 'scaleX(-1)' : 'scaleX(1)';
  }
}

// ── Fullscreen Overlay ──────────────────────────────

function openFullscreen() {
  const overlay = document.getElementById('bunny-fullscreen');
  if (!overlay) return;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (!overlay._scene) {
    overlay._scene = new BunnyScene(overlay.querySelector('.bunny-scene-inner'), {
      spriteSize: 110, floor: 0, isLarge: true,
    });
  }
  overlay._scene._resize();
  overlay._scene.start();
}

function closeFullscreen() {
  const overlay = document.getElementById('bunny-fullscreen');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  overlay._scene?.stop();
}

// ── Valentine Tab Wiring ────────────────────────────

function activateBunnyValentineTab() {
  const bunnyTab = document.getElementById('viewTabBunny');
  const gardenTab = document.getElementById('viewTabGarden');
  const albumTab = document.getElementById('viewTabAlbum');

  const bunnyPanel = document.getElementById('valentineBunny');
  const gardenPanel = document.getElementById('valentineGarden');
  const albumPanel = document.getElementById('valentineAlbum');

  [gardenTab, albumTab].forEach(t => {
    t?.classList.remove('active');
    t?.setAttribute('aria-selected', 'false');
  });
  [gardenPanel, albumPanel].forEach(p => p?.classList.remove('active'));

  bunnyTab?.classList.add('active');
  bunnyTab?.setAttribute('aria-selected', 'true');
  bunnyPanel?.classList.add('active');

  setCurrentValentineView('bunny');

  if (!bunnyPanel._scene) {
    bunnyPanel._scene = new BunnyScene(bunnyPanel.querySelector('.bunny-scene-inner'), {
      spriteSize: 80, floor: 0, isLarge: true,
    });
  }
  bunnyPanel._scene._resize();
  bunnyPanel._scene.start();
}

function deactivateBunnyValentineTab() {
  const bunnyPanel = document.getElementById('valentineBunny');
  const bunnyTab = document.getElementById('viewTabBunny');
  bunnyPanel?.classList.remove('active');
  bunnyTab?.classList.remove('active');
  bunnyTab?.setAttribute('aria-selected', 'false');
  bunnyPanel?._scene?.stop();
}

// ── Styles ──────────────────────────────────────────

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
#bunnySection {
  position: relative;
  overflow: hidden;
  height: 180px;
  border-radius: 16px;
  cursor: pointer;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)),
    linear-gradient(45deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
#bunnySection::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  z-index: 10;
}
#bunnySection:hover {
  border-color: rgba(215,165,15,0.35);
  box-shadow: 0 0 20px rgba(215,165,15,0.08);
}
body.light-theme #bunnySection {
  background:
    linear-gradient(135deg, rgba(0,0,0,0.03), rgba(0,0,0,0.01)),
    linear-gradient(45deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01));
  border-color: rgba(0,0,0,0.1);
}
body.light-theme #bunnySection:hover {
  border-color: rgba(187,129,68,0.4);
  box-shadow: 0 0 20px rgba(187,129,68,0.1);
}

/* Fullscreen overlay */
#bunny-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #0a0705;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}
#bunny-fullscreen.active {
  opacity: 1;
  pointer-events: auto;
}
#bunny-fullscreen .bunny-scene-inner {
  position: absolute;
  inset: 0;
}
#bunny-fullscreen .bunny-close {
  position: absolute;
  top: 20px;
  right: 24px;
  z-index: 10;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.7);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
#bunny-fullscreen .bunny-close:hover {
  background: rgba(255,255,255,0.2);
  color: #fff;
}

/* Valentine bunny tab panel */
#valentineBunny .bunny-scene-inner {
  position: relative;
  width: 100%;
  height: 420px;
  border-radius: 12px;
  overflow: hidden;
}
/* Bunny specific animations and overlays */
@keyframes floatUpFade {
  0% { transform: translateY(0) scale(0.8); opacity: 0; }
  20% { opacity: 1; transform: translateY(-5px) scale(1.1); }
  100% { transform: translateY(-25px) scale(1); opacity: 0; }
}

.bunny-dream {
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bunny-dream::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background: inherit;
  border-radius: 50%;
  box-shadow: inherit;
}
.bunny-dream::before {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-150%);
  width: 4px;
  height: 4px;
  background: inherit;
  border-radius: 50%;
}
.dream-icon {
  font-size: 16px;
  animation: gentlePulse 2s ease-in-out infinite;
}
@keyframes gentlePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
`;
  document.head.appendChild(style);
}

// ── Init ────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();

  // Card scene
  const cardContainer = document.querySelector('#bunnySection');
  if (cardContainer) {
    const cardScene = new BunnyScene(cardContainer, {
      spriteSize: 40, floor: 0, isLarge: false,
    });
    cardScene.start();
    cardContainer.addEventListener('click', () => openFullscreen());
  }

  // Fullscreen close
  const overlay = document.getElementById('bunny-fullscreen');
  if (overlay) {
    overlay.querySelector('.bunny-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeFullscreen();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('bunny-scene-inner')) {
        closeFullscreen();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeFullscreen();
    });
  }

  // Valentine tab: register deactivate so valentine.js can call it when switching back to Garden/Album
  window.__bunnyDeactivate = deactivateBunnyValentineTab;

  const bunnyTab = document.getElementById('viewTabBunny');
  if (bunnyTab) {
    bunnyTab.addEventListener('click', () => activateBunnyValentineTab());
  }
});
