import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transform } from 'esbuild';

// -- Sources ------------------------------------------------------------------

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// L'ordre compte : les fichiers partagent la portée unique de l'IIFE de l'application.
export const APP_SOURCES = [
  'core/globals.js',
  'core/util.js',
  'core/colors.js',
  'core/roles.js',
  'core/sample-data.js',
  'core/prefs.js',
  'core/ui.js',
  'core/rich-text.js',
  'core/selectors.js',
  'bridge/live-model.js',
  'bridge/live-parse.js',
  'bridge/live-bridge.js',
  'views/login.js',
  'views/shell.js',
  'views/group.js',
  'views/message.js',
  'views/members.js',
  'views/dm.js',
  'views/meet.js',
  'views/mentions.js',
  'views/profile.js',
  'views/new-dm.js',
  'views/message-style.js',
  'views/emoji-picker.js',
  'views/attach.js',
  'views/media.js',
  'views/commands.js',
  'views/discover.js',
  'views/palette.js',
  'views/live-joined.js',
  'views/session.js',
  'settings/shell.js',
  'settings/profile.js',
  'settings/appearance.js',
  'settings/notifications.js',
  'settings/privacy.js',
  'settings/language-a11y-about.js',
  'settings/premium.js',
  'settings/group-view.js',
  'settings/group-pages.js',
  'settings/group-staff.js',
  'settings/live-group-view.js',
  'settings/live-group-pages.js',
  'settings/live-group-staff.js',
  'settings/live-account.js',
  'app/sound.js',
  'app/state.js',
  'app/root.js',
  'app/start.js'
];

/**
 * Permet de lister les sources d'une couche.
 * @param {string} layer Dossier de src.
 */
export function layerSources(layer) {
  return APP_SOURCES.filter((file) => file.startsWith(layer + '/'));
}

/**
 * Permet de concaténer des sources de l'application.
 * @param {string} root Racine du dépôt.
 * @param {string[]} files Chemins relatifs à src.
 */
export function concatSources(root, files) {
  return files.map((file) => readFileSync(join(root, 'src', file), 'utf8')).join('\n');
}

// -- Notes de version ---------------------------------------------------------

const CHANGE_TYPES = new Set(['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']);

/**
 * Permet de lire les notes de version de CHANGELOG.md, la plus récente d'abord.
 * @param {string} text Contenu de CHANGELOG.md.
 */
function parseChangelog(text) {
  const releases = [];
  let release = null, group = null;
  text.split(/\r?\n/).forEach((line, i) => {
    const fail = (why) => { throw new Error(`CHANGELOG.md:${i + 1}: ${why}`); };
    let m;
    if ((m = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/.exec(line))) {
      release = { version: m[1], date: m[2], groups: [] };
      group = null;
      releases.push(release);
    } else if ((m = /^### (\w+)$/.exec(line))) {
      if (!release) fail('change type outside a release.');
      if (!CHANGE_TYPES.has(m[1])) fail(`unknown change type ${m[1]}.`);
      group = { title: m[1], items: [] };
      release.groups.push(group);
    } else if ((m = /^- (\S.*)$/.exec(line))) {
      if (group) group.items.push(m[1]);
      else if (release) fail('item outside a change type.');
    } else if (release && line.trim()) {
      fail('expected a "## [x.y.z] - YYYY-MM-DD" heading, a "### Type" heading or a "- " item.');
    }
  });
  for (const r of releases) {
    if (!r.groups.length || r.groups.some((g) => !g.items.length)) throw new Error(`CHANGELOG.md: release ${r.version} has an empty section.`);
  }
  return releases;
}

// -- Jetons du design system --------------------------------------------------

const OVERRIDE = new Set(['accent-text', 'accent-soft', 'focus-ring']);
const ACCENT_DEFAULTS = '--accent-text-d: #f27a3f; --accent-text-l: #964c27; ' +
  '--accent-soft-d: rgba(242, 122, 63, 0.12); --accent-soft-l: rgba(242, 122, 63, 0.14);';

/**
 * Permet de déclarer les variables d'un thème.
 * @param {object} tokens Contenu de tokens.json.
 * @param {string} theme dark ou light.
 */
function themeBlock(tokens, theme) {
  const valueOf = (v) => (typeof v === 'object' ? v[theme] : v);
  const lines = [];
  for (const t of tokens.color.tokens) if (!OVERRIDE.has(t.name)) lines.push(`--${t.name}: ${valueOf(t.value)};`);
  for (const t of tokens.shadow.tokens) lines.push(`--${t.name}: ${valueOf(t.value)};`);
  const suffix = theme === 'dark' ? 'd' : 'l';
  lines.push(`--accent-text: var(--accent-text-${suffix});`);
  lines.push(`--accent-soft: var(--accent-soft-${suffix});`);
  lines.push(`--focus-ring: var(--accent-text-${suffix});`);
  return lines.join(' ');
}

/**
 * Permet de déclarer les jetons sous une racine, sombre d'abord.
 * @param {object} tokens Contenu de tokens.json.
 * @param {string} root Sélecteur qui porte les jetons.
 * @param {string} auto Sélecteur qui suit le thème clair du système.
 * @param {string} light Sélecteur du thème clair choisi.
 * @param {string} dark Sélecteur du thème sombre choisi.
 */
function themeRules(tokens, root, auto, light, dark) {
  const statics = [];
  for (const family of ['spacing', 'radius', 'size']) for (const t of tokens[family].tokens) statics.push(`--${t.name}: ${t.value};`);
  for (const [key, stack] of Object.entries(tokens.type.families)) statics.push(`--font-${key}: ${stack};`);
  return `${root} { color-scheme: dark; ${ACCENT_DEFAULTS} ${statics.join(' ')} ${themeBlock(tokens, 'dark')} }\n` +
    `@media (prefers-color-scheme: light) { ${auto} { color-scheme: light; ${themeBlock(tokens, 'light')} } }\n` +
    `${light} { color-scheme: light; ${themeBlock(tokens, 'light')} }\n` +
    `${dark} { color-scheme: dark; ${themeBlock(tokens, 'dark')} }\n`;
}

/**
 * Permet de produire la feuille des jetons.
 * @param {object} tokens Contenu de tokens.json.
 */
function tokensCss(tokens) {
  return '/* Torch tokens, dark first: generated from the Torch design system */\n' +
    themeRules(tokens, ':root', ':root:not([data-theme="dark"])', ':root[data-theme="light"]', ':root[data-theme="dark"]');
}

/**
 * Permet de produire la feuille de l'écran de connexion de Torch.
 * @param {object} tokens Contenu de tokens.json.
 * @param {string} sheet Feuille login.css.
 */
function loginCss(tokens, sheet) {
  // Thème posé en classe sur <html> : Torch lit le premier [data-theme] du document pour le sien.
  return themeRules(tokens, '.login', 'html:not(.tsk-dark) .login', 'html.tsk-light .login', 'html.tsk-dark .login') + sheet;
}

// -- Polices ------------------------------------------------------------------

const FONTS_DIR = join(ROOT, 'torchds', 'project', 'fonts');

/**
 * Permet de produire la feuille des polices avec les fichiers embarqués.
 */
function embeddedFontsCss() {
  return readFileSync(join(FONTS_DIR, 'fonts.css'), 'utf8')
    .replace(/url\(([\w-]+\.woff2)\)/g, (_, file) => `url(data:font/woff2;base64,${readFileSync(join(FONTS_DIR, file)).toString('base64')})`);
}

// -- Userscript ---------------------------------------------------------------

const SHADOW_SELECTORS = [
  [':root[data-theme="light"]', ':host([data-theme="light"])'],
  [':root[data-theme="dark"]', ':host([data-theme="dark"])'],
  [':root:not([data-theme="dark"])', ':host(:not([data-theme="dark"]))'],
  [':root {', ':host {']
];
const JSON_ESCAPES = { '\\': '\\\\', '"': '\\"', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t' };

/**
 * Permet d'écrire un littéral de chaîne JSON limité à l'ASCII.
 * @param {string} text Texte à encoder.
 */
function jsonString(text) {
  // Tout caractère hors ASCII imprimable devient une séquence \u : U+2028 et U+2029 casseraient le littéral injecté.
  return '"' + text.replace(/[\\"]|[^ -~]/g, (c) => JSON_ESCAPES[c] ?? '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')) + '"';
}

/**
 * Permet d'adapter une feuille de style au Shadow DOM du userscript.
 * @param {string} tokens Feuille des jetons.
 * @param {string} bundle Feuille des composants du design system.
 * @param {string} app Feuille de l'application.
 */
function skinCss(tokens, bundle, app) {
  const shadowTokens = SHADOW_SELECTORS.reduce((css, [from, to]) => css.replaceAll(from, () => to), tokens);
  const shadowApp = app
    .replace('html,body{height:100%}', () => ':host{display:block;height:100%}')
    .replace('body{background:var(--bg)', () => '#app{height:100%;background:var(--bg)')
    .replaceAll('.reduce-motion ', () => ':host(.reduce-motion) ')
    .replaceAll('.underline-links ', () => ':host(.underline-links) ');
  const css = shadowTokens + '\n[hidden]{display:none!important}\n' + bundle + '\n' + shadowApp;
  if (css.includes(':root') || css.includes('html,body{')) throw new Error('Userscript CSS still targets the document root.');
  return css;
}

const READABLE = { js: (code) => code, css: (code) => code };
const MINIFIED = {
  js: async (code) => (await transform(code, { loader: 'js', target: 'es5', minify: true })).code,
  css: async (code) => (await transform(code, { loader: 'css', minify: true })).code
};

/**
 * Permet d'assembler le userscript.
 * @param {object} source Gabarits et contenus à insérer.
 * @param {{ js: Function, css: Function }} pack Transformation du code et des feuilles.
 */
async function userscript(source, pack) {
  const [css, loginCss, fontsCss] = await Promise.all([pack.css(source.css), pack.css(source.loginCss), pack.css(source.fontsCss)]);
  // Le code page devient un littéral de chaîne, exécuté par un <script> en textContent : jamais analysé comme HTML.
  const page = await pack.js(source.page
    .replaceAll('/*CSS*/', () => jsonString(css))
    .replaceAll('/*LOGIN_CSS*/', () => jsonString(loginCss))
    .replaceAll('/*FONTS_CSS*/', () => jsonString(fontsCss))
    .replaceAll('/*BUNDLE*/', () => source.bundleJs)
    .replaceAll('/*APP*/', () => source.appJs));
  // Tampermonkey lit l'en-tête tel quel : il reste hors de la transformation.
  const header = /^[\s\S]*?\/\/ ==\/UserScript==\r?\n/.exec(source.loader)[0];
  const notice = `/*\nFonts embedded in this script: Geist and Geist Mono.\n\n${source.fontsLicense}*/\n`;
  return header + notice + await pack.js(source.loader.slice(header.length).replaceAll('/*PAGE*/', () => jsonString(page)));
}

// -- Build --------------------------------------------------------------------

/**
 * Permet de lire un fichier texte du dépôt.
 * @param {...string} parts Chemin relatif à la racine.
 */
function read(...parts) {
  return readFileSync(join(ROOT, ...parts), 'utf8');
}

/**
 * Permet d'écrire un livrable dans dist.
 * @param {string} name Nom du fichier.
 * @param {string} content Contenu du fichier.
 */
function emit(name, content) {
  const path = join(ROOT, 'dist', name);
  writeFileSync(path, content);
  console.log(relative(ROOT, path), content.length);
}

async function build() {
  const tokens = JSON.parse(read('torchds', 'project', 'tokens.json'));
  const bundleJs = read('torchds', 'project', 'components', 'bundle.js');
  const bundleCss = read('torchds', 'project', 'components', 'bundle.css');
  const appCss = read('src', 'styles', 'app.css');
  const loader = read('src', 'loader', 'skin-loader.js');
  const version = /@version\s+(\S+)/.exec(loader)[1];
  const releaseNotes = parseChangelog(read('CHANGELOG.md'));
  if (releaseNotes[0]?.version !== version) throw new Error(`CHANGELOG.md must start with the notes of @version ${version}.`);
  const appJs = "(function () {\n'use strict';\n" +
    `var APP_VERSION = ${JSON.stringify(version)}, RELEASE_NOTES = ${JSON.stringify(releaseNotes)};\n` +
    concatSources(ROOT, APP_SOURCES) + '\n})();\n';
  for (const [name, src] of [['bundle', bundleJs], ['app', appJs]]) {
    if (src.toLowerCase().includes('</script')) throw new Error(`${name} contains </script`);
  }
  const css = tokensCss(tokens);
  const fontsCss = embeddedFontsCss();

  const html = `<title>Torch Client</title>
<style>
${fontsCss}
${css}
${bundleCss}
${appCss}
</style>
<div id="app"></div>
<noscript>Torch needs JavaScript to run.</noscript>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js" integrity="sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js" integrity="sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1" crossorigin="anonymous"></script>
<script>
${bundleJs}
</script>
<script>
${appJs}
</script>
`;

  const source = {
    loader,
    page: read('src', 'loader', 'skin-page.js'),
    css: skinCss(css, bundleCss, appCss),
    loginCss: loginCss(tokens, read('src', 'styles', 'login.css')),
    fontsCss,
    fontsLicense: read('torchds', 'project', 'fonts', 'OFL.txt'),
    bundleJs,
    appJs
  };

  mkdirSync(join(ROOT, 'dist'), { recursive: true });
  emit('torch-client.html', html);
  emit('app.js', appJs);
  emit('torch-skin.user.js', await userscript(source, READABLE));
  emit('torch-skin.min.user.js', await userscript(source, MINIFIED));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) build();
