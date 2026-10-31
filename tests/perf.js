// Cost of the live operations on a busy state, read through counts: what an operation shares with the previous state, the renders it causes
// and the members dropped.
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const S = process.argv[2];
const ME = 'marjorie';
const MIN = 60000;
// Period on which the members nothing refers to leave the state (PRUNE_EVERY, app/live-state.js).
const PRUNE_EVERY = 5 * MIN;
const GROUPS = ['busy0', 'busy1', 'busy2', 'busy3'];
// Messages of each group: the first three at the cap (THREAD_MAX), the last one below it, for a history page that stays.
const SIZES = [500, 500, 500, 300];
const MEMBERS = 350, AUTHORS = 120, FRIENDS = 40, CHATS = 30, STALE = 600;
// Time budgets per operation, render included, about seven times what the operations take here: far below the copy of the whole state,
// 400 ms per message of a burst and 15 ms per message of a history page.
const MS_PER_OP = 40, MS_PER_HISTORY_OP = 8;
// Components whose renders are counted, by name.
const COUNTED = ['Root', 'MessageRow', 'MemberRow', 'ChatRow'];

const errors = [];
const log = [];
function step(name, ok, detail) { log.push((ok ? 'ok   ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); }
const wait = ms => new Promise(r => setTimeout(r, ms));
// At the limit, returns without an error: the next step judges and gives its detail.
const until = async (cond, ms = 10000) => { for (const end = Date.now() + ms; !cond() && Date.now() < end;) await wait(10); };
const noop = () => {};
const react = ['react/umd/react.development.js', 'react-dom/umd/react-dom.development.js'].map(f => fs.readFileSync('node_modules/' + f, 'utf8'));
const bundle = fs.readFileSync(S + '/torchds/project/components/bundle.js', 'utf8');
const app = fs.readFileSync(S + '/dist/app.js', 'utf8');

/**
 * Opens the live interface on a fake BetterChatango client, started by the prototype hook that dist/app.js keeps.
 * @param {{account: string, groups: string[], state: ?Object, paints: boolean}} o Signed-in account (empty: no sign-in), groups of the client,
 *   state handed to the interface (null: signed-out start), animation frames run by the test instead of the browser.
 */
function page(o) {
  const vc = new VirtualConsole();
  vc.on('error', e => errors.push(String(e && e.message || e)));
  vc.on('jsdomError', e => errors.push('jsdom: ' + e.message));
  vc.on('warn', e => { if (!/act\(|ReactDOM.render|useLayoutEffect|\[torch-skin\]/.test(String(e))) errors.push('warn: ' + String(e).slice(0, 300)); });
  const dom = new JSDOM('<!doctype html><html><head></head><body><span data-sidebar="private"></span><div id="app"></div></body></html>',
    { runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc, url: 'https://st.chatango.com/' });
  const w = dom.window, d = w.document;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  w.CSS = { supports: () => false };
  w.ResizeObserver = function () { return { observe() {}, disconnect() {} }; };
  w.IntersectionObserver = function () { return { observe() {}, unobserve() {}, disconnect() {} }; };
  w.HTMLElement.prototype.scrollIntoView = noop;
  w.fetch = () => Promise.resolve({ ok: false, status: 404, headers: { get: () => null }, text: () => Promise.resolve(''), json: () => Promise.resolve({}) });
  const paints = [];
  if (o.paints) {
    w.requestAnimationFrame = cb => { paints.push(cb); return paints.length; };
    w.cancelAnimationFrame = id => { paints[id - 1] = null; };
  }
  // Intervals by delay, with the ones still running.
  const intervals = [];
  const setInterval0 = w.setInterval, clearInterval0 = w.clearInterval;
  w.setInterval = (fn, ms) => { const id = setInterval0.call(w, fn, ms); intervals.push({ id, fn, ms, running: true }); return id; };
  w.clearInterval = id => { intervals.forEach(x => { if (x.id === id) x.running = false; }); clearInterval0.call(w, id); };

  const group = gid => ({ socket: { readyState: 1 }, user: { badge: 0, channel: { select: 0 } }, room: { owner: 'owner', information: { title: gid, description: '' } }, load: 5 });
  const C = {
    event: { group: { b: noop, i: noop, participant: noop, g_participants: noop }, private: { wlonline: noop, wloffline: noop } },
    user: { name: o.account, avatar: { x0: 50, y0: 50, ts: 50 }, style: false },
    groups: Object.fromEntries(o.groups.map(gid => [gid, group(gid)])), focus: o.groups[0],
    settings: {
      privacy: { groups: { connect_own: false, connect_recent: false, connect_favorite: false, favorite: [] }, private_messages: { connect_start: false } },
      notifications: { muted: { groups: [] }, sound: {} }, safety: { users: { ignore: [] }, whitelist: { enable: true, domain: [] } }
    },
    on(ev, cb) { d.addEventListener('chatango_' + ev, cb); },
    emit(ev, data) { d.dispatchEvent(new w.CustomEvent('chatango_' + ev, { detail: data })); },
    socket: noop, sendMessage: (data, length) => length ? '<n000/><f x11000="0">' + data : undefined,
    cache: { connect: [] }, connect: () => new Promise(noop), setFocus: noop, systemMessage: noop, setNotice: noop, renderYouTube: noop,
    private: { focus: false, socket: { readyState: 0 }, premium: {} }, database: {}
  };
  w.__betterChatangoRefs = {
    client: C, sidebar: { renderGroup: noop }, torch: { environment: 'betterchatangoenv' },
    chatango: { getBackground: noop, getAnon: () => '!anon', path: p => 'https://chatango.com/' + p, subdomain: {}, error: {} }
  };
  w.__TORCH_LIVE__ = true;
  w.__TORCH_SHOW__ = noop;
  w.__TORCH_MOUNT__ = d.getElementById('app');
  const hot = { read: null };
  w.claude = { hot: { data: o.state ? { state: o.state } : {}, snapshot(read) { hot.read = read; } } };

  react.forEach(code => w.eval(code));
  w.eval(bundle);
  // Counts the renders of the components named in COUNTED, plain or memoized: the app reads createElement and memo when it loads.
  const renders = {};
  const R = w.React, createElement = R.createElement, memo = R.memo, counted = new Map();
  function counting(type) {
    if (!counted.has(type)) counted.set(type, function (props) { renders[type.name] = (renders[type.name] || 0) + 1; return type(props); });
    return counted.get(type);
  }
  R.createElement = function (type) {
    if (typeof type === 'function' && !(type.prototype && type.prototype.isReactComponent) && COUNTED.includes(type.name)) arguments[0] = counting(type);
    return createElement.apply(this, arguments);
  };
  R.memo = function (type, compare) { return memo(COUNTED.includes(type.name) ? counting(type) : type, compare); };
  w.eval(app);
  return {
    w, d, C, intervals,
    // The interface has mounted and handed its state to the hook.
    ready: () => !!hot.read,
    state: () => hot.read().state,
    // Runs the animation frame the browser would show next.
    paint() { paints.splice(0).forEach(cb => { if (cb) cb(w.performance.now()); }); },
    group(name, room, data) { C.event.group[name](C, {}, room, data); },
    private(name, data) { C.event.private[name](C, {}, 'private_message', data); },
    count(name) { return renders[name] || 0; },
    reset() { Object.keys(renders).forEach(k => { renders[k] = 0; }); }
  };
}

/**
 * Builds a busy live state from a signed-in one: groups at their message cap with hundreds of members, friends, conversations and thousands of known users.
 * @param {Object} tpl State read right after sign-in, with one group.
 * @param {Object} style Style of every member, the one their messages carry.
 */
function busyState(tpl, style) {
  const s = JSON.parse(JSON.stringify(tpl)), base = s.groups.tpl, now = Date.now(), user = extra => Object.assign({ status: 'online', about: '', style, styleTs: 0, profileLoaded: true }, extra);
  s.groups = {};
  s.users = { [ME]: s.users[ME] };
  GROUPS.forEach((gid, gi) => {
    const g = JSON.parse(JSON.stringify(base));
    Object.assign(g, { id: gid, title: gid, topic: gid, joined: true, inited: true, membersLoaded: true, conn: 'open', historyCapped: SIZES[gi] === 500, lastReadTs: now });
    g.members = [ME];
    for (let k = 0; k < MEMBERS; k++) { const n = 'm' + gi + 'x' + k; g.members.push(n); s.users[n] = user(); }
    g.messages = [];
    for (let k = 0; k < SIZES[gi]; k++) {
      g.messages.push({ id: gid + '-' + k, kind: 'msg', author: 'm' + gi + 'x' + (k * 7 % AUTHORS), text: 'Message ' + k + ' with https://example.com/' + k, ts: now - 4 * 3600e3 + k * 20000, unid: 'U' + k, ip: '', channel: 'none', bg: false, embeds: [] });
    }
    s.groups[gid] = g;
  });
  for (let k = 0; k < FRIENDS; k++) s.users['f' + k] = user({ friend: true, status: 'offline', lastOn: now - (k + 2) * MIN });
  s.dms = {};
  for (let k = 0; k < CHATS; k++) {
    const n = 'c' + k;
    s.users[n] = user();
    s.dms[n] = { messages: [{ id: 'pm' + k, from: n, key: 'k' + k, text: 'Hello ' + k, ts: now - k * MIN }], unread: 0, lastReadTs: now, olderMore: false };
  }
  // Seen once and referenced by nothing any more: former members, search results.
  for (let k = 0; k < STALE; k++) s.users['gone' + k] = user({ status: 'offline' });
  Object.assign(s, { route: { view: 'group', id: 'busy0' }, lastChat: { view: 'group', id: 'busy0' }, liveFocused: true, groupsSeen: true, pmLoaded: true, friendsLoaded: true });
  return s;
}

/**
 * Lists the people the state refers to: groups (members, guests, authors, staff), conversations, friends and the people marked by the user.
 * @param {Object} s Application state.
 */
function referenced(s) {
  const names = new Set([s.me]);
  Object.values(s.groups).forEach(g => {
    g.members.concat(g.guestNames || [], Object.keys(g.settings.staff || {})).forEach(n => names.add(n));
    g.messages.forEach(m => { if (m.author) names.add(m.author); });
  });
  Object.keys(s.dms).forEach(n => names.add(n));
  Object.keys(s.friendAdds).concat(Object.keys(s.notifyOnline), s.mentionLog.map(x => x.author), s.meet ? s.meet.results : []).forEach(n => names.add(n));
  Object.keys(s.users).forEach(n => { const u = s.users[n]; if (u.friend || u.ignored || u.blocked || u.unstyled) names.add(n); });
  return names;
}

// Group message frame from a member, at a given time in seconds.
const msgFrame = (author, id, ts, text) => [String(ts), author, '', 'u1', 'UNID' + id, id, '', '0', '', '<n000/><f x11000="0">' + text];
const nextTask = () => new Promise(r => setTimeout(r, 0));
// Shows the next animation frame and lets React render it.
const show = async t => { t.paint(); await nextTask(); };

(async () => {
  /* A signed-in state with one group, read back to keep the state shape of the build under test */
  const first = page({ account: ME, groups: ['tpl'], state: null, paints: false });
  await until(() => first.ready() && !!first.state().groups && !!first.state().groups.tpl);
  const tpl = first.state();
  // The style of the test messages as the build reads it: members keep it from one message to the next.
  first.group('b', 'tpl', msgFrame('probe', 'probe', Date.now() / 1000, 'Style'));
  await until(() => !!first.state().users.probe);
  const style = first.state().users.probe && first.state().users.probe.style;
  step('template state signed in with its group', tpl.auth.loggedIn && !!tpl.groups.tpl && !!tpl.prefs && !!style, Object.keys(tpl.groups || {}));
  first.w.close();

  const t = page({ account: '', groups: GROUPS, state: busyState(tpl, style), paints: true });
  await until(() => t.ready());
  t.paint(); await wait(50);
  step('busy state shown', t.d.querySelectorAll('.tc-msg').length >= 400 && !!t.d.querySelector('.members-list'), t.d.querySelectorAll('.tc-msg').length);
  const s0 = t.state();
  step('busy state size', Object.keys(s0.users).length > 2000 && GROUPS.every((gid, i) => s0.groups[gid].messages.length === SIZES[i]), Object.keys(s0.users).length);

  /* One operation copies only what it touches */
  t.group('b', 'busy0', msgFrame('m0x1', 'one', Date.now() / 1000, 'One more'));
  t.paint(); await wait(50);
  const s1 = t.state(), g0 = s0.groups.busy0, g1 = s1.groups.busy0;
  const shared = {
    otherGroups: GROUPS.slice(1).every(gid => s1.groups[gid] === s0.groups[gid]), users: s1.users === s0.users, dms: s1.dms === s0.dms, prefs: s1.prefs === s0.prefs,
    group: g1 !== g0 && g1.messages[g1.messages.length - 1].text === 'One more' && g1.messages[0] === g0.messages[1] && g1.settings === g0.settings
  };
  step('a message in one group leaves the other groups, the users map and the messages it keeps shared', Object.values(shared).every(Boolean), shared);

  /* A burst of operations within one animation frame: one update, one render, only the new rows */
  const BURST = 30;
  t.reset();
  let start = Date.now();
  for (let k = 0; k < BURST; k++) {
    t.group('b', 'busy0', msgFrame('m0x' + (k % AUTHORS), 'burst' + k, Date.now() / 1000, 'Burst ' + k));
    await nextTask();
  }
  await show(t);
  let perOp = (Date.now() - start) / BURST;
  await wait(50);
  const burst = { roots: t.count('Root'), rows: t.count('MessageRow'), shown: t.d.body.textContent.includes('Burst ' + (BURST - 1)), perOp };
  step('a burst of messages within one animation frame gives one render', burst.roots === 1 && burst.shown, burst);
  step('a burst of messages renders only the new rows', burst.rows <= BURST + 2, burst);
  step('a burst of messages stays within ' + MS_PER_OP + ' ms per operation', perOp < MS_PER_OP, burst);

  /* A history page arrives together: one update */
  t.reset();
  const s2 = t.state();
  start = Date.now();
  const oldest = s2.groups.busy3.messages[0].ts / 1000;
  for (let k = 0; k < 50; k++) t.group('i', 'busy3', msgFrame('m3x' + (k % AUTHORS), 'hist' + k, oldest - (k + 1) * 30, 'Earlier ' + k));
  await show(t);
  perOp = (Date.now() - start) / 50;
  await wait(50);
  const s3 = t.state(), page3 = s3.groups.busy3.messages;
  const history = { roots: t.count('Root'), rows: t.count('MessageRow'), length: page3.length, sorted: page3.every((m, i) => !i || page3[i - 1].ts <= m.ts), shown: s3.groups.busy0 === s2.groups.busy0, users: s3.users === s2.users, perOp };
  step('a history page applies in one update without touching the shown group', history.roots === 1 && history.rows === 0 && history.length === 350 && history.sorted && history.shown && history.users, history);
  step('a history page stays within ' + MS_PER_HISTORY_OP + ' ms per operation', perOp < MS_PER_HISTORY_OP, history);

  /* Presence: no message row renders again */
  t.reset();
  const s4 = t.state();
  for (let k = 1; k <= 20; k++) { t.private('wloffline', ['m0x' + k, String(Math.floor(Date.now() / 1000) - 60)]); await nextTask(); }
  t.paint(); await wait(50);
  const s5 = t.state();
  const presence = { roots: t.count('Root'), rows: t.count('MessageRow'), members: t.count('MemberRow'), offline: s5.users.m0x1.status, groups: s5.groups === s4.groups };
  step('a presence burst re-renders neither message rows nor the other members', presence.roots === 1 && presence.rows === 0 && presence.members <= 20 && presence.offline === 'offline' && presence.groups, presence);

  /* Members nothing refers to any more are dropped */
  const keep = Array.from({ length: 100 }, (_, k) => 'S' + k + ':1700:U' + k + ':m3x' + k + ':None').join(';');
  t.group('g_participants', 'busy3', [keep]);
  t.paint(); await wait(50);
  const prune = t.intervals.filter(x => x.running && x.ms === PRUNE_EVERY);
  prune.forEach(x => x.fn());
  t.paint(); await wait(50);
  const s6 = t.state(), refs = referenced(s6), names = Object.keys(s6.users);
  const users = {
    before: Object.keys(s5.users).length, after: names.length, timers: prune.length,
    unreferenced: names.filter(n => !refs.has(n)).slice(0, 5), lost: ['m3x5', 'm3x110', 'f3', 'c4', ME].filter(n => !s6.users[n])
  };
  step('members that nothing refers to any more leave the users map, the others stay', users.timers === 1 && !users.unreferenced.length && !users.lost.length && users.after <= users.before - STALE, users);

  /* Conversation rows: a presence change renders only its row */
  t.d.querySelectorAll('.tc-nav').forEach(el => { if (el.textContent.trim().startsWith('Private messages')) el.click(); });
  await wait(50); t.paint(); await wait(50);
  const chats = t.d.querySelectorAll('.convs .conv').length;
  t.reset();
  t.private('wlonline', ['c3']);
  t.paint(); await wait(50);
  step('a presence change renders only the row of its conversation', chats === CHATS && t.count('ChatRow') <= 1 && t.count('Root') === 1, { chats, rows: t.count('ChatRow'), roots: t.count('Root') });

  console.log(log.join('\n'));
  console.log('ERRORS:', errors.length ? '\n' + [...new Set(errors)].slice(0, 15).join('\n---\n') : 'none');
  process.exit(0);
})().catch(e => { console.log(log.join('\n')); console.log('CRASH', e.stack); console.log('ERRORS:', [...new Set(errors)].slice(0, 10).join('\n---\n')); process.exit(1); });
