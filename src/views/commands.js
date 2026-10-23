/* ---------- Commandes des composeurs ---------- */
// /background et /style de Torch restent des messages tant que #70 et #71 ne leur donnent pas d'équivalent.
var COMMANDS = {
  '/join': { usage: '/join <group>', text: 'Joins a group by its name.' },
  '/leave': { usage: '/leave [group]', text: 'Leaves a group. Without a name, leaves the open group.' },
  '/chat': { usage: '/chat [username]', text: 'Opens a private conversation. Without a name, opens Chats.' },
  '/help': { usage: '/help [command]', text: 'Lists the commands, or shows what one does.' }
};
function commandHelp(cmd) { return 'Usage: ' + COMMANDS[cmd].usage + '. ' + COMMANDS[cmd].text; }
function commandList() { return 'Commands: ' + Object.keys(COMMANDS).map(function (k) { return COMMANDS[k].usage; }).join(', ') + '.'; }

/**
 * Permet d'exécuter une commande tapée dans un composeur au lieu de l'envoyer.
 * @param {Object} app Contexte de l'application.
 * @param {string} text Texte du composeur.
 * @param {?string} gid Groupe ouvert, null dans un MP.
 * @returns {boolean} Vrai si le texte était une commande, qui n'est alors pas envoyée.
 */
function runCommand(app, text, gid) {
  var words = text.split(/\s+/), cmd = words[0].toLowerCase(), arg = (words[1] || '').toLowerCase();
  // Propriétés propres seulement : un message « constructor » trouverait sinon celle d'Object.
  if (!Object.prototype.hasOwnProperty.call(COMMANDS, cmd)) return false;
  var s = app.state, toast = app.ui.toast;
  if (cmd === '/join') {
    var id = parseGroupName(arg), unknown = id && unknownGroupError(s, id);
    if (!id) toast(commandHelp(cmd), { icon: 'info' });
    else if (unknown) toast(unknown);
    else app.actions.joinGroup(id);
  } else if (cmd === '/leave') {
    var target = arg ? parseGroupName(arg) : gid;
    if (!target) toast(commandHelp(cmd), { icon: 'info' });
    else if (!(s.groups[target] && s.groups[target].joined)) toast("You haven't joined #" + target + '.');
    else confirmLeave(app, target);
  } else if (cmd === '/chat') {
    var invalid = arg && dmNameError(s, arg);
    if (invalid) toast(invalid);
    else if (arg) app.actions.openDm(arg);
    else app.nav({ view: 'dm', id: null });
  } else {
    var asked = arg && '/' + arg.replace(/^\//, '');
    if (!asked) toast(commandList(), { icon: 'info' });
    else if (COMMANDS[asked]) toast(commandHelp(asked), { icon: 'info' });
    else toast('No command named ' + asked + '. ' + commandList());
  }
  return true;
}
