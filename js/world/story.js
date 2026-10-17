/* The story: Mr. Frundles (the bunny) leads her through four chapters.
     1. entrance  — he waits by the first lantern; warming it starts the walk
     2. pier      — down the pier to the pendopo at the end
     3. desk      — into the greenhouse, to her study desk; she opens her journal
     4. hilltop   — up the hill to the lantern pedestal (the birthday ending)
   She can wander anywhere at any time; the story is a gentle guide. Progress
   is remembered between visits. Chapter texts come from config.js and only
   show when WORLD_SHOW_MESSAGES is on. */

import * as THREE from 'three';
import {
  MAIN_PATH, DOCK_PATH, GREENHOUSE_PATH, PIER, GREENHOUSE, HILL, mainPathAt,
} from './layout.js';

const KEY = 'maiaaa_world_story';
export const CHAPTER_IDS = ['entrance', 'pier', 'desk', 'hill'];

/* ---------------- routes ---------------- */

// dense samples of the main path so he follows its curves
const FINE = [];
for (let f = 0; f <= 1.00001; f += 0.0025) {
  const p = mainPathAt(Math.min(f, 1));
  FINE.push({ f, x: p.x, z: p.z });
}
function fOf(x, z) {
  let best = 0, bd = 1e9;
  for (const p of FINE) {
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < bd) { bd = d; best = p.f; }
  }
  return best;
}
/** Main path points from f0 to f1 (either direction), ~1.5 m apart. */
function mainRun(f0, f1) {
  const out = [];
  const len = Math.abs(f1 - f0);
  const n = Math.max(2, Math.round(len * 300));
  for (let i = 0; i <= n; i++) {
    const p = mainPathAt(f0 + (f1 - f0) * (i / n));
    out.push([p.x, p.z]);
  }
  return out;
}
const rev = (a) => a.slice().reverse();

export function buildRoutes() {
  const lanternF = 0.075;
  const e = mainPathAt(lanternF - 0.012);
  const ENTRANCE = [e.x - e.tz * 1.3, e.z + e.tx * 1.3]; // beside the path, opposite the lantern
  const fDock = fOf(...MAIN_PATH[6]);       // [-8, 34], where the pier path branches
  const fGh = fOf(...GREENHOUSE_PATH[0]);   // [20, 9], where the greenhouse path branches
  const P = PIER, G = GREENHOUSE;
  // inside the pendopo at the end of the pier, beside the bench
  const GAZEBO = [P.x - 1.3, P.pendopo.z + 0.9];
  const pierIn = [[P.x, P.gate.z], [P.x, 16], [P.x, 8], [P.x, 1], [P.x, P.spine.z0 - 0.4]];
  // through the grand door, round the centrepiece, up the west flight to her desk on the dais
  const Fl = G.flight, Da = G.dais;
  const DESK = [G.x - 1.8, G.z + Da.z0 + 2.5];
  const ghIn = [
    [G.x, G.z + G.half + 3.6], [G.x, G.z + G.half - 0.8], [G.x - 1.5, G.z + 3.4], [G.x - 1.5, G.z + 1.3],
    [G.x - 0.6, G.z + 0.85], [G.x - 0.6, G.z + Fl.z1 + 0.4], // between the brass stanchions [G.x - 0.6, G.z + (Fl.z0 + Fl.z1) / 2], [G.x - Fl.x0 - 0.3, G.z + (Fl.z0 + Fl.z1) / 2],
    [G.x - Da.hw + 0.5, G.z + (Fl.z0 + Fl.z1) / 2], [G.x - Da.hw + 0.5, G.z + Da.z1 - 0.7], [G.x - 3.2, G.z + Da.z1 - 1.0],
  ];
  const HILLSPOT = [HILL.x + 1.15, HILL.z + 1.4];

  const toPier = (f0) => [...mainRun(f0, fDock), ...DOCK_PATH.slice(1), ...pierIn, GAZEBO];
  const toDeskFromMain = (f0) => [...mainRun(f0, fGh), ...GREENHOUSE_PATH.slice(1), ...ghIn, DESK];
  const toHillFromMain = (f0) => [...mainRun(f0, 1), HILLSPOT];

  return {
    stops: { entrance: ENTRANCE, pier: GAZEBO, desk: DESK, hill: HILLSPOT },
    // from the previous stop
    next: {
      pier: toPier(lanternF),
      desk: [...rev(pierIn), ...rev(DOCK_PATH).slice(1), ...toDeskFromMain(fDock).slice(1)],
      hill: [...rev(ghIn), ...rev(GREENHOUSE_PATH).slice(1), ...toHillFromMain(fGh).slice(1)],
    },
    // when she comes back another day and starts again at the entrance
    fromStart: {
      pier: toPier(lanternF),
      desk: toDeskFromMain(lanternF),
      hill: toHillFromMain(lanternF),
    },
  };
}

/* ---------------- glowing paw prints ---------------- */

function pawPrints(scene) {
  const N = 90;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  const geo = new THREE.PlaneGeometry(0.09, 0.14).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, color: '#ffffff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -4,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  mesh.frustumCulled = false;
  scene.add(mesh);
  const born = new Float32Array(N).fill(-100);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  let next = 0;
  const hide = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < N; i++) mesh.setMatrixAt(i, hide);
  return {
    add(x, y, z, yaw, time) {
      for (const side of [-1, 1]) {
        const i = next; next = (next + 1) % N;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        p.set(x + Math.cos(yaw) * side * 0.06, y + 0.012, z - Math.sin(yaw) * side * 0.06);
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
        born[i] = time;
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
    update(time) {
      const col = mesh.instanceColor.array;
      for (let i = 0; i < N; i++) {
        const age = time - born[i];
        const a = age < 0 || age > 9 ? 0 : Math.min(age * 4, 1) * (1 - age / 9);
        col[i * 3] = 0.55 * a; col[i * 3 + 1] = 0.7 * a; col[i * 3 + 2] = 1.0 * a;
      }
      mesh.instanceColor.needsUpdate = true;
    },
  };
}

/* ---------------- the story state machine ---------------- */

export function createStory({ scene, hf, bunny, bursts, audio, chapters, showCard, onDesk }) {
  const routes = buildRoutes();
  const prints = pawPrints(scene);
  let done = new Set();
  try { done = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { /* ignore */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...done])); } catch { /* ignore */ } };
  const pending = () => CHAPTER_IDS.find((id) => !done.has(id)) || null;
  const text = (id) => (chapters || []).find((c) => c.id === id) || {};
  let time = 0;

  bunny.onStep = (x, z, yaw) => prints.add(x, hf.walkHeight(x, z), z, yaw, time);
  bunny.onPoof = (x, z) => bursts.emit(new THREE.Vector3(x, hf.walkHeight(x, z) + 0.3, z), 10);

  function sendTo(id, from) {
    const route = (from === 'start' ? routes.fromStart : routes.next)[id];
    if (!route) return;
    bunny.guide(route, () => {
      bunny.setHome(...routes.stops[id], id === 'hill' ? 0.8 : 1.2);
    });
  }

  // where Mr. Frundles starts today
  const first = pending();
  const [ex, ez] = routes.stops.entrance;
  bunny.teleport(ex, ez);
  bunny.setHome(ex, ez, 1.4);
  if (first && first !== 'entrance') sendTo(first, 'start');
  if (done.has('desk') && onDesk) onDesk(true);

  function complete(id) {
    if (done.has(id)) return;
    done.add(id);
    save();
    const c = text(id);
    if (c.message) showCard({ title: c.title || '', body: c.message });
    audio?.chime();
    bursts.emit(new THREE.Vector3(bunny.x, hf.walkHeight(bunny.x, bunny.z) + 0.4, bunny.z), 9, true);
    if (id === 'desk' && onDesk) onDesk(true);
    bunny.poke();
    const nxt = pending();
    if (nxt) setTimeout(() => sendTo(nxt, 'next'), 1600);
  }

  const gz = new THREE.Vector2(PIER.x, PIER.pendopo.z);
  return {
    get pending() { return pending(); },
    complete,
    /** Called by main when the first lantern is warmed. */
    lanternWarmed(index) { if (index === 0) complete('entrance'); },
    journalOpened() { complete('desk'); },
    update(dt, player) {
      time += dt;
      prints.update(time);
      const p = pending();
      // walked past the grove without warming the first lantern: off we go anyway
      if (p === 'entrance' && player.z < 74) complete('entrance');
      if (p === 'pier' && Math.abs(player.x - gz.x) < PIER.pendopo.half - 0.3 && Math.abs(player.z - gz.y) < PIER.pendopo.half - 0.3) complete('pier');
      // a quiet nudge only while he's leading and she's lost sight of him
      const far = Math.hypot(player.x - bunny.x, player.z - bunny.z);
      return { hint: bunny.guiding && far > 9 };
    },
    reset() { done.clear(); save(); },
  };
}
