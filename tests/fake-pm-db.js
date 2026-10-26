/* Fake BetterChatango private history database (IndexedDB), shared by the live_ui and pm suites. */
// IndexedDB key order: a string sorts after any number, an array compares element by element.
function keyCmp(a, b) {
  if (Array.isArray(a)) { for (let i = 0; i < Math.min(a.length, b.length); i++) { const c = keyCmp(a[i], b[i]); if (c) return c; } return a.length - b.length; }
  if (typeof a !== typeof b) return typeof a === 'string' ? 1 : -1;
  return a < b ? -1 : a > b ? 1 : 0;
}
// Key ranges the bridge builds, modelled on IDBKeyRange.
const keyRange = { bound: (lower, upper, lowerOpen, upperOpen) => ({ lower, upper, lowerOpen: !!lowerOpen, upperOpen: !!upperOpen }), lowerBound: (lower, open) => ({ lower, lowerOpen: !!open }) };
/**
 * Creates the transaction factory of a fake private history database.
 * @param {Array} records Records { target, ts, data, unread }, modified in place like the database.
 * @param {Function=} onWrite Called when a readwrite transaction completes.
 */
function fakePmDb(records, onWrite) {
  // Like IndexedDB, a transaction sees the records present when it is created: an archive write created after it escapes it.
  return function pmTransaction(stores, mode) {
    const seen = records.slice(), tx = {};
    // Like IndexedDB, a transaction without any request also completes.
    let requests = 0;
    setTimeout(() => { if (!requests && tx.oncomplete) tx.oncomplete(); }, 0);
    // Like IndexedDB, the transaction completes when no request is pending, including those opened by a callback.
    let pending = 0;
    const done = () => {
      if (--pending) return;
      Promise.resolve().then(() => { if (pending) return; if (mode === 'readwrite' && onWrite) onWrite(); if (tx.oncomplete) tx.oncomplete(); });
    };
    const drop = rec => [records, seen].forEach(l => { const i = l.indexOf(rec); if (i >= 0) l.splice(i, 1); });
    const request = run => { const req = {}; pending++; requests++; setTimeout(() => { run(req); done(); }, 0); return req; };
    // Cursor in microtasks after a first task: a slow walk would make short waits fail under load.
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
    // Like IndexedDB, add rejects an existing key: without preventDefault on the error, the whole transaction aborts.
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
