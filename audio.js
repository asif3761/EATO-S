/* ============================================================
   EATO'S — crunch sound effect (Web Audio API)
   A stylized "bite into a crisp chip" sound: a burst of short,
   irregular filtered-noise pops layered together. Fully
   synthesized — no external audio files.
   ============================================================ */
window.EatosAudio = (() => {
  let ctx = null;
  let master = null;
  let enabled = false;

  function ensure(){
    if(!ctx){
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);
    }
    if(ctx.state === "suspended") ctx.resume();
  }

  // One irregular "crack" — short filtered noise burst with a fast
  // attack and a slightly randomized pitch/duration so a cluster of
  // these doesn't sound mechanically repetitive.
  function crack(start, gain, freq){
    const dur = 0.03 + Math.random() * 0.035;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i = 0; i < bufferSize; i++){
      // sharp decay envelope baked into the noise itself for a "snap"
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.6);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = 1.1;

    const g = ctx.createGain();
    const now = ctx.currentTime + start;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  return {
    setEnabled(v){ enabled = v; if(v) ensure(); },
    isEnabled(){ return enabled; },

    crunchBite(){
      if(!enabled) return;
      ensure();
      // 5-7 irregular cracks in quick succession = one "bite"
      const count = 5 + Math.floor(Math.random() * 3);
      for(let i = 0; i < count; i++){
        const start = i * (0.02 + Math.random() * 0.025);
        const gain = 0.11 - i * 0.01 + Math.random() * 0.02;
        const freq = 2200 + Math.random() * 2600;
        crack(start, Math.max(gain, 0.03), freq);
      }
    },
  };
})();
