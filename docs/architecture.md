# Architecture

Nightango is a single React 18 application written in ES5 JavaScript, without JSX or a bundler. The same code serves two targets: the userscript wired to the running BetterChatango client, and a hosted prototype with simulated data.

## File tree

```
src/
  core/       shared base, evaluated first
    globals.js       React aliases, T wrapper (live avatars), hooks
    util.js          time, local storage, copy, reading a JSON file, downloading a JSON file
    colors.js        colors and contrast, fonts, channels
    roles.js         permissions, roles (owner, admin, mod), Chatango rights bits (PERM_FLAG), default rights of a role, default group settings
    sample-data.js   prototype sample data, simulated visits, in-memory sample media library
    prefs.js         default preferences
    ui.js            React context, Portal (#layer layer), useFloating (layer anchored to its trigger), useDraft (composer text per conversation), MenuButton, Dialog, ConfirmDialog, Toasts, JsonFileButton,
                     Person (avatar and name that open the profile), role and "You" badges, list presence,
                     useRightColumn (single 1180 px threshold: right column above, full screen below)
    rich-text.js     MessageText (emphasis, quotes, mentions, links), shownParts (shown text without the links shown as a media), trusted hosts (isTrustedUrl), RichText (sanitized mini profile), fullProfileDoc
    selectors.js     state reads: roles, a member's rights in a group (groupRights, canBanMember), user, theme, counters, listed conversations, displayed message of a private history entry,
                     message cap of a group or a conversation (THREAD_MAX, trimThread)
  bridge/     the bridge to BetterChatango
    live-model.js    LIVE, JOURNAL, avatarSrc (and photo version of one's own account), vissle pagination, Chatango bits (GROUP_FLAG, CHANNEL_FLAG, MSG_FLAG),
                     emoticon table (EMOTICONS)
    live-parse.js    pure bridge functions: message content (parseContent, media), group frames,
                     Premium background (parseMiniCss, background form), updateprofile response, message background (parseMsgBg), linked accounts (parseWho), presence, timestamps,
                     message references, private history records (reading, sorting an import),
                     media library entries (validation, page order, sorting an import)
    live-bridge.js   liveBridge: incoming and outgoing frames, warnings, connections,
                     profiles, search, private history, media library, vissle, group creation
  views/      main screens
    login, shell (sidebar), group (and @name suggestions of its composer), message (row, media),
    message-log (group and PM message log: bottom tracking, reading kept in place, older pages, jump to a message),
    members (list, profile card, linked accounts, ban, external link, profile link), dm (Chats and PM search, Friends),
    meet (Meet people), mentions (recent mentions from all groups, row of a message outside its message log),
    profile (summary shared by the card and the panel, full profile, panel), new-dm, message-style (own style),
    emoji-picker (emoticon and media picker of the composers), attach (file upload of the composers),
    media (BetterChatango media library: Media tab, star on message images, :name completion),
    commands (/join, /leave, /chat and /help of the composers),
    discover, palette (Ctrl K), live-joined (joined, owned and recent groups), session (session loss dialog)
  settings/   settings
    shell, profile (Visitors and vissle tracker included), appearance, notifications, privacy (and Safety),
    language-a11y-about (and Diagnostics)
    group-view, group-pages                                             prototype group settings, Overview shared with live
    group-staff                                                         Staff and roles, Members and Invites pages, shared by live and prototype
    markup-toolbar                                                      formatting toolbar of the bio and the full profile
    avatar-crop                                                         cropping of one's own profile picture (live)
    live-group-view, live-group-pages, live-group-staff, live-account   live variants (live-account: Password and email and Chatango Premium pages shared with the prototype)
  app/        root
    sound.js
    state.js         persisted preferences
    live-state.js    live state built for Root: world at login, group, ban lists, session loss
    pm.js            PMs: reception, private history merge, unreads read from the archive (BetterChatango database, or memory in the prototype and without a database)
    root.js          Root: state, actions, live actions, handleLiveOp
    start.js         mounting
  loader/
    skin-loader.js   sandbox-side userscript: header and @version, home page guard,
                     page code injection, vissle and TikTok bridges (GM_xmlhttpRequest)
    skin-page.js     page code: double start protection, starts BetterChatango, loads React (SRI),
                     waits for BetterChatango, mounts the Shadow DOM
    skin-journal.js  diagnostic journal, inserted by the build at the top of the page code (ADR-0011)
  styles/
    app.css          application styles
    login.css        BetterChatango sign-in screen in Nightango colors, put in the document by skin-page.js
scripts/
  build.mjs          Node build (concatenation, userscript assembly, esbuild minification)
  ds-components.mjs  regenerates README.md and preview.html of the design system components
tests/               jsdom suites and run.mjs runner
torchds/project/     design system: tokens, components/bundle.js (namespace window.Torch), CSS, types
dist/                build outputs, not versioned
```

`bridge/live-parse.js` contains only functions that read neither the BetterChatango client, nor `emit`, nor any variable of the bridge closure. A function that depends on this closure stays in `bridge/live-bridge.js`. The bridge keeps the steps specific to BetterChatango: waiting for Chatango's replies and their delays, requesting the announcement and reading a group's info after `inited`, the mention sound of a PM, the temporary `k:` message ids. It emits only facts to `Root`. `Root` (`app/root.js`) applies them to the state, with `app/pm.js` for PMs and `app/live-state.js` for the live state it builds.

## Concatenation

`scripts/build.mjs` concatenates the files of `src/` into a single IIFE, in the order of `APP_SOURCES`. It is the only place that declares this list. All files therefore share one scope: a new file is added to `APP_SOURCES`, at its place in the order.

The build opens the IIFE with two names: `APP_VERSION`, the `@version` of `src/loader/skin-loader.js`, and `RELEASE_NOTES`, the sections of `CHANGELOG.md` read in the Keep a Changelog format (`{ version, date, groups: [{ title, items }] }`, most recent first). The prototype and the userscript therefore get the same version and the same notes. The build rejects a malformed `CHANGELOG.md` or one whose first section is not the `@version` one.

`bridge/live-parse.js` sits right before `bridge/live-bridge.js`, after `bridge/live-model.js` whose `FONT_FACES` it reads. Its functions become names of the single scope, shared with every file: a name that duplicates another replaces the first one without an error.

The build rejects app code or a bundle that contains `</script`, a userscript stylesheet that still targets `:root` or `html,body{`, and a sign-in screen stylesheet that contains `url(` or `@import`.

## Userscript in two contexts

Tampermonkey runs `skin-loader.js` in a sandbox that sees neither BetterChatango nor React. The userscript is therefore split into two contexts ([ADR-0003](adr/0003-two-context-loader.md)).

```
Tampermonkey sandbox (skin-loader.js)            st.chatango.com page
  guard: home page only                 ---->     inline <script> (page code as a JSON literal)
  vissle and TikTok bridges                         skin-page.js: BetterChatango, React, Shadow DOM
  (GM_xmlhttpRequest)                               application (bundle + src/)
        ^                                                 |
        |  CustomEvent torch-skin:{vissle,tiktok}-request |
        +--------------------------------------------------+
           CustomEvent torch-skin:{vissle,tiktok}-response
```

- Header: `@match https://st.chatango.com/*`, `@noframes`, `@grant GM_xmlhttpRequest`, `@connect vissle.me`, `@connect tiktok.com`, `@run-at document-idle`.
- The loader stops outside the home page (`window.top !== window` or `pathname !== '/'`): st.chatango.com also serves the chat windows embedded in other sites.
- The page code is injected by a `<script>` whose `textContent` is an ASCII-only JSON string literal. It is never parsed as HTML.
- Only the vissle and TikTok bridges run in the sandbox. The page sends them its requests through `askLoader` (`live-bridge.js`), which matches the replies by id. The vissle bridge reads the queried profile from `client.user.name` through an inline probe injected on each request, which returns it through a synchronous `CustomEvent` (`torch-skin:account`), and ignores the one the page would ask for. No `unsafeWindow`: Userscripts (Safari) does not provide it ([ADR-0005](adr/0005-visitors-own-profile-only.md)). The TikTok bridge accepts only a short TikTok link, which it rebuilds, and replies with the post id only ([ADR-0014](adr/0014-tiktok-embed.md)).
- `skin-page.js` protects itself from a double start (`window.__TORCH_SKIN__`), sets up the diagnostic journal (`skin-journal.js`, in place of `/*JOURNAL*/`) before any BetterChatango socket, watches for the BetterChatango sign-in screen, adds the BetterChatango startup script, loads React and ReactDOM from cdnjs with SRI, waits for BetterChatango's global objects, then mounts the interface.
- If the startup fails, the original BetterChatango client stays in place.

## Diagnostic journal

- `skin-journal.js` wraps the `WebSocket` constructor and the console, listens to the page lifecycle and to errors, and keeps the last 1,000 events in `localStorage` under `torch-skin:journal`. What it keeps and never keeps: [ADR-0011](adr/0011-diagnostic-journal.md).
- The application reads it through `JOURNAL` (`bridge/live-model.js`, `window.__TORCH_JOURNAL__`), `null` in the prototype and in the suites that load only the bridge. The bridge records its connections, BetterChatango's warnings and a refused save of the unread migration flag in it. The Diagnostics page, listed only if `JOURNAL` exists, shows it, copies it, downloads it and clears it.

## Mounting and display

- The `#torch-skin` host is created after BetterChatango has started, since BetterChatango rebuilds its page. It carries an open Shadow DOM that contains the application stylesheet and the `#app` mount point.
- The build adapts the application stylesheet to the Shadow DOM: `:root` becomes `:host`, and the global classes (`reduce-motion`, `underline-links`, `calm-sky`, `moon-south`) move to `:host(...)`.
- The interface stays hidden until the BetterChatango session is open. Sign-in happens on the BetterChatango screen.
- That screen only gets a stylesheet, `<style id="torch-skin-login">` in `document.head`: `src/styles/login.css` after the tokens declared under `.login`, in the system theme, or the one chosen in Nightango once the `#torch-skin` host carries it (`body:has(> #torch-skin[data-theme])`). It recolors BetterChatango's `--theme-*` variables, so its menu and windows follow too. No script touches its form, and the stylesheet loads nothing ([ADR-0001](adr/0001-password-never-read.md)). BetterChatango replaces the whole document before showing its screen: a `MutationObserver` on `<html>` adds the stylesheet to the new document, before the first paint. If the interface cannot start, the stylesheet is removed and the screen goes back to its BetterChatango look.
- Fields of that screen use 16px text on touch screens (`pointer: coarse`), like the interface fields: iOS Safari zooms into a field under 16px.
- On sign-in, `window.__TORCH_SHOW__` hides the rest of the BetterChatango page and shows the host.
- Dialogs, menus and notifications go through `Portal`, rendered in a `#layer` layer next to `#app`, so they do not distort the layout.
- The interface fonts (Geist, Geist Mono, Instrument Serif) are embedded: woff2 files of the Latin subset in `torchds/project/fonts/`, under SIL OFL 1.1 (`OFL.txt`). The build encodes them as base64 `data:` URLs in the `@font-face` rules of `fonts.css`. `skin-page.js` puts these `@font-face` rules in a `<style id="torch-skin-fonts">` in `document.head` when the interface mounts: Chrome ignores a `@font-face` declared only in the shadow root. The hosted prototype gets the same `@font-face` rules in its stylesheet. The design system previews and the mockups link `fonts.css`. No external font request.

## Live mode and prototype mode

- `LIVE = !!window.__TORCH_LIVE__` (`bridge/live-model.js`). `skin-page.js` sets the flag, the hosted prototype does not.
- The differences between the two modes are guarded by `if (LIVE)`.
- Rights in a group follow Chatango's model in both modes: one owner and moderators with their rights bits (`settings.staff`, `settings.modFlags`), read by `groupRights`. The prototype has no role that Chatango does not have.
- In live, the actions of `app/root.js` are overridden by those of the "Live mode" block. The bridge (`liveBridge`) turns BetterChatango's frames into operations, which `handleLiveOp` applies to the state.
- Nightango's sounds are off in live: BetterChatango already plays its own. The bridge only makes it play its mention sound for a PM outside the open conversation (`docs/betterchatango-protocol.md`, What stays in BetterChatango).

## React state

- `Root` (`app/root.js`) holds the whole application state. `update(fn)` clones the state with `JSON.parse(JSON.stringify(prev))`, applies `fn` to the clone, then replaces it. The state must therefore stay JSON-serializable.
- Preferences are persisted in `localStorage` under `torch-prototype-prefs` (`app/state.js`). In live, those in `BETTER_CHATANGO_PREFS` (`core/prefs.js`: guest messages, announcements) are BetterChatango settings: read back from its settings on sign-in, and `usePref().sw` toggles them only once they are written on its side. Trusted hosts (`safety.trustedHosts`) follow the same rule: in live, it is BetterChatango's list, read back on sign-in (`null` if unreadable) and changed by `actions.setTrustedHost` once written on its side.
- Account-specific data is persisted under `torch-skin:<username>`: closed conversations (`hidden`), hidden channels of each group (`channels`), members with a hidden style (`unstyled`) and own style (`style`). The bridge also sets the unread migration flag there (`pmReadMigrated`, `docs/betterchatango-protocol.md`, Private history): `Root` merges its writes with the stored content to keep it. In live, favorites, group mutes and ignored members are BetterChatango's (`docs/betterchatango-protocol.md`, BetterChatango startup settings). The prototype keeps its own in its state.
- Composer drafts live outside the state, in memory only (`useDraft`, `core/ui.js`): a view saves its text when it leaves, keyed by `group:<id>` or `dm:<name>`, and gets it back on return. A reload drops them, which is also how live signs out. The prototype empties them at sign-in.
- PM unreads come from the archive (`app/pm.js`): BetterChatango's history database in live, an in-memory archive in the prototype or when that database is missing. A conversation's `unread` is only a copy of it, written only by `app/pm.js` ([ADR-0012](adr/0012-pm-unread-from-history.md)).
- Profiles read (mini profile, Premium background in `u.miniStyle`) and message backgrounds (`u.msgBg`) are cached with the user.
- BetterChatango's media library stays out of the state: the Media tab, the stars and the completion read it through `Root`'s actions, in live from BetterChatango's `favorite_media` database (bridge), in the prototype from the sample media library (`sampleMedia`). Each write increments `mediaRev`, which makes them read it again (`docs/betterchatango-protocol.md`, Media library).
- The Mentions page reads `mentionLog`: the last 100 group messages, live or from history, that mention the user, most recent first. The list lives only in the state and starts empty on each page load.

## Member content

- Messages: `parseContent` keeps the raw text in `text`, without the markers of a `▓…▒` pair, and splits the body into marked segments (`parts`) according to BetterChatango's allowlist: `b`, `i` without attributes, `u`, `s`, `strike` and `▓…▒` pairs. `MessageText` rebuilds them as `b`, `i`, `u`, `s` elements, whatever the "Fonts and text colors" setting. Any other tag is removed.
- Quotes: in each segment, `MessageText` recognizes `` @name: `text` `` as BetterChatango's rendering (`docs/betterchatango-protocol.md`, Sending) and rebuilds it as React elements, the name as a mention and the quoted text apart.
- Emoticons: `parseContent` replaces an `<i s="sm://{name}"/>` tag with the system emoji that the `EMOTICONS` table maps to the name, in `text` as in `parts`. From the member, only the name is kept and compared with the table (`docs/betterchatango-protocol.md`, Emoticons).
- Mini profile: `RichText` rebuilds an allowlist of tags as React elements. The `inline` mode (Meet cards) ignores blocks, links, images, size and alignment.
- Full profile: `fullProfileDoc` produces an isolated document in a `sandbox` `iframe`, with a CSP and `referrer` `no-referrer` in a `<meta>`. The frame is the `FullProfileFrame` component, shared by the full profile dialog and the Profile page preview, with `useFullProfileMedia` for the "Load images" button. Under `styles.profileBackgrounds`, its `<style>` reuses the Premium background chosen by `miniStyleOf` (hex colors, `https` image with its repeat if media are allowed), each value checked before being written.
- Premium background: colors taken from `custom_profile.css` by `parseMiniCss`, with guaranteed contrast. In the profile dialog, `miniSkin` applies the background, the text and the theme color tokens (secondary text at 4.5:1, borders, hovers) to the whole dialog. The image is an `<img>` with `referrerPolicy="no-referrer"`, as a 120 px cover (`object-fit: cover`) behind the avatar, faded into the background color. The PM profile panel keeps the background on the text block only, with the image as a banner above it. Meet cards show only the color. The Premium background image follows the media settings, trusted hosts (`waitsForClick`) and `styles.profileBackgrounds`.
- Message background: under `styles.backgrounds`, the color taken from `msgbg.xml` by `parseMsgBg` colors the row of a group message marked `bg`, text and name at 4.5:1. The `msgbg.jpg` image is a CSS background behind the text (`background` slot of `T.Message`), at its natural size, placed according to the member's alignment, tiled if the member asks for it, only if `embedImages` is on and `proxyMedia` is off.
- Hidden style: "Hide style", in a message menu or the actions on a person, marks the member `unstyled`. `memberStyles` then renders their rows, in groups and in PMs, as if `styles.names`, `styles.fonts` and `styles.backgrounds` were off for them alone, without reading their message background, and `MessageText` removes their bold, italic and underline, keeping strikethrough. Reference: BetterChatango's `/style name` (`inject.js:7308-7350`), which only affects messages already displayed and keeps nothing on reload.
- Profile picture: the avatar of the profile dialog and panel, once its thumbnail has loaded, opens a full screen viewer of `full.jpg` as a `no-referrer` `<img>`, with a fallback to the thumbnail.
- Member media: nothing is loaded before the click when `embedImages`, `embedVideos` or `proxyMedia` ask for it. A single test, `waitsForClick` (`core/rich-text.js`), decides that a media item waits for the click: never for a URL from a trusted host (`isTrustedUrl`), otherwise always for a video or audio file, and under `proxyMedia` for an image, the YouTube thumbnail, a media library thumbnail, a mini profile image or the Premium background image. Two intended exceptions: the message background image, always on `ust.chatango.com`, follows only `embedImages` and `proxyMedia` (`docs/betterchatango-protocol.md`, Resources loaded by the loader and the interface), and the full profile loads all its images at once through "Load images". `parseContent` also picks up YouTube links, images and video and audio files typed as text (`docs/betterchatango-protocol.md`, Media). A displayed image carries the media library star, "Add to media" or "Remove from media".

See [ADR-0004](adr/0004-member-html-never-injected.md).

## Design system

- `torchds/project/` contains the tokens (`tokens.json`), the components (`components/bundle.js`, namespace `window.Torch`, and `bundle.css`), their types (`index.d.ts`), the embedded fonts (`fonts/`) and the guidelines (`README.md`).
- Moonlight theme: a sky (`sky-top`, `sky-bottom`, stars as `--stars` set on `#app`) behind solid panels, text never sits on the sky. The moon comes from `Torch.Moon` and `Torch.moonPhase`, computed on the device without a request. The `sky.calm` and `sky.south` preferences set the `calm-sky` and `moon-south` classes on the root. `sky.moon` is `auto` or the index of a phase from `Torch.moonNames`, which the brand draws in place of the evening moon.
- `components/bundle.js` and `bundle.css` are maintained by hand. The `README.md` and `preview.html` of each component are generated by `pnpm build:ds`.
- The build produces the token stylesheet from `tokens.json`: dark theme by default, light theme by system preference or by explicit choice.

## Build outputs

- `dist/nightango.min.user.js`: the deliverable. Same assembly as the readable version, with the esbuild transform (`transform`, ES5 target, `minify`) applied to the page code, the loader code and both stylesheets. The `==UserScript==` header is copied as is, without a source map ([ADR-0008](adr/0008-separate-minified-output.md)).
- `dist/nightango.user.js`: readable version, for debugging and audit.
- `dist/nightango.html` and `dist/app.js`: hosted prototype.

Both userscripts come out of the same `userscript()` function, which describes the assembly steps only once. esbuild is used only for minification: the concatenation stays the one in `build.mjs`.

## Tests

jsdom suites in `tests/`, run by `tests/run.mjs` after the build:

- `smoke`: hosted prototype, loaded from `dist/nightango.html`.
- `live_ui`: live mode with a fake BetterChatango client, on `dist/app.js` and the design system bundle. It records every frame sent and checks its exact format.
- `loader`: userscript, BetterChatango startup, ignored pages, double start, vissle and TikTok bridges, diagnostic journal. Run on `dist/nightango.user.js` then on `dist/nightango.min.user.js`. It is the only suite that runs the userscripts.
- `pm`: PM unreads, private history reading, merge, import and pages up to the cap, on the sources of `src/core/`, `src/bridge/` and `src/app/pm.js`, with the fake history database of `tests/fake-pm-db.js`, shared with `live_ui`.
- `markup`: profile formatting toolbar, tags around the selection and merging of `<font>` attributes, on `src/settings/markup-toolbar.js`.
- `live_login`: sign-in detection, on the concatenation of the sources of `src/bridge/`.
- `avatar`: avatars, on the design system bundle and the sources of `src/bridge/`.
- `moon`: moon phase compared with published dates and drawing direction, on the design system bundle.
- `check_ds`: rendering of the design system previews, on `torchds/project/components/bundle.js`.

Test policy: [ADR-0009](adr/0009-test-only-complex-behaviour.md) and `docs/coding-conventions.md`.

## Continuous integration

- `.github/workflows/ci.yml`, `test` job: `pnpm install --frozen-lockfile` then `pnpm test` on every push and pull request to `main` and `beta`. Before the tests, it refuses a `-beta` `@version` on `main` or in a pull request to `main`.
- Same workflow, `release` job: on a push to `main` or `beta`, after `test`. It reads the `@version` of `src/loader/skin-loader.js`, then, if the release `v` followed by this number does not exist yet, it runs `pnpm build` again and creates the tag on the tested commit and the GitHub release with both userscripts attached. Otherwise it publishes nothing. On `beta`, only a `X.Y.Z-beta.N` version is published, as a prerelease never marked latest. A stable version there publishes nothing. Releases run one at a time (`concurrency: release`).
- Actions are pinned to the full commit SHA of their release, with the version in a comment. pnpm comes from the `packageManager` field of `package.json`.

## BetterChatango reference copy

`reference/torch/` contains BetterChatango's code as served by vissle.me on 2026-10-19, read-only. Neither `scripts/build.mjs` nor the tests read it: the build only takes the files listed in `APP_SOURCES` and `torchds/project/`.

## Published artifacts

On the user's claude.ai account:

- Mockups (Design): https://claude.ai/artifact/JuDrFE7mapqwAzCDjcFeFQ
- Design system: https://claude.ai/artifact/ATzDF31PsVNFEYWmUWA3GW
- Hosted prototype (simulated data): https://claude.ai/artifact/D2Em5urvHC1FCpcmMmWHgH

A session can update them by passing their URL to publish, after reading them again.
