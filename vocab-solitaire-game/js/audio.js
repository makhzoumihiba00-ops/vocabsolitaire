/* ==========================================================================
   VocabSolitaire — Sound engine (Web Audio API, no audio files needed)
   The AudioContext is created lazily on the first user gesture so
   autoplay policies never block the chimes.
   ========================================================================== */

const Sfx = (() => {
  let ctx = null;
  let master = null;
  let enabled = true;

  try {
    enabled = localStorage.getItem(GAME_CONFIG.storageKeys.sound) !== "off";
  } catch (e) { /* storage unavailable — keep default */ }

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.42;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /**
   * Play one tone starting `delay` seconds from now.
   * freq may glide toward slideTo across the note for a softer chime tail.
   */
  function tone(freq, delay, duration, type = "sine", vol = 0.5, slideTo = null) {
    const c = ensureCtx();
    if (!c || !enabled) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  return {
    get enabled() { return enabled; },

    unlock() { ensureCtx(); },

    setEnabled(on) {
      enabled = !!on;
      try {
        localStorage.setItem(GAME_CONFIG.storageKeys.sound, enabled ? "on" : "off");
      } catch (e) { /* ignore */ }
      if (enabled) this.pickup();
    },

    pickup() {
      tone(640, 0, 0.07, "sine", 0.16);
      tone(880, 0.03, 0.06, "sine", 0.1);
    },

    correct() {
      tone(523.25, 0.0, 0.16, "triangle", 0.4);
      tone(659.25, 0.07, 0.16, "triangle", 0.4);
      tone(783.99, 0.14, 0.2, "triangle", 0.42);
      tone(1046.5, 0.21, 0.34, "triangle", 0.38, 1174.7);
    },

    wrong() {
      tone(196, 0.0, 0.16, "sawtooth", 0.22);
      tone(146.8, 0.1, 0.26, "sawtooth", 0.24, 110);
      tone(233.1, 0.0, 0.16, "square", 0.06);
    },

    shuffle() {
      for (let i = 0; i < 7; i++) {
        tone(320 + Math.random() * 420, i * 0.035, 0.045, "square", 0.07);
      }
    },

    win() {
      const seq = [
        [523.25, 0.0], [659.25, 0.12], [783.99, 0.24], [1046.5, 0.36],
        [783.99, 0.52], [1046.5, 0.62], [1318.5, 0.78]
      ];
      seq.forEach(([f, t]) => tone(f, t, 0.26, "triangle", 0.42));
      tone(261.6, 0.0, 0.7, "sine", 0.14);
      tone(392.0, 0.24, 0.7, "sine", 0.12);
    }
  };
})();
