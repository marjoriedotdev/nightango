# Architecture

Nightango is a single React 18 application written in ES5 JavaScript with ES modules, without JSX, bundled by esbuild ([ADR-0017](adr/0017-es-modules.md)). The same code serves two targets: the userscript wired to the running BetterChatango client, and a hosted prototype with simulated data.

## File tree

```
src/
  core/       shared base, evaluated first
    env.js           page environment set by the loader: LIVE, JOURNAL, root element and theme of the viewer, mount point, showing and hiding the interface, BetterChatango refs
    globals.js       React aliases, T wrapper (live avatars), hooks
    util.js          time, local storage, copy, reading a JSON file, downloading a JSON file, trailing white space trim, console warning (warn), lowercase, HTML escaping, URI decoding
    draft.js         copy-on-write drafts of the state (openDraft), plain object behind a draft for the scans that only read (plainOf)
    colors.js        colors and contrast
    chatango.js      facts of Chatango shared by both modes: account names and guests (ACCOUNT_NAME, isGuest), profile pictures (avatarSrc, AVATAR_VERSION), page addresses (chatangoPageUrl, parseGroupName),
                     temporary message ids, the private connection (PM_CONNECTION), Meet people page size, bits (GROUP_FLAG, MSG_FLAG, BADGE_FLAG), fonts, channels, genders
    emoticons.js     emoticon table (EMOTICONS)
    vissle.js        pages of the profile activity vissle tracks (visitorPage)
    roles.js         permissions, roles (owner, admin, mod), Chatango rights bits (PERM_FLAG, IS_STAFF_RIGHT), default rights of a role, default group settings
    sample-data.js   prototype sample data, simulated visits, in-memory sample media library
    prefs.js         default preferences
    ui.js            React contexts (useApp, and useAppApi with useStatePart for the memoized rows), minute clock of the relative times (useMinute), members a view shows kept in the state (useShownUsers),
                     functions that keep their identity across renders (useLatestCalls), Layers (layer node and open dialogs of the interface), Portal (#layer layer), useFloating (layer anchored to its trigger), useDraft (composer text per conversation), MenuButton, Dialog, ConfirmDialog, Toasts, JsonFileButton,
                     Person (avatar and name that open the profile), role and "You" badges, list presence,
                     useRightColumn (single 1180 px threshold: right column above, full screen below)
    rich-text.js     MessageText (emphasis, quotes, mentions, links), memberLink (member link through the link warning), bidiText (plain text with its names, links and quotes kept in their own direction), trusted hosts (isTrustedUrl),
                     RichText (sanitized mini profile), unlinkFullProfile (full profile links removed and listed), fullProfileDoc
    message-content.js  what a message holds once read (parseContent, parsePm): text, emphasis segments (EMPHASIS), references (encodeRef), media (mediaLinks, textLinks),
                     shown text without the links shown as a media (shownParts, messagePreview, EMBED_LABEL)
    media-library.js rules of the BetterChatango media library shared with the sample one: page size, entry validation, page order (mediaMatch), import screening
    sound.js         alert sound of the prototype (beep), silent in live
    account-store.js account data kept in this browser, torch-skin:<username>: every field declared with its kind, blank value and reading (notes, spaces, favorite people and their limits)
    loader-contract.js what the sandbox of the loader and the page agree on: events, delays, links, card fields and texts (ADR-0003)
    selectors.js     state reads: roles, a member's rights in a group (groupRights, canBanMember), user, theme, counters, listed conversations, displayed message of a private history entry,
                     message cap of a group or a conversation (THREAD_MAX, trimThread)
  bridge/     the bridge to BetterChatango
    live-parse.js    pure bridge functions: name spelling, private history records (reading, sorting an import), PM settings, group frames,
                     Premium background (parseMiniCss, background form), allowed client.post calls (postRefusal), updateprofile response, message background (parseMsgBg), vissle activity replies (parseVisits), linked accounts (parseWho), presence, timestamps
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
    season (decorations of a season, New Year countdown and fireworks), pip (conversation popped out into a floating window),
    spaces (spaces, their bar under Search or jump to, their editor), voice (voice message recording of the composers and its WAV file),
    gif (GIF tab of the emoji and media picker), shared-media (media and links of a group or a PM),
    discover, palette (Ctrl K), live-joined (joined, owned and recent groups), session (session loss dialog, banner of a lost connection)
  settings/   settings
    shell, profile (Visitors and vissle tracker included), appearance, notifications, privacy (Chatango account PM settings included, and Safety),
    language-a11y-about (and Diagnostics)
    group-view, group-pages                                             prototype group settings, Overview shared with live
    group-staff                                                         Staff and roles, Members and Invites pages, shared by live and prototype
    markup-toolbar                                                      formatting toolbar of the bio and the full profile
    avatar-crop                                                         cropping of one's own profile picture (live)
    live-group-view, live-group-pages, live-group-staff (audit log), live-account   live variants (live-account: Password and email and Chatango Premium pages shared with the prototype)
  app/        root
    state.js         persisted preferences
    live-state.js    live state built for Root: world at login, group, ban lists, session loss, account data kept in this browser (useLocalStore),
                     members and groups created on the fly with that data, presence, styles, group edits, group settings read from Chatango,
                     members nothing refers to any more dropped from the state (usePrunedUsers)
    pm.js            PMs: reception, private history merge, unreads read from the archive (BetterChatango database, or memory in the prototype and without a database),
                     useLivePms: private history loaded into the conversations in live and presence of their correspondents
    overlays.js      useOverlays: toasts, dialogs and navigation drawer, opened by the views through ui
    inbox.js         useInbox: PM archive of unreads, reception and notification of incoming events, navigation that marks a conversation read,
                     Mentions page log
    actions.js       useActions: actions the views call through the context, those of the prototype replaced in live by those passed to Chatango
    reconnection.js  useReconnection: reconnection of the groups and the private connection, on demand and automatic after a loss
    simulation.js    useSimulation: activity of the prototype's sample world
    live-ops.js      useLiveOps: bridge operations applied to the state (handleLiveOp), through useBridgeOps: each operation goes to the handler
                     of the latest render, those after login once it has rendered, history pages applied in one update (addHistory)
    root.js          Root, which only composes the hooks of app/ and renders, and its page hooks: state (useAppState and its store, appStore), display preferences,
                     idle members, tab title, Ctrl K, update check
    start.js         mounting, recovery screen after an interface error
  loader/
    skin-loader.js   sandbox-side userscript: header and @version, home page guard,
                     page code injection, vissle, TikTok and X bridges (GM_xmlhttpRequest)
    skin-page.js     page code: double start protection, starts BetterChatango, loads React (SRI),
                     waits for BetterChatango, mounts the Shadow DOM
    skin-journal.js  diagnostic journal, inserted by the build at the top of the page code (ADR-0011)
  styles/
    app.css          application styles
    login.css        BetterChatango sign-in screen in Nightango colors, put in the document by skin-page.js
scripts/
  build.mjs          Node build (esbuild bundle, import graph check, userscript assembly, minification)
  changelog.mjs      reads CHANGELOG.md, for the build (What's new) and the GitLab release notes
  release.mjs        release rules of both CI (version, what a branch publishes, notes) and the GitLab release
  ds-components.mjs  regenerates README.md and preview.html of the design system components
tests/               jsdom suites and run.mjs runner
torchds/project/     design system: tokens, components/bundle.js (namespace window.Torch), CSS, types
dist/                build outputs, not versioned
```

`bridge/live-parse.js` contains only functions that read neither the BetterChatango client, nor `emit`, nor any variable of the bridge closure. A function that depends on this closure stays in `bridge/live-bridge.js`. The bridge keeps the steps specific to BetterChatango: waiting for Chatango's replies and their delays, requesting the announcement and reading a group's info after `inited`, the mention sound of a PM, the temporary `k:` message ids. It emits only facts to `Root`. Each listener receives an operation on its own: one that throws is logged to the console, so to the diagnostic journal, and stops neither the other listeners nor the step that emits, sign-in included (`deliverOp`). `useLiveOps` (`app/live-ops.js`) applies them to the state, with `app/pm.js` for PMs and `app/live-state.js` for the live state it builds. The operations received after `login` wait for its first render, then go through `deliverOp` in their order: until then, they would read the signed-out state, which has no groups, users or route. `useLiveOps` subscribes once, and each operation runs the handler of the latest render (`useBridgeOps`): a handler that reads the state directly still sees the current one.

## Modules

Each file of `src/` is an ES module: it imports every name it reads from another file and exports only the names other files read ([ADR-0017](adr/0017-es-modules.md)). `scripts/build.mjs` bundles two entries with esbuild (`bundle`, `format: 'esm'`, `target: 'es5'`) and wraps each bundle in a strict mode IIFE:

- `src/main.js`, the userscript: the interface starts without a host.
- `src/main-hosted.js`, the hosted prototype (`dist/app.js`, `dist/nightango.html`): its page can hand a saved state and read the state back through `window.claude.hot`, and it gets `window.showNewYear` and `window.showSkyAt` for review. The userscript entry never imports it, since any script on st.chatango.com could define this hook. The host reaches the interface as the `host` argument of `start` (`app/start.js`), read by `useAppState` (`app/root.js`).

The `build:info` module, provided by the build, exports `APP_VERSION`, the `@version` of `src/loader/skin-loader.js`, and `RELEASE_NOTES`, the sections of `CHANGELOG.md` read in the Keep a Changelog format (`{ version, date, groups: [{ title, items }] }`, most recent first). The prototype and the userscript therefore get the same version and the same notes. The build rejects a malformed `CHANGELOG.md` or one whose first section is not the `@version` one.

The `build:tokens` module, provided by the build, exports `COLOR`: each color token of `tokens.json` by theme. The surfaces against which colors are corrected (`SURFACE`), the default accents, the text on an accent fill, the soft fill opacity and the theme thumbnails of Appearance read it, never a copy.

Imports only go down the layers `core/`, `bridge/`, the screens (`views/` and `settings/`), then `app/`, and no module is in an import cycle. The build reads the import graph from the esbuild metafile and refuses any other import (`checkImports`). The modules left in a cycle by the migration are listed in `KNOWN_CYCLIC`, which only shrinks: the build refuses an entry that no longer holds.

The evaluation order follows the imports: a module whose top level runs code (the bridge, global listeners) runs after the modules it imports. esbuild renames a function named like another top-level name of the bundle (`MessageRow2`): its `name` property carries the suffix.

The build rejects app code or a bundle that contains `</script`, a userscript stylesheet that still targets `:root` or `html,body{`, and a sign-in screen stylesheet that contains `url(` or `@import`.

## Userscript in two contexts

Tampermonkey runs `skin-loader.js` in a sandbox that sees neither BetterChatango nor React. The userscript is therefore split into two contexts ([ADR-0003](adr/0003-two-context-loader.md)).

```
Tampermonkey sandbox (skin-loader.js)            st.chatango.com page
  guard: home page only                 ---->     inline <script> (page code as a JSON literal)
  vissle, TikTok and X bridges                      skin-page.js: BetterChatango, React, Shadow DOM
  (GM_xmlhttpRequest)                               application (bundle + src/)
        ^                                                 |
        |  CustomEvent torch-skin:{bridge}-request        |
        +--------------------------------------------------+
           CustomEvent torch-skin:{bridge}-response, bridge: vissle, tiktok or x
```

- Header: `@match https://st.chatango.com/*`, `@noframes`, `@grant GM_xmlhttpRequest`, `@connect vissle.me`, `@connect tiktok.com`, `@connect publish.x.com`, `@connect cdn.syndication.twimg.com`, `@run-at document-idle`.
- The loader stops outside the home page (`window.top !== window` or `pathname !== '/'`): st.chatango.com also serves the chat windows embedded in other sites.
- Both contexts are ES modules bundled by esbuild (`loaderBundle`, `scripts/build.mjs`). What they agree on is `core/loader-contract.js`, which the app imports too: event names (`loaderEvent`, `ACCOUNT_EVENT`), the call timeout of the sandbox and the longer wait of the page (`LOADER_TIMEOUT`, `LOADER_WAIT`), the Visitors filters, the TikTok and X link patterns, the fields of an X card that the page checks again, and the texts both show.
- The page code is injected by a `<script>` whose `textContent` is an ASCII-only string literal (`__PAGE_CODE__`, written in by the build). It is never parsed as HTML. The build writes the stylesheets into the page code the same way, and inserts the design system and the application where it calls `__TORCH_BOOT__()`.
- Only the vissle, TikTok and X bridges run in the sandbox. The page sends them its requests through `askLoader` (`live-bridge.js`), which matches the replies by id, ignores a reply that is not JSON or matches no request, and rejects a request that gets no reply in time, as with a userscript manager without `GM_xmlhttpRequest`. Its wait outlasts the loader's own `GM_xmlhttpRequest` timeout, whose reply says more. Any script of the page can send a request: each bridge reads only a JSON object with a string id and the fields it expects, and answers any other request with an error, without a call. The vissle bridge accepts only the `page`, `order` and `get` values the Visitors screen sends (`docs/betterchatango-protocol.md`, Profile activity). It reads the queried profile from `client.user.name` through an inline probe injected on each request, which returns it through a synchronous `CustomEvent` (`torch-skin:account`), and ignores the one the page would ask for. No `unsafeWindow`: Userscripts (Safari) does not provide it ([ADR-0005](adr/0005-visitors-own-profile-only.md)). The TikTok bridge accepts only a short or post TikTok link, which it rebuilds, and replies with the post id and link and the cover address only ([ADR-0014](adr/0014-tiktok-embed.md)). The X bridge accepts only an X post link, which it rebuilds, parses the oEmbed `html` in an inert `DOMParser` document and replies with the card fields and the first media only ([ADR-0015](adr/0015-x-embed.md)).
- `skin-page.js` protects itself from a double start (`window.__TORCH_SKIN__`), sets up the diagnostic journal (`startJournal`, `skin-journal.js`) before any BetterChatango socket, watches for the BetterChatango sign-in screen, adds the BetterChatango startup script, loads React and ReactDOM from cdnjs with SRI, waits for BetterChatango's global objects, then mounts the interface.
- If the startup fails, the original BetterChatango client stays in place.

## Diagnostic journal

- `skin-journal.js` wraps the `WebSocket` constructor and the console, listens to the page lifecycle and to errors, and keeps the last 1,000 events of each account in `localStorage` under `torch-skin:journal:<username>`. Until sign-in, it keeps the events of the page in memory only. What it keeps and never keeps: [ADR-0011](adr/0011-diagnostic-journal.md).
- The application reads it through `JOURNAL` (`core/env.js`, `window.__TORCH_JOURNAL__`), `null` in the prototype and in the suites that load only the bridge. On sign-in, the bridge gives it the account name (`JOURNAL.signIn`), which adds the events of the page to that account's log. The bridge records its connections, BetterChatango's warnings, the requests its post helper refuses and a refused save of the unread migration flag in it. The Diagnostics page, listed only if `JOURNAL` exists, shows it, copies it, downloads it and clears it.

## Mounting and display

- The `#torch-skin` host is created after BetterChatango has started, since BetterChatango rebuilds its page. It carries an open Shadow DOM that contains the application stylesheet and the `#app` mount point.
- The build adapts the application stylesheet to the Shadow DOM: `:root` becomes `:host`, and the global classes (`reduce-motion`, `underline-links`, `calm-sky`, `moon-south`) move to `:host(...)`.
- The interface stays hidden until the BetterChatango session is open. Sign-in happens on the BetterChatango screen.
- That screen only gets a stylesheet, `<style id="torch-skin-login">` in `document.head`: `src/styles/login.css` after the tokens declared under `.login`, in the system theme, or the one chosen in Nightango once the `#torch-skin` host carries it (`body:has(> #torch-skin[data-theme])`). It recolors BetterChatango's `--theme-*` variables, so its menu and windows follow too. No script touches its form, and the stylesheet loads nothing ([ADR-0001](adr/0001-password-never-read.md)). BetterChatango replaces the whole document before showing its screen: a `MutationObserver` on `<html>` adds the stylesheet to the new document, before the first paint. If the interface cannot start, the stylesheet is removed and the screen goes back to its BetterChatango look.
- Fields of that screen use 16px text on touch screens (`pointer: coarse`), like the interface fields: iOS Safari zooms into a field under 16px.
- On sign-in, `window.__TORCH_SHOW__` hides the rest of the BetterChatango page and shows the host.
- An error while rendering the interface or in one of its effects shows the recovery screen instead of an empty page: `Recovery` (`app/start.js`), an error boundary around `Root`. It offers Reload and, in live, Show BetterChatango, which calls `window.__TORCH_HIDE__` to remove the host and the hiding stylesheet. BetterChatango's connections keep running and the bridge keeps its hooks: the groups work there, but BetterChatango's private `connect` and `DENIED` handlers stay held (`docs/betterchatango-protocol.md`, Friend presence), so a private conversation opens only after a reload, as the screen says. The error goes to the console, so the diagnostic journal keeps its name and message only.
- Dialogs, menus and notifications go through `Portal`, rendered in a `#layer` layer next to `#app`, so they do not distort the layout. `Layers`, around `Root`, gives the interface this layer and its stack of open dialogs, never shared with another interface. While a dialog is open, `#app` and the dialogs under the top one carry `inert`: Tab and screen readers stay in the top dialog. Menus and toasts, above the dialogs, stay reachable. While the session loss dialog is open the toasts go under it and its veil (`Toasts`, `under`): nothing they offer can work until the session is back. A lost connection has no dialog: `SessionBanner` (`views/session.js`) shows it in the main pane, above the message box of a group or a conversation, at the top of Discover, Mentions and the settings, and leaves the interface open.
- The interface fonts (Geist, Geist Mono, Instrument Serif) are embedded: woff2 files of the Latin subset in `torchds/project/fonts/`, under SIL OFL 1.1 (`OFL.txt`). The build encodes them as base64 `data:` URLs in the `@font-face` rules of `fonts.css`. `skin-page.js` puts these `@font-face` rules in a `<style id="torch-skin-fonts">` in `document.head` when the interface mounts: Chrome ignores a `@font-face` declared only in the shadow root. The hosted prototype gets the same `@font-face` rules in its stylesheet. The design system previews and the mockups link `fonts.css`. No external font request.

## Live mode and prototype mode

- `LIVE = !!window.__TORCH_LIVE__` (`core/env.js`). `skin-page.js` sets the flag, the hosted prototype does not.
- The differences between the two modes are guarded by `if (LIVE)`.
- Rights in a group follow Chatango's model in both modes: one owner and moderators with their rights bits (`settings.staff`, `settings.modFlags`), read by `groupRights`. The prototype has no role that Chatango does not have.
- In live, the actions of `app/actions.js` are overridden by those of its "Live actions" block. The bridge (`liveBridge`) turns BetterChatango's frames into operations, which `handleLiveOp` (`app/live-ops.js`) applies to the state.
- Nightango's sounds are off in live: BetterChatango already plays its own. The bridge only makes it play its mention sound for a PM outside the open conversation (`docs/betterchatango-protocol.md`, What stays in BetterChatango).

## React state

- `Root` holds the whole application state (`useAppState`, `app/root.js`). It only composes named hooks, one responsibility each, and renders: the hooks get what they share from it as arguments (the state and its update, `toast`, the inbox of `useInbox`), never through a module variable. The state must stay JSON-serializable.
- `update(fn)` applies `fn` at once to a copy-on-write draft of the latest state (`openDraft`, `core/draft.js`): only the objects a change reaches are copied, from the changed one up to the root, and the next state shares every other object with the previous one. An operation on one group leaves the other groups and the users map as they are. `stateRef.current` is that latest state, even before the interface shows it. An update that throws changes nothing, and a draft written after its update throws: the state never changes in place. A scan that only reads a long list of a draft goes through `plainOf`, without a draft for each element: it sees the elements as the update has changed them so far.
- The interface shows a new state right away, except for the bridge operations: `useLiveOps` applies them in `inAnimationFrame`, and their state is shown on the next animation frame, once for all the operations of that animation frame, a history page or a burst of presence included. In a hidden tab, where animation frames stop, it is shown on the next timer. Each operation is its own update, so one that throws changes nothing, except the messages of a history page: Chatango sends a page one frame per message, and its messages wait for the animation frame (`atFrame`), or for the next operation, which reads them in the state. They then go into the state in one update that sorts and trims each group once.
- The views read the state through two contexts. `Ctx` (`useApp`) changes with the shown state. `ApiCtx` (`useAppApi`) is the same object for the whole session: actions, ui, nav, update, drafts, the state store, the minute clock and `keepUsers`. The rows of the message logs, the member list and the Chats list are memoized: they take what they show from their props and their callbacks from `useLatestCalls`, so a change elsewhere in the state, a presence for example, does not render them again. The components inside them read the parts of the state they need with `useStatePart`. Relative times share one minute clock (`useMinute`), with a single timer.
- In live, every five minutes, the members nothing refers to any more leave the state (`usePrunedUsers`): kept are the members of a group (member, guest, author of a loaded message, staff), of a conversation, of Meet people or Mentions, a pending friend, a member a view shows, and the members the user marked (friend, ignored, blocked, hidden style). A view shows members the state may not refer to through `useShownUsers`, which keeps them while it shows them: the lists that load mini profiles (`useProfiles`, the linked accounts of Who is this among them), a profile and a full profile. The users map then stays within the people the interface can show.
- Preferences are persisted in `localStorage` under `torch-prototype-prefs` (`app/state.js`). `loadPrefs` reads them over the defaults of `core/prefs.js`: a stored value of another type than its default, left by an older version or corrupted, gives way to the default. `sky.moon` is the only preference with two types (`auto` or a phase index). `accent` is a hex color or `auto`, the default: `accentOf` (`core/colors.js`) then gives Moonlight in the dark theme and Ember in the light one, so preferences stored with a color keep it. The stored preferences carry their schema version (`version`, 1): preferences stored without one are read as version 1, the current one, with no migration. In live, those in `BETTER_CHATANGO_PREFS` (`core/prefs.js`: guest messages, announcements) are BetterChatango settings: read back from its settings on sign-in, and `usePref().sw` toggles them only once they are written on its side. Trusted hosts (`safety.trustedHosts`) follow the same rule: in live, it is BetterChatango's list, read back on sign-in (`null` if unreadable) and changed by `actions.setTrustedHost` once written on its side.
- Account-specific data is persisted under `torch-skin:<username>`: closed conversations (`hidden`), hidden channels of each group (`channels`), the sending channel picked in each group when it is not none (`sendChannels`), the color picked for a group (`accents`), private notes on members (`notes`, label and text, read back by `storedNotes`, [ADR-0016](adr/0016-private-member-notes.md)), favorite people (`favoritePeople`, account names read back by `storedFavoritePeople`, each given a member in the state at sign-in), spaces (`spaces`, each with its name, its members as `group:<id>` or `dm:<name>` and whether it mutes outside PMs, read back by `storedSpaces`) and the space last open (`space`), the read position of each group (`readTs`, the server time of the newest read message, the 100 most recent kept), the roles of each group's staff except the owner (`badges`: the moderator list when Chatango sends it, otherwise the badge of each member's latest message seen in this or an earlier session, a message of this session replacing the stored role and a message without a badge dropping it), the badge picked for one's own messages in each group when it is not none (`ownBadges`), members with a hidden style (`unstyled`), own style (`style`), the day of the last Premium end reminder (`premiumReminded`, `docs/betterchatango-protocol.md`, Premium status) and the last emoticons picked (`recentEmoji`, written by the composer picker in `views/emoji-picker.js`, in the prototype too). Every field is declared once in `core/account-store.js`, with its kind, its blank value and its reading: the fields that mirror the state (`readMirror`, `writeMirror`, through `useLocalStore`) and those each written by one feature (`readOwn`, `writeOwn`: `recentEmoji`, `premiumReminded`, `pmReadMigrated`). A value of another kind reads as blank, and at sign-in `cleanAccount` writes the stored content back without it. The bridge also sets the unread migration flag there (`pmReadMigrated`, `docs/betterchatango-protocol.md`, Private history): each write merges with the stored content, so the fields of another writer stay. In live, favorite groups, group mutes and ignored members are BetterChatango's (`docs/betterchatango-protocol.md`, BetterChatango startup settings). The prototype keeps its own in its state.
- Composer drafts live outside the state, in memory only, in a store of `Root` given through the context (`draftStore`, `useDraft`, `core/ui.js`): a view saves its text when it leaves, keyed by `group:<id>` or `dm:<name>`, and gets it back on return. The store's `marked` changes only when a conversation gains or loses its draft: the sidebar and the Chats rows read it through `useDraftMarks` to show the draft marker, except on the conversation in view. A reload drops them, which is also how live signs out. The prototype empties them at sign-in.
- PM unreads come from the archive (`app/pm.js`): BetterChatango's history database in live, an in-memory archive in the prototype or when that database is missing. A conversation's `unread` is only a copy of it, written only by `app/pm.js` ([ADR-0012](adr/0012-pm-unread-from-history.md)).
- Profiles read (mini profile, Premium background in `u.miniStyle`) and message backgrounds (`u.msgBg`) are cached with the user. A profile change received from Chatango sets `u.avatarV`, the version of the member's picture, which their memoized rows take as a prop (`docs/betterchatango-protocol.md`, Profile changes).
- A member is keyed by their lowercase name. `u.spelling` holds the capitals of that name when a message or a session carried them, and the views show `shownName(state, name)`, which falls back to the key. A memoized row takes it as its `shown` prop (`docs/betterchatango-protocol.md`, Name spelling).
- BetterChatango's media library stays out of the state: the Media tab, the stars and the completion read it through the actions (`useActions`), in live from BetterChatango's `favorite_media` database (bridge), in the prototype from the sample media library (`sampleMedia`). Each write increments `mediaRev`, which makes them read it again (`docs/betterchatango-protocol.md`, Media library).
- Side by side: `split` holds a second conversation (`{ view, id, markerTs }`) shown next to the route's, at equal width, without the members or profile column. `openSplit` and `closeSplit` (`useInbox`, `app/inbox.js`) mark it read like `nav`, and `isPaneOpen` (`core/selectors.js`) counts both panes as open for unreads, mentions, presence, reconnection and the sidebar. `nav` drops the pane when the route shows the same conversation or no conversation, and `Shell` closes it below `NARROW_LAYOUT` or when its group or PM goes away. BetterChatango's PM focus follows the main PM, else the one beside.
- Floating window: `pip` holds the conversation popped out with Document Picture-in-Picture (`views/pip.js`). `openPip` (`app/inbox.js`) opens the window from the click, copies the stylesheets into it (inside a shadow root of its own in live) and mirrors the theme attributes of the root. `PipHost` renders the conversation there through a second React root with the same contexts, its `Layers` mounted in the window, so menus and dialogs of the conversation open there; the dialogs of `ui` (profile, confirmations) and the toasts stay in the tab. `isInView` counts the window as in front of the user even while the tab is hidden. Layers, menus and dialogs listen on the document of their own element.
- The Mentions page reads `mentionLog`: the last 100 group messages, live or from history, that mention the user, most recent first. The list lives only in the state and starts empty on each page load.

## Member content

- Messages: `parseContent` keeps the raw text in `text`, without the markers of a `▓…▒` pair, and splits the body into marked segments (`parts`) according to BetterChatango's allowlist: `b`, `i` without attributes, `u`, `s`, `strike` and `▓…▒` pairs. `MessageText` rebuilds them as `b`, `i`, `u`, `s` elements, whatever the "Fonts and text colors" setting. Any other tag is removed.
- Quotes: in each segment, `MessageText` recognizes `` @name: `text` `` as BetterChatango's rendering (`docs/betterchatango-protocol.md`, Sending) and rebuilds it as React elements, the name as a mention and the quoted text apart.
- Emoticons: `parseContent` replaces an `<i s="sm://{name}"/>` tag with the system emoji that the `EMOTICONS` table maps to the name, in `text` as in `parts`. From the member, only the name is kept and compared with the table (`docs/betterchatango-protocol.md`, Emoticons).
- Mini profile: `RichText` rebuilds an allowlist of tags as React elements. The `inline` mode (Meet cards) ignores blocks, links, images, size and alignment.
- Full profile: `fullProfileDoc` produces an isolated document in a `sandbox` `iframe` with no permission, with a CSP and `referrer` `no-referrer` in a `<meta>`. The frame is the `FullProfileFrame` component, shared by the full profile dialog and the Profile page preview, with `useFullProfileMedia` for the "Load images" button. Before it goes into the frame, the member HTML loses the address of every link (`unlinkFullProfile`, parsed without running or loading anything): no link opens from the frame. Below the frame, "Links in this profile" lists each distinct `http` or `https` address once (`memberLink`), through the link warning and the trusted hosts, and through the profile link handling for `{name}.chatango.com`. A profile opened from the full profile dialog closes it, since it covers the profile dialog. Under `styles.profileBackgrounds`, its `<style>` reuses the Premium background chosen by `miniStyleOf` (hex colors, `https` image with its repeat if media are allowed), each value checked before being written.
- Premium background: colors taken from `custom_profile.css` by `parseMiniCss`, with guaranteed contrast. In the profile dialog, `miniSkin` applies the background, the text and the theme color tokens (secondary text at 4.5:1, borders, hovers) to the whole dialog. The image is an `<img>` with `referrerPolicy="no-referrer"`, as a 120 px cover (`object-fit: cover`) behind the avatar, faded into the background color. The PM profile panel keeps the background on the text block only, with the image as a banner above it. Meet cards show only the color. The Premium background image follows the media settings, trusted hosts (`waitsForClick`) and `styles.profileBackgrounds`.
- Message background: under `styles.backgrounds`, the color taken from `msgbg.xml` by `parseMsgBg` colors the row of a group message marked `bg`, text and name at 4.5:1. The `msgbg.jpg` image is a CSS background behind the text (`background` slot of `T.Message`), at its natural size, placed according to the member's alignment, tiled if the member asks for it, only if `embedImages` is on and `proxyMedia` is off.
- Hidden style: "Hide style", in a message menu or the actions on a person, marks the member `unstyled`. `memberStyles` then renders their rows, in groups and in PMs, as if `styles.names`, `styles.fonts` and `styles.backgrounds` were off for them alone, without reading their message background, and `MessageText` removes their bold, italic and underline, keeping strikethrough. Reference: BetterChatango's `/style name` (`inject.js:7308-7350`), which only affects messages already displayed and keeps nothing on reload.
- Profile picture: the avatar of the profile dialog and panel, once its thumbnail has loaded, opens a full screen viewer of `full.jpg` as a `no-referrer` `<img>`, with a fallback to the thumbnail.
- Member media: nothing is loaded before the click when `embedImages`, `embedVideos`, `embedX` or `proxyMedia` ask for it. A single test, `waitsForClick` (`core/rich-text.js`), decides that a media item waits for the click: never for a URL from a trusted host (`isTrustedUrl`), otherwise always for a video or audio file, and under `proxyMedia` for an image, the YouTube thumbnail, a TikTok or X post, a media library thumbnail, a mini profile image or the Premium background image. Two intended exceptions: the message background image, always on `ust.chatango.com`, follows only `embedImages` and `proxyMedia` (`docs/betterchatango-protocol.md`, Resources loaded by the loader and the interface), and the full profile loads all its images at once through "Load images". `parseContent` also picks up YouTube links, images and video and audio files typed as text (`docs/betterchatango-protocol.md`, Media). A displayed image carries the media library star, "Add to media" or "Remove from media".

See [ADR-0004](adr/0004-member-html-never-injected.md).

## Design system

- `torchds/project/` contains the tokens (`tokens.json`), the components (`components/bundle.js`, namespace `window.Torch`, and `bundle.css`), their types (`index.d.ts`), the embedded fonts (`fonts/`) and the guidelines (`README.md`).
- Moonlight theme: a sky (`sky-top`, `sky-bottom`, stars as `--stars` set on `#app`) behind solid panels. Only the name of the brand sits on it: panel headers keep their panel's surface. The moon comes from `Torch.Moon` and `Torch.moonPhase`, computed on the device without a request. The `sky.calm` and `sky.south` preferences set the `calm-sky` and `moon-south` classes on the root. `sky.moon` is `auto` or the index of a phase from `Torch.moonNames`, which the brand draws in place of the evening moon.
- Sky by the hour: `skyAt` (`core/util.js`) turns the device hour into the shares of the early and late skies of the theme, from keyframes it holds or blends between. `useSkyHour` (`app/root.js`) sets them on the root as `--sky-early` and `--sky-late`, at mount and on each tick of the minute clock, and removes them under `sky.calm`. The stylesheet mixes the `-early` and `-late` tokens into the base sky with them, as `--sky-top-now`, `--sky-bottom-now`, `--star-now` and `--cloud-now` on `#app`, which every sky rule reads: no color is computed in JavaScript, and without the shares the base sky shows. The floating window gets them with the `style` of the root. A season follows the hour unless its tokens repeat its sky in the early and late ones, as Halloween and Christmas do. The sign-in screen keeps the base sky. The stars of the sky band (`BrandSky`, `views/shell.js`) turn in the stylesheet, one turn per sidereal day: the component only sets, as the animation delay, where the turn stands when they start moving. `calm-sky` and reduced motion stop them, `moon-south` reverses them and draws the Southern Cross in place of the pole star. On the hosted prototype, `window.showSkyAt(hour)` holds the sky at an hour for review.
- Seasons: `seasonOf` (`core/util.js`) reads the season from the device date, and from `sky.south` for winter, with Christmas taking the place of winter on its dates, `useDisplayPrefs` (`app/root.js`) keeps it when `sky.season` is on, `Root` exposes it as `app.season` and, for `T.Avatar`, through `SeasonCtx`, which changes only with the season, and sets the `season-<id>` class on the root. The build writes the season tokens of `tokens.json` (`color.seasons`) under that class, after the base theme, and moves it to `:host(...)` in the Shadow DOM. Its decorations (`views/season.js`) are rendered only during the season. At Halloween: bats and a branch in the brand, a cobweb with a spider in the member column, a costume through the `decor` slot of `Torch.Avatar`, which `T.Avatar` fills from 24px up, never on a group icon. In winter: frost and snowflakes in the brand, a winter costume under the same rules. At Christmas: a string of lights and a fir branch with a bauble in the brand, a star beside the moon of `BrandMark`, snowflakes unless `sky.south` is on, a costume under the same rules. On Valentine's Day: a garland and rising hearts in the brand, no costume.
- `components/bundle.js` and `bundle.css` are maintained by hand. The `README.md` and `preview.html` of each component are generated by `pnpm build:ds`.
- The build produces the token stylesheet from `tokens.json`: dark theme by default, light theme by system preference or by explicit choice.
- The type scale of `tokens.json` (`type.groups`) reaches the stylesheets as one `--font-size-<style>` variable per style (`--font-size-body`, `--font-size-control`...), on the sign-in screen too. The three stylesheets take their font sizes from these variables.
- New Year: `newYearAt` (`core/util.js`) reads the device time around local midnight on January 1: the countdown in the last minute of December 31, the fireworks in the first minute of January 1. `useNewYear` (`views/season.js`) renders again when that changes, with a timer of an hour at most the rest of the year. While `sky.season` is on, `NewYearMark` shows the countdown under the moon of `BrandMark`, then "Happy New Year", the only text announced (once, through a live region that exists from the countdown on). `NewYearSky`, first in the shell, draws the fireworks in the sky behind the panels and sets the `season-new-year` class of their tokens on the root. `NewYearMark` adds a few bursts on the sky band. No fireworks with Calm sky or reduced motion. The hosted prototype plays the last ten seconds of the year on demand with `window.showNewYear()` (`reviewNewYear`), published by its entry only.

## Build outputs

- `dist/nightango.min.user.js`: the deliverable. Same assembly as the readable version, with the esbuild transform (`transform`, ES5 target, `minify`) applied to the page code, the loader code and both stylesheets. The `==UserScript==` header is copied as is, without a source map ([ADR-0008](adr/0008-separate-minified-output.md)).
- `dist/nightango.user.js`: readable version, for debugging and audit.
- `dist/nightango.html` and `dist/app.js`: hosted prototype.

Both userscripts come out of the same `userscript()` function, which describes the assembly steps only once. The readable version keeps the code and its names, not its comments: esbuild drops them.

## Tests

jsdom suites in `tests/`, run by `tests/run.mjs` after the build. The runner starts as many suites side by side as the machine has cores and prints their outputs in the order of the list:

- `smoke`: hosted prototype, loaded from `dist/nightango.html` and started through its hook.
- `live_ui`: live mode with a fake BetterChatango client, on `dist/app.js` and the design system bundle. It records every frame sent and checks its exact format. The app timers and `Date.now` follow real time on a clock the suite moves forward: `skip` jumps over a delay and `skipUntil` jumps from one app timer to the next until a condition holds, so the 2 s socket poll, the connection timeout and the reconnection delays cost no real wait. React keeps the real timers, and each timer run that way is followed by a short real pause for the render.
- `loader`: userscript, BetterChatango startup, ignored pages, double start, vissle, TikTok and X bridges, diagnostic journal, recovery screen, prototype hook left out. Run on `dist/nightango.user.js` then on `dist/nightango.min.user.js`. It is the only suite that runs the userscripts.
- `layers`: menus, dialogs and toasts of `core/ui.js` in a Shadow DOM, as in live, on the modules of `src/core/` bundled by the suite and the design system bundle. The cases move the clock of the app timers forward themselves.
- `pm`: PM unreads, private history reading, merge, import and pages up to the cap, on the modules of the bridge and `src/app/pm.js` bundled by the suite, with the fake history database of `tests/fake-pm-db.js`, shared with `live_ui`.
- `draft`: copy-on-write drafts of the state, on `src/core/draft.js` alone: what a change copies and what it shares, array moves, a draft held at a second place or inside a given object, `plainOf`, a write after the update and an update that throws.
- `member_content`: member content read by the bridge and the interface (Premium background file, trimming of message text), its guards and its cost on large input, on the modules of `src/bridge/live-parse.js` and `src/core/rich-text.js`.
- `markup`: profile formatting toolbar, tags around the selection and merging of `<font>` attributes, on `src/settings/markup-toolbar.js`.
- `live_login`: sign-in detection, a listener that throws and the diagnostic journal kept per account, on the bridge bundled by the suite with `app/live-ops.js`, after the diagnostic journal. Then the operations after sign-in, held until the first render and handed to the latest handler (`useBridgeOps`).
- `avatar`: avatars, on the design system bundle, `avatarSrc` (`src/core/chatango.js`) and the `T` wrapper of `src/core/globals.js`.
- `moon`: moon phase compared with published dates and drawing direction, on the design system bundle, then the season dates at their boundaries in both hemispheres and the sky by the hour at its keyframes, between them and across midnight, on `src/core/util.js`.
- `check_ds`: rendering of the design system previews, on `torchds/project/components/bundle.js`.
- `perf`: cost of the live operations on a busy state (four groups, three at their message cap, hundreds of members, thousands of known users), started in live mode through the prototype hook that `dist/app.js` keeps, with a fake BetterChatango client and the animation frames run by the test. It counts what an operation shares with the previous state, the renders of a burst of operations within one animation frame, the sorts of a history page, the rows rendered again, the members dropped and those kept while a dialog shows them, and the minute timers, with a time budget per operation. The counts carry the checks: the budget leaves a wide margin for slow machines.
- `allowed_calls`: every `fetch`, `client.post` and `GM_xmlhttpRequest` call site, the `@grant` and `@connect` of the userscript and the `credential` option, against the closed list of `docs/betterchatango-protocol.md` (Allowed HTTP calls), on the sources of `src/`.
- `new_year`: the countdown and fireworks minutes around local midnight on January 1, at their boundaries, and the delay until what is shown changes, on `src/core/util.js`.
- `voice`: the WAV file of a voice message (header, sizes, 16-bit samples clipped), the downmix of a stereo recording and its cut at the length limit, on `src/views/voice.js`.
- `release`: what `scripts/release.mjs` publishes from a `@version` and a branch (stable from `main`, betas from `beta`, a beta refused on `main`), the release notes of a version, and the `CHANGELOG.md` formats that `scripts/changelog.mjs` refuses. No network: the script only publishes when run as the entry point.

The suites that read modules bundle them with `bundleForTest` (`scripts/build.mjs`), which exposes the names a suite needs under one global name.

Test policy: [ADR-0009](adr/0009-test-only-complex-behaviour.md) and `docs/coding-conventions.md`.

## Continuous integration

The code is pushed by hand to GitHub and to GitLab, with no automatic mirroring. Each host runs its own copy of the same pipeline and publishes its own releases: keep both in step.

- `.github/workflows/ci.yml`, `test` job: `pnpm install --frozen-lockfile` then `pnpm test` on every push and pull request to `main` and `beta`. Before the tests, it refuses a `-beta` `@version` on `main` or in a pull request to `main` (`node scripts/release.mjs check`). After them, it hands the SHA-256 checksums of both userscripts it tested to the `release` job.
- Same workflow, `release` job: on a push to `main` or `beta`, after `test`. It runs `pnpm build` again and checks both userscripts against the checksums of the tested ones: a single byte of difference stops it. No action carries `dist/` from one job to the other, since that would be a new dependency. `node scripts/release.mjs plan` then decides from the `@version` of `src/loader/skin-loader.js` and the branch whether a release is due, its tag and whether it is a prerelease. If the release `v` followed by this number does not exist yet, the job creates the tag on the tested commit and the GitHub release with both userscripts and their checksums (`SHA256SUMS`) attached, and the notes of `CHANGELOG.md` (`node scripts/release.mjs notes`). Otherwise it publishes nothing. On `beta`, only a `X.Y.Z-beta.N` version is published, as a prerelease never marked latest. A stable version there publishes nothing. Releases run one at a time (`concurrency: release`). Actions are pinned to the full commit SHA of their release, with the version in a comment.
- `.gitlab-ci.yml`, `test` job: same checks and tests, for merge requests and pushes to `main` and `beta`, in `node:24-bookworm-slim` pinned by digest, with pnpm from `packageManager` through corepack. It writes `SHA256SUMS` and keeps both userscripts and the checksums as job artifacts.
- Same pipeline, `release` job: on a push to `main` or `beta`, after `test`, on the artifacts of that job, checked against `SHA256SUMS` first. `node scripts/release.mjs gitlab` applies the same rules as the GitHub job (one release per `@version`, betas from `beta` only, stable only from `main`), uploads the three files to the project's generic package registry and creates the release on the tested commit, with links to them and the notes of `CHANGELOG.md` (`scripts/changelog.mjs`, shared with the build). It uses the CI job token only. GitLab has no prerelease flag: a beta is an ordinary release, which the update check skips by its tag. Releases run one at a time (`resource_group: release`).
- pnpm comes from the `packageManager` field of `package.json`, Node from its `engines.node` field, which a local run follows too: pnpm warns under another Node version.

## BetterChatango reference copy

`reference/torch/` contains BetterChatango's code as served by vissle.me on 2026-10-19, read-only. Neither `scripts/build.mjs` nor the tests read it: the build only takes the modules its entries import and `torchds/project/`.

## Published artifacts

On the user's claude.ai account:

- Mockups (Design): https://claude.ai/artifact/JuDrFE7mapqwAzCDjcFeFQ
- Design system: https://claude.ai/artifact/ATzDF31PsVNFEYWmUWA3GW
- Hosted prototype (simulated data): https://claude.ai/artifact/D2Em5urvHC1FCpcmMmWHgH

A session can update them by passing their URL to publish, after reading them again.
