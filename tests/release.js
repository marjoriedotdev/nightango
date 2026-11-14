// Release decision of scripts/release.mjs and release notes read from CHANGELOG.md, without the network.
const { versionOf, releasePlan, notesOf } = require('../scripts/release.mjs');
const { parseChangelog } = require('../scripts/changelog.mjs');

const check = (c, msg, detail) => console.log((c ? 'ok  ' : 'FAIL') + ' ' + msg + (c || detail === undefined ? '' : ' ' + JSON.stringify(detail)));
/**
 * Runs a function and returns the message of the error it throws.
 * @param {Function} fn Function expected to throw.
 */
function thrown(fn) { try { fn(); return null; } catch (e) { return e.message; } }

/* @version of the header: the first line that starts with it, as written */
check(versionOf('// ==UserScript==\n// @name         Nightango\n// @version      0.34.1\n// @match x\n') === '0.34.1', 'version read from the userscript header');
check(versionOf('// no version here\nvar s = "// @version 9.9.9";\n') === '', 'no version outside a header line');

/* What each branch publishes: stable from main, betas from beta, nothing else */
const PLANS = [
  ['0.34.1', 'main', true],
  ['0.35.0-beta.2', 'beta', true],
  ['0.35.0', 'beta', false]
];
const plans = PLANS.map(([version, branch]) => [version, branch, releasePlan(version, branch).publish]);
check(JSON.stringify(plans) === JSON.stringify(PLANS), 'a stable version publishes from main, a beta from beta, a stable version on beta publishes nothing', plans);
check(/not a beta/.test(releasePlan('0.35.0', 'beta').why), 'a stable version on beta says why nothing is published');
check(/stable releases only/.test(thrown(() => releasePlan('0.35.0-beta.1', 'main')) || ''), 'a beta version on main is refused');
const BAD = ['', '0.34', 'v0.34.1', '0.34.1-rc.1', '0.34.1-beta', '0.34.1-beta.x', '1.2.3.4'];
const accepted = BAD.filter((v) => !/Invalid @version/.test(thrown(() => releasePlan(v, 'main')) || ''));
check(accepted.length === 0, 'a version of another shape is refused', accepted);

/* Release notes: the section of the version, its groups in order */
const LOG = '# Changelog\n\n## [0.2.0] - 2026-01-02\n\n### Added\n\n- New thing.\n- Other thing.\n\n### Fixed\n\n- A bug.\n\n## [0.1.0] - 2026-01-01\n\n### Added\n\n- First.\n';
check(notesOf(LOG, '0.2.0') === '### Added\n\n- New thing.\n- Other thing.\n\n### Fixed\n\n- A bug.', 'notes of a version built from its section', notesOf(LOG, '0.2.0'));
check(/no section for 0.3.0/.test(thrown(() => notesOf(LOG, '0.3.0')) || ''), 'a version without a section is refused');

/* CHANGELOG.md format: what the build and the release refuse */
const REFUSED = {
  'unknown change type': '## [0.1.0] - 2026-01-01\n\n### Improved\n\n- x\n',
  'item outside a change type': '## [0.1.0] - 2026-01-01\n\n- x\n',
  'expected a': '## [0.1.0] - 2026-01-01\n\nSome prose.\n',
  'empty section': '## [0.1.0] - 2026-01-01\n\n### Added\n'
};
const misses = Object.keys(REFUSED).filter((why) => !(thrown(() => parseChangelog(REFUSED[why])) || '').includes(why));
check(misses.length === 0, 'a malformed CHANGELOG.md is refused with its reason', misses);
check(parseChangelog(LOG).map((r) => r.version).join() === '0.2.0,0.1.0', 'releases read newest first');
