// =====================================================
// SONS SYNTHÉTISÉS (Web Audio)
// =====================================================

// =====================================================
// SONS SYNTHÉTISÉS
// =====================================================

function jouerTon(type, f0, f1, vol, duree, rampExp) {
  try {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, ctx.currentTime);
    if (f1 !== f0) {
      if (rampExp) osc.frequency.exponentialRampToValueAtTime(f1, ctx.currentTime + duree);
      else osc.frequency.linearRampToValueAtTime(f1, ctx.currentTime + duree);
    }
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + duree);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duree);
  } catch (e) {}
}

function jouerSonReady()    { jouerTon('sine', 300, 800, 0.3, 0.4, true); }
function jouerSonStress()   { jouerTon('square', 440, 440, 0.15, 0.15, false); }
function jouerSonGameOver() { jouerTon('sawtooth', 180, 60, 0.3, 0.6, false); }
function jouerSonBonus()    { jouerTon('triangle', 600, 1200, 0.2, 0.18, false); }
function jouerSonHit()      { jouerTon('sawtooth', 220, 70, 0.35, 0.35, false); }
function jouerSonPower()    { jouerTon('sine', 500, 1000, 0.25, 0.3, true); }

function jouerSonWinner() {
  try {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') ctx.resume();
    const bufferSize = ctx.sampleRate * 1.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(i / 800);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (e) {}
}
