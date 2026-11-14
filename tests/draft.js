// State drafts: copy on write, sharing, drafts held at a second place and writes after the update, on src/core/draft.js.
const fs = require('fs'), vm = require('vm');
const ctx = {};
vm.runInNewContext(fs.readFileSync(process.argv[2] + '/src/core/draft.js', 'utf8'), ctx);
const check = (c, msg, detail) => console.log((c ? 'ok  ' : 'FAIL') + ' ' + msg + (c || detail === undefined ? '' : ' ' + JSON.stringify(detail)));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/**
 * Applies a change to a draft of a state and returns the next state.
 * @param {object} base State the draft starts from.
 * @param {Function} fn Change applied to the draft.
 */
function next(base, fn) { const d = ctx.openDraft(base); fn(d.root); return d.finish(); }
/**
 * Tells whether a draft proxy is left anywhere in a value.
 * @param {*} v Value to walk.
 */
function holdsDraft(v) { return v !== null && typeof v === 'object' && (!!v[ctx.DRAFT] || Object.keys(v).some((k) => holdsDraft(v[k]))); }
const world = () => ({ users: { ana: { status: 'online', style: { bold: true } }, bob: { status: 'offline', style: {} } }, groups: { a: { messages: [{ id: 1, ts: 10 }, { id: 2, ts: 20 }], unread: 0 }, b: { messages: [], unread: 3 } }, route: { view: 'group', id: 'a' } });

/* Sharing: only the objects a change reaches are copied, from the changed one up to the root */
let base = world(), frozen = JSON.stringify(base);
let out = next(base, (d) => { d.groups.a.unread = 5; });
check(out !== base && out.groups !== base.groups && out.groups.a !== base.groups.a && out.groups.a.unread === 5, 'a change copies its object and the ones above it');
check(out.users === base.users && out.groups.b === base.groups.b && out.route === base.route && out.groups.a.messages === base.groups.a.messages, 'every other object is shared with the previous state');
check(JSON.stringify(base) === frozen, 'the previous state is never changed');
check(next(base, (d) => { d.groups.a.unread = 0; d.route.view = 'group'; void d.users.ana.style.bold; }) === base, 'reads and writes of the same value keep the state itself');
out = next(base, (d) => { delete d.users.bob; });
check(!('bob' in out.users) && out.users.ana === base.users.ana && 'bob' in base.users, 'a deleted key leaves the copy only');

/* Arrays: moves run on the copy, a sort that changes nothing keeps the array */
out = next(base, (d) => { d.groups.a.messages.push({ id: 3, ts: 30 }); });
check(out.groups.a.messages.length === 3 && base.groups.a.messages.length === 2 && out.groups.a.messages[0] === base.groups.a.messages[0], 'push copies the array and shares its elements');
out = next(base, (d) => { d.groups.a.messages.sort((x, y) => x.ts - y.ts); });
check(out === base, 'sorting a sorted array keeps the state itself');
out = next(base, (d) => { d.groups.a.messages[1].ts = 5; d.groups.a.messages.sort((x, y) => x.ts - y.ts); });
check(same(out.groups.a.messages, [{ id: 2, ts: 5 }, { id: 1, ts: 10 }]) && out.groups.a.messages[1] === base.groups.a.messages[0] && !holdsDraft(out), 'a sort moves a changed element with its change and leaves no draft', out.groups.a.messages);
out = next(base, (d) => { d.groups.a.messages[1].ts = 99; d.groups.a.messages.splice(0, 1); });
check(same(out.groups.a.messages, [{ id: 2, ts: 99 }]) && !holdsDraft(out), 'splice keeps the change of an element read before it', out.groups.a.messages);

/* A draft held at a second place, or inside an object given during the draft, settles to the same object */
out = next(base, (d) => { d.pinned = d.groups.a; d.groups.a.unread = 7; });
check(out.pinned === out.groups.a && out.pinned.unread === 7 && !holdsDraft(out), 'a draft stored under a second key settles to the object of the first');
out = next(base, (d) => { d.mentionLog = [{ from: d.users.ana }]; d.users.ana.status = 'idle'; });
check(out.mentionLog[0].from === out.users.ana && out.users.ana.status === 'idle' && !holdsDraft(out), 'a draft inside a given object settles too');

/* plainOf: a scan reads the changes made so far without a draft per element */
let seen = null;
next(base, (d) => { d.groups.a.messages[0].ts = 11; seen = ctx.plainOf(d.groups.a.messages).map((m) => m.ts); });
check(same(seen, [11, 20]) && ctx.plainOf(base.groups.a) === base.groups.a, 'plainOf sees a child changed through the draft, and returns a plain value as is', seen);

/* After the update: a kept draft cannot be written, and the state it built stays as built */
let kept = null;
out = next(base, (d) => { kept = d.groups.a; d.groups.a.unread = 1; });
let threw = null;
try { kept.unread = 2; } catch (e) { threw = e.message; }
check(threw === 'State changed outside update' && out.groups.a.unread === 1, 'a draft written after its update throws and changes nothing', threw);
const d2 = ctx.openDraft(base);
try { d2.root.groups.a.unread = 9; throw new Error('handler failed'); } catch (e) { d2.finish(); }
check(JSON.stringify(base) === frozen, 'an update that throws leaves the previous state as it was');
