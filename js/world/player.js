/* First-person walking: pointer-lock mouse look, WASD / arrows, Shift to stroll
   a little faster, gentle head-bob (off with reduced motion), soft
   acceleration, sliding collision against trees, posts, walls, the bounds and
   the water (the dock is walkable), and surface-aware footstep events. */

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EYE_HEIGHT, SPAWN, onDock, boundsDist, pathEdgeDist, autumnAt } from './layout.js';

const RADIUS = 0.3;
const WALK = 2.9;
const STROLL = 5.0;
const CELL = 8;

export function createPlayer(camera, domElement, hf, colliders, opts = {}) {
  const controls = new PointerLockControls(camera, domElement);
  controls.pointerSpeed = 0.65;
  controls.minPolarAngle = 0.18;
  controls.maxPolarAngle = Math.PI - 0.14;

  // spatial hash of colliders
  const grid = new Map();
  const addTo = (cx, cz, c) => {
    const k = `${cx},${cz}`;
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(c);
  };
  for (const c of colliders) {
    let x0, z0, x1, z1;
    if (c.seg) {
      x0 = Math.min(c.seg[0], c.seg[2]) - c.r; x1 = Math.max(c.seg[0], c.seg[2]) + c.r;
      z0 = Math.min(c.seg[1], c.seg[3]) - c.r; z1 = Math.max(c.seg[1], c.seg[3]) + c.r;
    } else {
      x0 = c.x - c.r; x1 = c.x + c.r; z0 = c.z - c.r; z1 = c.z + c.r;
    }
    x0 -= RADIUS; x1 += RADIUS; z0 -= RADIUS; z1 += RADIUS;
    for (let cz = Math.floor(z0 / CELL); cz <= Math.floor(z1 / CELL); cz++) {
      for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) addTo(cx, cz, c);
    }
  }

  function resolve(x, z) {
    const list = grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`);
    if (!list) return [x, z];
    for (let pass = 0; pass < 2; pass++) {
      for (const c of list) {
        let px, pz;
        if (c.seg) {
          const [ax, az, bx, bz] = c.seg;
          const vx = bx - ax, vz = bz - az;
          const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1)));
          px = ax + vx * t; pz = az + vz * t;
        } else { px = c.x; pz = c.z; }
        const dx = x - px, dz = z - pz;
        const d = Math.hypot(dx, dz);
        const min = c.r + RADIUS;
        if (d < min) {
          const nx = d > 1e-5 ? dx / d : 1, nz = d > 1e-5 ? dz / d : 0;
          x = px + nx * min;
          z = pz + nz * min;
        }
      }
    }
    return [x, z];
  }

  const valid = (x, z) => boundsDist(x, z) < 0.965 && (hf.sample(x, z) > -0.18 || onDock(x, z));

  const keys = new Set();
  const onKey = (e, down) => {
    const k = e.code;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(k)) {
      if (down) keys.add(k); else keys.delete(k);
    }
  };
  document.addEventListener('keydown', (e) => onKey(e, true));
  document.addEventListener('keyup', (e) => onKey(e, false));
  window.addEventListener('blur', () => keys.clear());

  const pos = new THREE.Vector2(SPAWN.x, SPAWN.z);
  const vel = new THREE.Vector2();
  let eyeY = hf.walkHeight(pos.x, pos.y) + EYE_HEIGHT;
  let bob = 0;
  let lastBob = 0;
  let enabled = true;
  const fwd = new THREE.Vector3();
  const reduced = !!opts.reducedMotion;

  function look(yaw, pitch) {
    camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
  }
  look(0, -0.04);
  camera.position.set(pos.x, eyeY, pos.y);

  return {
    controls,
    get x() { return pos.x; },
    get z() { return pos.y; },
    get speed() { return vel.length(); },
    setEnabled(v) { enabled = v; if (!v) keys.clear(); },
    teleport(x, z, yaw = 0, pitch = -0.05) {
      pos.set(x, z);
      vel.set(0, 0);
      eyeY = hf.walkHeight(x, z) + EYE_HEIGHT;
      camera.position.set(x, eyeY, z);
      look(yaw, pitch);
    },
    /** Returns a surface name when a footstep lands this frame, else null. */
    update(dt) {
      let ix = 0, iz = 0;
      if (enabled && controls.isLocked) {
        if (keys.has('KeyW') || keys.has('ArrowUp')) iz += 1;
        if (keys.has('KeyS') || keys.has('ArrowDown')) iz -= 1;
        if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
      }
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      fwd.normalize();
      const rx = -fwd.z, rz = fwd.x; // right vector
      let wx = fwd.x * iz + rx * ix, wz = fwd.z * iz + rz * ix;
      const wl = Math.hypot(wx, wz);
      const max = keys.has('ShiftLeft') || keys.has('ShiftRight') ? STROLL : WALK;
      if (wl > 0) { wx = (wx / wl) * max; wz = (wz / wl) * max; }
      const accel = wl > 0 ? 5.5 : 7.5;
      vel.x += (wx - vel.x) * Math.min(1, dt * accel);
      vel.y += (wz - vel.y) * Math.min(1, dt * accel);

      let nx = pos.x + vel.x * dt, nz = pos.y + vel.y * dt;
      [nx, nz] = resolve(nx, nz);
      if (!valid(nx, nz)) {
        if (valid(nx, pos.y)) nz = pos.y;
        else if (valid(pos.x, nz)) nx = pos.x;
        else { nx = pos.x; nz = pos.y; vel.set(0, 0); }
      }
      pos.set(nx, nz);

      const target = hf.walkHeight(pos.x, pos.y) + EYE_HEIGHT;
      eyeY += (target - eyeY) * Math.min(1, dt * 10);

      const sp = vel.length();
      bob += sp * dt * 2.15;
      const s = Math.sin(bob * 2);
      const amp = reduced ? 0 : 0.032 * Math.min(sp / WALK, 1.3);
      camera.position.set(pos.x, eyeY + s * amp, pos.y);

      let step = null;
      if (sp > 0.6 && lastBob > -0.85 && s <= -0.85) {
        step = onDock(pos.x, pos.y) ? 'wood'
          : autumnAt(pos.x, pos.y) > 0.5 ? 'leaves'
          : pathEdgeDist(pos.x, pos.y) < 0 ? 'path' : 'grass';
      }
      lastBob = s;
      return step;
    },
  };
}
