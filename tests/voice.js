// Voice messages: the WAV file written by src/views/voice.js and the downmix of a recording.
const fs = require('fs'), vm = require('vm');
const check = (c, msg, detail) => console.log((c ? 'ok  ' : 'FAIL') + ' ' + msg + (c || !detail ? '' : ' ' + JSON.stringify(detail)));
const ctx = { Blob, DataView, ArrayBuffer, Float32Array, Promise, Math };
vm.runInNewContext(fs.readFileSync(process.argv[2] + '/src/views/voice.js', 'utf8'), ctx);

(async () => {
  /* WAV header: RIFF, 16-bit PCM mono at the given rate, sizes in little endian */
  const blob = ctx.wavBlob(new Float32Array([0, 1, -1, 2, -0.5]), 16000);
  const v = new DataView(await blob.arrayBuffer());
  const ascii = (at, n) => String.fromCharCode(...new Uint8Array(v.buffer, at, n));
  check(blob.type === 'audio/wav' && blob.size === 44 + 10, 'audio/wav of 44 header bytes and 2 bytes per sample', { type: blob.type, size: blob.size });
  check(ascii(0, 4) === 'RIFF' && v.getUint32(4, true) === 36 + 10 && ascii(8, 4) === 'WAVE', 'RIFF chunk sized from the data');
  check(ascii(12, 4) === 'fmt ' && v.getUint32(16, true) === 16 && v.getUint16(20, true) === 1 && v.getUint16(22, true) === 1, 'fmt chunk: PCM, one channel');
  check(v.getUint32(24, true) === 16000 && v.getUint32(28, true) === 32000 && v.getUint16(32, true) === 2 && v.getUint16(34, true) === 16, 'rate 16000, 32000 bytes per second, 16 bits');
  check(ascii(36, 4) === 'data' && v.getUint32(40, true) === 10, 'data chunk of 10 bytes');
  const samples = [0, 1, 2, 3, 4].map((i) => v.getInt16(44 + i * 2, true));
  check(JSON.stringify(samples) === JSON.stringify([0, 32767, -32768, 32767, -16384]), 'samples scaled to 16 bits, out of range values clipped', samples);

  /* Recording: channels averaged into one, cut at VOICE_MAX_S seconds */
  const rate = ctx.VOICE_RATE, long = ctx.VOICE_MAX_S * rate + 5;
  const left = new Float32Array(long).fill(0.5), right = new Float32Array(long).fill(-0.25);
  ctx.OfflineAudioContext = function (channels, length, r) {
    this.decodeAudioData = () => Promise.resolve({ length: long, numberOfChannels: 2, sampleRate: r, getChannelData: (c) => (c ? right : left) });
  };
  const wav = await ctx.recordingToWav(new Blob([new Uint8Array(4)]));
  const w = new DataView(await wav.arrayBuffer());
  check(w.getUint32(40, true) === ctx.VOICE_MAX_S * rate * 2, 'a recording longer than the limit is cut at the limit', w.getUint32(40, true));
  check(w.getInt16(44, true) === Math.round(0.125 * 32767) || w.getInt16(44, true) === Math.floor(0.125 * 32767), 'stereo averaged into mono', w.getInt16(44, true));
})().catch((e) => console.log('CRASH ' + e.stack));
