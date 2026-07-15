// ===================== サウンド =====================
let audioCtx = null;

function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (err) {}
}

function playSound(type) {
  if (!soundOn) return;
  try {
    unlockAudio();
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    if (type === 'place') {
      o.type = 'sine';
      o.frequency.value = 440;
      g.gain.setValueAtTime(0.09, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      o.start();
      o.stop(audioCtx.currentTime + 0.13);
    } else if (type === 'clear') {
      o.type = 'triangle';
      o.frequency.setValueAtTime(660, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(990, audioCtx.currentTime + 0.2);
      g.gain.setValueAtTime(0.11, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      o.start();
      o.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'coin') {
      o.type = 'square';
      o.frequency.setValueAtTime(880, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1);
      g.gain.setValueAtTime(0.08, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      o.start();
      o.stop(audioCtx.currentTime + 0.18);
    }
  } catch (err) {}
}
