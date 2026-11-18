// Release rules of both CI: the version of the userscript, what a branch publishes, the notes of a release, and the GitLab release.
// One release per @version: a push without a version bump publishes nothing. The beta branch publishes betas only.
// Commands: check <branch> refuses a beta for main, plan <branch> writes the GitHub outputs publish, tag and prerelease,
// notes prints the notes of @version, gitlab publishes the GitLab release with the CI job token only.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseChangelog } from './changelog.mjs';

const FILES = ['nightango.min.user.js', 'nightango.user.js', 'SHA256SUMS'];

/**
 * Reads the @version of the userscript header.
 * @param {string} loader Content of src/loader/skin-loader.js.
 * @returns {string} Version as written or an empty string.
 */
export function versionOf(loader) {
  return (/^\/\/ @version\s+(\S+)/m.exec(loader) || [])[1] || '';
}

/**
 * Decides what the release job does with a version on a branch.
 * @param {string} version Version read from the userscript header.
 * @param {string} branch Branch of the pipeline.
 * @returns {{publish: boolean, why: string, tag: string, prerelease: boolean}} Whether a release is due and why not otherwise, its tag, and whether it is a beta.
 */
export function releasePlan(version, branch) {
  if (!/^\d+\.\d+\.\d+(-beta\.\d+)?$/.test(version)) throw new Error(`Invalid @version '${version}' in src/loader/skin-loader.js.`);
  const beta = version.includes('-beta.'), tag = `v${version}`;
  if (branch === 'beta' && !beta) return { publish: false, why: `@version ${version} is not a beta, nothing to publish from beta.`, tag, prerelease: false };
  if (branch === 'main' && beta) throw new Error('main publishes stable releases only: set @version to X.Y.Z in src/loader/skin-loader.js.');
  return { publish: true, why: '', tag, prerelease: beta };
}

/**
 * Writes the release notes of a version from its CHANGELOG.md section.
 * @param {string} changelog Content of CHANGELOG.md.
 * @param {string} version Version without its v.
 */
export function notesOf(changelog, version) {
  const release = parseChangelog(changelog).find((r) => r.version === version);
  if (!release) throw new Error(`CHANGELOG.md has no section for ${version}.`);
  return release.groups.map((g) => `### ${g.title}\n\n${g.items.map((i) => `- ${i}`).join('\n')}`).join('\n\n');
}

/**
 * Reads the @version of src/loader/skin-loader.js.
 */
export function currentVersion() {
  return versionOf(readFileSync('src/loader/skin-loader.js', 'utf8'));
}

/**
 * Returns a CI variable of the release job.
 * @param {string} name Variable name.
 */
function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: run this script from the GitLab release job.`);
  return value;
}

/**
 * Publishes the GitLab release of the current @version unless it exists or is not due.
 */
async function gitlabRelease() {
  const API = `${env('CI_API_V4_URL')}/projects/${env('CI_PROJECT_ID')}`;
  const AUTH = { 'JOB-TOKEN': env('CI_JOB_TOKEN') };
  const api = (path, init = {}) => fetch(API + path, { ...init, headers: { ...AUTH, ...init.headers } });

  const version = currentVersion();
  const plan = releasePlan(version, env('CI_COMMIT_BRANCH'));
  if (!plan.publish) {
    console.log(plan.why);
    return;
  }

  const tag = plan.tag;
  const existing = await api(`/releases/${encodeURIComponent(tag)}`);
  if (existing.ok) {
    console.log(`Release ${tag} already exists, nothing to publish.`);
    return;
  }
  if (existing.status !== 404) throw new Error(`Reading release ${tag} failed: HTTP ${existing.status}.`);

  // The files go to the generic package registry, where the release links to them: a public project serves them without sign-in.
  const links = [];
  for (const file of FILES) {
    const url = `${API}/packages/generic/nightango/${version}/${file}`;
    const put = await fetch(url, { method: 'PUT', headers: AUTH, body: readFileSync(`dist/${file}`) });
    if (!put.ok) throw new Error(`Uploading ${file} failed: HTTP ${put.status}.`);
    links.push({ name: file, url, direct_asset_path: `/${file}`, link_type: 'package' });
  }

  const created = await api('/releases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: tag, tag_name: tag, ref: env('CI_COMMIT_SHA'), description: notesOf(readFileSync('CHANGELOG.md', 'utf8'), version), assets: { links } })
  });
  if (!created.ok) throw new Error(`Creating release ${tag} failed: HTTP ${created.status} ${await created.text()}`);
  console.log(`Published ${tag}.`);
}

const COMMANDS = {
  // Before the tests: a beta never reaches main, even through a pull or merge request.
  check: (branch) => { releasePlan(currentVersion(), branch); },
  plan: (branch) => {
    const plan = releasePlan(currentVersion(), branch);
    if (!plan.publish) console.error(plan.why);
    console.log(`publish=${plan.publish}\ntag=${plan.tag}\nprerelease=${plan.prerelease}`);
  },
  notes: () => { console.log(notesOf(readFileSync('CHANGELOG.md', 'utf8'), currentVersion())); },
  gitlab: gitlabRelease
};

/**
 * Runs the command named on the command line.
 * @param {string[]} args Command and its branch.
 */
async function main(args) {
  const command = COMMANDS[args[0]];
  if (!command) throw new Error(`Unknown command '${args[0]}': ${Object.keys(COMMANDS).join(', ')}.`);
  await command(args[1]);
}

// A failure must fail the job: the error is printed and the exit code set, as an uncaught top-level error did.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exit(1); });
