/* Fausse base d'historique privé de Torch (IndexedDB), partagée par les suites live_ui et pm. */
// Ordre des clés IndexedDB : une chaîne passe après tout nombre, un tableau se compare élément par élément.
function keyCmp(a, b) {
  if (Array.isArray(a)) { for (let i = 0; i < Math.min(a.length, b.length); i++) { const c = keyCmp(a[i], b[i]); if (c) return c; } return a.length - b.length; }
  if (typeof a !== typeof b) return typeof a === 'string' ? 1 : -1;
  return a < b ? -1 : a > b ? 1 : 0;
}
// Plages de clés que le pont construit, sur le modèle d'IDBKeyRange.
const keyRange = { bound: (lower, upper, lowerOpen, upperOpen) => ({ lower, upper, lowerOpen: !!lowerOpen, upperOpen: !!upperOpen }), lowerBound: (lower, open) => ({ lower, lowerOpen: !!open }) };
/**
 * Permet de créer la fabrique de transactions d'une fausse base d'historique privé.
 * @param {Array} records Enregistrements { target, ts, data, unread }, modifiés en place comme la base.
 * @param {Function=} onWrite Appelée quand une transaction readwrite se termine.
 */
function fakePmDb(records, onWrite) {
  // Comme IndexedDB, une transaction voit les enregistrements présents à sa création : un archivage créé après elle lui échappe.
  return function pmTransaction(stores, mode) {
    const seen = records.slice(), tx = {};
    // Comme IndexedDB, une transaction sans aucune requête se termine aussi.
    let requests = 0;
    setTimeout(() => { if (!requests && tx.oncomplete) tx.oncomplete(); }, 0);
    // Comme IndexedDB, la transaction se termine quand plus aucune requête n'attend, y compris celles ouvertes par un rappel.
    let pending = 0;
    const done = () => {
      if (--pending) return;
      Promise.resolve().then(() => { if (pending) return; if (mode === 'readwrite' && onWrite) onWrite(); if (tx.oncomplete) tx.oncomplete(); });
    };
    const drop = rec => [records, seen].forEach(l => { const i = l.indexOf(rec); if (i >= 0) l.splice(i, 1); });
    const request = run => { const req = {}; pending++; requests++; setTimeout(() => { run(req); done(); }, 0); return req; };
    // Curseur en microtâches après une première tâche : un parcours lent ferait échouer les attentes courtes sous charge.
    const cursor = list => {
      const req = {}; let i = 0; pending++; requests++;
      const read = () => {
        const rec = list[i];
        req.onsuccess({ target: { result: rec ? { value: Object.assign({}, rec), update(v) { Object.assign(rec, v); }, delete() { drop(rec); }, continue() { i++; Promise.resolve().then(read); } } : null } });
        if (!rec) done();
      };
      setTimeout(read, 0); return req;
    };
    const inRange = range => r => {
      if (!range) return true;
      const lo = keyCmp([r.target, r.ts], range.lower), hi = keyCmp([r.target, r.ts], range.upper);
      return (range.lowerOpen ? lo > 0 : lo >= 0) && (range.upperOpen ? hi < 0 : hi <= 0);
    };
    const byIndex = (name, range) => name === 'target_ts_idx' ? seen.filter(inRange(range)).sort((a, b) => keyCmp([a.target, a.ts], [b.target, b.ts])) : [];
    // Comme IndexedDB, add refuse une clé présente : sans preventDefault sur l'échec, toute la transaction est annulée.
    const adds = [];
    const commit = () => {
      const done = [];
      for (const [rec, req] of adds) {
        if (records.concat(done).some(r => r.ts === rec.ts)) {
          let kept = false;
          req.error = { name: 'ConstraintError' };
          if (req.onerror) req.onerror({ target: req, preventDefault() { kept = true; } });
          if (!kept) { tx.error = req.error; if (tx.onabort) tx.onabort(); return; }
        } else { done.push(Object.assign({}, rec)); if (req.onsuccess) req.onsuccess({ target: req }); }
      }
      records.push(...done);
      if (tx.oncomplete) tx.oncomplete();
    };
    tx.objectStore = () => ({
      get: ts => request(req => { const rec = seen.find(r => r.ts === ts); req.onsuccess({ target: { result: rec && Object.assign({}, rec) } }); }),
      delete: ts => request(() => drop(seen.find(r => r.ts === ts))),
      openCursor: () => cursor(seen),
      index: name => ({ openCursor: (range, dir) => { const list = byIndex(name, range); return cursor(dir === 'prev' ? list.reverse() : list); } }),
      add(rec) { const req = {}; requests++; if (!adds.length) setTimeout(commit, 0); adds.push([rec, req]); return req; }
    });
    return tx;
  }
}

module.exports = { keyCmp, keyRange, fakePmDb };
