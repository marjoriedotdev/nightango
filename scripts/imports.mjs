// Names each module of src/ reads without importing them (ADR-0017): bundled in one scope, such a read would reach another module's name by chance or fail at run time.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { transform } from 'esbuild';

// A / after one of these starts a regular expression, not a division.
const BEFORE_REGEX = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
const KEYWORDS_BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw', 'else', 'do']);
const IMPORT_LINE = /^import \{([^}]*)\} from '([^']+)';$/gm;

/**
 * Splits ES5 source into identifiers, punctuation and the spans that hold no code (strings, comments, regular expressions).
 * @param {string} code Source of a module.
 * @returns {Array<{kind: string, text: string, start: number}>} Tokens in order.
 */
function tokenize(code) {
  const out = [];
  let i = 0, last = null;
  const push = (kind, start, end) => {
    const t = { kind, text: code.slice(start, end), start };
    out.push(t);
    if (kind !== 'space' && kind !== 'skip') last = t;
  };
  while (i < code.length) {
    const c = code[i];
    if (/\s/.test(c)) { let j = i; while (j < code.length && /\s/.test(code[j])) j++; push('space', i, j); i = j; continue; }
    if (c === '/' && code[i + 1] === '/') { let j = code.indexOf('\n', i); if (j < 0) j = code.length; push('skip', i, j); i = j; continue; }
    if (c === '/' && code[i + 1] === '*') { const j = code.indexOf('*/', i + 2) + 2; push('skip', i, j); i = j; continue; }
    if (c === "'" || c === '"') { let j = i + 1; while (j < code.length && code[j] !== c) j += code[j] === '\\' ? 2 : 1; push('str', i, j + 1); i = j + 1; continue; }
    if (c === '/' && (!last || (last.kind === 'punct' && BEFORE_REGEX.has(last.text)) || (last.kind === 'id' && KEYWORDS_BEFORE_REGEX.has(last.text)))) {
      let j = i + 1, inClass = false;
      while (j < code.length) {
        const d = code[j];
        if (d === '\\') { j += 2; continue; }
        if (d === '[') inClass = true; else if (d === ']') inClass = false; else if (d === '/' && !inClass) break;
        j++;
      }
      j++;
      while (/[a-z]/i.test(code[j] || '')) j++;
      push('re', i, j); i = j; continue;
    }
    if (/[A-Za-z_$]/.test(c)) { let j = i; while (j < code.length && /[\w$]/.test(code[j])) j++; push('id', i, j); i = j; continue; }
    if (/[0-9]/.test(c)) { let j = i; while (j < code.length && /[\w.]/.test(code[j])) j++; push('num', i, j); i = j; continue; }
    push('punct', i, i + 1); i++;
  }
  return out;
}

/**
 * Lists the top-level names a module declares: var and function at column 0, exported or not.
 * @param {string} code Source of a module.
 */
function declaredNames(code) {
  const toks = tokenize(code), names = [];
  const next = (k) => toks.slice(k + 1).find((x) => x.kind !== 'space');
  for (let k = 0; k < toks.length; k++) {
    let t = toks[k];
    if (t.kind !== 'id' || !(t.start === 0 || code[t.start - 1] === '\n')) continue;
    if (t.text === 'export') { t = next(k); if (!t || t.kind !== 'id') continue; k = toks.indexOf(t); }
    if (t.text === 'function') { const n = next(k); if (n && n.kind === 'id') names.push(n.text); continue; }
    if (t.text !== 'var') continue;
    let depth = 0, expectName = true;
    for (let m = k + 1; m < toks.length; m++) {
      const x = toks[m];
      if (x.kind === 'space' || x.kind === 'skip') continue;
      if (x.kind === 'punct') {
        if ('([{'.includes(x.text)) depth++;
        else if (')]}'.includes(x.text)) depth--;
        else if (x.text === ',' && depth === 0) { expectName = true; continue; }
        else if (x.text === ';' && depth === 0) break;
      }
      if (expectName && depth === 0 && x.kind === 'id') names.push(x.text);
      expectName = false;
    }
  }
  return names;
}

/**
 * Lists the identifier tokens that may read a binding: neither a property after a dot nor a key of an object literal.
 * @param {Array} toks Tokens of a module.
 */
function readTokens(toks) {
  const code = toks.filter((t) => t.kind !== 'space' && t.kind !== 'skip');
  return code.filter((t, k) => {
    if (t.kind !== 'id') return false;
    const prev = code[k - 1], next = code[k + 1];
    if (prev && prev.text === '.') return false;
    return !(next && next.text === ':' && prev && (prev.text === '{' || prev.text === ','));
  });
}

/**
 * Lists every module of a source folder.
 * @param {string} dir Folder to walk.
 */
function modulesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? modulesIn(path) : path.endsWith('.js') ? [path] : [];
  });
}

/**
 * Lists the names that a module reads without importing them although another module, or a module of the build, declares them.
 * esbuild minifies a copy of each module where every such name is marked: a local variable of the same name is renamed, a read keeps its mark.
 * @param {string} src Source folder of the application.
 * @param {Object<string, string>} provided Names exported by the modules of the build, with their module.
 * @returns {Promise<string[]>} One line per unimported read: module, name and the module that declares it.
 */
export async function unimportedReads(src, provided) {
  const files = modulesIn(src).map((path) => {
    const raw = readFileSync(path, 'utf8');
    const imported = new Set([...raw.matchAll(IMPORT_LINE)].flatMap((m) => m[1].split(',').map((n) => n.trim())));
    return { file: relative(src, path), code: raw.replace(IMPORT_LINE, ''), imported };
  });
  const owner = new Map(Object.entries(provided));
  for (const f of files) for (const name of declaredNames(f.code)) owner.set(name, f.file);
  const lines = [];
  for (const f of files) {
    const toks = tokenize(f.code), reads = new Set(readTokens(toks));
    const marked = toks.map((t) => (reads.has(t) && owner.has(t.text) && owner.get(t.text) !== f.file ? `__READ_${t.text}__` : t.text)).join('');
    const { code } = await transform(marked.replace(/^export /gm, ''), { loader: 'js', minifyIdentifiers: true });
    const missing = new Set([...code.matchAll(/__READ_([A-Za-z_$][\w$]*?)__/g)].map((m) => m[1]).filter((name) => !f.imported.has(name)));
    for (const name of missing) lines.push(`${f.file} reads ${name} from ${owner.get(name)} without importing it`);
  }
  return lines;
}
