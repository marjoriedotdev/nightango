import { ROLE_LONG, mkSettings } from '../core/roles.js';
import { readThrough, shownName, trimThread, userOf } from '../core/selectors.js';
import { esc, lower, pick, uid } from '../core/util.js';
import { pmRecordEntry, screenPmRecords } from '../bridge/live-parse.js';
import { toggleUserText } from './actions.js';
import { dropMentions, logMention } from './inbox.js';
import { applyGroupEdit } from './live-state.js';
import { addSentPm, memoryPmArchive, pmMessage } from './pm.js';
import { dmReply, seedWorld } from './sample-data.js';
// -- Prototype actions --------------------------------------------------------

/**
 * Actions of the hosted prototype that live replaces with its own: they change the sample world in the state, and its members answer.
 * @param {{store: Object, toast: Function, setNavOpen: Function, inbox: Object, drafts: Object, dropDmMessage: Function, actions: Object}} k
 *   Application state with its ref and update, notifications, navigation drawer, inbox (useInbox), composer drafts, removal of a PM from its log, and every action.
 * @returns {Object} Actions to add to the shared ones.
 */
export function prototypeActions(k) {
  var stateRef = k.store.stateRef, update = k.store.update, toast = k.toast, setNavOpen = k.setNavOpen, drafts = k.drafts, dropDmMessage = k.dropDmMessage, actions = k.actions;
  var pmArchive = k.inbox.pmArchive, nav = k.inbox.nav, receiveGroup = k.inbox.receiveGroup, receiveDm = k.inbox.receiveDm;
  /**
   * Creates the sample world of the prototype with the PM archive that holds its received PMs and their unreads.
   * @param {string} me Signed-in account.
   */
  function sampleWorld(me) {
    var world = seedWorld(me), entries = [];
    Object.keys(world.dms).forEach(function (n) {
      var got = world.dms[n].messages.filter(function (m) { return m.author === n; });
      got.forEach(function (m, i) { entries.push({ target: n, author: n, unread: i >= got.length - world.dms[n].unread, edit: false }); });
    });
    pmArchive.current = memoryPmArchive(entries);
    return world;
  }
  return {
    login: function (name) { var world = sampleWorld(name); drafts.clear(); update(function (d) { seedState(d, world); d.auth = { loggedIn: true }; d.lastChat = { view: 'group', id: 'community' }; }); },
    resetDemo: function () { var world = sampleWorld(stateRef.current.me); update(function (d) { seedState(d, world); }); toast('Sample data restored.', { tone: 'success' }); },
    logout: function () { update(function (d) { d.auth = { loggedIn: false }; }); setNavOpen(false); },
    setStatus: function (st2) { update(function (d) { d.meStatus = st2; }); },
    setPmSetting: function (key, value) {
      update(function (d) { d.pmSettingSave = { key: key, value: value, failed: false }; });
      setTimeout(function () { update(function (d) { d.pmSettings[key] = value; d.pmSettingSave = null; }); }, 700);
    },
    setMessageStyle: function (style) { update(function (d) { d.ownStyle = style; }); },
    sendGroup: function (gid, text, opts) {
      var me = stateRef.current.me;
      text = (opts.quote || '') + text;
      update(function (d) { d.groups[gid].messages.push({ id: uid(), kind: 'msg', author: me, text: text, ts: Date.now(), replyTo: opts.replyTo || null, channel: opts.channel || 'none' }); d.groups[gid].lastReadTs = readThrough(d.groups[gid]); });
      var g = stateRef.current.groups[gid];
      if (gid === 'bots' && text.charAt(0) === '!') {
        var cmd = text.slice(1).split(/\s+/)[0].toLowerCase();
        var reply = cmd === 'roll' ? 'Rolled a ' + (1 + Math.floor(Math.random() * (parseInt(text.split(/\s+/)[1], 10) || 20))) + '.' : cmd === 'help' ? 'Commands: !weather, !define, !roll' : cmd === 'weather' ? 'Rennes: 14°C, light rain.' : 'Unknown command. Try !help.';
        setTimeout(function () { receiveGroup(gid, { id: uid(), kind: 'msg', author: 'rook', text: '@' + me + ' ' + reply, ts: Date.now() }); }, 900);
        return true;
      }
      var m = /@([a-z0-9_-]+)/i.exec(text);
      if (m && g && g.members.indexOf(m[1].toLowerCase()) >= 0 && m[1].toLowerCase() !== me && userOf(stateRef.current, m[1].toLowerCase()).status !== 'offline') {
        var who = m[1].toLowerCase();
        setTimeout(function () { receiveGroup(gid, { id: uid(), kind: 'msg', author: who, text: '@' + me + ' ' + pick(['On it.', 'Sure, give me a minute.', 'Thanks, checking now.', 'Good point.']), ts: Date.now() }); }, 3400);
      }
      return true;
    },
    sendDm: function (name, text, opts) {
      opts = opts || {};
      var me = stateRef.current.me, replyKey = opts.replyTo && opts.replyTo.key;
      update(function (d) { addSentPm(d, name, { author: me, key: uid(), replyId: replyKey, editId: opts.editKey, text: (opts.quote || '') + text, ts: Date.now() }); });
      var u = userOf(stateRef.current, name);
      if (!opts.editKey && u.status !== 'offline' && !u.blocked) setTimeout(function () { receiveDm(name, dmReply(name)); }, 2400 + Math.random() * 1500);
      return true;
    },
    loadProfile: function () { /* prototype: profiles already present in the sample data */ },
    loadProfiles: function () { /* same */ },
    searchPeople: function (f) {
      // Prototype: search the names of the sample members who are not friends yet, as Chatango searches usernames.
      var s0 = stateRef.current, q = String(f.query || '').toLowerCase();
      var list = Object.keys(s0.users).filter(function (n) { var u = s0.users[n]; return !u.friend && (!q || n.indexOf(q) >= 0) && (!f.online || u.status !== 'offline'); });
      update(function (d) { d.meet = { results: list, loading: false, error: null, done: true, filters: f }; });
    },
    deleteDm: function (name) { actions.closeDm(name); update(function (d) { d.dms[name].messages = []; }); },
    /**
     * Removes a PM from its conversation.
     * @param {string} name Correspondent.
     * @param {Object} m Removed message.
     */
    removeDmMessage: function (name, m) { dropDmMessage(name, m.id); },
    deleteAllDms: function () { update(function (d) { d.dms = {}; }); },
    /** Sample messages in the BetterChatango private history format with the ts key in seconds. */
    exportDms: function () {
      var s0 = stateRef.current, out = [];
      Object.keys(s0.dms).forEach(function (t) {
        var c = s0.dms[t];
        c.messages.forEach(function (m) {
          var ts = m.ts / 1000;
          out.push({ target: t, ts: ts, data: ['msg', m.author, s0.me, 'unknown', ts, 0, esc(m.text)].join(':'), unread: m.author !== s0.me && m.ts > c.lastReadTs ? 1 : 0 });
        });
      });
      return Promise.resolve(out.sort(function (a, b) { return a.ts - b.ts; }));
    },
    /**
     * Adds the valid records of a private history to the conversations like the live import.
     * @param {Array} records File content, untrusted.
     */
    importDms: function (records) {
      var s0 = stateRef.current, screened = screenPmRecords(records, s0.me), keys = {}, added = [];
      Object.keys(s0.dms).forEach(function (t) { s0.dms[t].messages.forEach(function (m) { keys[m.ts / 1000] = true; }); });
      screened.valid.forEach(function (r) { if (!keys[r.ts]) { keys[r.ts] = true; added.push(r); } });
      update(function (d) {
        added.forEach(function (r) {
          var t = lower(r.target), c = d.dms[t] || (d.dms[t] = { messages: [], unread: 0, lastReadTs: Date.now() });
          c.messages.push(pmMessage(pmRecordEntry(r)));
          c.messages.sort(function (a, b) { return a.ts - b.ts; });
          trimThread(c);
        });
      });
      return Promise.resolve({ added: added.length, saved: screened.valid.length - added.length, skipped: screened.skipped, foreign: screened.foreign });
    },
    toggleUser: function (name, key) {
      var was = !!userOf(stateRef.current, name)[key];
      update(function (d) { if (!d.users[name]) d.users[name] = { status: 'offline', about: '', style: {} }; d.users[name][key] = !was; });
      if (key === 'friend' && !was) return;
      toast(toggleUserText(shownName(stateRef.current, name), key, was), { tone: 'success', action: { label: 'Undo', run: function () { update(function (d) { d.users[name][key] = was; }); } } });
    },
    toggleMute: function (gid) { update(function (d) { d.groups[gid].muted = !d.groups[gid].muted; }); },
    toggleFavorite: function (gid) { update(function (d) { d.groups[gid].favorite = !d.groups[gid].favorite; }); },
    /**
     * Adds a trusted host without duplicates or removes it.
     * @param {string} host Lowercase host without scheme or path.
     * @param {boolean} on True to add it.
     * @returns {boolean} True if the list is saved.
     */
    setTrustedHost: function (host, on) {
      update(function (d) { var l = d.prefs.safety.trustedHosts, i = l.indexOf(host); if (!on && i >= 0) l.splice(i, 1); else if (on && i < 0) l.push(host); });
      return true;
    },
    joinGroup: function (gid) {
      var me = stateRef.current.me;
      update(function (d) {
        var g = d.groups[gid];
        if (!g.joined) { g.joined = true; if (g.members.indexOf(me) < 0) g.members.push(me); }
      });
      nav({ view: 'group', id: gid });
    },
    leaveGroup: function (gid) {
      var me = stateRef.current.me;
      update(function (d) { var g = d.groups[gid]; g.joined = false; g.favorite = false; g.members = g.members.filter(function (n) { return n !== me; }); dropMentions(d, gid, null); });
      var next = Object.keys(stateRef.current.groups).filter(function (k) { return k !== gid && stateRef.current.groups[k].joined; })[0];
      nav(next ? { view: 'group', id: next } : { view: 'discover' });
    },
    createGroup: function (name, title, desc) {
      var me = stateRef.current.me, now = Date.now();
      update(function (d) {
        var staff = {}; staff[me] = 'owner';
        d.groups[name] = {
          id: name, title: title, topic: desc || title, joined: true, favorite: false, muted: false, hiddenChannels: [], sendChannel: 'none', accent: null, unread: 0, mentions: 0, lastReadTs: now,
          members: [me], guests: 0, closed: false, dismissedAnnouncement: false, bans: [],
          settings: mkSettings({ overview: { title: title, description: desc }, staff: staff }),
          audit: [{ id: uid(), at: now, actor: me, text: 'Created the group' }],
          messages: [{ id: uid(), kind: 'system', text: 'You created #' + name + '. Share ' + name + '.chatango.com to invite people.', ts: now }]
        };
      });
      nav({ view: 'group', id: name });
      return true;
    },
    editMessage: function (gid, m, text) {
      update(function (d) { var g = d.groups[gid]; g.messages.forEach(function (o) { if (o.id === m.id) applyGroupEdit(o, { id: uid(), text: text, embeds: o.embeds }); }); });
      return true;
    },
    deleteMessage: function (gid, mid) {
      var me = stateRef.current.me, author = null;
      update(function (d) {
        var g = d.groups[gid];
        g.messages.forEach(function (m) { if (m.id === mid) { m.deleted = { by: me }; author = m.author; } });
        if (author && author !== me) g.audit.push({ id: uid(), at: Date.now(), actor: me, text: 'Deleted a message from ' + author });
        dropMentions(d, gid, [mid]);
      });
      toast('Message deleted.', { tone: 'success' });
    },
    ban: function (gid, name) {
      var me = stateRef.current.me, now = Date.now();
      update(function (d) {
        var g = d.groups[gid];
        g.bans.unshift({ name: name, by: me, at: now, ip: (40 + Math.floor(Math.random() * 180)) + '.' + Math.floor(Math.random() * 255) + '.x.x' });
        g.members = g.members.filter(function (n) { return n !== name; });
        if (g.settings.staff[name]) delete g.settings.staff[name];
        g.messages.push({ id: uid(), kind: 'ban', user: name, ts: now });
        g.audit.push({ id: uid(), at: now, actor: me, text: 'Banned ' + shownName(d, name) });
      });
      toast(shownName(stateRef.current, name) + ' was banned from #' + gid + '.', { tone: 'success', action: { label: 'Undo', run: function () { actions.unban(gid, name, true); } } });
    },
    unban: function (gid, name, quiet) {
      var me = stateRef.current.me;
      update(function (d) { var g = d.groups[gid]; g.bans = g.bans.filter(function (b) { return b.name !== name; }); g.audit.push({ id: uid(), at: Date.now(), actor: me, text: 'Unbanned ' + shownName(d, name) }); });
      if (!quiet) toast(shownName(stateRef.current, name) + ' can join #' + gid + ' again.', { tone: 'success' });
    },
    unbanAll: function (gid) {
      var me = stateRef.current.me, n = stateRef.current.groups[gid].bans.length;
      update(function (d) { var g = d.groups[gid]; g.bans = []; g.audit.push({ id: uid(), at: Date.now(), actor: me, text: 'Unbanned everyone (' + n + ')' }); });
    },
    setClosed: function (gid, closed) {
      var me = stateRef.current.me;
      update(function (d) {
        var g = d.groups[gid]; g.closed = closed;
        g.audit.push({ id: uid(), at: Date.now(), actor: me, text: closed ? 'Closed the group' : 'Reopened the group' });
        g.messages.push({ id: uid(), kind: 'system', text: closed ? me + ' closed the group. Nobody can post until it reopens.' : me + ' reopened the group.', ts: Date.now() });
      });
      toast(closed ? '#' + gid + ' is closed.' : '#' + gid + ' is open again.', { tone: 'success' });
    },
    saveGroupSettings: function (gid, draft) {
      var me = stateRef.current.me, old = stateRef.current.groups[gid].settings, now = Date.now();
      var labels = { announcement: 'Updated the announcement', automod: 'Changed AutoMod settings', media: 'Changed media and link rules' };
      update(function (d) {
        var g = d.groups[gid];
        Object.keys(labels).forEach(function (k) { if (JSON.stringify(old[k]) !== JSON.stringify(draft[k])) g.audit.push({ id: uid(), at: now, actor: me, text: labels[k] }); });
        Object.keys(Object.assign({}, old.staff, draft.staff)).forEach(function (n) {
          if (old.staff[n] !== draft.staff[n]) g.audit.push({ id: uid(), at: now, actor: me, text: draft.staff[n] ? 'Made ' + shownName(d, n) + ' ' + ROLE_LONG[draft.staff[n]].toLowerCase() : 'Removed ' + shownName(d, n) + ' from staff' });
          // Like the Chatango log (emod): permissions changed without a role change.
          else if (draft.staff[n] && old.modFlags[n] !== draft.modFlags[n]) g.audit.push({ id: uid(), at: now, actor: me, text: "Changed " + shownName(d, n) + "'s permissions" });
        });
        if (old.announcement.text !== draft.announcement.text || (!old.announcement.enabled && draft.announcement.enabled)) g.dismissedAnnouncement = false;
        g.settings = JSON.parse(JSON.stringify(draft));
      });
      toast('Changes to #' + gid + ' saved.', { tone: 'success' });
    }
  };
}
/**
 * Puts the sample world of the prototype into the state with its mentions recorded like those of the live history.
 * @param {Object} d State being modified.
 * @param {Object} world Sample world.
 */
function seedState(d, world) {
  Object.assign(d, world);
  Object.keys(d.groups).forEach(function (gid) { d.groups[gid].messages.forEach(function (m) { logMention(d, gid, m); }); });
}
