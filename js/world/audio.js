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
    update(dt, nearWater) {
      if (!ctx) return;
      waterGain.gain.setTargetAtTime(nearWater * 0.12, ctx.currentTime, 0.5);
      windGain.gain.setTargetAtTime(0.07 + Math.sin(ctx.currentTime * 0.13) * 0.03, ctx.currentTime, 1.5);
      cricketTimer -= dt;
      if (cricketTimer <= 0) { chirp(); cricketTimer = 0.4 + Math.random() * 1.6; }
    },
  };
}
