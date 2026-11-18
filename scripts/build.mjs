import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build as esbuild, transform } from 'esbuild';
import { parseChangelog } from './changelog.mjs';
import { versionOf } from './release.mjs';
import { unimportedReads } from './imports.mjs';

// -- Sources ------------------------------------------------------------------

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// Modules the build provides, by name: each export with its value, from the version and the release notes.
const BUILD_MODULES = {
  'build:info': (info) => ({ APP_VERSION: info.version, RELEASE_NOTES: info.notes }),
  // Every color token of the design system by theme.
  'build:tokens': () => {
    const color = { dark: {}, light: {} };
    for (const t of designTokens().color.tokens) for (const theme of ['dark', 'light']) color[theme][t.name] = typeof t.value === 'object' ? t.value[theme] : t.value;
    return { COLOR: color };
  }
};

/**
 * Provides the modules of BUILD_MODULES to the bundle.
 * @param {{version: string, notes: object[]}} info Version and release notes.
 */
function buildModules(info) {
  return {
    name: 'build-modules',
    setup(build) {
      build.onResolve({ filter: /^build:/ }, (args) => ({ path: args.path, namespace: 'build-modules' }));
      build.onLoad({ filter: /.*/, namespace: 'build-modules' }, (args) => ({
        contents: Object.entries(BUILD_MODULES[args.path](info)).map(([name, value]) => `export var ${name} = ${JSON.stringify(value)};\n`).join(''),
        loader: 'js'
      }));
    }
  };
}

/**
 * Bundles application modules into ES5 code with one scope.
 * @param {object} input esbuild entry: entryPoints, or stdin with its resolveDir.
 * @param {{version: string, notes: object[]}} info Version and release notes for build:info.
 * @param {object} [options] Further esbuild options.
 * @returns {Promise<object>} esbuild result, the code in outputFiles[0].
 */
function bundle(input, info, options) {
  return esbuild(Object.assign({ bundle: true, format: 'esm', target: 'es5', charset: 'utf8', write: false, logLevel: 'silent', absWorkingDir: ROOT, plugins: [buildModules(info)] }, input, options));
}

/**
 * Bundles an application entry into the strict mode IIFE the pages run, once its imports are checked.
 * @param {string} entry Entry file relative to src.
 * @param {{version: string, notes: object[]}} info Version and release notes for build:info.
 */
async function appBundle(entry, info) {
  const result = await bundle({ entryPoints: [join(ROOT, 'src', entry)] }, info, { metafile: true });
  checkImports(result.metafile);
  return "(function () {\n'use strict';\n" + result.outputFiles[0].text + '\n})();\n';
}

/**
 * Bundles the modules a suite reads into an IIFE that exposes them under one global name.
 * @param {string} exports Code of the entry, export statements with paths relative to the repository root.
 * @param {string} [name] Global variable that receives the exports.
 */
export async function bundleForTest(exports, name) {
  const result = await bundle({ stdin: { contents: exports, resolveDir: ROOT, loader: 'js' } }, { version: '0.0.0-test', notes: [] },
    { format: 'iife', globalName: name || '__mod' });
  return result.outputFiles[0].text;
}

// -- Import graph -------------------------------------------------------------

// Imports only go down these layers (ADR-0017). views/ and settings/ are one layer: the screens.
const LAYER_RANK = { core: 0, bridge: 1, views: 2, settings: 2, app: 3 };
// Debt left by the migration to modules: each refactor removes its entries, any other module in a cycle fails the build.
const KNOWN_CYCLIC = new Set([
  'app/actions.js', 'app/inbox.js', 'app/live-ops.js', 'app/live-state.js', 'app/pm.js', 'app/reconnection.js', 'app/root.js',
  'settings/appearance.js', 'settings/group-pages.js', 'settings/group-staff.js', 'settings/group-view.js', 'settings/language-a11y-about.js',
  'settings/live-account.js', 'settings/live-group-pages.js', 'settings/live-group-staff.js', 'settings/live-group-view.js', 'settings/notifications.js',
  'settings/privacy.js', 'settings/profile.js', 'settings/shell.js',
  'views/commands.js', 'views/discover.js', 'views/dm.js', 'views/group.js', 'views/live-joined.js', 'views/meet.js', 'views/members.js', 'views/mentions.js',
  'views/message-style.js', 'views/message.js', 'views/pip.js', 'views/profile.js', 'views/shared-media.js', 'views/shell.js'
]);

/**
 * Refuses an import that goes up the layers, and a module in a cycle beyond the known debt.
 * @param {object} metafile esbuild metafile of an application entry.
 */
function checkImports(metafile) {
  const graph = new Map();
  for (const [path, input] of Object.entries(metafile.inputs)) {
    if (path.startsWith('src/')) graph.set(path.slice(4), input.imports.map((i) => i.path).filter((p) => p.startsWith('src/')).map((p) => p.slice(4)));
  }
  const rank = (file) => LAYER_RANK[file.split('/')[0]] ?? Infinity;
  const errors = [];
  for (const [file, imports] of graph) for (const target of imports) {
    if (rank(target) > rank(file)) errors.push(`${file} -> ${target} goes up the layers`);
  }
  const cyclic = new Set();
  for (const group of cycles(graph)) for (const file of group) {
    cyclic.add(file);
    if (!KNOWN_CYCLIC.has(file)) errors.push(`${file} is in an import cycle with ${group.filter((f) => f !== file).join(', ')}`);
  }
  // The debt only shrinks: an entry that no longer holds is removed with the change that fixed it.
  for (const file of KNOWN_CYCLIC) if (!cyclic.has(file)) errors.push(`${file} is in no cycle any more: remove it from KNOWN_CYCLIC`);
  if (errors.length) throw new Error('Import graph (ADR-0017):\n' + errors.join('\n'));
}

/**
 * Lists the groups of modules that import each other, directly or not.
 * @param {Map<string, string[]>} graph Imports of each module.
 */
function cycles(graph) {
  let next = 0;
  const index = new Map(), low = new Map(), stack = [], onStack = new Set(), groups = [];
  const visit = (v) => {
    index.set(v, next); low.set(v, next++); stack.push(v); onStack.add(v);
    for (const w of graph.get(v) || []) {
      if (!index.has(w)) { visit(w); low.set(v, Math.min(low.get(v), low.get(w))); } else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
    }
    if (low.get(v) !== index.get(v)) return;
    const group = [];
    let w;
    do { w = stack.pop(); onStack.delete(w); group.push(w); } while (w !== v);
    if (group.length > 1) groups.push(group);
  };
  for (const v of graph.keys()) if (!index.has(v)) visit(v);
  return groups;
}


// -- Design system tokens -----------------------------------------------------

const OVERRIDE = new Set(['accent-text', 'accent-soft', 'focus-ring']);

/**
 * Reads tokens.json.
 */
function designTokens() {
  return JSON.parse(readFileSync(join(ROOT, 'torchds', 'project', 'tokens.json'), 'utf8'));
}

/**
 * Declares the accent text and soft fill of each theme, which the root and an accent scope pick from (accentScope).
 * @param {object} tokens Content of tokens.json.
 */
function accentDefaults(tokens) {
  const value = (name) => tokens.color.tokens.find((t) => t.name === name).value;
  return `--accent-text-d: ${value('accent-text').dark}; --accent-text-l: ${value('accent-text').light}; ` +
    `--accent-soft-d: ${value('accent-soft').dark}; --accent-soft-l: ${value('accent-soft').light};`;
}

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
  for (const group of tokens.type.groups) for (const style of group.styles) statics.push(`--font-size-${style.name}: ${style.fontSize};`);
  return `${root} { color-scheme: dark; ${accentDefaults(tokens)} ${statics.join(' ')} ${themeBlock(tokens, 'dark')} }\n` +
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
 * Bundles code of the loader into an IIFE limited to ASCII, the values of define written in.
 * @param {object} input esbuild entry: entryPoints, or stdin with its resolveDir.
 * @param {Object<string, string>} define Identifier replaced by the JSON literal of its value.
 */
async function loaderBundle(input, define) {
  const result = await esbuild(Object.assign({ bundle: true, format: 'iife', target: 'es5', write: false, logLevel: 'silent', absWorkingDir: ROOT,
    // Every character outside printable ASCII becomes an escape: U+2028 and U+2029 would break the injected literal.
    charset: 'ascii', define: Object.fromEntries(Object.entries(define).map(([k, v]) => [k, JSON.stringify(v)])) }, input));
  return result.outputFiles[0].text;
}

const BOOT = '__TORCH_BOOT__();';

/**
 * Assembles the userscript.
 * @param {object} source Header and sandbox code, stylesheets and code to insert.
 * @param {{ js: Function, css: Function }} pack Transform of the code and the stylesheets.
 */
async function userscript(source, pack) {
  const [css, fontsCss, loginStyles] = await Promise.all([pack.css(source.css), pack.css(source.fontsCss), pack.css(source.loginCss)]);
  const shell = await loaderBundle({ entryPoints: [join(ROOT, 'src', 'loader', 'skin-page.js')] }, { __SKIN_CSS__: css, __FONTS_CSS__: fontsCss, __LOGIN_CSS__: loginStyles });
  if (shell.split(BOOT).length !== 2) throw new Error(`The page code must call ${BOOT} once, where the application starts.`);
  const page = await pack.js(shell.replace(BOOT, () => source.bundleJs + '\n' + source.appJs));
  // Tampermonkey reads the header as is: it stays out of the bundle.
  const header = /^[\s\S]*?\/\/ ==\/UserScript==\r?\n/.exec(source.loader)[0];
  const notice = `/*\nFonts embedded in this script: Geist, Geist Mono and Instrument Serif.\n\n${source.fontsLicense}*/\n`;
  // The page code becomes a string literal run by a <script> through textContent: never parsed as HTML.
  const sandbox = await loaderBundle({ stdin: { contents: source.loader.slice(header.length), resolveDir: join(ROOT, 'src', 'loader'), loader: 'js' } }, { __PAGE_CODE__: page });
  return header + notice + await pack.js(sandbox);
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
  const tokens = designTokens();
  const bundleJs = read('torchds', 'project', 'components', 'bundle.js');
  const bundleCss = read('torchds', 'project', 'components', 'bundle.css');
  const appCss = read('src', 'styles', 'app.css');
  const loader = read('src', 'loader', 'skin-loader.js');
  const version = versionOf(loader);
  const releaseNotes = parseChangelog(read('CHANGELOG.md'));
  if (releaseNotes[0]?.version !== version) throw new Error(`CHANGELOG.md must start with the notes of @version ${version}.`);
  const info = { version, notes: releaseNotes };
  // The hosted prototype hook hands the interface a state and reads it back: any script on st.chatango.com could define it, so only the hosted entry reads it.
  const [appJs, userscriptAppJs] = await Promise.all([appBundle('main-hosted.js', info), appBundle('main.js', info)]);
  const provided = Object.fromEntries(Object.entries(BUILD_MODULES).flatMap(([module, exportsOf]) => Object.keys(exportsOf(info)).map((name) => [name, module])));
  const unimported = await unimportedReads(join(ROOT, 'src'), provided);
  if (unimported.length) throw new Error('Each module imports what it reads (ADR-0017):\n' + unimported.join('\n'));
  for (const [name, src] of [['bundle', bundleJs], ['app', appJs], ['userscript app', userscriptAppJs]]) {
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
    css: skinCss(css, bundleCss, appCss),
    fontsCss,
    loginCss: loginCss(tokens, read('src', 'styles', 'login.css')),
    fontsLicense: read('torchds', 'project', 'fonts', 'OFL.txt'),
    bundleJs,
    appJs: userscriptAppJs
  };

  mkdirSync(join(ROOT, 'dist'), { recursive: true });
  emit('nightango.html', html);
  emit('app.js', appJs);
  emit('nightango.user.js', await userscript(source, READABLE));
  emit('nightango.min.user.js', await userscript(source, MINIFIED));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) build();
