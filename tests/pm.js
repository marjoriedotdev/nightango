// PM conversations: unreads read from the archive (BetterChatango database or memory), private history merge and import.
const { JSDOM } = require('jsdom');
const { concatSources, layerSources } = require('../scripts/build.mjs');
const { keyRange, fakePmDb } = require('./fake-pm-db.js');

const ME = 'marjorie';
const fs = require('fs');
const ROOT = process.argv[2];
const code = concatSources(ROOT, layerSources('core').concat(layerSources('bridge'), ['app/pm.js']));
const record = (target, data, unread) => ({ target, ts: parseFloat(data.split(':')[4]), data, unread });
const received = (from, ts, body) => 'msg:' + from + ':' + ME + ':unknown:' + ts + ':0:' + body;

const log = [], errors = [];
function step(name, ok, detail) { log.push((ok ? 'ok   ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' ' + JSON.stringify(detail))); }

/**
 * Loads the bridge and the PM module on a fake BetterChatango client whose history database is records or absent.
 * @param {?Array} records Database records, null for a browser without a database.
 * @param {{storageFull: boolean, onWrite: Function}=} opts storageFull: local storage refuses every write and the unread migration has not run. onWrite: called when a database write completes.
 */
function load(records, opts = {}) {
  const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', url: 'https://st.chatango.com/' });
  const w = dom.window;
  // core evaluates with React and the Torch components, as in the app.
  w.eval(fs.readFileSync('node_modules/react/umd/react.development.js', 'utf8'));
  w.eval(fs.readFileSync('node_modules/react-dom/umd/react-dom.development.js', 'utf8'));
  w.eval(fs.readFileSync(ROOT + '/torchds/project/components/bundle.js', 'utf8'));
  w.__TORCH_LIVE__ = true;
  const journal = [];
  w.__TORCH_JOURNAL__ = { add: (k, m) => journal.push(String(m)) };
  w.IDBKeyRange = keyRange;
  w.console.warn = (...a) => errors.push(a.join(' '));
  // Like a full st.chatango.com origin: every write throws.
  if (opts.storageFull) w.Storage.prototype.setItem = () => { throw new w.DOMException('The quota has been exceeded.', 'QuotaExceededError'); };
  // Migration of old unreads already done: only the test records count.
  else w.localStorage.setItem('torch-skin:' + ME, JSON.stringify({ pmReadMigrated: true }));
  const transaction = records && fakePmDb(records, opts.onWrite);
  w.indexedDB = { open() { const req = {}; setTimeout(() => req.onerror(), 0); return req; } };
  w.eval(`
    window.client = { user: { name: '${ME}' }, groups: {}, event: { group: {}, private: {} }, database: { pm: ${records ? 'true' : 'false'} },
      on: function () {}, emit: function () {}, connect: function () {} };
    window.__betterChatangoRefs = { client: window.client, chatango: {} };
  `);
  if (records) w.client.database.pm = { transaction };
  w.eval(code + '; window.mod = { liveBridge: liveBridge, betterChatangoPmArchive: betterChatangoPmArchive, memoryPmArchive: memoryPmArchive, syncPmUnread: syncPmUnread, readPm: readPm, mergePmHistory: mergePmHistory, pmRecordEntry: pmRecordEntry };');
  const d = { dms: {} };
  return { w, m: w.mod, d, journal, update: fn => fn(d) };
}

(async () => {
  /* BetterChatango database: unread received PMs count, not their edits, not read entries, not the other conversation */
  const records = [
    record('gus', received('gus', '1700005000.5', '<n000/><iorig9876/>First'), 1),
    record('gus', received('gus', '1700005010.5', '<n000/><iedit4321/><m v="1"><g x12s000="0"><eorig9876/>First, fixed</g></m>'), 1),
    record('gus', received('gus', '1700005020.5', '<n000/>Second'), 1),
    record('gus', received('gus', '1700004000.5', '<n000/>Already read'), 0),
    record('ivan', received('ivan', '1700005030.5', '<n000/>Hello'), 1)
  ];
  let t = load(records);
  t.d.dms = { gus: { messages: [], unread: 0 }, ivan: { messages: [], unread: 0 } };
  const betterChatango = t.m.betterChatangoPmArchive();
  await t.m.syncPmUnread(betterChatango, t.update, ['gus', 'ivan']);
  step('unread counted in BetterChatango history without edits or read entries', t.d.dms.gus.unread === 2 && t.d.dms.ivan.unread === 1, t.d.dms);

  /* Archive write by BetterChatango right after the pm op: the read, created after the current stack, sees it */
  const pending = t.m.syncPmUnread(betterChatango, t.update, ['ivan']);
  records.push(record('ivan', received('ivan', '1700005040.5', '<n000/>Just archived'), 1));
  await pending;
  step('message archived by BetterChatango after the pm op is counted', t.d.dms.ivan.unread === 2, t.d.dms.ivan);

  /* Reading a conversation: its entries become read in the database, the count follows, the other conversation keeps its own */
  await t.m.readPm(betterChatango, t.update, 'gus');
  const gusUnread = records.filter(r => r.target === 'gus' && r.unread).length;
  step('reading a conversation marks its history read and clears its count', gusUnread === 0 && t.d.dms.gus.unread === 0 && t.d.dms.ivan.unread === 2, { gusUnread, dms: t.d.dms });

  /* Browser without a database: the bridge reports it, nothing counts */
  t = load(null);
  t.d.dms = { gus: { messages: [], unread: 3 } };
  const saved = await t.m.liveBridge.pmArchived();
  await t.m.syncPmUnread(t.m.betterChatangoPmArchive(), t.update, ['gus']);
  step('browser without BetterChatango history reported', saved === false && t.d.dms.gus.unread === 0, { saved, unread: t.d.dms.gus.unread });

  /* In-memory archive: initial unreads, an edit does not count, a read touches only its own conversation */
  const memory = t.m.memoryPmArchive({ kim: 2 });
  memory.record('kim', { editId: 'x' }, true);
  memory.record('lou', {}, true);
  memory.record('lou', {}, false);
  t.d.dms = { kim: { messages: [], unread: 0 }, lou: { messages: [], unread: 0 } };
  await t.m.syncPmUnread(memory, t.update, ['kim', 'lou']);
  const before = { kim: t.d.dms.kim.unread, lou: t.d.dms.lou.unread };
  await t.m.readPm(memory, t.update, 'kim');
  step('memory archive counts like BetterChatango history', before.kim === 2 && before.lou === 1 && t.d.dms.kim.unread === 0 && t.d.dms.lou.unread === 1, { before, after: t.d.dms });

  /* Merge: the entry of an already shown PM does not duplicate it, its edit applies to the original */
  const entries = [records[0], records[1]].map(r => t.m.pmRecordEntry(r));
  const shown = Object.assign({}, entries[0], { id: 'live1', archiveTs: undefined, ts: entries[0].ts + 30000 });
  const c = { messages: [shown] }, authors = [];
  t.m.mergePmHistory(c, entries, x => authors.push(x.from));
  step('history merged once into a shown message, edit applied to its original',
    c.messages.length === 1 && c.messages[0].id === 'live1' && c.messages[0].archiveTs === records[0].ts && c.messages[0].text === 'First, fixed' && c.messages[0].edited && authors.length === 2,
    c.messages);

  /* Local storage refusing the migration flag: the migration still runs once per page, a PM received afterwards stays unread */
  const fullRecords = [record('gus', received('gus', '1700006000.5', '<n000/>Before Nightango'), 1)];
  let fullWrites = 0;
  t = load(fullRecords, { storageFull: true, onWrite: () => fullWrites++ });
  await t.m.liveBridge.pmArchived();
  const oldRead = !fullRecords[0].unread;
  fullRecords.push(record('gus', received('gus', '1700006100.5', '<n000/>After sign-in'), 1));
  t.d.dms = { gus: { messages: [], unread: 0 } };
  await t.m.liveBridge.pmHistory(100);
  await t.m.syncPmUnread(t.m.betterChatangoPmArchive(), t.update, ['gus']);
  const migrationNotes = t.journal.filter(x => /unread migration/i.test(x));
  step('unread migration runs once per page and is journaled when local storage refuses its flag',
    oldRead && fullWrites === 1 && fullRecords[1].unread === 1 && t.d.dms.gus.unread === 1 && migrationNotes.length === 1,
    { oldRead, fullWrites, records: fullRecords, unread: t.d.dms.gus.unread, journal: t.journal });

  /* Import of a correspondent name with capitals: the conversation reads older pages and removes an edited PM like any other */
  const mixedRecords = [];
  t = load(mixedRecords);
  const fromIvan = (ts, body) => ({ target: 'Ivan', ts: parseFloat(ts), data: 'msg:Ivan:' + ME + ':unknown:' + ts + ':0:' + body, unread: 0 });
  const imported = await t.m.liveBridge.importPm([
    fromIvan('1700007000.5', '<n000/>Earlier'),
    fromIvan('1700007010.5', '<n000/><iorig1111/>Original'),
    fromIvan('1700007020.5', '<n000/><iedit2222/><m v="1"><g x12s000="0"><eorig1111/>Original, fixed</g></m>')
  ]);
  const ivan = (await t.m.liveBridge.pmHistory(100)).ivan || { list: [] };
  const older = await t.m.liveBridge.pmOlder('ivan', 1700007010.5, 50);
  const original = ivan.list.find(x => x.text === 'Original');
  const removed = !!original && await t.m.liveBridge.removePm('ivan', original);
  const left = mixedRecords.map(r => r.ts);
  step('imported mixed-case conversation loads older pages and removes an edit with its original',
    imported.added === 3 && ivan.list.length === 3 && JSON.stringify(older.list.map(x => x.text)) === '["Earlier"]' && removed && JSON.stringify(left) === '[1700007000.5]',
    { imported, listed: ivan.list.length, older: older.list.map(x => x.text), removed, left });

  /* Reconnection on a large private history: only the kept records are parsed, the last 100 of each correspondent */
  const big = [];
  const archive = (target, n, from) => { for (let i = 0; i < n; i++) big.push(record(target, received(target, String(from + i) + '.5', '<n000/>' + target + ' ' + i), 0)); };
  const texts = (target, from, to) => Array.from({ length: to - from }, (_, i) => target + ' ' + (from + i));
  archive('ann', 1000, 1700100000);
  archive('bob', 30, 1700200000);
  // Archived under a name with capitals before imports lowercased it: one conversation with the lowercase records.
  archive('Zoe', 70, 1700300000);
  archive('zoe', 70, 1700300070);
  t = load(big);
  const parse = t.w.parseContent;
  let parsed = 0;
  t.w.parseContent = function () { parsed++; return parse.apply(this, arguments); };
  const hist = await t.m.liveBridge.pmHistory(100);
  const listed = target => hist[target] ? hist[target].list.map(x => x.text) : null;
  step('reconnection on a large private history parses only the last 100 records of each correspondent',
    parsed === 230 && JSON.stringify(listed('ann')) === JSON.stringify(texts('ann', 900, 1000)) && hist.ann.more
      && JSON.stringify(listed('bob')) === JSON.stringify(texts('bob', 0, 30)) && !hist.bob.more
      && JSON.stringify(listed('zoe')) === JSON.stringify(texts('Zoe', 40, 70).concat(texts('zoe', 0, 70))) && hist.zoe.more && !hist.Zoe,
    { parsed, targets: Object.keys(hist), ann: (listed('ann') || []).slice(0, 2), bob: (listed('bob') || []).length, zoe: (listed('zoe') || []).slice(0, 2) });

  console.log(log.join('\n'));
  console.log('ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
  process.exit(0);
})().catch(e => { console.log(log.join('\n')); console.log('CRASH', e.stack); console.log('ERRORS:', errors.join('\n')); process.exit(1); });
