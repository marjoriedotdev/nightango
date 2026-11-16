import { spawn } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SUITES = ['smoke', 'live_ui', 'layers', 'pm', 'draft', 'member_content', 'markup', 'loader', 'live_login', 'avatar', 'moon', 'new_year', 'check_ds', 'allowed_calls', 'perf', 'voice', 'release'];
// Some suites exit with 0 despite a failure: only their output reports it.
const FAILURE = /^(FAIL|CRASH)|^ERRORS:(?! none$)/m;

/**
 * Runs a suite and judges its result.
 * @param {string} suite Test file name without extension.
 * @returns {Promise<{suite: string, passed: boolean, steps: number, output: string}>} Verdict and output of the suite.
 */
function run(suite) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join('tests', suite + '.js'), '.'], { cwd: ROOT });
    let stdout = '', stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const settle = (status, error) => {
      const output = stdout + stderr + error;
      const passed = status === 0 && !FAILURE.test(output);
      const steps = (output.match(/^ok\b/gm) || []).length;
      resolve({ suite, passed, steps, output });
    };
    child.on('error', (error) => settle(null, `CRASH ${error.message}\n`));
    child.on('close', (status) => settle(status, ''));
  });
}

/**
 * Runs suites side by side and returns their results in the order given.
 * @param {string[]} suites Suites to run.
 * @param {number} limit Number of suites running at the same time.
 * @returns {Promise<object>[]} One promise of a result per suite.
 */
function runAll(suites, limit) {
  let next = 0;
  const starts = suites.map(() => Promise.withResolvers());
  const worker = async () => {
    while (next < suites.length) {
      const index = next++;
      starts[index].resolve(await run(suites[index]));
    }
  };
  for (let i = 0; i < limit; i++) worker();
  return starts.map((start) => start.promise);
}

const requested = process.argv.slice(2);
const unknown = requested.filter((suite) => !SUITES.includes(suite));
if (unknown.length) {
  console.error(`Unknown suite: ${unknown.join(', ')}. Available: ${SUITES.join(', ')}.`);
  process.exit(1);
}
const results = [];
// The outputs are printed in the order of the list, whichever suite ends first.
for (const pending of runAll(requested.length ? requested : SUITES, availableParallelism())) {
  const result = await pending;
  process.stdout.write(`\n== ${result.suite}\n${result.output}`);
  results.push(result);
}
console.log('\n== summary');
for (const r of results) console.log(`${r.passed ? 'pass' : 'FAIL'}  ${r.suite}${r.steps ? ` (${r.steps} ok)` : ''}`);
process.exit(results.every((r) => r.passed) ? 0 : 1);
