// Conversations MP : non-lus lus dans l'archive (base de BetterChatango ou mémoire) et fusion de l'historique privé.
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
 * Permet de charger le pont et le module MP sur un faux client BetterChatango dont la base d'historique est records, ou absente.
 * @param {?Array} records Enregistrements de la base, null pour un navigateur sans base.
 */
function load(records) {
  const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', url: 'https://st.chatango.com/' });
  const w = dom.window;
  // core s'évalue avec React et les composants Torch, comme dans l'application.
  w.eval(fs.readFileSync('node_modules/react/umd/react.development.js', 'utf8'));
  w.eval(fs.readFileSync('node_modules/react-dom/umd/react-dom.development.js', 'utf8'));
  w.eval(fs.readFileSync(ROOT + '/torchds/project/components/bundle.js', 'utf8'));
  w.__TORCH_LIVE__ = true;
  w.IDBKeyRange = keyRange;
  w.console.warn = (...a) => errors.push(a.join(' '));
  // Migration des anciens non-lus déjà faite : seuls comptent les enregistrements du test.
  w.localStorage.setItem('torch-skin:' + ME, JSON.stringify({ pmReadMigrated: true }));
  const transaction = records && fakePmDb(records);
  w.indexedDB = { open() { const req = {}; setTimeout(() => req.onerror(), 0); return req; } };
  w.eval(`
    window.client = { user: { name: '${ME}' }, groups: {}, event: { group: {}, private: {} }, database: { pm: ${records ? 'true' : 'false'} },
      on: function () {}, emit: function () {}, connect: function () {} };
    window.__betterChatangoRefs = { client: window.client, chatango: {} };
  `);
  if (records) w.client.database.pm = { transaction };
  w.eval(code + '; window.mod = { liveBridge: liveBridge, betterChatangoPmArchive: betterChatangoPmArchive, memoryPmArchive: memoryPmArchive, syncPmUnread: syncPmUnread, readPm: readPm, mergePmHistory: mergePmHistory, pmRecordEntry: pmRecordEntry };');
  const d = { dms: {} };
  return { w, m: w.mod, d, update: fn => fn(d) };
}

(async () => {
  /* Base de BetterChatango : les MP reçus non lus comptent, ni leurs modifications, ni les entrées lues, ni l'autre conversation */
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

  /* Archivage par BetterChatango juste après l'op pm : la lecture, créée après la pile en cours, le voit */
  const pending = t.m.syncPmUnread(betterChatango, t.update, ['ivan']);
  records.push(record('ivan', received('ivan', '1700005040.5', '<n000/>Just archived'), 1));
  await pending;
  step('message archived by BetterChatango after the pm op is counted', t.d.dms.ivan.unread === 2, t.d.dms.ivan);

  /* Lecture d'une conversation : ses entrées passent lues dans la base, le compteur suit, l'autre conversation garde les siens */
  await t.m.readPm(betterChatango, t.update, 'gus');
  const gusUnread = records.filter(r => r.target === 'gus' && r.unread).length;
  step('reading a conversation marks its history read and clears its count', gusUnread === 0 && t.d.dms.gus.unread === 0 && t.d.dms.ivan.unread === 2, { gusUnread, dms: t.d.dms });

  /* Navigateur sans base : le pont le signale, rien ne compte */
  t = load(null);
  t.d.dms = { gus: { messages: [], unread: 3 } };
  const saved = await t.m.liveBridge.pmArchived();
  await t.m.syncPmUnread(t.m.betterChatangoPmArchive(), t.update, ['gus']);
  step('browser without BetterChatango history reported', saved === false && t.d.dms.gus.unread === 0, { saved, unread: t.d.dms.gus.unread });

  /* Archive en mémoire : non-lus de départ, une modification ne compte pas, une lecture ne touche que sa conversation */
  const memory = t.m.memoryPmArchive({ kim: 2 });
  memory.record('kim', { editId: 'x' }, true);
  memory.record('lou', {}, true);
  memory.record('lou', {}, false);
  t.d.dms = { kim: { messages: [], unread: 0 }, lou: { messages: [], unread: 0 } };
  await t.m.syncPmUnread(memory, t.update, ['kim', 'lou']);
  const before = { kim: t.d.dms.kim.unread, lou: t.d.dms.lou.unread };
  await t.m.readPm(memory, t.update, 'kim');
  step('memory archive counts like BetterChatango history', before.kim === 2 && before.lou === 1 && t.d.dms.kim.unread === 0 && t.d.dms.lou.unread === 1, { before, after: t.d.dms });

  /* Fusion : l'entrée d'un MP déjà affiché ne le double pas, sa modification s'applique à l'original */
  const entries = [records[0], records[1]].map(r => t.m.pmRecordEntry(r));
  const shown = Object.assign({}, entries[0], { id: 'live1', archiveTs: undefined, ts: entries[0].ts + 30000 });
  const c = { messages: [shown] }, authors = [];
  t.m.mergePmHistory(c, entries, x => authors.push(x.from));
  step('history merged once into a shown message, edit applied to its original',
    c.messages.length === 1 && c.messages[0].id === 'live1' && c.messages[0].archiveTs === records[0].ts && c.messages[0].text === 'First, fixed' && c.messages[0].edited && authors.length === 2,
    c.messages);

  console.log(log.join('\n'));
  console.log('ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
  process.exit(0);
})().catch(e => { console.log(log.join('\n')); console.log('CRASH', e.stack); console.log('ERRORS:', errors.join('\n')); process.exit(1); });
