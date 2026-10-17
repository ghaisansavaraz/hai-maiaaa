/* Small shared helpers for the Moonlit Meadow: seeded RNG, value noise,
   easing, and canvas-generated textures (no image files needed). */

import * as THREE from 'three';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2i(x, y) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 2D value noise in [-1, 1]. */
export function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2i(xi, yi), b = hash2i(xi + 1, yi);
  const c = hash2i(xi, yi + 1), d = hash2i(xi + 1, yi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}

/** Fractal noise in roughly [-1, 1]. */
export function fbm2(x, y, octaves = 4) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * freq + i * 17.3, y * freq - i * 9.1);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
export const easeInOut = (t) => t * t * (3 - 2 * t);

/** Parse 'YYYY-MM-DD' as LOCAL midnight (new Date('YYYY-MM-DD') would be UTC). */
export function localDateMs(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/* ---------------- canvas textures ---------------- */

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

/** Soft radial glow (white core fading out). Used for halos, sprites, light pools. */
export function glowTexture(size = 128, falloff = 2.2) {
  // Built from raw pixels with the glow in the COLOUR channels and alpha fixed
  // at 1. (A 2D-canvas gradient stores very faint pixels as premultiplied 8-bit
  // alpha; un-premultiplying them on upload gives random coloured speckles,
  // which showed up as glitter around the moon, letter and bunny.)
  const data = new Uint8Array(size * size * 4);
  const h = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = Math.min(Math.hypot(x + 0.5 - h, y + 0.5 - h) / h, 1);
      const v = Math.round(255 * Math.pow(1 - t, falloff));
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/** Grayscale detail noise for terrain micro-variation. */
export function detailTexture(size = 256) {
  const c = canvas(size);
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // tileable by sampling a torus-wrapped domain
      const n =
        noise2(x * 0.06, y * 0.06) * 0.5 +
        noise2(x * 0.19 + 11, y * 0.19 - 4) * 0.3 +
        noise2(x * 0.55 - 7, y * 0.55 + 3) * 0.2;
      const v = Math.round(clamp(222 + n * 34, 0, 255));
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  // soften the wrap seam by blending opposite edges
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** White marble with soft grey veins (for the vase). */
export function marbleTexture(size = 512) {
  const c = canvas(size);
  const g = c.getContext('2d');
  g.fillStyle = '#f4f2ed';
  g.fillRect(0, 0, size, size);
  const rng = mulberry32(77);
  g.lineCap = 'round';
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < 9; i++) {
      g.strokeStyle = `rgba(${150 + pass * 10},${152 + pass * 10},${160 + pass * 8},${0.08 + rng() * 0.12})`;
      g.lineWidth = 0.6 + rng() * (2.5 - pass * 0.6);
      g.beginPath();
      let x = rng() * size, y = 0;
      g.moveTo(x, y);
      while (y < size) {
        const nx = x + (rng() - 0.5) * 60;
        const ny = y + 20 + rng() * 50;
        g.quadraticCurveTo(x + (rng() - 0.5) * 50, (y + ny) / 2, nx, ny);
        x = nx; y = ny;
      }
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** Soft cloudy blob (for mist sprites). */
export function cloudTexture(size = 128) {
  // raw RGBA (not a 2D canvas) so faint alpha isn't mangled by premultiplication
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - size / 2) / (size / 2), dy = (y - size / 2) / (size / 2);
      const r = Math.sqrt(dx * dx + dy * dy);
      const n = fbm2(x * 0.05, y * 0.05, 4) * 0.5 + 0.5;
      const a = clamp((1 - smoothstep(0.25, 1.0, r)) * (0.35 + n * 0.75), 0, 1);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(a * 255);
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

export function tileTexture(size = 256) {
  const c = canvas(size);
  const g = c.getContext('2d');
  g.fillStyle = '#5f5a52';
  g.fillRect(0, 0, size, size);
  const rng = mulberry32(5);
  const n = 4, s = size / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = 128 + Math.floor(rng() * 34);
      g.fillStyle = `rgb(${v + 18},${v + 12},${v})`;
      g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** "WORLD'S / BEST / REVA" label for the 3D mug (transparent background). */
export function mugTextTexture() {
  const w = 512, h = 384;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#161616';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '800 92px "Arial Black", "Helvetica Neue", Arial, sans-serif';
  g.fillText("WORLD'S", w / 2, h * 0.24);
  g.fillText('BEST', w / 2, h * 0.5);
  g.fillText('REVA', w / 2, h * 0.76);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Yield to the browser so the loading text can repaint between heavy steps.
    Races rAF against a timeout so it still resolves in a backgrounded tab. */
export const nextFrame = () => new Promise((resolve) => {
  let done = false;
  const finish = () => { if (!done) { done = true; resolve(); } };
  requestAnimationFrame(() => setTimeout(finish, 0));
  setTimeout(finish, 60);
});
