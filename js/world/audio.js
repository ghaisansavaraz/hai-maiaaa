/* Sound. Music + chime reuse the dashboard's own audio files; everything else
   (wind, crickets, lapping water, footsteps) is synthesized with WebAudio, so
   there are no extra assets. Starts on the "enter" click (autoplay rules). */

const MUSIC = "assets/Maia's Garden/Maia's Garden.mp3";
const CHIME = 'assets/Wind chime Zen/Wind chime, Hai Maiaaa.mp3';
const FINALE = 'assets/Marygold Clock/Plaza Senayan Marygold Clock Song.mp3';
const MUTE_KEY = 'maiaaa_world_muted';

export function createAudio() {
  let ctx = null, master = null, started = false;
  let music = null, musicGain = null, finale = null, finaleGain = null;
  let windGain = null, waterGain = null, noiseBuf = null;
  let cricketTimer = 1.5;
  let muted = (() => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } })();

  function mediaTrack(src, loop, gainValue) {
    const el = new Audio(src);
    el.loop = loop;
    el.preload = 'auto';
    const g = ctx.createGain();
    g.gain.value = gainValue;
    ctx.createMediaElementSource(el).connect(g).connect(master);
    return { el, g };
  }

  function noiseSource() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    return src;
  }

  function start() {
    if (started) return;
    started = true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);

    // 3s of brown-ish noise reused by wind / water / footsteps
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04; d[i] = last * 3.2; }

    ({ el: music, g: musicGain } = mediaTrack(MUSIC, true, 0));
    music.play().catch(() => {});
    musicGain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 7);

    // wind: band-passed noise, slowly breathing
    const wind = noiseSource();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.45;
    windGain = ctx.createGain(); windGain.gain.value = 0.0;
    wind.connect(bp).connect(windGain).connect(master);
    wind.start();
    windGain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 6);

    // lapping water near the lake (gain driven by distance)
    const water = noiseSource();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 520;
    waterGain = ctx.createGain(); waterGain.gain.value = 0;
    water.connect(lp).connect(waterGain).connect(master);
    water.start(0, 1.3);
  }

  function chirp() {
    const t = ctx.currentTime;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 2 - 1;
    const g = ctx.createGain();
    g.gain.value = 0;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 4000 + Math.random() * 900;
    o.connect(g).connect(pan).connect(master);
    const pulses = 2 + Math.floor(Math.random() * 3);
    const vol = 0.006 + Math.random() * 0.01;
    for (let i = 0; i < pulses; i++) {
      const s = t + i * 0.075;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(vol, s + 0.012);
      g.gain.linearRampToValueAtTime(0, s + 0.05);
    }
    o.start(t);
    o.stop(t + pulses * 0.075 + 0.1);
  }

  return {
    start,
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* private mode */ }
      if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.15);
      return muted;
    },
    pause(p) {
      if (!ctx) return;
      if (p) ctx.suspend(); else ctx.resume();
    },
    chime() {
      if (!ctx) return;
      const el = new Audio(CHIME);
      el.volume = 0.55;
      el.muted = muted;
      el.play().catch(() => {});
    },
    footstep(surface) {
      if (!ctx) return;
      const t = ctx.currentTime;
      const src = noiseSource();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      if (surface === 'leaves') { f.type = 'highpass'; f.frequency.value = 2400; }
      else if (surface === 'path') { f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 0.8; }
      else if (surface === 'wood') { f.type = 'lowpass'; f.frequency.value = 380; }
      else { f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.5; }
      const vol = surface === 'leaves' ? 0.16 : surface === 'wood' ? 0.4 : 0.11;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0008, t + (surface === 'wood' ? 0.16 : 0.13));
      src.connect(f).connect(g).connect(master);
      src.start(t, Math.random() * 2.5);
      src.stop(t + 0.2);
    },
    finale() {
      if (!ctx || finale) return;
      musicGain.gain.setTargetAtTime(0, ctx.currentTime, 1.5);
      ({ el: finale, g: finaleGain } = mediaTrack(FINALE, true, 0));
      finale.play().catch(() => {});
      finaleGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 4);
      this.chime();
    },
    // little food sounds: a soft pop when she's handed something, a bite
    pop() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(880, t + 0.08);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.18);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.2);
    },
    bite() {
      if (!ctx) return;
      const t = ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const src = noiseSource();
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 900; f.Q.value = 0.9;
        const g = ctx.createGain();
        const s = t + i * 0.09;
        g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.12, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, s + 0.07);
        src.connect(f).connect(g).connect(master); src.start(s, Math.random() * 2); src.stop(s + 0.09);
      }
    },
    // a church bell: a bronze bell's partials (hum, prime, minor-third tierce,
    // quint, nominal and above) with long, uneven decays and slow beating,
    // struck again and again as it swings, each strike a little softer
    bell() {
      if (!ctx) return;
      const now = ctx.currentTime;
      const partials = [
        [98, 0.42, 10], [196, 0.3, 7], [233.1, 0.36, 6], [294, 0.16, 3.5],
        [392, 0.5, 4.5], [588, 0.2, 2.2], [784, 0.14, 1.6], [1046, 0.07, 0.9],
      ];
      const out = ctx.createGain();
      out.gain.value = 0.32;
      out.connect(master);
      const strikes = [0.05, 1.32, 2.62, 3.92, 5.2, 6.5];
      strikes.forEach((st, si) => {
        const t = now + st;
        const amp = Math.exp(-st * 0.42);
        for (const [f, g, dec] of partials) {
          for (const det of [0, 1.3]) { // a slightly detuned twin makes the warm beating
            const o = ctx.createOscillator();
            o.type = 'sine';
            o.frequency.value = f + det * (f / 400);
            const gn = ctx.createGain();
            gn.gain.setValueAtTime(0, t);
            gn.gain.linearRampToValueAtTime(g * amp * (det ? 0.5 : 1), t + 0.008);
            gn.gain.exponentialRampToValueAtTime(0.0001, t + dec * (si === strikes.length - 1 ? 1.4 : 1));
            o.connect(gn).connect(out);
            o.start(t);
            o.stop(t + dec * 1.4 + 0.1);
          }
        }
        // the metallic strike itself
        const src = noiseSource();
        const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 2600; hp.Q.value = 1.2;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.25 * amp, t + 0.003); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        src.connect(hp).connect(ng).connect(out);
        src.start(t, Math.random() * 2); src.stop(t + 0.15);
      });
    },
    // an oar dipping into the water
    oar() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const src = noiseSource();
      const f = ctx.createBiquadFilter(); f.type = 'lowpass';
      f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(300, t + 0.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.6);
      src.connect(f).connect(g).connect(master); src.start(t, Math.random() * 2); src.stop(t + 0.65);
    },
    // fireworks: a soft thump + rising whistle at launch...
    fireworkLaunch(dist) {
      if (!ctx) return;
      const t = ctx.currentTime + dist / 343;
      const vol = 0.5 / (1 + dist / 60);
      const src = noiseSource();
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * 0.9, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.25);
      src.connect(lp).connect(g).connect(master);
      src.start(t, Math.random() * 2); src.stop(t + 0.3);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(700 + Math.random() * 200, t + 0.05);
      o.frequency.exponentialRampToValueAtTime(1500 + Math.random() * 500, t + 1.4);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0, t + 0.05);
      og.gain.linearRampToValueAtTime(vol * 0.05, t + 0.3);
      og.gain.linearRampToValueAtTime(0, t + 1.45);
      o.connect(og).connect(master);
      o.start(t + 0.05); o.stop(t + 1.5);
    },
    // ...and a deep boom (delayed by distance like real fireworks), sometimes crackling
    fireworkBoom(dist, big, crackle) {
      if (!ctx) return;
      const t = ctx.currentTime + dist / 343;
      const vol = (big ? 1.0 : 0.75) / (1 + dist / 70);
      const src = noiseSource();
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(900, t);
      lp.frequency.exponentialRampToValueAtTime(120, t + 0.6);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0005, t + (big ? 2.2 : 1.5));
      src.connect(lp).connect(g).connect(master);
      src.start(t, Math.random() * 1.5); src.stop(t + 2.3);
      if (!crackle) return;
      for (let i = 0; i < 26; i++) {
        const ct = t + 0.6 + Math.random() * 1.1;
        const c = noiseSource();
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(0, ct);
        cg.gain.linearRampToValueAtTime(vol * 0.35 * Math.random(), ct + 0.002);
        cg.gain.exponentialRampToValueAtTime(0.0003, ct + 0.04);
        c.connect(hp).connect(cg).connect(master);
        c.start(ct, Math.random() * 2.5); c.stop(ct + 0.05);
      }
    },
    update(dt, nearWater) {
      if (!ctx) return;
      waterGain.gain.setTargetAtTime(nearWater * 0.12, ctx.currentTime, 0.5);
      windGain.gain.setTargetAtTime(0.07 + Math.sin(ctx.currentTime * 0.13) * 0.03, ctx.currentTime, 1.5);
      cricketTimer -= dt;
      if (cricketTimer <= 0) { chirp(); cricketTimer = 0.4 + Math.random() * 1.6; }
    },
  };
}
