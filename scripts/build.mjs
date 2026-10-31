import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transform } from 'esbuild';

// -- Sources ------------------------------------------------------------------

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// Order matters: the files share the single scope of the application IIFE.
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
  'views/season.js',
  'views/shell.js',
  'views/group.js',
  'views/message.js',
  'views/message-log.js',
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
  'settings/markup-toolbar.js',
  'settings/profile.js',
  'settings/appearance.js',
  'settings/notifications.js',
  'settings/privacy.js',
  'settings/language-a11y-about.js',
  'settings/group-view.js',
  'settings/group-pages.js',
  'settings/group-staff.js',
  'settings/live-group-view.js',
  'settings/live-group-pages.js',
  'settings/live-group-staff.js',
  'settings/avatar-crop.js',
  'settings/live-account.js',
  'app/sound.js',
  'app/state.js',
  'app/live-state.js',
  'app/pm.js',
  'app/root.js',
  'app/start.js'
];

/**
 * Lists the sources of a layer.
 * @param {string} layer Folder of src.
 */
export function layerSources(layer) {
  return APP_SOURCES.filter((file) => file.startsWith(layer + '/'));
}

/**
 * Concatenates application sources.
 * @param {string} root Repository root.
 * @param {string[]} files Paths relative to src.
 */
export function concatSources(root, files) {
  return files.map((file) => readFileSync(join(root, 'src', file), 'utf8')).join('\n');
}

// -- Release notes ------------------------------------------------------------

const CHANGE_TYPES = new Set(['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']);

/**
 * Reads the release notes of CHANGELOG.md newest first.
 * @param {string} text Content of CHANGELOG.md.
 */
function parseChangelog(text) {
  const releases = [];
  let release = null, group = null;
  text.split(/\r?\n/).forEach((line, i) => {
    const fail = (why) => { throw new Error(`CHANGELOG.md:${i + 1}: ${why}`); };
    let m;
    if ((m = /^## \[(\d+\.\d+\.\d+(?:-beta\.\d+)?)\] - (\d{4}-\d{2}-\d{2})$/.exec(line))) {
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
      fail('expected a "## [x.y.z] - YYYY-MM-DD" or "## [x.y.z-beta.n] - YYYY-MM-DD" heading, a "### Type" heading or a "- " item.');
    }
  });
  for (const r of releases) {
    if (!r.groups.length || r.groups.some((g) => !g.items.length)) throw new Error(`CHANGELOG.md: release ${r.version} has an empty section.`);
  }
  return releases;
}

// -- Design system tokens -----------------------------------------------------

const OVERRIDE = new Set(['accent-text', 'accent-soft', 'focus-ring']);
const ACCENT_DEFAULTS = '--accent-text-d: #f27a3f; --accent-text-l: #964c27; ' +
  '--accent-soft-d: rgba(242, 122, 63, 0.12); --accent-soft-l: rgba(242, 122, 63, 0.14);';

/**
 * Declares the variables of a theme.
 * @param {object} tokens Content of tokens.json.
 * @param {string} theme dark or light.
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
 * Declares the tokens under a root with dark first.
 * @param {object} tokens Content of tokens.json.
 * @param {string} root Selector that holds the tokens.
 * @param {string} auto Selector that follows the system light theme.
 * @param {string} light Selector of the chosen light theme.
 * @param {string} dark Selector of the chosen dark theme.
 */
function themeRules(tokens, root, auto, light, dark) {
  const statics = [];
  for (const family of ['spacing', 'radius', 'size', 'motion']) for (const t of tokens[family].tokens) statics.push(`--${t.name}: ${t.value};`);
  for (const [key, stack] of Object.entries(tokens.type.families)) statics.push(`--font-${key}: ${stack};`);
  return `${root} { color-scheme: dark; ${ACCENT_DEFAULTS} ${statics.join(' ')} ${themeBlock(tokens, 'dark')} }\n` +
    `@media (prefers-color-scheme: light) { ${auto} { color-scheme: light; ${themeBlock(tokens, 'light')} } }\n` +
    `${light} { color-scheme: light; ${themeBlock(tokens, 'light')} }\n` +
    `${dark} { color-scheme: dark; ${themeBlock(tokens, 'dark')} }\n`;
}

/**
 * Declares the tokens of each season under its class on the root.
 * @param {object} tokens Content of tokens.json.
 */
function seasonRules(tokens) {
  return tokens.color.seasons.map((season) => {
    const block = (theme) => season.tokens.map((t) => `--${t.name}: ${t.value[theme]};`).join(' ');
    const root = `:root.season-${season.id}`;
    return `${root} { ${block('dark')} }\n` +
      `@media (prefers-color-scheme: light) { ${root}:not([data-theme="dark"]) { ${block('light')} } }\n` +
      `${root}[data-theme="light"] { ${block('light')} }\n`;
  }).join('');
}

/**
 * Produces the token stylesheet.
 * @param {object} tokens Content of tokens.json.
 */
function tokensCss(tokens) {
  // Seasons come last: their rules must win over the base theme rules of the same specificity.
  return '/* Torch tokens, dark first: generated from the Torch design system */\n' +
    themeRules(tokens, ':root', ':root:not([data-theme="dark"])', ':root[data-theme="light"]', ':root[data-theme="dark"]') +
    seasonRules(tokens);
}

/**
 * Produces the stylesheet of the BetterChatango sign-in screen.
 * @param {object} tokens Content of tokens.json.
 * @param {string} login Sign-in screen rules.
 */
function loginCss(tokens, login) {
  const chosen = (theme) => `body:has(> #torch-skin[data-theme="${theme}"]) > .login`;
  const css = themeRules(tokens, '.login', '.login', chosen('light'), chosen('dark')) + login;
  // This stylesheet sits next to the password field: it must load nothing.
  if (/url\(|@import/i.test(css)) throw new Error('The sign-in screen stylesheet must not load a resource.');
  return css;
}

// -- Fonts --------------------------------------------------------------------

const FONTS_DIR = join(ROOT, 'torchds', 'project', 'fonts');

/**
 * Produces the font stylesheet with the embedded files.
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
 * Writes a JSON string literal limited to ASCII.
 * @param {string} text Text to encode.
 */
function jsonString(text) {
  // Every character outside printable ASCII becomes a \u sequence: U+2028 and U+2029 would break the injected literal.
  return '"' + text.replace(/[\\"]|[^ -~]/g, (c) => JSON_ESCAPES[c] ?? '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')) + '"';
}

/**
 * Adapts a stylesheet to the userscript Shadow DOM.
 * @param {string} tokens Token stylesheet.
 * @param {string} bundle Stylesheet of the design system components.
 * @param {string} app Application stylesheet.
 */
function skinCss(tokens, bundle, app) {
  const shadowTokens = SHADOW_SELECTORS.reduce((css, [from, to]) => css.replaceAll(from, () => to),
    tokens.replace(/:root\.(season-[\w-]+)([^\s{]*)/g, (_, season, rest) => `:host(.${season}${rest})`));
  const shadowApp = app
    .replace('html,body{height:100%}', () => ':host{display:block;height:100%}')
    .replace('body{background:var(--bg)', () => '#app{height:100%;background:var(--bg)')
    .replaceAll('.reduce-motion ', () => ':host(.reduce-motion) ')
    .replaceAll('.underline-links ', () => ':host(.underline-links) ')
    .replaceAll('.calm-sky ', () => ':host(.calm-sky) ')
    .replaceAll('.moon-south ', () => ':host(.moon-south) ');
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
 * Assembles the userscript.
 * @param {object} source Templates and content to insert.
 * @param {{ js: Function, css: Function }} pack Transform of the code and the stylesheets.
 */
async function userscript(source, pack) {
  const [css, fontsCss, loginStyles] = await Promise.all([pack.css(source.css), pack.css(source.fontsCss), pack.css(source.loginCss)]);
  // The page code becomes a string literal run by a <script> through textContent: never parsed as HTML.
  const page = await pack.js(source.page
    .replaceAll('/*CSS*/', () => jsonString(css))
    .replaceAll('/*FONTS_CSS*/', () => jsonString(fontsCss))
    .replaceAll('/*LOGIN_CSS*/', () => jsonString(loginStyles))
    .replaceAll('/*JOURNAL*/', () => source.journalJs)
    .replaceAll('/*BUNDLE*/', () => source.bundleJs)
    .replaceAll('/*APP*/', () => source.appJs));
  // Tampermonkey reads the header as is: it stays out of the transform.
  const header = /^[\s\S]*?\/\/ ==\/UserScript==\r?\n/.exec(source.loader)[0];
  const notice = `/*\nFonts embedded in this script: Geist, Geist Mono and Instrument Serif.\n\n${source.fontsLicense}*/\n`;
  return header + notice + await pack.js(source.loader.slice(header.length).replaceAll('/*PAGE*/', () => jsonString(page)));
}

// -- Build --------------------------------------------------------------------

/**
 * Reads a text file of the repository.
 * @param {...string} parts Path relative to the root.
 */
function read(...parts) {
  return readFileSync(join(ROOT, ...parts), 'utf8');
}

/**
 * Writes a deliverable into dist.
 * @param {string} name File name.
 * @param {string} content File content.
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

  const html = `<title>Nightango</title>
<style>
${fontsCss}
${css}
${bundleCss}
${appCss}
</style>
<div id="app"></div>
<noscript>Nightango needs JavaScript to run.</noscript>
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
    journalJs: read('src', 'loader', 'skin-journal.js'),
    css: skinCss(css, bundleCss, appCss),
    fontsCss,
    loginCss: loginCss(tokens, read('src', 'styles', 'login.css')),
    fontsLicense: read('torchds', 'project', 'fonts', 'OFL.txt'),
    bundleJs,
    appJs
  };

  mkdirSync(join(ROOT, 'dist'), { recursive: true });
  emit('nightango.html', html);
  emit('app.js', appJs);
  emit('nightango.user.js', await userscript(source, READABLE));
  emit('nightango.min.user.js', await userscript(source, MINIFIED));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) build();
