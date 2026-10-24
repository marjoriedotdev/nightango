/* ---------- MP : conversations, non-lus et historique privé ---------- */

/**
 * Archive des MP de Torch, en live : Torch y écrit lui-même chaque MP, le pont la marque lue et y compte les non-lus.
 * @returns {{record: Function, markRead: function(string): Promise, unread: function(string): Promise<number>}} Archive.
 */
function torchPmArchive() {
  return {
    record: function () {},
    markRead: function (target) { return liveBridge.markPmRead(target); },
    unread: function (target) { return liveBridge.pmUnread(target); }
  };
}
/**
 * Archive des MP en mémoire, avec le drapeau non lu de chaque entrée : celle du prototype, et celle du live quand la base de Torch manque.
 * @param {Object=} seed Non-lus de départ par correspondant.
 * @returns {{record: Function, markRead: function(string): Promise, unread: function(string): Promise<number>}} Archive.
 */
function memoryPmArchive(seed) {
  var entries = [];
  Object.keys(seed || {}).forEach(function (t) { for (var i = 0; i < seed[t]; i++) entries.push({ target: t, unread: true, edit: false }); });
  return {
    record: function (target, m, unread) { entries.push({ target: target, unread: !!unread, edit: !!m.editId }); },
    markRead: function (target) { entries.forEach(function (e) { if (e.target === target) e.unread = false; }); return Promise.resolve(); },
    unread: function (target) { return Promise.resolve(entries.filter(function (e) { return e.target === target && e.unread && !e.edit; }).length); }
  };
}

/**
 * Permet de recopier dans l'état les non-lus que l'archive compte, seule source de ces compteurs.
 * @param {Object} archive Archive des MP.
 * @param {Function} update Mise à jour de l'état.
 * @param {Array<string>} names Correspondants à relire.
 * @returns {Promise} Fin de la recopie.
 */
function syncPmUnread(archive, update, names) {
  return Promise.all(names.map(function (n) { return archive.unread(n); })).then(function (counts) {
    update(function (d) { names.forEach(function (n, i) { if (d.dms[n]) d.dms[n].unread = counts[i]; }); });
  }, warn);
}
/**
 * Permet de marquer lue une conversation dans l'archive, puis d'en recopier le compteur.
 * @param {Object} archive Archive des MP.
 * @param {Function} update Mise à jour de l'état.
 * @param {string} name Correspondant.
 * @returns {Promise} Fin de la recopie.
 */
function readPm(archive, update, name) {
  return archive.markRead(name).then(function () { return syncPmUnread(archive, update, [name]); }, warn);
}

/**
 * Permet de trouver ou de créer la conversation d'un correspondant.
 * @param {Object} d État en cours de modification.
 * @param {string} name Correspondant.
 * @param {Object=} extra Champs d'une conversation créée.
 */
function pmConversation(d, name, extra) {
  return d.dms[name] || (d.dms[name] = Object.assign({ messages: [], unread: 0, lastReadTs: Date.now() }, extra));
}
/**
 * Permet de construire le message affiché d'une entrée reçue ou archivée.
 * @param {Object} x Entrée lue par le pont, ou message du prototype.
 */
function pmMessage(x) {
  // Modification sans original chargé : elle prend la clé de l'original, que visent l'archive et les modifications suivantes.
  var m = { id: uid(), from: x.from, key: x.editId || x.key, text: x.text, parts: x.parts, embeds: x.embeds, ts: x.ts, archiveTs: x.archiveTs };
  if (x.editId) m.edited = true;
  return m;
}
function applyEdit(o, m) { o.text = m.text; o.parts = m.parts; o.embeds = m.embeds; o.edited = true; }
/**
 * Permet de recevoir un MP dans sa conversation : une modification s'applique à son original, un nouveau message rouvre la conversation.
 * @param {Object} d État en cours de modification.
 * @param {Object} x Message reçu (op pm du pont, ou message du prototype).
 * @returns {boolean} Vrai si le message était une modification appliquée.
 */
function receivePm(d, x) {
  var c = pmConversation(d, x.from, { lastReadTs: 0 }), o = pmEditTarget(c, x);
  if (o) { applyEdit(o, x); return true; }
  c.closed = false;
  c.messages.push(pmMessage(x));
  c.messages.sort(function (a, b) { return a.ts - b.ts; });
  return false;
}
/**
 * Permet de fusionner des entrées de l'historique privé dans une conversation, sans doublon avec les messages affichés.
 * @param {Object} c Conversation dans l'état en cours de modification.
 * @param {Array} list Entrées lues par le pont, de la plus ancienne à la plus récente.
 * @param {function(Object)} onEntry Reçoit chaque entrée, pour en garder le style de l'auteur.
 */
function mergePmHistory(c, list, onEntry) {
  // L'horodatage archivé par Torch diffère du nôtre : même auteur et même contenu à deux minutes près = même message. Chaque message déjà affiché ne couvre qu'une entrée.
  var shown = c.messages.slice();
  list.forEach(function (x) {
    onEntry(x);
    var o = pmEditTarget(c, x);
    if (o) { applyEdit(o, x); return; }
    var m = pmMessage(x), i = pmShownIndex(shown, m);
    if (i >= 0) { shown[i].archiveTs = m.archiveTs; shown.splice(i, 1); return; }
    c.messages.push(m);
  });
  c.messages.sort(function (a, b) { return a.ts - b.ts; });
}
