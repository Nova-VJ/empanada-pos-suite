let ctx: AudioContext | null = null;
function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.15) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = a.currentTime + start;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const playBeep = () => tone(1200, 0, 0.035, "square", 0.08);
export const playCashChime = () => {
  tone(523, 0, 0.18);
  tone(659, 0.12, 0.35);
  tone(784, 0.12, 0.35, "sine", 0.08);
};
export const playKitchenBell = () => {
  tone(880, 0, 0.6, "triangle", 0.2);
  tone(1760, 0, 0.4, "sine", 0.05);
};
