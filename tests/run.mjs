import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SUITES = ['smoke', 'live_ui', 'layers', 'pm', 'member_content', 'markup', 'loader', 'live_login', 'avatar', 'moon', 'check_ds', 'allowed_calls', 'perf'];
// Some suites exit with 0 despite a failure: only their output reports it.
const FAILURE = /^(FAIL|CRASH)|^ERRORS:(?! none$)/m;

/**
 * Runs a suite and judges its result.
 * @param {string} suite Test file name without extension.
 */
function run(suite) {
  const result = spawnSync(process.execPath, [join('tests', suite + '.js'), '.'], { cwd: ROOT, encoding: 'utf8' });
  const output = (result.stdout || '') + (result.stderr || '');
  process.stdout.write(`\n== ${suite}\n${output}`);
  const passed = result.status === 0 && !FAILURE.test(output);
  const steps = (output.match(/^ok\b/gm) || []).length;
  return { suite, passed, steps };
}

const requested = process.argv.slice(2);
const unknown = requested.filter((suite) => !SUITES.includes(suite));
if (unknown.length) {
  console.error(`Unknown suite: ${unknown.join(', ')}. Available: ${SUITES.join(', ')}.`);
  process.exit(1);
}
const results = (requested.length ? requested : SUITES).map(run);
console.log('\n== summary');
for (const r of results) console.log(`${r.passed ? 'pass' : 'FAIL'}  ${r.suite}${r.steps ? ` (${r.steps} ok)` : ''}`);
process.exit(results.every((r) => r.passed) ? 0 : 1);
