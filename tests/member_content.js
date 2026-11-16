// Member content read by the bridge and the interface, on the sources of src/core/ and src/bridge/.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { concatSources, layerSources } = require('../scripts/build.mjs');

const ROOT = process.argv[2];
const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', url: 'https://st.chatango.com/' });
const w = dom.window;
// core evaluates with React and the Torch components, as in the app.
w.eval(fs.readFileSync('node_modules/react/umd/react.development.js', 'utf8'));
w.eval(fs.readFileSync('node_modules/react-dom/umd/react-dom.development.js', 'utf8'));
w.eval(fs.readFileSync(ROOT + '/torchds/project/components/bundle.js', 'utf8'));
w.eval(concatSources(ROOT, layerSources('core').concat(layerSources('bridge'))) + '; window.mod = { parseMiniCss: parseMiniCss, parseContent: parseContent, shownParts: shownParts, profileWords: profileWords, findFlagged: findFlagged };');
const m = w.mod;

const log = [];
function step(name, ok, detail) { log.push((ok ? 'ok   ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' ' + JSON.stringify(detail))); }
// Inputs far above the size cap of the Premium background file: a parse whose cost grows faster than its input runs past the budget.
const LARGE = 100000, BUDGET_MS = 1000;
const NO_STYLE = { bg: null, text: null, link: null, image: null, repeat: null };
/**
 * Runs a parse on a large input and keeps its duration and result.
 * @param {Function} parse Parse to run.
 */
function timed(parse) { const start = Date.now(), out = parse(); return { ms: Date.now() - start, out }; }

(async () => {
try {
  /* Premium background: results of valid and malformed files, guards included (ADR-0004) */
  const GODDESS = 'body { background-color: #9e9ffc; background-image: url(https://cdn.donmai.us/a.png); background-repeat: no-repeat; color: #666564; }\n.profile_text { color: #666564; }\na, a:visited, a:active { color: #5c8a8a; text-decoration: none; }\na:hover { color: #5c8a8a; text-decoration: underline; }\n';
  const CSS_CASES = [
    [GODDESS, { bg: '#9e9ffc', text: '#666564', link: '#5c8a8a', image: 'https://cdn.donmai.us/a.png', repeat: 'no-repeat' }],
    ["BODY{background:navy url('http://img.example/a.png') repeat-x;color:rgb(10, 20, 30) !important}\nA:hover{color:red}a{color:#FFF}", { bg: '#000080', text: '#0a141e', link: '#fff', image: 'https://img.example/a.png', repeat: 'repeat-x' }],
    ['/* head */ body { background-color: #abc !important; /* inline */ color: #def }', { bg: '#abc', text: '#def', link: null, image: null, repeat: null }],
    ['body { background: rgba(0, 0, 0, 0) url("https://img.example/b.png") } .profile_text { color: hsl(120, 100%, 25%) }', { bg: null, text: null, link: null, image: 'https://img.example/b.png', repeat: null }],
    ['__proto__ { color: red } constructor, body { __proto__: x; prototype: y; background-color: #010203 }', { bg: '#010203', text: null, link: null, image: null, repeat: null }],
    ['body { background-image: url("https://img.example/x y.png"); background-repeat: round; color: javascript }', NO_STYLE],
    ['body { color: #111 }\nbody { background-color: #222; background-repeat: REPEAT-Y }', { bg: '#222', text: '#111', link: null, image: null, repeat: 'repeat-y' }],
    ['body { background: url(https://img.example/c.png) #0f0 no-repeat fixed; }', { bg: '#0f0', text: null, link: null, image: 'https://img.example/c.png', repeat: 'no-repeat' }],
    ['} body { color: #333 } { color: #444 } a { color: #445 }', { bg: null, text: '#333', link: '#445', image: null, repeat: null }],
    ['a{b{c}body{color:#555}', { bg: null, text: '#555', link: null, image: null, repeat: null }],
    ['{body{color:#666}', { bg: null, text: '#666', link: null, image: null, repeat: null }],
    ['body { color: #777 } /* never closed body { color: #888 }', { bg: null, text: '#777', link: null, image: null, repeat: null }],
    ['body { color: #999 } a { color: #aaa', { bg: null, text: '#999', link: null, image: null, repeat: null }],
    ['/*/ body { color: #121212 } /*/ a { color: #343434 }', { bg: null, text: null, link: '#343434', image: null, repeat: null }],
    ['body,,a { color: #565656 } , { color: #787878 }', { bg: null, text: '#565656', link: '#565656', image: null, repeat: null }],
    ['', NO_STYLE],
    ['not css at all', NO_STYLE]
  ];
  const cssMisses = CSS_CASES.map(([css, want]) => ({ css, want, got: m.parseMiniCss(css) }))
    .filter(x => JSON.stringify(x.got) !== JSON.stringify(x.want));
  step('premium background: colors, image and repeat of valid files, guards on the others', cssMisses.length === 0, cssMisses);

  /* Premium background: one pass over a large file, whatever its braces and comments */
  const large = {
    noBraces: timed(() => m.parseMiniCss('a'.repeat(LARGE))),
    unclosedBrace: timed(() => m.parseMiniCss('body {' + 'a'.repeat(LARGE))),
    unclosedComments: timed(() => m.parseMiniCss('/*x'.repeat(LARGE / 3))),
    manyRules: timed(() => m.parseMiniCss('a { color: #111 }'.repeat(LARGE / 17) + 'body { color: #222 }'))
  };
  const slowCss = Object.keys(large).filter(k => large[k].ms > BUDGET_MS);
  step('premium background: large file read in one pass, braces closed or not',
    slowCss.length === 0 && ['noBraces', 'unclosedBrace', 'unclosedComments'].every(k => JSON.stringify(large[k].out) === JSON.stringify(NO_STYLE))
      && large.manyRules.out.text === '#222' && large.manyRules.out.link === '#111',
    { slow: slowCss, ms: Object.keys(large).map(k => [k, large[k].ms]), manyRules: large.manyRules.out });

  /* Message text: spaces trimmed at both ends of the shown text, never inside it */
  const parts = s => JSON.stringify(m.parseContent(s, false, false).parts);
  const image = text => ({ text, parts: null, embeds: [{ kind: 'image', url: 'https://i.example/a.png' }] });
  const trims = {
    edges: parts('  <b>x</b> y&nbsp;\t<br/> ') === JSON.stringify([{ text: 'x', b: true }, { text: ' y' }]),
    emptyEnds: parts('<u> </u><b>x</b>  <i> </i>') === JSON.stringify([{ text: 'x', b: true }]),
    lines: parts(' <s>a</s>\n\nb\n') === JSON.stringify([{ text: 'a', s: true }, { text: '\n\nb' }]),
    hiddenLink: JSON.stringify(m.shownParts(image('x  y https://i.example/a.png'))) === JSON.stringify([{ text: 'x  y' }]),
    hiddenLead: JSON.stringify(m.shownParts(image('https://i.example/a.png  tail\u00a0 '))) === JSON.stringify([{ text: 'tail' }])
  };
  step('message text: spaces trimmed at both ends only', Object.keys(trims).every(k => trims[k]), trims);

  /* Message text: one pass over a long run of spaces inside the text */
  const spaces = ' '.repeat(LARGE);
  const runs = {
    parts: timed(() => m.parseContent('<b>x</b>' + spaces + 'y', false, false).parts),
    shown: timed(() => m.shownParts(image('x' + spaces + 'y https://i.example/a.png')))
  };
  const slowText = Object.keys(runs).filter(k => runs[k].ms > BUDGET_MS);
  step('message text: long run of spaces trimmed in one pass',
    slowText.length === 0 && runs.parts.out.length === 2 && runs.parts.out[1].text === spaces + 'y' && runs.shown.out.length === 1 && runs.shown.out[0].text === 'x' + spaces + 'y',
    { slow: slowText, ms: Object.keys(runs).map(k => [k, runs[k].ms]) });

  /* Message tags: emoticon and image tags read as before, and a body of unclosed tags read in one pass */
  const read = s => { const c = m.parseContent(s, false, false); return [c.text, c.embeds.map(e => e.url)]; };
  const tags = {
    image: read('<i s="https://i.example/a.png" w="10" h="10"/>'),
    later: read('<i s=x1 s=https://i.example/b.png>'),
    first: read("<i s='https://i.example/c.png'>"),
    none: read('<i w="1">kept</i>')
  };
  const TAGS_WANT = { image: ['', ['https://i.example/a.png']], later: ['', ['https://i.example/b.png']], first: ['', ['https://i.example/c.png']], none: ['kept', []] };
  const emoticon = read('a <i s="sm://lol" w="14.52" h="14.52"/> b');
  const unclosed = timed(() => m.parseContent('<i s=a '.repeat(1200), false, false).text.length);
  step('message tags: emoticon and image tags read, a body of unclosed tags read in one pass',
    JSON.stringify(tags) === JSON.stringify(TAGS_WANT) && emoticon[0].indexOf('sm://') < 0 && emoticon[0] !== 'a  b' && !emoticon[1].length && unclosed.ms <= BUDGET_MS,
    { tags, emoticon, ms: unclosed.ms });

  /* Profile words refused by Chatango: the search splits refused groups until the words remain */
  const words = m.profileWords(['Paris', null, 'Twinkle, twinkle! <a href="https://x.example/twink">Star</a>', 'paris\nSTAR']);
  step('profile words: lowercase, split on spaces and punctuation, tags kept, no duplicates',
    JSON.stringify([...words]) === JSON.stringify(['paris', 'twinkle', 'a', 'href', 'https', 'x', 'example', 'twink', 'star']), [...words]);
  const filler = Array.from({ length: 120 }, (_, i) => 'word' + i);
  const pool = filler.slice(0, 40).concat('twinkle', filler.slice(40, 90), 'sexy', filler.slice(90), 'w'.repeat(80));
  const run = async (list, refuses, failAt) => {
    const asked = [];
    const ask = q => { asked.push(q); if (asked.length === failAt) return Promise.reject(new Error('overload')); return Promise.resolve(refuses.some(r => q.includes(r))); };
    try { return { found: [...await m.findFlagged(list, ask, 60)], asked }; } catch (e) { return { error: e.message, asked }; }
  };
  const two = await run(pool, ['twink', 'sex']);
  const clean = await run(pool, []);
  const none = await run([], ['twink']);
  const failed = await run(pool, ['twink'], 3);
  const cases = {
    found: JSON.stringify(two.found) === JSON.stringify(['twinkle', 'sexy']),
    fewQueries: two.asked.length < 40,
    maxChars: two.asked.concat(clean.asked).every(q => q.length <= 60 || q === 'w'.repeat(80)),
    everyWordAsked: pool.every(w => clean.asked.some(q => q.split(' ').includes(w))),
    cleanOnePass: clean.found.length === 0 && clean.asked.length === new Set(clean.asked).size,
    empty: none.found.length === 0 && none.asked.length === 0,
    stopsOnFailure: failed.error === 'overload' && failed.asked.length === 3
  };
  step('refused words: found by splitting refused groups, queries capped, stops on the first failure', Object.keys(cases).every(k => cases[k]),
    { cases, asked: two.asked.length, found: two.found });

  console.log(log.join('\n'));
  process.exit(0);
} catch (e) {
  console.log(log.join('\n'));
  console.log('CRASH', e.stack);
  process.exit(1);
}
})();
