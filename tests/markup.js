// Barre de mise en forme du profil : balises posées autour de la sélection et fusion des attributs de <font>.
const vm = require('vm');
const { concatSources } = require('../scripts/build.mjs');

const ROOT = process.argv[2];
const ctx = {};
vm.createContext(ctx);
vm.runInContext(concatSources(ROOT, ['settings/markup-toolbar.js']), ctx);

let failed = 0;
/**
 * Permet d'appliquer une édition comme la textarea et de comparer texte et sélection.
 * @param {string} name Nom du cas.
 * @param {string} value Texte du champ.
 * @param {string} selected Texte sélectionné, repéré par sa première occurrence après skip caractères.
 * @param {Function} make Calcule l'édition à partir de (value, start, end).
 * @param {string} want Texte attendu.
 * @param {string} wantSel Sélection attendue.
 * @param {number} [skip] Position à partir de laquelle chercher la sélection.
 */
function check(name, value, selected, make, want, wantSel, skip) {
  let got, sel;
  try {
    const start = value.indexOf(selected, skip || 0), end = start + selected.length;
    const e = make(value, start, end);
    got = value.slice(0, e.from) + e.text + value.slice(e.to);
    sel = got.slice(e.selStart, e.selEnd);
  } catch (err) { got = 'CRASH ' + err.message; }
  const ok = got === want && sel === wantSel;
  if (!ok) failed++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : ' ' + JSON.stringify({ got, sel, want, wantSel })));
}
const font = (name, val) => (value, start, end) => ctx.fontMarkup(value, start, end, name, val);
const bold = (value, start, end) => ctx.wrapMarkup(value, start, end, '<b>', '</b>');

check('wraps the selection', 'hello world', 'world', bold, 'hello <b>world</b>', 'world');
check('unwraps the same tag', 'hello <b>world</b>', 'world', bold, 'hello world', 'world');
check('new font tag', 'hello world', 'world', font('color', '#ff0000'), 'hello <font color="#ff0000">world</font>', 'world');
check('adds face to the color tag', '<font color="#ff0000">moon</font>', 'moon', font('face', 'Georgia'), '<font color="#ff0000" face="Georgia">moon</font>', 'moon');
check('replaces the color', '<font color="#ff0000" face="Georgia">moon</font>', 'moon', font('color', '#00ff00'), '<font color="#00ff00" face="Georgia">moon</font>', 'moon');
check('same value removes the attribute', '<font color="#ff0000" face="Georgia">moon</font>', 'moon', font('color', '#ff0000'), '<font face="Georgia">moon</font>', 'moon');
check('last attribute removes the tag', 'a <font size="5">moon</font> b', 'moon', font('size', '5'), 'a moon b', 'moon');
check('merges upper case tags', '<FONT COLOR="#ff0000">moon</FONT>', 'moon', font('size', '2'), '<font color="#ff0000" size="2">moon</font>', 'moon');
check('merges around an empty selection', '<font color="#ff0000"></font>', '', font('face', 'Impact'), '<font color="#ff0000" face="Impact"></font>', '', 22);
check('nests when the tag has another attribute', '<font color="#ff0000" style="x">moon</font>', 'moon', font('face', 'Georgia'), '<font color="#ff0000" style="x"><font face="Georgia">moon</font></font>', 'moon');
check('nests when the tag goes on after the selection', '<font color="#ff0000">moon and stars</font>', 'moon', font('face', 'Georgia'), '<font color="#ff0000"><font face="Georgia">moon</font> and stars</font>', 'moon');
check('nests when the selection holds a font tag', '<font color="#ff0000">a<font size="2">b</font></font>', 'a<font size="2">b', font('face', 'Georgia'), '<font color="#ff0000"><font face="Georgia">a<font size="2">b</font></font></font>', 'a<font size="2">b');
console.log('ERRORS: ' + (failed ? failed + ' failed' : 'none'));
process.exit(failed ? 1 : 0);
