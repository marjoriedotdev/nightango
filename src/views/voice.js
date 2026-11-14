/* ---------- Voice messages ---------- */
// 16 kHz mono 16-bit PCM: about 32 KB per second, under 2 MB for the longest message.
var VOICE_MAX_S = 60, VOICE_RATE = 16000;

function canRecordVoice() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder && window.OfflineAudioContext);
}

/**
 * Encodes mono samples as a 16-bit PCM WAV file.
 * @param {Float32Array} samples Samples between -1 and 1.
 * @param {number} rate Sample rate in Hz.
 */
function wavBlob(samples, rate) {
  var size = samples.length * 2, v = new DataView(new ArrayBuffer(44 + size));
  function ascii(at, s) { for (var i = 0; i < s.length; i++) v.setUint8(at + i, s.charCodeAt(i)); }
  ascii(0, 'RIFF'); v.setUint32(4, 36 + size, true); ascii(8, 'WAVE');
  ascii(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ascii(36, 'data'); v.setUint32(40, size, true);
  for (var i = 0; i < samples.length; i++) {
    var x = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  return new Blob([v.buffer], { type: 'audio/wav' });
}

/**
 * Converts a browser recording to a 16 kHz mono WAV file of at most VOICE_MAX_S seconds.
 * BetterChatango and Nightango show a .wav link as audio, a .webm link as a video.
 * @param {Blob} recording What MediaRecorder produced.
 * @returns {Promise<Blob>} WAV file.
 */
function recordingToWav(recording) {
  return recording.arrayBuffer().then(function (data) {
    // A context at 16 kHz decodes the recording already resampled.
    return new OfflineAudioContext(1, 1, VOICE_RATE).decodeAudioData(data);
  }).then(function (audio) {
    var n = Math.min(audio.length, VOICE_MAX_S * VOICE_RATE), mono = new Float32Array(n), k = audio.numberOfChannels;
    for (var c = 0; c < k; c++) {
      var ch = audio.getChannelData(c);
      for (var i = 0; i < n; i++) mono[i] += ch[i] / k;
    }
    return wavBlob(mono, VOICE_RATE);
  });
}

function voiceClock(s) { return Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2); }

/**
 * Records a voice message in a composer, lets the user listen to it, then hands it over as a picked file.
 * Nothing leaves the browser before the composer sends the file.
 * @param {string} key Group or PM of the composer, as uploadKey names it: a recording never moves to another conversation.
 * @param {?function(Array<File>)} onFiles File intake of the composer, null while it takes none.
 * @returns {{start: Function, busy: boolean, panel: ?Object}} Start of a recording, whether one is under way, and recording panel to render in composer-wrap.
 */
function useVoiceRecorder(key, onFiles) {
  var app = useApp();
  var st = useState(null), rec = st[0], setRec = st[1];
  var live = useRef(null);
  // Microphone request the browser has not answered yet: reset drops it, and its stream is then released as soon as it comes.
  var asking = useRef(null);
  function release() {
    asking.current = null;
    var r = live.current;
    live.current = null;
    if (!r) return;
    r.cancelled = true;
    clearInterval(r.timer);
    r.stream.getTracks().forEach(function (t) { t.stop(); });
    if (r.recorder.state !== 'inactive') r.recorder.stop();
  }
  function reset() {
    release();
    setRec(function (x) { if (x && x.url) URL.revokeObjectURL(x.url); return null; });
  }
  useEffect(function () { return reset; }, [key]);
  function start() {
    if (asking.current || live.current) return;
    var ask = asking.current = {};
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      if (asking.current !== ask) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      asking.current = null;
      var recorder = new MediaRecorder(stream), chunks = [], began = Date.now();
      var r = { recorder: recorder, stream: stream, timer: null };
      recorder.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = function () {
        if (r.cancelled) return;
        setRec({ phase: 'encoding' });
        recordingToWav(new Blob(chunks, { type: recorder.mimeType })).then(function (wav) {
          if (r.cancelled) return;
          var file = new File([wav], 'voice-message.wav', { type: 'audio/wav' });
          setRec({ phase: 'ready', file: file, url: URL.createObjectURL(file) });
        }, function (e) {
          warn(e);
          setRec(null);
          app.ui.toast("Couldn't prepare the recording. Try again.", { tone: 'error' });
        });
      };
      r.timer = setInterval(function () {
        var s = (Date.now() - began) / 1000;
        if (s >= VOICE_MAX_S) { stop(); return; }
        setRec({ phase: 'recording', elapsed: s });
      }, 250);
      live.current = r;
      recorder.start();
      setRec({ phase: 'recording', elapsed: 0 });
    }, function (e) {
      if (asking.current !== ask) return;
      asking.current = null;
      app.ui.toast(e && e.name === 'NotAllowedError' ? "Nightango can't use your microphone. Allow it for this site in your browser, then try again."
        : 'No microphone is available. Plug one in, then try again.', { tone: 'error' });
    });
  }
  function stop() {
    var r = live.current;
    if (!r) return;
    live.current = null;
    clearInterval(r.timer);
    r.stream.getTracks().forEach(function (t) { t.stop(); });
    r.recorder.stop();
  }
  function attach() {
    onFiles([rec.file]);
    reset();
  }
  var panel = null;
  if (rec && rec.phase === 'recording') {
    panel = h('div', { className: 'voice-panel', role: 'group', 'aria-label': 'Voice message' },
      h('span', { className: 'voice-dot', 'aria-hidden': 'true' }),
      h('span', { className: 'voice-time grow', role: 'timer' }, 'Recording ' + voiceClock(rec.elapsed) + ' of ' + voiceClock(VOICE_MAX_S)),
      h(T.Button, { size: 'sm', variant: 'ghost', onClick: reset }, 'Cancel'),
      h(T.Button, { size: 'sm', variant: 'primary', onClick: stop }, 'Stop'));
  } else if (rec && rec.phase === 'encoding') {
    panel = h('div', { className: 'voice-panel', role: 'status' }, h(T.Spinner, null), h('span', { className: 'grow' }, 'Preparing the recording'));
  } else if (rec && rec.phase === 'ready') {
    panel = h('div', { className: 'voice-panel', role: 'group', 'aria-label': 'Voice message' },
      h('audio', { className: 'grow', controls: true, src: rec.url, 'aria-label': 'Listen to your voice message' }),
      h(T.Button, { size: 'sm', variant: 'ghost', onClick: reset }, 'Discard'),
      h(T.Button, { size: 'sm', variant: 'primary', disabled: !onFiles, onClick: attach }, 'Attach'));
  }
  return { start: start, busy: !!rec, panel: panel };
}

/**
 * Plus menu of a composer: attach a file or record a voice message.
 * Where the browser cannot record, the composer keeps its plain attach button.
 * @param {{onAttach: ?Function, onFiles: ?Function}} attach File picker of the composer.
 * @param {{start: Function, busy: boolean}} voice Voice recorder of the composer.
 */
function attachMenu(attach, voice) {
  if (!canRecordVoice()) return null;
  return h(MenuButton, {
    icon: 'plus', label: 'Add to your message', up: true, align: 'left',
    items: [
      { label: 'Attach a file', icon: 'paperclip', disabled: !attach.onAttach, onSelect: function () { attach.onAttach(); } },
      { label: 'Record a voice message', icon: 'mic', disabled: !attach.onFiles || voice.busy, onSelect: voice.start }
    ]
  });
}
