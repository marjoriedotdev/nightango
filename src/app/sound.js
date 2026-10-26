/* ---------- Sound ---------- */
var audioCtx = null, userInteracted = false;
['pointerdown', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { userInteracted = true; }, { once: true, capture: true }); });
function beep(volume, force) {
  if (LIVE || !userInteracted || !volume) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var o = audioCtx.createOscillator(), g = audioCtx.createGain(), t0 = audioCtx.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(880, t0); o.frequency.setValueAtTime(1175, t0 + 0.08);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.12 * volume / 100, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
    o.connect(g); g.connect(audioCtx.destination); o.start(t0); o.stop(t0 + 0.3);
  } catch (e) { if (force) { /* audio refused by the browser: nothing to play */ } }
}
