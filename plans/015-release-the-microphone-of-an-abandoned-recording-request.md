# Plan 015: A voice recording never starts for a composer that is gone, or twice at once

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/views/voice.js`
> If the file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding. On a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

Since 0.34.0 the composer can record a voice message. Recording starts when
the browser grants the microphone, which can be many seconds after the click
if the browser shows its permission prompt. Nothing checks, at that moment,
that the composer still exists or that another request is not already
waiting. Two sequences leave the microphone recording with no panel on
screen to stop it:

- The user chooses "Record a voice message", switches to another
  conversation while the prompt is open, then allows it: the recording
  starts for a composer that is gone, for up to 60 seconds.
- The user chooses the entry twice before answering the prompt: the second
  recording replaces the first in the hook's memory, and the first one's
  microphone stream is never stopped.

A microphone left open without the user knowing is a privacy problem, even
though nothing is sent. After this plan a request that was abandoned releases
the microphone the moment the browser grants it, and a second request is
ignored while one is waiting.

## Current state

- `src/views/voice.js:57-105`: the hook. `live` holds the recording under
  way, `reset` runs when the composer goes away or its conversation
  changes:

  ```js
  function useVoiceRecorder(key, onFiles) {
    var app = useApp();
    var st = useState(null), rec = st[0], setRec = st[1];
    var live = useRef(null);
    function release() {
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
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        var recorder = new MediaRecorder(stream), chunks = [], began = Date.now();
        var r = { recorder: recorder, stream: stream, timer: null };
        ...
        live.current = r;
        recorder.start();
        setRec({ phase: 'recording', elapsed: 0 });
      }, function (e) {
        app.ui.toast(e && e.name === 'NotAllowedError' ? "Nightango can't use your microphone. Allow it for this site in your browser, then try again."
          : 'No microphone is available. Plug one in, then try again.');
      });
    }
  ```

  Between the call of `getUserMedia` and its answer, `live.current` is
  still `null`: `release` finds nothing to stop, and a second `start` is
  not refused.

- `src/views/voice.js:133` and `:148`: the menu entry is disabled only
  while a recording exists, not while the browser is asking:

  ```js
  return { start: start, busy: !!rec, panel: panel };
  ...
  { label: 'Record a voice message', icon: 'mic', disabled: !attach.onFiles || voice.busy, onSelect: voice.start }
  ```

- The hook is used by both composers (`src/views/group.js:87`,
  `src/views/dm.js:297`), each keyed by its conversation.

- `tests/voice.js` covers the WAV encoding only, by loading
  `src/views/voice.js` in a bare `vm` context without React. No suite
  mounts the hook: jsdom has neither `getUserMedia` nor `MediaRecorder`.

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. One line, English, no em-dash and no semicolon in its text.
  - Tests are for complex behaviour only (ADR-0009).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| The voice suite alone | `pnpm test voice` | `pass  voice (8 ok)` |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0, about 2.5 min |

`pnpm` only. The runner judges a suite on its output too: a line starting
with `FAIL` or `CRASH`, or `ERRORS:` followed by anything but `none`, is a
failure.

## Scope

**In scope** (the only file you should modify):
- `src/views/voice.js` (the hook `useVoiceRecorder` only)

**Out of scope** (do NOT touch):
- `wavBlob`, `recordingToWav` and the constants above the hook:
  `tests/voice.js` loads the file without React and checks them.
- The menu entry (`attachMenu`): with the guard of Step 1 a second click
  does nothing, which is enough.
- The recording that is being encoded when the composer goes away: see
  "Maintenance notes".
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/voice-request-abandoned`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(composer): release the microphone of an abandoned recording request`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Track the request that is waiting for the browser

In `src/views/voice.js`, inside `useVoiceRecorder`:

1. Right after `var live = useRef(null);`, add:

   ```js
   // Microphone request the browser has not answered yet: reset drops it, and its stream is then released as soon as it comes.
   var asking = useRef(null);
   ```

2. In `release`, add `asking.current = null;` as its first statement
   (before `var r = live.current;`).

3. In `start`, add a guard and a token at the top, and check the token in
   both callbacks. The function becomes:

   ```js
   function start() {
     if (asking.current || live.current) return;
     var ask = asking.current = {};
     navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
       if (asking.current !== ask) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
       asking.current = null;
       var recorder = new MediaRecorder(stream), chunks = [], began = Date.now();
       ...everything that follows in this callback stays as it is...
     }, function (e) {
       if (asking.current !== ask) return;
       asking.current = null;
       app.ui.toast(e && e.name === 'NotAllowedError' ? "Nightango can't use your microphone. Allow it for this site in your browser, then try again."
         : 'No microphone is available. Plug one in, then try again.');
     });
   }
   ```

   Only the five new lines change: the guard, the token, the two lines at
   the top of the first callback and the two lines at the top of the
   second one. Do not retype the middle of the first callback.

**Verify**:
- `grep -c "asking.current" src/views/voice.js` prints `7`.
- `pnpm test` → every line of `== summary` starts with `pass`, exit 0,
  including `pass  voice (8 ok)`: the suite loads this file without React,
  so a syntax error or a reference at load time would fail it.

## Test plan

- No new automated test: the hook needs `getUserMedia` and
  `MediaRecorder`, which jsdom lacks, and ADR-0009 keeps tests for complex
  behaviour.
- Manual check for the owner, in a browser whose microphone permission
  for st.chatango.com is reset to "ask":
  1. In a group, choose "Record a voice message", and while the browser
     prompt is open click another group in the sidebar, then allow. The
     browser's recording indicator must go off at once and no recording
     panel must appear.
  2. Choose the entry, and choose it again before answering the prompt,
     then allow. One recording panel, and after "Discard" the browser's
     recording indicator goes off.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "asking.current" src/views/voice.js` prints `7`
- [ ] `git status --short` lists only `src/views/voice.js` (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `useVoiceRecorder` does not match the excerpt, in particular if `start`
  already tests something before calling `getUserMedia`.
- `pass  voice` turns to `FAIL  voice` after the change.

## Maintenance notes

- `reset` runs on unmount and when the conversation key changes: both now
  drop a waiting request through `release`.
- Known and left as is: a recording stopped by the user and still being
  encoded is no longer tracked by `live`, so a composer that goes away
  during those few hundred milliseconds cannot cancel it. Its only cost is
  one object URL of the WAV file kept until the page is reloaded. Tracking
  the encoding would change more of the hook than this is worth.
- Reviewer: check that a refused prompt still shows its toast (the token
  is the current one in that case), and that nothing above the hook
  changed.
- Suggested `CHANGELOG.md` line, under `### Fixed`: "A voice recording no
  longer starts after you left the conversation or asked twice."
