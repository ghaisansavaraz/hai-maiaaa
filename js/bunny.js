// Autumn Bunny — Sleepy Companion Mode + Interactive scenes
// Renders a walking white bunny over an autumn forest scene with falling leaves.

import { setCurrentValentineView } from './valentine.js';

const SPRITE_BASE = 'assets/bunny/white';
const AUTUMN_BG = 'assets/autumn/background.png';
const AUTUMN_FG = 'assets/autumn/foreground.png';

const LEAF_COLORS = ['#D7A50F', '#704910', '#A22D16', '#BB8144'];

// ── States ──────────────────────────────────────────

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
    
    // Spawn leaves in a tight band just below the tree canopy
    const canopyY = h - this.treeLine;
    const groundY = h - this.floor;
    
    // Define spawn band: start slightly below canopy top, end mid-way to ground
    // This creates a natural falling zone visible below trees but not on ground
    const bandHeight = Math.min(150, (groundY - canopyY) * 0.6);
    const bandStart = canopyY + 20; // just below tree tops
    const bandEnd = bandStart + bandHeight;
    
    this.originY = rand(bandStart, Math.min(bandEnd, groundY - 30));
    // Clamp so we never start below the ground or above canvas
    this.originY = Math.max(canopyY, Math.min(this.originY, groundY - 20));
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
    // More leaves for a denser autumn effect
    const count = isLarge ? 60 : 40;
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
    // If canvas width changed since leaves were initialized, redistribute them
    if (this.canvas.width > 100) {
      for (const leaf of this.leaves) {
        if (leaf.originX < 10 || leaf.originX > this.canvas.width - 10) {
          leaf.reset(true);
        }
      }
    }
    this._raf = requestAnimationFrame(() => this._loop());
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  resize(w, h) {
    const oldW = this.canvas.width;
    this.canvas.width = w;
    this.canvas.height = h;
    
    // If width changed significantly, redistribute all leaves proportionally
    if (oldW > 0 && Math.abs(w - oldW) > 50) {
      const ratio = w / oldW;
      for (const leaf of this.leaves) {
        // Scale the leaf's origin position to fit new width
        leaf.originX = Math.min(w - 50, Math.max(0, leaf.originX * ratio));
        leaf.x = leaf.originX + leaf.amp * Math.sin(leaf.dx);
      }
    }
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
  constructor(container, { spriteSize = 55, floor = 0, isLarge = false, isInteractive = false } = {}) {
    this.container = container;
    this.spriteSize = spriteSize;
    this.floor = floor;
    this.isLarge = isLarge;
    this.isInteractive = isInteractive;
    this.running = false;
    this.left = 0;
    this.speed = rand(1.2, 2.0);
    this.stateEnum = S.sitIdle;
    this.idleCounter = 0;
    this.facingDir = DIR.right;

    // Sleep / interaction state
    this.isSleepMode = false;
    this._walkTarget = null;
    this._walkTargetCallback = null;
    this._zzzTimeout = null;
    this._heartCooldown = 0;
    this._activeHearts = 0;
    this._foodEl = null;

    // Interactive DOM refs (set in _buildDOM when isInteractive)
    this.sleepBtn = null;
    this.zzzContainer = null;
    this.bubbleContainer = null;
    this.particlesContainer = null;

    this._buildDOM();
    this._resetBoundary();
    this.left = rand(0, Math.max(0, this.boundary - this.spriteSize));
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

    if (this.isInteractive) {
      this._buildInteractiveDOM();
    }
  }

  _buildInteractiveDOM() {
    // Zzz container (z-index 7)
    const zzzContainer = document.createElement('div');
    zzzContainer.className = 'bunny-zzz-container';
    this.container.appendChild(zzzContainer);
    this.zzzContainer = zzzContainer;

    // Thought bubble container (z-index 8)
    const bubbleContainer = document.createElement('div');
    bubbleContainer.className = 'bunny-bubble-container';
    this.container.appendChild(bubbleContainer);
    this.bubbleContainer = bubbleContainer;

    // Particles (hearts + food) — highest layer (z-index 9)
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'bunny-particles';
    this.container.appendChild(particlesContainer);
    this.particlesContainer = particlesContainer;

    // Sleep toggle button — top-right corner (z-index 6)
    const sleepBtn = document.createElement('button');
    sleepBtn.className = 'bunny-sleep-btn';
    sleepBtn.setAttribute('aria-label', 'Tuck in bunny');
    sleepBtn.setAttribute('title', 'Tuck in / Wake up');
    sleepBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    this.container.appendChild(sleepBtn);
    this.sleepBtn = sleepBtn;

    sleepBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.isSleepMode) {
        this.disableSleepMode();
      } else {
        this.enableSleepMode();
      }
    });

    this._initInteractions();
  }

  _initInteractions() {
    // Hover hearts — awake bunny only, throttled
    this.container.addEventListener('mousemove', (e) => {
      if (this.isSleepMode || this._walkTarget !== null) return;
      const now = Date.now();
      if (now - this._heartCooldown < 320) return;
      if (this._activeHearts >= 5) return;

      const rect = this.container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const bunnyX = this.left + this.spriteSize / 2;
      const bunnyY = this.container.clientHeight - this.floor - this.spriteSize * 0.5;
      const dist = Math.hypot(mouseX - bunnyX, mouseY - bunnyY);

      if (dist < 58) {
        this._heartCooldown = now;
        this._spawnHeart(mouseX, mouseY - 18);
      }
    });

    // Touch petting — finger near bunny
    this.container.addEventListener('touchmove', (e) => {
      if (this.isSleepMode || this._walkTarget !== null) return;
      const now = Date.now();
      if (now - this._heartCooldown < 400) return;
      if (this._activeHearts >= 5) return;

      const touch = e.touches[0];
      const rect = this.container.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;
      const bunnyX = this.left + this.spriteSize / 2;
      const bunnyY = this.container.clientHeight - this.floor - this.spriteSize * 0.5;
      const dist = Math.hypot(touchX - bunnyX, touchY - bunnyY);

      if (dist < 70) {
        this._heartCooldown = now;
        this._spawnHeart(touchX, touchY - 20);
      }
    }, { passive: true });

    // Click scene while sleeping = dream bubble; double-click while awake = drop food
    this.container.addEventListener('click', (e) => {
      if (this.isSleepMode) this._spawnThoughtBubble();
    });

    this.container.addEventListener('dblclick', (e) => {
      if (this.isSleepMode) return;
      const rect = this.container.getBoundingClientRect();
      this._dropFood(e.clientX - rect.left, e.clientY - rect.top);
    });
  }

  // ── Sleep Mode ───────────────────────────────────

  enableSleepMode() {
    this.isSleepMode = true;
    if (this.sleepBtn) {
      this.sleepBtn.classList.add('active');
      this.sleepBtn.setAttribute('aria-label', 'Wake up bunny');
    }

    // Walk to center, then lie down
    const centerX = Math.max(0, Math.min(
      this.boundary / 2 - this.spriteSize / 2,
      this.boundary - this.spriteSize
    ));
    this._walkTarget = centerX;
    this._walkTargetCallback = () => {
      this.stateEnum = S.lie;
      this._applyState();
      this._render();
      // Begin Zzz
      this._startZzz();
    };
  }

  disableSleepMode() {
    this.isSleepMode = false;
    if (this.sleepBtn) {
      this.sleepBtn.classList.remove('active');
      this.sleepBtn.setAttribute('aria-label', 'Tuck in bunny');
    }

    // Stop Zzz
    this._stopZzz();

    // Clear thought bubbles
    if (this.bubbleContainer) this.bubbleContainer.innerHTML = '';

    // Resume state machine
    this.stateEnum = S.sitIdle;
    this.idleCounter = 0;
    this._applyState();
  }

  _startZzz() {
    this._stopZzz();
    const spawnLoop = () => {
      if (!this.isSleepMode || !this.running) return;
      this._spawnZzzElement();
      this._zzzTimeout = setTimeout(spawnLoop, 900 + Math.random() * 400);
    };
    this._zzzTimeout = setTimeout(spawnLoop, 400);
  }

  _stopZzz() {
    if (this._zzzTimeout) {
      clearTimeout(this._zzzTimeout);
      this._zzzTimeout = null;
    }
    if (this.zzzContainer) this.zzzContainer.innerHTML = '';
  }

  _spawnZzzElement() {
    if (!this.zzzContainer) return;
    const variants = [
      { text: 'Z', cls: 'bunny-zzz-large' },
      { text: 'z', cls: 'bunny-zzz-small' },
      { text: 'Z', cls: 'bunny-zzz-medium' },
    ];
    const v = pick(variants);

    const el = document.createElement('div');
    el.className = `bunny-zzz ${v.cls}`;
    el.textContent = v.text;

    const bunnyX = this.left + this.spriteSize / 2;
    el.style.left = `${bunnyX - 8 + (Math.random() - 0.5) * 28}px`;
    el.style.bottom = `${this.floor + this.spriteSize + 4 + Math.random() * 14}px`;

    this.zzzContainer.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  // ── Dream Bubbles ────────────────────────────────

  _spawnThoughtBubble() {
    if (!this.bubbleContainer) return;
    this.bubbleContainer.innerHTML = '';

    const dreams = ['❤️', '🥕', '🌙', '⭐', '🌸', '🍃'];
    const dream = pick(dreams);

    const wrap = document.createElement('div');
    wrap.className = 'bunny-thought-bubble';

    const body = document.createElement('div');
    body.className = 'bunny-thought-bubble-body';
    body.textContent = dream;

    // Small connecting dots
    const dot1 = document.createElement('div');
    dot1.className = 'bunny-thought-dot';
    dot1.style.cssText = 'width:8px;height:8px;bottom:-10px;left:50%;transform:translateX(-50%);';

    const dot2 = document.createElement('div');
    dot2.className = 'bunny-thought-dot';
    dot2.style.cssText = 'width:5px;height:5px;bottom:-17px;left:44%;';

    body.appendChild(dot1);
    body.appendChild(dot2);
    wrap.appendChild(body);

    const bunnyX = this.left + this.spriteSize / 2;
    wrap.style.left = `${bunnyX - 28}px`;
    wrap.style.bottom = `${this.floor + this.spriteSize + 16}px`;

    this.bubbleContainer.appendChild(wrap);
    setTimeout(() => wrap.remove(), 2900);
  }

  // ── Hearts ───────────────────────────────────────

  _spawnHeart(x, y) {
    if (!this.particlesContainer) return;
    this._activeHearts++;
    const el = document.createElement('div');
    el.className = 'bunny-heart';
    el.textContent = '♥';
    el.style.left = `${x + (Math.random() - 0.5) * 18}px`;
    el.style.top = `${y}px`;
    this.particlesContainer.appendChild(el);
    setTimeout(() => {
      el.remove();
      this._activeHearts = Math.max(0, this._activeHearts - 1);
    }, 1900);
  }

  // ── Food Drop ────────────────────────────────────

  _dropFood(x, y) {
    if (!this.particlesContainer || this._foodEl || this._walkTarget !== null) return;

    const foods = ['🥕', '🍃', '🌿'];
    const el = document.createElement('div');
    el.className = 'bunny-food';
    el.textContent = pick(foods);

    const dropX = Math.max(10, Math.min(x, this.container.clientWidth - 30));
    const bottomY = this.container.clientHeight - this.floor - 24;

    el.style.left = `${dropX - 10}px`;
    el.style.top = `${bottomY}px`;
    this.particlesContainer.appendChild(el);
    this._foodEl = el;

    // Walk bunny to food
    const targetX = Math.max(0, Math.min(dropX - this.spriteSize / 2, this.boundary - this.spriteSize));
    this._walkTarget = targetX;
    this._walkTargetCallback = () => {
      // Eat (swipe) then resume
      this.stateEnum = S.swipe;
      this._applyState();
      this._render();
      setTimeout(() => {
        if (this._foodEl) {
          this._foodEl.remove();
          this._foodEl = null;
        }
        this.stateEnum = S.sitIdle;
        this.idleCounter = 0;
        this._applyState();
      }, 750);
    };
  }

  // ── State Machine ────────────────────────────────

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

    // Re-apply sleep mode if it was active when we stopped
    if (this.isSleepMode && this.isInteractive) {
      this._startZzz();
    }
  }

  stop() {
    this.running = false;
    this.leafEffect.stop();
    if (this._interval) clearInterval(this._interval);
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);

    if (this.isInteractive) {
      this._stopZzz();
      if (this.bubbleContainer) this.bubbleContainer.innerHTML = '';
      if (this.particlesContainer) {
        // Keep food/hearts cleared
        if (this._foodEl) { this._foodEl.remove(); this._foodEl = null; }
        this._activeHearts = 0;
      }
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
    // Walk-to-target mode: drives movement toward a goal (sleep center or food)
    if (this._walkTarget !== null) {
      this._tickWalkToTarget();
      return;
    }

    // Sleep lock: frozen in lie state
    if (this.isSleepMode) {
      if (this.stateEnum !== S.lie) {
        this.stateEnum = S.lie;
        this.idleCounter = 0;
        this._applyState();
      }
      this._render();
      return;
    }

    // Normal state machine
    const result = this._nextFrame();
    if (result === 'complete') {
      const nextStates = TRANSITIONS[this.stateEnum];
      if (nextStates) {
        this.stateEnum = pick(nextStates);
      } else {
        this.stateEnum = S.sitIdle;
      }
      this.idleCounter = 0;
      this._applyState();
    }
    this._render();
  }

  _tickWalkToTarget() {
    const target = this._walkTarget;
    const threshold = this.speed * 1.8;

    if (Math.abs(this.left - target) <= threshold) {
      this.left = target;
      this._walkTarget = null;
      const cb = this._walkTargetCallback;
      this._walkTargetCallback = null;
      this._applyState();
      this._render();
      if (cb) cb();
      return;
    }

    if (this.left < target) {
      this.stateEnum = S.walkRight;
      this.facingDir = DIR.right;
      this.left = Math.min(this.left + this.speed * 1.5, target);
    } else {
      this.stateEnum = S.walkLeft;
      this.facingDir = DIR.left;
      this.left = Math.max(this.left - this.speed * 1.5, target);
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
      spriteSize: 80, floor: 0, isLarge: true, isInteractive: true,
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

/* Valentine bunny tab panel */
#valentineBunny .bunny-scene-inner {
  position: relative;
  width: 100%;
  height: 420px;
  border-radius: 12px;
  overflow: hidden;
}

/* ─── Sleep toggle button ─── */
.bunny-sleep-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 6;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.22);
  color: rgba(255,255,255,0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 0;
}
.bunny-sleep-btn:hover {
  background: rgba(255,255,255,0.2);
  color: rgba(230,230,255,0.95);
  box-shadow: 0 0 14px rgba(190,195,255,0.4);
  border-color: rgba(200,205,255,0.35);
}
.bunny-sleep-btn.active {
  background: rgba(150,155,255,0.2);
  border-color: rgba(200,205,255,0.5);
  color: rgba(235,238,255,1);
  box-shadow: 0 0 18px rgba(180,185,255,0.55), 0 0 34px rgba(160,165,255,0.28);
}

/* ─── Zzz elements ─── */
.bunny-zzz-container {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
  overflow: hidden;
}
.bunny-zzz {
  position: absolute;
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
  color: rgba(220, 228, 255, 1);
  text-shadow: 0 0 10px rgba(200, 210, 255, 0.9), 0 0 22px rgba(180, 195, 255, 0.55);
  animation: bunnyZzzFloat 4.2s ease-out forwards;
  pointer-events: none;
  user-select: none;
}
.bunny-zzz.bunny-zzz-large  { font-size: 26px; font-weight: 600; }
.bunny-zzz.bunny-zzz-medium { font-size: 19px; font-weight: 500; }
.bunny-zzz.bunny-zzz-small  { font-size: 14px; font-weight: 400; }
@keyframes bunnyZzzFloat {
  0%   { opacity: 0;    transform: translate(0, 0) scale(0.5); }
  12%  { opacity: 1;    transform: translate(4px, -18px) scale(1.05); }
  55%  { opacity: 0.95; transform: translate(-4px, -70px) scale(1.12); }
  100% { opacity: 0;    transform: translate(6px, -130px) scale(0.85); }
}

/* ─── Thought bubble ─── */
.bunny-bubble-container {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
}
.bunny-thought-bubble {
  position: absolute;
  pointer-events: none;
  animation: bunnyBubbleAppear 2.9s ease-out forwards;
  transform-origin: bottom center;
}
.bunny-thought-bubble-body {
  background: rgba(255, 255, 255, 0.93);
  border-radius: 50%;
  width: 54px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  filter: grayscale(1);
  box-shadow:
    0 4px 16px rgba(0,0,0,0.16),
    0 0 22px rgba(200,210,255,0.35);
  position: relative;
}
.bunny-thought-dot {
  position: absolute;
  background: rgba(255, 255, 255, 0.93);
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
@keyframes bunnyBubbleAppear {
  0%   { opacity: 0; transform: scale(0.2) translateY(8px); }
  14%  { opacity: 1; transform: scale(1.08) translateY(0); }
  24%  { transform: scale(1) translateY(0); }
  78%  { opacity: 1; }
  100% { opacity: 0; transform: scale(0.88) translateY(-10px); }
}

/* ─── Floating hearts ─── */
.bunny-particles {
  position: absolute;
  inset: 0;
  z-index: 9;
  pointer-events: none;
  overflow: visible;
}
.bunny-heart {
  position: absolute;
  pointer-events: none;
  user-select: none;
  color: rgba(255, 155, 185, 0.92);
  font-size: 15px;
  animation: bunnyHeartFloat 1.95s ease-out forwards;
  text-shadow: 0 0 7px rgba(255, 130, 165, 0.5);
}
@keyframes bunnyHeartFloat {
  0%   { opacity: 0; transform: translateY(0) scale(0.5) rotate(-12deg); }
  20%  { opacity: 1; transform: translateY(-14px) scale(1.05) rotate(6deg); }
  60%  { opacity: 0.9; transform: translateY(-38px) scale(0.97) rotate(-4deg); }
  100% { opacity: 0; transform: translateY(-65px) scale(0.72) rotate(9deg); }
}

/* ─── Food drop ─── */
.bunny-food {
  position: absolute;
  pointer-events: none;
  user-select: none;
  font-size: 19px;
  animation: bunnyFoodDrop 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transform-origin: center bottom;
}
@keyframes bunnyFoodDrop {
  0%   { transform: translateY(-22px) scale(0.35); opacity: 0; }
  65%  { transform: translateY(4px) scale(1.14); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
`;
  document.head.appendChild(style);
}

// ── Init ────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();

  // Card scene (small, click navigates to Valentine page Autumn tab)
  const cardContainer = document.querySelector('#bunnySection');
  if (cardContainer) {
    const cardScene = new BunnyScene(cardContainer, {
      spriteSize: 40, floor: 0, isLarge: false, isInteractive: false,
    });
    cardScene.start();
    cardContainer.addEventListener('click', () => {
      // Navigate to Valentine page
      const rightNavBtn = document.querySelector('.nav-btn.right');
      if (rightNavBtn) rightNavBtn.click();
      // Wait for transition, then activate Autumn tab
      setTimeout(() => {
        const bunnyTab = document.getElementById('viewTabBunny');
        if (bunnyTab) bunnyTab.click();
      }, 300);
    });
  }

  // Valentine tab wiring
  window.__bunnyDeactivate = deactivateBunnyValentineTab;

  const bunnyTab = document.getElementById('viewTabBunny');
  if (bunnyTab) {
    bunnyTab.addEventListener('click', () => activateBunnyValentineTab());
  }
});
