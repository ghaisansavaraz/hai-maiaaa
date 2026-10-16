/* The Moonlit Meadow — entry point.
   Builds the world, runs the render loop with cinematic post-processing,
   handles interactions, the birthday ending, adaptive quality and dev tools. */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import {
  WORLD_UNLOCK_DATE, WORLD_SHOW_MESSAGES, WORLD_LANTERN_MESSAGES, WORLD_ITEM_MESSAGES, WORLD_FINAL_MESSAGE,
  WORLD_HER_NAME, WORLD_FROM_NAME, LETTERS_DATA,
} from '../config.js';
import { localDateMs, nextFrame, smoothstep } from './util.js';
import { Heightfield, SPAWN, MOON_DIR, DOCK, GREENHOUSE, HILL, lakeDist } from './layout.js';
import { createSkyUniforms, createSky } from './sky.js';
import { createTerrain, createRocks, createLeafLitter, createLilies, createDock, createPlaza } from './terrain.js';
import { createGrass, createFlowers, MAX_LIGHTS } from './grass.js';
import { createWater } from './water.js';
import { createTrees } from './trees.js';
import { createLanterns, createBench, createGreenhouse, createMoonGate, createBunny } from './props.js';
import { createFireflies, createDrift, createMist, createBursts } from './particles.js';
import { createAudio } from './audio.js';
import { createPlayer } from './player.js';

const $ = (id) => document.getElementById(id);
const LANTERN_KEY = 'maiaaa_world_lanterns';
const DEV_FLAG = 'maiaaa_world_dev';
const DEV_PASS = '000';

/* ---------------- color grade (vignette, grain, cool lift) ---------------- */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.34 },
    uGrain: { value: 0.012 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uVignette; uniform float uGrain;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb += vec3(0.0025, 0.0035, 0.008) * (1.0 - smoothstep(0.0, 0.2, l));   // moonlit shadows
      c.rgb = mix(vec3(l), c.rgb, 1.05);
      vec2 d = (vUv - 0.5) * vec2(1.0, 0.85);
      c.rgb *= mix(1.0 - uVignette, 1.0, smoothstep(0.78, 0.2, length(d)));
      float n = fract(sin(dot(vUv * vec2(1231.7, 673.3) + fract(uTime) * 91.7, vec2(12.9898, 78.233))) * 43758.5453);
      c.rgb += (n - 0.5) * uGrain * (0.25 + l);
      gl_FragColor = c;
    }`,
};

async function main() {
  $('enterBtn').disabled = true;
  document.querySelectorAll('[data-name]').forEach((el) => { el.textContent = WORLD_HER_NAME; });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- renderer / scene / camera ---------- */
  const canvas = $('worldCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const dpr = window.devicePixelRatio || 1;
  renderer.setPixelRatio(Math.min(dpr, 1.5));
  renderer.setSize(Math.max(innerWidth, 1), Math.max(innerHeight, 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  // guard against a 0×0 window at load (would poison the projection with NaN)
  const viewW = () => Math.max(innerWidth, 1);
  const viewH = () => Math.max(innerHeight, 1);
  const camera = new THREE.PerspectiveCamera(66, viewW() / viewH(), 0.06, 1400);

  /* ---------- palette (night, warmed toward dusk by her local clock) ---------- */
  const hour = new Date().getHours() + new Date().getMinutes() / 60;
  const dusk = hour >= 21 || hour < 5 ? 0
    : hour >= 17 ? 1 - smoothstep(17, 21, hour)
    : hour < 8 ? 0.75 : 0.55;

  const skyUniforms = createSkyUniforms();
  const horizon = new THREE.Color('#16244a').lerp(new THREE.Color('#33375e'), dusk * 0.3);
  skyUniforms.uHorizon.value.copy(horizon);
  skyUniforms.uZenith.value.set('#030816').lerp(new THREE.Color('#0a1330'), dusk * 0.3);
  skyUniforms.uDusk.value = dusk * 0.5;
  scene.fog = new THREE.FogExp2(horizon.clone().multiplyScalar(0.85), 0.0115);

  const moonDir = new THREE.Vector3(...MOON_DIR);
  const hemi = new THREE.HemisphereLight('#4a62a8', '#22301c', 1.55);
  scene.add(hemi);
  const moonLight = new THREE.DirectionalLight('#a9bbff', 1.75);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  const sc = moonLight.shadow.camera;
  sc.left = -38; sc.right = 38; sc.top = 38; sc.bottom = -38; sc.near = 1; sc.far = 230;
  sc.updateProjectionMatrix();
  moonLight.shadow.bias = -0.0005;
  moonLight.shadow.normalBias = 0.045;
  scene.add(moonLight, moonLight.target);

  const shared = {
    uTime: skyUniforms.uTime,
    uPlayer: { value: new THREE.Vector3() },
    uCamPos: { value: new THREE.Vector3() },
    uMoonDir: { value: moonDir.clone() },
    uMoonView: { value: new THREE.Vector3() },   // moon direction in view space
    uMoonColor: { value: moonLight.color.clone().multiplyScalar(moonLight.intensity) },
    uSkyAmb: { value: hemi.color.clone().multiplyScalar(hemi.intensity) },
    uGroundAmb: { value: hemi.groundColor.clone().multiplyScalar(hemi.intensity) },
    uFogColor: { value: scene.fog.color },
    uFogDensity: { value: scene.fog.density },
    uLights: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4(0, -500, 0, 0)) },
    uLightCols: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Color(0, 0, 0)) },
  };

  /* ---------- build the world ---------- */
  const setLoading = () => {}; // loading screen is just the moon, no text
  await nextFrame();
  setLoading('shaping the hills');
  const hf = new Heightfield();
  await nextFrame();
  scene.add(createTerrain(hf));
  const rocks = createRocks(hf);
  scene.add(rocks.mesh, createLeafLitter(hf), createLilies(), createDock(hf), createPlaza());

  setLoading('growing the grass');
  await nextFrame();
  const grass = createGrass(hf, shared);
  scene.add(grass.group);
  const flowers = createFlowers(hf, shared);
  scene.add(flowers.group);

  setLoading('planting the trees');
  await nextFrame();
  const trees = createTrees(hf, shared);
  scene.add(trees.group);

  setLoading('filling the lake');
  await nextFrame();
  const water = createWater(skyUniforms, shared);
  scene.add(water.mesh);
  const sky = createSky(scene, skyUniforms);

  setLoading('lighting the lanterns');
  await nextFrame();
  let readLanterns = [];
  try { readLanterns = JSON.parse(localStorage.getItem(LANTERN_KEY) || '[]'); } catch { /* ignore */ }
  const lanterns = createLanterns(hf, WORLD_LANTERN_MESSAGES);
  lanterns.lanterns.forEach((l) => { l.read = readLanterns.includes(l.index); });
  scene.add(lanterns.group);
  const letter = LETTERS_DATA[0] || { title: 'For you', content: '' };
  const bench = createBench(letter);
  scene.add(bench.group);
  const greenhouse = createGreenhouse(WORLD_ITEM_MESSAGES);
  scene.add(greenhouse.group);
  const gate = createMoonGate();
  scene.add(gate.group);
  const bunny = createBunny(hf);
  scene.add(bunny.group);

  const fireflies = createFireflies(hf, shared);
  scene.add(fireflies.points);
  const drift = createDrift(shared);
  scene.add(drift.points);
  const mist = createMist();
  scene.add(mist.group);
  const bursts = createBursts();
  scene.add(bursts.points);

  // the 8 point lights, in a fixed order, mirrored into the custom shaders
  const pointLights = [...lanterns.lanterns.map((l) => l.light), bench.light, greenhouse.light, gate.light];

  /* ---------- player ---------- */
  const colliders = [
    ...trees.colliders, ...rocks.colliders, ...lanterns.lanterns.map((l) => l.collider),
    ...bench.colliders, ...greenhouse.colliders, ...gate.colliders,
  ];
  const player = createPlayer(camera, document.body, hf, colliders, { reducedMotion });
  const audio = createAudio();

  /* ---------- post-processing ---------- */
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.6, 0.72, 0.82);
  composer.addPass(bloom);
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  /* ---------- quality ---------- */
  const LEVELS = [
    { pr: 0.75, grass: 34, dens: 0.45, shadow: 1024 },
    { pr: 1.0, grass: 46, dens: 0.65, shadow: 1024 },
    { pr: Math.min(dpr, 1.5), grass: 58, dens: 0.85, shadow: 2048 },
    { pr: Math.min(dpr, 2), grass: 70, dens: 1.0, shadow: 2048 },
  ];
  let level = 2, downgraded = false;
  function applyQuality(i) {
    const q = LEVELS[i];
    camera.aspect = viewW() / viewH();
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(q.pr);
    renderer.setSize(viewW(), viewH());
    composer.setPixelRatio(q.pr);
    composer.setSize(viewW(), viewH());
    grass.setQuality(q.grass, q.dens);
    for (const m of [fireflies.material, drift.material, bursts.material]) m.uniforms.uPixelRatio.value = q.pr;
    if (moonLight.shadow.mapSize.x !== q.shadow) {
      moonLight.shadow.mapSize.set(q.shadow, q.shadow);
      if (moonLight.shadow.map) { moonLight.shadow.map.dispose(); moonLight.shadow.map = null; }
    }
  }
  applyQuality(level);
  addEventListener('resize', () => applyQuality(level));

  /* ---------- state ---------- */
  const devFlag = (() => { try { return sessionStorage.getItem(DEV_FLAG) === '1'; } catch { return false; } })();
  let devUnlocked = devFlag;
  const isUnlocked = () => devUnlocked || Date.now() >= localDateMs(WORLD_UNLOCK_DATE);
  let celebrating = false;
  let celebrate = 0;
  let time = 0;
  let cardOpen = false, cardFinale = false;
  const cardAt = new THREE.Vector2();

  /* ---------- UI helpers ---------- */
  const card = $('card');
  function showCard({ title = '', body = '', sign = '', finale = false }) {
    if (!WORLD_SHOW_MESSAGES) return; // texts are switched off in config.js
    card.querySelector('.card-title').textContent = title;
    card.querySelector('.card-body').textContent = body;
    card.querySelector('.card-sign').textContent = sign;
    card.classList.toggle('finale', finale);
    card.classList.add('on');
    cardOpen = true;
    cardFinale = finale;
    cardAt.set(player.x, player.z);
  }
  function hideCard() { card.classList.remove('on'); cardOpen = false; }
  let hintTimer = 0;
  function hint(text, seconds = 6) {
    $('hint').textContent = text;
    $('hint').classList.add('on');
    hintTimer = seconds;
  }

  /* ---------- interactables ---------- */
  const interactables = [
    ...lanterns.lanterns.map((l) => ({
      ...l.interact,
      get label() {
        if (!WORLD_SHOW_MESSAGES) return l.read ? '' : 'click to warm the lantern';
        return l.read ? 'click to read again' : 'click to warm the lantern';
      },
      act() {
        if (!l.read) {
          l.read = true;
          bursts.emit(l.world, 30);
          audio.chime();
          const read = lanterns.lanterns.filter((x) => x.read).map((x) => x.index);
          try { localStorage.setItem(LANTERN_KEY, JSON.stringify(read)); } catch { /* ignore */ }
        }
        showCard({ body: l.interact.message });
      },
    })),
    // letter + greenhouse notes only exist to show text, so they're not clickable while texts are off
    ...(WORLD_SHOW_MESSAGES ? [
      { ...bench.interact, act() { audio.chime(); showCard({ title: letter.title, body: letter.content, sign: `— ${WORLD_FROM_NAME}` }); } },
      ...greenhouse.interacts.map((it) => ({ ...it, act() { showCard({ body: it.message }); } })),
    ] : []),
    { ...bunny.interact, act() { bunny.poke(); bursts.emit(bunny.interact.center, 7, true); } },
    {
      ...gate.interact,
      get label() { return celebrating ? '' : isUnlocked() ? 'click to step into the moonlight' : 'this one opens on your birthday'; },
      act() {
        if (celebrating) return;
        if (isUnlocked()) startCelebration();
        else showCard({ body: 'Not yet. The moon is still getting ready — come back on your birthday.' });
      },
    },
  ];
  const camDir = new THREE.Vector3();
  const oc = new THREE.Vector3();
  function pick() {
    camera.getWorldDirection(camDir);
    let best = null, bestT = Infinity;
    for (const it of interactables) {
      oc.subVectors(it.center, camera.position);
      const t = oc.dot(camDir);
      if (t < 0 || t > (it.reach || 3.3) || t > bestT) continue;
      const d2 = oc.lengthSq() - t * t;
      if (d2 < it.radius * it.radius) { best = it; bestT = t; }
    }
    return best;
  }

  function startCelebration() {
    celebrating = true;
    audio.finale();
    bursts.emit(gate.interact.center, 60);
    setTimeout(() => showCard({
      title: WORLD_FINAL_MESSAGE.title, body: WORLD_FINAL_MESSAGE.body, sign: `— ${WORLD_FROM_NAME}`, finale: true,
    }), 3200);
  }

  /* ---------- input ---------- */
  const controls = player.controls;
  let current = null;
  let devOpen = false;
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !controls.isLocked) return;
    if (cardOpen) { hideCard(); return; }
    if (current) current.act();
  });
  // dev chord: hold 0, press D
  let zeroHeld = false;
  const isZero = (e) => e.code === 'Digit0' || e.code === 'Numpad0';
  document.addEventListener('keyup', (e) => { if (isZero(e)) zeroHeld = false; });
  window.addEventListener('blur', () => { zeroHeld = false; });
  document.addEventListener('keydown', (e) => {
    if (isZero(e)) zeroHeld = true;
    if (devOpen) return;
    if (e.code === 'KeyM') { const m = audio.toggleMute(); updateMuteLabel(m); hint(m ? 'sound off' : 'sound on', 1.8); }
    if (e.code === 'KeyE' && controls.isLocked) { if (cardOpen) hideCard(); else if (current) current.act(); }
    if (e.code === 'KeyD' && zeroHeld) { e.preventDefault(); openDev(); }
  });
  function updateMuteLabel(m) {
    const b = $('muteBtn2');
    b.classList.toggle('muted', m);
    b.setAttribute('aria-label', m ? 'sound off' : 'sound on');
  }
  updateMuteLabel(audio.muted);
  $('muteBtn2').addEventListener('click', (e) => { e.stopPropagation(); updateMuteLabel(audio.toggleMute()); });

  let entered = false;
  controls.addEventListener('lock', () => {
    $('intro').classList.add('hidden');
    $('pause').classList.add('hidden');
    $('crosshair').classList.add('on');
    audio.pause(false);
  });
  controls.addEventListener('unlock', () => {
    $('crosshair').classList.remove('on');
    $('prompt').classList.remove('on');
    if (devOpen) return;
    $('pause').classList.remove('hidden');
    audio.pause(true);
  });
  $('enterBtn').addEventListener('click', () => {
    audio.start();
    entered = true;
    // lets the dashboard's flower doorway stop "calling" once she's been here
    try { localStorage.setItem('maiaaa_world_visited', '1'); } catch { /* ignore */ }
    $('fade').classList.remove('on');
    controls.lock();
    hint('W A S D to walk · mouse to look · follow the lanterns', 8);
    setTimeout(() => hint('the night is prettier with you in it', 7), 16000);
  });
  $('resumeBtn').addEventListener('click', () => controls.lock());

  /* ---------- dev tools (hold 0 + D → passcode 000) ---------- */
  let showFps = false;
  function openDev() {
    devOpen = true;
    document.exitPointerLock?.();
    $('dev').classList.remove('hidden');
    const gateEl = $('dev').querySelector('.dev-gate');
    const tools = $('dev').querySelector('.dev-tools');
    if (devFlag || sessionStorage.getItem('maiaaa_world_dev_ok') === '1') { gateEl.classList.add('hidden'); tools.classList.remove('hidden'); }
    else { gateEl.classList.remove('hidden'); tools.classList.add('hidden'); setTimeout(() => $('devPass').focus(), 50); }
  }
  function closeDev() { devOpen = false; $('dev').classList.add('hidden'); $('pause').classList.remove('hidden'); }
  $('devPass').addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') closeDev();
    if (e.key !== 'Enter') return;
    if (e.target.value === DEV_PASS) {
      try { sessionStorage.setItem('maiaaa_world_dev_ok', '1'); } catch { /* ignore */ }
      $('dev').querySelector('.dev-gate').classList.add('hidden');
      $('dev').querySelector('.dev-tools').classList.remove('hidden');
    } else { $('devErr').textContent = 'incorrect passcode'; e.target.value = ''; }
  });
  const spots = {
    spawn: [SPAWN.x, SPAWN.z, 0],
    dock: [DOCK.x, DOCK.zEnd + 4.5, 0],
    greenhouse: [GREENHOUSE.x - GREENHOUSE.hw - 2.2, GREENHOUSE.z, -Math.PI / 2],
    // on the gate's axis, looking through the ring at the moon
    hill: (() => {
      const h = Math.hypot(MOON_DIR[0], MOON_DIR[2]);
      const mx = MOON_DIR[0] / h, mz = MOON_DIR[2] / h;
      return [HILL.x - mx * 8, HILL.z + 1.5 - mz * 8, Math.atan2(-mx, -mz)];
    })(),
  };
  $('dev').addEventListener('click', (e) => {
    const k = e.target.dataset?.dev;
    if (!k) return;
    if (k === 'unlock') { devUnlocked = true; hint('birthday ending unlocked (preview)', 2.5); }
    else if (k === 'fps') { showFps = !showFps; }
    else if (k === 'close') { closeDev(); return; }
    else if (spots[k]) player.teleport(...spots[k]);
    if (k !== 'fps') closeDev();
  });

  /* ---------- loop ---------- */
  const lightPos = new THREE.Vector3();
  const lightBasis = new THREE.Matrix4().lookAt(moonDir, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
  const LX = new THREE.Vector3().setFromMatrixColumn(lightBasis, 0);
  const LY = new THREE.Vector3().setFromMatrixColumn(lightBasis, 1);
  const LZ = new THREE.Vector3().setFromMatrixColumn(lightBasis, 2);
  const snapped = new THREE.Vector3();
  let fpsAcc = 0, fpsFrames = 0, qAcc = 0, qFrames = 0, qTimer = 0;

  function update(dt) {
    time += dt;
    shared.uTime.value = time;
    grade.uniforms.uTime.value = time;

    const step = player.update(dt);
    if (step) audio.footstep(step);
    shared.uPlayer.value.set(player.x, 0, player.z);
    shared.uCamPos.value.copy(camera.position);
    camera.updateMatrixWorld();
    shared.uMoonView.value.copy(moonDir).transformDirection(camera.matrixWorldInverse);

    // moon shadow frustum follows her, snapped to texels so it doesn't shimmer
    const texel = (sc.right - sc.left) / moonLight.shadow.mapSize.x;
    const c = camera.position;
    const px = Math.round(c.dot(LX) / texel) * texel, py = Math.round(c.dot(LY) / texel) * texel, pz = c.dot(LZ);
    snapped.copy(LX).multiplyScalar(px).addScaledVector(LY, py).addScaledVector(LZ, pz);
    moonLight.target.position.copy(snapped);
    moonLight.position.copy(snapped).addScaledVector(moonDir, 110);

    // birthday ending ramps
    celebrate += ((celebrating ? 1 : 0) - celebrate) * Math.min(1, dt * 0.35);
    fireflies.material.uniforms.uCelebrate.value = celebrate;
    drift.material.uniforms.uSwirl.value = celebrate;
    skyUniforms.uStarBoost.value = 1 + celebrate * 0.6;
    skyUniforms.uAurora.value = 0.35 + celebrate * 2.2;
    flowers.moonMat.userData.glow.value = 1.25 + celebrate * 1.2;

    grass.update(camera.position);
    water.update(dt, time);
    sky.update(dt, camera, { celebrate: celebrating });
    lanterns.update(time, dt, celebrating);
    bench.update(time);
    gate.update(time, dt, isUnlocked(), celebrating);
    bunny.update(time, dt, player);
    mist.update(time);
    bursts.update(dt);

    pointLights.forEach((l, i) => {
      l.getWorldPosition(lightPos);
      shared.uLights.value[i].set(lightPos.x, lightPos.y, lightPos.z, l.intensity);
      shared.uLightCols.value[i].copy(l.color);
    });

    // interaction target + prompt
    current = controls.isLocked && !cardOpen ? pick() : null;
    const label = current ? current.label : '';
    const promptEl = $('prompt');
    if (promptEl.textContent !== label) promptEl.textContent = label;
    promptEl.classList.toggle('on', !!label);
    $('crosshair').classList.toggle('target', !!current);

    if (cardOpen && !cardFinale && cardAt.distanceTo(new THREE.Vector2(player.x, player.z)) > 6) hideCard();
    if (hintTimer > 0) { hintTimer -= dt; if (hintTimer <= 0) $('hint').classList.remove('on'); }

    audio.update(dt, 1 - smoothstep(1.0, 1.7, lakeDist(player.x, player.z)));
  }

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    update(dt);
    composer.render(dt);

    // adaptive quality (only while actually walking around)
    if (controls.isLocked) {
      const ms = dt * 1000;
      qAcc += ms; qFrames++; qTimer += dt;
      if (qTimer > 3) {
        const avg = qAcc / qFrames;
        if (avg > 26 && level > 0) { level--; downgraded = true; applyQuality(level); }
        else if (avg < 13 && level < LEVELS.length - 1 && !downgraded) { level++; applyQuality(level); }
        qAcc = qFrames = qTimer = 0;
      }
    }
    if (showFps) {
      fpsAcc += dt; fpsFrames++;
      if (fpsAcc > 0.5) { $('devFps').textContent = `${Math.round(fpsFrames / fpsAcc)} fps · quality ${level}`; fpsAcc = fpsFrames = 0; }
    }
  }

  /* ---------- warm up + reveal ---------- */
  player.teleport(SPAWN.x, SPAWN.z, 0, -0.04);
  setLoading('almost there');
  await nextFrame();
  try { await renderer.compileAsync(scene, camera); } catch { renderer.compile(scene, camera); }
  update(0.016);
  composer.render(0.016);
  requestAnimationFrame(frame);

  $('loading').classList.add('hidden');
  $('intro').classList.remove('hidden');
  $('fade').classList.remove('on');
  $('enterBtn').disabled = false;

  // small debug hook (handy for testing; harmless for her)
  window.__world = {
    renderer, scene, camera, player,
    renderOnce() { update(0.016); composer.render(0.016); },
    teleport: (k, ...rest) => (spots[k] ? player.teleport(...spots[k]) : player.teleport(k, ...rest)),
    unlock() { devUnlocked = true; },
    celebrate() { devUnlocked = true; startCelebration(); },
    info: () => ({ grassBlades: grass.total, fireflies: fireflies.count, level, unlocked: isUnlocked(), entered }),
  };
}

main().catch((err) => {
  console.error('[Meadow] failed to start', err);
  const t = document.querySelector('.loading-text');
  if (t) t.textContent = 'this could not open on this browser.';
});
